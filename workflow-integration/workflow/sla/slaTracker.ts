/**
 * Calculates stage SLA timers and deadline health (ON_TIME, AT_RISK, OVERDUE, COMPLETED).
 */

import {
  Department,
  SlaHealthStatus,
  SlaStatusReport,
  WorkflowEvent,
  WorkflowEventType,
  WorkflowState,
} from '../../types/workflow.types';
import { WORKFLOW_STATE_REGISTRY } from '../states/stateDefinitions';

export class SlaTracker {
  /**
   * Calculates SLA health and metrics for a case stage.
   */
  public static calculateStageSla(
    stage: WorkflowState,
    department: Department,
    stageStartTime: string | Date,
    overrideDurationHours?: number,
    referenceTime: Date = new Date()
  ): SlaStatusReport {
    const config = WORKFLOW_STATE_REGISTRY[stage]?.slaConfig;
    const durationHours = overrideDurationHours ?? config?.defaultDurationHours ?? 0;
    const start = new Date(stageStartTime);
    const deadline = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    const elapsedMs = Math.max(0, referenceTime.getTime() - start.getTime());
    const totalMs = durationHours * 60 * 60 * 1000;
    const elapsedHours = Number((elapsedMs / (1000 * 60 * 60)).toFixed(1));
    const remainingMs = deadline.getTime() - referenceTime.getTime();
    const remainingHours = Number((remainingMs / (1000 * 60 * 60)).toFixed(1));

    let percentageUsed = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 100;
    percentageUsed = Number(percentageUsed.toFixed(1));

    let health = SlaHealthStatus.ON_TIME;
    let isBreached = false;

    if (stage === WorkflowState.CASE_CLOSED) {
      health = SlaHealthStatus.COMPLETED;
    } else if (remainingHours <= 0) {
      health = SlaHealthStatus.OVERDUE;
      isBreached = true;
    } else if (percentageUsed >= (config?.atRiskThresholdPercent ?? 75)) {
      health = SlaHealthStatus.AT_RISK;
    }

    return {
      stage,
      department,
      startTime: start.toISOString(),
      deadlineTime: deadline.toISOString(),
      elapsedHours,
      remainingHours: Math.max(0, remainingHours),
      percentageUsed,
      health,
      isBreached,
    };
  }

  /**
   * Derives stage start time from workflow event history.
   * If not found, falls back to case creation time.
   */
  public static getStageStartTime(
    stage: WorkflowState,
    events: WorkflowEvent[],
    caseCreatedAt: string
  ): string {
    const relevantEvents = events
      .filter((e) => e.newState === stage || (e.type === WorkflowEventType.STAGE_STARTED && e.newState === stage))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (relevantEvents.length > 0) {
      return relevantEvents[0].timestamp;
    }
    return caseCreatedAt;
  }
}
