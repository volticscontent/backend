/*
  Warnings:

  - You are about to drop the column `headId` on the `services` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('PENDING', 'ACTIVE', 'ERROR');

-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_headId_fkey";

-- AlterTable
ALTER TABLE "_AdminToService" ADD CONSTRAINT "_AdminToService_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AdminToService_AB_unique";

-- AlterTable
ALTER TABLE "services" DROP COLUMN "headId";

-- AlterTable
ALTER TABLE "tracking_sources" ADD COLUMN     "status" "SourceStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "seo_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "globalTitle" TEXT,
    "globalDescription" TEXT,
    "googleSearchConsoleId" TEXT,
    "googleAnalyticsId" TEXT,
    "targetKeywords" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "eventId" TEXT,
    "eventName" TEXT NOT NULL,
    "eventData" JSONB,
    "url" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_event_deliveries" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "datasetId" TEXT,
    "status" TEXT NOT NULL,
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_event_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_content_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_content_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_content_entries" (
    "id" TEXT NOT NULL,
    "contentTypeId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_content_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seo_settings_userId_key" ON "seo_settings"("userId");

-- CreateIndex
CREATE INDEX "tracking_events_datasetId_idx" ON "tracking_events"("datasetId");

-- CreateIndex
CREATE INDEX "tracking_events_eventId_idx" ON "tracking_events"("eventId");

-- CreateIndex
CREATE INDEX "tracking_event_deliveries_eventId_idx" ON "tracking_event_deliveries"("eventId");

-- CreateIndex
CREATE INDEX "tracking_event_deliveries_destinationId_idx" ON "tracking_event_deliveries"("destinationId");

-- CreateIndex
CREATE UNIQUE INDEX "cms_content_types_userId_slug_key" ON "cms_content_types"("userId", "slug");

-- CreateIndex
CREATE INDEX "cms_content_entries_contentTypeId_idx" ON "cms_content_entries"("contentTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "cms_content_entries_contentTypeId_slug_key" ON "cms_content_entries"("contentTypeId", "slug");

-- AddForeignKey
ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "tracking_datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_event_deliveries" ADD CONSTRAINT "tracking_event_deliveries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "tracking_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_event_deliveries" ADD CONSTRAINT "tracking_event_deliveries_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "tracking_destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_event_deliveries" ADD CONSTRAINT "tracking_event_deliveries_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "tracking_datasets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_content_types" ADD CONSTRAINT "cms_content_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_content_entries" ADD CONSTRAINT "cms_content_entries_contentTypeId_fkey" FOREIGN KEY ("contentTypeId") REFERENCES "cms_content_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
