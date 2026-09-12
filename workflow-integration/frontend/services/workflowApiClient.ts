/**
 * HTTP REST client for the Workflow module.
 * Communicates with the backend /api/workflow endpoints.
 * All requests include Bearer token authentication based on the active user session.
 */

import {
  CaseRecord,
  Department,
  TimelineEntry,
  TransitionResult,
  UserContext,
  WorkflowState,
  WorkflowSummaryView,
} from '../../types/workflow.types';
import { SystemStatusData } from '../types/ui.types';

export class WorkflowApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/workflow') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private getHeaders(user?: UserContext): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (user?.userId) {
      headers['Authorization'] = `Bearer ${user.userId}`;
    }
    return headers;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => null);

      if (!response.ok || (data && data.success === false)) {
        const errorMsg = data?.error || `HTTP ${response.status} from ${url}`;
        throw new Error(errorMsg);
      }

      return data?.data !== undefined ? data.data : data;
    } catch (err: any) {
      // Return meaningful error with endpoint context
      throw new Error(err.message || `Failed to communicate with workflow API at ${url}`);
    }
  }

  public async getAvailableCases(user?: UserContext): Promise<CaseRecord[]> {
    return this.request<CaseRecord[]>('/cases', {
      method: 'GET',
      headers: this.getHeaders(user),
    });
  }

  public async getWorkflowDetails(
    caseId: string,
    user: UserContext
  ): Promise<WorkflowSummaryView> {
    return this.request<WorkflowSummaryView>(`/${encodeURIComponent(caseId)}`, {
      method: 'GET',
      headers: this.getHeaders(user),
    });
  }

  public async getTimeline(caseId: string, user?: UserContext): Promise<TimelineEntry[]> {
    return this.request<TimelineEntry[]>(`/${encodeURIComponent(caseId)}/timeline`, {
      method: 'GET',
      headers: this.getHeaders(user),
    });
  }

  public async initiateHandoff(
    caseId: string,
    toDepartment: Department,
    user: UserContext,
    reason: string,
    notes?: string,
    evidenceManifest: string[] = [],
    targetOfficerId?: string
  ): Promise<TransitionResult> {
    return this.request<TransitionResult>(`/${encodeURIComponent(caseId)}/handoff`, {
      method: 'POST',
      headers: this.getHeaders(user),
      body: JSON.stringify({
        targetDepartment: toDepartment,
        reason,
        notes,
        evidenceManifest,
        targetOfficerId,
      }),
    });
  }

  public async acceptHandoff(
    handoffId: string,
    user: UserContext,
    notes?: string
  ): Promise<TransitionResult> {
    return this.request<TransitionResult>(`/handoffs/${encodeURIComponent(handoffId)}/accept`, {
      method: 'POST',
      headers: this.getHeaders(user),
      body: JSON.stringify({ notes }),
    });
  }

  public async rejectHandoff(
    handoffId: string,
    user: UserContext,
    rejectionReason: string
  ): Promise<TransitionResult> {
    return this.request<TransitionResult>(`/handoffs/${encodeURIComponent(handoffId)}/reject`, {
      method: 'POST',
      headers: this.getHeaders(user),
      body: JSON.stringify({ rejectionReason }),
    });
  }

  public async assignOfficer(
    caseId: string,
    officerId: string,
    officerName: string,
    user: UserContext
  ): Promise<CaseRecord> {
    return this.request<CaseRecord>(`/${encodeURIComponent(caseId)}/assign`, {
      method: 'POST',
      headers: this.getHeaders(user),
      body: JSON.stringify({ officerId, officerName }),
    });
  }

  public async completeCase(
    caseId: string,
    verdictSummary: string,
    user: UserContext
  ): Promise<TransitionResult> {
    return this.request<TransitionResult>(`/${encodeURIComponent(caseId)}/complete`, {
      method: 'POST',
      headers: this.getHeaders(user),
      body: JSON.stringify({ verdictSummary }),
    });
  }

  public async directTransition(
    caseId: string,
    nextState: WorkflowState,
    targetDepartment: Department,
    user: UserContext,
    reason?: string,
    notes?: string
  ): Promise<TransitionResult> {
    return this.request<TransitionResult>(`/${encodeURIComponent(caseId)}/transition`, {
      method: 'POST',
      headers: this.getHeaders(user),
      body: JSON.stringify({ nextState, targetDepartment, reason, notes }),
    });
  }

  public async createNewCase(
    firNumber: string,
    title: string,
    incidentType: string,
    creator: UserContext
  ): Promise<CaseRecord> {
    return this.request<CaseRecord>('/cases', {
      method: 'POST',
      headers: this.getHeaders(creator),
      body: JSON.stringify({ firNumber, title, incidentType }),
    });
  }

  public async getSystemStatus(user?: UserContext): Promise<SystemStatusData> {
    return this.request<SystemStatusData>('/system/status', {
      method: 'GET',
      headers: this.getHeaders(user),
    });
  }
}

export const globalWorkflowClient = new WorkflowApiClient();
