/**
 * In-memory storage adapter for local development, testing, and demo.
 * Implements IDatabaseAdapter. Replace with a database adapter (e.g. PostgreSQL) in production.
 */

import {
  CaseRecord,
  Department,
  HandoffRecord,
  HandoffStatus,
  WorkflowEvent,
  WorkflowEventType,
  WorkflowState,
} from '../../types/workflow.types';
import { IDatabaseAdapter } from '../../types/integration.types';

export class MemoryStore implements IDatabaseAdapter {
  private cases: Map<string, CaseRecord> = new Map();
  private handoffs: Map<string, HandoffRecord> = new Map();
  private events: WorkflowEvent[] = [];

  constructor(seedSampleData = true) {
    if (seedSampleData) {
      this.seedInitialData();
    }
  }

  public async findCaseById(caseId: string): Promise<CaseRecord | null> {
    return this.cases.get(caseId) || null;
  }

  public async saveCase(caseData: CaseRecord): Promise<void> {
    this.cases.set(caseData.id, { ...caseData, updatedAt: new Date().toISOString() });
  }

  public async createHandoff(handoff: HandoffRecord): Promise<void> {
    this.handoffs.set(handoff.id, { ...handoff });
  }

  public async getHandoffById(handoffId: string): Promise<HandoffRecord | null> {
    return this.handoffs.get(handoffId) || null;
  }

  public async getActiveHandoffForCase(caseId: string): Promise<HandoffRecord | null> {
    const list = Array.from(this.handoffs.values()).filter(
      (h) => h.caseId === caseId && h.status === HandoffStatus.PENDING
    );
    return list.length > 0 ? list[0] : null;
  }

  public async updateHandoff(handoff: HandoffRecord): Promise<void> {
    this.handoffs.set(handoff.id, { ...handoff });
  }

  public async listHandoffsByCase(caseId: string): Promise<HandoffRecord[]> {
    return Array.from(this.handoffs.values()).filter((h) => h.caseId === caseId);
  }

  public async saveWorkflowEvent(event: WorkflowEvent): Promise<void> {
    this.events.push({ ...event });
  }

  public async getWorkflowEventsByCase(caseId: string): Promise<WorkflowEvent[]> {
    return this.events
      .filter((e) => e.caseId === caseId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Helper to retrieve all cases for UI browsing
   */
  public async getAllCases(): Promise<CaseRecord[]> {
    return Array.from(this.cases.values());
  }

  /**
   * Seeds demo cases across SIH lifecycle stages for testing and UI demonstration
   */
  private seedInitialData(): void {
    const now = new Date();
    const case1Id = 'CASE-2026-0814';
    const case2Id = 'CASE-2026-0922';
    const case3Id = 'CASE-2026-1043';

    // Case 1: In Police Investigation
    const case1: CaseRecord = {
      id: case1Id,
      firNumber: 'FIR/DL/2026/00189',
      title: 'State vs. Unknown (Cyber Financial Fraud & Exfiltration)',
      incidentType: 'IT Act Sec 66D & BNS Sec 318',
      state: WorkflowState.POLICE_INVESTIGATION,
      currentDepartment: Department.POLICE,
      assignedOfficerId: 'pol-01',
      assignedOfficerName: 'Inspector Rajesh Sharma',
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      evidences: [
        {
          id: 'ev-01',
          name: 'Encrypted Hard Disk Image (EnCase format)',
          type: 'DIGITAL',
          collectedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
          collectedBy: 'Inspector Rajesh Sharma',
          secureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          custodyHolder: Department.POLICE,
        },
      ],
    };
    this.cases.set(case1.id, case1);

    this.events.push({
      id: 'evt-seed-1',
      caseId: case1Id,
      type: WorkflowEventType.CASE_CREATED,
      previousState: WorkflowState.DRAFT,
      newState: WorkflowState.POLICE_INVESTIGATION,
      fromDepartment: Department.POLICE,
      toDepartment: Department.POLICE,
      performedBy: 'pol-01',
      performedByName: 'Inspector Rajesh Sharma',
      role: 'POLICE_STATION_HEAD' as any,
      timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      comment: 'FIR registered and investigating officer designated.',
      auditHash: 'hash-initial-fir-001',
    });

    // Case 2: In Handoff to Forensic Pending
    const case2: CaseRecord = {
      id: case2Id,
      firNumber: 'FIR/MH/2026/04812',
      title: 'State vs. Vikram Malhotra (Narcotics Seizure & Ballistics)',
      incidentType: 'NDPS Act Sec 20 & Arms Act',
      state: WorkflowState.HANDOFF_TO_FORENSIC_PENDING,
      currentDepartment: Department.FORENSIC,
      assignedOfficerId: 'pol-02',
      assignedOfficerName: 'Sub-Inspector Anjali Verma',
      createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      evidences: [
        {
          id: 'ev-02',
          name: 'Recovered 9mm Cartridge Casings & Powder Residue',
          type: 'BALLISTICS',
          collectedAt: new Date(now.getTime() - 60 * 60 * 60 * 1000).toISOString(),
          collectedBy: 'Sub-Inspector Anjali Verma',
          secureHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
          custodyHolder: Department.FORENSIC,
        },
      ],
    };
    this.cases.set(case2.id, case2);

    const handoff2: HandoffRecord = {
      id: 'hnd-seed-002',
      caseId: case2Id,
      fromDepartment: Department.POLICE,
      toDepartment: Department.FORENSIC,
      initiatedBy: 'pol-02',
      initiatedByName: 'Sub-Inspector Anjali Verma',
      status: HandoffStatus.PENDING,
      reason: 'Physical ballistic samples forwarded for rifling match and chamber pressure testing.',
      notes: 'Chain of custody sealed container #FSL-9081',
      evidenceManifest: ['ev-02'],
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString(),
    };
    this.handoffs.set(handoff2.id, handoff2);

    this.events.push({
      id: 'evt-seed-2a',
      caseId: case2Id,
      type: WorkflowEventType.CASE_CREATED,
      newState: WorkflowState.POLICE_INVESTIGATION,
      performedBy: 'pol-02',
      performedByName: 'Sub-Inspector Anjali Verma',
      role: 'POLICE_OFFICER' as any,
      timestamp: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      comment: 'FIR registered.',
      auditHash: 'hash-initial-fir-002',
    });

    this.events.push({
      id: 'evt-seed-2b',
      caseId: case2Id,
      type: WorkflowEventType.HANDOFF_INITIATED,
      previousState: WorkflowState.POLICE_INVESTIGATION,
      newState: WorkflowState.HANDOFF_TO_FORENSIC_PENDING,
      fromDepartment: Department.POLICE,
      toDepartment: Department.FORENSIC,
      performedBy: 'pol-02',
      performedByName: 'Sub-Inspector Anjali Verma',
      role: 'POLICE_OFFICER' as any,
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      comment: 'Forwarded evidence to CFSL Forensic Directorate.',
      auditHash: 'hash-handoff-fsl-002',
    });

    // Case 3: In Prosecution Review
    const case3: CaseRecord = {
      id: case3Id,
      firNumber: 'FIR/KA/2026/00911',
      title: 'State vs. Ramesh Patel & Ors. (Commercial Bribery & Forgery)',
      incidentType: 'BNS Sec 316 (Criminal Breach of Trust) & Sec 336 (Forgery)',
      state: WorkflowState.PROSECUTION_REVIEW,
      currentDepartment: Department.PROSECUTOR,
      assignedOfficerId: 'pros-01',
      assignedOfficerName: 'Adv. S. K. Narayanan (Public Prosecutor)',
      createdAt: new Date(now.getTime() - 200 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      evidences: [],
    };
    this.cases.set(case3.id, case3);
  }
}
