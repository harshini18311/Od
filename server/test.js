import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const students = await prisma.student.findMany({ include: { user: true }, orderBy: { regNo: 'asc' } });
  console.log('Total students:', students.length);
  console.log('First 10:');
  students.slice(0, 10).forEach(s => console.log(`  ${s.regNo} - ${s.user.name}`));
  console.log('...');
  console.log('Last 5:');
  students.slice(-5).forEach(s => console.log(`  ${s.regNo} - ${s.user.name}`));
  
  // Check if 24UCS073 exists
  const target = students.find(s => s.regNo === '24UCS073');
  console.log('\n24UCS073:', target ? `${target.user.name}` : 'NOT FOUND');
}
main().finally(() => prisma.$disconnect());
