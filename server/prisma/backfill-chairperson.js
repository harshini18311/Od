import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workbookFiles = [
  path.join(__dirname, '../../Mentor-III-CSE-A.xlsx'),
  path.join(__dirname, '../../Mentor-III-CSE-B.xlsx'),
  path.join(__dirname, '../../Mentor-III-CSE-C.xlsx')
];

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');
}

function normalizeLoginPart(value) {
  const tokens = String(value ?? '')
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)
    .filter((token) => !['mr', 'mrs', 'ms', 'dr', 'prof', 'professor'].includes(token))
    .filter((token) => token.length > 1);

  return tokens.join('');
}

function getCell(row, label) {
  const target = String(label).trim();
  for (const [key, value] of Object.entries(row)) {
    if (String(key).trim() === target) {
      return value;
    }
  }
  return '';
}

function loadSheetRows(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, { range: 1, defval: '' });

  return { filePath, sheetName, rows };
}

async function createUser({ name, email, role, password, deptId }) {
  let candidateEmail = email;
  let aliasIndex = 0;

  while (true) {
    const existingUser = await prisma.user.findUnique({ where: { email: candidateEmail } });
    if (!existingUser) {
      break;
    }

    if (existingUser.role === role) {
      return existingUser;
    }

    aliasIndex += 1;
    candidateEmail = aliasIndex === 1
      ? `${email.split('@')[0]}.${role}@${email.split('@')[1]}`
      : `${email.split('@')[0]}.${role}${aliasIndex}@${email.split('@')[1]}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      name,
      email: candidateEmail,
      passwordHash,
      role,
      deptId
    }
  });
}

async function main() {
  const department = await prisma.department.findFirst({ where: { code: 'CSE' } });
  if (!department) {
    throw new Error('CSE department not found. Seed the database first.');
  }

  const sheets = workbookFiles.map(loadSheetRows);

  const chairMap = new Map();
  for (const { rows } of sheets) {
    for (const row of rows) {
      const chairName = String(getCell(row, 'CHAIRPERSON NAME')).trim();
      if (!chairName) continue;

      const key = normalizeKey(chairName);
      if (key && !chairMap.has(key)) {
        chairMap.set(key, chairName);
      }
    }
  }

  const chairUsers = new Map();
  for (const chairName of chairMap.values()) {
    const email = `${normalizeLoginPart(chairName)}@cse`;
    const chairUser = await createUser({
      name: chairName,
      email,
      role: 'chairperson',
      password: 'Test123',
      deptId: department.id
    });
    chairUsers.set(normalizeKey(chairName), chairUser);
  }

  let updated = 0;
  for (const { sheetName, rows } of sheets) {
    for (const row of rows) {
      const regNo = String(getCell(row, 'REGISTER NUMBER')).trim();
      const chairName = String(getCell(row, 'CHAIRPERSON NAME')).trim();

      if (!regNo || !chairName) continue;

      const chairUser = chairUsers.get(normalizeKey(chairName));
      if (!chairUser) continue;

      const existingStudent = await prisma.student.findUnique({ where: { regNo } });
      if (!existingStudent) continue;

      if (existingStudent.chairpersonId !== chairUser.id) {
        await prisma.student.update({
          where: { regNo },
          data: { chairpersonId: chairUser.id }
        });
        updated += 1;
      }
    }
  }

  console.log(`Updated chairperson assignment for ${updated} students.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });