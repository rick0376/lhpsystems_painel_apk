// src/app/(private)/dashboard/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../../../components/layout/AdminShell/AdminShell";
import { getAdminSession } from "../../../lib/auth/session";
import { prisma } from "../../../lib/prisma";
import styles from "./styles.module.scss";

function formatDate(date: Date | null) {
  if (!date) {
    return "Sem vencimento";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
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

  const [projectsCount, users, devicesCount, recentDevices] = await Promise.all(
    [
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
    ],
  );

  const activeLicenses = users.filter(
    (user) => user.active && (!user.expiresAt || user.expiresAt >= now),
  ).length;

  const expiredLicenses = users.filter(
    (user) => user.expiresAt && user.expiresAt < now,
  ).length;

  const blockedLicenses = users.filter((user) => !user.active).length;

  const licensesExpiringSoon = users
    .filter((user) => {
      const days = getDaysToExpire(user.expiresAt);

      return user.active && days !== null && days >= 0 && days <= 30;
    })
    .slice(0, 5);

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>Visão geral</span>

          <h1 className={styles.title}>Dashboard</h1>

          <p className={styles.subtitle}>
            Acompanhe os projetos, licenças, usuários e dispositivos vinculados
            aos APKs.
          </p>
        </div>
      </section>

      <section className={styles.statsGrid}>
        <Link href="/projects" className={styles.statCard}>
          <span>Projetos APK</span>
          <strong>{projectsCount}</strong>
        </Link>

        <Link href="/licenses" className={styles.statCard}>
          <span>Licenças ativas</span>
          <strong>{activeLicenses}</strong>
        </Link>

        <Link href="/licenses" className={styles.statCard}>
          <span>Licenças vencidas</span>
          <strong>{expiredLicenses}</strong>
        </Link>

        <Link href="/devices" className={styles.statCard}>
          <span>Dispositivos</span>
          <strong>{devicesCount}</strong>
        </Link>
      </section>

      <section className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Licenças próximas do vencimento</h2>
              <p>Usuários que vencem nos próximos 30 dias.</p>
            </div>

            <Link href="/licenses" className={styles.panelLink}>
              Ver licenças
            </Link>
          </div>

          {licensesExpiringSoon.length === 0 ? (
            <div className={styles.empty}>
              Nenhuma licença vencendo nos próximos 30 dias.
            </div>
          ) : (
            <div className={styles.list}>
              {licensesExpiringSoon.map((user) => {
                const days = getDaysToExpire(user.expiresAt);

                return (
                  <Link
                    key={user.id}
                    href={`/apk-users/${user.id}`}
                    className={styles.listItem}
                  >
                    <div>
                      <strong>{user.name}</strong>
                      <small>
                        {user.project.name} • {formatDate(user.expiresAt)}
                      </small>
                    </div>

                    <span>{days === 0 ? "Vence hoje" : `${days} dia(s)`}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Últimos dispositivos</h2>
              <p>Aparelhos com acesso mais recente.</p>
            </div>

            <Link href="/devices" className={styles.panelLink}>
              Ver dispositivos
            </Link>
          </div>

          {recentDevices.length === 0 ? (
            <div className={styles.empty}>Nenhum dispositivo cadastrado.</div>
          ) : (
            <div className={styles.list}>
              {recentDevices.map((device) => (
                <Link
                  key={device.id}
                  href={`/apk-users/${device.apkUserId}`}
                  className={styles.listItem}
                >
                  <div>
                    <strong>{device.deviceName || "Sem nome"}</strong>
                    <small>
                      {device.apkUser.name} • {device.apkUser.project.name}
                    </small>
                  </div>

                  <span
                    className={device.active ? styles.active : styles.inactive}
                  >
                    {device.active ? "Ativo" : "Bloqueado"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={styles.alertGrid}>
        <div className={styles.alertCard}>
          <span>Usuários bloqueados</span>
          <strong>{blockedLicenses}</strong>
        </div>

        <div className={styles.alertCard}>
          <span>Total de usuários APK</span>
          <strong>{users.length}</strong>
        </div>
      </section>
    </AdminShell>
  );
}
