/**
 * Case workflow management dashboard.
 * Provides case workflow lifecycle visualization, inter-agency handoffs,
 * SLA tracking, and audit verification.
 */

import React, { useState } from 'react';
import { useWorkflow } from '../hooks/useWorkflow';
import { StageProgressBar } from './StageProgressBar';
import { SlaBadge } from './SlaBadge';
import { TimelineView } from './TimelineView';
import { OutboundHandoffModal, InboundHandoffCard } from './HandoffModal';
import { AssignmentPanel } from './AssignmentPanel';
import { DepartmentActions } from './DepartmentActions';
import { IntegrationVerification } from './IntegrationVerification';
import {
  Shield,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Users,
  FolderOpen,
  Layers,
} from 'lucide-react';

export const WorkflowApp: React.FC = () => {
  const {
    cases,
    selectedCaseId,
    setSelectedCaseId,
    currentUser,
    setCurrentUser,
    roster,
    details,
    loading,
    error,
    feedback,
    clearFeedback,
    clearError,
    refresh,
    initiateHandoff,
    acceptHandoff,
    rejectHandoff,
    assignOfficer,
    completeCase,
    directTransition,
    createCase,
  } = useWorkflow();

  const [handoffModalOpen, setHandoffModalOpen] = useState(false);
  const [newCaseModalOpen, setNewCaseModalOpen] = useState(false);
  const [newFirNumber, setNewFirNumber] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newIncidentType, setNewIncidentType] = useState('BNS Sec 303 (Theft) & Sec 318 (Cheating)');
  const [creatingCase, setCreatingCase] = useState(false);
  const [activeTab, setActiveTab] = useState<'WORKFLOW' | 'INTEGRATION'>('WORKFLOW');

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirNumber.trim() || !newTitle.trim()) return;
    try {
      setCreatingCase(true);
      const created = await createCase(
        newFirNumber.trim(),
        newTitle.trim(),
        newIncidentType
      );
      setNewCaseModalOpen(false);
      setNewFirNumber('');
      setNewTitle('');
      setSelectedCaseId(created.id);
      await refresh();
    } finally {
      setCreatingCase(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 font-sans antialiased">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">
                  Criminal Justice System
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-medium border border-blue-400/30">
                  WORKFLOW &amp; INTEGRATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Inter-Agency State Engine: Police → Forensic → Prosecutor → Court → Closed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('WORKFLOW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'WORKFLOW'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Case Workflow
            </button>
            <button
              onClick={() => setActiveTab('INTEGRATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'INTEGRATION'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Integration Verification
            </button>
            <button
              onClick={() => setNewCaseModalOpen(true)}
              className="ml-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register New FIR</span>
            </button>
          </div>
        </div>
      </header>

      {/* Role Switcher & Case Context Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Active User Simulation Selector (Development / Demo Persona) */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Demo Persona:</span>
            </span>
            <select
              value={currentUser.userId}
              onChange={(e) => {
                const u = roster.find((x) => x.userId === e.target.value);
                if (u) setCurrentUser(u);
              }}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800 focus:outline-blue-600"
              title="Simulated persona for development/testing. In production, identity is provided by the authentication service."
            >
              {roster.map((u) => (
                <option key={u.userId} value={u.userId}>
                  [{u.department}] {u.name} — {u.role.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono hidden sm:inline-block">
              Simulated Role
            </span>
          </div>

          {/* Case Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
              <span>Select Case:</span>
            </span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800 focus:outline-blue-600 max-w-xs truncate"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firNumber} — {c.title.substring(0, 32)}... [{c.state}]
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {feedback && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
            <button
              onClick={clearFeedback}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-rose-700 hover:text-rose-900 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {activeTab === 'INTEGRATION' ? (
          <IntegrationVerification />
        ) : loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Loading workflow pipeline data...
          </div>
        ) : !details ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No case selected. Choose or register a case above.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Case Overview Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {details.caseRecord.firNumber}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {details.caseRecord.id}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    Current Dept: {details.caseRecord.currentDepartment}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {details.caseRecord.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory Offence: <strong className="text-slate-700">{details.caseRecord.incidentType}</strong> • Registered {new Date(details.caseRecord.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <SlaBadge sla={details.slaStatus} />
              </div>
            </div>

            {/* Inbound Handoff Resolution Card if pending */}
            {details.activeHandoff && (
              <InboundHandoffCard
                handoff={details.activeHandoff}
                currentUser={currentUser}
                onAccept={acceptHandoff}
                onReject={rejectHandoff}
              />
            )}

            {/* Pipeline Visualizer */}
            <StageProgressBar
              currentState={details.caseRecord.state}
              currentDepartment={details.caseRecord.currentDepartment}
              isPendingHandoff={Boolean(details.activeHandoff)}
            />

            {/* Two-Column Working Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Control Actions & Details */}
              <div className="lg:col-span-2 space-y-6">
                <DepartmentActions
                  currentState={details.caseRecord.state}
                  currentDepartment={details.caseRecord.currentDepartment}
                  currentUser={currentUser}
                  nextActions={details.nextActions}
                  hasPendingHandoff={Boolean(details.activeHandoff)}
                  onOpenHandoffModal={() => setHandoffModalOpen(true)}
                  onCompleteCase={completeCase}
                  onDirectTransition={directTransition}
                />

                <TimelineView timeline={details.timeline} />
              </div>

              {/* Right Col: Assignment & Evidence Manifest */}
              <div className="space-y-6">
                <AssignmentPanel
                  currentOfficerName={details.caseRecord.assignedOfficerName}
                  currentOfficerId={details.caseRecord.assignedOfficerId}
                  currentDepartment={details.caseRecord.currentDepartment}
                  currentUser={currentUser}
                  roster={roster}
                  onAssign={assignOfficer}
                />

                {/* Physical / Digital Evidence Manifest Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-3 flex items-center justify-between">
                    <span>Evidence Manifest &amp; Seals</span>
                    <span className="font-mono text-slate-400">
                      ({details.caseRecord.evidences.length})
                    </span>
                  </h4>

                  {details.caseRecord.evidences.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No exhibits or evidence packages recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {details.caseRecord.evidences.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <div className="font-semibold text-slate-800">{ev.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex justify-between">
                            <span>Type: {ev.type}</span>
                            <span>Holder: {ev.custodyHolder}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                            SHA: {ev.secureHash}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subsystem Health Snapshot */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Module Boundaries</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    This module communicates through integration interfaces (`IAuthService`, `ICaseService`, `IAuditService`, `INotificationService`). In production, swap reference adapters with your backend services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Outbound Handoff Modal */}
      {details && (
        <OutboundHandoffModal
          isOpen={handoffModalOpen}
          onClose={() => setHandoffModalOpen(false)}
          currentDepartment={details.caseRecord.currentDepartment}
          evidences={details.caseRecord.evidences}
          onSubmit={async (data) => {
            await initiateHandoff(
              data.toDepartment,
              data.reason,
              data.notes,
              data.evidenceManifest
            );
          }}
        />
      )}

      {/* Register New FIR Modal */}
      {newCaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Register New Police FIR
              </h3>
              <button
                onClick={() => setNewCaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  FIR Number *
                </label>
                <input
                  type="text"
                  value={newFirNumber}
                  onChange={(e) => setNewFirNumber(e.target.value)}
                  placeholder="e.g. FIR/DL/2026/09941"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Case Title / Accused *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. State vs. Sumit Rawat & Ors."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statutory Offence Category
                </label>
                <input
                  type="text"
                  value={newIncidentType}
                  onChange={(e) => setNewIncidentType(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewCaseModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCase}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  {creatingCase ? 'Registering...' : 'Register & Lodge Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
