/**
 * Presentation view models and UI definitions for workflow components.
 */

import { Department, UserContext, UserRole, WorkflowState } from '../../types/workflow.types';

export interface StageStepInfo {
  id: WorkflowState;
  department: Department;
  label: string;
  sublabel: string;
  order: number;
}

export const CANONICAL_STAGES: StageStepInfo[] = [
  {
    id: WorkflowState.POLICE_INVESTIGATION,
    department: Department.POLICE,
    label: 'Police',
    sublabel: 'Investigation & FIR',
    order: 1,
  },
  {
    id: WorkflowState.FORENSIC_ANALYSIS,
    department: Department.FORENSIC,
    label: 'Forensic Lab',
    sublabel: 'Scientific Analysis',
    order: 2,
  },
  {
    id: WorkflowState.PROSECUTION_REVIEW,
    department: Department.PROSECUTOR,
    label: 'Prosecution',
    sublabel: 'Charge Scrutiny',
    order: 3,
  },
  {
    id: WorkflowState.COURT_TRIAL,
    department: Department.COURT,
    label: 'Court',
    sublabel: 'Judicial Trial',
    order: 4,
  },
  {
    id: WorkflowState.CASE_CLOSED,
    department: Department.CLOSED,
    label: 'Closed',
    sublabel: 'Disposed / Verdict',
    order: 5,
  },
];

/**
 * Reference personas used strictly for UI demonstration and development testing.
 * In production environments, user credentials and role claims are supplied by the auth provider.
 */
export const DEMO_PERSONAS: UserContext[] = [
  {
    userId: 'pol-01',
    name: 'Inspector Rajesh Sharma',
    email: 'rajesh.sharma@police.gov.in',
    role: UserRole.POLICE_STATION_HEAD,
    department: Department.POLICE,
    badgeNumber: 'DL-SH-409',
  },
  {
    userId: 'pol-02',
    name: 'Sub-Inspector Anjali Verma',
    email: 'anjali.verma@police.gov.in',
    role: UserRole.POLICE_OFFICER,
    department: Department.POLICE,
    badgeNumber: 'DL-IO-881',
  },
  {
    userId: 'fsl-01',
    name: 'Dr. Arisudan Rao (Forensic Chief)',
    email: 'arisudan.rao@cfsl.gov.in',
    role: UserRole.FORENSIC_DIRECTOR,
    department: Department.FORENSIC,
    badgeNumber: 'CFSL-DIR-12',
  },
  {
    userId: 'fsl-02',
    name: 'Dr. Maya Sengupta (Ballistics)',
    email: 'maya.sengupta@cfsl.gov.in',
    role: UserRole.FORENSIC_EXPERT,
    department: Department.FORENSIC,
    badgeNumber: 'CFSL-EXP-44',
  },
  {
    userId: 'pros-01',
    name: 'Adv. S. K. Narayanan (Public Prosecutor)',
    email: 'sk.narayanan@prosecution.gov.in',
    role: UserRole.PUBLIC_PROSECUTOR,
    department: Department.PROSECUTOR,
  },
  {
    userId: 'pros-02',
    name: 'Adv. Meenakshi Sundaram (Chief Prosecutor)',
    email: 'meenakshi.s@prosecution.gov.in',
    role: UserRole.CHIEF_PROSECUTOR,
    department: Department.PROSECUTOR,
  },
  {
    userId: 'crt-01',
    name: 'Hon. Justice P. K. Banerjee (Sessions Judge)',
    email: 'pk.banerjee@delhicourts.nic.in',
    role: UserRole.JUDGE,
    department: Department.COURT,
    courtJurisdiction: 'Sessions Court Delhi North',
  },
  {
    userId: 'crt-02',
    name: 'Rameshwar Dayal (Chief Court Clerk)',
    email: 'r.dayal@delhicourts.nic.in',
    role: UserRole.COURT_CLERK,
    department: Department.COURT,
    courtJurisdiction: 'Sessions Court Delhi North',
  },
  {
    userId: 'admin-01',
    name: 'National System Administrator',
    email: 'admin@icjs.nic.in',
    role: UserRole.SYSTEM_ADMIN,
    department: Department.POLICE,
  },
];

export interface SystemStatusData {
  status: string;
  timestamp: string;
  adapters: Array<{
    name: string;
    interface: string;
    status: string;
  }>;
}

