/*
  Warnings:

  - A unique constraint covering the columns `[projectId,username]` on the table `ApkUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `ApkUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ApkUser_username_key";

-- AlterTable
ALTER TABLE "ApkUser" ADD COLUMN     "projectId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AppProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "appKey" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppProject_slug_key" ON "AppProject"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AppProject_appKey_key" ON "AppProject"("appKey");

-- CreateIndex
CREATE INDEX "ApkUser_projectId_idx" ON "ApkUser"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ApkUser_projectId_username_key" ON "ApkUser"("projectId", "username");

-- AddForeignKey
ALTER TABLE "ApkUser" ADD CONSTRAINT "ApkUser_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AppProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
