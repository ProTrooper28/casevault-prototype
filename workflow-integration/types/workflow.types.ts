/**
 * Domain types, enums, and interfaces for workflow state machine,
 * department handoffs, SLA tracking, and timeline aggregation.
 */

export enum Department {
  POLICE = 'POLICE',
  FORENSIC = 'FORENSIC',
  PROSECUTOR = 'PROSECUTOR',
  COURT = 'COURT',
  CLOSED = 'CLOSED',
}

export enum UserRole {
  POLICE_OFFICER = 'POLICE_OFFICER',
  POLICE_STATION_HEAD = 'POLICE_STATION_HEAD',
  FORENSIC_EXPERT = 'FORENSIC_EXPERT',
  FORENSIC_DIRECTOR = 'FORENSIC_DIRECTOR',
  PUBLIC_PROSECUTOR = 'PUBLIC_PROSECUTOR',
  CHIEF_PROSECUTOR = 'CHIEF_PROSECUTOR',
  JUDGE = 'JUDGE',
  COURT_CLERK = 'COURT_CLERK',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

export enum WorkflowState {
  DRAFT = 'DRAFT',
  POLICE_INVESTIGATION = 'POLICE_INVESTIGATION',
  HANDOFF_TO_FORENSIC_PENDING = 'HANDOFF_TO_FORENSIC_PENDING',
  FORENSIC_ANALYSIS = 'FORENSIC_ANALYSIS',
  HANDOFF_TO_PROSECUTOR_PENDING = 'HANDOFF_TO_PROSECUTOR_PENDING',
  PROSECUTION_REVIEW = 'PROSECUTION_REVIEW',
  HANDOFF_TO_COURT_PENDING = 'HANDOFF_TO_COURT_PENDING',
  COURT_TRIAL = 'COURT_TRIAL',
  CASE_CLOSED = 'CASE_CLOSED',
}

export enum HandoffStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SlaHealthStatus {
  ON_TIME = 'ON_TIME',
  AT_RISK = 'AT_RISK',
  OVERDUE = 'OVERDUE',
  COMPLETED = 'COMPLETED',
}

export enum WorkflowEventType {
  CASE_CREATED = 'CASE_CREATED',
  CASE_ASSIGNED = 'CASE_ASSIGNED',
  STAGE_STARTED = 'STAGE_STARTED',
  HANDOFF_INITIATED = 'HANDOFF_INITIATED',
  HANDOFF_ACCEPTED = 'HANDOFF_ACCEPTED',
  HANDOFF_REJECTED = 'HANDOFF_REJECTED',
  STAGE_COMPLETED = 'STAGE_COMPLETED',
  SLA_WARNING = 'SLA_WARNING',
  SLA_BREACHED = 'SLA_BREACHED',
  CASE_CLOSED = 'CASE_CLOSED',
}

export interface UserContext {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  badgeNumber?: string;
  courtJurisdiction?: string;
}

export interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  collectedAt: string;
  collectedBy: string;
  secureHash: string;
  custodyHolder: Department;
}

export interface CaseRecord {
  id: string;
  firNumber: string;
  title: string;
  incidentType: string;
  state: WorkflowState;
  currentDepartment: Department;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  evidences: EvidenceItem[];
  metadata?: Record<string, unknown>;
}

export interface HandoffRecord {
  id: string;
  caseId: string;
  fromDepartment: Department;
  toDepartment: Department;
  initiatedBy: string;
  initiatedByName: string;
  assignedTo?: string;
  status: HandoffStatus;
  reason: string;
  notes?: string;
  evidenceManifest: string[];
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  deadline: string;
}

export interface SlaStageConfig {
  stage: WorkflowState;
  department: Department;
  defaultDurationHours: number;
  atRiskThresholdPercent: number; // e.g. 75%
}

export interface SlaStatusReport {
  stage: WorkflowState;
  department: Department;
  startTime: string;
  deadlineTime: string;
  elapsedHours: number;
  remainingHours: number;
  percentageUsed: number;
  health: SlaHealthStatus;
  isBreached: boolean;
}

export interface WorkflowEvent {
  id: string;
  caseId: string;
  type: WorkflowEventType;
  previousState?: WorkflowState;
  newState?: WorkflowState;
  fromDepartment?: Department;
  toDepartment?: Department;
  performedBy: string;
  performedByName: string;
  role: UserRole;
  timestamp: string;
  comment?: string;
  metadata?: Record<string, unknown>;
  auditHash: string;
}

export interface TransitionContext {
  caseId: string;
  requestedNextState: WorkflowState;
  targetDepartment: Department;
  notes?: string;
  reason?: string;
  targetOfficerId?: string;
  evidenceManifest?: string[];
}

export interface TransitionResult {
  success: boolean;
  caseId: string;
  previousState: WorkflowState;
  newState: WorkflowState;
  currentDepartment: Department;
  handoffId?: string;
  eventId: string;
  timestamp: string;
  message: string;
}

export interface NextAvailableAction {
  actionName: string;
  targetState: WorkflowState;
  targetDepartment: Department;
  requiresHandoff: boolean;
  allowedRoles: UserRole[];
  description: string;
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  eventType: WorkflowEventType;
  title: string;
  description: string;
  actorName: string;
  actorRole: string;
  department: Department;
  previousState?: WorkflowState;
  newState?: WorkflowState;
  auditHash: string;
  isHandoff: boolean;
  handoffDetails?: {
    fromDepartment: Department;
    toDepartment: Department;
    status: string;
    rejectionReason?: string;
  };
}

export interface WorkflowSummaryView {
  caseRecord: CaseRecord;
  slaStatus: SlaStatusReport;
  activeHandoff: HandoffRecord | null;
  handoffHistory: HandoffRecord[];
  nextActions: NextAvailableAction[];
  timeline: TimelineEntry[];
}
