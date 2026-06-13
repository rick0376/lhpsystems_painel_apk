// scripts/create-admin.mjs

import "dotenv/config";
import bcrypt from "bcryptjs";
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
  const name = process.env.ADMIN_NAME || "Rick Pereira";
  const email = process.env.ADMIN_EMAIL || "admin@lhpsystems.com";
  const password = process.env.ADMIN_PASSWORD || "123456";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: {
      email,
    },
    update: {
      name,
      passwordHash,
      role: "SUPERADMIN",
      active: true,
    },
    create: {
      name,
      email,
      passwordHash,
      role: "SUPERADMIN",
      active: true,
    },
  });

  console.log("Admin criado/atualizado com sucesso:");
  console.log({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
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
