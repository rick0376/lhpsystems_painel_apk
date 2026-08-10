// src/app/(private)/apk-users/[id]/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";

import { AdminShell } from "../../../../components/layout/AdminShell/AdminShell";
import { getAdminSession } from "../../../../lib/auth/session";
import { prisma } from "../../../../lib/prisma";

import styles from "./styles.module.scss";

type ApkUserDevice = {
  id: string;
  deviceId: string;
  deviceName: string | null;
  active: boolean;
  lastAccessAt: Date | null;
};

type ApkUserDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ApkUserDetailsPage({
  params,
}: ApkUserDetailsPageProps) {
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

      devices: {
        orderBy: {
          lastAccessAt: "desc",
        },

        select: {
          id: true,
          deviceId: true,
          deviceName: true,
          active: true,
          lastAccessAt: true,
        },
      },
    },
  });

  if (!apkUser) {
    redirect("/apk-users");
  }

  const isExpired =
    apkUser.expiresAt &&
    apkUser.expiresAt.getTime() <
    new Date().getTime();

  const permissions =
    apkUser.project.permissions.map(
      (permission) => ({
        id: permission.id,
        name: permission.name,
        key: permission.key,
        description: permission.description,

        allowed:
          permission.userPermissions[0]
            ?.allowed ?? false,
      }),
    );

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>
            Usuário APK
          </span>

          <h1 className={styles.title}>
            {apkUser.name}
          </h1>

          <p className={styles.subtitle}>
            Controle o acesso, permissões,
            prazo de uso e dispositivos deste
            usuário.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link
            href={`/apk-users/${apkUser.id}/edit`}
            className={styles.editButton}
          >
            <Pencil
              size={18}
              strokeWidth={2.4}
            />

            Editar
          </Link>

          <Link
            href="/apk-users"
            className={styles.backButton}
          >
            Voltar
          </Link>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.label}>
            Projeto
          </span>

          <strong>
            {apkUser.project.name}
          </strong>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>
            Login do APK
          </span>

          <strong>
            {apkUser.username}
          </strong>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>
            Status
          </span>

          <strong
            className={
              apkUser.active
                ? styles.active
                : styles.inactive
            }
          >
            {apkUser.active
              ? "Ativo"
              : "Bloqueado"}
          </strong>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>
            Expiração
          </span>

          <strong
            className={
              isExpired
                ? styles.expired
                : undefined
            }
          >
            {apkUser.expiresAt
              ? apkUser.expiresAt.toLocaleDateString(
                "pt-BR",
              )
              : "Sem expiração"}
          </strong>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>
            Máximo de dispositivos
          </span>

          <strong>
            {apkUser.maxDevices}
          </strong>
        </div>
      </section>

      <section
        className={styles.permissionsCard}
      >
        <div
          className={styles.permissionsHeader}
        >
          <div>
            <h2>
              Permissões —{" "}
              {apkUser.project.name}
            </h2>

            <p>
              Permissões específicas deste
              aplicativo para este usuário.
            </p>
          </div>

          <Link
            href={`/apk-users/${apkUser.id}/edit`}
            className={styles.manageButton}
          >
            <Pencil
              size={16}
              strokeWidth={2.4}
            />

            Alterar permissões
          </Link>
        </div>

        {permissions.length === 0 ? (
          <div
            className={
              styles.emptyPermissions
            }
          >
            Este APK ainda não possui
            permissões específicas
            cadastradas.
          </div>
        ) : (
          <div
            className={
              styles.permissionsGrid
            }
          >
            {permissions.map(
              (permission) => (
                <div
                  key={permission.id}
                  className={
                    styles.permissionItem
                  }
                >
                  <div
                    className={
                      styles.permissionContent
                    }
                  >
                    <strong
                      className={
                        styles.permissionName
                      }
                    >
                      {permission.name}
                    </strong>

                    <code>
                      {permission.key}
                    </code>

                    {permission.description && (
                      <p>
                        {
                          permission.description
                        }
                      </p>
                    )}
                  </div>

                  <span
                    className={
                      permission.allowed
                        ? styles.permissionAllowed
                        : styles.permissionBlocked
                    }
                  >
                    {permission.allowed
                      ? "Liberado"
                      : "Bloqueado"}
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      <section className={styles.notesCard}>
        <span className={styles.label}>
          Observações
        </span>

        <p>
          {apkUser.notes ||
            "Nenhuma observação cadastrada."}
        </p>
      </section>

      <section
        className={styles.devicesCard}
      >
        <div
          className={styles.devicesHeader}
        >
          <div>
            <h2>
              Dispositivos vinculados
            </h2>

            <p>
              Celulares ou navegadores que
              já acessaram este usuário.
            </p>
          </div>

          <strong>
            {apkUser.devices.length}{" "}
            dispositivo(s)
          </strong>
        </div>

        {apkUser.devices.length === 0 ? (
          <div
            className={styles.emptyDevice}
          >
            Nenhum dispositivo vinculado
            ainda.
          </div>
        ) : (
          <div
            className={styles.deviceList}
          >
            {apkUser.devices.map(
              (device: ApkUserDevice) => (
                <div
                  key={device.id}
                  className={
                    styles.deviceItem
                  }
                >
                  <div>
                    <strong>
                      {device.deviceName ||
                        "Dispositivo sem nome"}
                    </strong>

                    <small>
                      {device.deviceId}
                    </small>
                  </div>

                  <span
                    className={
                      device.active
                        ? styles.active
                        : styles.inactive
                    }
                  >
                    {device.active
                      ? "Ativo"
                      : "Bloqueado"}
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </AdminShell>
  );
}