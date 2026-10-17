import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware'
import { chat } from '../controllers/assistant.controller'

const router = Router()

router.post('/chat', authenticateToken, chat)

export default router