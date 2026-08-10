// Cria/atualiza somente o projeto da Bíblia no painel central.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não configurada no .env");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const project = await prisma.appProject.upsert({
    where: { slug: "biblia-sagrada" },
    update: {
      name: "Bíblia Sagrada",
      appKey: "biblia_sagrada_2026",
      description: "Bíblia Sagrada, Harpa Cristã, favoritos, anotações e estudo com IA.",
      active: true,
    },
    create: {
      name: "Bíblia Sagrada",
      slug: "biblia-sagrada",
      appKey: "biblia_sagrada_2026",
      description: "Bíblia Sagrada, Harpa Cristã, favoritos, anotações e estudo com IA.",
      active: true,
    },
  });

  console.log("Projeto da Bíblia criado/atualizado:");
  console.log({ id: project.id, name: project.name, slug: project.slug, appKey: project.appKey });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
