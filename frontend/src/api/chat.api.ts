import { apiRequest } from './client'
import type { ChatRequest, ChatResponse } from '@/types/api'

export async function sendChatMessage(body: ChatRequest): Promise<ChatResponse> {
  const data = (await apiRequest('/chat', {
    method: 'POST',
    body,
  })) as { reply: string }
  return { reply: data.reply }
}