import express, { Express, Router } from 'express';
import { WorkflowEngine } from '../workflow/engine/workflowEngine';
import { MemoryStore } from '../integrations/database/memoryStore';
import { CaseAdapter } from '../integrations/adapters/caseAdapter';
import { AuthAdapter } from '../integrations/adapters/authAdapter';
import { AuditAdapter } from '../integrations/adapters/auditAdapter';
import { NotificationAdapter } from '../integrations/adapters/notificationAdapter';
import { DocumentAdapter } from '../integrations/adapters/documentAdapter';
import { ForensicMlAdapter } from '../integrations/adapters/forensicMlAdapter';
import { WorkflowService } from './services/workflowService';
import { WorkflowController } from './controllers/workflowController';
import { WorkflowAuthMiddleware } from './middleware/workflowAuthMiddleware';
import { createWorkflowRouter } from './routes/workflowRoutes';

export interface WorkflowBackendInstances {
  router: Router;
  app: Express;
  db: MemoryStore;
  auth: AuthAdapter;
  cases: CaseAdapter;
  audit: AuditAdapter;
  notifications: NotificationAdapter;
  service: WorkflowService;
  controller: WorkflowController;
}

let sharedBackend: WorkflowBackendInstances | null = null;

export function getSharedWorkflowBackend(): WorkflowBackendInstances {
  if (!sharedBackend) {
    sharedBackend = createWorkflowBackend();
  }
  return sharedBackend;
}

export function createWorkflowBackend(): WorkflowBackendInstances {
  const db = new MemoryStore(true);
  const auth = new AuthAdapter();
  const cases = new CaseAdapter(db);
  const audit = new AuditAdapter();
  const notifications = new NotificationAdapter();
  const documents = new DocumentAdapter();
  const forensicMl = new ForensicMlAdapter();

  const engine = new WorkflowEngine({
    db,
    caseService: cases,
    auditService: audit,
    notificationService: notifications,
    documentService: documents,
    forensicMlService: forensicMl,
  });

  const service = new WorkflowService(engine, db, cases, auth, notifications);
  const controller = new WorkflowController(service);
  const authMiddleware = new WorkflowAuthMiddleware(auth);
  const router = createWorkflowRouter(controller, authMiddleware);

  const app = express();
  app.use(express.json());
  app.use('/api/workflow', router);

  return {
    router,
    app,
    db,
    auth,
    cases,
    audit,
    notifications,
    service,
    controller,
  };
}
