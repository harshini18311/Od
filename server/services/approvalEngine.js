// server/services/approvalEngine.js
import { PrismaClient } from '@prisma/client';
import { createNotification } from './notificationService.js';

const prisma = new PrismaClient();

/**
 * Handles the step approval process in the OD pipeline.
 * @param {string} odId - OD Request ID
 * @param {string} approverId - Approver User ID
 * @param {string} action - 'APPROVED' or 'REJECTED'
 * @param {string} remarks - Comments added by the approver
 * @returns {Promise<object>} The updated OD request
 */
export async function processApprovalStep(odId, approverId, action, remarks) {
  const notificationsToCreate = [];

  const updatedRequest = await prisma.$transaction(async (tx) => {
    // 1. Fetch Request with details
    const odRequest = await tx.odRequest.findUnique({
      where: { id: odId },
      include: {
        student: {
          include: {
            user: true,
            department: true
          }
        }
      }
    });

    if (!odRequest) {
      throw new Error('OD Request not found');
    }

    if (odRequest.status !== 'PENDING') {
      throw new Error('This OD Request has already been finalized.');
    }

    const student = odRequest.student;
    const studentUser = student.user;
    const deptId = student.deptId;
    const isHosteller = student.type === 'HOSTELLER';

    // 2. Fetch the approver
    const approver = await tx.user.findUnique({
      where: { id: approverId }
    });

    if (!approver) {
      throw new Error('Approver not found');
    }

    // 3. Validate if this user is allowed to approve at this stage
    const currentStage = odRequest.currentStage;
    let expectedRole = '';
    if (currentStage === 'mentor_pending') expectedRole = 'mentor';
    else if (currentStage === 'chairperson_pending') expectedRole = 'chairperson';
    else if (currentStage === 'hod_pending') expectedRole = 'hod';
    else if (currentStage === 'principal_pending') expectedRole = 'principal';

    if (approver.role !== expectedRole) {
      throw new Error(`Unauthorized. This stage requires a ${expectedRole} but you are logged in as a ${approver.role}.`);
    }

    if (currentStage === 'chairperson_pending' && student.chairpersonId && approverId !== student.chairpersonId) {
      throw new Error('Unauthorized. This request is assigned to a different chairperson.');
    }

    // 4. Create Approval Log entry
    await tx.approvalLog.create({
      data: {
        odId,
        approverId,
        role: approver.role,
        action,
        remarks: remarks || ''
      }
    });

    let nextStage = currentStage;
    let nextStatus = 'PENDING';

    // 5. Calculate State Transition
    if (action === 'REJECTED') {
      nextStatus = 'REJECTED';
      nextStage = 'completed';
    } else {
      // APPROVED Path
      if (currentStage === 'mentor_pending') {
        nextStage = 'chairperson_pending';
      } else if (currentStage === 'chairperson_pending') {
        nextStage = 'hod_pending';
      } else if (currentStage === 'hod_pending') {
        if (isHosteller) {
          nextStage = 'principal_pending';
        } else {
          nextStage = 'completed';
          nextStatus = 'APPROVED';
        }
      } else if (currentStage === 'principal_pending') {
        nextStage = 'completed';
        nextStatus = 'APPROVED';
      }
    }

    // 6. Update OD Request state
    const txUpdatedRequest = await tx.odRequest.update({
      where: { id: odId },
      data: {
        currentStage: nextStage,
        status: nextStatus
      }
    });

    // 7. Collect Details for Notifications to execute post-commit
    if (nextStatus === 'REJECTED') {
      notificationsToCreate.push({
        userId: studentUser.id,
        odId,
        message: `Your OD Request (${odRequest.odCode}) for "${odRequest.eventName}" was rejected by ${approver.name} (${approver.role}). Reason: ${remarks || 'No remarks provided.'}`,
        emailTo: studentUser.email,
        emailSubject: `OD Request Rejected: ${odRequest.odCode}`
      });

      if (currentStage !== 'mentor_pending') {
        notificationsToCreate.push({
          userId: student.mentorId,
          odId,
          message: `The OD request for student ${studentUser.name} (${odRequest.odCode}) was rejected at the ${currentStage} stage by ${approver.name}.`,
          emailTo: undefined
        });
      }
    } else if (nextStatus === 'APPROVED') {
      notificationsToCreate.push({
        userId: studentUser.id,
        odId,
        message: `Congratulations! Your OD Request (${odRequest.odCode}) for "${odRequest.eventName}" has been fully APPROVED. You can now download your official letter.`,
        emailTo: studentUser.email,
        emailSubject: `OD Approved! Ref: ${odRequest.odCode}`
      });

      const chair = student.chairpersonId
        ? await tx.user.findUnique({ where: { id: student.chairpersonId } })
        : await tx.user.findFirst({ where: { role: 'chairperson', deptId } });
      if (chair) {
        notificationsToCreate.push({
          userId: chair.id,
          odId,
          message: `Student ${studentUser.name} (${odRequest.odCode}) OD request has been fully approved by the HOD/Principal.`,
        });
      }

      const admins = await tx.user.findMany({ where: { role: 'admin' } });
      for (const adm of admins) {
        notificationsToCreate.push({
          userId: adm.id,
          odId,
          message: `OD Request ${odRequest.odCode} for ${studentUser.name} has been successfully completed and approved.`
        });
      }

      if (isHosteller) {
        const wardens = await tx.user.findMany({ where: { role: 'warden' } });
        for (const w of wardens) {
          notificationsToCreate.push({
            userId: w.id,
            odId,
            message: `HOSTELLER OUTPASS CLEARANCE: Student ${studentUser.name} (Reg No: ${student.regNo}) has been granted OD leave from ${new Date(odRequest.fromDate).toLocaleDateString()} to ${new Date(odRequest.toDate).toLocaleDateString()}.`
          });
        }
      }
    } else {
      let nextApproverRole = '';
      if (nextStage === 'chairperson_pending') nextApproverRole = 'chairperson';
      else if (nextStage === 'hod_pending') nextApproverRole = 'hod';
      else if (nextStage === 'principal_pending') nextApproverRole = 'principal';

      let nextApproverUsers = [];
      if (nextApproverRole === 'principal') {
        nextApproverUsers = await tx.user.findMany({ where: { role: 'principal' } });
      } else if (nextApproverRole === 'chairperson' && student.chairpersonId) {
        nextApproverUsers = await tx.user.findMany({ where: { id: student.chairpersonId } });
      } else {
        nextApproverUsers = await tx.user.findMany({
          where: { role: nextApproverRole, deptId }
        });
      }

      for (const nUser of nextApproverUsers) {
        notificationsToCreate.push({
          userId: nUser.id,
          odId,
          message: `New OD Request pending your review: Student ${studentUser.name} has submitted ${odRequest.odCode} for "${odRequest.eventName}".`,
          emailTo: nUser.email,
          emailSubject: `KCET OD Request Pending: ${odRequest.odCode}`
        });
      }

      notificationsToCreate.push({
        userId: studentUser.id,
        odId,
        message: `Your OD Request (${odRequest.odCode}) has been approved by ${approver.name} and forwarded to ${nextApproverRole.toUpperCase()} review.`,
        emailTo: studentUser.email,
        emailSubject: `OD Request Forwarded: ${odRequest.odCode}`
      });
    }

    return txUpdatedRequest;
  });

  // 8. Execute Notifications asynchronously after successful transaction commit
  for (const notif of notificationsToCreate) {
    createNotification(notif).catch((err) => {
      console.error('[Notification Engine Async Warning] Failed to dispatch notification:', err);
    });
  }

  return updatedRequest;
}
