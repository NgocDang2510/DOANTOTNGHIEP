import AiMessage from '../models/AiMessage.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `Bạn là "RoomAI" - trợ lý tìm phòng trọ thông minh, thân thiện dành cho sinh viên và người đi thuê trọ tại Việt Nam.

Khả năng của bạn:
- Tư vấn và TÌM KIẾM phòng trọ phù hợp theo nhu cầu (ngân sách, khu vực, tiện ích) — hệ thống sẽ tự động tìm và hiển thị phòng phù hợp bên dưới câu trả lời của bạn
- Giải thích các loại hình phòng trọ: phòng đơn, phòng ghép, căn hộ mini, nhà nguyên căn
- Hướng dẫn cách đánh giá phòng trọ, kiểm tra hợp đồng thuê nhà
- Tư vấn mức giá hợp lý theo từng khu vực (gần trường, trung tâm, ngoại ô)
- Chia sẻ kinh nghiệm thuê trọ: thương lượng giá, các khoản phí phát sinh, quyền lợi người thuê
- Giải đáp thắc mắc về thủ tục thuê phòng, đăng ký tạm trú, hợp đồng thuê

Quy tắc trả lời:
- Luôn dùng tiếng Việt, thân thiện và dễ hiểu
- SỬ DỤNG MARKDOWN để format câu trả lời: **in đậm** cho tiêu đề phụ, danh sách gạch đầu dòng cho các ý chính. TUYỆT ĐỐI KHÔNG SỬ DỤNG markdown code block (kí tự \` hoặc \`\`\`).
- Giữ câu trả lời NGẮN GỌN, tối đa 2-3 câu.
- Khi người dùng muốn tìm phòng: KHÔNG HỎI THÊM. Ngay ký tự đầu tiên trong response của bạn, output tag này (KHÔNG có ký tự nào trước tag):
  [SEARCH:{"city":"tên tỉnh/thành phố hoặc null","district":"tên quận/huyện hoặc null","nearbyLocation":"địa danh cụ thể gần đó hoặc null","minPrice":số_hoặc_null,"maxPrice":số_hoặc_null,"roomType":"SINGLE hoặc SHARED hoặc APARTMENT hoặc HOUSE hoặc null"}]
  Ngay SAU tag (không xuống dòng), viết 1 câu ngắn. Ví dụ: [SEARCH:{"city":"Hà Nội","district":null,"nearbyLocation":null,"minPrice":null,"maxPrice":null,"roomType":null}]Mình tìm thấy một số phòng ở Hà Nội cho bạn nhé!
  Lưu ý: giá VNĐ (2 triệu=2000000); SINGLE=phòng đơn, SHARED=phòng ghép, APARTMENT=căn hộ, HOUSE=nhà nguyên căn
- TUYỆT ĐỐI KHÔNG hỏi lại về ngân sách, khu vực cụ thể, loại phòng hay bất kỳ thông tin nào khác khi người dùng đã nêu ý định tìm phòng.
- TỪ CHỐI TRẢ LỜI MỌI CÂU HỎI KHÔNG LIÊN QUAN ĐẾN NHÀ Ở, PHÒNG TRỌ. Nếu người dùng hỏi chủ đề khác, hãy nói: "Xin lỗi, mình là RoomAI nên chỉ có thể tư vấn các vấn đề về tìm kiếm và thuê phòng trọ thôi nhé!"
- Tuyệt đối không cung cấp thông tin ngoài luồng.`;


async function geocodeLocation(locationName) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName + ', Việt Nam')}&format=json&limit=1&accept-language=vi`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'SmartAccommodationFinder/1.0 (dangpham1010da@gmail.com)' }
    });
    const data = await resp.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.error('[AI-Chat] Nominatim geocode error:', e.message);
  }
  return null;
}

async function searchRooms(params) {
  try {
    const springBootUrl = process.env.SPRING_BOOT_URL || 'http://spring-boot-api:8082';

    if (params.nearbyLocation) {
      const coords = await geocodeLocation(params.nearbyLocation);
      if (coords) {
        const url = `${springBootUrl}/api/rooms/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=3&limit=6`;
        console.log('[AI-Chat] Calling nearby API:', url);
        const resp = await fetch(url);
        const data = await resp.json();
        console.log('[AI-Chat] Nearby returned:', data.data?.length, 'rooms');
        if (data.success && data.data?.length > 0) return data.data;
      }
    }

    const searchParams = new URLSearchParams({ size: '6' });
    if (params.city) searchParams.set('city', params.city);
    if (params.district) searchParams.set('district', params.district);
    if (params.minPrice) searchParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice) searchParams.set('maxPrice', String(params.maxPrice));
    if (params.roomType) searchParams.set('roomType', params.roomType);

    const url = `${springBootUrl}/api/rooms?${searchParams}`;
    console.log('[AI-Chat] Calling Spring Boot:', url);
    const resp = await fetch(url);
    const data = await resp.json();
    console.log('[AI-Chat] Spring Boot returned:', data.data?.totalElements, 'rooms');

    return data.success && data.data?.content?.length > 0 ? data.data.content : null;
  } catch (e) {
    console.error('[AI-Chat] searchRooms error:', e.message);
    return null;
  }
}

/**
 * GET /api/ai-chat/messages/:userId
 * Lấy lịch sử chat của user (50 messages gần nhất)
 */
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await AiMessage.find({ userId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AiMessage.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[AI-Chat] getMessages error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

/**
 * POST /api/ai-chat/chat
 * Body: { userId, content }
 * 
 * Gửi message tới Ollama với streaming SSE.
 * Lưu cả user message + AI reply vào MongoDB.
 */
export const streamChat = async (req, res) => {
  const { userId, content, imageBase64, imageMimeType } = req.body;
  console.log(`[AI-Chat] streamChat called: userId=${userId}, content="${content?.slice(0,50)}"`);

  if (!userId || (!content?.trim() && !imageBase64)) {
    return res.status(400).json({ success: false, message: 'userId and content or image are required' });
  }

  const textContent = content?.trim() || 'Dựa vào ảnh này, bạn có thể tư vấn gì về phòng trọ này không?';

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured in .env' });
  }

  // Khởi tạo Gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT
  });

  // Lưu user message vào MongoDB (ghi chú [Hình ảnh] vào nội dung để lưu lịch sử)
  const savedContent = imageBase64 ? `[Đã đính kèm hình ảnh] ${textContent}` : textContent;
  const userMsg = new AiMessage({ userId, role: 'user', content: savedContent });
  await userMsg.save();

  // Lấy 10 messages gần nhất làm context (không tính message vừa gửi)
  const recentMessages = await AiMessage.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const contextMessages = recentMessages.reverse();

  // Build history cho Gemini (Gemini dùng role 'user' và 'model')
  let geminiHistory = contextMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || ' ' }],
  }));

  // Xử lý lỗi "First content should be with role 'user', got model"
  // Gemini yêu cầu lịch sử PHẢI bắt đầu bằng 'user' và các role phải xen kẽ nhau (user -> model -> user)
  const validHistory = [];
  for (const msg of geminiHistory) {
    if (validHistory.length === 0) {
      if (msg.role === 'user') validHistory.push(msg); // Chỉ lấy nếu là user
    } else {
      if (validHistory[validHistory.length - 1].role !== msg.role) {
        validHistory.push(msg); // Xen kẽ thì push
      } else {
        // Cùng role thì gộp nội dung lại
        validHistory[validHistory.length - 1].parts[0].text += `\n${msg.parts[0].text}`;
      }
    }
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx buffering off
  res.flushHeaders();

  let fullReply = '';
  let foundRooms = [];

  try {
    const chat = model.startChat({
      history: validHistory,
    });

    // Chuẩn bị payload (chỉ text, hoặc text + hình ảnh)
    let messageParts = [textContent];
    if (imageBase64) {
      // Tự động cắt bỏ phần header "data:image/jpeg;base64," nếu frontend gửi kèm
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      messageParts.push({
        inlineData: {
          data: base64Data,
          mimeType: imageMimeType || "image/jpeg"
        }
      });
    }

    const result = await chat.sendMessageStream(messageParts);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullReply += chunkText;
      res.write(`data: ${JSON.stringify({ token: chunkText })}\n\n`);
    }

    // Parse [SEARCH:{...}] tag Gemini đặt ở đầu response
    const searchMatch = fullReply.match(/\[SEARCH:(\{[\s\S]*?\})\]/);
    if (searchMatch) {
      try {
        const params = JSON.parse(searchMatch[1]);
        console.log('[AI-Chat] Parsed search params:', JSON.stringify(params));
        const rooms = await searchRooms(params);
        if (rooms && rooms.length > 0) {
          foundRooms = rooms;
          res.write(`data: ${JSON.stringify({ rooms })}\n\n`);
        }
        fullReply = fullReply.replace(/\[SEARCH:\{[\s\S]*?\}\]/, '').trim();
      } catch (e) {
        console.error('[AI-Chat] Parse search params error:', e.message);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);

  } catch (error) {
    console.error('[AI-Chat] Gemini API error:', error.message);
    
    let fallbackMessage = "";
    if (!fullReply.trim()) {
      fallbackMessage = "Xin lỗi bạn, hiện tại RoomAI đang bị quá tải hoặc gặp sự cố kết nối. Bạn vui lòng thử lại sau ít phút nhé!";
    } else {
      fallbackMessage = "\n\n*(Xin lỗi bạn, kết nối bị ngắt quãng giữa chừng. Bạn vui lòng thử lại sau nhé!)*";
    }

    // Gửi dòng thông báo lỗi như một phần tin nhắn bình thường để UI hiển thị chuyên nghiệp
    res.write(`data: ${JSON.stringify({ token: fallbackMessage })}\n\n`);
    fullReply += fallbackMessage;

    // Báo cho frontend đã xong (để tắt trạng thái loading)
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);

  } finally {
    // Lưu AI reply vào MongoDB dù có lỗi hay không (nếu có nội dung)
    if (fullReply.trim()) {
      const aiMsg = new AiMessage({ userId, role: 'assistant', content: fullReply.trim(), rooms: foundRooms });
      await aiMsg.save().catch((e) => console.error('[AI-Chat] Save AI reply error:', e.message));
    }
    res.end();
  }
};

/**
 * DELETE /api/ai-chat/history/:userId
 * Xóa toàn bộ lịch sử chat của user
 */
export const clearHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await AiMessage.deleteMany({ userId });
    return res.status(200).json({
      success: true,
      message: `Đã xóa ${result.deletedCount} messages`,
    });
  } catch (error) {
    console.error('[AI-Chat] clearHistory error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to clear history' });
  }
};

/**
 * GET /api/ai-chat/last-message/:userId
 * Trả về message cuối cùng + có tồn tại conversation hay không
 * Dùng cho frontend để hiển thị AI conversation trong danh sách
 */
export const getLastMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const lastMsg = await AiMessage.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!lastMsg) {
      return res.status(200).json({ success: true, exists: false, data: null });
    }

    return res.status(200).json({
      success: true,
      exists: true,
      data: {
        content: lastMsg.content,
        role: lastMsg.role,
        timestamp: lastMsg.createdAt,
      },
    });
  } catch (error) {
    console.error('[AI-Chat] getLastMessage error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to get last message' });
  }
};

/**
 * POST /api/ai-chat/summarize
 * Body: { transcript: string }
 * Tóm tắt đoạn hội thoại do frontend gửi lên.
 */
export const summarizeGroupChat = async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ success: false, message: 'Transcript is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Dưới đây là đoạn trích lịch sử chat nhóm:
"""
${transcript}
"""

Nhiệm vụ của bạn là:
1. Tóm tắt ngắn gọn các ý chính, quyết định, hoặc công việc được giao (nếu có).
2. Lọc bỏ các tin nhắn chào hỏi, tán gẫu không quan trọng.
3. Dùng gạch đầu dòng rõ ràng, dễ đọc.
4. KHÔNG sử dụng Markdown code block. CHỈ trả về văn bản bằng tiếng Việt thân thiện.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('[AI-Chat] summarizeGroupChat error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to summarize conversation' });
  }
};

