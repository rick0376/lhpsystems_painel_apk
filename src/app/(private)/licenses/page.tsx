// src/app/(private)/licenses/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Pencil } from "lucide-react";
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

function getLicenseStatus(user: { active: boolean; expiresAt: Date | null }) {
  const now = new Date();

  if (!user.active) {
    return {
      label: "Bloqueada",
      className: styles.inactive,
    };
  }

  if (user.expiresAt && user.expiresAt < now) {
    return {
      label: "Vencida",
      className: styles.expired,
    };
  }

  return {
    label: "Ativa",
    className: styles.active,
  };
}

export default async function LicensesPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const users = await prisma.apkUser.findMany({
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
  });

  const activeLicenses = users.filter((user) => {
    const now = new Date();

    return user.active && (!user.expiresAt || user.expiresAt >= now);
  }).length;

  const expiredLicenses = users.filter((user) => {
    const now = new Date();

    return user.expiresAt && user.expiresAt < now;
  }).length;

  const blockedLicenses = users.filter((user) => !user.active).length;

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>Controle</span>

          <h1 className={styles.title}>Licenças</h1>

          <p className={styles.subtitle}>
            Acompanhe a validade, status e permissões dos usuários vinculados
            aos seus APKs.
          </p>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>Licenças ativas</span>
          <strong>{activeLicenses}</strong>
        </div>

        <div className={styles.summaryCard}>
          <span>Licenças vencidas</span>
          <strong>{expiredLicenses}</strong>
        </div>

        <div className={styles.summaryCard}>
          <span>Licenças bloqueadas</span>
          <strong>{blockedLicenses}</strong>
        </div>

        <div className={styles.summaryCard}>
          <span>Total de licenças</span>
          <strong>{users.length}</strong>
        </div>
      </section>

      <section className={styles.card}>
        {users.length === 0 ? (
          <div className={styles.empty}>
            <strong>Nenhuma licença cadastrada</strong>
            <span>As licenças aparecem aqui após cadastrar usuários APK.</span>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Usuário</span>
              <span>Projeto</span>
              <span>Vencimento</span>
              <span>Dispositivos</span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            {users.map((user) => {
              const status = getLicenseStatus(user);

              return (
                <div key={user.id} className={styles.tableRow}>
                  <div>
                    <strong>{user.name}</strong>
                    <small>{user.username}</small>
                  </div>

                  <div>
                    <strong>{user.project.name}</strong>
                    <small>{user.project.slug}</small>
                  </div>

                  <span>{formatDate(user.expiresAt)}</span>

                  <span>
                    {user._count.devices} / {user.maxDevices}
                  </span>

                  <div className={styles.statusCell}>
                    <span className={status.className}>{status.label}</span>
                  </div>

                  <div className={styles.actions}>
                    <Link
                      href={`/apk-users/${user.id}`}
                      className={styles.viewButton}
                      title="Ver usuário"
                      aria-label="Ver usuário"
                    >
                      <Eye size={18} strokeWidth={2.4} />
                    </Link>

                    <Link
                      href={`/apk-users/${user.id}/edit`}
                      className={styles.editButton}
                      title="Editar licença"
                      aria-label="Editar licença"
                    >
                      <Pencil size={18} strokeWidth={2.4} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
