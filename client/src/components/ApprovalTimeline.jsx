// client/src/components/ApprovalTimeline.jsx
import React from 'react';
import { Check, X, Clock, HelpCircle } from 'lucide-react';

/**
 * Renders a highly-polished vertical approval timeline.
 * @param {object} odRequest - The loaded OD request containing student details, status, stage, and logs.
 */
export default function ApprovalTimeline({ odRequest }) {
  if (!odRequest) return null;

  const { logs, currentStage, status, studentType } = odRequest;
  const isHosteller = studentType === 'HOSTELLER';

  // Define the stages in order
  const pipeline = [
    { key: 'mentor', label: 'Step 1: Mentor Review', pendingStage: 'mentor_pending' },
    { key: 'chairperson', label: 'Step 2: Chairperson Verification', pendingStage: 'chairperson_pending' },
    { key: 'hod', label: 'Step 3: HOD Approval', pendingStage: 'hod_pending' },
  ];

  if (isHosteller) {
    pipeline.push({ key: 'principal', label: 'Step 4: Principal Review (Hosteller Only)', pendingStage: 'principal_pending' });
  }

  // Helper to determine status of a pipeline stage
  const getStageState = (stageKey, pendingStage) => {
    // 1. Check if logged in logs
    const log = logs.find(l => l.role === stageKey);
    if (log) {
      return {
        state: log.action, // 'APPROVED' or 'REJECTED'
        logDetails: log
      };
    }

    // 2. If no log, is it currently pending?
    if (status === 'PENDING' && currentStage === pendingStage) {
      return { state: 'ACTIVE' };
    }

    // 3. Has it been rejected earlier?
    const hasRejections = logs.some(l => l.action === 'REJECTED');
    if (hasRejections) {
      return { state: 'SKIPPED' };
    }

    // 4. Otherwise, it is waiting
    return { state: 'WAITING' };
  };

  // Helper to choose style classes & icons
  const getStageStyles = (state) => {
    switch (state) {
      case 'APPROVED':
        return {
          icon: <Check className="h-4 w-4 text-white" />,
          color: 'bg-emerald-500 border-emerald-500 ring-4 ring-emerald-500/20',
          text: 'text-slate-900 dark:text-slate-100 font-semibold',
          subtext: 'text-emerald-600 dark:text-emerald-400 font-medium text-xs'
        };
      case 'REJECTED':
        return {
          icon: <X className="h-4 w-4 text-white" />,
          color: 'bg-red-500 border-red-500 ring-4 ring-red-500/20',
          text: 'text-slate-900 dark:text-slate-100 font-semibold',
          subtext: 'text-red-600 dark:text-red-400 font-medium text-xs'
        };
      case 'ACTIVE':
        return {
          icon: <Clock className="h-4 w-4 text-amber-500 animate-spin" />,
          color: 'bg-amber-50 border-amber-500 border-2 ring-4 ring-amber-500/10 dark:bg-navy-950',
          text: 'text-slate-900 dark:text-slate-100 font-semibold',
          subtext: 'text-amber-500 animate-pulse font-medium text-xs'
        };
      case 'SKIPPED':
        return {
          icon: <HelpCircle className="h-4 w-4 text-slate-400" />,
          color: 'bg-slate-100 border-slate-300 dark:bg-navy-900 dark:border-slate-800',
          text: 'text-slate-400 dark:text-slate-600 font-normal',
          subtext: 'text-slate-400 dark:text-slate-600 text-xs'
        };
      default: // WAITING
        return {
          icon: <HelpCircle className="h-4 w-4 text-slate-400" />,
          color: 'bg-slate-50 border-slate-200 dark:bg-navy-900 dark:border-slate-800',
          text: 'text-slate-400 dark:text-slate-500 font-normal',
          subtext: 'text-slate-400 dark:text-slate-500 text-xs'
        };
    }
  };

  const formatTimestamp = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="relative mt-8 max-w-xl mx-auto px-2">
      {/* Central Connector Line */}
      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800 -translate-x-1/2"></div>

      <div className="space-y-8">
        {pipeline.map((step) => {
          const { state, logDetails } = getStageState(step.key, step.pendingStage);
          const styles = getStageStyles(state);

          return (
            <div key={step.key} className="relative flex gap-6 items-start">
              {/* Connector Node */}
              <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300 z-10 ${styles.color}`}>
                {styles.icon}
              </div>

              {/* Node Card Details */}
              <div className="flex-1 rounded-xl bg-slate-50/50 p-4 border border-slate-100 dark:bg-navy-900/40 dark:border-slate-800/40 transition-colors duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className={`text-sm ${styles.text}`}>{step.label}</h4>
                  <span className={styles.subtext}>
                    {state === 'APPROVED' && 'APPROVED'}
                    {state === 'REJECTED' && 'REJECTED'}
                    {state === 'ACTIVE' && 'Awaiting Action'}
                    {state === 'SKIPPED' && 'Process Blocked'}
                    {state === 'WAITING' && 'Waiting Stage'}
                  </span>
                </div>

                {/* Log Signature & Comments */}
                {logDetails && (
                  <div className="mt-3 border-t border-slate-200/50 pt-2 dark:border-slate-800/60">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Evaluated by: <span className="text-slate-700 dark:text-slate-200">{logDetails.approver?.name}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Date: {formatTimestamp(logDetails.timestamp)}
                    </p>
                    {logDetails.remarks && (
                      <div className="mt-2 rounded-lg bg-white/70 p-2.5 border border-slate-100 dark:bg-navy-900/80 dark:border-slate-800/60">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Remarks:</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                          "{logDetails.remarks}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {state === 'ACTIVE' && (
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    Currently under evaluation. An alert notification has been sent to this authority.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
