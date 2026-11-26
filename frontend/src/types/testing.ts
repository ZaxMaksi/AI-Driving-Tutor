import { Question } from './question';

export type TestMode = 'exam' | 'by_topic' | 'mixed' | 'ai_training';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface UserAnswerItem {
  id: number;
  question: Question;
  selected_option: number;
  selected_option_text: string;
  is_correct: boolean;
  time_spent_seconds: number;
  answered_at: string;
}

export interface TestSessionListItem {
  id: number;
  mode: TestMode;
  mode_display: string;
  section_title?: string;
  total_questions: number;
  correct_answers_count: number;
  incorrect_answers_count: number;
  is_passed: boolean;
  status: SessionStatus;
  status_display: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
}

export interface TestSessionDetail {
  id: number;
  mode: TestMode;
  mode_display: string;
  section_title?: string;
  total_questions: number;
  correct_answers_count: number;
  incorrect_answers_count: number;
  is_passed: boolean;
  status: SessionStatus;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  user_answers: UserAnswerItem[];
}

export interface StartSessionPayload {
  mode: TestMode;
  section_id?: number | null;
  question_count?: number;
}

export interface SubmitAnswerPayload {
  question_id: number;
  selected_option_id: number;
  time_spent_seconds?: number;
}
