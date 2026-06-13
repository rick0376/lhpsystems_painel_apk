// src/app/(private)/projects/[id]/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { AdminShell } from "../../../../components/layout/AdminShell/AdminShell";
import { DeleteProjectButton } from "../../../../components/projects/DeleteProjectButton/DeleteProjectButton";
import { getAdminSession } from "../../../../lib/auth/session";
import { prisma } from "../../../../lib/prisma";
import styles from "./styles.module.scss";

type ProjectDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDetailsPage({
  params,
}: ProjectDetailsPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const project = await prisma.appProject.findUnique({
    where: {
      id,
    },
    include: {
      apkUsers: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          username: true,
          active: true,
        },
      },
      _count: {
        select: {
          apkUsers: true,
        },
      },
    },
  });

  if (!project) {
    redirect("/projects");
  }

  return (
    <AdminShell>
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.badge}>Projeto APK</span>

          <h1 className={styles.title}>{project.name}</h1>

          <p className={styles.subtitle}>
            Gerencie os dados, usuários e permissões deste aplicativo.
          </p>
        </div>

        <div className={styles.headerActions}>
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
          />

          <Link
            href={`/projects/${project.id}/edit`}
            className={styles.editButton}
          >
            <Pencil size={18} strokeWidth={2.4} />
            Editar
          </Link>

          <Link href="/projects" className={styles.backButton}>
            Voltar
          </Link>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.label}>Nome</span>
          <strong>{project.name}</strong>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>Slug</span>
          <strong>{project.slug}</strong>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>App Key</span>
          <code>{project.appKey}</code>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>Status</span>

          <span className={project.active ? styles.active : styles.inactive}>
            {project.active ? "Ativo" : "Bloqueado"}
          </span>
        </div>
      </section>

      <section className={styles.descriptionCard}>
        <span className={styles.label}>Descrição</span>

        <p>{project.description || "Nenhuma descrição cadastrada."}</p>
      </section>

      <section className={styles.usersCard}>
        <div className={styles.usersHeader}>
          <div>
            <h2>Usuários deste APK</h2>

            <p>
              Este projeto possui{" "}
              <strong>{project._count.apkUsers} usuário(s)</strong>{" "}
              cadastrado(s).
            </p>
          </div>

          <Link
            href={`/apk-users/new?projectId=${project.id}`}
            className={styles.primaryButton}
          >
            <Plus size={18} strokeWidth={2.4} />
            Novo usuário
          </Link>
        </div>

        {project.apkUsers.length === 0 ? (
          <div className={styles.emptyUsers}>
            Nenhum usuário cadastrado neste projeto.
          </div>
        ) : (
          <div className={styles.usersList}>
            {project.apkUsers.map((user) => (
              <Link
                key={user.id}
                href={`/apk-users/${user.id}`}
                className={styles.userRow}
              >
                <div>
                  <strong>{user.name}</strong>
                  <small>{user.username}</small>
                </div>

                <span className={user.active ? styles.active : styles.inactive}>
                  {user.active ? "Ativo" : "Bloqueado"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
