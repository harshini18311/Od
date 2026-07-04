// client/src/components/StatusBadge.jsx
import React from 'react';

/**
 * Standard visual badge for OD Requests Status.
 * @param {string} status - PENDING, APPROVED, REJECTED
 * @param {string} currentStage - Current approval stage
 */
export default function StatusBadge({ status, currentStage }) {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-500/20">
        ● Approved
      </span>
    );
  }

  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-950/20 dark:text-red-400 dark:ring-red-500/20">
        ● Rejected
      </span>
    );
  }

  // Pending variants based on current stage
  let stageLabel = 'Pending Review';
  if (currentStage === 'mentor_pending') stageLabel = 'Pending Mentor';
  else if (currentStage === 'chairperson_pending') stageLabel = 'Pending Chairperson';
  else if (currentStage === 'hod_pending') stageLabel = 'Pending HOD';
  else if (currentStage === 'principal_pending') stageLabel = 'Pending Principal';

  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-500/20">
      ● {stageLabel}
    </span>
  );
}
