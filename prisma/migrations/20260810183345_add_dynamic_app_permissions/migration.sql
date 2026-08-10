-- CreateTable
CREATE TABLE "AppPermission" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApkUserPermission" (
    "id" TEXT NOT NULL,
    "apkUserId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApkUserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppPermission_projectId_idx" ON "AppPermission"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "AppPermission_projectId_key_key" ON "AppPermission"("projectId", "key");

-- CreateIndex
CREATE INDEX "ApkUserPermission_apkUserId_idx" ON "ApkUserPermission"("apkUserId");

-- CreateIndex
CREATE INDEX "ApkUserPermission_permissionId_idx" ON "ApkUserPermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ApkUserPermission_apkUserId_permissionId_key" ON "ApkUserPermission"("apkUserId", "permissionId");

-- AddForeignKey
ALTER TABLE "AppPermission" ADD CONSTRAINT "AppPermission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AppProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApkUserPermission" ADD CONSTRAINT "ApkUserPermission_apkUserId_fkey" FOREIGN KEY ("apkUserId") REFERENCES "ApkUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApkUserPermission" ADD CONSTRAINT "ApkUserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "AppPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
