import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const filePath = path.join(__dirname, '../', 'Staff details.xlsx');
  const workbook = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

  const excelEmails = {};
  rows.forEach(r => {
    if (r.__EMPTY_1 && r.__EMPTY_3) {
      excelEmails[r.__EMPTY_1.trim()] = r.__EMPTY_3.trim();
    }
  });

  const verifyStaffContent = fs.readFileSync(path.join(__dirname, 'verify_staff.mjs'), 'utf8');
  const emailRegex = /name:\s*'([^']+)',.*?officialEmail:\s*'([^']+)'/g;
  let match;
  
  console.log('=== Discrepancies ===');
  while ((match = emailRegex.exec(verifyStaffContent)) !== null) {
    const name = match[1].trim();
    const email = match[2].trim();
    
    // find matching excel name
    let matchedName = Object.keys(excelEmails).find(n => n === name || n.replace(/\s+/g, '') === name.replace(/\s+/g, ''));
    if (matchedName) {
      const excelEmail = excelEmails[matchedName];
      if (excelEmail !== email) {
        console.log(`Mismatch for ${name}:`);
        console.log(`  Excel : ${excelEmail}`);
        console.log(`  System: ${email}`);
      }
    } else {
      console.log(`Not found in excel: ${name}`);
    }
  }
}

main();
