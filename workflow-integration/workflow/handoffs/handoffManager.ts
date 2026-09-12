/**
 * Manages handoff records between departments.
 * Handles handoff creation, acceptance, and rejection.
 */

import {
  Department,
  HandoffRecord,
  HandoffStatus,
  UserContext,
  UserRole,
} from '../../types/workflow.types';
import { IDatabaseAdapter, INotificationService } from '../../types/integration.types';
import { getHandoffSlaDurationHours } from '../states/stateDefinitions';

export class HandoffManager {
  constructor(
    private db: IDatabaseAdapter,
    private notifications?: INotificationService
  ) {}

  /**
   * Initiates a new formal case handoff between departments.
   * Enforces that only one pending handoff can exist per case at any time.
   * Derives deadline directly from centralized workflow state definitions.
   */
  public async initiateHandoff(
    caseId: string,
    fromDepartment: Department,
    toDepartment: Department,
    user: UserContext,
    reason: string,
    notes?: string,
    evidenceManifest: string[] = [],
    assignedToOfficerId?: string,
    slaDurationHours?: number
  ): Promise<HandoffRecord> {
    // 1. Verify if an active pending handoff already exists
    const existing = await this.db.getActiveHandoffForCase(caseId);
    if (existing && existing.status === HandoffStatus.PENDING) {
      throw new Error(`Duplicate handoff: Case ${caseId} already has an active pending handoff to ${existing.toDepartment}`);
    }

    // 2. Compute handoff deadline based on stage SLA from single source of truth
    const durationHours = slaDurationHours ?? getHandoffSlaDurationHours(toDepartment);
    const now = new Date();
    const deadline = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const handoff: HandoffRecord = {
      id: `hnd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      caseId,
      fromDepartment,
      toDepartment,
      initiatedBy: user.userId,
      initiatedByName: user.name,
      assignedTo: assignedToOfficerId,
      status: HandoffStatus.PENDING,
      reason: reason || `Department handoff from ${fromDepartment} to ${toDepartment}`,
      notes,
      evidenceManifest,
      createdAt: now.toISOString(),
      deadline: deadline.toISOString(),
    };

    await this.db.createHandoff(handoff);

    if (this.notifications) {
      const caseRecord = await this.db.findCaseById(caseId);
      if (caseRecord) {
        await this.notifications.notifyHandoffCreated(handoff, caseRecord);
      }
    }

    return handoff;
  }

  /**
   * Accepts an active pending handoff.
   * Can ONLY be accepted by an authorized user belonging to the receiving department.
   */
  public async acceptHandoff(
    handoffId: string,
    user: UserContext,
    acceptanceNotes?: string
  ): Promise<HandoffRecord> {
    const handoff = await this.db.getHandoffById(handoffId);
    if (!handoff) {
      throw new Error(`Handoff with ID ${handoffId} not found`);
    }

    if (handoff.status !== HandoffStatus.PENDING) {
      throw new Error(`Cannot accept handoff in state '${handoff.status}'. Must be PENDING.`);
    }

    // Role & Department boundary check
    if (user.role !== UserRole.SYSTEM_ADMIN && user.department !== handoff.toDepartment) {
      throw new Error(
        `Unauthorized: Only members of ${handoff.toDepartment} can accept this handoff. User belongs to ${user.department}`
      );
    }

    handoff.status = HandoffStatus.ACCEPTED;
    handoff.acceptedAt = new Date().toISOString();
    if (acceptanceNotes) {
      handoff.notes = handoff.notes ? `${handoff.notes} | Accepted note: ${acceptanceNotes}` : acceptanceNotes;
    }
    if (!handoff.assignedTo) {
      handoff.assignedTo = user.userId;
    }

    await this.db.updateHandoff(handoff);

    if (this.notifications) {
      const caseRecord = await this.db.findCaseById(handoff.caseId);
      if (caseRecord) {
        await this.notifications.notifyHandoffAccepted(handoff, caseRecord);
      }
    }

    return handoff;
  }

  /**
   * Rejects an active pending handoff.
   * Requires a non-empty rejectionReason.
   */
  public async rejectHandoff(
    handoffId: string,
    user: UserContext,
    rejectionReason: string
  ): Promise<HandoffRecord> {
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error('A specific rejection reason is mandatory when rejecting a handoff');
    }

    const handoff = await this.db.getHandoffById(handoffId);
    if (!handoff) {
      throw new Error(`Handoff with ID ${handoffId} not found`);
    }

    if (handoff.status !== HandoffStatus.PENDING) {
      throw new Error(`Cannot reject handoff in state '${handoff.status}'. Must be PENDING.`);
    }

    // Role & Department boundary check
    if (user.role !== UserRole.SYSTEM_ADMIN && user.department !== handoff.toDepartment) {
      throw new Error(
        `Unauthorized: Only members of ${handoff.toDepartment} can reject this handoff. User belongs to ${user.department}`
      );
    }

    handoff.status = HandoffStatus.REJECTED;
    handoff.rejectedAt = new Date().toISOString();
    handoff.rejectionReason = rejectionReason;

    await this.db.updateHandoff(handoff);

    if (this.notifications) {
      const caseRecord = await this.db.findCaseById(handoff.caseId);
      if (caseRecord) {
        await this.notifications.notifyHandoffRejected(handoff, caseRecord, rejectionReason);
      }
    }

    return handoff;
  }

  /**
   * Marks a handoff as completed upon completion of the stage
   */
  public async completeHandoff(handoffId: string): Promise<HandoffRecord> {
    const handoff = await this.db.getHandoffById(handoffId);
    if (!handoff) {
      throw new Error(`Handoff with ID ${handoffId} not found`);
    }

    handoff.status = HandoffStatus.COMPLETED;
    handoff.completedAt = new Date().toISOString();
    await this.db.updateHandoff(handoff);
    return handoff;
  }
}
