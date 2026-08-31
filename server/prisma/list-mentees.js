import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  // 1. Find Staff Users in Database
  const staff = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'SUNDARARAJU' } },
        { name: { contains: 'ANANDH' } }
      ]
    }
  });

  console.log('=== STAFF FOUND IN DB ===');
  for (const s of staff) {
    console.log(`ID: ${s.id} | Name: ${s.name} | Email: ${s.email} | Role: ${s.role}`);
  }

  const staffIds = staff.map(s => s.id);

  // 2. Query Students by mentorId or chairpersonId
  const students = await prisma.student.findMany({
    where: {
      OR: [
        { mentorId: { in: staffIds } },
        { chairpersonId: { in: staffIds } }
      ]
    },
    include: {
      user: true
    },
    orderBy: [
      { year: 'asc' },
      { section: 'asc' },
      { regNo: 'asc' }
    ]
  });

  console.log(`\n=== MENTEES / STUDENTS ASSIGNED IN DB (${students.length} found) ===`);
  for (const st of students) {
    const mentor = staff.find(s => s.id === st.mentorId);
    const chair = staff.find(s => s.id === st.chairpersonId);
    console.log(`Roll/RegNo: ${st.regNo.padEnd(12)} | Name: ${st.user.name.padEnd(25)} | Year: ${st.year} | Sec: ${st.section} | Mentor: ${mentor ? mentor.name : st.mentorId} | Chair: ${chair ? chair.name : 'Other'}`);
  }

  // 3. Scan all Excel files to find exact mentions in source sheets
  console.log('\n=== SCANNING ORIGINAL EXCEL WORKBOOKS ===');
  const excelFiles = [
    'Mentor-II-CSE-A.xlsx',
    'Mentor-II-CSE-B.xlsx',
    'Mentor-II-CSE-C.xlsx',
    'Mentor-III-CSE-A.xlsx',
    'Mentor-III-CSE-B.xlsx',
    'Mentor-III-CSE-C.xlsx'
  ];

  for (const file of excelFiles) {
    const filePath = path.join(__dirname, '../../', file);
    try {
      const workbook = xlsx.readFile(filePath);
      for (const sheetName of workbook.SheetNames) {
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
        for (const row of rows) {
          const mentorName = String(row['MENTOR NAME'] || row['Mentor Name'] || row['MENTOR'] || '').toUpperCase();
          const studentName = row['NAME'] || row['Name'] || row['STUDENT NAME'] || '';
          const rollNo = row['ROLL NUMBER'] || row['Roll Number'] || row['REG NO'] || row['ROLL NO'] || '';

          if (mentorName.includes('SUNDARARAJU') || mentorName.includes('ANANDH')) {
            console.log(`[Excel: ${file} -> ${sheetName}] Roll: ${rollNo} | Name: ${studentName} | Mentor Column: ${mentorName}`);
          }
        }
      }
    } catch (e) {
      console.error(`Error reading ${file}:`, e.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
