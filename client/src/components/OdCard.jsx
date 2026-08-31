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
    <div className="group relative card-warm p-5 overflow-hidden hover:-translate-y-0.5">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-terra opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold tracking-wider text-brown-400 dark:text-brown-300 uppercase">
          {odCode}
        </span>
        <StatusBadge status={status} currentStage={currentStage} />
      </div>

      <h3 className="mt-3 text-base font-bold text-brown-800 dark:text-cream-dark leading-snug group-hover:text-terra transition-colors">
        {eventName}
      </h3>

      <div className="mt-4 space-y-2 border-t border-parchment pt-3 dark:border-dark-border">
        <div className="flex items-center gap-2.5 text-xs text-brown-500 dark:text-brown-400">
          <School className="h-4 w-4 shrink-0 text-brown-400" />
          <span className="truncate">{collegeName}</span>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-brown-500 dark:text-brown-400">
          <Calendar className="h-4 w-4 shrink-0 text-brown-400" />
          <span>{formatDateRange(fromDate, toDate)}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end">
        <Link
          to={viewPath}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-terra hover:text-terra-dark dark:text-terra-light dark:hover:text-terra group/btn"
        >
          View Details
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
