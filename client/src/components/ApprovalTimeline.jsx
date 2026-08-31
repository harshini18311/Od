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
  const pipeline = [];

  if (odRequest.odType === 'INTERNAL' || odRequest.isStaffApplied) {
    pipeline.push({ key: 'chairperson', label: 'Chairperson Approval', pendingStage: 'chairperson_pending' });
  } else {
    pipeline.push({ key: 'mentor', label: 'Step 1: Mentor Review', pendingStage: 'mentor_pending' });
    pipeline.push({ key: 'chairperson', label: 'Step 2: Chairperson Verification', pendingStage: 'chairperson_pending' });
    pipeline.push({ key: 'hod', label: 'Step 3: HOD Approval', pendingStage: 'hod_pending' });
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
          color: 'bg-olive border-olive',
          text: 'text-brown-900 dark:text-cream font-bold',
          subtext: 'text-olive dark:text-olive-light font-bold text-[10px] tracking-widest'
        };
      case 'REJECTED':
        return {
          icon: <X className="h-4 w-4 text-white" />,
          color: 'bg-rust border-rust',
          text: 'text-brown-900 dark:text-cream font-bold',
          subtext: 'text-rust dark:text-rust-light font-bold text-[10px] tracking-widest'
        };
      case 'ACTIVE':
        return {
          icon: <Clock className="h-4 w-4 text-white" />,
          color: 'bg-terra border-terra animate-pulse',
          text: 'text-brown-900 dark:text-cream font-bold',
          subtext: 'text-terra dark:text-terra-light font-bold text-[10px] tracking-widest'
        };
      case 'SKIPPED':
        return {
          icon: <HelpCircle className="h-4 w-4 text-brown-300" />,
          color: 'bg-parchment border-parchment dark:bg-dark-surface dark:border-dark-border',
          text: 'text-brown-300 dark:text-brown-400 font-normal',
          subtext: 'text-brown-300 dark:text-brown-400 text-[10px] tracking-widest'
        };
      default: // WAITING
        return {
          icon: <HelpCircle className="h-4 w-4 text-brown-400" />,
          color: 'bg-cream-dark border-parchment dark:bg-dark-card dark:border-dark-border',
          text: 'text-brown-400 dark:text-brown-300 font-normal',
          subtext: 'text-brown-400 dark:text-brown-300 text-[10px] tracking-widest'
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
      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-terra via-parchment to-transparent -translate-x-1/2 opacity-40"></div>

      <div className="space-y-8">
        {pipeline.map((step) => {
          const { state, logDetails } = getStageState(step.key, step.pendingStage);
          const styles = getStageStyles(state);

          return (
            <div key={step.key} className="relative flex gap-6 items-start animate-fade-in">
              {/* Connector Node */}
              <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 z-10 ${styles.color}`}>
                {styles.icon}
              </div>

              {/* Node Card Details */}
              <div className="flex-1 card-warm p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-parchment dark:border-dark-border pb-3">
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
                  <div className="mt-3 pt-2">
                    <p className="text-[11px] font-medium text-brown-500 dark:text-brown-400">
                      Evaluated by: <span className="text-brown-800 dark:text-cream font-bold">{logDetails.approver?.name}</span>
                    </p>
                    <p className="text-[10px] text-brown-400 dark:text-brown-300 mt-0.5">
                      Date: {formatTimestamp(logDetails.timestamp)}
                    </p>
                    {logDetails.remarks && (
                      <div className="mt-3 rounded-lg bg-cream dark:bg-dark-surface p-3 border border-parchment dark:border-dark-border">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brown-400 block mb-1">Remarks:</span>
                        <p className="text-xs text-brown-700 dark:text-brown-300 italic">
                          "{logDetails.remarks}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {state === 'ACTIVE' && (
                  <p className="mt-2 text-xs text-brown-400 dark:text-brown-300">
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
