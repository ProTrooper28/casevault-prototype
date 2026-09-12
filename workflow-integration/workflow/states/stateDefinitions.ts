/**
 * Registry of workflow states, departmental ownership, and default SLAs.
 */

import { Department, SlaStageConfig, UserRole, WorkflowState } from '../../types/workflow.types';

export interface StateDefinition {
  state: WorkflowState;
  department: Department;
  title: string;
  description: string;
  allowedRoles: UserRole[];
  isTerminal: boolean;
  requiredPrecedingState?: WorkflowState[];
  requiredEvidenceTypes?: string[];
  slaConfig: SlaStageConfig;
}

export const WORKFLOW_STATE_REGISTRY: Record<WorkflowState, StateDefinition> = {
  [WorkflowState.DRAFT]: {
    state: WorkflowState.DRAFT,
    department: Department.POLICE,
    title: 'FIR / Case Draft',
    description: 'Initial FIR registration and preliminary case formulation.',
    allowedRoles: [UserRole.POLICE_OFFICER, UserRole.POLICE_STATION_HEAD, UserRole.SYSTEM_ADMIN],
    isTerminal: false,
    slaConfig: {
      stage: WorkflowState.DRAFT,
      department: Department.POLICE,
      defaultDurationHours: 24, // 24 hours to formalize FIR
      atRiskThresholdPercent: 75,
    },
  },

  [WorkflowState.POLICE_INVESTIGATION]: {
    state: WorkflowState.POLICE_INVESTIGATION,
    department: Department.POLICE,
    title: 'Police Investigation',
    description: 'Investigation active: witness statements, scene inspection, evidence acquisition.',
    allowedRoles: [UserRole.POLICE_OFFICER, UserRole.POLICE_STATION_HEAD, UserRole.SYSTEM_ADMIN],
    isTerminal: false,
    requiredPrecedingState: [WorkflowState.DRAFT, WorkflowState.HANDOFF_TO_FORENSIC_PENDING, WorkflowState.HANDOFF_TO_PROSECUTOR_PENDING],
    slaConfig: {
      stage: WorkflowState.POLICE_INVESTIGATION,
      department: Department.POLICE,
      defaultDurationHours: 1440, // 60 days standard statutory limit (or hackathon fast-track)
      atRiskThresholdPercent: 80,
    },
  },

  [WorkflowState.HANDOFF_TO_FORENSIC_PENDING]: {
    state: WorkflowState.HANDOFF_TO_FORENSIC_PENDING,
    department: Department.FORENSIC,
    title: 'Handoff to Forensic Lab Pending',
    description: 'Physical evidence packaged and dispatched to Central/State Forensic Science Lab.',
    allowedRoles: [UserRole.FORENSIC_EXPERT, UserRole.FORENSIC_DIRECTOR, UserRole.SYSTEM_ADMIN],
    isTerminal: false,
    requiredPrecedingState: [WorkflowState.POLICE_INVESTIGATION],
    slaConfig: {
      stage: WorkflowState.HANDOFF_TO_FORENSIC_PENDING,
      department: Department.FORENSIC,
      defaultDurationHours: 48, // 48 hours for forensic desk to accept
      atRiskThresholdPercent: 75,
    },
  },

  [WorkflowState.FORENSIC_ANALYSIS]: {
    state: WorkflowState.FORENSIC_ANALYSIS,
    department: Department.FORENSIC,
    title: 'Forensic Lab Examination',
    description: 'Ballistics, DNA, chemical analysis, digital cyber forensics, and expert report generation.',
    allowedRoles: [UserRole.FORENSIC_EXPERT, UserRole.FORENSIC_DIRECTOR, UserRole.SYSTEM_ADMIN],
    isTerminal: false,
    requiredPrecedingState: [WorkflowState.HANDOFF_TO_FORENSIC_PENDING],
    slaConfig: {
      stage: WorkflowState.FORENSIC_ANALYSIS,
      department: Department.FORENSIC,
      defaultDurationHours: 360, // 15 days forensic report deadline
      atRiskThresholdPercent: 80,
    },
  },

  [WorkflowState.HANDOFF_TO_PROSECUTOR_PENDING]: {
    state: WorkflowState.HANDOFF_TO_PROSECUTOR_PENDING,
    department: Department.PROSECUTOR,
    title: 'Handoff to Public Prosecutor Pending',
    description: 'Police charge sheet (Final Report under CrPC/BNSS) and Forensic reports submitted to Prosecution.',
    allowedRoles: [UserRole.PUBLIC_PROSECUTOR, UserRole.CHIEF_PROSECUTOR, UserRole.SYSTEM_ADMIN],
    isTerminal: false,
    requiredPrecedingState: [WorkflowState.POLICE_INVESTIGATION, WorkflowState.FORENSIC_ANALYSIS],
    slaConfig: {
      stage: WorkflowState.HANDOFF_TO_PROSECUTOR_PENDING,
      department: Department.PROSECUTOR,
      defaultDurationHours: 48,
      atRiskThresholdPercent: 75,
    },
  },

  [WorkflowState.PROSECUTION_REVIEW]: {
    state: WorkflowState.PROSECUTION_REVIEW,
    department: Department.PROSECUTOR,
    title: 'Prosecution Legal Scrutiny',
    description: 'Prosecution scrutinizes chargesheet, verifies prima facie case, checks statutory sanctions.',
    allowedRoles: [UserRole.PUBLIC_PROSECUTOR, UserRole.CHIEF_PROSECUTOR, UserRole.SYSTEM_ADMIN],
    isTerminal: false,
    requiredPrecedingState: [WorkflowState.HANDOFF_TO_PROSECUTOR_PENDING, WorkflowState.HANDOFF_TO_COURT_PENDING],
    slaConfig: {
      stage: WorkflowState.PROSECUTION_REVIEW,
      department: Department.PROSECUTOR,
      defaultDurationHours: 168, // 7 days legal scrutiny
      atRiskThresholdPercent: 75,
    },
  },

  [WorkflowState.HANDOFF_TO_COURT_PENDING]: {
    state: WorkflowState.HANDOFF_TO_COURT_PENDING,
    department: Department.COURT,
    title: 'Filing with Court Registry Pending',
    description: 'Chargesheet filed with Court Registry, awaiting judicial cognizance & case number assignment.',
    allowedRoles: [UserRole.JUDGE, UserRole.COURT_CLERK, UserRole.SYSTEM_ADMIN],
    isTerminal: false,
    requiredPrecedingState: [WorkflowState.PROSECUTION_REVIEW],
    slaConfig: {
      stage: WorkflowState.HANDOFF_TO_COURT_PENDING,
      department: Department.COURT,
      defaultDurationHours: 72,
      atRiskThresholdPercent: 75,
    },
  },

  [WorkflowState.COURT_TRIAL]: {
    state: WorkflowState.COURT_TRIAL,
    department: Department.COURT,
    title: 'Court Trial & Hearing',
    description: 'Cognizance taken, framing of charges, examination of prosecution/defense witnesses, final arguments.',
    allowedRoles: [UserRole.JUDGE, UserRole.COURT_CLERK, UserRole.SYSTEM_ADMIN],
    isTerminal: false,
    requiredPrecedingState: [WorkflowState.HANDOFF_TO_COURT_PENDING],
    slaConfig: {
      stage: WorkflowState.COURT_TRIAL,
      department: Department.COURT,
      defaultDurationHours: 2160, // 90 days target trial span
      atRiskThresholdPercent: 85,
    },
  },

  [WorkflowState.CASE_CLOSED]: {
    state: WorkflowState.CASE_CLOSED,
    department: Department.CLOSED,
    title: 'Case Disposed / Closed',
    description: 'Final judgment delivered, sentencing executed or acquittal archived.',
    allowedRoles: [UserRole.JUDGE, UserRole.SYSTEM_ADMIN],
    isTerminal: true,
    requiredPrecedingState: [WorkflowState.COURT_TRIAL],
    slaConfig: {
      stage: WorkflowState.CASE_CLOSED,
      department: Department.CLOSED,
      defaultDurationHours: 0,
      atRiskThresholdPercent: 100,
    },
  },
};

/**
 * Maps a target receiving department to its corresponding handoff-pending workflow state.
 */
export const DEPARTMENT_HANDOFF_STATE_MAP: Partial<Record<Department, WorkflowState>> = {
  [Department.FORENSIC]: WorkflowState.HANDOFF_TO_FORENSIC_PENDING,
  [Department.PROSECUTOR]: WorkflowState.HANDOFF_TO_PROSECUTOR_PENDING,
  [Department.COURT]: WorkflowState.HANDOFF_TO_COURT_PENDING,
};

/**
 * Returns the corresponding handoff-pending state for a target receiving department.
 */
export function getHandoffPendingState(targetDepartment: Department): WorkflowState | undefined {
  return DEPARTMENT_HANDOFF_STATE_MAP[targetDepartment];
}

/**
 * Resolves the configured default SLA duration in hours for a target department handoff
 * directly from the centralized state registry.
 */
export function getHandoffSlaDurationHours(targetDepartment: Department): number {
  const pendingState = getHandoffPendingState(targetDepartment);
  if (pendingState) {
    const config = WORKFLOW_STATE_REGISTRY[pendingState]?.slaConfig;
    if (config) {
      return config.defaultDurationHours;
    }
  }
  return 0;
}
