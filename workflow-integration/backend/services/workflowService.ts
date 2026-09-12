/**
 * Service layer coordinating workflow engine, SLA tracking, and timeline queries.
 */

import {
  CaseRecord,
  Department,
  HandoffRecord,
  NextAvailableAction,
  SlaStatusReport,
  TimelineEntry,
  TransitionResult,
  UserContext,
  WorkflowEvent,
  WorkflowState,
  WorkflowSummaryView,
} from '../../types/workflow.types';
import {
  IAuthService,
  ICaseService,
  IDatabaseAdapter,
  INotificationService,
} from '../../types/integration.types';
import { WorkflowEngine } from '../../workflow/engine/workflowEngine';
import { SlaTracker } from '../../workflow/sla/slaTracker';
import { TimelineAggregator } from '../../workflow/timeline/timelineAggregator';

export type { WorkflowSummaryView };

export class WorkflowService {
  constructor(
    private engine: WorkflowEngine,
    private db: IDatabaseAdapter,
    private caseService: ICaseService,
    private authService: IAuthService,
    private notificationService?: INotificationService
  ) {}

  /**
   * Comprehensive workflow status snapshot for a case
   */
  public async getWorkflowDetails(caseId: string, user: UserContext): Promise<WorkflowSummaryView> {
    const caseRecord = await this.caseService.getCaseById(caseId);
    if (!caseRecord) {
      throw new Error(`Case with ID '${caseId}' does not exist.`);
    }

    const events = await this.db.getWorkflowEventsByCase(caseId);
    const handoffs = await this.db.listHandoffsByCase(caseId);
    const activeHandoff = await this.db.getActiveHandoffForCase(caseId);

    // Compute SLA
    const stageStartTime = SlaTracker.getStageStartTime(
      caseRecord.state,
      events,
      caseRecord.createdAt
    );
    const slaStatus = SlaTracker.calculateStageSla(
      caseRecord.state,
      caseRecord.currentDepartment,
      stageStartTime
    );

    // If at risk or overdue and notifications available, trigger warning
    if ((slaStatus.isBreached || slaStatus.health === 'AT_RISK') && this.notificationService) {
      await this.notificationService.notifySlaWarning(
        caseId,
        caseRecord.currentDepartment,
        slaStatus.remainingHours
      );
    }

    const nextActions = await this.engine.getNextActions(caseId, user);
    const timeline = TimelineAggregator.aggregateTimeline(events, handoffs);

    return {
      caseRecord,
      slaStatus,
      activeHandoff,
      handoffHistory: handoffs,
      nextActions,
      timeline,
    };
  }

  /**
   * Retrieves timeline entries for a case
   */
  public async getTimeline(caseId: string): Promise<TimelineEntry[]> {
    const events = await this.db.getWorkflowEventsByCase(caseId);
    const handoffs = await this.db.listHandoffsByCase(caseId);
    return TimelineAggregator.aggregateTimeline(events, handoffs);
  }

  /**
   * Direct transition or step advance
   */
  public async transitionState(
    caseId: string,
    requestedNextState: WorkflowState,
    targetDepartment: Department,
    user: UserContext,
    reason?: string,
    notes?: string
  ): Promise<TransitionResult> {
    return this.engine.executeTransition(user, {
      caseId,
      requestedNextState,
      targetDepartment,
      reason,
      notes,
    });
  }

  /**
   * Initiates departmental handoff
   */
  public async handoffCase(
    caseId: string,
    toDepartment: Department,
    user: UserContext,
    reason: string,
    notes?: string,
    evidenceManifest: string[] = [],
    targetOfficerId?: string
  ): Promise<TransitionResult> {
    const caseRecord = await this.caseService.getCaseById(caseId);
    if (!caseRecord) {
      throw new Error(`Case '${caseId}' not found.`);
    }

    // Determine pending state based on target department
    let targetPendingState: WorkflowState;
    if (toDepartment === Department.FORENSIC) {
      targetPendingState = WorkflowState.HANDOFF_TO_FORENSIC_PENDING;
    } else if (toDepartment === Department.PROSECUTOR) {
      targetPendingState = WorkflowState.HANDOFF_TO_PROSECUTOR_PENDING;
    } else if (toDepartment === Department.COURT) {
      targetPendingState = WorkflowState.HANDOFF_TO_COURT_PENDING;
    } else {
      throw new Error(`Department '${toDepartment}' does not support inbound handoff queue`);
    }

    return this.engine.executeTransition(user, {
      caseId,
      requestedNextState: targetPendingState,
      targetDepartment: toDepartment,
      reason,
      notes,
      evidenceManifest,
      targetOfficerId,
    });
  }

  /**
   * Accepts an inbound handoff
   */
  public async acceptHandoff(
    handoffId: string,
    user: UserContext,
    notes?: string
  ): Promise<TransitionResult> {
    const handoff = await this.db.getHandoffById(handoffId);
    if (!handoff) {
      throw new Error(`Handoff '${handoffId}' not found`);
    }

    // Determine next state
    let nextState: WorkflowState;
    if (handoff.toDepartment === Department.FORENSIC) {
      nextState = WorkflowState.FORENSIC_ANALYSIS;
    } else if (handoff.toDepartment === Department.PROSECUTOR) {
      nextState = WorkflowState.PROSECUTION_REVIEW;
    } else if (handoff.toDepartment === Department.COURT) {
      nextState = WorkflowState.COURT_TRIAL;
    } else {
      throw new Error(`Unsupported target department ${handoff.toDepartment}`);
    }

    return this.engine.executeTransition(user, {
      caseId: handoff.caseId,
      requestedNextState: nextState,
      targetDepartment: handoff.toDepartment,
      notes,
    });
  }

  /**
   * Rejects an inbound handoff
   */
  public async rejectHandoff(
    handoffId: string,
    user: UserContext,
    rejectionReason: string
  ): Promise<TransitionResult> {
    const handoff = await this.db.getHandoffById(handoffId);
    if (!handoff) {
      throw new Error(`Handoff '${handoffId}' not found`);
    }

    // Returning to source department
    let returnState: WorkflowState;
    if (handoff.fromDepartment === Department.POLICE) {
      returnState = WorkflowState.POLICE_INVESTIGATION;
    } else if (handoff.fromDepartment === Department.PROSECUTOR) {
      returnState = WorkflowState.PROSECUTION_REVIEW;
    } else {
      returnState = WorkflowState.POLICE_INVESTIGATION;
    }

    return this.engine.executeTransition(user, {
      caseId: handoff.caseId,
      requestedNextState: returnState,
      targetDepartment: handoff.fromDepartment,
      reason: rejectionReason,
    });
  }

  /**
   * Assigns officer
   */
  public async assignOfficer(
    caseId: string,
    officerId: string,
    officerName: string,
    assigner: UserContext
  ): Promise<CaseRecord> {
    return this.engine.assignCaseOfficer(caseId, officerId, officerName, assigner);
  }

  /**
   * Marks final stage complete / case closed
   */
  public async completeCase(
    caseId: string,
    verdictSummary: string,
    user: UserContext
  ): Promise<TransitionResult> {
    return this.engine.executeTransition(user, {
      caseId,
      requestedNextState: WorkflowState.CASE_CLOSED,
      targetDepartment: Department.CLOSED,
      reason: verdictSummary || 'Case concluded and judicial verdict filed.',
    });
  }

  /**
   * Returns all cases available in the system
   */
  public async getAvailableCases(): Promise<CaseRecord[]> {
    if (this.caseService.listCases) {
      return this.caseService.listCases();
    }
    if (this.db.getAllCases) {
      return this.db.getAllCases();
    }
    return [];
  }

  /**
   * Creates a new case through the case adapter
   */
  public async createCase(
    firNumber: string,
    title: string,
    incidentType: string,
    creator: UserContext
  ): Promise<CaseRecord> {
    return this.caseService.createCase(firNumber, title, incidentType, creator);
  }
}
