/**
 * Notification service adapter.
 * Stores dispatched alerts in memory for local development and testing.
 * Connect to your WebSocket/push notification gateway in production.
 */

import { CaseRecord, Department, HandoffRecord } from '../../types/workflow.types';
import { INotificationService } from '../../types/integration.types';

export interface NotificationMessage {
  id: string;
  timestamp: string;
  recipientDepartment: Department;
  title: string;
  body: string;
  caseId: string;
  type: 'HANDOFF_ALERT' | 'SLA_ALERT' | 'STATUS_CHANGE';
}

export class NotificationAdapter implements INotificationService {
  private notifications: NotificationMessage[] = [];

  public async notifyHandoffCreated(handoff: HandoffRecord, caseData: CaseRecord): Promise<void> {
    this.notifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      recipientDepartment: handoff.toDepartment,
      title: `Action Required: Inbound Case Handoff from ${handoff.fromDepartment}`,
      body: `Case ${caseData.firNumber} (${caseData.title}) has been handed off to your department. Deadline: ${new Date(handoff.deadline).toLocaleString()}`,
      caseId: caseData.id,
      type: 'HANDOFF_ALERT',
    });
  }

  public async notifyHandoffAccepted(handoff: HandoffRecord, caseData: CaseRecord): Promise<void> {
    this.notifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      recipientDepartment: handoff.fromDepartment,
      title: `Handoff Acknowledged by ${handoff.toDepartment}`,
      body: `Custody for Case ${caseData.firNumber} has been accepted by ${handoff.toDepartment}.`,
      caseId: caseData.id,
      type: 'HANDOFF_ALERT',
    });
  }

  public async notifyHandoffRejected(
    handoff: HandoffRecord,
    caseData: CaseRecord,
    reason: string
  ): Promise<void> {
    this.notifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      recipientDepartment: handoff.fromDepartment,
      title: `URGENT: Handoff Returned / Rejected by ${handoff.toDepartment}`,
      body: `Case ${caseData.firNumber} was returned. Reason: ${reason}`,
      caseId: caseData.id,
      type: 'HANDOFF_ALERT',
    });
  }

  public async notifySlaWarning(
    caseId: string,
    department: Department,
    remainingHours: number
  ): Promise<void> {
    this.notifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      recipientDepartment: department,
      title: `SLA Warning: Approaching Deadline`,
      body: `Case ${caseId} in ${department} has only ${remainingHours} hours remaining before statutory breach.`,
      caseId,
      type: 'SLA_ALERT',
    });
  }

  public async notifyCaseClosed(caseData: CaseRecord): Promise<void> {
    this.notifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      recipientDepartment: Department.POLICE,
      title: `Case Disposed / Verdict Reached`,
      body: `Judicial proceedings completed for Case ${caseData.firNumber}. Case is archived as CLOSED.`,
      caseId: caseData.id,
      type: 'STATUS_CHANGE',
    });
  }

  public getRecentNotifications(): NotificationMessage[] {
    return [...this.notifications].reverse();
  }
}
