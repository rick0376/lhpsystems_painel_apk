// src/app/(private)/projects/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Pencil, Plus } from "lucide-react";
import { AdminShell } from "../../../components/layout/AdminShell/AdminShell";
import { DeleteProjectButton } from "../../../components/projects/DeleteProjectButton/DeleteProjectButton";
import { getAdminSession } from "../../../lib/auth/session";
import { prisma } from "../../../lib/prisma";
import styles from "./styles.module.scss";

type ProjectListItem = {
  id: string;
  name: string;
  slug: string;
  appKey: string;
  active: boolean;
  _count: {
    apkUsers: number;
  };
};

export default async function ProjectsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const projects = (await prisma.appProject.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          apkUsers: true,
        },
      },
    },
  })) as ProjectListItem[];

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>Aplicativos</span>

          <h1 className={styles.title}>Projetos APK</h1>

          <p className={styles.subtitle}>
            Cadastre e gerencie os aplicativos que usarão o sistema de licenças.
          </p>
        </div>

        <Link href="/projects/new" className={styles.primaryButton}>
          <Plus size={18} strokeWidth={2.4} />
          Novo projeto
        </Link>
      </section>

      <section className={styles.card}>
        {projects.length === 0 ? (
          <div className={styles.empty}>
            <strong>Nenhum projeto cadastrado</strong>
            <span>Crie o primeiro projeto APK para começar.</span>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Projeto</span>
              <span>Slug</span>
              <span>App Key</span>
              <span>Usuários</span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            {projects.map((project: ProjectListItem) => (
              <div key={project.id} className={styles.tableRow}>
                <div>
                  <strong>{project.name}</strong>
                  <small>{project.id}</small>
                </div>

                <span>{project.slug}</span>

                <code>{project.appKey}</code>

                <span>{project._count.apkUsers}</span>

                <div className={styles.statusCell}>
                  <span
                    className={project.active ? styles.active : styles.inactive}
                  >
                    {project.active ? "Ativo" : "Bloqueado"}
                  </span>
                </div>

                <div className={styles.actions}>
                  <Link
                    href={`/projects/${project.id}`}
                    className={styles.viewButton}
                    title="Ver projeto"
                    aria-label="Ver projeto"
                  >
                    <Eye size={18} strokeWidth={2.4} />
                  </Link>

                  <Link
                    href={`/projects/${project.id}/edit`}
                    className={styles.editButton}
                    title="Editar projeto"
                    aria-label="Editar projeto"
                  >
                    <Pencil size={18} strokeWidth={2.4} />
                  </Link>

                  <DeleteProjectButton
                    projectId={project.id}
                    projectName={project.name}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
