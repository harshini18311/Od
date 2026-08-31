import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ where: { role: { not: 'student' } } });
  for (const u of users) {
    if (u.recoveryEmail) {
      let newEmail = u.recoveryEmail.replace(/@kamarajengge\.edu\.in$/, '@kamarajengg.edu.in');
      newEmail = newEmail.replace('@@', '@');
      
      // Fix specific typos based on excel sheet
      if (u.name.includes('JOHN LIVINGSTON')) {
        newEmail = 'johnlivingstoncse@kamarajengg.edu.in';
      } else if (u.name.includes('KUMARAVEL.R')) {
        newEmail = 'kumaravelcse@kamarajengg.edu.in';
      } else if (u.name.includes('UMA MAHESWARI')) {
        newEmail = 'umamaheswaricse@kamarajengg.edu.in';
      }

      if (newEmail !== u.recoveryEmail) {
        await prisma.user.update({
          where: { id: u.id },
          data: { recoveryEmail: newEmail }
        });
        console.log(`Updated ${u.name}: ${u.recoveryEmail} -> ${newEmail}`);
      }
    }
  }
}
main().finally(() => process.exit(0));
