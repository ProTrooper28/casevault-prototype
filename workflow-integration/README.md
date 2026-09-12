# Workflow & Integration

## Purpose

The Workflow & Integration module manages case lifecycle states, inter-departmental handoffs, SLA tracking, and audit logging for a criminal justice case management system. It provides the state machine and integration interfaces connecting police, forensic lab, prosecution, and court stages.

## Workflow

A case progresses through the following sequential stages:

```
[ POLICE ] ──► [ FORENSIC ] ──► [ PROSECUTION ] ──► [ COURT ] ──► [ CLOSED ]
  (FIR)          (FSL Lab)         (Scrutiny)         (Trial)       (Verdict)
     ▲               │                  │                │
     │               ▼                  ▼                │
     └─────── Defect Rejection ◄── Remand Memo ──────────┘
```

1. **Police Investigation (`POLICE_INVESTIGATION`)**: Initial FIR registration, investigation, and evidence collection.
2. **Handoff to Forensic (`HANDOFF_TO_FORENSIC_PENDING`)**: Evidence dispatched to the forensic lab; pending acceptance.
3. **Forensic Analysis (`FORENSIC_ANALYSIS`)**: Laboratory analysis, exhibit examination, and report generation.
4. **Handoff to Prosecution (`HANDOFF_TO_PROSECUTOR_PENDING`)**: Investigation and forensic reports submitted for legal review.
5. **Prosecution Review (`PROSECUTION_REVIEW`)**: Chargesheet scrutiny, prima facie assessment, and sanction review.
6. **Handoff to Court (`HANDOFF_TO_COURT_PENDING`)**: Chargesheet submitted to court registry; pending cognizance.
7. **Court Trial (`COURT_TRIAL`)**: Judicial proceedings, witness examination, and arguments.
8. **Case Closed (`CASE_CLOSED`)**: Verdict pronounced (conviction or acquittal); record archived.

If an exhibit seal is broken or a chargesheet is defective, the receiving department can reject the handoff with a reason, returning custody to the sending department.

## Structure

```
workflow-integration/
├── index.ts                # Public module exports
├── types/
│   ├── workflow.types.ts   # Core enums, states, handoffs, SLAs
│   └── integration.types.ts# Adapter interface contracts
├── workflow/
│   ├── engine/             # State machine and transition engine
│   ├── states/             # Stage registry, department mapping, SLA limits
│   ├── transitions/        # Transition matrix and role permissions
│   ├── handoffs/           # Inter-departmental transfer protocol
│   ├── sla/                # Deadline calculation and breach tracking
│   └── timeline/           # Unified chronological audit trail
├── integrations/
│   ├── adapters/           # Reference adapter implementations
│   └── database/
│       ├── memoryStore.ts  # In-memory store for dev/testing
│       └── schema.sql      # PostgreSQL / relational DDL
├── backend/
│   ├── app.ts              # Backend initialization factory
│   ├── controllers/        # Express request handlers
│   ├── routes/             # Express router definitions
│   ├── middleware/         # Auth and role check middleware
│   ├── validators/         # Input validation and sanitization
│   └── services/           # High-level workflow orchestration service
├── frontend/
│   ├── components/         # React UI components (pipeline, timeline, handoff modal)
│   ├── hooks/              # useWorkflow React hook
│   ├── services/           # HTTP REST API client (communicates with /api/workflow)
│   └── types/              # UI-specific presentation types and demo personas
└── tests/
    └── workflow.test.ts    # Test suite verifying transitions, handoffs, and auth
```

## Main Components

- **WorkflowEngine**: Orchestrates transitions by verifying case status, validating transition rules, checking user role permissions, confirming departmental jurisdiction, logging audit records, and updating state.
- **TransitionRules**: Defines the valid source-to-target state matrix and the specific user roles authorized for each transition.
- **HandoffManager**: Manages cross-department custody transfers. Ensures only one pending handoff exists per case, enforces that only the receiving department can accept or reject, and requires a reason for rejections.
- **SlaTracker**: Computes stage elapsed time against configured statutory limits, classifying health as `ON_TIME`, `WARNING`, or `OVERDUE`.
- **TimelineAggregator**: Combines workflow transition events and handoff records into a unified chronological log with SHA-256 audit hashes.
- **Adapters (`integrations/adapters/`)**: Reference implementations of the integration interfaces (`IAuthService`, `ICaseService`, `IAuditService`, `INotificationService`, `IDocumentService`, `IForensicMlService`).
- **API Layer (`backend/`)**: Express controllers, middleware, validators, and routes exposing the `/api/workflow` REST endpoints.
- **Frontend Layer (`frontend/`)**: React components that interact with the backend via `WorkflowApiClient` using standard HTTP fetch requests.

## Integration

### Backend Setup (Express)

You can mount the workflow module into an existing Express application using the factory or by instantiating individual layers:

```typescript
import express from 'express';
import { getSharedWorkflowBackend } from './workflow-integration';

const app = express();
app.use(express.json());

// Mount the workflow backend routes
const { app: workflowBackend } = getSharedWorkflowBackend();
app.use(workflowBackend);
```

Or for custom wiring with production adapters:

```typescript
import express from 'express';
import {
  createWorkflowRouter,
  WorkflowController,
  WorkflowService,
  WorkflowEngine,
  WorkflowAuthMiddleware,
  CaseAdapter,
  AuthAdapter,
  AuditAdapter,
  NotificationAdapter,
} from './workflow-integration';

const app = express();
app.use(express.json());

// In production, provide your database adapter and production auth service
const db = new YourProductionDatabaseAdapter();
const authAdapter = new YourProductionAuthAdapter();
const caseAdapter = new CaseAdapter(db);
const auditAdapter = new AuditAdapter();
const notifAdapter = new NotificationAdapter();

const engine = new WorkflowEngine({
  db,
  caseService: caseAdapter,
  auditService: auditAdapter,
  notificationService: notifAdapter,
});

const service = new WorkflowService(engine, db, caseAdapter, authAdapter, notifAdapter);
const controller = new WorkflowController(service);
const authMiddleware = new WorkflowAuthMiddleware(authAdapter);

app.use('/api/workflow', createWorkflowRouter(controller, authMiddleware));
```

### Frontend Usage (React)

The frontend communicates with the backend solely through HTTP (`/api/workflow`). It does not instantiate backend engines or adapters in the browser.

Use individual components with the `useWorkflow` hook:

```tsx
import { StageProgressBar, SlaBadge, TimelineView, useWorkflow } from './workflow-integration/frontend';

export function CaseWorkflowView() {
  const { details, loading, initiateHandoff } = useWorkflow();

  if (loading || !details) return <div>Loading...</div>;

  return (
    <div>
      <StageProgressBar
        currentState={details.caseRecord.state}
        currentDepartment={details.caseRecord.currentDepartment}
      />
      <SlaBadge sla={details.slaStatus} />
      <TimelineView timeline={details.timeline} />
    </div>
  );
}
```

Or embed the complete dashboard:

```tsx
import { WorkflowApp } from './workflow-integration/frontend';

export default function App() {
  return <WorkflowApp />;
}
```

## Local Development & Testing

Run the automated test suite:

```bash
npx tsx workflow-integration/tests/workflow.test.ts
```

Check module compilation and linting:

```bash
npm run build
npm run lint
```

## Production Integration

To connect this module to production systems, replace the reference adapters in `integrations/adapters/` with implementations that communicate with your team's services:

| Interface | Production Replacement | Description |
| :--- | :--- | :--- |
| `IDatabaseAdapter` | PostgreSQL / Cloud SQL | Replace `MemoryStore` with queries targeting `integrations/database/schema.sql`. |
| `IAuthService` | Auth Service / JWT | Verify tokens and resolve user roles from your application's auth provider. |
| `ICaseService` | Case Repository / ORM | Read and write case status in your team's primary case database. |
| `IDocumentService` | Document / OCR Service | Verify filings (FIR, seizure memo, chargesheet) before stage transitions. |
| `IForensicMlService` | Forensic / ML API | Verify lab report completion and model confidence scores. |
| `INotificationService`| Alerting / Push Service | Dispatch real notifications via email, SMS, or WebSockets. |
| `IAuditService` | Audit Database | Mirror audit events and SHA-256 hashes to your tamper-evident log store. |

## Current Limitations & Reference Behavior

- **In-Memory Storage**: `MemoryStore` stores records in JavaScript `Map` collections. Data resets on server restart. In production, provide an `IDatabaseAdapter` implementation targeting a persistent database.
- **Fail-Closed Authentication**: `AuthAdapter` strictly fails closed if authorization tokens are missing or unresolvable. Pre-seeded credentials are provided for testing (`Bearer pol-01`, etc.). In production, connect this to your JWT/OAuth verification service.
- **Demo Personas**: The persona switcher in `WorkflowApp` is segregated for development testing and role simulation across police, forensic, prosecution, and judicial roles.
- **External Integration Stubs**: Document verification, ML scoring, and push notifications are reference stubs that return successful validation unless replaced with your team's microservices.
