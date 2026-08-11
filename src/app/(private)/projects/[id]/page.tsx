//src/app/(private)/projects/[id]/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  AppWindow,
  CheckCircle2,
  KeyRound,
  MessageCircle,
  Pencil,
  Plus,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react";

import { AdminShell } from "../../../../components/layout/AdminShell/AdminShell";
import { DeleteProjectButton } from "../../../../components/projects/DeleteProjectButton/DeleteProjectButton";
import { getAdminSession } from "../../../../lib/auth/session";
import { prisma } from "../../../../lib/prisma";

import styles from "./styles.module.scss";

type ProjectApkUser = {
  id: string;
  name: string;
  username: string;
  active: boolean;
};

type ProjectPermission = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  active: boolean;
};

type ProjectDetails = {
  id: string;
  name: string;
  slug: string;
  appKey: string;
  description: string | null;
  supportWhatsappLabel: string | null;
  supportWhatsappNumber: string | null;
  supportWhatsappMessage: string | null;
  active: boolean;

  apkUsers: ProjectApkUser[];
  permissions: ProjectPermission[];

  _count: {
    apkUsers: number;
  };
};

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

  const project = (await prisma.appProject.findUnique({
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

      permissions: {
        orderBy: {
          name: "asc",
        },

        select: {
          id: true,
          name: true,
          key: true,
          description: true,
          active: true,
        },
      },

      _count: {
        select: {
          apkUsers: true,
        },
      },
    },
  })) as ProjectDetails | null;

  if (!project) {
    redirect("/projects");
  }

  const activePermissions = project.permissions.filter(
    (permission) => permission.active,
  ).length;

  const activeUsers = project.apkUsers.filter(
    (user) => user.active,
  ).length;

  return (
    <AdminShell>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.projectIcon}>
            <AppWindow size={27} strokeWidth={2} />
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroTop}>
              <span className={styles.badge}>
                Projeto APK
              </span>

              <span
                className={
                  project.active
                    ? styles.heroActive
                    : styles.heroInactive
                }
              >
                <i />
                {project.active
                  ? "Projeto ativo"
                  : "Projeto bloqueado"}
              </span>
            </div>

            <h1 className={styles.title}>
              {project.name}
            </h1>

            <p className={styles.subtitle}>
              Gerencie configurações, usuários,
              permissões e dados deste aplicativo.
            </p>

            <div className={styles.projectMeta}>
              <span>
                <strong>Slug</strong>
                {project.slug}
              </span>

              <span>
                <strong>App Key</strong>
                {project.appKey}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Link
            href={`/projects/${project.id}/radio`}
            className={styles.radioButton}
          >
            <Radio size={17} strokeWidth={2.3} />
            Configurar rádio
          </Link>

          <Link
            href={`/projects/${project.id}/edit`}
            className={styles.editButton}
          >
            <Pencil size={17} strokeWidth={2.3} />
            Editar
          </Link>

          <Link
            href="/projects"
            className={styles.backButton}
          >
            <ArrowLeft size={17} strokeWidth={2.3} />
            Voltar
          </Link>

          <div className={styles.deleteAction}>
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
            />
          </div>
        </div>
      </section>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users size={20} />
          </div>

          <div>
            <span>Usuários</span>
            <strong>
              {project._count.apkUsers}
            </strong>
            <small>
              {activeUsers} ativo(s)
            </small>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={`${styles.statIcon} ${styles.permissionIcon}`}
          >
            <ShieldCheck size={20} />
          </div>

          <div>
            <span>Permissões</span>
            <strong>
              {project.permissions.length}
            </strong>
            <small>
              {activePermissions} ativa(s)
            </small>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={`${styles.statIcon} ${styles.keyIcon}`}
          >
            <KeyRound size={20} />
          </div>

          <div className={styles.statText}>
            <span>App Key</span>

            <code>{project.appKey}</code>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={`${styles.statIcon} ${styles.statusIcon}`}
          >
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Status</span>

            <strong className={styles.statusText}>
              {project.active
                ? "Ativo"
                : "Bloqueado"}
            </strong>

            <small>
              Acesso geral do projeto
            </small>
          </div>
        </div>
      </section>

      <section className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <div className={styles.infoHeader}>
            <div className={styles.infoIcon}>
              <AppWindow size={19} />
            </div>

            <div>
              <span>Informações</span>
              <h2>Descrição do aplicativo</h2>
            </div>
          </div>

          <p>
            {project.description ||
              "Nenhuma descrição cadastrada."}
          </p>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.infoHeader}>
            <div
              className={`${styles.infoIcon} ${styles.whatsappIcon}`}
            >
              <MessageCircle size={19} />
            </div>

            <div>
              <span>Atendimento</span>
              <h2>Suporte ao usuário</h2>
            </div>
          </div>

          <div className={styles.supportDetails}>
            <div>
              <small>WhatsApp</small>

              <strong>
                {project.supportWhatsappLabel ||
                  project.supportWhatsappNumber ||
                  "(12) 99189-0682"}
              </strong>
            </div>

            <div>
              <small>Mensagem padrão</small>

              <p>
                {project.supportWhatsappMessage ||
                  "Olá, preciso de ajuda com meu acesso ao aplicativo."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionIcon}>
              <ShieldCheck size={21} />
            </div>

            <div>
              <span className={styles.eyebrow}>
                Controle de acesso
              </span>

              <h2>Permissões deste APK</h2>

              <p>
                Configure os recursos disponíveis
                especificamente para{" "}
                <strong>{project.name}</strong>.
              </p>
            </div>
          </div>

          <Link
            href={`/projects/${project.id}/permissions`}
            className={styles.primaryButton}
          >
            <Plus size={17} strokeWidth={2.5} />
            Gerenciar permissões
          </Link>
        </div>

        {project.permissions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ShieldCheck size={23} />
            </div>

            <strong>
              Nenhuma permissão cadastrada
            </strong>

            <p>
              Crie permissões específicas para
              controlar os recursos deste aplicativo.
            </p>
          </div>
        ) : (
          <div className={styles.permissionsGrid}>
            {project.permissions.map(
              (permission) => (
                <div
                  key={permission.id}
                  className={styles.permissionItem}
                >
                  <div
                    className={
                      styles.permissionMain
                    }
                  >
                    <div
                      className={
                        styles.permissionIconSmall
                      }
                    >
                      <ShieldCheck size={17} />
                    </div>

                    <div>
                      <strong>
                        {permission.name}
                      </strong>

                      <code>
                        {permission.key}
                      </code>

                      {permission.description && (
                        <p>
                          {permission.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={
                      permission.active
                        ? styles.active
                        : styles.inactive
                    }
                  >
                    <i />

                    {permission.active
                      ? "Ativa"
                      : "Inativa"}
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeading}>
            <div
              className={`${styles.sectionIcon} ${styles.usersSectionIcon}`}
            >
              <Users size={21} />
            </div>

            <div>
              <span className={styles.eyebrow}>
                Usuários
              </span>

              <h2>Usuários deste APK</h2>

              <p>
                <strong>
                  {project._count.apkUsers}
                </strong>{" "}
                usuário(s) cadastrado(s), sendo{" "}
                <strong>{activeUsers}</strong>{" "}
                ativo(s).
              </p>
            </div>
          </div>

          <Link
            href={`/apk-users/new?projectId=${project.id}`}
            className={styles.primaryButton}
          >
            <Plus size={17} strokeWidth={2.5} />
            Novo usuário
          </Link>
        </div>

        {project.apkUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Users size={23} />
            </div>

            <strong>
              Nenhum usuário cadastrado
            </strong>

            <p>
              Cadastre o primeiro usuário para
              liberar o acesso a este aplicativo.
            </p>
          </div>
        ) : (
          <div className={styles.usersList}>
            {project.apkUsers.map(
              (user: ProjectApkUser) => (
                <Link
                  key={user.id}
                  href={`/apk-users/${user.id}`}
                  className={styles.userRow}
                >
                  <div className={styles.userAvatar}>
                    {user.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className={styles.userInfo}>
                    <strong>
                      {user.name}
                    </strong>

                    <small>
                      @{user.username}
                    </small>
                  </div>

                  <span
                    className={
                      user.active
                        ? styles.active
                        : styles.inactive
                    }
                  >
                    <i />

                    {user.active
                      ? "Ativo"
                      : "Bloqueado"}
                  </span>

                  <span
                    className={
                      styles.userArrow
                    }
                  >
                    →
                  </span>
                </Link>
              ),
            )}
          </div>
        )}
      </section>
    </AdminShell>
  );
}