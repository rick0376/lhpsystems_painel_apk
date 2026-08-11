// src/app/(private)/projects/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Boxes,
  CheckCircle2,
  Eye,
  KeyRound,
  Pencil,
  Plus,
  Users,
} from "lucide-react";

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

  const activeProjects = projects.filter(
    (project) => project.active,
  ).length;

  const blockedProjects = projects.filter(
    (project) => !project.active,
  ).length;

  const totalUsers = projects.reduce(
    (total, project) =>
      total + project._count.apkUsers,
    0,
  );

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>
            Aplicativos
          </span>

          <h1 className={styles.title}>
            Projetos APK
          </h1>

          <p className={styles.subtitle}>
            Cadastre e gerencie os aplicativos
            vinculados ao sistema de licenças da
            LHP Systems.
          </p>
        </div>

        <Link
          href="/projects/new"
          className={styles.primaryButton}
        >
          <Plus size={18} strokeWidth={2.5} />
          Novo projeto
        </Link>
      </section>

      <section className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Boxes size={20} />
          </div>

          <div>
            <span>Total de projetos</span>
            <strong>{projects.length}</strong>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div
            className={`${styles.summaryIcon} ${styles.successIcon}`}
          >
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Projetos ativos</span>
            <strong>{activeProjects}</strong>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div
            className={`${styles.summaryIcon} ${styles.usersIcon}`}
          >
            <Users size={20} />
          </div>

          <div>
            <span>Usuários vinculados</span>
            <strong>{totalUsers}</strong>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div
            className={`${styles.summaryIcon} ${styles.blockedIcon}`}
          >
            <KeyRound size={20} />
          </div>

          <div>
            <span>Projetos bloqueados</span>
            <strong>{blockedProjects}</strong>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.cardEyebrow}>
              Gerenciamento
            </span>

            <h2>Aplicativos cadastrados</h2>

            <p>
              Consulte os dados, usuários e status de
              cada projeto.
            </p>
          </div>

          <span className={styles.projectCount}>
            {projects.length}{" "}
            {projects.length === 1
              ? "projeto"
              : "projetos"}
          </span>
        </div>

        {projects.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Boxes size={26} />
            </div>

            <strong>
              Nenhum projeto cadastrado
            </strong>

            <span>
              Crie o primeiro projeto APK para
              começar.
            </span>

            <Link
              href="/projects/new"
              className={styles.emptyButton}
            >
              <Plus size={17} />
              Criar projeto
            </Link>
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

            <div className={styles.tableBody}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={styles.tableRow}
                >
                  <div className={styles.projectCell}>
                    <div className={styles.projectAvatar}>
                      {project.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className={styles.projectInfo}>
                      <strong>
                        {project.name}
                      </strong>

                      <small>
                        {project.id}
                      </small>
                    </div>
                  </div>

                  <div
                    className={styles.dataCell}
                    data-label="Slug"
                  >
                    <span className={styles.slug}>
                      {project.slug}
                    </span>
                  </div>

                  <div
                    className={styles.dataCell}
                    data-label="App Key"
                  >
                    <code>
                      {project.appKey}
                    </code>
                  </div>

                  <div
                    className={styles.dataCell}
                    data-label="Usuários"
                  >
                    <span
                      className={
                        styles.userCount
                      }
                    >
                      <Users size={14} />
                      {project._count.apkUsers}
                    </span>
                  </div>

                  <div
                    className={styles.statusCell}
                    data-label="Status"
                  >
                    <span
                      className={
                        project.active
                          ? styles.active
                          : styles.inactive
                      }
                    >
                      <i />
                      {project.active
                        ? "Ativo"
                        : "Bloqueado"}
                    </span>
                  </div>

                  <div
                    className={styles.actions}
                    data-label="Ações"
                  >
                    <Link
                      href={`/projects/${project.id}`}
                      className={
                        styles.viewButton
                      }
                      title="Ver projeto"
                      aria-label="Ver projeto"
                    >
                      <Eye
                        size={17}
                        strokeWidth={2.3}
                      />
                    </Link>

                    <Link
                      href={`/projects/${project.id}/edit`}
                      className={
                        styles.editButton
                      }
                      title="Editar projeto"
                      aria-label="Editar projeto"
                    >
                      <Pencil
                        size={17}
                        strokeWidth={2.3}
                      />
                    </Link>

                    <DeleteProjectButton
                      projectId={project.id}
                      projectName={project.name}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </AdminShell>
  );
}