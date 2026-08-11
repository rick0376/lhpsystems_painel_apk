// src/app/(private)/apk-users/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Clock3,
  Eye,
  Pencil,
  Plus,
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

  project: {
    name: string;
    slug: string;
  };

  _count: {
    devices: number;
  };
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Sem expiração";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function isExpired(date: Date | null) {
  if (!date) {
    return false;
  }

  return date < new Date();
}

function getDaysToExpire(date: Date | null) {
  if (!date) {
    return null;
  }

  const now = new Date();

  const diff =
    date.getTime() - now.getTime();

  return Math.ceil(
    diff / (1000 * 60 * 60 * 24),
  );
}

export default async function ApkUsersPage() {
  const session =
    await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const users =
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

  const activeUsers = users.filter(
    (user) =>
      user.active &&
      !isExpired(user.expiresAt),
  ).length;

  const expiredUsers = users.filter(
    (user) =>
      isExpired(user.expiresAt),
  ).length;

  const blockedUsers = users.filter(
    (user) => !user.active,
  ).length;

  const totalDevices = users.reduce(
    (total, user) =>
      total + user._count.devices,
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
            Usuários APK
          </h1>

          <p className={styles.subtitle}>
            Gerencie usuários, licenças e
            dispositivos autorizados em seus
            aplicativos.
          </p>
        </div>

        <Link
          href="/apk-users/new"
          className={styles.newButton}
        >
          <Plus
            size={18}
            strokeWidth={2.5}
          />

          Novo usuário
        </Link>
      </section>

      <section className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Users size={20} />
          </div>

          <div>
            <span>Total de usuários</span>
            <strong>{users.length}</strong>
            <small>
              Todos os aplicativos
            </small>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div
            className={`${styles.summaryIcon} ${styles.activeIcon}`}
          >
            <ShieldCheck size={20} />
          </div>

          <div>
            <span>Acessos ativos</span>
            <strong>{activeUsers}</strong>
            <small>
              Licenças liberadas
            </small>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div
            className={`${styles.summaryIcon} ${styles.expiredIcon}`}
          >
            <Clock3 size={20} />
          </div>

          <div>
            <span>Licenças vencidas</span>
            <strong>{expiredUsers}</strong>
            <small>
              Fora do período de uso
            </small>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div
            className={`${styles.summaryIcon} ${styles.deviceIcon}`}
          >
            <Smartphone size={20} />
          </div>

          <div>
            <span>Dispositivos</span>
            <strong>{totalDevices}</strong>
            <small>
              Aparelhos vinculados
            </small>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.eyebrow}>
              Licenças
            </span>

            <h2>
              Usuários cadastrados
            </h2>

            <p>
              Consulte projeto, validade,
              dispositivos e situação de cada
              acesso.
            </p>
          </div>

          <div className={styles.headerNumbers}>
            <span>
              <strong>{activeUsers}</strong>
              ativos
            </span>

            <span>
              <strong>{blockedUsers}</strong>
              bloqueados
            </span>
          </div>
        </div>

        {users.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Users size={26} />
            </div>

            <strong>
              Nenhum usuário cadastrado
            </strong>

            <span>
              Crie um usuário para liberar
              acesso a um APK.
            </span>

            <Link
              href="/apk-users/new"
              className={styles.emptyButton}
            >
              <Plus size={17} />
              Criar usuário
            </Link>
          </div>
        ) : (
          <div className={styles.table}>
            <div
              className={
                styles.tableHeader
              }
            >
              <span>Usuário</span>
              <span>Projeto</span>
              <span>Validade</span>
              <span>Dispositivos</span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            <div className={styles.tableBody}>
              {users.map((user) => {
                const expired =
                  isExpired(
                    user.expiresAt,
                  );

                const days =
                  getDaysToExpire(
                    user.expiresAt,
                  );

                const status =
                  !user.active
                    ? "blocked"
                    : expired
                      ? "expired"
                      : "active";

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
                        {user.project.name}
                      </strong>

                      <small
                        className={
                          styles.projectSlug
                        }
                      >
                        {user.project.slug}
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
                        days !== null &&
                        days <= 30 && (
                          <small
                            className={
                              styles.expiringSoon
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
                          styles.deviceCount
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
                          / {user.maxDevices}
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
                          size={17}
                          strokeWidth={2.3}
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
                          size={17}
                          strokeWidth={2.3}
                        />
                      </Link>

                      <ToggleApkUserStatusButton
                        userId={user.id}
                        active={user.active}
                      />

                      <DeleteApkUserButton
                        userId={user.id}
                        userName={user.name}
                      />
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