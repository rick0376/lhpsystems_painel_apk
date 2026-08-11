// src/app/(private)/apk-users/new/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
} from "lucide-react";

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
  const session =
    await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const { projectId } =
    await searchParams;

  const projects =
    await prisma.appProject.findMany({
      where: {
        active: true,
      },

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,

        permissions: {
          where: {
            active: true,
          },

          orderBy: {
            name: "asc",
          },

          select: {
            id: true,
            name: true,
            key: true,
            description: true,
          },
        },
      },
    });

  const validInitialProjectId =
    projects.some(
      (project) =>
        project.id === projectId,
    )
      ? projectId
      : undefined;

  const backHref =
    validInitialProjectId
      ? `/projects/${validInitialProjectId}`
      : "/apk-users";

  return (
    <AdminShell>
      <section className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <UserPlus size={25} />
          </div>

          <div>
            <span className={styles.badge}>
              Novo acesso
            </span>

            <h1 className={styles.title}>
              Cadastrar usuário APK
            </h1>

            <p className={styles.subtitle}>
              Crie um novo acesso, defina
              validade, dispositivos e
              permissões específicas do
              aplicativo.
            </p>
          </div>
        </div>

        <Link
          href={backHref}
          className={styles.headerBackButton}
        >
          <ArrowLeft
            size={17}
            strokeWidth={2.4}
          />

          Voltar
        </Link>
      </section>

      <NewApkUserForm
        projects={projects}
        initialProjectId={
          validInitialProjectId
        }
      />
    </AdminShell>
  );
}