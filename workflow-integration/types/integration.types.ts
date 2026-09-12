/**
 * Boundary contracts for integration adapters: Auth, Cases, Database,
 * Documents, Forensic/ML, Notifications, and Audit logging.
 */

import {
  CaseRecord,
  Department,
  HandoffRecord,
  UserContext,
  UserRole,
  WorkflowEvent,
  WorkflowState,
} from './workflow.types';

export interface IAuthService {
  getCurrentUser(tokenOrHeader?: string): Promise<UserContext>;
  validateRole(user: UserContext, allowedRoles: UserRole[]): boolean;
  canAccessDepartment(user: UserContext, department: Department): boolean;
}

export interface ICaseService {
  getCaseById(caseId: string): Promise<CaseRecord | null>;
  listCases?(): Promise<CaseRecord[]>;
  updateCaseState(
    caseId: string,
    newState: WorkflowState,
    currentDepartment: Department,
    assignedOfficerId?: string,
    assignedOfficerName?: string
  ): Promise<CaseRecord>;
  assignOfficer(
    caseId: string,
    officerId: string,
    officerName: string
  ): Promise<CaseRecord>;
  createCase(
    firNumber: string,
    title: string,
    incidentType: string,
    creator: UserContext
  ): Promise<CaseRecord>;
}

export interface IDatabaseAdapter {
  findCaseById(caseId: string): Promise<CaseRecord | null>;
  getAllCases?(): Promise<CaseRecord[]>;
  saveCase(caseData: CaseRecord): Promise<void>;
  createHandoff(handoff: HandoffRecord): Promise<void>;
  getHandoffById(handoffId: string): Promise<HandoffRecord | null>;
  getActiveHandoffForCase(caseId: string): Promise<HandoffRecord | null>;
  updateHandoff(handoff: HandoffRecord): Promise<void>;
  listHandoffsByCase(caseId: string): Promise<HandoffRecord[]>;
  saveWorkflowEvent(event: WorkflowEvent): Promise<void>;
  getWorkflowEventsByCase(caseId: string): Promise<WorkflowEvent[]>;
}

export interface INotificationService {
  notifyHandoffCreated(handoff: HandoffRecord, caseData: CaseRecord): Promise<void>;
  notifyHandoffAccepted(handoff: HandoffRecord, caseData: CaseRecord): Promise<void>;
  notifyHandoffRejected(
    handoff: HandoffRecord,
    caseData: CaseRecord,
    reason: string
  ): Promise<void>;
  notifySlaWarning(
    caseId: string,
    department: Department,
    remainingHours: number
  ): Promise<void>;
  notifyCaseClosed(caseData: CaseRecord): Promise<void>;
}

export interface IAuditService {
  logWorkflowEvent(event: WorkflowEvent): Promise<void>;
  generateAuditHash(previousHash: string, eventPayload: Record<string, unknown>): string;
  verifyAuditIntegrity(events: WorkflowEvent[]): Promise<boolean>;
}

export interface IDocumentService {
  verifyRequiredDocuments(
    caseId: string,
    stage: WorkflowState
  ): Promise<{ valid: boolean; missingDocs: string[] }>;
  sealEvidenceManifest(caseId: string, manifestIds: string[]): Promise<string>;
}

export interface IForensicMlService {
  verifyForensicReportCompleted(caseId: string): Promise<boolean>;
  checkMlEvidenceTaintScore(caseId: string): Promise<{ score: number; clean: boolean }>;
}
