import * as XLSX from 'xlsx';
import { QuizQuestion, QuestionDifficulty } from '../types';

export interface QuestionRowInput {
  Question: string;
  OptionA: string;
  OptionB: string;
  OptionC: string;
  OptionD: string;
  CorrectAnswer: string; // 'A', 'B', 'C', 'D' or '0', '1', '2', '3'
  Explanation?: string;
  Points?: number | string;
  Topic?: string;
  Difficulty?: string;
}

export interface QuestionValidationResult {
  valid: boolean;
  errors: string[];
  parsed?: Omit<QuizQuestion, 'id' | 'quizId'>;
  raw: any;
  rowNumber: number;
}

/**
 * Downloads a genuine Excel (.xlsx) template file for question imports
 */
export function downloadQuestionTemplate() {
  const sampleData: QuestionRowInput[] = [
    {
      Question: 'Theo học thuyết Mác - Lênin, nguyên nhân trực tiếp dẫn tới sự xuất hiện của Nhà nước là gì?',
      OptionA: 'Do sự phát triển của lực lượng sản xuất và nhu cầu trị thủy',
      OptionB: 'Do mâu thuẫn giai cấp trong xã hội phát triển đến mức không thể điều hòa được',
      OptionC: 'Do ý chí của Đấng tối cao tạo lập trật tự trần thế',
      OptionD: 'Do sự thỏa thuận giữa các công dân thông qua khế ước xã hội',
      CorrectAnswer: 'B',
      Explanation: 'Theo Ăng-ghen, nhà nước ra đời khi mâu thuẫn giai cấp đối kháng không thể dung hòa.',
      Points: 1,
      Topic: 'Nguồn gốc Nhà nước',
      Difficulty: 'Nhận biết',
    },
    {
      Question: 'Hình thức nhà nước gồm các yếu tố nào sau đây?',
      OptionA: 'Hình thức chính thể, hình thức cấu trúc nhà nước và chế độ chính trị',
      OptionB: 'Bản chất giai cấp, bản chất xã hội và chủ quyền quốc gia',
      OptionC: 'Cơ quan lập pháp, cơ quan hành pháp và cơ quan tư pháp',
      OptionD: 'Quân đội, cảnh sát và tòa án',
      CorrectAnswer: 'A',
      Explanation: 'Ba yếu tố cấu thành hình thức nhà nước: Chính thể, Cấu trúc, Chế độ chính trị.',
      Points: 1,
      Topic: 'Hình thức Nhà nước',
      Difficulty: 'Thông hiểu',
    },
    {
      Question: 'Lực lượng Cảnh sát PCCC và CNCH thuộc cơ quan nào trong bộ máy Nhà nước CHXHCN Việt Nam?',
      OptionA: 'Cơ quan quyền lực nhà nước (Quốc hội)',
      OptionB: 'Cơ quan hành chính nhà nước (Bộ Công an)',
      OptionC: 'Cơ quan xét xử (Tòa án nhân dân)',
      OptionD: 'Cơ quan kiểm sát (Viện kiểm sát nhân dân)',
      CorrectAnswer: 'B',
      Explanation: 'Lực lượng Cảnh sát PCCC và CNCH thuộc Bộ Công an, cơ quan hành chính nhà nước.',
      Points: 1,
      Topic: 'Bộ máy Nhà nước',
      Difficulty: 'Vận dụng',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  ws['!cols'] = [
    { wch: 50 }, // Question
    { wch: 35 }, // OptionA
    { wch: 35 }, // OptionB
    { wch: 35 }, // OptionC
    { wch: 35 }, // OptionD
    { wch: 15 }, // CorrectAnswer
    { wch: 40 }, // Explanation
    { wch: 10 }, // Points
    { wch: 25 }, // Topic
    { wch: 15 }, // Difficulty
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Cau_Hoi');
  XLSX.writeFile(wb, 'Mau_nhap_cau_hoi_trac_nghiem_PCCC.xlsx');
}

/**
 * Parses an uploaded file (.xlsx, .xls or .csv) and validates each row
 */
export async function parseAndValidateQuestionsFile(file: File): Promise<{
  results: QuestionValidationResult[];
  totalValid: number;
  totalInvalid: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const results: QuestionValidationResult[] = [];
        let totalValid = 0;
        let totalInvalid = 0;

        rows.forEach((row, index) => {
          const rowNumber = index + 2; // Header is row 1
          const errors: string[] = [];

          // Standardize column keys (case-insensitive & trim)
          const cleanRow: Record<string, any> = {};
          Object.keys(row).forEach(key => {
            cleanRow[key.trim().toLowerCase()] = row[key];
          });

          const question = (
            cleanRow['question'] ||
            cleanRow['câu hỏi'] ||
            cleanRow['cau hoi'] ||
            cleanRow['nội dung'] ||
            ''
          ).toString().trim();

          const optA = (cleanRow['optiona'] || cleanRow['phương án a'] || cleanRow['a'] || '').toString().trim();
          const optB = (cleanRow['optionb'] || cleanRow['phương án b'] || cleanRow['b'] || '').toString().trim();
          const optC = (cleanRow['optionc'] || cleanRow['phương án c'] || cleanRow['c'] || '').toString().trim();
          const optD = (cleanRow['optiond'] || cleanRow['phương án d'] || cleanRow['d'] || '').toString().trim();

          const rawCorrect = (
            cleanRow['correctanswer'] ||
            cleanRow['đáp án đúng'] ||
            cleanRow['dap an dung'] ||
            cleanRow['đáp án'] ||
            ''
          ).toString().trim().toUpperCase();

          const explanation = (cleanRow['explanation'] || cleanRow['giải thích'] || '').toString().trim();
          const topic = (cleanRow['topic'] || cleanRow['chủ đề'] || 'Lý luận chung').toString().trim();
          
          let rawDifficulty = (cleanRow['difficulty'] || cleanRow['mức độ'] || 'Thông hiểu').toString().trim();
          let difficulty: QuestionDifficulty = 'Thông hiểu';
          if (rawDifficulty.toLowerCase().includes('nhận biết') || rawDifficulty.toLowerCase().includes('easy')) {
            difficulty = 'Nhận biết';
          } else if (rawDifficulty.toLowerCase().includes('vận dụng') || rawDifficulty.toLowerCase().includes('hard')) {
            difficulty = 'Vận dụng';
          }

          let points = parseFloat(cleanRow['points'] || cleanRow['điểm'] || '1');
          if (isNaN(points) || points <= 0) {
            points = 1;
          }

          // Validation rules
          if (!question) {
            errors.push('Thiếu nội dung câu hỏi');
          }

          const options: string[] = [];
          if (optA) options.push(optA);
          if (optB) options.push(optB);
          if (optC) options.push(optC);
          if (optD) options.push(optD);

          if (options.length < 2) {
            errors.push('Cần ít nhất 2 phương án trả lời');
          }

          let correctIndex: number = -1;
          if (rawCorrect === 'A' || rawCorrect === '0' || rawCorrect === '1') {
            correctIndex = 0;
          } else if (rawCorrect === 'B' || rawCorrect === '2') {
            correctIndex = 1;
          } else if (rawCorrect === 'C' || rawCorrect === '3') {
            correctIndex = 2;
          } else if (rawCorrect === 'D' || rawCorrect === '4') {
            correctIndex = 3;
          } else {
            // Check if user entered text matching one of the options
            const matchedIdx = options.findIndex(
              o => o.toLowerCase() === rawCorrect.toLowerCase()
            );
            if (matchedIdx >= 0) {
              correctIndex = matchedIdx;
            } else {
              errors.push(`Đáp án đúng không hợp lệ: "${rawCorrect}". Phải là A, B, C hoặc D`);
            }
          }

          if (correctIndex >= options.length) {
            errors.push(`Đáp án ${rawCorrect} vượt quá số phương án có sẵn`);
          }

          const isValid = errors.length === 0;
          if (isValid) {
            totalValid++;
            results.push({
              valid: true,
              errors: [],
              rowNumber,
              raw: row,
              parsed: {
                content: question,
                options,
                correctAnswer: correctIndex,
                questionType: 'single',
                points,
                explanation: explanation || 'Chưa có giải thích chi tiết.',
                topic,
                difficulty,
                order: index + 1,
              },
            });
          } else {
            totalInvalid++;
            results.push({
              valid: false,
              errors,
              rowNumber,
              raw: row,
            });
          }
        });

        resolve({ results, totalValid, totalInvalid });
      } catch (err: any) {
        reject(new Error('Lỗi đọc tệp Excel/CSV: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp tin'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Exports genuine Excel (.xlsx) file for assignment submissions
 */
export function exportSubmissionsToExcel(
  assignmentTitle: string,
  data: {
    studentId: string;
    studentName: string;
    studentClass: string;
    submittedAt: string;
    isLate: boolean;
    status: string;
    score: string | number;
    feedback: string;
  }[]
) {
  const formattedRows = data.map((item, index) => ({
    STT: index + 1,
    'Mã sinh viên': item.studentId,
    'Họ và tên': item.studentName,
    'Lớp': item.studentClass,
    'Thời gian nộp': item.submittedAt,
    'Tình trạng': item.isLate ? 'Nộp muộn' : 'Đúng hạn',
    'Trạng thái': item.status === 'graded' ? 'Đã chấm' : 'Chưa chấm',
    'Điểm': item.score !== undefined && item.score !== '' ? item.score : 'Chưa có',
    'Nhận xét của giảng viên': item.feedback || '',
  }));

  const ws = XLSX.utils.json_to_sheet(formattedRows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 22 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 45 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ket_qua_nop_bai');
  const safeTitle = assignmentTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_').slice(0, 30);
  XLSX.writeFile(wb, `Danh_sach_nop_bai_${safeTitle}.xlsx`);
}

/**
 * Exports genuine Excel (.xlsx) file for student gradebook & analytics
 */
export function exportGradebookToExcel(
  students: {
    studentId: string;
    studentName: string;
    studentClass: string;
    email: string;
    submittedCount: number;
    totalAssignments: number;
    completionRate: number;
    avgQuizScore: number;
    academicStatus: string;
  }[]
) {
  const formattedRows = students.map((s, index) => ({
    STT: index + 1,
    'Mã sinh viên': s.studentId,
    'Họ và tên': s.studentName,
    'Lớp học': s.studentClass,
    'Email': s.email,
    'Nhiệm vụ đã nộp': `${s.submittedCount}/${s.totalAssignments}`,
    'Tỷ lệ hoàn thành (%)': `${s.completionRate}%`,
    'Điểm TB trắc nghiệm': s.avgQuizScore,
    'Đánh giá quá trình': s.academicStatus,
  }));

  const ws = XLSX.utils.json_to_sheet(formattedRows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 26 },
    { wch: 15 },
    { wch: 30 },
    { wch: 18 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'So_Diem_Hoc_Phan');
  XLSX.writeFile(wb, `Bang_theo_doi_hoc_tap_LLNN&PL_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
