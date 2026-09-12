/**
 * Inter-departmental case handoff dialogs:
 * Outbound dispatch, inbound custody acceptance, and defect rejection.
 */

import React, { useState } from 'react';
import { Department, EvidenceItem, HandoffRecord, UserContext } from '../../types/workflow.types';
import { ArrowRight, Send, Check, X, AlertCircle } from 'lucide-react';

interface OutboundHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDepartment: Department;
  evidences: EvidenceItem[];
  onSubmit: (data: {
    toDepartment: Department;
    reason: string;
    notes?: string;
    evidenceManifest: string[];
  }) => Promise<void>;
}

export const OutboundHandoffModal: React.FC<OutboundHandoffModalProps> = ({
  isOpen,
  onClose,
  currentDepartment,
  evidences,
  onSubmit,
}) => {
  const [toDept, setToDept] = useState<Department>(
    currentDepartment === Department.POLICE
      ? Department.FORENSIC
      : currentDepartment === Department.FORENSIC
      ? Department.PROSECUTOR
      : Department.COURT
  );
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedEvidences, setSelectedEvidences] = useState<string[]>(
    evidences.map((e) => e.id)
  );
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setModalError('Please specify the official reason for inter-departmental handoff.');
      return;
    }
    try {
      setSubmitting(true);
      setModalError(null);
      await onSubmit({
        toDepartment: toDept,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        evidenceManifest: selectedEvidences,
      });
      onClose();
    } catch (err: any) {
      setModalError(err.message || 'Handoff dispatch failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEvidence = (id: string) => {
    setSelectedEvidences((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Initiate Departmental Case Handoff
              </h3>
              <p className="text-xs text-slate-500">
                Transfer custody and statutory jurisdiction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Department Route */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700">{currentDepartment}</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <select
              value={toDept}
              onChange={(e) => setToDept(e.target.value as Department)}
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-semibold focus:outline-blue-500"
            >
              {currentDepartment === Department.POLICE && (
                <>
                  <option value={Department.FORENSIC}>FORENSIC (Forensic Science Lab)</option>
                  <option value={Department.PROSECUTOR}>PROSECUTOR (Public Prosecution)</option>
                </>
              )}
              {currentDepartment === Department.FORENSIC && (
                <option value={Department.PROSECUTOR}>PROSECUTOR (Public Prosecution)</option>
              )}
              {currentDepartment === Department.PROSECUTOR && (
                <option value={Department.COURT}>COURT (Judicial Magistrate / Sessions)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Reason / Statutory Requisition *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Forwarding ballistic exhibits for chamber pressure analysis"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transmittal Notes &amp; Custody Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Container seal codes, handling warnings, priority status..."
              rows={2}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
            />
          </div>

          {/* Evidence Manifest Checklist */}
          {evidences.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Physical / Digital Evidence Manifest (Chain of Custody)
              </label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50/50 text-xs">
                {evidences.map((ev) => (
                  <label
                    key={ev.id}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvidences.includes(ev.id)}
                      onChange={() => toggleEvidence(ev.id)}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800">{ev.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({ev.type})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Transmitting...' : 'Dispatch Handoff'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface InboundHandoffCardProps {
  handoff: HandoffRecord;
  currentUser: UserContext;
  onAccept: (handoffId: string, notes?: string) => Promise<void>;
  onReject: (handoffId: string, rejectionReason: string) => Promise<void>;
}

export const InboundHandoffCard: React.FC<InboundHandoffCardProps> = ({
  handoff,
  currentUser,
  onAccept,
  onReject,
}) => {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canAction =
    currentUser.role === 'SYSTEM_ADMIN' || currentUser.department === handoff.toDepartment;

  const handleAccept = async () => {
    try {
      setBusy(true);
      setActionError(null);
      await onAccept(handoff.id, 'Formal custody acknowledged and accepted.');
    } catch (err: any) {
      setActionError(err.message || 'Acceptance failed');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setActionError('Defect explanation is mandatory for returning a case.');
      return;
    }
    try {
      setBusy(true);
      setActionError(null);
      await onReject(handoff.id, rejectionReason.trim());
      setRejecting(false);
    } catch (err: any) {
      setActionError(err.message || 'Rejection failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-5 shadow-xs mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          <h4 className="text-sm font-semibold text-amber-950">
            Pending Inter-Agency Custody Transfer
          </h4>
        </div>
        <span className="text-xs font-mono font-medium text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-200">
          Inbound: {handoff.fromDepartment} → {handoff.toDepartment}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 mb-4 bg-white/80 p-3 rounded-lg border border-amber-200/60">
        <div>
          <span className="text-slate-500">Initiator:</span>{' '}
          <strong>{handoff.initiatedByName}</strong> ({handoff.fromDepartment})
        </div>
        <div>
          <span className="text-slate-500">Transferred At:</span>{' '}
          {new Date(handoff.createdAt).toLocaleString()}
        </div>
        <div className="col-span-1 md:col-span-2">
          <span className="text-slate-500">Reason:</span> {handoff.reason}
        </div>
        {handoff.notes && (
          <div className="col-span-1 md:col-span-2 text-slate-600 italic">
            <span className="text-slate-500 not-italic">Notes:</span> {handoff.notes}
          </div>
        )}
      </div>

      {actionError && (
        <div className="mb-3 p-2 bg-rose-100 border border-rose-300 text-xs text-rose-900 rounded">
          {actionError}
        </div>
      )}

      {!canAction ? (
        <div className="text-xs text-amber-900/80 bg-amber-100/50 p-2.5 rounded border border-amber-200 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Only authorized officers from <strong>{handoff.toDepartment}</strong> may accept or reject this case. Switch user role above to act.
          </span>
        </div>
      ) : rejecting ? (
        <form onSubmit={handleReject} className="space-y-3 pt-2 border-t border-amber-200">
          <label className="block text-xs font-semibold text-rose-900">
            Defect Memorandum / Reason for Rejection *
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Specify reason (e.g. Broken evidence container seal, missing statutory signature, insufficient prima facie case)..."
            rows={2}
            className="w-full text-xs p-2 border border-rose-300 rounded-lg bg-white focus:outline-rose-500"
            required
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {busy ? 'Returning...' : 'Confirm Rejection & Return Case'}
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/50 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-amber-200/60">
          <button
            onClick={handleAccept}
            disabled={busy}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{busy ? 'Accepting...' : `Accept Custody into ${handoff.toDepartment}`}</span>
          </button>
          <button
            onClick={() => setRejecting(true)}
            disabled={busy}
            className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-medium rounded-lg flex items-center gap-1.5 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            <span>Return Case with Defect Memo</span>
          </button>
        </div>
      )}
    </div>
  );
};
