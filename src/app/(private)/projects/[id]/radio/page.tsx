//src/app/(private)/projects/[id]//radio/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "../../../../../components/layout/AdminShell/AdminShell";
import { getAdminSession } from "../../../../../lib/auth/session";
import { prisma } from "../../../../../lib/prisma";
import { RadioConfigForm } from "./RadioConfigForm";
import styles from "./styles.module.scss";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectRadioPage({ params }: PageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const project = await prisma.appProject.findUnique({
    where: { id },
    include: { radioConfig: true },
  });

  if (!project) {
    redirect("/projects");
  }

  const config = project.radioConfig;

  return (
    <AdminShell>
      <section className={styles.header}>
        <div>
          <span className={styles.badge}>Transmissão ao vivo</span>
          <h1 className={styles.title}>Rádio de {project.name}</h1>
          <p className={styles.subtitle}>
            Estes dados são enviados ao aplicativo somente quando um usuário
            autorizado inicia uma oração ao vivo. A senha DJ não é exibida nem
            gravada no celular.
          </p>
        </div>

        <Link href={`/projects/${project.id}`} className={styles.backButton}>
          Voltar ao projeto
        </Link>
      </section>

      <RadioConfigForm
        projectId={project.id}
        initialConfig={{
          host: config?.host || "",
          sourcePort: config?.sourcePort || 4798,
          publicPort: config?.publicPort || 8100,
          playerUrl: config?.playerUrl || "",
          sourceUsername: config?.sourceUsername || "live",
          mountPoint: config?.mountPoint || "/",
          useTls: config?.useTls || false,
          enabled: config?.enabled ?? true,
          bitrate: config?.bitrate || 128,
          sampleRate: config?.sampleRate || 44100,
          channels: config?.channels || 2,
          version: config?.version || 0,
          credentialConfigured: Boolean(config?.sourcePasswordEncrypted),
          updatedAt: config?.updatedAt?.toISOString() || null,
        }}
      />
    </AdminShell>
  );
}
