import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ─── Workbook definitions ─── */
const workbookGroups = [
  {
    year: 3,
    range: 1,  // III-year files have an extra blank row at the top
    files: [
      path.join(__dirname, '../../Mentor-III-CSE-A.xlsx'),
      path.join(__dirname, '../../Mentor-III-CSE-B.xlsx'),
      path.join(__dirname, '../../Mentor-III-CSE-C.xlsx')
    ]
  },
  {
    year: 2,
    range: 0,  // II-year files start with the header row at row 0
    files: [
      path.join(__dirname, '../../Mentor-II-CSE-A.xlsx'),
      path.join(__dirname, '../../Mentor-II-CSE-B.xlsx'),
      path.join(__dirname, '../../Mentor-II-CSE-C.xlsx')
    ]
  }
];

/* ─── Year and Section to Chairperson Mapping ─── */
const YEAR_SECTION_CHAIRPERSON_MAP = {
  '2-A': 'Mrs.LEELARANI',
  '2-B': 'Mrs.IGNATIUS SELVARANI X',
  '2-C': 'Mrs.KAVITHA G',
  '3-A': 'Mrs.PRIYADHARSHINI.K',
  '3-B': 'Mrs.ATHILAKSHMI S',
  '3-C': 'Dr.ANANDH. A'
};

/* ─── Utility helpers ─── */
function normalizeKey(value) {
  let key = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');
  if (key === 'MRBMUTHUKRISHNAVINAYAGM') {
    key = 'MRBMUTHUKRISHNAVINAYAGAM';
  }
  return key;
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

function normalizeNameTokens(value) {
  const expandedTokens = [];

  for (const token of String(value ?? '')
    .trim()
    .toUpperCase()
    .split(/[^A-Z0-9]+/g)
    .filter(Boolean)
  ) {
    if (['MR', 'MRS', 'MS', 'DR', 'PROF', 'PROFESSOR'].includes(token)) {
      continue;
    }

    if (/^[A-Z]{1,2}$/.test(token)) {
      expandedTokens.push(...token.split(''));
    } else {
      expandedTokens.push(token);
    }
  }

  return expandedTokens.sort().join('|');
}

function normalizeStudentType(value) {
  const raw = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!raw) return 'DAY_SCHOLAR';
  if (raw.includes('HOSTELLER')) return 'HOSTELLER';
  return 'DAY_SCHOLAR';
}

function normalizeGender(value) {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'F') return 'F';
  return 'M';
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

function loadSheetRows(filePath, range) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, { range, defval: '' });

  return { filePath, sheetName, rows };
}

function loadWorkbookRows(filePath, range = 0) {
  const { rows } = loadSheetRows(filePath, range);
  return rows;
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

function normalizeOfficialEmail(value) {
  return String(value ?? '').trim().replace(/@+/g, '@');
}

function registerStaffRecord(staffDirectory, record, aliases = []) {
  staffDirectory.set(normalizeKey(record.name), record);
  for (const alias of aliases) {
    staffDirectory.set(normalizeKey(alias), record);
  }
}

function getStaffRecord(staffDirectory, name) {
  const targetKey = normalizeKey(name);
  const staffRecord = staffDirectory.get(targetKey);

  if (staffRecord) {
    return staffRecord;
  }

  const tokenKey = normalizeNameTokens(name);
  for (const record of staffDirectory.values()) {
    if (normalizeNameTokens(record.name) === tokenKey) {
      return record;
    }
  }

  throw new Error(`Missing staff workbook entry for ${name}`);
}

async function createUser({ name, email, role, password, deptId, staffId = null, recoveryEmail = null }) {
  if (staffId) {
    const existingByStaffId = await prisma.user.findUnique({ where: { staffId } });
    if (existingByStaffId) {
      return existingByStaffId;
    }
  }

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
      staffId,
      recoveryEmail,
      passwordHash,
      role,
      deptId
    }
  });
}

/* ─── Main ─── */
async function main() {
  console.log('Resetting database and seeding all workbook users (with fixed section chairpersons)...');

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

  /* Load all sheets from every group */
  const allSheets = []; // { year, sheetName, rows }[]
  for (const group of workbookGroups) {
    for (const filePath of group.files) {
      const { sheetName, rows } = loadSheetRows(filePath, group.range);
      allSheets.push({ year: group.year, sheetName, rows, filePath });
    }
  }

  const staffDirectory = new Map();
  registerStaffRecord(staffDirectory, { name: 'DR.A.MEENAKSHI', staffId: 'T1905694', officialEmail: 'hodcse@kamarajengg.edu.in' }, ['DR.MEENAKSHI']);
  registerStaffRecord(staffDirectory, { name: 'Dr.ANANDH. A', staffId: 'T908312', officialEmail: 'anandhcse@kamarajengg.edu.in' }, ['DR.A.ANANDH', 'DR.A.ANANDH & MS.S.LAVANYA', 'DR.A.ANANDH & MS. LAVANYA', 'DR.A.ANANDH & MS.S.LAVANYA']);
  registerStaffRecord(staffDirectory, { name: 'Dr.RAJESH KANNAN.V', staffId: 'T2206722', officialEmail: 'rajeshkannancse@kamarajengg.edu.in' }, ['DR.RAJESHKANNAN', 'DR.V.RAJESHKANNAN']);
  registerStaffRecord(staffDirectory, { name: 'Dr.UMA MAHESWARI.G', staffId: 'T2206721', officialEmail: 'umamaheswaricse@kamarajengg.edu.in' }, ['DR.UMAMAHESWARI', 'DR.G.UMAMAHESWARI']);
  registerStaffRecord(staffDirectory, { name: 'Mr.ASIR.D', staffId: 'T2208727', officialEmail: 'asircse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mr.B MUTHU KRISHNA VINAYAGAM', staffId: 'T0712241', officialEmail: 'muthukrishnavinayagamcse@kamarajengg.edu.in' }, ['MR.B.MUTHUKRISHNAVINAYAM', 'MR.B.MUTHUKRISHNAVINAYAGM']);
  registerStaffRecord(staffDirectory, { name: 'Mr.G.SUNDARARAJU', staffId: 'T2501766', officialEmail: 'sundararajucse@kamarajengg.edu.in' }, ['MR.G.SUNDARARAJU']);
  registerStaffRecord(staffDirectory, { name: 'Mr.JOHN LIVINGSTON.J', staffId: 'T2301730', officialEmail: 'johnlivingstoncse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mr.KUMARAVEL.R', staffId: 'T2306742', officialEmail: 'kumaravelcse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mr.PRAVEEN KUMAR.G', staffId: 'T2306735', officialEmail: 'gpraveenkumarcse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mr.RAJ.D', staffId: 'T2306741', officialEmail: 'rajcse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mr.S RAM PRASATH', staffId: 'T2501763', officialEmail: 'ramprasathcse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mrs.ARCHANA DEVI.S', staffId: 'T2407755', officialEmail: 'archanadevicse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mrs.ATHILAKSHMI S', staffId: 'T0706214', officialEmail: 'athilakshmicse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mrs.IGNATIUS SELVARANI X', staffId: 'T2205717', officialEmail: 'ignatiusselvaranicse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mrs.KAVITHA G', staffId: 'T2512786', officialEmail: 'kavithagcse@kamarajengg.edu.in' }, [
    'MRS.KAVITHA',
    'MS.KAVITHA',
    'MRS.G.KAVITHA',
    'MR.G.SUNDARARAJU & MRS.G.KAVITHA',
    'MR.G.SUNDARARAJU & MRS. G.KAVITHA',
    'MR.G.SUNDARARAJU & MS.G.KAVITHA',
    'MR. G. SUNDARARAJU & MRS.G.KAVITHA',
    'MR.G.SUNDARARAJU & MRS.G.KAVITHA'
  ]);
  registerStaffRecord(staffDirectory, { name: 'Mrs.LEELARANI', staffId: 'T1412561', officialEmail: 'leelaranicse@kamarajengg.edu.in' }, ['MRS.K.LEELARANI', 'MS.K.LEELARANI']);
  registerStaffRecord(staffDirectory, { name: 'Mrs.MOHANA.M', staffId: 'T2407756', officialEmail: 'mohanacse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mrs.MUTHUCHELVI.G.A', staffId: 'T2505772', officialEmail: 'muthuchelvicse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mrs.PRIYADHARSHINI.K', staffId: 'T2407753', officialEmail: 'priyadharshinicse@kamarajengg.edu.in' }, ['MRS.K.PRIYADHARSHINI']);
  registerStaffRecord(staffDirectory, { name: 'Mrs.PUSHPALATHA.GC', staffId: 'T2505770', officialEmail: 'pushpalathacse@kamarajengg.edu.in' }, ['MRS.G.C.PUSHPALATHA']);
  registerStaffRecord(staffDirectory, { name: 'Mrs.ROHINI PRIYA.G', staffId: 'T2408758', officialEmail: 'rohinipriyacse@kamarajengg.edu.in' }, ['MRS.G.ROHINI PRIYA']);
  registerStaffRecord(staffDirectory, { name: 'Mrs.S MARIA SOBANA', staffId: 'T2507782', officialEmail: 'mariasobanacse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mrs.S SARASWATHI', staffId: 'T2507783', officialEmail: 'saraswathicse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mrs.SHALOM PRISCILLA.I', staffId: 'T2506774', officialEmail: 'shalompriscillacse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Mrs.VIJAYALAKSHMI.E', staffId: 'T2306740', officialEmail: 'vijayalakshmicse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Ms.D.PRADHIBA', staffId: 'T2308744', officialEmail: 'pradhibacse@kamarajengg.edu.in' });
  registerStaffRecord(staffDirectory, { name: 'Ms.S.LAVANYA', staffId: 'T2512787', officialEmail: 'slavanyacse@kamarajengg.edu.in' }, ['MS.S.LAVANYA', 'MS.LAVANYA', 'DR.A.ANANDH & MS. LAVANYA', 'DR.A.ANANDH & MS.S.LAVANYA']);
  registerStaffRecord(staffDirectory, { name: 'Ms.T.DIVYA', staffId: 'T2406751', officialEmail: 'divyacse@kamarajengg.edu.in' });

  /* ─── Fixed accounts ─── */
  const admin = await createUser({
    name: 'Admin Officer',
    email: 'admin@cse',
    role: 'admin',
    password: 'Test123',
    deptId: department.id
  });


  /* ─── Collect unique staff from ALL sheets ─── */
  const mentorMap = new Map();
  for (const { rows } of allSheets) {
    for (const row of rows) {
      let mentorName = String(getCell(row, 'MENTOR NAME')).trim();
      const sheetHodName = String(getCell(row, 'HOD NAME')).trim();

      if (mentorName === 'MR.G.SUNDARARAJU & MRS.G.KAVITHA') {
        mentorName = 'Mrs.KAVITHA G';
      } else if (mentorName === 'DR.A.ANANDH & MS. S.LAVANYA') {
        mentorName = 'Ms.S.LAVANYA';
      }

      if (mentorName) {
        const key = normalizeKey(mentorName);
        if (key && !mentorMap.has(key)) {
          mentorMap.set(key, mentorName);
        }
      }
    }
  }

  /* ─── HOD ─── */
  const hodRecord = getStaffRecord(staffDirectory, 'DR.A.MEENAKSHI');
  const hodUser = await createUser({
    name: hodRecord.name,
    email: 'meenakshi@cse',
    role: 'hod',
    password: hodRecord.staffId,
    deptId: department.id,
    staffId: hodRecord.staffId,
    recoveryEmail: hodRecord.officialEmail
  });

  await prisma.department.update({
    where: { id: department.id },
    data: { hodId: hodUser.id }
  });

  /* ─── Chairpersons (mapped by academic year and section) ─── */
  const chairMap = new Map([
    [normalizeKey('Mrs.LEELARANI'), 'Mrs.LEELARANI'],
    [normalizeKey('Mrs.IGNATIUS SELVARANI X'), 'Mrs.IGNATIUS SELVARANI X'],
    [normalizeKey('Mrs.KAVITHA G'), 'Mrs.KAVITHA G'],
    [normalizeKey('Mrs.PRIYADHARSHINI.K'), 'Mrs.PRIYADHARSHINI.K'],
    [normalizeKey('Mrs.ATHILAKSHMI S'), 'Mrs.ATHILAKSHMI S'],
    [normalizeKey('Dr.ANANDH. A'), 'Dr.ANANDH. A']
  ]);

  const chairUsers = new Map();
  for (const chairName of chairMap.values()) {
    const chairRecord = getStaffRecord(staffDirectory, chairName);
    const email = `${normalizeLoginPart(chairName)}@cse`;
    const chairUser = await createUser({
      name: chairRecord.name,
      email,
      role: 'chairperson',
      password: chairRecord.staffId,
      deptId: department.id,
      staffId: chairRecord.staffId,
      recoveryEmail: chairRecord.officialEmail
    });
    chairUsers.set(normalizeKey(chairRecord.name), chairUser);
  }

  /* ─── Mentors ─── */
  const mentorUsers = new Map();
  for (const mentorName of mentorMap.values()) {
    const key = normalizeKey(mentorName);
    if (key === normalizeKey('DR.A.MEENAKSHI')) {
      mentorUsers.set(key, hodUser);
      continue;
    }

    if (chairUsers.has(key)) {
      mentorUsers.set(key, chairUsers.get(key));
      continue;
    }

    const mentorRecord = getStaffRecord(staffDirectory, mentorName);
    const email = `${normalizeLoginPart(mentorName)}@cse`;
    const mentorUser = await createUser({
      name: mentorRecord.name,
      email,
      role: 'mentor',
      password: mentorRecord.staffId,
      deptId: department.id,
      staffId: mentorRecord.staffId,
      recoveryEmail: mentorRecord.officialEmail
    });
    mentorUsers.set(key, mentorUser);
  }

  /* ─── Students (from every year/section) ─── */
  let createdStudents = 0;
  for (const { year, sheetName, rows } of allSheets) {
    const section = sheetName.trim().split(/\s+/).pop() || 'A';

    for (const row of rows) {
      const rollNo = String(getCell(row, 'ROLL NUMBER')).trim().toUpperCase();
      const regNo = rollNo;
      const studentName = String(getCell(row, 'NAME')).trim();
      let mentorName = String(getCell(row, 'MENTOR NAME')).trim();
      if (mentorName === 'MR.G.SUNDARARAJU & MRS.G.KAVITHA') {
        mentorName = 'Mrs.KAVITHA G';
      } else if (mentorName === 'DR.A.ANANDH & MS. S.LAVANYA') {
        mentorName = 'Ms.S.LAVANYA';
      }
      const studentType = normalizeStudentType(getCell(row, 'TYPE'));
      const gender = normalizeGender(getCell(row, 'GENDER'));

      if (!rollNo || !regNo || !studentName) {
        continue;
      }

      // Map chairperson name based on the student's academic year and section
      const mappedChairpersonName = YEAR_SECTION_CHAIRPERSON_MAP[`${year}-${section}`] || 'Mrs.PRIYADHARSHINI.K';

      const mentorUser = mentorUsers.get(normalizeKey(mentorName));
      const chairUser = chairUsers.get(normalizeKey(mappedChairpersonName));
      
      if (!mentorUser) {
        throw new Error(`Missing mentor account for ${mentorName || studentName} in ${sheetName}`);
      }
      if (!chairUser) {
        throw new Error(`Missing chairperson account for ${mappedChairpersonName || studentName} in ${sheetName}`);
      }

      const studentUser = await createUser({
        name: studentName,
        email: rollNo,
        role: 'student',
        password: rollNo.toLowerCase(),
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
            year,
            section,
            type: studentType,
            gender,
            mentorId: mentorUser.id,
            chairpersonId: chairUser.id,
            deptId: department.id
          }
        });
        createdStudents += 1;
      }
    }
  }

  console.log(`Seeded: admin=${admin.email}, hod=${hodUser.email}, ` +
    `${mentorUsers.size} mentors, ${chairUsers.size} chairpersons, ` +
    `${createdStudents} students (across ${allSheets.length} sheets).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
