// src/app/(private)/projects/[id]/edit/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../../../../../components/layout/AdminShell/AdminShell";
import { getAdminSession } from "../../../../../lib/auth/session";
import { prisma } from "../../../../../lib/prisma";
import { EditProjectForm } from "./EditProjectForm";
import styles from "./styles.module.scss";

type EditProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const project = await prisma.appProject.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      appKey: true,
      description: true,
      active: true,
    },
  });

  if (!project) {
    redirect("/projects");
  }

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>Editar projeto</span>

          <h1 className={styles.title}>{project.name}</h1>

          <p className={styles.subtitle}>
            Altere os dados principais do aplicativo, sua chave de identificação
            e o status de uso no painel.
          </p>
        </div>

        <Link href={`/projects/${project.id}`} className={styles.backButton}>
          Voltar
        </Link>
      </section>

      <EditProjectForm
        project={{
          id: project.id,
          name: project.name,
          slug: project.slug,
          appKey: project.appKey,
          description: project.description || "",
          active: project.active,
        }}
      />
    </AdminShell>
  );
}
