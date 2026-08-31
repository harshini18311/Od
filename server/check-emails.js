import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ where: { role: { not: 'student' } } });
  console.log('All staff emails:');
  users.forEach(u => {
    if (u.email.includes('engge') || u.email.includes('@@')) {
      console.log(`MALFORMED: ${u.email} for ${u.name}`);
    } else {
      console.log(u.email);
    }
  });
}
main().finally(() => prisma.$disconnect());
