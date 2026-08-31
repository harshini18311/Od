import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Search for any user with SUNDARARAJU in name
  const users = await prisma.user.findMany({
    where: { name: { contains: 'SUNDARARAJU' } }
  });
  console.log('Users matching SUNDARARAJU:');
  users.forEach(u => console.log(`  ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`));

  // Check Kavitha's current mentees
  const kavithaId = '61ed6d9c-971d-4546-ab92-597245f17bd5';
  const mentees = await prisma.student.findMany({
    where: { mentorId: kavithaId },
    include: { user: true },
    orderBy: { regNo: 'asc' }
  });
  console.log(`\nKavitha (${kavithaId}) current mentees: ${mentees.length}`);
  mentees.forEach(s => console.log(`  ${s.regNo} - ${s.user.name}`));

  // Also check Anandh's mentees now
  const anandhId = '132337dc-bb63-4dfa-a211-4d18682ced00';
  const anandhMentees = await prisma.student.findMany({
    where: { mentorId: anandhId },
    include: { user: true },
    orderBy: { regNo: 'asc' }
  });
  console.log(`\nAnandh (${anandhId}) mentees: ${anandhMentees.length}`);
  anandhMentees.forEach(s => console.log(`  ${s.regNo} - ${s.user.name}`));

  // Check Lavanya
  const lavanyaId = 'b7d8e266-9713-49b9-a3b0-5535ec392c0e';
  const lavanyaMentees = await prisma.student.count({ where: { mentorId: lavanyaId } });
  console.log(`\nLavanya mentees: ${lavanyaMentees}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
