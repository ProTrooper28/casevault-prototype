/**
 * React hook for managing workflow state, cases, and actions.
 * Interacts with the backend via WorkflowApiClient.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  CaseRecord,
  Department,
  UserContext,
  WorkflowState,
  WorkflowSummaryView,
} from '../../types/workflow.types';
import { DEMO_PERSONAS } from '../types/ui.types';
import { globalWorkflowClient } from '../services/workflowApiClient';

export function useWorkflow(initialCaseId?: string, initialUser?: UserContext) {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId || '');
  const [currentUser, setCurrentUser] = useState<UserContext>(initialUser || DEMO_PERSONAS[0]);
  const [details, setDetails] = useState<WorkflowSummaryView | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refreshCases = useCallback(async () => {
    try {
      const list = await globalWorkflowClient.getAvailableCases(currentUser);
      setCases(list);
      if (!selectedCaseId && list.length > 0) {
        setSelectedCaseId(list[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cases');
    }
  }, [selectedCaseId, currentUser]);

  const refreshDetails = useCallback(async () => {
    if (!selectedCaseId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await globalWorkflowClient.getWorkflowDetails(selectedCaseId, currentUser);
      setDetails(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load case workflow');
    } finally {
      setLoading(false);
    }
  }, [selectedCaseId, currentUser]);

  useEffect(() => {
    refreshCases();
  }, [refreshCases]);

  useEffect(() => {
    refreshDetails();
  }, [refreshDetails]);

  const initiateHandoff = async (
    toDepartment: Department,
    reason: string,
    notes?: string,
    evidenceManifest: string[] = [],
    targetOfficerId?: string
  ) => {
    try {
      setError(null);
      const res = await globalWorkflowClient.initiateHandoff(
        selectedCaseId,
        toDepartment,
        currentUser,
        reason,
        notes,
        evidenceManifest,
        targetOfficerId
      );
      setFeedback(`Handoff to ${toDepartment} initiated successfully.`);
      await refreshDetails();
      await refreshCases();
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const acceptHandoff = async (handoffId: string, notes?: string) => {
    try {
      setError(null);
      const res = await globalWorkflowClient.acceptHandoff(handoffId, currentUser, notes);
      setFeedback('Handoff custody successfully accepted.');
      await refreshDetails();
      await refreshCases();
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const rejectHandoff = async (handoffId: string, rejectionReason: string) => {
    try {
      setError(null);
      const res = await globalWorkflowClient.rejectHandoff(handoffId, currentUser, rejectionReason);
      setFeedback('Handoff returned to previous department with defect reason.');
      await refreshDetails();
      await refreshCases();
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const assignOfficer = async (officerId: string, officerName: string) => {
    try {
      setError(null);
      const res = await globalWorkflowClient.assignOfficer(
        selectedCaseId,
        officerId,
        officerName,
        currentUser
      );
      setFeedback(`Case assigned to ${officerName}.`);
      await refreshDetails();
      await refreshCases();
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const completeCase = async (verdictSummary: string) => {
    try {
      setError(null);
      const res = await globalWorkflowClient.completeCase(selectedCaseId, verdictSummary, currentUser);
      setFeedback('Case finalized and closed with judicial verdict.');
      await refreshDetails();
      await refreshCases();
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const directTransition = async (
    nextState: WorkflowState,
    targetDepartment: Department,
    reason?: string,
    notes?: string
  ) => {
    try {
      setError(null);
      const res = await globalWorkflowClient.directTransition(
        selectedCaseId,
        nextState,
        targetDepartment,
        currentUser,
        reason,
        notes
      );
      setFeedback(`Case state transitioned to ${nextState}.`);
      await refreshDetails();
      await refreshCases();
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const createCase = async (firNumber: string, title: string, incidentType: string) => {
    try {
      setError(null);
      const newCase = await globalWorkflowClient.createNewCase(
        firNumber,
        title,
        incidentType,
        currentUser
      );
      setFeedback(`New case ${newCase.firNumber} created.`);
      await refreshCases();
      setSelectedCaseId(newCase.id);
      return newCase;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    cases,
    selectedCaseId,
    setSelectedCaseId,
    currentUser,
    setCurrentUser,
    roster: DEMO_PERSONAS,
    details,
    loading,
    error,
    feedback,
    clearFeedback: () => setFeedback(null),
    clearError: () => setError(null),
    refresh: refreshDetails,
    initiateHandoff,
    acceptHandoff,
    rejectHandoff,
    assignOfficer,
    completeCase,
    directTransition,
    createCase,
  };
}
