/**
 * Workflow state engine.
 * Validates transitions and permissions, updates case states,
 * manages handoffs, and records audit events.
 */

import {
  CaseRecord,
  Department,
  HandoffRecord,
  HandoffStatus,
  NextAvailableAction,
  TransitionContext,
  TransitionResult,
  UserContext,
  UserRole,
  WorkflowEvent,
  WorkflowEventType,
  WorkflowState,
} from '../../types/workflow.types';
import {
  IAuditService,
  ICaseService,
  IDatabaseAdapter,
  IDocumentService,
  IForensicMlService,
  INotificationService,
} from '../../types/integration.types';
import { TransitionRulesValidator } from '../transitions/transitionRules';
import { HandoffManager } from '../handoffs/handoffManager';
import { WORKFLOW_STATE_REGISTRY } from '../states/stateDefinitions';

export interface WorkflowEngineDependencies {
  db: IDatabaseAdapter;
  caseService: ICaseService;
  auditService: IAuditService;
  notificationService?: INotificationService;
  documentService?: IDocumentService;
  forensicMlService?: IForensicMlService;
}

export class WorkflowEngine {
  private db: IDatabaseAdapter;
  private caseService: ICaseService;
  private auditService: IAuditService;
  private notificationService?: INotificationService;
  private documentService?: IDocumentService;
  private forensicMlService?: IForensicMlService;
  public handoffManager: HandoffManager;

  constructor(deps: WorkflowEngineDependencies) {
    this.db = deps.db;
    this.caseService = deps.caseService;
    this.auditService = deps.auditService;
    this.notificationService = deps.notificationService;
    this.documentService = deps.documentService;
    this.forensicMlService = deps.forensicMlService;
    this.handoffManager = new HandoffManager(deps.db, deps.notificationService);
  }

  /**
   * Execute a state transition for a case.
   */
  public async executeTransition(
    user: UserContext,
    ctx: TransitionContext
  ): Promise<TransitionResult> {
    // 1. Verify case exists and is open
    const caseRecord = await this.caseService.getCaseById(ctx.caseId);
    if (!caseRecord) {
      throw new Error(`Case with ID '${ctx.caseId}' not found.`);
    }

    if (caseRecord.state === WorkflowState.CASE_CLOSED) {
      throw new Error(`Case '${ctx.caseId}' is closed. No further transitions permitted.`);
    }

    // 2. Verify state transition rule
    const rule = TransitionRulesValidator.findRule(caseRecord.state, ctx.requestedNextState);
    if (!rule) {
      throw new Error(
        `Invalid transition: Cannot advance from '${caseRecord.state}' to '${ctx.requestedNextState}'.`
      );
    }

    // 3. Verify user permissions
    const isAllowedRole = TransitionRulesValidator.canUserExecute(user, rule);
    if (!isAllowedRole) {
      throw new Error(
        `Unauthorized: User with role '${user.role}' is not permitted to advance case to '${ctx.requestedNextState}'.`
      );
    }

    // 4. Check department jurisdiction
    if (user.role !== UserRole.SYSTEM_ADMIN && user.department !== caseRecord.currentDepartment) {
      // Allow receiving department to accept or reject pending handoffs
      const isReceivingActor =
        [
          WorkflowState.HANDOFF_TO_FORENSIC_PENDING,
          WorkflowState.HANDOFF_TO_PROSECUTOR_PENDING,
          WorkflowState.HANDOFF_TO_COURT_PENDING,
        ].includes(caseRecord.state) && user.department === rule.targetDepartment;

      if (!isReceivingActor) {
        throw new Error(
          `Department mismatch: User belongs to '${user.department}', but case is currently held by '${caseRecord.currentDepartment}'.`
        );
      }
    }

    // 5. Check prerequisites if services are configured
    if (this.documentService && rule.targetDepartment !== Department.POLICE) {
      const docCheck = await this.documentService.verifyRequiredDocuments(caseRecord.id, caseRecord.state);
      if (!docCheck.valid) {
        throw new Error(`Document validation failed: Missing required files: ${docCheck.missingDocs.join(', ')}`);
      }
    }

    if (this.forensicMlService && caseRecord.state === WorkflowState.FORENSIC_ANALYSIS) {
      const reportReady = await this.forensicMlService.verifyForensicReportCompleted(caseRecord.id);
      if (!reportReady) {
        throw new Error('Forensic transition blocked: Laboratory examination report has not been signed off.');
      }
    }

    // 6. Create or resolve handoff record
    let associatedHandoffId: string | undefined;

    if (rule.requiresActiveHandoff) {
      const stateConfig = WORKFLOW_STATE_REGISTRY[rule.toState]?.slaConfig;
      const slaDurationHours = stateConfig?.defaultDurationHours;

      const handoff = await this.handoffManager.initiateHandoff(
        caseRecord.id,
        caseRecord.currentDepartment,
        rule.targetDepartment,
        user,
        ctx.reason || rule.description,
        ctx.notes,
        ctx.evidenceManifest || [],
        ctx.targetOfficerId,
        slaDurationHours
      );
      associatedHandoffId = handoff.id;
    } else {
      const activeHandoff = await this.db.getActiveHandoffForCase(caseRecord.id);
      if (activeHandoff && activeHandoff.status === HandoffStatus.PENDING) {
        if (rule.isRejection) {
          if (!ctx.reason) {
            throw new Error('A specific rejection reason must be provided to return the case.');
          }
          await this.handoffManager.rejectHandoff(activeHandoff.id, user, ctx.reason);
        } else {
          await this.handoffManager.acceptHandoff(activeHandoff.id, user, ctx.notes);
        }
        associatedHandoffId = activeHandoff.id;
      }
    }

    // 7. Apply state transition to case
    const previousState = caseRecord.state;
    const newState = ctx.requestedNextState;
    const targetDept = rule.targetDepartment;

    await this.caseService.updateCaseState(
      caseRecord.id,
      newState,
      targetDept,
      ctx.targetOfficerId
    );

    // 8. Record workflow event and audit hash
    const eventType = rule.isRejection
      ? WorkflowEventType.HANDOFF_REJECTED
      : rule.requiresActiveHandoff
      ? WorkflowEventType.HANDOFF_INITIATED
      : newState === WorkflowState.CASE_CLOSED
      ? WorkflowEventType.CASE_CLOSED
      : WorkflowEventType.STAGE_STARTED;

    const eventPayload: Record<string, unknown> = {
      caseId: caseRecord.id,
      previousState,
      newState,
      fromDepartment: caseRecord.currentDepartment,
      toDepartment: targetDept,
      performedBy: user.userId,
      timestamp: new Date().toISOString(),
      reason: ctx.reason,
    };

    const auditHash = this.auditService.generateAuditHash(
      caseRecord.id,
      eventPayload
    );

    const event: WorkflowEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      caseId: caseRecord.id,
      type: eventType,
      previousState,
      newState,
      fromDepartment: caseRecord.currentDepartment,
      toDepartment: targetDept,
      performedBy: user.userId,
      performedByName: user.name,
      role: user.role,
      timestamp: new Date().toISOString(),
      comment: ctx.reason || ctx.notes || rule.description,
      auditHash,
    };

    await this.db.saveWorkflowEvent(event);
    await this.auditService.logWorkflowEvent(event);

    // Step 9: Return Result
    return {
      success: true,
      caseId: caseRecord.id,
      previousState,
      newState,
      currentDepartment: targetDept,
      handoffId: associatedHandoffId,
      eventId: event.id,
      timestamp: event.timestamp,
      message: rule.description,
    };
  }

  /**
   * Retrieves next possible actions for a case based on current state and user role
   */
  public async getNextActions(caseId: string, user: UserContext): Promise<NextAvailableAction[]> {
    const caseRecord = await this.caseService.getCaseById(caseId);
    if (!caseRecord) {
      throw new Error(`Case ${caseId} not found`);
    }

    if (caseRecord.state === WorkflowState.CASE_CLOSED) {
      return [];
    }

    return TransitionRulesValidator.getNextAvailableActions(caseRecord.state, user.role);
  }

  /**
   * Assigns an officer to a case within the current department
   */
  public async assignCaseOfficer(
    caseId: string,
    officerId: string,
    officerName: string,
    assigner: UserContext
  ): Promise<CaseRecord> {
    const caseRecord = await this.caseService.getCaseById(caseId);
    if (!caseRecord) {
      throw new Error(`Case ${caseId} not found`);
    }

    // Role check: Only Station Heads, Directors, Chief Prosecutors, Judges, or Admin can assign
    const supervisoryRoles = [
      UserRole.POLICE_STATION_HEAD,
      UserRole.FORENSIC_DIRECTOR,
      UserRole.CHIEF_PROSECUTOR,
      UserRole.JUDGE,
      UserRole.SYSTEM_ADMIN,
    ];

    if (!supervisoryRoles.includes(assigner.role)) {
      throw new Error(`Unauthorized: Role '${assigner.role}' lacks supervisory case assignment privilege.`);
    }

    if (assigner.role !== UserRole.SYSTEM_ADMIN && assigner.department !== caseRecord.currentDepartment) {
      throw new Error(`Cannot assign officer: Assigner belongs to ${assigner.department}, case is held by ${caseRecord.currentDepartment}`);
    }

    const updatedCase = await this.caseService.assignOfficer(caseId, officerId, officerName);

    // Record audit event
    const event: WorkflowEvent = {
      id: `evt-assign-${Date.now()}`,
      caseId,
      type: WorkflowEventType.CASE_ASSIGNED,
      previousState: caseRecord.state,
      newState: caseRecord.state,
      fromDepartment: caseRecord.currentDepartment,
      toDepartment: caseRecord.currentDepartment,
      performedBy: assigner.userId,
      performedByName: assigner.name,
      role: assigner.role,
      timestamp: new Date().toISOString(),
      comment: `Case formally assigned to ${officerName} (ID: ${officerId})`,
      auditHash: this.auditService.generateAuditHash(caseId, { officerId, officerName }),
    };

    await this.db.saveWorkflowEvent(event);
    await this.auditService.logWorkflowEvent(event);

    return updatedCase;
  }
}
