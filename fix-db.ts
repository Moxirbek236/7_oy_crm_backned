import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`INSERT INTO "Center" (id, name, status, created_at, updated_at) VALUES (1, 'Najot Talim', 'active', NOW(), NOW()) ON CONFLICT DO NOTHING`);
  await prisma.$executeRawUnsafe(`INSERT INTO "Branch" (id, center_id, name, status, created_at, updated_at) VALUES (1, 1, 'Asosiy filial', 'active', NOW(), NOW()) ON CONFLICT DO NOTHING`);
  console.log('Fixed DB');
}

main().catch(console.error).finally(() => prisma.$disconnect());
