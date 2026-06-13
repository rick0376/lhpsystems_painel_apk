// src/app/(private)/devices/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye } from "lucide-react";
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

export default async function DevicesPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const devices = (await prisma.device.findMany({
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

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>Acessos</span>

          <h1 className={styles.title}>Dispositivos</h1>

          <p className={styles.subtitle}>
            Veja quais aparelhos foram vinculados aos usuários dos seus APKs.
          </p>
        </div>
      </section>

      <section className={styles.card}>
        {devices.length === 0 ? (
          <div className={styles.empty}>
            <strong>Nenhum dispositivo cadastrado</strong>
            <span>Os dispositivos aparecerão aqui após o login no APK.</span>
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

            {devices.map((device: DeviceListItem) => (
              <div key={device.id} className={styles.tableRow}>
                <div>
                  <strong>{device.deviceName || "Sem nome"}</strong>
                  <small>{device.deviceId}</small>
                </div>

                <div>
                  <strong>{device.apkUser.name}</strong>
                  <small>{device.apkUser.username}</small>
                </div>

                <div>
                  <strong>{device.apkUser.project.name}</strong>
                  <small>{device.apkUser.project.slug}</small>
                </div>

                <span>{formatDate(device.lastAccessAt)}</span>

                <div className={styles.statusCell}>
                  <span
                    className={device.active ? styles.active : styles.inactive}
                  >
                    {device.active ? "Ativo" : "Bloqueado"}
                  </span>
                </div>

                <div className={styles.actions}>
                  <Link
                    href={`/apk-users/${device.apkUser.id}`}
                    className={styles.viewButton}
                    title="Ver usuário"
                    aria-label="Ver usuário"
                  >
                    <Eye size={18} strokeWidth={2.4} />
                  </Link>

                  <ToggleDeviceStatusButton
                    deviceId={device.id}
                    active={device.active}
                    deviceName={device.deviceName || device.deviceId}
                  />

                  <DeleteDeviceButton
                    deviceId={device.id}
                    deviceName={device.deviceName || device.deviceId}
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
