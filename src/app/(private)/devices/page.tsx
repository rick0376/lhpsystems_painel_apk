// src/app/(private)/devices/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AppWindow,
  ArrowUpDown,
  Ban,
  Clock3,
  Eye,
  MonitorSmartphone,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { AdminShell } from "../../../components/layout/AdminShell/AdminShell";
import { DeleteDeviceButton } from "../../../components/devices/DeleteDeviceButton/DeleteDeviceButton";
import { ToggleDeviceStatusButton } from "../../../components/devices/ToggleDeviceStatusButton/ToggleDeviceStatusButton";
import { getAdminSession } from "../../../lib/auth/session";
import { prisma } from "../../../lib/prisma";

import styles from "./styles.module.scss";

type DeviceListItem = {
  id: string;
  deviceId: string;
  deviceName: string | null;
  active: boolean;
  lastAccessAt: Date | null;
  updatedAt: Date;

  apkUser: {
    id: string;
    name: string;
    username: string;

    project: {
      id: string;
      name: string;
      slug: string;
    };
  };
};

type DeviceFilter =
  | "all"
  | "active"
  | "blocked"
  | "recent"
  | "never";

type DeviceSort =
  | "access_desc"
  | "access_asc"
  | "device_asc"
  | "device_desc"
  | "user_asc"
  | "user_desc"
  | "project_asc"
  | "project_desc";

type DevicesPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
  }>;
};

const DEVICE_FILTERS: DeviceFilter[] = [
  "all",
  "active",
  "blocked",
  "recent",
  "never",
];

const DEVICE_SORTS: DeviceSort[] = [
  "access_desc",
  "access_asc",
  "device_asc",
  "device_desc",
  "user_asc",
  "user_desc",
  "project_asc",
  "project_desc",
];

function formatDate(date: Date | null) {
  if (!date) {
    return "Nunca acessou";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function accessedRecently(date: Date | null) {
  if (!date) {
    return false;
  }

  const now = new Date();

  const sevenDaysAgo = new Date(
    now.getTime() -
    7 * 24 * 60 * 60 * 1000,
  );

  return date >= sevenDaysAgo;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLocaleLowerCase("pt-BR");
}

function isDeviceFilter(
  value: string,
): value is DeviceFilter {
  return DEVICE_FILTERS.includes(
    value as DeviceFilter,
  );
}

function isDeviceSort(
  value: string,
): value is DeviceSort {
  return DEVICE_SORTS.includes(
    value as DeviceSort,
  );
}

function compareAccessDate(
  a: Date | null,
  b: Date | null,
  direction: "asc" | "desc",
) {
  if (!a && !b) {
    return 0;
  }

  /*
   * Dispositivos que nunca acessaram
   * ficam sempre no final.
   */
  if (!a) {
    return 1;
  }

  if (!b) {
    return -1;
  }

  if (direction === "desc") {
    return (
      b.getTime() -
      a.getTime()
    );
  }

  return (
    a.getTime() -
    b.getTime()
  );
}

export default async function DevicesPage({
  searchParams,
}: DevicesPageProps) {
  const session =
    await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const params =
    await searchParams;

  const search =
    typeof params.q === "string"
      ? params.q.trim()
      : "";

  const statusFilter: DeviceFilter =
    typeof params.status === "string" &&
      isDeviceFilter(params.status)
      ? params.status
      : "all";

  const sort: DeviceSort =
    typeof params.sort === "string" &&
      isDeviceSort(params.sort)
      ? params.sort
      : "access_desc";

  /*
   * =====================================================
   * CARREGA DISPOSITIVOS
   * =====================================================
   */

  const devices =
    (await prisma.device.findMany({
      include: {
        apkUser: {
          select: {
            id: true,
            name: true,
            username: true,

            project: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })) as DeviceListItem[];

  /*
   * =====================================================
   * RESUMO
   * =====================================================
   */

  const activeDevices =
    devices.filter(
      (device) => device.active,
    ).length;

  const blockedDevices =
    devices.filter(
      (device) => !device.active,
    ).length;

  const uniqueUsers =
    new Set(
      devices.map(
        (device) =>
          device.apkUser.id,
      ),
    ).size;

  const uniqueProjects =
    new Set(
      devices.map(
        (device) =>
          device.apkUser.project.id,
      ),
    ).size;

  const recentDevices =
    devices.filter(
      (device) =>
        accessedRecently(
          device.lastAccessAt,
        ),
    ).length;

  /*
   * =====================================================
   * BUSCA E FILTROS
   * =====================================================
   */

  const normalizedSearch =
    normalizeText(search);

  let filteredDevices =
    devices.filter(
      (device) => {
        const deviceName =
          device.deviceName ||
          "Sem nome";

        const matchesSearch =
          !normalizedSearch ||
          normalizeText(
            deviceName,
          ).includes(
            normalizedSearch,
          ) ||
          normalizeText(
            device.deviceId,
          ).includes(
            normalizedSearch,
          ) ||
          normalizeText(
            device.apkUser.name,
          ).includes(
            normalizedSearch,
          ) ||
          normalizeText(
            device.apkUser.username,
          ).includes(
            normalizedSearch,
          ) ||
          normalizeText(
            device.apkUser.project.name,
          ).includes(
            normalizedSearch,
          ) ||
          normalizeText(
            device.apkUser.project.slug,
          ).includes(
            normalizedSearch,
          );

        let matchesStatus =
          true;

        switch (statusFilter) {
          case "active":
            matchesStatus =
              device.active;

            break;

          case "blocked":
            matchesStatus =
              !device.active;

            break;

          case "recent":
            matchesStatus =
              accessedRecently(
                device.lastAccessAt,
              );

            break;

          case "never":
            matchesStatus =
              !device.lastAccessAt;

            break;

          case "all":
          default:
            matchesStatus =
              true;
        }

        return (
          matchesSearch &&
          matchesStatus
        );
      },
    );

  /*
   * =====================================================
   * CLASSIFICAÇÃO
   * =====================================================
   */

  filteredDevices = [
    ...filteredDevices,
  ].sort((a, b) => {
    const deviceNameA =
      a.deviceName ||
      "Sem nome";

    const deviceNameB =
      b.deviceName ||
      "Sem nome";

    switch (sort) {
      case "access_asc":
        return compareAccessDate(
          a.lastAccessAt,
          b.lastAccessAt,
          "asc",
        );

      case "device_asc":
        return deviceNameA.localeCompare(
          deviceNameB,
          "pt-BR",
          {
            sensitivity: "base",
          },
        );

      case "device_desc":
        return deviceNameB.localeCompare(
          deviceNameA,
          "pt-BR",
          {
            sensitivity: "base",
          },
        );

      case "user_asc":
        return a.apkUser.name.localeCompare(
          b.apkUser.name,
          "pt-BR",
          {
            sensitivity: "base",
          },
        );

      case "user_desc":
        return b.apkUser.name.localeCompare(
          a.apkUser.name,
          "pt-BR",
          {
            sensitivity: "base",
          },
        );

      case "project_asc":
        return a.apkUser.project.name.localeCompare(
          b.apkUser.project.name,
          "pt-BR",
          {
            sensitivity: "base",
          },
        );

      case "project_desc":
        return b.apkUser.project.name.localeCompare(
          a.apkUser.project.name,
          "pt-BR",
          {
            sensitivity: "base",
          },
        );

      case "access_desc":
      default:
        return compareAccessDate(
          a.lastAccessAt,
          b.lastAccessAt,
          "desc",
        );
    }
  });

  const hasFilters =
    search.length > 0 ||
    statusFilter !== "all" ||
    sort !== "access_desc";

  return (
    <AdminShell>
      {/* ===================================================
          CABEÇALHO
      =================================================== */}

      <section className={styles.header}>
        <div
          className={
            styles.headerMain
          }
        >
          <div
            className={
              styles.headerIcon
            }
          >
            <MonitorSmartphone
              size={27}
            />
          </div>

          <div>
            <span
              className={
                styles.badge
              }
            >
              Controle de acessos
            </span>

            <h1
              className={
                styles.title
              }
            >
              Dispositivos
            </h1>

            <p
              className={
                styles.subtitle
              }
            >
              Acompanhe celulares,
              navegadores e aparelhos
              vinculados aos usuários
              dos seus aplicativos.
            </p>
          </div>
        </div>

        <div
          className={
            styles.headerStatus
          }
        >
          <ShieldCheck
            size={19}
          />

          <div>
            <strong>
              {activeDevices}
            </strong>

            <span>
              dispositivos ativos
            </span>
          </div>
        </div>
      </section>

      {/* ===================================================
          RESUMO
      =================================================== */}

      <section
        className={
          styles.summaryGrid
        }
      >
        <div
          className={`${styles.summaryCard} ${styles.totalCard}`}
        >
          <div
            className={`${styles.summaryIcon} ${styles.totalIcon}`}
          >
            <MonitorSmartphone
              size={21}
            />
          </div>

          <div>
            <span>Total</span>

            <strong>
              {devices.length}
            </strong>

            <small>
              Dispositivos cadastrados
            </small>
          </div>
        </div>

        <div
          className={`${styles.summaryCard} ${styles.activeCard}`}
        >
          <div
            className={`${styles.summaryIcon} ${styles.activeIcon}`}
          >
            <ShieldCheck
              size={21}
            />
          </div>

          <div>
            <span>Ativos</span>

            <strong>
              {activeDevices}
            </strong>

            <small>
              Acesso permitido
            </small>
          </div>
        </div>

        <div
          className={`${styles.summaryCard} ${styles.blockedCard}`}
        >
          <div
            className={`${styles.summaryIcon} ${styles.blockedIcon}`}
          >
            <Ban
              size={21}
            />
          </div>

          <div>
            <span>
              Bloqueados
            </span>

            <strong>
              {blockedDevices}
            </strong>

            <small>
              Acesso desativado
            </small>
          </div>
        </div>

        <div
          className={`${styles.summaryCard} ${styles.recentCard}`}
        >
          <div
            className={`${styles.summaryIcon} ${styles.recentIcon}`}
          >
            <Clock3
              size={21}
            />
          </div>

          <div>
            <span>
              Recentes
            </span>

            <strong>
              {recentDevices}
            </strong>

            <small>
              Acesso nos últimos 7 dias
            </small>
          </div>
        </div>
      </section>

      {/* ===================================================
          CARD PRINCIPAL
      =================================================== */}

      <section
        className={
          styles.card
        }
      >
        <div
          className={
            styles.cardHeader
          }
        >
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
              Consulte usuário,
              aplicativo, último acesso
              e situação de cada
              dispositivo.
            </p>
          </div>

          <div
            className={
              styles.cardSummary
            }
          >
            <span>
              <Users
                size={14}
              />

              {uniqueUsers} usuários
            </span>

            <span>
              <AppWindow
                size={14}
              />

              {uniqueProjects} projetos
            </span>
          </div>
        </div>

        {/* =================================================
            BUSCA / FILTRO / CLASSIFICAÇÃO
        ================================================= */}

        {devices.length > 0 && (
          <div
            className={
              styles.filterArea
            }
          >
            <form
              method="get"
              className={
                styles.filterForm
              }
            >
              <div
                className={
                  styles.searchField
                }
              >
                <span>
                  Buscar dispositivo
                </span>

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
                    name="q"
                    defaultValue={
                      search
                    }
                    placeholder="Dispositivo, usuário, ID ou projeto..."
                  />
                </div>
              </div>

              <label
                className={
                  styles.filterField
                }
              >
                <span>
                  Situação
                </span>

                <select
                  name="status"
                  defaultValue={
                    statusFilter
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

                  <option value="recent">
                    Acesso recente
                  </option>

                  <option value="never">
                    Nunca acessaram
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
                    styles.sortInput
                  }
                >
                  <ArrowUpDown
                    size={15}
                  />

                  <select
                    name="sort"
                    defaultValue={
                      sort
                    }
                  >
                    <option value="access_desc">
                      Acesso mais recente
                    </option>

                    <option value="access_asc">
                      Acesso mais antigo
                    </option>

                    <option value="device_asc">
                      Dispositivo A → Z
                    </option>

                    <option value="device_desc">
                      Dispositivo Z → A
                    </option>

                    <option value="user_asc">
                      Usuário A → Z
                    </option>

                    <option value="user_desc">
                      Usuário Z → A
                    </option>

                    <option value="project_asc">
                      Projeto A → Z
                    </option>

                    <option value="project_desc">
                      Projeto Z → A
                    </option>
                  </select>
                </div>
              </label>

              <div
                className={
                  styles.filterActions
                }
              >
                <button
                  type="submit"
                  className={
                    styles.applyButton
                  }
                >
                  Aplicar
                </button>

                {hasFilters && (
                  <Link
                    href="/devices"
                    className={
                      styles.clearButton
                    }
                  >
                    Limpar
                  </Link>
                )}
              </div>
            </form>

            <div
              className={
                styles.resultInfo
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
                {devices.length}
              </strong>{" "}
              dispositivo(s)
            </div>
          </div>
        )}

        {/* =================================================
            CONTEÚDO
        ================================================= */}

        {devices.length === 0 ? (
          <div
            className={
              styles.empty
            }
          >
            <div
              className={
                styles.emptyIcon
              }
            >
              <MonitorSmartphone
                size={27}
              />
            </div>

            <strong>
              Nenhum dispositivo
              cadastrado
            </strong>

            <span>
              Os dispositivos
              aparecerão aqui após o
              primeiro login em um APK.
            </span>
          </div>
        ) : filteredDevices.length ===
          0 ? (
          <div
            className={
              styles.empty
            }
          >
            <div
              className={
                styles.emptyIcon
              }
            >
              <Search
                size={26}
              />
            </div>

            <strong>
              Nenhum dispositivo
              encontrado
            </strong>

            <span>
              Altere o termo de busca
              ou os filtros
              selecionados.
            </span>

            <Link
              href="/devices"
              className={
                styles.emptyButton
              }
            >
              Limpar filtros
            </Link>
          </div>
        ) : (
          <div
            className={
              styles.table
            }
          >
            <div
              className={
                styles.tableHeader
              }
            >
              <span>
                Dispositivo
              </span>

              <span>
                Usuário
              </span>

              <span>
                Projeto
              </span>

              <span>
                Último acesso
              </span>

              <span>
                Status
              </span>

              <span>
                Ações
              </span>
            </div>

            <div
              className={
                styles.tableBody
              }
            >
              {filteredDevices.map(
                (device) => {
                  const recent =
                    accessedRecently(
                      device.lastAccessAt,
                    );

                  return (
                    <div
                      key={device.id}
                      className={`${styles.tableRow} ${device.active
                          ? styles.rowActive
                          : styles.rowInactive
                        }`}
                    >
                      <div
                        className={
                          styles.deviceCell
                        }
                      >
                        <div
                          className={
                            styles.deviceAvatar
                          }
                        >
                          <MonitorSmartphone
                            size={
                              18
                            }
                          />
                        </div>

                        <div
                          className={
                            styles.deviceInfo
                          }
                        >
                          <strong>
                            {device.deviceName ||
                              "Sem nome"}
                          </strong>

                          <small>
                            {
                              device.deviceId
                            }
                          </small>
                        </div>
                      </div>

                      <div
                        className={
                          styles.dataCell
                        }
                        data-label="Usuário"
                      >
                        <strong
                          className={
                            styles.userName
                          }
                        >
                          {
                            device.apkUser
                              .name
                          }
                        </strong>

                        <small
                          className={
                            styles.userLogin
                          }
                        >
                          @
                          {
                            device.apkUser
                              .username
                          }
                        </small>
                      </div>

                      <div
                        className={
                          styles.dataCell
                        }
                        data-label="Projeto"
                      >
                        <strong
                          className={
                            styles.projectName
                          }
                        >
                          {
                            device.apkUser
                              .project.name
                          }
                        </strong>

                        <small
                          className={
                            styles.projectSlug
                          }
                        >
                          {
                            device.apkUser
                              .project.slug
                          }
                        </small>
                      </div>

                      <div
                        className={
                          styles.dataCell
                        }
                        data-label="Último acesso"
                      >
                        <span
                          className={
                            styles.accessDate
                          }
                        >
                          {formatDate(
                            device.lastAccessAt,
                          )}
                        </span>

                        {recent && (
                          <small
                            className={
                              styles.recentAccess
                            }
                          >
                            Acesso recente
                          </small>
                        )}
                      </div>

                      <div
                        className={
                          styles.statusCell
                        }
                        data-label="Status"
                      >
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

                      <div
                        className={
                          styles.actions
                        }
                        data-label="Ações"
                      >
                        <Link
                          href={`/apk-users/${device.apkUser.id}`}
                          className={
                            styles.viewButton
                          }
                          title="Ver usuário"
                          aria-label="Ver usuário"
                        >
                          <Eye
                            size={
                              17
                            }
                            strokeWidth={
                              2.3
                            }
                          />
                        </Link>

                        <ToggleDeviceStatusButton
                          deviceId={
                            device.id
                          }
                          active={
                            device.active
                          }
                          deviceName={
                            device.deviceName ||
                            device.deviceId
                          }
                        />

                        <DeleteDeviceButton
                          deviceId={
                            device.id
                          }
                          deviceName={
                            device.deviceName ||
                            device.deviceId
                          }
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}
      </section>
    </AdminShell>
  );
}