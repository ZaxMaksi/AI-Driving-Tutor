export interface RuleDocument {
  id: number;
  document_number: string;
  title: string;
  edition_date: string;
  is_active: boolean;
}

export interface RulePoint {
  id: number;
  section: number;
  number: string;
  text: string;
  is_active: boolean;
}

export interface RuleSection {
  id: number;
  document: number;
  number: number;
  title: string;
  description: string;
  points_count?: number;
  points?: RulePoint[];
}

export interface RulePointSearchResult extends RulePoint {
  section_number: number;
  section_title: string;
}
