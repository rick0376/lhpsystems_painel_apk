-- Permissões separadas do LHP Radio Manager
ALTER TABLE "ApkUser"
  ADD COLUMN "canAccessRadioManager" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canViewRadioDashboard" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canManageAutoDj" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canViewRadioLibrary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canUploadRadioTracks" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canDeleteRadioTracks" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canManageRadioPlaylists" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canManageRadioSchedules" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canManageRadioIntervals" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canManageRadioSettings" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canViewRadioAudit" BOOLEAN NOT NULL DEFAULT false;
