export interface UserStatistics {
  total_tests_passed: number;
  total_exams_passed: number;
  total_questions_answered: number;
  total_correct_answers: number;
  success_rate_percent: number;
  updated_at: string;
}

export interface TopicProgressItem {
  id: number;
  section_number: number;
  section_title: string;
  questions_attempted: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy_percent: number;
  is_mastered: boolean;
  last_practiced_at?: string;
}

export interface WeakTopicRecommendation {
  section_number: number;
  section_title: string;
  incorrect_answers: number;
  accuracy_percent: number;
  recommendation: string;
}
