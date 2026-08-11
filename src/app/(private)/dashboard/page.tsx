// src/app/(private)/dashboard/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../../../components/layout/AdminShell/AdminShell";
import { getAdminSession } from "../../../lib/auth/session";
import { prisma } from "../../../lib/prisma";
import styles from "./styles.module.scss";

type DashboardUser = {
  id: string;
  name: string;
  active: boolean;
  expiresAt: Date | null;
  project: {
    name: string;
    slug: string;
  };
  _count: {
    devices: number;
  };
};

type RecentDevice = {
  id: string;
  apkUserId: string;
  deviceName: string | null;
  active: boolean;
  lastAccessAt: Date | null;
  apkUser: {
    name: string;
    username: string;
    project: {
      name: string;
    };
  };
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Sem vencimento";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatDateTime(date: Date | null) {
  if (!date) {
    return "Sem acesso";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getDaysToExpire(date: Date | null) {
  if (!date) {
    return null;
  }

  const now = new Date();
  const diff = date.getTime() - now.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const now = new Date();

  const [projectsCount, users, devicesCount, recentDevices] =
    (await Promise.all([
      prisma.appProject.count(),

      prisma.apkUser.findMany({
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

        orderBy: {
          expiresAt: "asc",
        },
      }),

      prisma.device.count(),

      prisma.device.findMany({
        take: 5,

        orderBy: {
          lastAccessAt: "desc",
        },

        include: {
          apkUser: {
            select: {
              name: true,
              username: true,

              project: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ])) as [
      number,
      DashboardUser[],
      number,
      RecentDevice[],
    ];

  const typedUsers = users as DashboardUser[];

  const typedRecentDevices =
    recentDevices as RecentDevice[];

  const activeLicenses = typedUsers.filter(
    (user) =>
      user.active &&
      (!user.expiresAt || user.expiresAt >= now),
  ).length;

  const expiredLicenses = typedUsers.filter(
    (user) =>
      !!user.expiresAt &&
      user.expiresAt < now,
  ).length;

  const blockedLicenses = typedUsers.filter(
    (user) => !user.active,
  ).length;

  const licensesExpiringSoon =
    typedUsers
      .filter((user) => {
        const days =
          getDaysToExpire(
            user.expiresAt,
          );

        return (
          user.active &&
          days !== null &&
          days >= 0 &&
          days <= 30
        );
      })
      .slice(0, 5);

  const activeDevices =
    typedRecentDevices.filter(
      (device) => device.active,
    ).length;

  return (
    <AdminShell>
      <section className={styles.hero}>
        <div className={styles.heroInfo}>
          <div className={styles.heroTop}>
            <span className={styles.badge}>
              Painel de controle
            </span>

            <span className={styles.onlineBadge}>
              <span />
              Sistema operacional
            </span>
          </div>

          <h1 className={styles.title}>
            Visão geral
          </h1>

          <p className={styles.subtitle}>
            Controle seus aplicativos,
            licenças, usuários e
            dispositivos em um único
            lugar.
          </p>

          <div className={styles.heroActions}>
            <Link
              href="/apk-users"
              className={
                styles.primaryButton
              }
            >
              Gerenciar usuários
              <span>→</span>
            </Link>

            <Link
              href="/projects"
              className={
                styles.secondaryButton
              }
            >
              Ver projetos
            </Link>
          </div>
        </div>

        <div
          className={
            styles.heroSummary
          }
        >
          <span
            className={
              styles.summaryLabel
            }
          >
            LICENÇAS LIBERADAS
          </span>

          <div
            className={
              styles.summaryNumber
            }
          >
            {activeLicenses}
          </div>

          <p>
            usuários com acesso ativo
            neste momento
          </p>

          <div
            className={
              styles.summaryFooter
            }
          >
            <div>
              <span>Projetos</span>
              <strong>
                {projectsCount}
              </strong>
            </div>

            <div>
              <span>Usuários</span>
              <strong>
                {typedUsers.length}
              </strong>
            </div>

            <div>
              <span>Devices</span>
              <strong>
                {devicesCount}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.statsGrid}>
        <Link
          href="/projects"
          className={`${styles.statCard} ${styles.projectsCard}`}
        >
          <div
            className={
              styles.statHeader
            }
          >
            <div
              className={
                styles.statIcon
              }
            >
              ◈
            </div>

            <span
              className={
                styles.statArrow
              }
            >
              ↗
            </span>
          </div>

          <div>
            <span
              className={
                styles.statLabel
              }
            >
              Projetos APK
            </span>

            <strong>
              {projectsCount}
            </strong>

            <small>
              Aplicativos cadastrados
            </small>
          </div>
        </Link>

        <Link
          href="/licenses"
          className={`${styles.statCard} ${styles.successCard}`}
        >
          <div
            className={
              styles.statHeader
            }
          >
            <div
              className={
                styles.statIcon
              }
            >
              ✓
            </div>

            <span
              className={
                styles.statArrow
              }
            >
              ↗
            </span>
          </div>

          <div>
            <span
              className={
                styles.statLabel
              }
            >
              Licenças ativas
            </span>

            <strong>
              {activeLicenses}
            </strong>

            <small>
              Acessos liberados
            </small>
          </div>
        </Link>

        <Link
          href="/licenses"
          className={`${styles.statCard} ${styles.dangerCard}`}
        >
          <div
            className={
              styles.statHeader
            }
          >
            <div
              className={
                styles.statIcon
              }
            >
              !
            </div>

            <span
              className={
                styles.statArrow
              }
            >
              ↗
            </span>
          </div>

          <div>
            <span
              className={
                styles.statLabel
              }
            >
              Licenças vencidas
            </span>

            <strong>
              {expiredLicenses}
            </strong>

            <small>
              Necessitam atenção
            </small>
          </div>
        </Link>

        <Link
          href="/devices"
          className={`${styles.statCard} ${styles.devicesCard}`}
        >
          <div
            className={
              styles.statHeader
            }
          >
            <div
              className={
                styles.statIcon
              }
            >
              ▣
            </div>

            <span
              className={
                styles.statArrow
              }
            >
              ↗
            </span>
          </div>

          <div>
            <span
              className={
                styles.statLabel
              }
            >
              Dispositivos
            </span>

            <strong>
              {devicesCount}
            </strong>

            <small>
              Aparelhos vinculados
            </small>
          </div>
        </Link>
      </section>

      <section
        className={styles.infoStrip}
      >
        <div
          className={styles.infoItem}
        >
          <div
            className={
              styles.infoIcon
            }
          >
            👤
          </div>

          <div>
            <span>
              Usuários APK
            </span>

            <strong>
              {typedUsers.length}
            </strong>
          </div>
        </div>

        <div
          className={styles.infoItem}
        >
          <div
            className={
              styles.infoIcon
            }
          >
            🔒
          </div>

          <div>
            <span>
              Bloqueados
            </span>

            <strong>
              {blockedLicenses}
            </strong>
          </div>
        </div>

        <div
          className={styles.infoItem}
        >
          <div
            className={
              styles.infoIcon
            }
          >
            ⏱
          </div>

          <div>
            <span>
              Vencem em 30 dias
            </span>

            <strong>
              {
                licensesExpiringSoon.length
              }
            </strong>
          </div>
        </div>

        <div
          className={styles.infoItem}
        >
          <div
            className={
              styles.infoIcon
            }
          >
            ●
          </div>

          <div>
            <span>
              Devices ativos recentes
            </span>

            <strong>
              {activeDevices}
            </strong>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.panel}>
          <div
            className={
              styles.panelHeader
            }
          >
            <div>
              <span
                className={
                  styles.panelEyebrow
                }
              >
                Licenças
              </span>

              <h2>
                Próximas do vencimento
              </h2>

              <p>
                Licenças que vencem nos
                próximos 30 dias.
              </p>
            </div>

            <Link
              href="/licenses"
              className={
                styles.panelLink
              }
            >
              Ver todas
              <span>→</span>
            </Link>
          </div>

          {licensesExpiringSoon.length ===
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
                ✓
              </div>

              <strong>
                Tudo certo por aqui
              </strong>

              <p>
                Nenhuma licença vence
                nos próximos 30 dias.
              </p>
            </div>
          ) : (
            <div
              className={styles.list}
            >
              {licensesExpiringSoon.map(
                (user) => {
                  const days =
                    getDaysToExpire(
                      user.expiresAt,
                    );

                  return (
                    <Link
                      key={user.id}
                      href={`/apk-users/${user.id}`}
                      className={
                        styles.listItem
                      }
                    >
                      <div
                        className={
                          styles.listAvatar
                        }
                      >
                        {user.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div
                        className={
                          styles.listContent
                        }
                      >
                        <strong>
                          {user.name}
                        </strong>

                        <small>
                          {
                            user.project
                              .name
                          }
                          {" • "}
                          {formatDate(
                            user.expiresAt,
                          )}
                        </small>
                      </div>

                      <span
                        className={
                          styles.warningStatus
                        }
                      >
                        {days === 0
                          ? "Hoje"
                          : `${days} dias`}
                      </span>
                    </Link>
                  );
                },
              )}
            </div>
          )}
        </div>

        <div className={styles.panel}>
          <div
            className={
              styles.panelHeader
            }
          >
            <div>
              <span
                className={
                  styles.panelEyebrow
                }
              >
                Dispositivos
              </span>

              <h2>
                Atividade recente
              </h2>

              <p>
                Últimos dispositivos que
                acessaram os aplicativos.
              </p>
            </div>

            <Link
              href="/devices"
              className={
                styles.panelLink
              }
            >
              Ver todos
              <span>→</span>
            </Link>
          </div>

          {typedRecentDevices.length ===
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
                ▣
              </div>

              <strong>
                Nenhum dispositivo
              </strong>

              <p>
                Ainda não existem
                dispositivos cadastrados.
              </p>
            </div>
          ) : (
            <div
              className={styles.list}
            >
              {typedRecentDevices.map(
                (device) => (
                  <Link
                    key={device.id}
                    href={`/apk-users/${device.apkUserId}`}
                    className={
                      styles.listItem
                    }
                  >
                    <div
                      className={
                        styles.deviceIcon
                      }
                    >
                      ◫
                    </div>

                    <div
                      className={
                        styles.listContent
                      }
                    >
                      <strong>
                        {device.deviceName ||
                          "Sem nome"}
                      </strong>

                      <small>
                        {
                          device.apkUser
                            .name
                        }
                        {" • "}
                        {
                          device.apkUser
                            .project.name
                        }
                      </small>

                      <span
                        className={
                          styles.accessTime
                        }
                      >
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
                  </Link>
                ),
              )}
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}