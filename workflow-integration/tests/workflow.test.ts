/**
 * Workflow and integration test suite.
 * Run with: npx tsx workflow-integration/tests/workflow.test.ts
 */

import { Department, HandoffStatus, SlaHealthStatus, UserContext, UserRole, WorkflowState } from '../types/workflow.types';
import { MemoryStore } from '../integrations/database/memoryStore';
import { CaseAdapter } from '../integrations/adapters/caseAdapter';
import { AuthAdapter } from '../integrations/adapters/authAdapter';
import { AuditAdapter } from '../integrations/adapters/auditAdapter';
import { NotificationAdapter } from '../integrations/adapters/notificationAdapter';
import { DocumentAdapter } from '../integrations/adapters/documentAdapter';
import { ForensicMlAdapter } from '../integrations/adapters/forensicMlAdapter';
import { WorkflowEngine } from '../workflow/engine/workflowEngine';
import { WorkflowService } from '../backend/services/workflowService';
import { SlaTracker } from '../workflow/sla/slaTracker';
import { TimelineAggregator } from '../workflow/timeline/timelineAggregator';
import { WORKFLOW_STATE_REGISTRY, getHandoffSlaDurationHours } from '../workflow/states/stateDefinitions';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function runAllTests() {
  console.log('\nRunning workflow integration tests...\n');

  // Isolated test environment using in-memory store
  const db = new MemoryStore(false);
  const caseAdapter = new CaseAdapter(db);
  const authAdapter = new AuthAdapter();
  const auditAdapter = new AuditAdapter();
  const notifAdapter = new NotificationAdapter();
  const docAdapter = new DocumentAdapter();
  const forensicMlAdapter = new ForensicMlAdapter();

  const engine = new WorkflowEngine({
    db,
    caseService: caseAdapter,
    auditService: auditAdapter,
    notificationService: notifAdapter,
    documentService: docAdapter,
    forensicMlService: forensicMlAdapter,
  });

  const service = new WorkflowService(engine, db, caseAdapter, authAdapter, notifAdapter);

  // Test actors across departments
  const policeHead: UserContext = {
    userId: 'pol-head-01',
    name: 'Inspector Sharma',
    email: 'sharma@police.gov.in',
    role: UserRole.POLICE_STATION_HEAD,
    department: Department.POLICE,
  };

  const policeOfficer: UserContext = {
    userId: 'pol-off-01',
    name: 'Sub-Inspector Verma',
    email: 'verma@police.gov.in',
    role: UserRole.POLICE_OFFICER,
    department: Department.POLICE,
  };

  const forensicDirector: UserContext = {
    userId: 'fsl-dir-01',
    name: 'Dr. Rao',
    email: 'rao@fsl.gov.in',
    role: UserRole.FORENSIC_DIRECTOR,
    department: Department.FORENSIC,
  };

  const prosecutor: UserContext = {
    userId: 'pros-01',
    name: 'Adv. Narayanan',
    email: 'pros@gov.in',
    role: UserRole.PUBLIC_PROSECUTOR,
    department: Department.PROSECUTOR,
  };

  const judge: UserContext = {
    userId: 'judge-01',
    name: 'Justice Banerjee',
    email: 'judge@delhicourts.nic.in',
    role: UserRole.JUDGE,
    department: Department.COURT,
  };

  // Seed initial test case
  const testCase = await caseAdapter.createCase(
    'FIR/TEST/2026/001',
    'State vs. Test Suspect (Bank Fraud)',
    'BNS Sec 318',
    policeHead
  );
  const caseId = testCase.id;

  // 1. Initial State
  console.log('Transition Validation:');
  try {
    assert(testCase.state === WorkflowState.POLICE_INVESTIGATION, 'creates a new case in POLICE_INVESTIGATION state');
  } catch (e: any) {
    assert(false, 'creates a new case in POLICE_INVESTIGATION state', e.message);
  }

  // 2. Reject Invalid Transitions
  try {
    await service.transitionState(
      caseId,
      WorkflowState.COURT_TRIAL,
      Department.COURT,
      policeOfficer,
      'Attempt direct jump'
    );
    assert(false, 'rejects invalid state transitions (skipping from Police to Court)');
  } catch (e: any) {
    assert(e.message.includes('Invalid transition'), 'rejects invalid state transitions (skipping from Police to Court)');
  }

  // 3. Reject Unauthorized Transitions
  try {
    await service.completeCase(caseId, 'Police attempts to dismiss case', policeOfficer);
    assert(false, 'blocks unauthorized users from transitioning or closing a case');
  } catch (e: any) {
    assert(e.message.includes('Unauthorized') || e.message.includes('Invalid transition'), 'blocks unauthorized users from transitioning or closing a case');
  }

  // 4. Officer Assignment Permissions
  console.log('\nCase Assignment:');
  try {
    const assignedCase = await service.assignOfficer(
      caseId,
      policeOfficer.userId,
      policeOfficer.name,
      policeHead
    );
    assert(assignedCase.assignedOfficerId === policeOfficer.userId, 'allows supervisory officer (Station Head) to assign a case officer');
  } catch (e: any) {
    assert(false, 'allows supervisory officer (Station Head) to assign a case officer', e.message);
  }

  try {
    await service.assignOfficer(caseId, 'some-id', 'Some Officer', policeOfficer);
    assert(false, 'blocks junior officer without assignment permissions from assigning a case');
  } catch (e: any) {
    assert(e.message.includes('Unauthorized'), 'blocks junior officer without assignment permissions from assigning a case');
  }

  // 5. Handoff Initiation
  console.log('\nHandoff Lifecycle:');
  let handoffId = '';
  try {
    const res = await service.handoffCase(
      caseId,
      Department.FORENSIC,
      policeOfficer,
      'Forwarding ballistic exhibits to FSL',
      'Handle container with care'
    );
    handoffId = res.handoffId || '';
    const updated = await db.findCaseById(caseId);
    assert(
      updated?.state === WorkflowState.HANDOFF_TO_FORENSIC_PENDING,
      'creates a pending handoff and advances state to HANDOFF_TO_FORENSIC_PENDING'
    );
  } catch (e: any) {
    assert(false, 'creates a pending handoff and advances state to HANDOFF_TO_FORENSIC_PENDING', e.message);
  }

  // Duplicate Handoff Prevention
  try {
    await service.handoffCase(
      caseId,
      Department.FORENSIC,
      policeOfficer,
      'Attempt duplicate handoff'
    );
    assert(false, 'prevents duplicate pending handoffs for the same case');
  } catch (e: any) {
    assert(e.message.includes('Duplicate handoff') || e.message.includes('Invalid transition'), 'prevents duplicate pending handoffs for the same case');
  }

  // 6. Rejection / Defect Memo Flow
  console.log('\nRejection & Remand Flow:');
  try {
    await service.rejectHandoff(
      handoffId,
      forensicDirector,
      'Broken evidence container seal detected'
    );
    const updated = await db.findCaseById(caseId);
    assert(
      updated?.state === WorkflowState.POLICE_INVESTIGATION,
      'returns case to police investigation when handoff is rejected with a defect reason'
    );
  } catch (e: any) {
    assert(false, 'returns case to police investigation when handoff is rejected with a defect reason', e.message);
  }

  // Re-dispatch after defect fix
  const res2 = await service.handoffCase(
    caseId,
    Department.FORENSIC,
    policeOfficer,
    'Resubmitted exhibits with verified FSL seal'
  );
  handoffId = res2.handoffId || '';

  // Handoff Acceptance
  try {
    await service.acceptHandoff(handoffId, forensicDirector, 'Seal intact; custody acknowledged');
    const updated = await db.findCaseById(caseId);
    assert(
      updated?.state === WorkflowState.FORENSIC_ANALYSIS,
      'allows the receiving department to accept a handoff and enter FORENSIC_ANALYSIS'
    );
  } catch (e: any) {
    assert(false, 'allows the receiving department to accept a handoff and enter FORENSIC_ANALYSIS', e.message);
  }

  // Full Pipeline Progression
  console.log('\nEnd-to-End Progression:');
  const res3 = await service.handoffCase(
    caseId,
    Department.PROSECUTOR,
    forensicDirector,
    'Forensic report completed, forwarding to Public Prosecutor'
  );
  const prosHandoffId = res3.handoffId || '';

  await service.acceptHandoff(prosHandoffId, prosecutor, 'Prosecutor received chargesheet & reports');
  const caseInPros = await db.findCaseById(caseId);
  assert(
    caseInPros?.state === WorkflowState.PROSECUTION_REVIEW,
    'allows prosecutor to accept custody and move case into PROSECUTION_REVIEW'
  );

  const res4 = await service.handoffCase(
    caseId,
    Department.COURT,
    prosecutor,
    'Filing chargesheet with Court Registry'
  );
  const courtHandoffId = res4.handoffId || '';

  await service.acceptHandoff(courtHandoffId, judge, 'Registry scrutinised; Judge took cognizance');
  const caseInCourt = await db.findCaseById(caseId);
  assert(
    caseInCourt?.state === WorkflowState.COURT_TRIAL,
    'allows court to take cognizance and move case into COURT_TRIAL'
  );

  try {
    await service.completeCase(
      caseId,
      'Accused convicted under BNS Sec 318; 3 years rigorous imprisonment',
      judge
    );
    const closedCase = await db.findCaseById(caseId);
    assert(
      closedCase?.state === WorkflowState.CASE_CLOSED && closedCase.closedAt !== undefined,
      'allows judicial authority to deliver verdict and close case'
    );
  } catch (e: any) {
    assert(false, 'allows judicial authority to deliver verdict and close case', e.message);
  }

  // Edge cases and integrity
  console.log('\nEdge Cases & Integrity:');
  try {
    await service.getWorkflowDetails('NON_EXISTENT_CASE_9999', policeHead);
    assert(false, 'handles requests for non-existent cases gracefully');
  } catch (e: any) {
    assert(e.message.includes('does not exist') || e.message.includes('not found'), 'handles requests for non-existent cases gracefully');
  }

  try {
    const timeline = await service.getTimeline(caseId);
    assert(timeline.length >= 6, `aggregates timeline entries from workflow events and handoffs (${timeline.length} entries)`);
    const allHaveHashes = timeline.every((t) => t.auditHash && t.auditHash.length > 5);
    assert(allHaveHashes, 'attaches verifiable audit hashes to all timeline entries');
  } catch (e: any) {
    assert(false, 'aggregates timeline entries from workflow events and handoffs', e.message);
  }

  const slaNow = SlaTracker.calculateStageSla(
    WorkflowState.POLICE_INVESTIGATION,
    Department.POLICE,
    new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    48
  );
  assert(slaNow.health === SlaHealthStatus.ON_TIME, 'calculates stage SLA as ON_TIME within statutory duration');

  const slaOverdue = SlaTracker.calculateStageSla(
    WorkflowState.POLICE_INVESTIGATION,
    Department.POLICE,
    new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
    48
  );
  assert(slaOverdue.health === SlaHealthStatus.OVERDUE && slaOverdue.isBreached, 'flags stage SLA as OVERDUE when elapsed time exceeds deadline');

  // SLA Single Source of Truth verification
  console.log('\nSLA Single Source of Truth & Handoff Deadlines:');
  const forensicRecord = await db.getHandoffById(handoffId);
  const forensicHours = Math.round(
    (new Date(forensicRecord!.deadline).getTime() - new Date(forensicRecord!.createdAt).getTime()) / (3600 * 1000)
  );
  assert(forensicHours === 48, 'derives forensic handoff deadline from state SLA (48 hours)');

  const prosRecord = await db.getHandoffById(prosHandoffId);
  const prosHours = Math.round(
    (new Date(prosRecord!.deadline).getTime() - new Date(prosRecord!.createdAt).getTime()) / (3600 * 1000)
  );
  assert(prosHours === 48, 'derives prosecution handoff deadline from state SLA (48 hours)');

  const courtRecord = await db.getHandoffById(courtHandoffId);
  const courtHours = Math.round(
    (new Date(courtRecord!.deadline).getTime() - new Date(courtRecord!.createdAt).getTime()) / (3600 * 1000)
  );
  assert(courtHours === 72, 'derives court handoff deadline from state SLA (72 hours)');

  const courtStageSla = SlaTracker.calculateStageSla(
    WorkflowState.HANDOFF_TO_COURT_PENDING,
    Department.COURT,
    courtRecord!.createdAt
  );
  assert(
    courtStageSla.deadlineTime === courtRecord!.deadline,
    'ensures workflow stage SLA deadline and handoff record deadline are identical'
  );

  // Standalone handoff initiation without explicit duration
  const standaloneHandoff = await engine.handoffManager.initiateHandoff(
    'standalone-case-sla-check',
    Department.POLICE,
    Department.FORENSIC,
    policeOfficer,
    'Testing standalone handoff resolution'
  );
  const standaloneHours = Math.round(
    (new Date(standaloneHandoff.deadline).getTime() - new Date(standaloneHandoff.createdAt).getTime()) / (3600 * 1000)
  );
  assert(
    standaloneHours === 48,
    'standalone handoff without duration derives 48h from centralized forensic state config'
  );

  // Dynamic SLA update without requiring a second hard-coded value
  const originalCourtDuration =
    WORKFLOW_STATE_REGISTRY[WorkflowState.HANDOFF_TO_COURT_PENDING].slaConfig.defaultDurationHours;
  try {
    WORKFLOW_STATE_REGISTRY[WorkflowState.HANDOFF_TO_COURT_PENDING].slaConfig.defaultDurationHours = 96;

    const dynamicHandoff = await engine.handoffManager.initiateHandoff(
      'case-dynamic-sla-test',
      Department.PROSECUTOR,
      Department.COURT,
      prosecutor,
      'Testing dynamic centralized SLA update'
    );
    const dynamicHours = Math.round(
      (new Date(dynamicHandoff.deadline).getTime() - new Date(dynamicHandoff.createdAt).getTime()) / (3600 * 1000)
    );
    assert(
      dynamicHours === 96,
      'handoff deadline reflects dynamically updated centralized SLA (96 hours) without hardcoding'
    );

    const dynamicSla = SlaTracker.calculateStageSla(
      WorkflowState.HANDOFF_TO_COURT_PENDING,
      Department.COURT,
      dynamicHandoff.createdAt
    );
    assert(
      dynamicSla.deadlineTime === dynamicHandoff.deadline,
      'stage SLA and handoff deadline remain consistent when centralized SLA changes'
    );
  } finally {
    WORKFLOW_STATE_REGISTRY[WorkflowState.HANDOFF_TO_COURT_PENDING].slaConfig.defaultDurationHours =
      originalCourtDuration;
  }
  assert(
    getHandoffSlaDurationHours(Department.COURT) === 72,
    'restores centralized court SLA to 72 hours'
  );

  const notifs = notifAdapter.getRecentNotifications();
  assert(notifs.length >= 4, `records and buffers dispatched notifications across handoff events (${notifs.length} dispatched)`);

  const canPoliceModifyCourt = authAdapter.canAccessDepartment(policeOfficer, Department.COURT);
  assert(!canPoliceModifyCourt, 'enforces inter-departmental boundary isolation in auth service');

  // Fail-closed authentication assertions
  try {
    await authAdapter.getCurrentUser();
    assert(false, 'fails closed when authorization header is missing');
  } catch (e: any) {
    assert(e.message.includes('missing') || e.message.includes('Authentication failed'), 'fails closed when authorization header is missing');
  }

  try {
    await authAdapter.getCurrentUser('Bearer non-existent-user-token');
    assert(false, 'fails closed when credentials are invalid');
  } catch (e: any) {
    assert(e.message.includes('invalid') || e.message.includes('Authentication failed'), 'fails closed when credentials are invalid');
  }

  const authenticatedUser = await authAdapter.getCurrentUser('Bearer pol-01');
  assert(authenticatedUser.userId === 'pol-01', 'authenticates valid Bearer credentials properly');

  console.log(`\nTests completed: ${passedTests} passed, ${failedTests} failed.\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test run failed with unhandled exception:', err);
  process.exit(1);
});
