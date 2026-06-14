import express from 'express';
import { getMessages, streamChat, clearHistory, getLastMessage, summarizeGroupChat } from '../controllers/aiChatController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET lịch sử chat (no auth — widget accessible to guests)
router.get('/messages/:userId', getMessages);

// GET last message (cho conversation list)
router.get('/last-message/:userId', getLastMessage);

// POST gửi message + stream response (no auth — widget accessible to guests)
router.post('/chat', streamChat);

// POST tóm tắt nhóm chat (requires auth)
router.post('/summarize', authMiddleware, summarizeGroupChat);

// DELETE xóa lịch sử (no auth — userId is the scope)
router.delete('/history/:userId', clearHistory);

export default router;
