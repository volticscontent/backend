-- CreateEnum
CREATE TYPE "DestinationPlatform" AS ENUM ('META', 'TIKTOK', 'GOOGLE_ADS');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('WEBHOOK', 'PIXEL_SCRIPT', 'CRM', 'MANUAL');

-- CreateEnum
CREATE TYPE "WebhookProvider" AS ENUM ('STRIPE', 'SHOPIFY', 'HOTMART', 'CUSTOM');

-- CreateTable
CREATE TABLE "tracking_datasets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_destinations" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "platform" "DestinationPlatform" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_sources" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "provider" "WebhookProvider",
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_sources_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tracking_datasets" ADD CONSTRAINT "tracking_datasets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_destinations" ADD CONSTRAINT "tracking_destinations_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "tracking_datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_sources" ADD CONSTRAINT "tracking_sources_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "tracking_datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
