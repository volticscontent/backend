-- AlterTable
ALTER TABLE "services" ADD COLUMN     "headId" TEXT;

-- CreateTable
CREATE TABLE "service_modules" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ModuleCollaborators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModuleCollaborators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_modules_serviceId_key_key" ON "service_modules"("serviceId", "key");

-- CreateIndex
CREATE INDEX "_ModuleCollaborators_B_index" ON "_ModuleCollaborators"("B");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_headId_fkey" FOREIGN KEY ("headId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_modules" ADD CONSTRAINT "service_modules_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModuleCollaborators" ADD CONSTRAINT "_ModuleCollaborators_A_fkey" FOREIGN KEY ("A") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModuleCollaborators" ADD CONSTRAINT "_ModuleCollaborators_B_fkey" FOREIGN KEY ("B") REFERENCES "service_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
