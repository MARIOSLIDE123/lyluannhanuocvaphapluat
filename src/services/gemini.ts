import { QuizQuestion, QuestionDifficulty } from '../types';

export interface ExtractedQuestionDraft {
  question: string;
  options: string[];
  correctAnswer: number | null; // null if unverified/unclear
  explanation: string;
  topic: string;
  difficulty: QuestionDifficulty;
  needsVerification: boolean;
}

/**
 * Parses raw text using Gemini server API or intelligent pattern matching
 */
export async function extractQuestionsFromText(text: string): Promise<{
  success: boolean;
  questions: ExtractedQuestionDraft[];
  message?: string;
}> {
  try {
    const res = await fetch('/api/gemini/extract-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        const mapped: ExtractedQuestionDraft[] = data.questions.map((q: any) => ({
          question: q.question || '',
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : null,
          explanation: q.explanation || 'Cần giảng viên kiểm tra và bổ sung căn cứ.',
          topic: q.topic || 'Lý luận chung',
          difficulty: q.difficulty || 'Thông hiểu',
          needsVerification: q.correctAnswer === null || q.correctAnswer === undefined,
        }));
        return { success: true, questions: mapped };
      } else if (data.fallback) {
        // Fallback to local rule-based regex extraction
        const localExtracted = parseQuestionsLocally(text);
        return {
          success: true,
          questions: localExtracted,
          message: data.message || 'Đã phân tích bằng bộ trích xuất định dạng nội bộ.',
        };
      }
    }
  } catch (e) {
    console.warn('API call failed, switching to local parser:', e);
  }

  // Local regex parser fallback
  const fallbackQuestions = parseQuestionsLocally(text);
  return {
    success: true,
    questions: fallbackQuestions,
    message: 'Đã phân tích văn bản theo cấu trúc câu hỏi và phương án A, B, C, D.',
  };
}

/**
 * Intelligent local parser for standard Vietnamese multiple-choice question formats:
 * Câu 1: ...
 * A. ...
 * B. ...
 * C. ...
 * D. ...
 * Đáp án: A
 */
function parseQuestionsLocally(text: string): ExtractedQuestionDraft[] {
  const list: ExtractedQuestionDraft[] = [];
  const questionBlocks = text.split(/(?:^|\n)(?=Câu\s+\d+[:.]|Bài\s+\d+[:.]|\d+[\.\)])/i);

  for (const block of questionBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Extract Question title
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    const firstLine = lines[0];
    const qContent = firstLine.replace(/^(?:Câu\s+\d+[:.]|Bài\s+\d+[:.]|\d+[\.\)])\s*/i, '');

    const options: string[] = [];
    let detectedAnswer: number | null = null;
    let explanation = '';

    for (const line of lines.slice(1)) {
      if (/^[A-D][\.\:\)]\s*/i.test(line)) {
        options.push(line.replace(/^[A-D][\.\:\)]\s*/i, ''));
      } else if (/^(?:Đáp án|Đáp án đúng|Key)[:.]\s*([A-D])/i.test(line)) {
        const match = line.match(/^(?:Đáp án|Đáp án đúng|Key)[:.]\s*([A-D])/i);
        if (match) {
          const letter = match[1].toUpperCase();
          if (letter === 'A') detectedAnswer = 0;
          if (letter === 'B') detectedAnswer = 1;
          if (letter === 'C') detectedAnswer = 2;
          if (letter === 'D') detectedAnswer = 3;
        }
      } else if (/^(?:Giải thích|Ghi chú)[:.]\s*/i.test(line)) {
        explanation = line.replace(/^(?:Giải thích|Ghi chú)[:.]\s*/i, '');
      }
    }

    if (qContent && options.length >= 2) {
      list.push({
        question: qContent,
        options,
        correctAnswer: detectedAnswer,
        explanation: explanation || 'Chưa có giải thích từ tệp nguồn.',
        topic: 'Lý luận Nhà nước và Pháp luật',
        difficulty: 'Thông hiểu',
        needsVerification: detectedAnswer === null,
      });
    }
  }

  return list;
}
