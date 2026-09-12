/**
 * Case service adapter.
 * Bridges workflow updates (state, department, officer assignment) to the case repository.
 */

import { CaseRecord, Department, UserContext, WorkflowState } from '../../types/workflow.types';
import { ICaseService, IDatabaseAdapter } from '../../types/integration.types';

export class CaseAdapter implements ICaseService {
  constructor(private db: IDatabaseAdapter) {}

  public async getCaseById(caseId: string): Promise<CaseRecord | null> {
    return this.db.findCaseById(caseId);
  }

  public async listCases(): Promise<CaseRecord[]> {
    if (this.db.getAllCases) {
      return this.db.getAllCases();
    }
    return [];
  }

  public async updateCaseState(
    caseId: string,
    newState: WorkflowState,
    currentDepartment: Department,
    assignedOfficerId?: string,
    assignedOfficerName?: string
  ): Promise<CaseRecord> {
    const existingCase = await this.db.findCaseById(caseId);
    if (!existingCase) {
      throw new Error(`Case with ID ${caseId} does not exist`);
    }

    existingCase.state = newState;
    existingCase.currentDepartment = currentDepartment;
    if (assignedOfficerId) {
      existingCase.assignedOfficerId = assignedOfficerId;
    }
    if (assignedOfficerName) {
      existingCase.assignedOfficerName = assignedOfficerName;
    }
    if (newState === WorkflowState.CASE_CLOSED) {
      existingCase.closedAt = new Date().toISOString();
    }
    existingCase.updatedAt = new Date().toISOString();

    await this.db.saveCase(existingCase);
    return existingCase;
  }

  public async assignOfficer(
    caseId: string,
    officerId: string,
    officerName: string
  ): Promise<CaseRecord> {
    const existingCase = await this.db.findCaseById(caseId);
    if (!existingCase) {
      throw new Error(`Case with ID ${caseId} does not exist`);
    }

    existingCase.assignedOfficerId = officerId;
    existingCase.assignedOfficerName = officerName;
    existingCase.updatedAt = new Date().toISOString();

    await this.db.saveCase(existingCase);
    return existingCase;
  }

  public async createCase(
    firNumber: string,
    title: string,
    incidentType: string,
    creator: UserContext
  ): Promise<CaseRecord> {
    const newCase: CaseRecord = {
      id: `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      firNumber,
      title,
      incidentType,
      state: WorkflowState.POLICE_INVESTIGATION,
      currentDepartment: Department.POLICE,
      assignedOfficerId: creator.userId,
      assignedOfficerName: creator.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidences: [],
    };

    await this.db.saveCase(newCase);
    return newCase;
  }
}
