import { apiClient } from './client';
import { TopicProgressItem, UserStatistics, WeakTopicRecommendation } from '../types/progress';

export const progressApi = {
  async getSummary(): Promise<UserStatistics> {
    const response = await apiClient.get<UserStatistics>('/progress/summary/');
    return response.data;
  },

  async getTopicProgress(): Promise<TopicProgressItem[]> {
    const response = await apiClient.get<TopicProgressItem[] | { results: TopicProgressItem[] }>(
      '/progress/topics/'
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },

  async getRecommendations(): Promise<WeakTopicRecommendation[]> {
    const response = await apiClient.get<WeakTopicRecommendation[] | { results: WeakTopicRecommendation[] }>(
      '/progress/recommendations/'
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },
};
