export interface StructuredOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface StructuredQuestion {
  id: string;
  setId: string;
  sourceFile: string;
  sourceQuestionNumber: number;
  sourcePage: number;
  questionText: string;
  options: StructuredOption[];
  correctOptionId: string; // 'A' | 'B' | 'C' | 'D'
  explanation: string;
  reference: string;
  reviewStatus: 'verified' | 'needs_review';
  points: number;
}
