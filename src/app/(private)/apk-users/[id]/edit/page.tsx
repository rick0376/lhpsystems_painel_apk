// src/app/(private)/apk-users/[id]/edit/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  UserRoundCog,
} from "lucide-react";

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
  const session =
    await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const apkUser =
    await prisma.apkUser.findUnique({
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
        maxDevices: true,
        notes: true,

        project: {
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

                userPermissions: {
                  where: {
                    apkUserId: id,
                  },

                  select: {
                    allowed: true,
                  },

                  take: 1,
                },
              },
            },
          },
        },
      },
    });

  if (!apkUser) {
    redirect("/apk-users");
  }

  const projects =
    await prisma.appProject.findMany({
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

  const permissions =
    apkUser.project.permissions.map(
      (permission) => ({
        id: permission.id,
        name: permission.name,
        key: permission.key,
        description:
          permission.description,

        allowed:
          permission.userPermissions[0]
            ?.allowed ?? false,
      }),
    );

  return (
    <AdminShell>
      <section className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <UserRoundCog size={25} />
          </div>

          <div>
            <span className={styles.badge}>
              Editar usuário
            </span>

            <h1 className={styles.title}>
              {apkUser.name}
            </h1>

            <p className={styles.subtitle}>
              Altere os dados de acesso,
              validade, dispositivos e
              permissões deste usuário.
            </p>
          </div>
        </div>

        <Link
          href={`/apk-users/${apkUser.id}`}
          className={styles.backButton}
        >
          <ArrowLeft
            size={17}
            strokeWidth={2.4}
          />

          Voltar
        </Link>
      </section>

      <EditApkUserForm
        projects={projects}
        permissions={permissions}
        projectName={
          apkUser.project.name
        }
        user={{
          id: apkUser.id,
          projectId:
            apkUser.projectId,
          name: apkUser.name,
          username:
            apkUser.username,
          active: apkUser.active,

          expiresAt:
            apkUser.expiresAt
              ? apkUser.expiresAt
                .toISOString()
                .slice(0, 10)
              : "",

          maxDevices:
            apkUser.maxDevices,

          notes:
            apkUser.notes || "",
        }}
      />
    </AdminShell>
  );
}