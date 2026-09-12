/**
 * Express router for workflow routes.
 */

import { Router } from 'express';
import { WorkflowController } from '../controllers/workflowController';
import { WorkflowAuthMiddleware } from '../middleware/workflowAuthMiddleware';
import { UserRole } from '../../types/workflow.types';

export function createWorkflowRouter(
  controller: WorkflowController,
  authMiddleware: WorkflowAuthMiddleware
): Router {
  const router = Router();

  // All workflow routes require authentication
  router.use(authMiddleware.authenticate);

  // 1. Collection & System endpoints
  router.get('/cases', controller.getCases);
  router.post('/cases', controller.createCase);
  router.get('/system/status', controller.getSystemStatus);

  // 2. Individual Case Query endpoints
  router.get('/:caseId', controller.getCaseWorkflow);
  router.get('/:caseId/timeline', controller.getTimeline);
  router.get('/:caseId/next-actions', controller.getNextActions);

  // 3. Assignment
  router.post(
    '/:caseId/assign',
    authMiddleware.requireRoles([
      UserRole.POLICE_STATION_HEAD,
      UserRole.FORENSIC_DIRECTOR,
      UserRole.CHIEF_PROSECUTOR,
      UserRole.JUDGE,
      UserRole.SYSTEM_ADMIN,
    ]),
    controller.assignOfficer
  );

  // 4. Departmental Handoffs & State Transitions
  router.post('/:caseId/handoff', controller.initiateHandoff);
  router.post('/handoffs/:id/accept', controller.acceptHandoff);
  router.post('/handoffs/:id/reject', controller.rejectHandoff);
  router.post('/:caseId/transition', controller.directTransition);

  // 5. Case Closure
  router.post(
    '/:caseId/complete',
    authMiddleware.requireRoles([UserRole.JUDGE, UserRole.SYSTEM_ADMIN]),
    controller.completeCase
  );

  return router;
}
