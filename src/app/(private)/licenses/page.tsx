// src/app/(private)/licenses/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowUpDown,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  Pencil,
  Search,
  Smartphone,
  Users,
} from "lucide-react";

import { AdminShell } from "../../../components/layout/AdminShell/AdminShell";
import { getAdminSession } from "../../../lib/auth/session";
import { prisma } from "../../../lib/prisma";

import styles from "./styles.module.scss";

type LicenseUser = {
  id: string;
  name: string;
  username: string;
  active: boolean;
  expiresAt: Date | null;
  maxDevices: number;

  project: {
    id: string;
    name: string;
    slug: string;
  };

  _count: {
    devices: number;
  };
};

type LicenseStatus = {
  label: string;
  type:
  | "active"
  | "expired"
  | "inactive";
};

type LicenseFilter =
  | "all"
  | "active"
  | "expired"
  | "blocked"
  | "expiring"
  | "no_expiration";

type LicenseSort =
  | "expires_asc"
  | "expires_desc"
  | "name_asc"
  | "name_desc"
  | "project_asc"
  | "project_desc"
  | "devices_desc";

type LicensesPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
  }>;
};

const LICENSE_FILTERS: LicenseFilter[] = [
  "all",
  "active",
  "expired",
  "blocked",
  "expiring",
  "no_expiration",
];

const LICENSE_SORTS: LicenseSort[] = [
  "expires_asc",
  "expires_desc",
  "name_asc",
  "name_desc",
  "project_asc",
  "project_desc",
  "devices_desc",
];

function formatDate(
  date: Date | null,
) {
  if (!date) {
    return "Sem vencimento";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(date);
}

function getDaysToExpire(
  date: Date | null,
) {
  if (!date) {
    return null;
  }

  const now =
    new Date();

  const diff =
    date.getTime() -
    now.getTime();

  return Math.ceil(
    diff /
    (1000 *
      60 *
      60 *
      24),
  );
}

function getLicenseStatus(
  user: LicenseUser,
): LicenseStatus {
  const now =
    new Date();

  if (!user.active) {
    return {
      label: "Bloqueada",
      type: "inactive",
    };
  }

  if (
    user.expiresAt &&
    user.expiresAt < now
  ) {
    return {
      label: "Vencida",
      type: "expired",
    };
  }

  return {
    label: "Ativa",
    type: "active",
  };
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

function isLicenseFilter(
  value: string,
): value is LicenseFilter {
  return LICENSE_FILTERS.includes(
    value as LicenseFilter,
  );
}

function isLicenseSort(
  value: string,
): value is LicenseSort {
  return LICENSE_SORTS.includes(
    value as LicenseSort,
  );
}

function compareExpiration(
  a: Date | null,
  b: Date | null,
  direction:
    | "asc"
    | "desc",
) {
  if (!a && !b) {
    return 0;
  }

  /*
   * Licenças sem vencimento
   * ficam no final.
   */
  if (!a) {
    return 1;
  }

  if (!b) {
    return -1;
  }

  if (
    direction === "desc"
  ) {
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

export default async function LicensesPage({
  searchParams,
}: LicensesPageProps) {
  const session =
    await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const params =
    await searchParams;

  const search =
    typeof params.q ===
      "string"
      ? params.q.trim()
      : "";

  const statusFilter: LicenseFilter =
    typeof params.status ===
      "string" &&
      isLicenseFilter(
        params.status,
      )
      ? params.status
      : "all";

  const sort: LicenseSort =
    typeof params.sort ===
      "string" &&
      isLicenseSort(
        params.sort,
      )
      ? params.sort
      : "expires_asc";

  /*
   * =====================================================
   * CARREGA TODAS AS LICENÇAS
   * =====================================================
   */

  const users =
    (await prisma.apkUser.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        _count: {
          select: {
            devices: true,
          },
        },
      },
    })) as LicenseUser[];

  const now =
    new Date();

  /*
   * =====================================================
   * RESUMO GERAL
   * =====================================================
   */

  const activeLicenses =
    users.filter(
      (user) =>
        user.active &&
        (!user.expiresAt ||
          user.expiresAt >=
          now),
    ).length;

  const expiredLicenses =
    users.filter(
      (user) =>
        Boolean(
          user.expiresAt &&
          user.expiresAt <
          now,
        ),
    ).length;

  const blockedLicenses =
    users.filter(
      (user) =>
        !user.active,
    ).length;

  const expiringSoon =
    users.filter(
      (user) => {
        if (
          !user.active ||
          !user.expiresAt
        ) {
          return false;
        }

        const days =
          getDaysToExpire(
            user.expiresAt,
          );

        return (
          days !== null &&
          days >= 0 &&
          days <= 30
        );
      },
    ).length;

  const totalDevices =
    users.reduce(
      (
        total,
        user,
      ) =>
        total +
        user._count.devices,
      0,
    );

  /*
   * =====================================================
   * BUSCA
   * =====================================================
   */

  const normalizedSearch =
    normalizeText(search);

  let filteredUsers =
    users.filter(
      (user) => {
        const status =
          getLicenseStatus(
            user,
          );

        const days =
          getDaysToExpire(
            user.expiresAt,
          );

        const matchesSearch =
          !normalizedSearch ||
          normalizeText(
            user.name,
          ).includes(
            normalizedSearch,
          ) ||
          normalizeText(
            user.username,
          ).includes(
            normalizedSearch,
          ) ||
          normalizeText(
            user.project.name,
          ).includes(
            normalizedSearch,
          ) ||
          normalizeText(
            user.project.slug,
          ).includes(
            normalizedSearch,
          );

        let matchesStatus =
          true;

        switch (
        statusFilter
        ) {
          case "active":
            matchesStatus =
              status.type ===
              "active";

            break;

          case "expired":
            matchesStatus =
              status.type ===
              "expired";

            break;

          case "blocked":
            matchesStatus =
              status.type ===
              "inactive";

            break;

          case "expiring":
            matchesStatus =
              status.type ===
              "active" &&
              days !== null &&
              days >= 0 &&
              days <= 30;

            break;

          case "no_expiration":
            matchesStatus =
              !user.expiresAt;

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

  filteredUsers = [
    ...filteredUsers,
  ].sort((a, b) => {
    switch (sort) {
      case "expires_desc":
        return compareExpiration(
          a.expiresAt,
          b.expiresAt,
          "desc",
        );

      case "name_asc":
        return a.name.localeCompare(
          b.name,
          "pt-BR",
          {
            sensitivity:
              "base",
          },
        );

      case "name_desc":
        return b.name.localeCompare(
          a.name,
          "pt-BR",
          {
            sensitivity:
              "base",
          },
        );

      case "project_asc":
        return a.project.name.localeCompare(
          b.project.name,
          "pt-BR",
          {
            sensitivity:
              "base",
          },
        );

      case "project_desc":
        return b.project.name.localeCompare(
          a.project.name,
          "pt-BR",
          {
            sensitivity:
              "base",
          },
        );

      case "devices_desc":
        return (
          b._count.devices -
          a._count.devices
        );

      case "expires_asc":
      default:
        return compareExpiration(
          a.expiresAt,
          b.expiresAt,
          "asc",
        );
    }
  });

  const hasFilters =
    search.length > 0 ||
    statusFilter !==
    "all" ||
    sort !== "expires_asc";

  return (
    <AdminShell>
      {/* ===================================================
          CABEÇALHO
      =================================================== */}

      <section
        className={
          styles.header
        }
      >
        <div>
          <span
            className={
              styles.badge
            }
          >
            Controle de acesso
          </span>

          <h1
            className={
              styles.title
            }
          >
            Licenças
          </h1>

          <p
            className={
              styles.subtitle
            }
          >
            Acompanhe validade,
            status, dispositivos e
            usuários vinculados aos
            seus aplicativos.
          </p>
        </div>

        <div
          className={
            styles.headerStatus
          }
        >
          <CheckCircle2
            size={19}
          />

          <div>
            <strong>
              {
                activeLicenses
              }
            </strong>

            <span>
              licenças ativas
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
          className={`${styles.summaryCard} ${styles.activeCard}`}
        >
          <div
            className={`${styles.summaryIcon} ${styles.activeIcon}`}
          >
            <CheckCircle2
              size={21}
            />
          </div>

          <div>
            <span>
              Licenças ativas
            </span>

            <strong>
              {
                activeLicenses
              }
            </strong>

            <small>
              Acessos liberados
            </small>
          </div>
        </div>

        <div
          className={`${styles.summaryCard} ${styles.expiredCard}`}
        >
          <div
            className={`${styles.summaryIcon} ${styles.expiredIcon}`}
          >
            <Clock3
              size={21}
            />
          </div>

          <div>
            <span>
              Licenças vencidas
            </span>

            <strong>
              {
                expiredLicenses
              }
            </strong>

            <small>
              Fora do prazo
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
              Bloqueadas
            </span>

            <strong>
              {
                blockedLicenses
              }
            </strong>

            <small>
              Acesso desativado
            </small>
          </div>
        </div>

        <div
          className={`${styles.summaryCard} ${styles.warningCard}`}
        >
          <div
            className={`${styles.summaryIcon} ${styles.warningIcon}`}
          >
            <CalendarClock
              size={21}
            />
          </div>

          <div>
            <span>
              Vencem em 30 dias
            </span>

            <strong>
              {
                expiringSoon
              }
            </strong>

            <small>
              Requerem atenção
            </small>
          </div>
        </div>
      </section>

      {/* ===================================================
          LICENÇAS
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
              Gerenciamento
            </span>

            <h2>
              Licenças cadastradas
            </h2>

            <p>
              Consulte validade,
              dispositivos e situação
              de cada acesso.
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

              {users.length}{" "}
              usuários
            </span>

            <span>
              <Smartphone
                size={14}
              />

              {totalDevices}{" "}
              devices
            </span>
          </div>
        </div>

        {/* =================================================
            BUSCA / FILTROS
        ================================================= */}

        {users.length >
          0 && (
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
                    Buscar licença
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
                      placeholder="Nome, login ou projeto..."
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
                      Todas as licenças
                    </option>

                    <option value="active">
                      Ativas
                    </option>

                    <option value="expired">
                      Vencidas
                    </option>

                    <option value="blocked">
                      Bloqueadas
                    </option>

                    <option value="expiring">
                      Vencem em 30 dias
                    </option>

                    <option value="no_expiration">
                      Sem vencimento
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
                      <option value="expires_asc">
                        Vencimento mais próximo
                      </option>

                      <option value="expires_desc">
                        Vencimento mais distante
                      </option>

                      <option value="name_asc">
                        Nome A → Z
                      </option>

                      <option value="name_desc">
                        Nome Z → A
                      </option>

                      <option value="project_asc">
                        Projeto A → Z
                      </option>

                      <option value="project_desc">
                        Projeto Z → A
                      </option>

                      <option value="devices_desc">
                        Mais dispositivos
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
                      href="/licenses"
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
                    filteredUsers.length
                  }
                </strong>{" "}
                de{" "}
                <strong>
                  {users.length}
                </strong>{" "}
                licença(s)
              </div>
            </div>
          )}

        {/* =================================================
            SEM LICENÇAS
        ================================================= */}

        {users.length ===
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
              <CalendarClock
                size={26}
              />
            </div>

            <strong>
              Nenhuma licença
              cadastrada
            </strong>

            <span>
              As licenças aparecerão
              aqui após cadastrar
              usuários APK.
            </span>
          </div>
        ) : filteredUsers.length ===
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
                size={25}
              />
            </div>

            <strong>
              Nenhuma licença
              encontrada
            </strong>

            <span>
              Altere o termo de busca
              ou os filtros
              selecionados.
            </span>

            <Link
              href="/licenses"
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
                Usuário
              </span>

              <span>
                Projeto
              </span>

              <span>
                Vencimento
              </span>

              <span>
                Dispositivos
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
              {filteredUsers.map(
                (user) => {
                  const status =
                    getLicenseStatus(
                      user,
                    );

                  const days =
                    getDaysToExpire(
                      user.expiresAt,
                    );

                  const rowClass =
                    status.type ===
                      "active"
                      ? styles.rowActive
                      : status.type ===
                        "expired"
                        ? styles.rowExpired
                        : styles.rowInactive;

                  return (
                    <div
                      key={
                        user.id
                      }
                      className={`${styles.tableRow} ${rowClass}`}
                    >
                      <div
                        className={
                          styles.userCell
                        }
                      >
                        <div
                          className={
                            styles.userAvatar
                          }
                        >
                          {user.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div
                          className={
                            styles.userInfo
                          }
                        >
                          <strong>
                            {
                              user.name
                            }
                          </strong>

                          <small>
                            @
                            {
                              user.username
                            }
                          </small>
                        </div>
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
                            user
                              .project
                              .name
                          }
                        </strong>

                        <small
                          className={
                            styles.projectSlug
                          }
                        >
                          {
                            user
                              .project
                              .slug
                          }
                        </small>
                      </div>

                      <div
                        className={
                          styles.dataCell
                        }
                        data-label="Vencimento"
                      >
                        <span
                          className={
                            status.type ===
                              "expired"
                              ? styles.expiredDate
                              : styles.date
                          }
                        >
                          {formatDate(
                            user.expiresAt,
                          )}
                        </span>

                        {status.type ===
                          "active" &&
                          days !==
                          null &&
                          days >=
                          0 &&
                          days <=
                          30 && (
                            <small
                              className={
                                styles.expiring
                              }
                            >
                              {days ===
                                0
                                ? "Vence hoje"
                                : `${days} dias restantes`}
                            </small>
                          )}
                      </div>

                      <div
                        className={
                          styles.dataCell
                        }
                        data-label="Dispositivos"
                      >
                        <span
                          className={
                            styles.devices
                          }
                        >
                          <Smartphone
                            size={
                              14
                            }
                          />

                          {
                            user
                              ._count
                              .devices
                          }

                          <small>
                            /{" "}
                            {
                              user.maxDevices
                            }
                          </small>
                        </span>
                      </div>

                      <div
                        className={
                          styles.statusCell
                        }
                        data-label="Status"
                      >
                        <span
                          className={
                            status.type ===
                              "active"
                              ? styles.active
                              : status.type ===
                                "expired"
                                ? styles.expired
                                : styles.inactive
                          }
                        >
                          <i />

                          {
                            status.label
                          }
                        </span>
                      </div>

                      <div
                        className={
                          styles.actions
                        }
                        data-label="Ações"
                      >
                        <Link
                          href={`/apk-users/${user.id}`}
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

                        <Link
                          href={`/apk-users/${user.id}/edit`}
                          className={
                            styles.editButton
                          }
                          title="Editar licença"
                          aria-label="Editar licença"
                        >
                          <Pencil
                            size={
                              17
                            }
                            strokeWidth={
                              2.3
                            }
                          />
                        </Link>
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