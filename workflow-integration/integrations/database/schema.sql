-- Workflow handoff records and audit event log schema for PostgreSQL / Cloud SQL.

-- 1. Workflow Handoffs Table
-- Stores formal custody handoff records across departmental boundaries
CREATE TABLE IF NOT EXISTS workflow_handoffs (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL,
    from_department VARCHAR(32) NOT NULL,
    to_department VARCHAR(32) NOT NULL,
    initiated_by VARCHAR(64) NOT NULL,
    initiated_by_name VARCHAR(128) NOT NULL,
    assigned_to VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    reason TEXT NOT NULL,
    notes TEXT,
    evidence_manifest JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    
    CONSTRAINT chk_handoff_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_departments CHECK (
        from_department IN ('POLICE', 'FORENSIC', 'PROSECUTOR', 'COURT', 'CLOSED') AND
        to_department IN ('POLICE', 'FORENSIC', 'PROSECUTOR', 'COURT', 'CLOSED')
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_handoffs_case_id ON workflow_handoffs(case_id);
CREATE INDEX IF NOT EXISTS idx_workflow_handoffs_status ON workflow_handoffs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_handoffs_to_dept ON workflow_handoffs(to_department, status);

-- 2. Workflow Audit & Events Table
-- Immutable event ledger recording state transitions and custody handoffs
CREATE TABLE IF NOT EXISTS workflow_events (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    previous_state VARCHAR(64),
    new_state VARCHAR(64),
    from_department VARCHAR(32),
    to_department VARCHAR(32),
    performed_by VARCHAR(64) NOT NULL,
    performed_by_name VARCHAR(128) NOT NULL,
    user_role VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    comment TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    audit_hash VARCHAR(128) NOT NULL
);

-- Indexes for chronological audit traversal
CREATE INDEX IF NOT EXISTS idx_workflow_events_case_timestamp ON workflow_events(case_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_events_audit_hash ON workflow_events(audit_hash);

-- Row-Level Security (RLS) Policy Example:
-- ALTER TABLE workflow_handoffs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY dept_handoff_isolation ON workflow_handoffs
--     FOR SELECT
--     USING (
--         to_department = current_setting('request.jwt.claim.department', true)
--         OR from_department = current_setting('request.jwt.claim.department', true)
--         OR current_setting('request.jwt.claim.role', true) = 'SYSTEM_ADMIN'
--     );
