import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelFiles = [
  { file: 'Mentor-II-CSE-A.xlsx', sheet: 'II CSE A', year: 2, section: 'A' },
  { file: 'Mentor-II-CSE-B.xlsx', sheet: 'II CSE B', year: 2, section: 'B' },
  { file: 'Mentor-II-CSE-C.xlsx', sheet: 'II CSE C', year: 2, section: 'C' },
  { file: 'Mentor-III-CSE-A.xlsx', sheet: 'III CSE A', year: 3, section: 'A' },
  { file: 'Mentor-III-CSE-B.xlsx', sheet: 'III CSE B', year: 3, section: 'B' },
  { file: 'Mentor-III-CSE-C.xlsx', sheet: 'III CSE C', year: 3, section: 'C' }
];

const sundararajuStudents = [];
const anandhStudents = [];

for (const item of excelFiles) {
  const filePath = path.join(__dirname, '../../', item.file);
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[item.sheet];
  const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  for (const row of rows) {
    const rollNo = String(row['ROLL NUMBER'] || row['Roll Number'] || row['REG NO'] || row['ROLL NO'] || '').trim().toUpperCase();
    const studentName = String(row['NAME'] || row['Name'] || row['STUDENT NAME'] || '').trim();
    const mentorName = String(row['MENTOR NAME'] || row['Mentor Name'] || row['MENTOR'] || '').trim().toUpperCase();

    if (!rollNo || !studentName) continue;

    if (mentorName.includes('SUNDARARAJU')) {
      sundararajuStudents.push({
        rollNo,
        studentName,
        year: item.year,
        section: item.section,
        mentorField: mentorName
      });
    }

    if (mentorName.includes('ANANDH')) {
      anandhStudents.push({
        rollNo,
        studentName,
        year: item.year,
        section: item.section,
        mentorField: mentorName
      });
    }
  }
}

console.log('=== SUNDARARAJU MENTEES (EXCEL SOURCE) ===');
console.log(`Total: ${sundararajuStudents.length}`);
sundararajuStudents.forEach((s, i) => {
  console.log(`${i+1}. ${s.rollNo} | ${s.studentName} | Year ${s.year} Sec ${s.section} | (${s.mentorField})`);
});

console.log('\n=== ANANDH MENTEES (EXCEL SOURCE) ===');
console.log(`Total: ${anandhStudents.length}`);
anandhStudents.forEach((s, i) => {
  console.log(`${i+1}. ${s.rollNo} | ${s.studentName} | Year ${s.year} Sec ${s.section} | (${s.mentorField})`);
});
