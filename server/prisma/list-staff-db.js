import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { email: 'asc' }
  });

  console.log('--- All Staff Users in DB ---');
  for (const u of users) {
    if (u.role !== 'student') {
      console.log(`- ${u.role}: Email = ${u.email}, Name = ${u.name}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
