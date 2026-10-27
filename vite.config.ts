import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

function apiPlugin(): Plugin {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        // Endpoint for Gemini question extraction
        if (req.url === '/api/gemini/extract-questions' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { text } = JSON.parse(body);
              if (!text || typeof text !== 'string') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Nội dung văn bản không hợp lệ' }));
              }

              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                // If API key is not yet set, return friendly message so client falls back gracefully
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({
                  fallback: true,
                  message: 'Chưa cấu hình GEMINI_API_KEY. Vui lòng nhập câu hỏi thủ công hoặc dùng file Excel/CSV mẫu.'
                }));
              }

              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({ apiKey });
              
              const prompt = `Bạn là trợ lý giảng viên môn Lý luận Nhà nước và Pháp luật tại Học viện PCCC & CNCH.
Hãy phân tích đoạn văn bản sau đây và trích xuất danh sách các câu hỏi trắc nghiệm dưới dạng JSON hợp lệ.

Yêu cầu nghiêm ngặt:
- Trả về CHỈ một JSON Array (không bọc trong markdown code block, không thêm văn bản dẫn dắt).
- Mỗi phần tử là một đối tượng có cấu trúc:
  {
    "question": "Nội dung câu hỏi",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctAnswer": 0, // Chỉ số 0 (A), 1 (B), 2 (C), 3 (D) hoặc null nếu không có đáp án rõ ràng trong đề
    "explanation": "Giải thích ngắn gọn căn cứ pháp lý hoặc lý luận",
    "topic": "Chủ đề (ví dụ: Nguồn gốc nhà nước, Quy phạm pháp luật...)",
    "difficulty": "Nhận biết" // "Nhận biết" | "Thông hiểu" | "Vận dụng"
  }
- Tuyệt đối không tự suy đoán hoặc gán bừa đáp án đúng nếu văn bản không ghi rõ. Trường hợp không rõ, hãy để correctAnswer là null để giảng viên tự xác nhận.

Văn bản nguồn cần trích xuất:
${text.slice(0, 10000)}`;

              const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
              });

              let raw = response.text || '[]';
              raw = raw.trim();
              if (raw.startsWith('```json')) {
                raw = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
              } else if (raw.startsWith('```')) {
                raw = raw.replace(/^```\s*/i, '').replace(/\s*```$/, '');
              }

              const questions = JSON.parse(raw);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, questions }));
            } catch (err: any) {
              console.error('Gemini extraction error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Lỗi xử lý trích xuất câu hỏi từ Gemini' }));
            }
          });
          return;
        }

        // Endpoint for backup/sync database to server storage
        if (req.url === '/api/storage/sync' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const dataDir = path.resolve(process.cwd(), 'data');
              if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
              }
              const dbFile = path.resolve(dataDir, 'db.json');
              fs.writeFileSync(dbFile, body, 'utf8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, timestamp: new Date().toISOString() }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/storage/load' && req.method === 'GET') {
          try {
            const dbFile = path.resolve(process.cwd(), 'data', 'db.json');
            if (fs.existsSync(dbFile)) {
              const content = fs.readFileSync(dbFile, 'utf8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(content);
            }
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'No persisted database on server' }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
