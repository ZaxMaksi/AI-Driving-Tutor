export type QuestionType = 'official' | 'ai_generated';
export type AIStatus = 'pending' | 'approved' | 'rejected';

export interface AnswerOption {
  id: number;
  text: string;
  order: number;
  is_correct?: boolean; // Only present in result view
}

export interface QuestionImage {
  id: number;
  image: string;
  caption: string;
  is_main: boolean;
  order: number;
}

export interface Question {
  id: number;
  text: string;
  section_id?: number;
  section_title?: string;
  section_number?: number;
  question_type: QuestionType;
  difficulty: number;
  answers: AnswerOption[];
  images?: QuestionImage[];
  explanation?: string; // Only present in result view
  rule_points_numbers?: string[];
  related_points?: { id: number; number: string; text: string }[];
}
