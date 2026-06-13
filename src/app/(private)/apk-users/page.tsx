// src/app/(private)/apk-users/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteApkUserButton } from "../../../components/apk-users/DeleteApkUserButton/DeleteApkUserButton";
import { ToggleApkUserStatusButton } from "../../../components/apk-users/ToggleApkUserStatusButton/ToggleApkUserStatusButton";
import { AdminShell } from "../../../components/layout/AdminShell/AdminShell";
import { getAdminSession } from "../../../lib/auth/session";
import { prisma } from "../../../lib/prisma";
import { Eye, Pencil } from "lucide-react";
import styles from "./styles.module.scss";

export default async function ApkUsersPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const users = await prisma.apkUser.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      project: true,
      _count: {
        select: {
          devices: true,
        },
      },
    },
  });

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>Licenças</span>

          <h1 className={styles.title}>Usuários APK</h1>

          <p className={styles.subtitle}>
            Gerencie os usuários que podem acessar seus aplicativos.
          </p>
        </div>

        <Link href="/apk-users/new" className={styles.newButton}>
          Novo usuário
        </Link>
      </section>

      <section className={styles.card}>
        {users.length === 0 ? (
          <div className={styles.empty}>
            <strong>Nenhum usuário cadastrado</strong>
            <span>Crie um usuário para liberar acesso ao APK.</span>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Usuário</span>
              <span>Projeto</span>
              <span>Expira em</span>
              <span>Dispositivos</span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            {users.map((user) => (
              <div key={user.id} className={styles.tableRow}>
                <div>
                  <strong>{user.name}</strong>
                  <small>{user.username}</small>
                </div>

                <span>{user.project.name}</span>

                <span>
                  {user.expiresAt
                    ? new Date(user.expiresAt).toLocaleDateString("pt-BR")
                    : "Sem expiração"}
                </span>

                <span>{user._count.devices}</span>

                <div className={styles.statusCell}>
                  <span
                    className={user.active ? styles.active : styles.inactive}
                  >
                    {user.active ? "Ativo" : "Bloqueado"}
                  </span>
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
                    title="Editar usuário"
                    aria-label="Editar usuário"
                  >
                    <Pencil size={18} strokeWidth={2.4} />
                  </Link>

                  <ToggleApkUserStatusButton
                    userId={user.id}
                    active={user.active}
                  />

                  <DeleteApkUserButton userId={user.id} userName={user.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
