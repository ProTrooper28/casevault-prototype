/**
 * Stage SLA countdown, risk level badge, and deadline health indicator.
 */

import React from 'react';
import { SlaHealthStatus, SlaStatusReport } from '../../types/workflow.types';
import { Clock, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface SlaBadgeProps {
  sla: SlaStatusReport;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({ sla }) => {
  const getBadgeConfig = () => {
    switch (sla.health) {
      case SlaHealthStatus.ON_TIME:
        return {
          icon: <Clock className="w-4 h-4 text-emerald-600" />,
          bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          barColor: 'bg-emerald-500',
          label: 'Statutory SLA: On Track',
        };
      case SlaHealthStatus.AT_RISK:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          bgColor: 'bg-amber-50 border-amber-200 text-amber-800',
          barColor: 'bg-amber-500',
          label: 'Statutory SLA: At Risk',
        };
      case SlaHealthStatus.OVERDUE:
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
          bgColor: 'bg-rose-50 border-rose-200 text-rose-800',
          barColor: 'bg-rose-500',
          label: 'Statutory SLA: Overdue',
        };
      case SlaHealthStatus.COMPLETED:
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-slate-600" />,
          bgColor: 'bg-slate-50 border-slate-200 text-slate-700',
          barColor: 'bg-slate-400',
          label: 'Stage Closed',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`p-4 rounded-xl border ${config.bgColor} flex flex-col gap-2.5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="text-xs font-semibold uppercase tracking-wide">
            {config.label}
          </span>
        </div>
        <span className="text-xs font-mono font-medium">
          {sla.isBreached
            ? 'BREACHED'
            : `${sla.remainingHours}h remaining`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full ${config.barColor} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, sla.percentageUsed))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] opacity-85">
        <span>Elapsed: {sla.elapsedHours}h ({sla.percentageUsed}%)</span>
        <span>Deadline: {new Date(sla.deadlineTime).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
