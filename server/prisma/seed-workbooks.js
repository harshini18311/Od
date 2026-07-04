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
]

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

function normalizeStudentType(value) {
  const raw = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!raw) return 'DAY_SCHOLAR';
  if (raw.includes('HOSTELLER')) return 'HOSTELLER';
  return 'DAY_SCHOLAR';
}

function buildRoleAlias(email, role) {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return `${email}.${role}`;
  }

  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);
  return `${localPart}.${role}@${domainPart}`;
}

function loadSheetRows(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, { range: 1, defval: '' });

  return { filePath, sheetName, rows };
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
    const aliasBase = aliasIndex === 1 ? role : `${role}${aliasIndex}`;
    candidateEmail = buildRoleAlias(email, aliasBase);
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
  console.log('Resetting database and seeding workbook users...');

  await prisma.notification.deleteMany({});
  await prisma.approvalLog.deleteMany({});
  await prisma.odRequest.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  const department = await prisma.department.create({
    data: {
      name: 'Computer Science and Engineering',
      code: 'CSE'
    }
  });

  const sheets = workbookFiles.map(loadSheetRows);
  const admin = await createUser({
    name: 'Admin Officer',
    email: 'admin@cse',
    role: 'admin',
    password: 'Test123',
    deptId: department.id
  });

  await createUser({
    name: 'College Principal',
    email: 'principal@kcet',
    role: 'principal',
    password: 'Test123',
    deptId: department.id
  });

  const mentorMap = new Map();
  const chairMap = new Map();
  let hodName = 'HOD';

  for (const { rows } of sheets) {
    for (const row of rows) {
      const mentorName = String(getCell(row, 'MENTOR NAME')).trim();
      const chairName = String(getCell(row, 'CHAIRPERSON NAME')).trim();
      const sheetHodName = String(getCell(row, 'HOD NAME')).trim();

      if (mentorName) {
        const key = normalizeKey(mentorName);
        if (key && !mentorMap.has(key)) {
          mentorMap.set(key, mentorName);
        }
      }

      if (chairName) {
        const key = normalizeKey(chairName);
        if (key && !chairMap.has(key)) {
          chairMap.set(key, chairName);
        }
      }

      if (sheetHodName) {
        hodName = sheetHodName;
      }
    }
  }

  const hodUser = await createUser({
    name: hodName,
    email: 'hod@cse',
    role: 'hod',
    password: 'Test123',
    deptId: department.id
  });

  await prisma.department.update({
    where: { id: department.id },
    data: { hodId: hodUser.id }
  });

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

  const mentorUsers = new Map();
  for (const mentorName of mentorMap.values()) {
    const email = `${normalizeLoginPart(mentorName)}@cse`;
    const mentorUser = await createUser({
      name: mentorName,
      email,
      role: 'mentor',
      password: 'Test123',
      deptId: department.id
    });
    mentorUsers.set(normalizeKey(mentorName), mentorUser);
  }

  let createdStudents = 0;
  for (const { sheetName, rows } of sheets) {
    const section = sheetName.trim().split(/\s+/).pop() || 'A';

    for (const row of rows) {
      const rollNo = String(getCell(row, 'ROLL NUMBER')).trim().toLowerCase();
      const regNo = String(getCell(row, 'REGISTER NUMBER')).trim() || rollNo;
      const studentName = String(getCell(row, 'NAME')).trim();
      const mentorName = String(getCell(row, 'MENTOR NAME')).trim();
      const studentType = normalizeStudentType(getCell(row, 'TYPE'));

      if (!rollNo || !regNo || !studentName) {
        continue;
      }

      const mentorUser = mentorUsers.get(normalizeKey(mentorName));
      const chairUser = chairUsers.get(normalizeKey(chairName));
      if (!mentorUser) {
        throw new Error(`Missing mentor account for ${mentorName || studentName} in ${sheetName}`);
      }
      if (!chairUser) {
        throw new Error(`Missing chairperson account for ${chairName || studentName} in ${sheetName}`);
      }

      const studentUser = await createUser({
        name: studentName,
        email: rollNo,
        role: 'student',
        password: rollNo,
        deptId: department.id
      });

      const existingStudent = await prisma.student.findUnique({
        where: { regNo }
      });

      if (!existingStudent) {
        await prisma.student.create({
          data: {
            userId: studentUser.id,
            regNo,
            year: 3,
            section,
            type: studentType,
            mentorId: mentorUser.id,
            chairpersonId: chairUser.id,
            deptId: department.id
          }
        });
        createdStudents += 1;
      }
    }
  }

  console.log(`Seeded ${admin.email}, ${hodUser.email}, ${mentorUsers.size} mentors, ${chairUsers.size} chairpersons, and ${createdStudents} students.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });