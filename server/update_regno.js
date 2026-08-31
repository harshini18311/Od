import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const students = await prisma.student.findMany({ include: { user: true } });
  
  for (let i = 0; i < students.length; i++) {
    const tempVal = `temp_ucs_upper_${i}`;
    await prisma.student.update({ where: { id: students[i].id }, data: { regNo: tempVal } });
    await prisma.user.update({ where: { id: students[i].userId }, data: { email: tempVal } });
  }

  for (let i = 0; i < students.length; i++) {
    const numStr = String(i + 1).padStart(3, '0');
    const newRegNo = `24UCS${numStr}`; // Uppercase format
    await prisma.student.update({ where: { id: students[i].id }, data: { regNo: newRegNo } });
    await prisma.user.update({ where: { id: students[i].userId }, data: { email: newRegNo } });
  }
  
  console.log(`Updated ${students.length} students to have regNo from 24UCS001 to 24UCS${String(students.length).padStart(3, '0')}`);
}

main().finally(() => prisma.$disconnect());
