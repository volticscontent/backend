-- AlterTable
ALTER TABLE "checkout_settings" ADD COLUMN     "dataSourceId" TEXT;

-- AddForeignKey
ALTER TABLE "checkout_settings" ADD CONSTRAINT "checkout_settings_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
