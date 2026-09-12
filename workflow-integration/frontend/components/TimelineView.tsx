/**
 * Chronological timeline of case workflow transitions and handoffs with audit verification hashes.
 */

import React from 'react';
import { Department, TimelineEntry } from '../../types/workflow.types';
import {
  FileText,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Hash,
  ShieldCheck,
} from 'lucide-react';

interface TimelineViewProps {
  timeline: TimelineEntry[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline }) => {
  const getDeptColor = (dept: Department) => {
    switch (dept) {
      case Department.POLICE:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case Department.FORENSIC:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case Department.PROSECUTOR:
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case Department.COURT:
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case Department.CLOSED:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getEventIcon = (entry: TimelineEntry) => {
    if (entry.isHandoff) {
      if (entry.title.includes('Returned') || entry.title.includes('Rejected')) {
        return <XCircle className="w-4 h-4 text-rose-600" />;
      }
      if (entry.title.includes('Accepted')) {
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      }
      return <ArrowRightLeft className="w-4 h-4 text-amber-600" />;
    }
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Workflow Audit Ledger &amp; Chain of Custody
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological record of inter-agency actions and handoffs
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SHA-256 Verified</span>
        </div>
      </div>

      {timeline.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No workflow events logged yet for this case.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timeline.map((item) => (
            <div key={item.id} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
                {getEventIcon(item)}
              </div>

              {/* Content Card */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      {item.title}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium border ${getDeptColor(
                        item.department
                      )}`}
                    >
                      {item.department}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  {item.description}
                </p>

                {item.handoffDetails?.rejectionReason && (
                  <div className="mb-2 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
                    <strong className="font-semibold">Defect Memo:</strong>{' '}
                    {item.handoffDetails.rejectionReason}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>
                    By: <strong className="font-medium text-slate-700">{item.actorName}</strong> ({item.actorRole})
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                    <Hash className="w-3 h-3" />
                    {item.auditHash ? item.auditHash.substring(0, 18) + '...' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
