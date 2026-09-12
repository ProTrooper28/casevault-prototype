/**
 * Builds the case timeline from workflow events and handoff records.
 */

import {
  Department,
  HandoffRecord,
  TimelineEntry,
  WorkflowEvent,
  WorkflowEventType,
  WorkflowState,
} from '../../types/workflow.types';

export type { TimelineEntry };

export class TimelineAggregator {
  /**
   * Merges and sorts workflow events and handoff records into an integrated timeline.
   */
  public static aggregateTimeline(
    events: WorkflowEvent[],
    handoffs: HandoffRecord[] = []
  ): TimelineEntry[] {
    const timeline: TimelineEntry[] = [];

    // 1. Map workflow events
    for (const event of events) {
      let title = event.type.replace(/_/g, ' ');
      let desc = event.comment || `Transitioned to ${event.newState || 'next stage'}`;

      if (event.type === WorkflowEventType.CASE_CREATED) {
        title = 'Case Registered';
        desc = 'FIR formally recorded in the system.';
      } else if (event.type === WorkflowEventType.HANDOFF_INITIATED) {
        title = `Handoff: ${event.fromDepartment} → ${event.toDepartment}`;
        desc = event.comment || `Case custody transfer initiated to ${event.toDepartment}`;
      } else if (event.type === WorkflowEventType.HANDOFF_ACCEPTED) {
        title = `Handoff Accepted by ${event.toDepartment}`;
        desc = event.comment || `Case custody formally acknowledged.`;
      } else if (event.type === WorkflowEventType.HANDOFF_REJECTED) {
        title = `Handoff Returned by ${event.toDepartment}`;
        desc = event.comment || `Returned for corrections or deficiency.`;
      } else if (event.type === WorkflowEventType.STAGE_COMPLETED) {
        title = `Stage Completed: ${event.previousState}`;
        desc = event.comment || 'Departmental deliverables submitted.';
      } else if (event.type === WorkflowEventType.CASE_CLOSED) {
        title = 'Judicial Disposal / Case Closed';
        desc = event.comment || 'Final verdict recorded. Case closed.';
      }

      timeline.push({
        id: event.id,
        timestamp: event.timestamp,
        eventType: event.type,
        title,
        description: desc,
        actorName: event.performedByName,
        actorRole: event.role,
        department: event.toDepartment || event.fromDepartment || Department.POLICE,
        previousState: event.previousState,
        newState: event.newState,
        auditHash: event.auditHash,
        isHandoff: [
          WorkflowEventType.HANDOFF_INITIATED,
          WorkflowEventType.HANDOFF_ACCEPTED,
          WorkflowEventType.HANDOFF_REJECTED,
        ].includes(event.type),
      });
    }

    // 2. Attach any specific handoff metadata if matching
    for (const entry of timeline) {
      const matchedHandoff = handoffs.find((h) => 
        (entry.timestamp === h.createdAt && entry.eventType === WorkflowEventType.HANDOFF_INITIATED) ||
        (entry.timestamp === h.acceptedAt && entry.eventType === WorkflowEventType.HANDOFF_ACCEPTED) ||
        (entry.timestamp === h.rejectedAt && entry.eventType === WorkflowEventType.HANDOFF_REJECTED)
      );

      if (matchedHandoff) {
        entry.handoffDetails = {
          fromDepartment: matchedHandoff.fromDepartment,
          toDepartment: matchedHandoff.toDepartment,
          status: matchedHandoff.status,
          rejectionReason: matchedHandoff.rejectionReason,
        };
      }
    }

    // 3. Sort chronologically (most recent first for timeline presentation)
    return timeline.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}
