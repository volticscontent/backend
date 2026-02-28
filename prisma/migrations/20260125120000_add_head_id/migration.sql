-- AlterTable
ALTER TABLE "services" ADD COLUMN "headId" TEXT;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_headId_fkey" FOREIGN KEY ("headId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
