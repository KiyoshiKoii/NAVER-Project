import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = process.env.PORT || 3001;

// --- Cấu hình Google AI ---
// Lấy API key từ file .env
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// CẬP NHẬT: Sử dụng model "flash" mới nhất và ổn định nhất
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

app.use(cors());
app.use(express.json());

// --- ENDPOINT GỌI AI THỰC SỰ ---
app.post('/api/generate-subtasks', async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  console.log(`[AI Server] Received title: "${title}"`);

  try {
    // --- CẬP NHẬT PROMPT YÊU CẦU TIẾNG VIỆT ---
    const prompt = `
      Bạn là một trợ lý quản lý dự án chuyên nghiệp. Nhiệm vụ của bạn là chia một công việc lớn thành một danh sách các công việc phụ nhỏ hơn, có thể thực hiện được.
      
      Tiêu đề công việc: "${title}"
      
      Dựa trên tiêu đề, hãy tạo ra một danh sách từ 3 đến 5 công việc phụ.
      Đầu ra PHẢI là một mảng JSON hợp lệ chứa các chuỗi (string), và không có gì khác. Không bao gồm văn bản giới thiệu, giải thích hay định dạng markdown.
      Ngôn ngữ trả về PHẢI là Tiếng Việt.
      
      Ví dụ cho "Lên kế hoạch đi du lịch Đà Nẵng":
      ["Đặt vé máy bay và khách sạn", "Lên lịch trình chi tiết cho từng ngày", "Chuẩn bị các vật dụng cần thiết", "Sắp xếp phương tiện di chuyển tại địa phương"]
      
      Bây giờ, hãy tạo các công việc phụ cho tiêu đề đã cho.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log('[AI Server] Raw AI Response:', text);

    // --- BƯỚC LÀM SẠCH DỮ LIỆU ---
    // Tìm và trích xuất nội dung JSON từ bên trong khối mã Markdown
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      text = jsonMatch[1];
    }
    
    // Loại bỏ các ký tự không hợp lệ khác nếu có
    text = text.trim();

    // Parse the cleaned JSON string
    const suggestions = JSON.parse(text);
    
    console.log('[AI Server] Parsed Suggestions:', suggestions);
    res.json({ suggestions });

  } catch (error) {
    console.error('[AI Server] Error calling Google AI or parsing response:', error);
    res.status(500).json({ error: 'Failed to generate AI suggestions.' });
  }
});

app.listen(port, () => {
  console.log(`✨ Real AI server listening on http://localhost:${port}`);
});