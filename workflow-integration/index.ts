/**
 * Workflow & Integration module entry point.
 * Exports core state engine, types, adapters, backend handlers, and frontend components.
 */

// Types & Contracts
export * from './types/workflow.types';
export * from './types/integration.types';

// Workflow Core Engine
export * from './workflow/engine/workflowEngine';
export * from './workflow/states/stateDefinitions';
export * from './workflow/transitions/transitionRules';
export * from './workflow/handoffs/handoffManager';
export * from './workflow/sla/slaTracker';
export * from './workflow/timeline/timelineAggregator';

// Integration Adapters
export * from './integrations/adapters/authAdapter';
export * from './integrations/adapters/caseAdapter';
export * from './integrations/adapters/auditAdapter';
export * from './integrations/adapters/notificationAdapter';
export * from './integrations/adapters/documentAdapter';
export * from './integrations/adapters/forensicMlAdapter';
export * from './integrations/database/memoryStore';

// Backend Services, Controllers, Middleware & Routes
export * from './backend/services/workflowService';
export * from './backend/controllers/workflowController';
export * from './backend/routes/workflowRoutes';
export * from './backend/middleware/workflowAuthMiddleware';
export * from './backend/validators/workflowValidators';
export * from './backend/app';

// Frontend Components & Hooks
export * from './frontend/index';

