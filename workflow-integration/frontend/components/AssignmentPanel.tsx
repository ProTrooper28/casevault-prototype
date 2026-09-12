/**
 * Case officer assignment panel. Enables department supervisors to assign cases.
 */

import React, { useState } from 'react';
import { Department, UserContext, UserRole } from '../../types/workflow.types';
import { UserCheck, AlertCircle } from 'lucide-react';

interface AssignmentPanelProps {
  currentOfficerName?: string;
  currentOfficerId?: string;
  currentDepartment: Department;
  currentUser: UserContext;
  roster: UserContext[];
  onAssign: (officerId: string, officerName: string) => Promise<void>;
}

export const AssignmentPanel: React.FC<AssignmentPanelProps> = ({
  currentOfficerName,
  currentOfficerId,
  currentDepartment,
  currentUser,
  roster,
  onAssign,
}) => {
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supervisory roles capable of assignment
  const canAssign = [
    UserRole.POLICE_STATION_HEAD,
    UserRole.FORENSIC_DIRECTOR,
    UserRole.CHIEF_PROSECUTOR,
    UserRole.JUDGE,
    UserRole.SYSTEM_ADMIN,
  ].includes(currentUser.role) && (currentUser.role === UserRole.SYSTEM_ADMIN || currentUser.department === currentDepartment);

  // Filter roster by current department
  const departmentOfficers = roster.filter(
    (u) => u.department === currentDepartment
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficerId) return;

    const officer = departmentOfficers.find((o) => o.userId === selectedOfficerId);
    if (!officer) return;

    try {
      setSubmitting(true);
      setError(null);
      await onAssign(officer.userId, officer.name);
      setSelectedOfficerId('');
    } catch (err: any) {
      setError(err.message || 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-700 rounded-md">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              Responsible Officer / Lead Custodian
            </h4>
            <p className="text-[11px] text-slate-500">
              Departmental staff holding operational responsibility
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
          {currentOfficerName || 'Unassigned'}
        </span>
      </div>

      {error && (
        <div className="p-2 mb-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {canAssign ? (
        <form onSubmit={handleAssign} className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <select
            value={selectedOfficerId}
            onChange={(e) => setSelectedOfficerId(e.target.value)}
            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-blue-600"
          >
            <option value="">-- Reassign to Department Staff --</option>
            {departmentOfficers.map((o) => (
              <option key={o.userId} value={o.userId}>
                {o.name} ({o.role.replace(/_/g, ' ')})
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!selectedOfficerId || submitting}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg disabled:opacity-40 transition-colors"
          >
            {submitting ? 'Assigning...' : 'Assign'}
          </button>
        </form>
      ) : (
        <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">
          Only supervisory officers ({currentUser.department} Chief / Admin) have assignment authority.
        </p>
      )}
    </div>
  );
};
