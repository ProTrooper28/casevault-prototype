/**
 * Interactive visual representation of the case stage progression:
 * Police -> Forensic -> Prosecutor -> Court -> Closed
 */

import React from 'react';
import { Department, WorkflowState } from '../../types/workflow.types';
import { CANONICAL_STAGES } from '../types/ui.types';
import { Shield, FlaskConical, Scale, Gavel, CheckCircle2 } from 'lucide-react';

interface StageProgressBarProps {
  currentState: WorkflowState;
  currentDepartment: Department;
  isPendingHandoff?: boolean;
}

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  currentState,
  currentDepartment,
  isPendingHandoff,
}) => {
  const getStageIcon = (dept: Department) => {
    switch (dept) {
      case Department.POLICE:
        return <Shield className="w-5 h-5" />;
      case Department.FORENSIC:
        return <FlaskConical className="w-5 h-5" />;
      case Department.PROSECUTOR:
        return <Scale className="w-5 h-5" />;
      case Department.COURT:
        return <Gavel className="w-5 h-5" />;
      case Department.CLOSED:
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getStageStatus = (stageDept: Department) => {
    const deptOrder: Record<Department, number> = {
      [Department.POLICE]: 1,
      [Department.FORENSIC]: 2,
      [Department.PROSECUTOR]: 3,
      [Department.COURT]: 4,
      [Department.CLOSED]: 5,
    };

    const currentOrder = deptOrder[currentDepartment] || 1;
    const thisOrder = deptOrder[stageDept];

    if (currentState === WorkflowState.CASE_CLOSED) {
      return 'completed';
    }

    if (thisOrder < currentOrder) {
      return 'completed';
    } else if (thisOrder === currentOrder) {
      return isPendingHandoff ? 'pending_handoff' : 'active';
    } else {
      return 'upcoming';
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-800 uppercase">
            Statutory Criminal Justice Workflow Pipeline
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Inter-Departmental Chain of Custody &amp; Cognizance Stages
          </p>
        </div>
        {isPendingHandoff && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Awaiting Inbound Acceptance
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {CANONICAL_STAGES.map((stg, idx) => {
          const status = getStageStatus(stg.department);
          const isCurrent = stg.department === currentDepartment;

          let badgeStyles = 'border-slate-200 bg-slate-50 text-slate-400';
          let ringStyles = '';

          if (status === 'completed') {
            badgeStyles = 'border-emerald-500 bg-emerald-500 text-white';
          } else if (status === 'active') {
            badgeStyles = 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-100';
            ringStyles = 'ring-4 ring-blue-100';
          } else if (status === 'pending_handoff') {
            badgeStyles = 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-100';
            ringStyles = 'ring-4 ring-amber-100 animate-pulse';
          }

          return (
            <div
              key={stg.id}
              className={`relative flex flex-col p-4 rounded-lg border transition-all ${
                isCurrent
                  ? 'border-blue-300 bg-blue-50/40 shadow-xs'
                  : status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400 font-semibold">
                  0{stg.order}
                </span>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${badgeStyles} ${ringStyles}`}
                >
                  {getStageIcon(stg.department)}
                </div>
              </div>

              <div className="font-semibold text-sm text-slate-900 leading-tight">
                {stg.label}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{stg.sublabel}</div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Status</span>
                <span
                  className={`font-medium ${
                    status === 'completed'
                      ? 'text-emerald-700'
                      : status === 'active'
                      ? 'text-blue-700 font-semibold'
                      : status === 'pending_handoff'
                      ? 'text-amber-700 font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  {status === 'completed'
                    ? 'Discharged'
                    : status === 'active'
                    ? 'Current Stage'
                    : status === 'pending_handoff'
                    ? 'In Transit'
                    : 'Pending'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
