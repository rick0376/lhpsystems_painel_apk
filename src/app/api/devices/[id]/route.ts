// src/app/api/devices/[id]/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "../../../../lib/auth/session";
import { prisma } from "../../../../lib/prisma";

type DeviceRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const updateDeviceSchema = z.object({
  active: z.boolean(),
});

export async function PATCH(request: Request, { params }: DeviceRouteProps) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error: "Não autorizado.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const data = updateDeviceSchema.parse(body);

    const device = await prisma.device.findUnique({
      where: {
        id,
      },
    });

    if (!device) {
      return NextResponse.json(
        {
          error: "Dispositivo não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    const updatedDevice = await prisma.device.update({
      where: {
        id,
      },
      data: {
        active: data.active,
      },
    });

    return NextResponse.json({
      device: updatedDevice,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Não foi possível atualizar o dispositivo.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE(_request: Request, { params }: DeviceRouteProps) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        error: "Não autorizado.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const { id } = await params;

    const device = await prisma.device.findUnique({
      where: {
        id,
      },
    });

    if (!device) {
      return NextResponse.json(
        {
          error: "Dispositivo não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.device.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dispositivo removido com sucesso.",
    });
  } catch {
    return NextResponse.json(
      {
        error: "Não foi possível remover o dispositivo.",
      },
      {
        status: 400,
      },
    );
  }
}
