// src/app/(private)/licenses/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  Pencil,
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
  type: "active" | "expired" | "inactive";
};

function formatDate(date: Date | null) {
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

  const now = new Date();

  const diff =
    date.getTime() -
    now.getTime();

  return Math.ceil(
    diff /
    (1000 * 60 * 60 * 24),
  );
}

function getLicenseStatus(
  user: LicenseUser,
): LicenseStatus {
  const now = new Date();

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

export default async function LicensesPage() {
  const session =
    await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const users =
    (await prisma.apkUser.findMany({
      orderBy: {
        expiresAt: "asc",
      },

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

  const now = new Date();

  const activeLicenses =
    users.filter(
      (user) =>
        user.active &&
        (!user.expiresAt ||
          user.expiresAt >= now),
    ).length;

  const expiredLicenses =
    users.filter(
      (user) =>
        Boolean(
          user.expiresAt &&
          user.expiresAt < now,
        ),
    ).length;

  const blockedLicenses =
    users.filter(
      (user) => !user.active,
    ).length;

  const expiringSoon =
    users.filter((user) => {
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
    }).length;

  const totalDevices =
    users.reduce(
      (total, user) =>
        total +
        user._count.devices,
      0,
    );

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>
            Controle de acesso
          </span>

          <h1 className={styles.title}>
            Licenças
          </h1>

          <p className={styles.subtitle}>
            Acompanhe validade, status,
            dispositivos e usuários
            vinculados aos seus
            aplicativos.
          </p>
        </div>

        <div
          className={
            styles.headerStatus
          }
        >
          <CheckCircle2 size={17} />

          <div>
            <strong>
              {activeLicenses}
            </strong>

            <span>
              licenças ativas
            </span>
          </div>
        </div>
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
            className={`${styles.summaryIcon} ${styles.activeIcon}`}
          >
            <CheckCircle2
              size={20}
            />
          </div>

          <div>
            <span>
              Licenças ativas
            </span>

            <strong>
              {activeLicenses}
            </strong>

            <small>
              Acessos liberados
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
              {expiredLicenses}
            </strong>

            <small>
              Fora do prazo
            </small>
          </div>
        </div>

        <div
          className={
            styles.summaryCard
          }
        >
          <div
            className={`${styles.summaryIcon} ${styles.blockedIcon}`}
          >
            <Ban size={20} />
          </div>

          <div>
            <span>
              Bloqueadas
            </span>

            <strong>
              {blockedLicenses}
            </strong>

            <small>
              Acesso desativado
            </small>
          </div>
        </div>

        <div
          className={
            styles.summaryCard
          }
        >
          <div
            className={`${styles.summaryIcon} ${styles.warningIcon}`}
          >
            <CalendarClock
              size={20}
            />
          </div>

          <div>
            <span>
              Vencem em 30 dias
            </span>

            <strong>
              {expiringSoon}
            </strong>

            <small>
              Requerem atenção
            </small>
          </div>
        </div>
      </section>

      <section className={styles.card}>
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
              dispositivos e situação de
              cada acesso.
            </p>
          </div>

          <div
            className={
              styles.cardSummary
            }
          >
            <span>
              <Users size={14} />
              {users.length} usuários
            </span>

            <span>
              <Smartphone
                size={14}
              />
              {totalDevices} devices
            </span>
          </div>
        </div>

        {users.length === 0 ? (
          <div
            className={styles.empty}
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
        ) : (
          <div
            className={styles.table}
          >
            <div
              className={
                styles.tableHeader
              }
            >
              <span>Usuário</span>
              <span>Projeto</span>
              <span>Vencimento</span>
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
              {users.map((user) => {
                const status =
                  getLicenseStatus(
                    user,
                  );

                const days =
                  getDaysToExpire(
                    user.expiresAt,
                  );

                return (
                  <div
                    key={user.id}
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
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div
                        className={
                          styles.userInfo
                        }
                      >
                        <strong>
                          {user.name}
                        </strong>

                        <small>
                          @{user.username}
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
                          user.project
                            .name
                        }
                      </strong>

                      <small
                        className={
                          styles.projectSlug
                        }
                      >
                        {
                          user.project
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
                        days !== null &&
                        days >= 0 &&
                        days <= 30 && (
                          <small
                            className={
                              styles.expiring
                            }
                          >
                            {days === 0
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
                          size={14}
                        />

                        {
                          user._count
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
                        {status.label}
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
                          size={17}
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
                          size={17}
                          strokeWidth={
                            2.3
                          }
                        />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </AdminShell>
  );
}