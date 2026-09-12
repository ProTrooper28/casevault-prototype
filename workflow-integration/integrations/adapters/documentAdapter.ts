/**
 * Document adapter.
 * Validates document prerequisites before stage transitions.
 * Connect to your OCR / document management service in production.
 */

import { WorkflowState } from '../../types/workflow.types';
import { IDocumentService } from '../../types/integration.types';

export class DocumentAdapter implements IDocumentService {
  /**
   * Verifies required documents for a stage.
   */
  public async verifyRequiredDocuments(
    caseId: string,
    stage: WorkflowState
  ): Promise<{ valid: boolean; missingDocs: string[] }> {
    // Reference check - returns valid unless integrated with document service
    return {
      valid: true,
      missingDocs: [],
    };
  }

  public async sealEvidenceManifest(caseId: string, manifestIds: string[]): Promise<string> {
    return `SEAL-${caseId}-${manifestIds.length}-${Date.now().toString(36)}`;
  }
}
