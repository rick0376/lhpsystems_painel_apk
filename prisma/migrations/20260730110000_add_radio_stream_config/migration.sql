-- Complete support fields that existed in the Prisma schema but were absent
-- from the original migration history.
ALTER TABLE "AppProject"
  ADD COLUMN IF NOT EXISTS "supportWhatsappLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "supportWhatsappNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "supportWhatsappMessage" TEXT;

-- Central radio configuration. The DJ password is encrypted by the application
-- before it reaches this table.
CREATE TABLE "RadioStreamConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "sourcePort" INTEGER NOT NULL,
    "publicPort" INTEGER,
    "playerUrl" TEXT,
    "sourceUsername" TEXT NOT NULL DEFAULT 'live',
    "sourcePasswordEncrypted" TEXT NOT NULL,
    "mountPoint" TEXT NOT NULL DEFAULT '/',
    "useTls" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "bitrate" INTEGER NOT NULL DEFAULT 128,
    "sampleRate" INTEGER NOT NULL DEFAULT 44100,
    "channels" INTEGER NOT NULL DEFAULT 2,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadioStreamConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RadioStreamConfig_projectId_key"
  ON "RadioStreamConfig"("projectId");

ALTER TABLE "RadioStreamConfig"
  ADD CONSTRAINT "RadioStreamConfig_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "AppProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
