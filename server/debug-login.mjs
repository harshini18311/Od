import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  let user = await prisma.user.findUnique({ where: { email: "24ucs096" } });
  if (!user) {
    console.log("NOT FOUND with 24ucs096");
    const students = await prisma.user.findMany({ where: { role: "student" }, take: 5, select: { email: true } });
    console.log("Sample students:", JSON.stringify(students));
  } else {
    console.log("FOUND:", user.email, "role:", user.role);
    const m1 = await bcrypt.compare("24ucs096", user.passwordHash);
    const m2 = await bcrypt.compare("24UCS096", user.passwordHash);
    console.log("match lowercase:", m1, "| match uppercase:", m2);
  }
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
