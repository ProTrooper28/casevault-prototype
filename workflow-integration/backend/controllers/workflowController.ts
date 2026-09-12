/**
 * Express controller for workflow API endpoints.
 */

import { Request, Response } from 'express';
import { WorkflowService } from '../services/workflowService';
import { WorkflowValidators } from '../validators/workflowValidators';

export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  /**
   * GET /workflow/:caseId
   */
  public getCaseWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const caseId = WorkflowValidators.validateCaseId(req.params.caseId);
      const user = req.userContext!;
      const result = await this.workflowService.getWorkflowDetails(caseId, user);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      this.handleError(res, err);
    }
  };

  /**
   * GET /workflow/:caseId/timeline
   */
  public getTimeline = async (req: Request, res: Response): Promise<void> => {
    try {
      const caseId = WorkflowValidators.validateCaseId(req.params.caseId);
      const result = await this.workflowService.getTimeline(caseId);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      this.handleError(res, err);
    }
  };

  /**
   * GET /workflow/:caseId/next-actions
   */
  public getNextActions = async (req: Request, res: Response): Promise<void> => {
    try {
      const caseId = WorkflowValidators.validateCaseId(req.params.caseId);
      const user = req.userContext!;
      const details = await this.workflowService.getWorkflowDetails(caseId, user);
      res.status(200).json({ success: true, data: details.nextActions });
    } catch (err: any) {
      this.handleError(res, err);
    }
  };

  /**
   * POST /workflow/:caseId/handoff
   */
  public initiateHandoff = async (req: Request, res: Response): Promise<void> => {
    try {
      const caseId = WorkflowValidators.validateCaseId(req.params.caseId);
      const user = req.userContext!;
      const payload = WorkflowValidators.validateHandoffPayload(req.body);

      const result = await this.workflowService.handoffCase(
        caseId,
        payload.toDepartment,
        user,
        payload.reason,
        payload.notes,
        payload.evidenceManifest,
        payload.targetOfficerId
      );

      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      this.handleError(res, err);
    }
  };

  /**
   * POST /workflow/handoffs/:id/accept
   */
  public acceptHandoff = async (req: Request, res: Response): Promise<void> => {
    try {
      const handoffId = req.params.id;
      if (!handoffId) throw new Error('Handoff ID is required');
      const user = req.userContext!;
      const payload = WorkflowValidators.validateAcceptPayload(req.body);

      const result = await this.workflowService.acceptHandoff(handoffId, user, payload.notes);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      this.handleError(res, err);
    }
  };

  /**
   * POST /workflow/handoffs/:id/reject
   */
  public rejectHandoff = async (req: Request, res: Response): Promise<void> => {
    try {
      const handoffId = req.params.id;
      if (!handoffId) throw new Error('Handoff ID is required');
      const user = req.userContext!;
      const payload = WorkflowValidators.validateRejectPayload(req.body);

      const result = await this.workflowService.rejectHandoff(
        handoffId,
        user,
        payload.rejectionReason
      );
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      this.handleError(res, err);
    }
  };

  /**
   * POST /workflow/:caseId/assign
   */
  public assignOfficer = async (req: Request, res: Response): Promise<void> => {
    try {
      const caseId = WorkflowValidators.validateCaseId(req.params.caseId);
      const user = req.userContext!;
      const payload = WorkflowValidators.validateAssignPayload(req.body);

      const result = await this.workflowService.assignOfficer(
        caseId,
        payload.officerId,
        payload.officerName,
        user
      );
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      this.handleError(res, err);
    }
  };

  /**
   * GET /workflow/cases
   */
  public getCases = async (_req: Request, res: Response): Promise<void> => {
    try {
      const cases = await this.workflowService.getAvailableCases();
      res.status(200).json({ success: true, data: cases });
    } catch (err: any) {
      this.handleError(res, err);
    }
  };

  /**
   * POST /workflow/cases
   */
  public createCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.userContext!;
      const { firNumber, title, incidentType } = req.body || {};
      if (!firNumber || !title || !incidentType) {
        throw new Error('FIR number, title, and incident type are required.');
      }
      const newCase = await this.workflowService.createCase(firNumber, title, incidentType, user);
      res.status(201).json({ success: true, data: newCase });
    } catch (err: any) {
      this.handleError(res, err);
    }
  };

  /**
   * POST /workflow/:caseId/transition
   */
  public directTransition = async (req: Request, res: Response): Promise<void> => {
    try {
      const caseId = WorkflowValidators.validateCaseId(req.params.caseId);
      const user = req.userContext!;
      const { nextState, targetDepartment, reason, notes } = req.body || {};
      if (!nextState || !targetDepartment) {
        throw new Error('nextState and targetDepartment are required.');
      }
      const result = await this.workflowService.transitionState(
        caseId,
        nextState,
        targetDepartment,
        user,
        reason,
        notes
      );
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      this.handleError(res, err);
    }
  };

  /**
   * GET /workflow/system/status
   */
  public getSystemStatus = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          status: 'HEALTHY',
          timestamp: new Date().toISOString(),
          adapters: [
            { name: 'Authentication & RBAC', interface: 'IAuthService', status: 'Connected' },
            { name: 'Case Management Service', interface: 'ICaseService', status: 'Connected' },
            { name: 'Database Storage Adapter', interface: 'IDatabaseAdapter', status: 'Connected' },
            { name: 'Document & Evidence Service', interface: 'IDocumentService', status: 'Connected' },
            { name: 'Forensic & ML Service', interface: 'IForensicMlService', status: 'Connected' },
            { name: 'Notification Dispatcher', interface: 'INotificationService', status: 'Active' },
            { name: 'Audit & Hash Chain Service', interface: 'IAuditService', status: 'Active' },
          ],
        },
      });
    } catch (err: any) {
      this.handleError(res, err);
    }
  };

  /**
   * POST /workflow/:caseId/complete
   */
  public completeCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const caseId = WorkflowValidators.validateCaseId(req.params.caseId);
      const user = req.userContext!;
      const verdict = req.body?.reason || req.body?.verdictSummary || 'Judicial order recorded';

      const result = await this.workflowService.completeCase(caseId, verdict, user);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      this.handleError(res, err);
    }
  };

  private handleError(res: Response, err: any): void {
    const msg = err.message || 'Workflow internal processing failure';
    let statusCode = 400;

    if (msg.includes('not found') || msg.includes('does not exist')) {
      statusCode = 404;
    } else if (msg.includes('Unauthorized') || msg.includes('Department mismatch') || msg.includes('lacks permission')) {
      statusCode = 403;
    } else if (msg.includes('Duplicate handoff')) {
      statusCode = 409;
    }

    res.status(statusCode).json({
      success: false,
      error: msg,
      timestamp: new Date().toISOString(),
    });
  }
}
