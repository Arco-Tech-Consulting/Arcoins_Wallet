import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware'
import { chat } from '../controllers/assistant.controller'
import { createAssistantRateLimiter } from '../middlewares/assistant-rate-limit.middleware'

const router = Router()

router.post('/chat', authenticateToken, createAssistantRateLimiter(), chat)

export default router
