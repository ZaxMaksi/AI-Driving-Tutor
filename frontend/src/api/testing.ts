import { apiClient } from './client';
import {
  StartSessionPayload,
  SubmitAnswerPayload,
  TestSessionDetail,
  TestSessionListItem,
  UserAnswerItem,
} from '../types/testing';

export const testingApi = {
  async startSession(payload: StartSessionPayload): Promise<TestSessionDetail> {
    const response = await apiClient.post<TestSessionDetail>('/testing/start/', payload);
    return response.data;
  },

  async getSessionsList(): Promise<TestSessionListItem[]> {
    const response = await apiClient.get<TestSessionListItem[] | { results: TestSessionListItem[] }>(
      '/testing/sessions/'
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },

  async getSessionDetail(id: number): Promise<TestSessionDetail> {
    const response = await apiClient.get<TestSessionDetail>(`/testing/sessions/${id}/`);
    return response.data;
  },

  async submitAnswer(sessionId: number, payload: SubmitAnswerPayload): Promise<UserAnswerItem> {
    const response = await apiClient.post<UserAnswerItem>(
      `/testing/sessions/${sessionId}/answer/`,
      payload
    );
    return response.data;
  },

  async finishSession(sessionId: number): Promise<TestSessionDetail> {
    const response = await apiClient.post<TestSessionDetail>(
      `/testing/sessions/${sessionId}/finish/`
    );
    return response.data;
  },
};
