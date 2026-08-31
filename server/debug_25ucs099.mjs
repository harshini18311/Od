import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: "25UCS099" } });
  if (!user) { console.log("USER 25UCS099 NOT FOUND"); return; }
  console.log("Found student:", user.email, "role:", user.role);
  const m1 = await bcrypt.compare("25ucs099", user.passwordHash);
  const m2 = await bcrypt.compare("25UCS099", user.passwordHash);
  console.log("match 25ucs099:", m1, "| match 25UCS099:", m2);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
