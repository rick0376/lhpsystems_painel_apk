// src/app/(private)/apk-users/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowUpDown,
  Clock3,
  Eye,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

import { DeleteApkUserButton } from "../../../components/apk-users/DeleteApkUserButton/DeleteApkUserButton";
import { ToggleApkUserStatusButton } from "../../../components/apk-users/ToggleApkUserStatusButton/ToggleApkUserStatusButton";
import { AdminShell } from "../../../components/layout/AdminShell/AdminShell";
import { getAdminSession } from "../../../lib/auth/session";
import { prisma } from "../../../lib/prisma";

import styles from "./styles.module.scss";

type ApkUserListItem = {
  id: string;
  name: string;
  username: string;
  active: boolean;
  expiresAt: Date | null;
  maxDevices: number;
  createdAt: Date;

  project: {
    name: string;
    slug: string;
  };

  _count: {
    devices: number;
  };
};

type SortOption =
  | "created_desc"
  | "created_asc"
  | "name_asc"
  | "name_desc"
  | "expires_asc"
  | "expires_desc"
  | "project_asc";

type StatusFilter =
  | "all"
  | "active"
  | "expired"
  | "blocked";

type ApkUsersPageProps = {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    status?: string;
  }>;
};

const SORT_OPTIONS: SortOption[] = [
  "created_desc",
  "created_asc",
  "name_asc",
  "name_desc",
  "expires_asc",
  "expires_desc",
  "project_asc",
];

const STATUS_OPTIONS: StatusFilter[] = [
  "all",
  "active",
  "expired",
  "blocked",
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

function isExpired(
  date: Date | null,
) {
  if (!date) {
    return false;
  }

  return date < new Date();
}

function getDaysToExpire(
  date: Date | null,
) {
  if (!date) {
    return null;
  }

  const now = new Date();

  const diff =
    date.getTime() -
    now.getTime();

  return Math.ceil(
    diff /
    (1000 * 60 * 60 * 24),
  );
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

function isSortOption(
  value: string,
): value is SortOption {
  return SORT_OPTIONS.includes(
    value as SortOption,
  );
}

function isStatusFilter(
  value: string,
): value is StatusFilter {
  return STATUS_OPTIONS.includes(
    value as StatusFilter,
  );
}

function getUserStatus(
  user: ApkUserListItem,
) {
  if (!user.active) {
    return "blocked";
  }

  if (
    isExpired(
      user.expiresAt,
    )
  ) {
    return "expired";
  }

  return "active";
}

function compareExpiration(
  a: ApkUserListItem,
  b: ApkUserListItem,
  direction:
    | "asc"
    | "desc",
) {
  if (
    !a.expiresAt &&
    !b.expiresAt
  ) {
    return 0;
  }

  if (!a.expiresAt) {
    return 1;
  }

  if (!b.expiresAt) {
    return -1;
  }

  if (
    direction === "asc"
  ) {
    return (
      a.expiresAt.getTime() -
      b.expiresAt.getTime()
    );
  }

  return (
    b.expiresAt.getTime() -
    a.expiresAt.getTime()
  );
}

export default async function ApkUsersPage({
  searchParams,
}: ApkUsersPageProps) {
  const session =
    await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const params =
    await searchParams;

  const query =
    typeof params.q ===
      "string"
      ? params.q.trim()
      : "";

  const sort: SortOption =
    typeof params.sort ===
      "string" &&
      isSortOption(
        params.sort,
      )
      ? params.sort
      : "created_desc";

  const statusFilter: StatusFilter =
    typeof params.status ===
      "string" &&
      isStatusFilter(
        params.status,
      )
      ? params.status
      : "all";

  const allUsers =
    (await prisma.apkUser.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        project: {
          select: {
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
    })) as ApkUserListItem[];

  const activeUsers =
    allUsers.filter(
      (user) =>
        user.active &&
        !isExpired(
          user.expiresAt,
        ),
    ).length;

  const expiredUsers =
    allUsers.filter(
      (user) =>
        isExpired(
          user.expiresAt,
        ),
    ).length;

  const blockedUsers =
    allUsers.filter(
      (user) =>
        !user.active,
    ).length;

  const totalDevices =
    allUsers.reduce(
      (total, user) =>
        total +
        user._count.devices,
      0,
    );

  const normalizedQuery =
    normalizeText(query);

  let users =
    allUsers.filter(
      (user) => {
        const matchesSearch =
          !normalizedQuery ||
          normalizeText(
            user.name,
          ).includes(
            normalizedQuery,
          ) ||
          normalizeText(
            user.username,
          ).includes(
            normalizedQuery,
          ) ||
          normalizeText(
            user.project.name,
          ).includes(
            normalizedQuery,
          ) ||
          normalizeText(
            user.project.slug,
          ).includes(
            normalizedQuery,
          );

        const currentStatus =
          getUserStatus(user);

        const matchesStatus =
          statusFilter ===
          "all" ||
          currentStatus ===
          statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      },
    );

  users = [...users].sort(
    (a, b) => {
      switch (sort) {
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

        case "expires_asc":
          return compareExpiration(
            a,
            b,
            "asc",
          );

        case "expires_desc":
          return compareExpiration(
            a,
            b,
            "desc",
          );

        case "project_asc":
          return (
            a.project.name.localeCompare(
              b.project.name,
              "pt-BR",
              {
                sensitivity:
                  "base",
              },
            ) ||
            a.name.localeCompare(
              b.name,
              "pt-BR",
              {
                sensitivity:
                  "base",
              },
            )
          );

        case "created_asc":
          return (
            a.createdAt.getTime() -
            b.createdAt.getTime()
          );

        case "created_desc":
        default:
          return (
            b.createdAt.getTime() -
            a.createdAt.getTime()
          );
      }
    },
  );

  const hasFilters =
    query.length > 0 ||
    sort !==
    "created_desc" ||
    statusFilter !== "all";

  return (
    <AdminShell>
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
            Usuários APK
          </h1>

          <p
            className={
              styles.subtitle
            }
          >
            Gerencie usuários,
            licenças e
            dispositivos
            autorizados em seus
            aplicativos.
          </p>
        </div>

        <Link
          href="/apk-users/new"
          className={
            styles.newButton
          }
        >
          <Plus
            size={18}
            strokeWidth={2.5}
          />

          Novo usuário
        </Link>
      </section>

      <section
        className={
          styles.summaryGrid
        }
      >
        <div
          className={
            styles.summaryCard
          }
        >
          <div
            className={
              styles.summaryIcon
            }
          >
            <Users size={20} />
          </div>

          <div>
            <span>
              Total de usuários
            </span>

            <strong>
              {allUsers.length}
            </strong>

            <small>
              Todos os aplicativos
            </small>
          </div>
        </div>

        <div
          className={
            styles.summaryCard
          }
        >
          <div
            className={`${styles.summaryIcon} ${styles.activeIcon}`}
          >
            <ShieldCheck
              size={20}
            />
          </div>

          <div>
            <span>
              Acessos ativos
            </span>

            <strong>
              {activeUsers}
            </strong>

            <small>
              Licenças liberadas
            </small>
          </div>
        </div>

        <div
          className={
            styles.summaryCard
          }
        >
          <div
            className={`${styles.summaryIcon} ${styles.expiredIcon}`}
          >
            <Clock3 size={20} />
          </div>

          <div>
            <span>
              Licenças vencidas
            </span>

            <strong>
              {expiredUsers}
            </strong>

            <small>
              Fora do período de uso
            </small>
          </div>
        </div>

        <div
          className={
            styles.summaryCard
          }
        >
          <div
            className={`${styles.summaryIcon} ${styles.deviceIcon}`}
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
              {totalDevices}
            </strong>

            <small>
              Aparelhos vinculados
            </small>
          </div>
        </div>
      </section>

      <section
        className={
          styles.toolbarCard
        }
      >
        <form
          className={
            styles.toolbar
          }
          method="get"
        >
          <div
            className={
              styles.searchField
            }
          >
            <Search
              size={18}
            />

            <input
              type="search"
              name="q"
              defaultValue={
                query
              }
              placeholder="Buscar por nome, usuário ou projeto..."
            />
          </div>

          <div
            className={
              styles.filterGroup
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

                <option value="expired">
                  Vencidos
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
                  size={16}
                />

                <select
                  name="sort"
                  defaultValue={
                    sort
                  }
                >
                  <option value="created_desc">
                    Mais recentes
                  </option>

                  <option value="created_asc">
                    Mais antigos
                  </option>

                  <option value="name_asc">
                    Nome A → Z
                  </option>

                  <option value="name_desc">
                    Nome Z → A
                  </option>

                  <option value="expires_asc">
                    Validade mais próxima
                  </option>

                  <option value="expires_desc">
                    Validade mais distante
                  </option>

                  <option value="project_asc">
                    Projeto A → Z
                  </option>
                </select>
              </div>
            </label>

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
                href="/apk-users"
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
            styles.resultsInfo
          }
        >
          <span>
            Exibindo{" "}
            <strong>
              {users.length}
            </strong>{" "}
            de{" "}
            <strong>
              {allUsers.length}
            </strong>{" "}
            usuário(s)
          </span>

          {query && (
            <span>
              Busca:{" "}
              <strong>
                {query}
              </strong>
            </span>
          )}
        </div>
      </section>

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
              Licenças
            </span>

            <h2>
              Usuários cadastrados
            </h2>

            <p>
              Consulte projeto,
              validade, dispositivos
              e situação de cada
              acesso.
            </p>
          </div>

          <div
            className={
              styles.headerNumbers
            }
          >
            <span>
              <strong>
                {activeUsers}
              </strong>
              ativos
            </span>

            <span>
              <strong>
                {blockedUsers}
              </strong>
              bloqueados
            </span>
          </div>
        </div>

        {allUsers.length ===
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
              <Users size={26} />
            </div>

            <strong>
              Nenhum usuário
              cadastrado
            </strong>

            <span>
              Crie um usuário para
              liberar acesso a um
              APK.
            </span>

            <Link
              href="/apk-users/new"
              className={
                styles.emptyButton
              }
            >
              <Plus size={17} />
              Criar usuário
            </Link>
          </div>
        ) : users.length ===
          0 ? (
          <div
            className={
              styles.noResults
            }
          >
            <div
              className={
                styles.emptyIcon
              }
            >
              <Search
                size={24}
              />
            </div>

            <strong>
              Nenhum resultado
              encontrado
            </strong>

            <span>
              Altere a busca ou os
              filtros utilizados.
            </span>

            <Link
              href="/apk-users"
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
              <span>Usuário</span>
              <span>Projeto</span>
              <span>Validade</span>
              <span>
                Dispositivos
              </span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            <div
              className={
                styles.tableBody
              }
            >
              {users.map(
                (user) => {
                  const expired =
                    isExpired(
                      user.expiresAt,
                    );

                  const days =
                    getDaysToExpire(
                      user.expiresAt,
                    );

                  const status =
                    getUserStatus(
                      user,
                    );

                  return (
                    <div
                      key={
                        user.id
                      }
                      className={
                        styles.tableRow
                      }
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
                            .charAt(
                              0,
                            )
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
                        data-label="Validade"
                      >
                        <span
                          className={
                            expired
                              ? styles.expiredDate
                              : styles.date
                          }
                        >
                          {formatDate(
                            user.expiresAt,
                          )}
                        </span>

                        {user.expiresAt &&
                          !expired &&
                          days !==
                          null &&
                          days <=
                          30 && (
                            <small
                              className={
                                styles.expiringSoon
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
                            styles.deviceCount
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
                        {status ===
                          "active" && (
                            <span
                              className={
                                styles.active
                              }
                            >
                              <i />
                              Ativo
                            </span>
                          )}

                        {status ===
                          "expired" && (
                            <span
                              className={
                                styles.expired
                              }
                            >
                              <i />
                              Vencida
                            </span>
                          )}

                        {status ===
                          "blocked" && (
                            <span
                              className={
                                styles.inactive
                              }
                            >
                              <i />
                              Bloqueado
                            </span>
                          )}
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
                          title="Editar usuário"
                          aria-label="Editar usuário"
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

                        <ToggleApkUserStatusButton
                          userId={
                            user.id
                          }
                          active={
                            user.active
                          }
                        />

                        <DeleteApkUserButton
                          userId={
                            user.id
                          }
                          userName={
                            user.name
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