import { Question } from './question';

export interface GenerateQuestionPayload {
  section_id: number;
}

export interface ExplainMistakePayload {
  question_id: number;
  selected_option_id: number;
}

export interface ExplainMistakeResponse {
  explanation: string;
}

export interface ConsultationPayload {
  query: string;
  section_id?: number | null;
}

export interface ConsultationResponse {
  answer: string;
}

export interface AIGenerationLogItem {
  id: number;
  request_type: 'question_generation' | 'explanation' | 'consultation';
  request_type_display: string;
  model_name: string;
  response_text: string;
  is_successful: boolean;
  created_at: string;
}

export type GeneratedQuestionResponse = Question;
