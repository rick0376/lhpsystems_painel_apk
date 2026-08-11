// src/app/(private)/apk-users/[id]/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AppWindow,
  ArrowLeft,
  CalendarClock,
  KeyRound,
  Pencil,
  ShieldCheck,
  Smartphone,
  StickyNote,
  UserRound,
} from "lucide-react";

import { AdminShell } from "../../../../components/layout/AdminShell/AdminShell";
import { getAdminSession } from "../../../../lib/auth/session";
import { prisma } from "../../../../lib/prisma";

import styles from "./styles.module.scss";

type ApkUserDevice = {
  id: string;
  deviceId: string;
  deviceName: string | null;
  active: boolean;
  lastAccessAt: Date | null;
};

type ApkUserDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Sem expiração";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatDateTime(date: Date | null) {
  if (!date) {
    return "Nenhum acesso registrado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function ApkUserDetailsPage({
  params,
}: ApkUserDetailsPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const apkUser =
    await prisma.apkUser.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,
        username: true,
        active: true,
        expiresAt: true,
        maxDevices: true,
        notes: true,

        project: {
          select: {
            id: true,
            name: true,

            permissions: {
              where: {
                active: true,
              },

              orderBy: {
                name: "asc",
              },

              select: {
                id: true,
                name: true,
                key: true,
                description: true,

                userPermissions: {
                  where: {
                    apkUserId: id,
                  },

                  select: {
                    allowed: true,
                  },

                  take: 1,
                },
              },
            },
          },
        },

        devices: {
          orderBy: {
            lastAccessAt: "desc",
          },

          select: {
            id: true,
            deviceId: true,
            deviceName: true,
            active: true,
            lastAccessAt: true,
          },
        },
      },
    });

  if (!apkUser) {
    redirect("/apk-users");
  }

  const isExpired =
    !!apkUser.expiresAt &&
    apkUser.expiresAt.getTime() <
    new Date().getTime();

  const permissions =
    apkUser.project.permissions.map(
      (permission) => ({
        id: permission.id,
        name: permission.name,
        key: permission.key,
        description:
          permission.description,

        allowed:
          permission.userPermissions[0]
            ?.allowed ?? false,
      }),
    );

  const allowedPermissions =
    permissions.filter(
      (permission) =>
        permission.allowed,
    ).length;

  const blockedPermissions =
    permissions.length -
    allowedPermissions;

  const activeDevices =
    apkUser.devices.filter(
      (device) => device.active,
    ).length;

  const userStatus =
    !apkUser.active
      ? "blocked"
      : isExpired
        ? "expired"
        : "active";

  return (
    <AdminShell>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div
            className={
              styles.userAvatar
            }
          >
            {apkUser.name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroTop}>
              <span className={styles.badge}>
                Usuário APK
              </span>

              {userStatus ===
                "active" && (
                  <span
                    className={
                      styles.heroActive
                    }
                  >
                    <i />
                    Acesso ativo
                  </span>
                )}

              {userStatus ===
                "expired" && (
                  <span
                    className={
                      styles.heroExpired
                    }
                  >
                    <i />
                    Licença vencida
                  </span>
                )}

              {userStatus ===
                "blocked" && (
                  <span
                    className={
                      styles.heroInactive
                    }
                  >
                    <i />
                    Usuário bloqueado
                  </span>
                )}
            </div>

            <h1 className={styles.title}>
              {apkUser.name}
            </h1>

            <p className={styles.subtitle}>
              Controle acesso, permissões,
              validade e dispositivos deste
              usuário.
            </p>

            <div
              className={
                styles.heroMeta
              }
            >
              <span>
                <UserRound size={14} />
                @{apkUser.username}
              </span>

              <span>
                <AppWindow size={14} />
                {apkUser.project.name}
              </span>
            </div>
          </div>
        </div>

        <div
          className={
            styles.headerActions
          }
        >
          <Link
            href={`/apk-users/${apkUser.id}/edit`}
            className={
              styles.editButton
            }
          >
            <Pencil
              size={17}
              strokeWidth={2.4}
            />
            Editar usuário
          </Link>

          <Link
            href="/apk-users"
            className={
              styles.backButton
            }
          >
            <ArrowLeft
              size={17}
              strokeWidth={2.4}
            />
            Voltar
          </Link>
        </div>
      </section>

      <section
        className={styles.statsGrid}
      >
        <div className={styles.statCard}>
          <div
            className={
              styles.statIcon
            }
          >
            <AppWindow size={20} />
          </div>

          <div>
            <span>Projeto</span>

            <strong
              className={
                styles.statText
              }
            >
              {apkUser.project.name}
            </strong>

            <small>
              Aplicativo vinculado
            </small>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={`${styles.statIcon} ${styles.loginIcon}`}
          >
            <KeyRound size={20} />
          </div>

          <div>
            <span>Login do APK</span>

            <strong
              className={
                styles.statText
              }
            >
              {apkUser.username}
            </strong>

            <small>
              Usuário de acesso
            </small>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={`${styles.statIcon} ${styles.dateIcon}`}
          >
            <CalendarClock size={20} />
          </div>

          <div>
            <span>Expiração</span>

            <strong
              className={
                isExpired
                  ? styles.expiredText
                  : styles.statText
              }
            >
              {formatDate(
                apkUser.expiresAt,
              )}
            </strong>

            <small>
              {isExpired
                ? "Licença vencida"
                : "Prazo de utilização"}
            </small>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={`${styles.statIcon} ${styles.deviceIcon}`}
          >
            <Smartphone size={20} />
          </div>

          <div>
            <span>Dispositivos</span>

            <strong>
              {apkUser.devices.length}
              <small
                className={
                  styles.deviceLimit
                }
              >
                / {apkUser.maxDevices}
              </small>
            </strong>

            <small>
              {activeDevices} ativo(s)
            </small>
          </div>
        </div>
      </section>

      <section
        className={styles.permissionsCard}
      >
        <div
          className={
            styles.permissionsHeader
          }
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <div
              className={
                styles.sectionIcon
              }
            >
              <ShieldCheck size={21} />
            </div>

            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Controle de acesso
              </span>

              <h2>
                Permissões —{" "}
                {apkUser.project.name}
              </h2>

              <p>
                Recursos liberados
                especificamente para este
                usuário.
              </p>
            </div>
          </div>

          <div
            className={
              styles.permissionActions
            }
          >
            <div
              className={
                styles.permissionSummary
              }
            >
              <span>
                <strong>
                  {allowedPermissions}
                </strong>
                liberadas
              </span>

              <span>
                <strong>
                  {blockedPermissions}
                </strong>
                bloqueadas
              </span>
            </div>

            <Link
              href={`/apk-users/${apkUser.id}/edit`}
              className={
                styles.manageButton
              }
            >
              <Pencil
                size={16}
                strokeWidth={2.4}
              />
              Alterar permissões
            </Link>
          </div>
        </div>

        {permissions.length === 0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <div
              className={
                styles.emptyIcon
              }
            >
              <ShieldCheck size={23} />
            </div>

            <strong>
              Nenhuma permissão
              cadastrada
            </strong>

            <p>
              Este APK ainda não possui
              permissões específicas.
            </p>
          </div>
        ) : (
          <div
            className={
              styles.permissionsGrid
            }
          >
            {permissions.map(
              (permission) => (
                <div
                  key={permission.id}
                  className={`${styles.permissionItem} ${permission.allowed
                      ? styles.permissionItemAllowed
                      : styles.permissionItemBlocked
                    }`}
                >
                  <div
                    className={
                      styles.permissionMain
                    }
                  >
                    <div
                      className={
                        styles.permissionIcon
                      }
                    >
                      <ShieldCheck
                        size={17}
                      />
                    </div>

                    <div
                      className={
                        styles.permissionContent
                      }
                    >
                      <strong>
                        {permission.name}
                      </strong>

                      <code>
                        {permission.key}
                      </code>

                      {permission.description && (
                        <p>
                          {
                            permission.description
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={
                      permission.allowed
                        ? styles.permissionAllowed
                        : styles.permissionBlocked
                    }
                  >
                    <i />

                    {permission.allowed
                      ? "Liberado"
                      : "Bloqueado"}
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      <section className={styles.bottomGrid}>
        <div className={styles.notesCard}>
          <div
            className={
              styles.smallSectionHeader
            }
          >
            <div
              className={
                styles.notesIcon
              }
            >
              <StickyNote size={19} />
            </div>

            <div>
              <span>
                Informações internas
              </span>

              <h2>Observações</h2>
            </div>
          </div>

          <p>
            {apkUser.notes ||
              "Nenhuma observação cadastrada."}
          </p>
        </div>

        <div
          className={
            styles.deviceSummaryCard
          }
        >
          <div
            className={
              styles.smallSectionHeader
            }
          >
            <div
              className={
                styles.devicesIcon
              }
            >
              <Smartphone size={19} />
            </div>

            <div>
              <span>
                Limite de acesso
              </span>

              <h2>
                Dispositivos utilizados
              </h2>
            </div>
          </div>

          <div
            className={
              styles.deviceProgressInfo
            }
          >
            <strong>
              {apkUser.devices.length}
            </strong>

            <span>
              de {apkUser.maxDevices}{" "}
              permitidos
            </span>
          </div>

          <div
            className={
              styles.deviceProgress
            }
          >
            <div
              style={{
                width: `${Math.min(
                  100,
                  apkUser.maxDevices > 0
                    ? (apkUser.devices
                      .length /
                      apkUser.maxDevices) *
                    100
                    : 0,
                )}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section
        className={styles.devicesCard}
      >
        <div
          className={
            styles.devicesHeader
          }
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <div
              className={`${styles.sectionIcon} ${styles.blueSectionIcon}`}
            >
              <Smartphone size={21} />
            </div>

            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Segurança
              </span>

              <h2>
                Dispositivos vinculados
              </h2>

              <p>
                Celulares ou navegadores
                que já utilizaram este
                acesso.
              </p>
            </div>
          </div>

          <span
            className={
              styles.deviceBadge
            }
          >
            {apkUser.devices.length} /{" "}
            {apkUser.maxDevices}
          </span>
        </div>

        {apkUser.devices.length ===
          0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <div
              className={
                styles.emptyIcon
              }
            >
              <Smartphone size={23} />
            </div>

            <strong>
              Nenhum dispositivo
              vinculado
            </strong>

            <p>
              O primeiro dispositivo
              aparecerá aqui após o login.
            </p>
          </div>
        ) : (
          <div
            className={
              styles.deviceList
            }
          >
            {apkUser.devices.map(
              (
                device: ApkUserDevice,
              ) => (
                <div
                  key={device.id}
                  className={
                    styles.deviceItem
                  }
                >
                  <div
                    className={
                      styles.deviceItemIcon
                    }
                  >
                    <Smartphone
                      size={18}
                    />
                  </div>

                  <div
                    className={
                      styles.deviceInfo
                    }
                  >
                    <strong>
                      {device.deviceName ||
                        "Dispositivo sem nome"}
                    </strong>

                    <small>
                      {device.deviceId}
                    </small>

                    <span>
                      Último acesso:{" "}
                      {formatDateTime(
                        device.lastAccessAt,
                      )}
                    </span>
                  </div>

                  <span
                    className={
                      device.active
                        ? styles.active
                        : styles.inactive
                    }
                  >
                    <i />

                    {device.active
                      ? "Ativo"
                      : "Bloqueado"}
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </AdminShell>
  );
}