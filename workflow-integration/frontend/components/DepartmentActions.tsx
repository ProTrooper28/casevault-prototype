/**
 * Contextual action panel for authorized workflow advancements and handoff triggers.
 */

import React, { useState } from 'react';
import {
  Department,
  NextAvailableAction,
  UserContext,
  WorkflowState,
} from '../../types/workflow.types';
import {
  ArrowRight,
  Send,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface DepartmentActionsProps {
  currentState: WorkflowState;
  currentDepartment: Department;
  currentUser: UserContext;
  nextActions: NextAvailableAction[];
  hasPendingHandoff: boolean;
  onOpenHandoffModal: () => void;
  onCompleteCase: (verdict: string) => Promise<void>;
  onDirectTransition: (nextState: WorkflowState, targetDept: Department, reason?: string) => Promise<void>;
}

export const DepartmentActions: React.FC<DepartmentActionsProps> = ({
  currentState,
  currentDepartment,
  currentUser,
  nextActions,
  hasPendingHandoff,
  onOpenHandoffModal,
  onCompleteCase,
  onDirectTransition,
}) => {
  const [closingCase, setClosingCase] = useState(false);
  const [verdictText, setVerdictText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isClosed = currentState === WorkflowState.CASE_CLOSED;

  const handleCloseCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verdictText.trim()) return;
    try {
      setSubmitting(true);
      await onCompleteCase(verdictText.trim());
      setClosingCase(false);
      setVerdictText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Workflow Control &amp; Stage Advancement
          </h3>
          <p className="text-xs text-slate-500">
            Available operations for {currentUser.name} ({currentUser.role.replace(/_/g, ' ')})
          </p>
        </div>
      </div>

      {isClosed ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-900 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <strong className="font-semibold block text-sm">Case is Formally Disposed &amp; Closed</strong>
            <span>All statutory trial procedures and judicial verdicts have been filed in the permanent record.</span>
          </div>
        </div>
      ) : hasPendingHandoff ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-900 text-xs">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong className="font-semibold">Case In Transit / Pending Acceptance</strong>
            <p className="text-slate-600 mt-0.5">
              The case is currently locked pending acceptance by the receiving department. No outward handoffs can be initiated until inbound custody is resolved.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action triggers */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Handoff trigger button */}
            {[
              WorkflowState.POLICE_INVESTIGATION,
              WorkflowState.FORENSIC_ANALYSIS,
              WorkflowState.PROSECUTION_REVIEW,
            ].includes(currentState) && (
              <button
                onClick={onOpenHandoffModal}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-2 shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Initiate Inter-Agency Handoff</span>
              </button>
            )}

            {/* Trial verdict button */}
            {currentState === WorkflowState.COURT_TRIAL && (
              <button
                onClick={() => setClosingCase(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-2 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Deliver Judgment &amp; Close Case</span>
              </button>
            )}

            {/* Direct transition buttons if available */}
            {nextActions
              .filter((a) => !a.requiresHandoff && a.targetState !== WorkflowState.CASE_CLOSED)
              .map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => onDirectTransition(action.targetState, action.targetDepartment)}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <span>{action.actionName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ))}
          </div>

          {/* Verdict closing dialog */}
          {closingCase && (
            <form
              onSubmit={handleCloseCaseSubmit}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
            >
              <h5 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                Judicial Verdict &amp; Final Disposal Summary
              </h5>
              <textarea
                value={verdictText}
                onChange={(e) => setVerdictText(e.target.value)}
                placeholder="Enter final court judgment details (Conviction / Acquittal / Sentence particulars)..."
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-blue-600"
                required
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Recording Verdict...' : 'Finalize & Archive Case'}
                </button>
                <button
                  type="button"
                  onClick={() => setClosingCase(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Available transitions summary */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Statutory Permitted Next Actions
            </span>
            <div className="space-y-1">
              {nextActions.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  No direct actions authorized for your current role and case state.
                </span>
              ) : (
                nextActions.map((action, i) => (
                  <div key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      <strong>{action.actionName}:</strong> {action.description}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
