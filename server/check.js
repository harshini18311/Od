import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const students = await prisma.student.findMany({ include: { user: true } });
  console.log(students.map(s => s.regNo + ' - ' + s.user.name));
}
main().finally(() => prisma.$disconnect());
