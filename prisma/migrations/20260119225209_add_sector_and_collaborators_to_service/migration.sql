-- AlterTable
ALTER TABLE "services" ADD COLUMN     "sector" TEXT;

-- CreateTable
CREATE TABLE "_AdminToService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AdminToService_AB_unique" ON "_AdminToService"("A", "B");

-- CreateIndex
CREATE INDEX "_AdminToService_B_index" ON "_AdminToService"("B");

-- AddForeignKey
ALTER TABLE "_AdminToService" ADD CONSTRAINT "_AdminToService_A_fkey" FOREIGN KEY ("A") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminToService" ADD CONSTRAINT "_AdminToService_B_fkey" FOREIGN KEY ("B") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
