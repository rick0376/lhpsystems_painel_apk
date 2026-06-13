// src/app/(private)/apk-users/[id]/edit/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../../../../../components/layout/AdminShell/AdminShell";
import { getAdminSession } from "../../../../../lib/auth/session";
import { prisma } from "../../../../../lib/prisma";
import { EditApkUserForm } from "./EditApkUserForm";
import styles from "./styles.module.scss";

type EditApkUserPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditApkUserPage({
  params,
}: EditApkUserPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const apkUser = await prisma.apkUser.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      projectId: true,
      name: true,
      username: true,
      active: true,
      expiresAt: true,
      canTransmit: true,
      canOpenSettings: true,
      canEditRadioConfig: true,
      maxDevices: true,
      notes: true,
      project: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!apkUser) {
    redirect("/apk-users");
  }

  const projects = await prisma.appProject.findMany({
    where: {
      OR: [
        {
          active: true,
        },
        {
          id: apkUser.projectId,
        },
      ],
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>Editar usuário</span>

          <h1 className={styles.title}>{apkUser.name}</h1>

          <p className={styles.subtitle}>
            Altere os dados de acesso, permissões, expiração e dispositivos do
            usuário.
          </p>
        </div>

        <Link href={`/apk-users/${apkUser.id}`} className={styles.backButton}>
          Voltar
        </Link>
      </section>

      <EditApkUserForm
        projects={projects}
        user={{
          id: apkUser.id,
          projectId: apkUser.projectId,
          name: apkUser.name,
          username: apkUser.username,
          active: apkUser.active,
          expiresAt: apkUser.expiresAt
            ? apkUser.expiresAt.toISOString().slice(0, 10)
            : "",
          canTransmit: apkUser.canTransmit,
          canOpenSettings: apkUser.canOpenSettings,
          canEditRadioConfig: apkUser.canEditRadioConfig,
          maxDevices: apkUser.maxDevices,
          notes: apkUser.notes || "",
        }}
      />
    </AdminShell>
  );
}
