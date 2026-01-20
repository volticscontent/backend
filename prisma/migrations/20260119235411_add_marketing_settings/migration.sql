-- CreateTable
CREATE TABLE "marketing_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metaPixelId" TEXT,
    "metaApiToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketing_settings_userId_key" ON "marketing_settings"("userId");

-- AddForeignKey
ALTER TABLE "marketing_settings" ADD CONSTRAINT "marketing_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
