/**
 * Input validators for workflow endpoints.
 */

import { Department, WorkflowState } from '../../types/workflow.types';

export class WorkflowValidators {
  public static validateCaseId(caseId: string): string {
    if (!caseId || typeof caseId !== 'string' || caseId.trim().length === 0) {
      throw new Error('Case ID is required and must be a non-empty string');
    }
    return caseId.trim();
  }

  public static validateHandoffPayload(body: any): {
    toDepartment: Department;
    reason: string;
    notes?: string;
    evidenceManifest?: string[];
    targetOfficerId?: string;
  } {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }

    if (!body.toDepartment || !Object.values(Department).includes(body.toDepartment)) {
      throw new Error(`Valid 'toDepartment' is required (${Object.values(Department).join(', ')})`);
    }

    if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length < 5) {
      throw new Error("A clear 'reason' (minimum 5 characters) is required for departmental handoff");
    }

    return {
      toDepartment: body.toDepartment,
      reason: body.reason.trim(),
      notes: body.notes ? String(body.notes).trim() : undefined,
      evidenceManifest: Array.isArray(body.evidenceManifest) ? body.evidenceManifest : [],
      targetOfficerId: body.targetOfficerId ? String(body.targetOfficerId).trim() : undefined,
    };
  }

  public static validateAcceptPayload(body: any): { notes?: string } {
    return {
      notes: body?.notes ? String(body.notes).trim() : undefined,
    };
  }

  public static validateRejectPayload(body: any): { rejectionReason: string } {
    if (!body || !body.rejectionReason || typeof body.rejectionReason !== 'string' || body.rejectionReason.trim().length < 5) {
      throw new Error("A specific 'rejectionReason' (minimum 5 characters) is mandatory to return a case");
    }
    return {
      rejectionReason: body.rejectionReason.trim(),
    };
  }

  public static validateTransitionPayload(body: any): {
    requestedNextState: WorkflowState;
    reason?: string;
    notes?: string;
  } {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }

    if (!body.requestedNextState || !Object.values(WorkflowState).includes(body.requestedNextState)) {
      throw new Error(`Valid 'requestedNextState' is required (${Object.values(WorkflowState).join(', ')})`);
    }

    return {
      requestedNextState: body.requestedNextState,
      reason: body.reason ? String(body.reason).trim() : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined,
    };
  }

  public static validateAssignPayload(body: any): {
    officerId: string;
    officerName: string;
  } {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }

    if (!body.officerId || typeof body.officerId !== 'string') {
      throw new Error("'officerId' is required");
    }

    if (!body.officerName || typeof body.officerName !== 'string') {
      throw new Error("'officerName' is required");
    }

    return {
      officerId: body.officerId.trim(),
      officerName: body.officerName.trim(),
    };
  }
}
