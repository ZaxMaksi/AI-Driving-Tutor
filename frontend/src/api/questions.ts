import { apiClient } from './client';
import { Question } from '../types/question';

export interface QuestionFilterParams {
  section_number?: number;
  difficulty?: number;
  question_type?: 'official' | 'ai_generated';
  has_image?: boolean;
  page?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const questionsApi = {
  async getQuestions(params?: QuestionFilterParams): Promise<PaginatedResponse<Question>> {
    const response = await apiClient.get<PaginatedResponse<Question>>('/questions/', {
      params,
    });
    return response.data;
  },

  async getQuestionDetail(id: number): Promise<Question> {
    const response = await apiClient.get<Question>(`/questions/${id}/`);
    return response.data;
  },

  async getQuestionResult(id: number): Promise<Question> {
    const response = await apiClient.get<Question>(`/questions/${id}/result/`);
    return response.data;
  },
};
