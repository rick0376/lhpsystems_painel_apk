// src/app/(private)/apk-users/[id]/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AppWindow,
  ArrowLeft,
  ArrowUpDown,
  CalendarClock,
  KeyRound,
  Pencil,
  Search,
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

type PermissionStatus =
  | "all"
  | "allowed"
  | "blocked";

type PermissionSort =
  | "name_asc"
  | "name_desc"
  | "key_asc"
  | "allowed_first"
  | "blocked_first";

type DeviceStatus =
  | "all"
  | "active"
  | "blocked";

type DeviceSort =
  | "recent_desc"
  | "recent_asc"
  | "name_asc"
  | "name_desc";

type ApkUserDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    permissionQ?: string;
    permissionStatus?: string;
    permissionSort?: string;

    deviceQ?: string;
    deviceStatus?: string;
    deviceSort?: string;
  }>;
};

const PERMISSION_STATUS_OPTIONS: PermissionStatus[] = [
  "all",
  "allowed",
  "blocked",
];

const PERMISSION_SORT_OPTIONS: PermissionSort[] = [
  "name_asc",
  "name_desc",
  "key_asc",
  "allowed_first",
  "blocked_first",
];

const DEVICE_STATUS_OPTIONS: DeviceStatus[] = [
  "all",
  "active",
  "blocked",
];

const DEVICE_SORT_OPTIONS: DeviceSort[] = [
  "recent_desc",
  "recent_asc",
  "name_asc",
  "name_desc",
];

function formatDate(
  date: Date | null,
) {
  if (!date) {
    return "Sem expiração";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(date);
}

function formatDateTime(
  date: Date | null,
) {
  if (!date) {
    return "Nenhum acesso registrado";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(date);
}

function normalizeText(
  value: string,
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLocaleLowerCase(
      "pt-BR",
    );
}

function isPermissionStatus(
  value: string,
): value is PermissionStatus {
  return PERMISSION_STATUS_OPTIONS.includes(
    value as PermissionStatus,
  );
}

function isPermissionSort(
  value: string,
): value is PermissionSort {
  return PERMISSION_SORT_OPTIONS.includes(
    value as PermissionSort,
  );
}

function isDeviceStatus(
  value: string,
): value is DeviceStatus {
  return DEVICE_STATUS_OPTIONS.includes(
    value as DeviceStatus,
  );
}

function isDeviceSort(
  value: string,
): value is DeviceSort {
  return DEVICE_SORT_OPTIONS.includes(
    value as DeviceSort,
  );
}

function compareDeviceDates(
  a: Date | null,
  b: Date | null,
  direction: "asc" | "desc",
) {
  if (!a && !b) {
    return 0;
  }

  if (!a) {
    return 1;
  }

  if (!b) {
    return -1;
  }

  if (direction === "asc") {
    return (
      a.getTime() -
      b.getTime()
    );
  }

  return (
    b.getTime() -
    a.getTime()
  );
}

export default async function ApkUserDetailsPage({
  params,
  searchParams,
}: ApkUserDetailsPageProps) {
  const session =
    await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const { id } =
    await params;

  const queryParams =
    await searchParams;

  /*
   * =====================================================
   * FILTROS DE PERMISSÕES
   * =====================================================
   */

  const permissionQ =
    typeof queryParams.permissionQ ===
      "string"
      ? queryParams.permissionQ.trim()
      : "";

  const permissionStatus: PermissionStatus =
    typeof queryParams.permissionStatus ===
      "string" &&
      isPermissionStatus(
        queryParams.permissionStatus,
      )
      ? queryParams.permissionStatus
      : "all";

  const permissionSort: PermissionSort =
    typeof queryParams.permissionSort ===
      "string" &&
      isPermissionSort(
        queryParams.permissionSort,
      )
      ? queryParams.permissionSort
      : "name_asc";

  /*
   * =====================================================
   * FILTROS DE DISPOSITIVOS
   * =====================================================
   */

  const deviceQ =
    typeof queryParams.deviceQ ===
      "string"
      ? queryParams.deviceQ.trim()
      : "";

  const deviceStatus: DeviceStatus =
    typeof queryParams.deviceStatus ===
      "string" &&
      isDeviceStatus(
        queryParams.deviceStatus,
      )
      ? queryParams.deviceStatus
      : "all";

  const deviceSort: DeviceSort =
    typeof queryParams.deviceSort ===
      "string" &&
      isDeviceSort(
        queryParams.deviceSort,
      )
      ? queryParams.deviceSort
      : "recent_desc";

  /*
   * =====================================================
   * USUÁRIO
   * =====================================================
   */

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

  /*
   * =====================================================
   * STATUS
   * =====================================================
   */

  const isExpired =
    !!apkUser.expiresAt &&
    apkUser.expiresAt.getTime() <
    new Date().getTime();

  const userStatus =
    !apkUser.active
      ? "blocked"
      : isExpired
        ? "expired"
        : "active";

  /*
   * =====================================================
   * PERMISSÕES
   * =====================================================
   */

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

  const normalizedPermissionQ =
    normalizeText(
      permissionQ,
    );

  let filteredPermissions =
    permissions.filter(
      (permission) => {
        const matchesSearch =
          !normalizedPermissionQ ||
          normalizeText(
            permission.name,
          ).includes(
            normalizedPermissionQ,
          ) ||
          normalizeText(
            permission.key,
          ).includes(
            normalizedPermissionQ,
          ) ||
          normalizeText(
            permission.description ||
            "",
          ).includes(
            normalizedPermissionQ,
          );

        const matchesStatus =
          permissionStatus ===
          "all" ||
          (permissionStatus ===
            "allowed" &&
            permission.allowed) ||
          (permissionStatus ===
            "blocked" &&
            !permission.allowed);

        return (
          matchesSearch &&
          matchesStatus
        );
      },
    );

  filteredPermissions =
    [...filteredPermissions].sort(
      (a, b) => {
        switch (
        permissionSort
        ) {
          case "name_desc":
            return b.name.localeCompare(
              a.name,
              "pt-BR",
              {
                sensitivity:
                  "base",
              },
            );

          case "key_asc":
            return a.key.localeCompare(
              b.key,
              "pt-BR",
              {
                sensitivity:
                  "base",
              },
            );

          case "allowed_first":
            if (
              a.allowed !==
              b.allowed
            ) {
              return a.allowed
                ? -1
                : 1;
            }

            return a.name.localeCompare(
              b.name,
              "pt-BR",
              {
                sensitivity:
                  "base",
              },
            );

          case "blocked_first":
            if (
              a.allowed !==
              b.allowed
            ) {
              return a.allowed
                ? 1
                : -1;
            }

            return a.name.localeCompare(
              b.name,
              "pt-BR",
              {
                sensitivity:
                  "base",
              },
            );

          case "name_asc":
          default:
            return a.name.localeCompare(
              b.name,
              "pt-BR",
              {
                sensitivity:
                  "base",
              },
            );
        }
      },
    );

  /*
   * =====================================================
   * DISPOSITIVOS
   * =====================================================
   */

  const activeDevices =
    apkUser.devices.filter(
      (device) =>
        device.active,
    ).length;

  const normalizedDeviceQ =
    normalizeText(
      deviceQ,
    );

  let filteredDevices =
    apkUser.devices.filter(
      (device) => {
        const matchesSearch =
          !normalizedDeviceQ ||
          normalizeText(
            device.deviceName ||
            "",
          ).includes(
            normalizedDeviceQ,
          ) ||
          normalizeText(
            device.deviceId,
          ).includes(
            normalizedDeviceQ,
          );

        const matchesStatus =
          deviceStatus ===
          "all" ||
          (deviceStatus ===
            "active" &&
            device.active) ||
          (deviceStatus ===
            "blocked" &&
            !device.active);

        return (
          matchesSearch &&
          matchesStatus
        );
      },
    );

  filteredDevices =
    [...filteredDevices].sort(
      (a, b) => {
        switch (
        deviceSort
        ) {
          case "recent_asc":
            return compareDeviceDates(
              a.lastAccessAt,
              b.lastAccessAt,
              "asc",
            );

          case "name_asc":
            return (
              a.deviceName ||
              a.deviceId
            ).localeCompare(
              b.deviceName ||
              b.deviceId,
              "pt-BR",
              {
                sensitivity:
                  "base",
              },
            );

          case "name_desc":
            return (
              b.deviceName ||
              b.deviceId
            ).localeCompare(
              a.deviceName ||
              a.deviceId,
              "pt-BR",
              {
                sensitivity:
                  "base",
              },
            );

          case "recent_desc":
          default:
            return compareDeviceDates(
              a.lastAccessAt,
              b.lastAccessAt,
              "desc",
            );
        }
      },
    );

  const hasPermissionFilters =
    permissionQ.length > 0 ||
    permissionStatus !== "all" ||
    permissionSort !== "name_asc";

  const hasDeviceFilters =
    deviceQ.length > 0 ||
    deviceStatus !== "all" ||
    deviceSort !==
    "recent_desc";

  return (
    <AdminShell>
      {/* ===================================================
          HERO
      =================================================== */}

      <section
        className={
          styles.hero
        }
      >
        <div
          className={
            styles.heroMain
          }
        >
          <div
            className={
              styles.userAvatar
            }
          >
            {apkUser.name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div
            className={
              styles.heroContent
            }
          >
            <div
              className={
                styles.heroTop
              }
            >
              <span
                className={
                  styles.badge
                }
              >
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

            <h1
              className={
                styles.title
              }
            >
              {apkUser.name}
            </h1>

            <p
              className={
                styles.subtitle
              }
            >
              Controle acesso,
              permissões, validade e
              dispositivos deste
              usuário.
            </p>

            <div
              className={
                styles.heroMeta
              }
            >
              <span>
                <UserRound
                  size={14}
                />
                @{apkUser.username}
              </span>

              <span>
                <AppWindow
                  size={14}
                />
                {
                  apkUser.project
                    .name
                }
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

      {/* ===================================================
          RESUMO
      =================================================== */}

      <section
        className={
          styles.statsGrid
        }
      >
        <div
          className={
            styles.statCard
          }
        >
          <div
            className={
              styles.statIcon
            }
          >
            <AppWindow
              size={20}
            />
          </div>

          <div>
            <span>
              Projeto
            </span>

            <strong
              className={
                styles.statText
              }
            >
              {
                apkUser.project
                  .name
              }
            </strong>

            <small>
              Aplicativo vinculado
            </small>
          </div>
        </div>

        <div
          className={
            styles.statCard
          }
        >
          <div
            className={`${styles.statIcon} ${styles.loginIcon}`}
          >
            <KeyRound
              size={20}
            />
          </div>

          <div>
            <span>
              Login do APK
            </span>

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

        <div
          className={
            styles.statCard
          }
        >
          <div
            className={`${styles.statIcon} ${styles.dateIcon}`}
          >
            <CalendarClock
              size={20}
            />
          </div>

          <div>
            <span>
              Expiração
            </span>

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

        <div
          className={
            styles.statCard
          }
        >
          <div
            className={`${styles.statIcon} ${styles.deviceIcon}`}
          >
            <Smartphone
              size={20}
            />
          </div>

          <div>
            <span>
              Dispositivos
            </span>

            <strong>
              {
                apkUser.devices
                  .length
              }

              <small
                className={
                  styles.deviceLimit
                }
              >
                /{" "}
                {
                  apkUser.maxDevices
                }
              </small>
            </strong>

            <small>
              {activeDevices} ativo(s)
            </small>
          </div>
        </div>
      </section>

      {/* ===================================================
          PERMISSÕES
      =================================================== */}

      <section
        className={
          styles.permissionsCard
        }
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
              <ShieldCheck
                size={21}
              />
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
                {
                  apkUser.project
                    .name
                }
              </h2>

              <p>
                Recursos liberados
                especificamente para
                este usuário.
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
                  {
                    allowedPermissions
                  }
                </strong>

                liberadas
              </span>

              <span>
                <strong>
                  {
                    blockedPermissions
                  }
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

        {permissions.length >
          0 && (
            <div
              className={
                styles.searchToolbar
              }
            >
              <form
                method="get"
                className={
                  styles.searchForm
                }
              >
                <div
                  className={
                    styles.searchInput
                  }
                >
                  <Search
                    size={17}
                  />

                  <input
                    type="search"
                    name="permissionQ"
                    defaultValue={
                      permissionQ
                    }
                    placeholder="Buscar permissão por nome ou chave..."
                  />
                </div>

                <div
                  className={
                    styles.searchFilters
                  }
                >
                  <label
                    className={
                      styles.filterField
                    }
                  >
                    <span>
                      Status
                    </span>

                    <select
                      name="permissionStatus"
                      defaultValue={
                        permissionStatus
                      }
                    >
                      <option value="all">
                        Todas
                      </option>

                      <option value="allowed">
                        Liberadas
                      </option>

                      <option value="blocked">
                        Bloqueadas
                      </option>
                    </select>
                  </label>

                  <label
                    className={
                      styles.filterField
                    }
                  >
                    <span>
                      Classificar
                    </span>

                    <div
                      className={
                        styles.sortField
                      }
                    >
                      <ArrowUpDown
                        size={15}
                      />

                      <select
                        name="permissionSort"
                        defaultValue={
                          permissionSort
                        }
                      >
                        <option value="name_asc">
                          Nome A → Z
                        </option>

                        <option value="name_desc">
                          Nome Z → A
                        </option>

                        <option value="key_asc">
                          Chave A → Z
                        </option>

                        <option value="allowed_first">
                          Liberadas primeiro
                        </option>

                        <option value="blocked_first">
                          Bloqueadas primeiro
                        </option>
                      </select>
                    </div>
                  </label>

                  <input
                    type="hidden"
                    name="deviceQ"
                    value={deviceQ}
                  />

                  <input
                    type="hidden"
                    name="deviceStatus"
                    value={
                      deviceStatus
                    }
                  />

                  <input
                    type="hidden"
                    name="deviceSort"
                    value={
                      deviceSort
                    }
                  />

                  <button
                    type="submit"
                    className={
                      styles.applyFilterButton
                    }
                  >
                    Aplicar
                  </button>

                  {hasPermissionFilters && (
                    <Link
                      href={`/apk-users/${apkUser.id}`}
                      className={
                        styles.clearFilterButton
                      }
                    >
                      Limpar
                    </Link>
                  )}
                </div>
              </form>

              <div
                className={
                  styles.searchResults
                }
              >
                Exibindo{" "}
                <strong>
                  {
                    filteredPermissions.length
                  }
                </strong>{" "}
                de{" "}
                <strong>
                  {
                    permissions.length
                  }
                </strong>{" "}
                permissão(ões)
              </div>
            </div>
          )}

        {permissions.length ===
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
              <ShieldCheck
                size={23}
              />
            </div>

            <strong>
              Nenhuma permissão
              cadastrada
            </strong>

            <p>
              Este APK ainda não
              possui permissões
              específicas.
            </p>
          </div>
        ) : filteredPermissions.length ===
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
              <Search
                size={22}
              />
            </div>

            <strong>
              Nenhuma permissão
              encontrada
            </strong>

            <p>
              Altere a busca ou os
              filtros utilizados.
            </p>
          </div>
        ) : (
          <div
            className={
              styles.permissionsGrid
            }
          >
            {filteredPermissions.map(
              (permission) => (
                <div
                  key={
                    permission.id
                  }
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
                        {
                          permission.name
                        }
                      </strong>

                      <code>
                        {
                          permission.key
                        }
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

      {/* ===================================================
          OBSERVAÇÕES
      =================================================== */}

      <section
        className={
          styles.bottomGrid
        }
      >
        <div
          className={
            styles.notesCard
          }
        >
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
              <StickyNote
                size={19}
              />
            </div>

            <div>
              <span>
                Informações internas
              </span>

              <h2>
                Observações
              </h2>
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
              <Smartphone
                size={19}
              />
            </div>

            <div>
              <span>
                Limite de acesso
              </span>

              <h2>
                Dispositivos
                utilizados
              </h2>
            </div>
          </div>

          <div
            className={
              styles.deviceProgressInfo
            }
          >
            <strong>
              {
                apkUser.devices
                  .length
              }
            </strong>

            <span>
              de{" "}
              {
                apkUser.maxDevices
              }{" "}
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
                  apkUser.maxDevices >
                    0
                    ? (apkUser
                      .devices
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

      {/* ===================================================
          DISPOSITIVOS
      =================================================== */}

      <section
        className={
          styles.devicesCard
        }
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
              <Smartphone
                size={21}
              />
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
                Dispositivos
                vinculados
              </h2>

              <p>
                Celulares ou
                navegadores que já
                utilizaram este
                acesso.
              </p>
            </div>
          </div>

          <span
            className={
              styles.deviceBadge
            }
          >
            {
              apkUser.devices
                .length
            }{" "}
            /{" "}
            {
              apkUser.maxDevices
            }
          </span>
        </div>

        {apkUser.devices.length >
          0 && (
            <div
              className={
                styles.searchToolbar
              }
            >
              <form
                method="get"
                className={
                  styles.searchForm
                }
              >
                <div
                  className={
                    styles.searchInput
                  }
                >
                  <Search
                    size={17}
                  />

                  <input
                    type="search"
                    name="deviceQ"
                    defaultValue={
                      deviceQ
                    }
                    placeholder="Buscar dispositivo por nome ou ID..."
                  />
                </div>

                <div
                  className={
                    styles.searchFilters
                  }
                >
                  <label
                    className={
                      styles.filterField
                    }
                  >
                    <span>
                      Status
                    </span>

                    <select
                      name="deviceStatus"
                      defaultValue={
                        deviceStatus
                      }
                    >
                      <option value="all">
                        Todos
                      </option>

                      <option value="active">
                        Ativos
                      </option>

                      <option value="blocked">
                        Bloqueados
                      </option>
                    </select>
                  </label>

                  <label
                    className={
                      styles.filterField
                    }
                  >
                    <span>
                      Classificar
                    </span>

                    <div
                      className={
                        styles.sortField
                      }
                    >
                      <ArrowUpDown
                        size={15}
                      />

                      <select
                        name="deviceSort"
                        defaultValue={
                          deviceSort
                        }
                      >
                        <option value="recent_desc">
                          Acesso mais recente
                        </option>

                        <option value="recent_asc">
                          Acesso mais antigo
                        </option>

                        <option value="name_asc">
                          Nome A → Z
                        </option>

                        <option value="name_desc">
                          Nome Z → A
                        </option>
                      </select>
                    </div>
                  </label>

                  <input
                    type="hidden"
                    name="permissionQ"
                    value={
                      permissionQ
                    }
                  />

                  <input
                    type="hidden"
                    name="permissionStatus"
                    value={
                      permissionStatus
                    }
                  />

                  <input
                    type="hidden"
                    name="permissionSort"
                    value={
                      permissionSort
                    }
                  />

                  <button
                    type="submit"
                    className={
                      styles.applyFilterButton
                    }
                  >
                    Aplicar
                  </button>

                  {hasDeviceFilters && (
                    <Link
                      href={`/apk-users/${apkUser.id}`}
                      className={
                        styles.clearFilterButton
                      }
                    >
                      Limpar
                    </Link>
                  )}
                </div>
              </form>

              <div
                className={
                  styles.searchResults
                }
              >
                Exibindo{" "}
                <strong>
                  {
                    filteredDevices.length
                  }
                </strong>{" "}
                de{" "}
                <strong>
                  {
                    apkUser.devices
                      .length
                  }
                </strong>{" "}
                dispositivo(s)
              </div>
            </div>
          )}

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
              <Smartphone
                size={23}
              />
            </div>

            <strong>
              Nenhum dispositivo
              vinculado
            </strong>

            <p>
              O primeiro dispositivo
              aparecerá aqui após o
              login.
            </p>
          </div>
        ) : filteredDevices.length ===
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
              <Search
                size={22}
              />
            </div>

            <strong>
              Nenhum dispositivo
              encontrado
            </strong>

            <p>
              Altere a busca ou os
              filtros utilizados.
            </p>
          </div>
        ) : (
          <div
            className={
              styles.deviceList
            }
          >
            {filteredDevices.map(
              (
                device: ApkUserDevice,
              ) => (
                <div
                  key={
                    device.id
                  }
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
                      {
                        device.deviceId
                      }
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