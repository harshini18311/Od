import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

function normalizeStudentLogin(value) {
  return String(value ?? '').trim().toLowerCase();
}

async function main() {
  const users = await prisma.user.findMany({
    include: { student: true },
    orderBy: [{ role: 'asc' }, { email: 'asc' }]
  });

  const students = users
    .filter((user) => user.role === 'student')
    .map((user) => `- ${normalizeStudentLogin(user.email)} / ${normalizeStudentLogin(user.email)}`);

  const staff = users
    .filter((user) => ['mentor', 'chairperson', 'hod', 'admin'].includes(user.role))
    .map((user) => `- ${user.role}: ${user.email} / ${user.staffId || 'Test123'}`);

  const lines = [
    '# Login List',
    '',
    '## Students',
    ...students,
    '',
    '## Staff / HOD / Admin',
    ...staff,
    '',
    'Notes:',
    '- Students use roll number in lowercase for both username and password.',
    '- Staff and HOD use the staff ID from the staff details sheet as the password.',
    '- Admin remains on the shared admin password unless changed separately.'
  ];

  fs.writeFileSync('../LOGIN_LIST.md', lines.join('\n'), 'utf8');
  console.log('WROTE ../LOGIN_LIST.md');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });