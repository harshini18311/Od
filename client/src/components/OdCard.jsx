// client/src/components/OdCard.jsx
import React from 'react';
import { Calendar, School, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { Link } from 'react-router-dom';

/**
 * Reusable summary card for an On Duty request.
 * @param {object} request - The OD request data
 * @param {string} viewPath - Navigation route on click
 */
export default function OdCard({ request, viewPath }) {
  const { eventName, collegeName, fromDate, toDate, status, currentStage, odCode } = request;

  const formatDateRange = (fromStr, toStr) => {
    const f = new Date(fromStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const t = new Date(toStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return f === t ? f : `${f} - ${t}`;
  };

  return (
    <div className="group rounded-2xl bg-white p-5 border border-slate-200/50 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all duration-300 dark:bg-navy-900 dark:border-slate-800/60 dark:hover:border-amber-500/35">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          {odCode}
        </span>
        <StatusBadge status={status} currentStage={currentStage} />
      </div>

      <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-amber-500 transition-colors">
        {eventName}
      </h3>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800/40">
        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <School className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{collegeName}</span>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          <span>{formatDateRange(fromDate, toDate)}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end">
        <Link
          to={viewPath}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 group/btn"
        >
          View Details
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
