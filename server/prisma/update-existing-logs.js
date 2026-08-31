import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Fixing HOD logs that should be mentor logs...');

  // Find all logs by users with role 'hod' where the student's mentor is that HOD
  const hodLogs = await prisma.approvalLog.findMany({
    where: { role: 'hod' },
    include: {
      request: {
        include: {
          student: true,
          logs: { orderBy: { timestamp: 'asc' } }
        }
      }
    }
  });

  let updatedCount = 0;
  for (const log of hodLogs) {
    const studentMentorId = log.request.student.mentorId;
    if (log.approverId === studentMentorId) {
      // If it is the earliest log for this request, it is the mentor approval step.
      const firstLog = log.request.logs[0];
      if (firstLog && firstLog.id === log.id) {
        console.log(`Updating log ${log.id} for request ${log.request.odCode} to role: 'mentor'`);
        await prisma.approvalLog.update({
          where: { id: log.id },
          data: { role: 'mentor' }
        });
        updatedCount++;
      }
    }
  }

  console.log(`Updated ${updatedCount} existing logs.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
