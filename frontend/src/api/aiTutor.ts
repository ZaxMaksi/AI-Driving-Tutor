import { apiClient } from './client';
import {
  AIGenerationLogItem,
  ConsultationPayload,
  ConsultationResponse,
  ExplainMistakePayload,
  ExplainMistakeResponse,
  GeneratedQuestionResponse,
  GenerateQuestionPayload,
} from '../types/aiTutor';

export const aiTutorApi = {
  async generateQuestion(payload: GenerateQuestionPayload): Promise<GeneratedQuestionResponse> {
    const response = await apiClient.post<GeneratedQuestionResponse>(
      '/ai-tutor/generate-question/',
      payload
    );
    return response.data;
  },

  async explainMistake(payload: ExplainMistakePayload): Promise<ExplainMistakeResponse> {
    const response = await apiClient.post<ExplainMistakeResponse>(
      '/ai-tutor/explain-mistake/',
      payload
    );
    return response.data;
  },

  async consult(payload: ConsultationPayload): Promise<ConsultationResponse> {
    const response = await apiClient.post<ConsultationResponse>('/ai-tutor/consult/', payload);
    return response.data;
  },

  async getLogs(): Promise<AIGenerationLogItem[]> {
    const response = await apiClient.get<AIGenerationLogItem[] | { results: AIGenerationLogItem[] }>(
      '/ai-tutor/logs/'
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },
};
