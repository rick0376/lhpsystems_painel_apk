import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada no .env");
}

if (!name || !email || !password) {
  throw new Error(
    "ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios. Nenhuma senha padrão será utilizada.",
  );
}

if (password.length < 12) {
  throw new Error("ADMIN_PASSWORD precisa ter pelo menos 12 caracteres.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
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
