// src/app/(private)/projects/[id]/permissions/page.tsx

import { redirect } from "next/navigation";
import { AdminShell } from "../../../../../components/layout/AdminShell/AdminShell";
import { getAdminSession } from "../../../../../lib/auth/session";
import { prisma } from "../../../../../lib/prisma";
import PermissionsManager from "./PermissionsManager";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function ProjectPermissionsPage({ params }: Props) {
    const session = await getAdminSession();

    if (!session) {
        redirect("/login");
    }

    const { id } = await params;

    const project = await prisma.appProject.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            permissions: {
                orderBy: { name: "asc" },
                select: {
                    id: true,
                    name: true,
                    key: true,
                    description: true,
                    active: true,
                },
            },
        },
    });

    if (!project) {
        redirect("/projects");
    }

    return (
        <AdminShell>
            <PermissionsManager
                projectId={project.id}
                projectName={project.name}
                initialPermissions={project.permissions}
            />
        </AdminShell>
    );
}