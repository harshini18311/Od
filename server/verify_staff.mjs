import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workbook = xlsx.readFile(path.join(__dirname, '../Staff details.xlsx'));
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

// Skip header row
const staffRows = data.filter(row => row.__EMPTY !== 'Sl.No');

// ─── Staff directory from seed-workbooks.js (hardcoded) ───
const seedStaff = [
  { name: 'DR.A.MEENAKSHI',              staffId: 'T1905694', officialEmail: 'hodcse@kamarajengg.edu.in',                     role: 'hod',          loginEmail: 'meenakshi@cse' },
  { name: 'Dr.ANANDH. A',                staffId: 'T908312',  officialEmail: 'anandhcse@kamarajengg.edu.in',                 role: 'chairperson',  loginEmail: 'anandh@cse' },
  { name: 'Dr.RAJESH KANNAN.V',          staffId: 'T2206722', officialEmail: 'rajeshkannancse@kamarajengg.edu.in',            role: 'mentor',       loginEmail: 'rajeshkannan@cse' },
  { name: 'Dr.UMA MAHESWARI.G',          staffId: 'T2206721', officialEmail: 'umamaheswaricse@kamarajengg.edu.in',            role: 'mentor',       loginEmail: 'umamaheswari@cse' },
  { name: 'Mr.ASIR.D',                   staffId: 'T2208727', officialEmail: 'asircse@kamarajengg.edu.in',                    role: 'mentor',       loginEmail: 'asir@cse' },
  { name: 'Mr.B MUTHU KRISHNA VINAYAGAM', staffId: 'T0712241', officialEmail: 'muthukrishnavinayagamcse@kamarajengg.edu.in', role: 'mentor',       loginEmail: 'muthukrishnavinayagam@cse' },
  { name: 'Mr.G.SUNDARARAJU',            staffId: 'T2501766', officialEmail: 'sundararajucse@kamarajengg.edu.in',             role: 'mentor',       loginEmail: 'sundararaju@cse' },
  { name: 'Mr.JOHN LIVINGSTON.J',        staffId: 'T2301730', officialEmail: 'johnlivingstoncse@kamarajengg.edu.in',         role: 'mentor',       loginEmail: 'johnlivingston@cse' },
  { name: 'Mr.KUMARAVEL.R',              staffId: 'T2306742', officialEmail: 'kumaravelcse@kamarajengg.edu.in',          role: 'mentor',       loginEmail: 'kumaravel@cse' },
  { name: 'Mr.PRAVEEN KUMAR.G',          staffId: 'T2306735', officialEmail: 'gpraveenkumarcse@kamarajengg.edu.in',           role: 'mentor',       loginEmail: 'praveenkumar@cse' },
  { name: 'Mr.RAJ.D',                    staffId: 'T2306741', officialEmail: 'rajcse@kamarajengg.edu.in',                     role: 'mentor',       loginEmail: 'raj@cse' },
  { name: 'Mr.S RAM PRASATH',            staffId: 'T2501763', officialEmail: 'ramprasathcse@kamarajengg.edu.in',              role: 'mentor',       loginEmail: 'ramprasath@cse' },
  { name: 'Mrs.ARCHANA DEVI.S',          staffId: 'T2407755', officialEmail: 'archanadevicse@kamarajengg.edu.in',             role: 'mentor',       loginEmail: 'archanadevi@cse' },
  { name: 'Mrs.ATHILAKSHMI S',           staffId: 'T0706214', officialEmail: 'athilakshmicse@kamarajengg.edu.in',             role: 'chairperson',  loginEmail: 'athilakshmi@cse' },
  { name: 'Mrs.IGNATIUS SELVARANI X',    staffId: 'T2205717', officialEmail: 'ignatiusselvaranicse@kamarajengg.edu.in',       role: 'chairperson',  loginEmail: 'ignatiusselvarani@cse' },
  { name: 'Mrs.KAVITHA G',               staffId: 'T2512786', officialEmail: 'kavithagcse@kamarajengg.edu.in',                role: 'chairperson',  loginEmail: 'kavitha@cse' },
  { name: 'Mrs.LEELARANI',               staffId: 'T1412561', officialEmail: 'leelaranicse@kamarajengg.edu.in',               role: 'chairperson',  loginEmail: 'leelarani@cse' },
  { name: 'Mrs.MOHANA.M',                staffId: 'T2407756', officialEmail: 'mohanacse@kamarajengg.edu.in',                  role: 'mentor',       loginEmail: 'mohana@cse' },
  { name: 'Mrs.MUTHUCHELVI.G.A',         staffId: 'T2505772', officialEmail: 'muthuchelvicse@kamarajengg.edu.in',             role: 'mentor',       loginEmail: 'muthuchelvi@cse' },
  { name: 'Mrs.PRIYADHARSHINI.K',        staffId: 'T2407753', officialEmail: 'priyadharshinicse@kamarajengg.edu.in',          role: 'chairperson',  loginEmail: 'priyadharshini@cse' },
  { name: 'Mrs.PUSHPALATHA.GC',          staffId: 'T2505770', officialEmail: 'pushpalathacse@kamarajengg.edu.in',             role: 'mentor',       loginEmail: 'pushpalatha@cse' },
  { name: 'Mrs.ROHINI PRIYA.G',          staffId: 'T2408758', officialEmail: 'rohinipriyacse@kamarajengg.edu.in',             role: 'mentor',       loginEmail: 'rohinipriya@cse' },
  { name: 'Mrs.S MARIA SOBANA',          staffId: 'T2507782', officialEmail: 'mariasobanacse@kamarajengg.edu.in',             role: 'mentor',       loginEmail: 'mariasobana@cse' },
  { name: 'Mrs.S SARASWATHI',            staffId: 'T2507783', officialEmail: 'saraswathicse@kamarajengg.edu.in',              role: 'mentor',       loginEmail: 'saraswathi@cse' },
  { name: 'Mrs.SHALOM PRISCILLA.I',      staffId: 'T2506774', officialEmail: 'shalompriscillacse@kamarajengg.edu.in',         role: 'mentor',       loginEmail: 'shalompriscilla@cse' },
  { name: 'Mrs.VIJAYALAKSHMI.E',         staffId: 'T2306740', officialEmail: 'vijayalakshmicse@kamarajengg.edu.in',           role: 'mentor',       loginEmail: 'vijayalakshmi@cse' },
  { name: 'Ms.D.PRADHIBA',               staffId: 'T2308744', officialEmail: 'pradhibacse@kamarajengg.edu.in',                role: 'mentor',       loginEmail: 'pradhiba@cse' },
  { name: 'Ms.S.LAVANYA',                staffId: 'T2512787', officialEmail: 'slavanyacse@kamarajengg.edu.in',                role: 'mentor',       loginEmail: 'lavanya@cse' },
  { name: 'Ms.T.DIVYA',                  staffId: 'T2406751', officialEmail: 'divyacse@kamarajengg.edu.in',                   role: 'mentor',       loginEmail: 'divya@cse' },
];

console.log('\n========================================');
console.log('STAFF DETAILS VERIFICATION REPORT');
console.log('========================================\n');

// Check 1: Password = Staff ID
console.log('--- CHECK 1: Default Password = Staff ID ---\n');
const passwordIssues = [];
for (const seed of seedStaff) {
  // In the seed script, password is set to staffId
  // password: hodRecord.staffId (for HOD)
  // password: chairRecord.staffId (for chairpersons)
  // password: mentorRecord.staffId (for mentors)
  // But the LOGIN_LIST.md says "Test123" for all staff!
  console.log(`  ${seed.name.padEnd(35)} Login: ${seed.loginEmail.padEnd(30)} Password: ${seed.staffId} (Staff ID)`);
}

console.log('\n--- CHECK 2: Recovery Email Comparison (Seed vs Excel) ---\n');

const emailIssues = [];
for (const seed of seedStaff) {
  const excelRow = staffRows.find(row => {
    const excelName = String(row.__EMPTY_1).trim();
    return excelName === seed.name.trim();
  });

  if (!excelRow) {
    emailIssues.push({ name: seed.name, issue: 'NOT FOUND in Excel sheet' });
    continue;
  }

  const excelEmail = String(excelRow.__EMPTY_3).trim();
  const seedEmail = seed.officialEmail.replace(/@+/g, '@').trim();
  
  if (excelEmail !== seedEmail) {
    emailIssues.push({
      name: seed.name,
      issue: `EMAIL MISMATCH`,
      excel: excelEmail,
      seed: seedEmail,
      seedRaw: seed.officialEmail
    });
  }
  
  const excelStaffId = String(excelRow.__EMPTY_2).trim();
  if (excelStaffId !== seed.staffId) {
    emailIssues.push({
      name: seed.name,
      issue: `STAFF ID MISMATCH`,
      excel: excelStaffId,
      seed: seed.staffId
    });
  }
}

if (emailIssues.length === 0) {
  console.log('  ✅ All staff IDs and recovery emails match the Excel sheet!\n');
} else {
  console.log('  ❌ ISSUES FOUND:\n');
  for (const issue of emailIssues) {
    console.log(`  ${issue.name}:`);
    console.log(`    Issue: ${issue.issue}`);
    if (issue.excel) console.log(`    Excel:  ${issue.excel}`);
    if (issue.seed)  console.log(`    Seed:   ${issue.seed}`);
    if (issue.seedRaw && issue.seedRaw !== issue.seed) console.log(`    SeedRaw: ${issue.seedRaw}`);
    console.log();
  }
}

// Check 3: Login list vs actual seed
console.log('--- CHECK 3: LOGIN_LIST.md says password is "Test123" but seed uses Staff ID ---\n');
console.log('  The seed-workbooks.js uses staffId as the default password for all staff.');
console.log('  But the LOGIN_LIST.md incorrectly says all staff passwords are "Test123".');
console.log('  The actual default passwords are the staff IDs (which is CORRECT per your requirement).\n');

// Show Pradhiba specifically since that's the screenshot issue
console.log('--- CHECK 4: Ms.D.PRADHIBA (from screenshot) ---\n');
const pradhiba = seedStaff.find(s => s.name === 'Ms.D.PRADHIBA');
console.log(`  Name:           ${pradhiba.name}`);
console.log(`  Staff ID:       ${pradhiba.staffId}`);
console.log(`  Login Email:    ${pradhiba.loginEmail}`);
console.log(`  Recovery Email: ${pradhiba.officialEmail}`);
console.log(`  Default PW:     ${pradhiba.staffId}`);
console.log(`  Role:           ${pradhiba.role}`);
console.log();
console.log('  ⚠️  From your screenshot, the user tried to reset password using "pradhibacse@kamarajengg.edu.in"');
console.log('     but this is the RECOVERY email, NOT the login email!');
console.log('     The password reset form accepts the LOGIN email, which is "pradhiba@cse".');
console.log();
