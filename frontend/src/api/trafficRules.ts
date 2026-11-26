import { apiClient } from './client';
import { RulePoint, RulePointSearchResult, RuleSection } from '../types/trafficRules';

export const trafficRulesApi = {
  async getSections(): Promise<RuleSection[]> {
    const response = await apiClient.get<RuleSection[] | { results: RuleSection[] }>('/traffic-rules/sections/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },

  async getSectionDetail(number: number): Promise<RuleSection> {
    const response = await apiClient.get<RuleSection>(`/traffic-rules/sections/${number}/`);
    return response.data;
  },

  async getPointDetail(numberStr: string): Promise<RulePoint> {
    const response = await apiClient.get<RulePoint>(`/traffic-rules/points/${numberStr}/`);
    return response.data;
  },

  async searchPoints(searchQuery: string): Promise<RulePointSearchResult[]> {
    const response = await apiClient.get<RulePointSearchResult[] | { results: RulePointSearchResult[] }>(
      '/traffic-rules/points/search/',
      {
        params: { search: searchQuery },
      }
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },
};
