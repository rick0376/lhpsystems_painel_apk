// src/app/(private)/devices/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AppWindow,
  Ban,
  Clock3,
  Eye,
  MonitorSmartphone,
  ShieldCheck,
  Users,
} from "lucide-react";

import { AdminShell } from "../../../components/layout/AdminShell/AdminShell";
import { DeleteDeviceButton } from "../../../components/devices/DeleteDeviceButton/DeleteDeviceButton";
import { ToggleDeviceStatusButton } from "../../../components/devices/ToggleDeviceStatusButton/ToggleDeviceStatusButton";
import { getAdminSession } from "../../../lib/auth/session";
import { prisma } from "../../../lib/prisma";

import styles from "./styles.module.scss";

type DeviceListItem = {
  id: string;
  deviceId: string;
  deviceName: string | null;
  active: boolean;
  lastAccessAt: Date | null;
  updatedAt: Date;

  apkUser: {
    id: string;
    name: string;
    username: string;

    project: {
      id: string;
      name: string;
      slug: string;
    };
  };
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Nunca acessou";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function accessedRecently(date: Date | null) {
  if (!date) {
    return false;
  }

  const now = new Date();

  const sevenDaysAgo = new Date(
    now.getTime() -
    7 * 24 * 60 * 60 * 1000,
  );

  return date >= sevenDaysAgo;
}

export default async function DevicesPage() {
  const session =
    await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const devices =
    (await prisma.device.findMany({
      orderBy: {
        updatedAt: "desc",
      },

      include: {
        apkUser: {
          select: {
            id: true,
            name: true,
            username: true,

            project: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })) as DeviceListItem[];

  const activeDevices =
    devices.filter(
      (device) => device.active,
    ).length;

  const blockedDevices =
    devices.filter(
      (device) => !device.active,
    ).length;

  const uniqueUsers = new Set(
    devices.map(
      (device) => device.apkUser.id,
    ),
  ).size;

  const uniqueProjects = new Set(
    devices.map(
      (device) =>
        device.apkUser.project.id,
    ),
  ).size;

  const recentDevices =
    devices.filter((device) =>
      accessedRecently(
        device.lastAccessAt,
      ),
    ).length;

  return (
    <AdminShell>
      <section className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <MonitorSmartphone size={25} />
          </div>

          <div>
            <span className={styles.badge}>
              Controle de acessos
            </span>

            <h1 className={styles.title}>
              Dispositivos
            </h1>

            <p className={styles.subtitle}>
              Acompanhe celulares, navegadores
              e aparelhos vinculados aos
              usuários dos seus aplicativos.
            </p>
          </div>
        </div>

        <div className={styles.headerStatus}>
          <ShieldCheck size={18} />

          <div>
            <strong>
              {activeDevices}
            </strong>

            <span>
              dispositivos ativos
            </span>
          </div>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div
            className={`${styles.summaryIcon} ${styles.totalIcon}`}
          >
            <MonitorSmartphone size={20} />
          </div>

          <div>
            <span>Total</span>

            <strong>
              {devices.length}
            </strong>

            <small>
              Dispositivos cadastrados
            </small>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div
            className={`${styles.summaryIcon} ${styles.activeIcon}`}
          >
            <ShieldCheck size={20} />
          </div>

          <div>
            <span>Ativos</span>

            <strong>
              {activeDevices}
            </strong>

            <small>
              Acesso permitido
            </small>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div
            className={`${styles.summaryIcon} ${styles.blockedIcon}`}
          >
            <Ban size={20} />
          </div>

          <div>
            <span>Bloqueados</span>

            <strong>
              {blockedDevices}
            </strong>

            <small>
              Acesso desativado
            </small>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div
            className={`${styles.summaryIcon} ${styles.recentIcon}`}
          >
            <Clock3 size={20} />
          </div>

          <div>
            <span>Recentes</span>

            <strong>
              {recentDevices}
            </strong>

            <small>
              Acesso nos últimos 7 dias
            </small>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.eyebrow}>
              Segurança
            </span>

            <h2>
              Dispositivos vinculados
            </h2>

            <p>
              Consulte usuário, aplicativo,
              último acesso e situação de cada
              dispositivo.
            </p>
          </div>

          <div className={styles.cardSummary}>
            <span>
              <Users size={14} />
              {uniqueUsers} usuários
            </span>

            <span>
              <AppWindow size={14} />
              {uniqueProjects} projetos
            </span>
          </div>
        </div>

        {devices.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <MonitorSmartphone size={27} />
            </div>

            <strong>
              Nenhum dispositivo cadastrado
            </strong>

            <span>
              Os dispositivos aparecerão aqui
              após o primeiro login em um APK.
            </span>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Dispositivo</span>
              <span>Usuário</span>
              <span>Projeto</span>
              <span>Último acesso</span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            <div className={styles.tableBody}>
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={styles.tableRow}
                >
                  <div
                    className={
                      styles.deviceCell
                    }
                  >
                    <div
                      className={
                        styles.deviceAvatar
                      }
                    >
                      <MonitorSmartphone
                        size={18}
                      />
                    </div>

                    <div
                      className={
                        styles.deviceInfo
                      }
                    >
                      <strong>
                        {device.deviceName ||
                          "Sem nome"}
                      </strong>

                      <small>
                        {device.deviceId}
                      </small>
                    </div>
                  </div>

                  <div
                    className={
                      styles.dataCell
                    }
                    data-label="Usuário"
                  >
                    <strong
                      className={
                        styles.userName
                      }
                    >
                      {
                        device.apkUser
                          .name
                      }
                    </strong>

                    <small
                      className={
                        styles.userLogin
                      }
                    >
                      @
                      {
                        device.apkUser
                          .username
                      }
                    </small>
                  </div>

                  <div
                    className={
                      styles.dataCell
                    }
                    data-label="Projeto"
                  >
                    <strong
                      className={
                        styles.projectName
                      }
                    >
                      {
                        device.apkUser
                          .project.name
                      }
                    </strong>

                    <small
                      className={
                        styles.projectSlug
                      }
                    >
                      {
                        device.apkUser
                          .project.slug
                      }
                    </small>
                  </div>

                  <div
                    className={
                      styles.dataCell
                    }
                    data-label="Último acesso"
                  >
                    <span
                      className={
                        styles.accessDate
                      }
                    >
                      {formatDate(
                        device.lastAccessAt,
                      )}
                    </span>

                    {accessedRecently(
                      device.lastAccessAt,
                    ) && (
                        <small
                          className={
                            styles.recentAccess
                          }
                        >
                          Acesso recente
                        </small>
                      )}
                  </div>

                  <div
                    className={
                      styles.statusCell
                    }
                    data-label="Status"
                  >
                    <span
                      className={
                        device.active
                          ? styles.active
                          : styles.inactive
                      }
                    >
                      <i />

                      {device.active
                        ? "Ativo"
                        : "Bloqueado"}
                    </span>
                  </div>

                  <div
                    className={
                      styles.actions
                    }
                    data-label="Ações"
                  >
                    <Link
                      href={`/apk-users/${device.apkUser.id}`}
                      className={
                        styles.viewButton
                      }
                      title="Ver usuário"
                      aria-label="Ver usuário"
                    >
                      <Eye
                        size={17}
                        strokeWidth={2.3}
                      />
                    </Link>

                    <ToggleDeviceStatusButton
                      deviceId={device.id}
                      active={device.active}
                      deviceName={
                        device.deviceName ||
                        device.deviceId
                      }
                    />

                    <DeleteDeviceButton
                      deviceId={device.id}
                      deviceName={
                        device.deviceName ||
                        device.deviceId
                      }
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