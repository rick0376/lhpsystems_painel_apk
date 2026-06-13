// src/app/(private)/apk-users/new/page.tsx

import { redirect } from "next/navigation";
import { AdminShell } from "../../../../components/layout/AdminShell/AdminShell";
import { getAdminSession } from "../../../../lib/auth/session";
import { prisma } from "../../../../lib/prisma";
import { NewApkUserForm } from "./NewApkUserForm";
import styles from "./styles.module.scss";

type NewApkUserPageProps = {
  searchParams: Promise<{
    projectId?: string;
  }>;
};

export default async function NewApkUserPage({
  searchParams,
}: NewApkUserPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const { projectId } = await searchParams;

  const projects = await prisma.appProject.findMany({
    where: {
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>Novo acesso</span>

          <h1 className={styles.title}>Cadastrar usuário APK</h1>

          <p className={styles.subtitle}>
            Crie um login para liberar acesso ao aplicativo, controlar prazo,
            permissões e dispositivos.
          </p>
        </div>
      </section>

      <NewApkUserForm projects={projects} initialProjectId={projectId} />
    </AdminShell>
  );
}
