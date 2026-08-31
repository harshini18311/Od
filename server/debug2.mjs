import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: "24UCS096" } });
  if (!user) { console.log("NOT FOUND"); return; }
  console.log("email:", user.email, "role:", user.role);
  console.log("hash:", user.passwordHash);
  const m1 = await bcrypt.compare("24ucs096", user.passwordHash);
  const m2 = await bcrypt.compare("24UCS096", user.passwordHash);
  console.log("match 24ucs096:", m1, "| match 24UCS096:", m2);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
