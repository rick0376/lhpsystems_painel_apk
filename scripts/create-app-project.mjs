// scripts/create-app-project.mjs

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada no .env");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const project = await prisma.appProject.upsert({
    where: {
      slug: "lhp-live-prayer",
    },
    update: {
      name: "LHP Live Prayer",
      appKey: "lhp_live_prayer_2026",
      description: "Aplicativo de transmissão de orações ao vivo.",
      active: true,
    },
    create: {
      name: "LHP Live Prayer",
      slug: "lhp-live-prayer",
      appKey: "lhp_live_prayer_2026",
      description: "Aplicativo de transmissão de orações ao vivo.",
      active: true,
    },
  });

  console.log("Projeto APK criado/atualizado com sucesso:");
  console.log({
    id: project.id,
    name: project.name,
    slug: project.slug,
    appKey: project.appKey,
    active: project.active,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
