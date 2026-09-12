/**
 * State transition matrix and authorization rules.
 */

import { Department, NextAvailableAction, UserContext, UserRole, WorkflowState } from '../../types/workflow.types';

export interface TransitionRule {
  fromState: WorkflowState;
  toState: WorkflowState;
  targetDepartment: Department;
  allowedRoles: UserRole[];
  requiresActiveHandoff: boolean;
  isRejection?: boolean;
  requiresReason?: boolean;
  description: string;
}

export const TRANSITION_MATRIX: TransitionRule[] = [
  // 1. DRAFT -> POLICE_INVESTIGATION
  {
    fromState: WorkflowState.DRAFT,
    toState: WorkflowState.POLICE_INVESTIGATION,
    targetDepartment: Department.POLICE,
    allowedRoles: [UserRole.POLICE_OFFICER, UserRole.POLICE_STATION_HEAD, UserRole.SYSTEM_ADMIN],
    requiresActiveHandoff: false,
    description: 'FIR formalized into active police investigation',
  },

  // 2. POLICE_INVESTIGATION -> HANDOFF_TO_FORENSIC_PENDING
  {
    fromState: WorkflowState.POLICE_INVESTIGATION,
    toState: WorkflowState.HANDOFF_TO_FORENSIC_PENDING,
    targetDepartment: Department.FORENSIC,
    allowedRoles: [UserRole.POLICE_OFFICER, UserRole.POLICE_STATION_HEAD, UserRole.SYSTEM_ADMIN],
    requiresActiveHandoff: true,
    description: 'Police transmits physical/digital evidence to Forensic Science Lab',
  },

  // 3. HANDOFF_TO_FORENSIC_PENDING -> FORENSIC_ANALYSIS (Acceptance)
  {
    fromState: WorkflowState.HANDOFF_TO_FORENSIC_PENDING,
    toState: WorkflowState.FORENSIC_ANALYSIS,
    targetDepartment: Department.FORENSIC,
    allowedRoles: [UserRole.FORENSIC_EXPERT, UserRole.FORENSIC_DIRECTOR, UserRole.SYSTEM_ADMIN],
    requiresActiveHandoff: false,
    description: 'Forensic Lab validates chain-of-custody and commences forensic examination',
  },

  // 4. HANDOFF_TO_FORENSIC_PENDING -> POLICE_INVESTIGATION (Rejection)
  {
    fromState: WorkflowState.HANDOFF_TO_FORENSIC_PENDING,
    toState: WorkflowState.POLICE_INVESTIGATION,
    targetDepartment: Department.POLICE,
    allowedRoles: [UserRole.FORENSIC_EXPERT, UserRole.FORENSIC_DIRECTOR, UserRole.SYSTEM_ADMIN],
    requiresActiveHandoff: false,
    isRejection: true,
    requiresReason: true,
    description: 'Forensic Lab returns sample due to seal defect or packaging deficiency',
  },

  // 5. FORENSIC_ANALYSIS -> HANDOFF_TO_PROSECUTOR_PENDING
  {
    fromState: WorkflowState.FORENSIC_ANALYSIS,
    toState: WorkflowState.HANDOFF_TO_PROSECUTOR_PENDING,
    targetDepartment: Department.PROSECUTOR,
    allowedRoles: [UserRole.FORENSIC_EXPERT, UserRole.FORENSIC_DIRECTOR, UserRole.POLICE_STATION_HEAD, UserRole.SYSTEM_ADMIN],
    requiresActiveHandoff: true,
    description: 'Forensic report completed and submitted to Public Prosecutor',
  },

  // 6. POLICE_INVESTIGATION -> HANDOFF_TO_PROSECUTOR_PENDING (Direct or Post-Forensic)
  {
    fromState: WorkflowState.POLICE_INVESTIGATION,
    toState: WorkflowState.HANDOFF_TO_PROSECUTOR_PENDING,
    targetDepartment: Department.PROSECUTOR,
    allowedRoles: [UserRole.POLICE_OFFICER, UserRole.POLICE_STATION_HEAD, UserRole.SYSTEM_ADMIN],
    requiresActiveHandoff: true,
    description: 'Police Final Report / Charge Sheet submitted to Prosecution Directorate',
  },

  // 7. HANDOFF_TO_PROSECUTOR_PENDING -> PROSECUTION_REVIEW (Acceptance)
  {
    fromState: WorkflowState.HANDOFF_TO_PROSECUTOR_PENDING,
    toState: WorkflowState.PROSECUTION_REVIEW,
    targetDepartment: Department.PROSECUTOR,
    allowedRoles: [UserRole.PUBLIC_PROSECUTOR, UserRole.CHIEF_PROSECUTOR, UserRole.SYSTEM_ADMIN],
    requiresActiveHandoff: false,
    description: 'Prosecutor accepts case file for legal scrutiny',
  },

  // 8. HANDOFF_TO_PROSECUTOR_PENDING -> POLICE_INVESTIGATION (Rejection / Remand)
  {
    fromState: WorkflowState.HANDOFF_TO_PROSECUTOR_PENDING,
    toState: WorkflowState.POLICE_INVESTIGATION,
    targetDepartment: Department.POLICE,
    allowedRoles: [UserRole.PUBLIC_PROSECUTOR, UserRole.CHIEF_PROSECUTOR, UserRole.SYSTEM_ADMIN],
    requiresActiveHandoff: false,
    isRejection: true,
    requiresReason: true,
    description: 'Prosecutor returns case to Police for curing procedural defects or further investigation',
  },

  // 9. PROSECUTION_REVIEW -> HANDOFF_TO_COURT_PENDING
  {
    fromState: WorkflowState.PROSECUTION_REVIEW,
    toState: WorkflowState.HANDOFF_TO_COURT_PENDING,
    targetDepartment: Department.COURT,
    allowedRoles: [UserRole.PUBLIC_PROSECUTOR, UserRole.CHIEF_PROSECUTOR, UserRole.SYSTEM_ADMIN],
    requiresActiveHandoff: true,
    description: 'Prosecutor files charge sheet before the Judicial Magistrate / Court Registry',
  },

  // 10. HANDOFF_TO_COURT_PENDING -> COURT_TRIAL (Acceptance & Cognizance)
  {
    fromState: WorkflowState.HANDOFF_TO_COURT_PENDING,
    toState: WorkflowState.COURT_TRIAL,
    targetDepartment: Department.COURT,
    allowedRoles: [UserRole.JUDGE, UserRole.COURT_CLERK, UserRole.SYSTEM_ADMIN],
    requiresActiveHandoff: false,
    description: 'Court Registry checks scrutiny, Judge takes judicial cognizance, trial starts',
  },

  // 11. HANDOFF_TO_COURT_PENDING -> PROSECUTION_REVIEW (Rejection / Defect memo)
  {
    fromState: WorkflowState.HANDOFF_TO_COURT_PENDING,
    toState: WorkflowState.PROSECUTION_REVIEW,
    targetDepartment: Department.PROSECUTOR,
    allowedRoles: [UserRole.JUDGE, UserRole.COURT_CLERK, UserRole.SYSTEM_ADMIN],
    requiresActiveHandoff: false,
    isRejection: true,
    requiresReason: true,
    description: 'Court Registry issues defect memorandum back to Prosecution',
  },

  // 12. COURT_TRIAL -> CASE_CLOSED
  {
    fromState: WorkflowState.COURT_TRIAL,
    toState: WorkflowState.CASE_CLOSED,
    targetDepartment: Department.CLOSED,
    allowedRoles: [UserRole.JUDGE, UserRole.SYSTEM_ADMIN],
    requiresActiveHandoff: false,
    requiresReason: true,
    description: 'Court delivers final judgment and disposes the matter',
  },
];

export class TransitionRulesValidator {
  /**
   * Finds matching transition rule
   */
  public static findRule(fromState: WorkflowState, toState: WorkflowState): TransitionRule | undefined {
    return TRANSITION_MATRIX.find(
      (r) => r.fromState === fromState && r.toState === toState
    );
  }

  /**
   * Validates if a transition is structurally possible
   */
  public static isTransitionAllowed(fromState: WorkflowState, toState: WorkflowState): boolean {
    return this.findRule(fromState, toState) !== undefined;
  }

  /**
   * Checks if user has necessary role to execute the transition
   */
  public static canUserExecute(user: UserContext, rule: TransitionRule): boolean {
    if (user.role === UserRole.SYSTEM_ADMIN) return true;
    return rule.allowedRoles.includes(user.role);
  }

  /**
   * Lists all next possible actions for a case at a given state
   */
  public static getNextAvailableActions(currentState: WorkflowState, userRole: UserRole): NextAvailableAction[] {
    return TRANSITION_MATRIX
      .filter((r) => r.fromState === currentState)
      .map((r) => ({
        actionName: r.isRejection ? `Reject / Return to ${r.targetDepartment}` : `Advance to ${r.toState.replace(/_/g, ' ')}`,
        targetState: r.toState,
        targetDepartment: r.targetDepartment,
        requiresHandoff: r.requiresActiveHandoff,
        allowedRoles: r.allowedRoles,
        description: r.description,
      }))
      .filter((action) => userRole === UserRole.SYSTEM_ADMIN || action.allowedRoles.includes(userRole));
  }
}
