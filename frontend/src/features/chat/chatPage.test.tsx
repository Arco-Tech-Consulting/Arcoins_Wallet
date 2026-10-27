import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '@/api/client'
import ChatPanel from './ChatPanel'

const mocks = vi.hoisted(() => ({
    sendChatMessage: vi.fn(),
}))

vi.mock('@/api/chat.api', () => ({
    sendChatMessage: mocks.sendChatMessage,
}))

describe('ChatPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    afterEach(() => {
        cleanup()
    })

    it('envía el mensaje y muestra la respuesta del servicio', async () => {
        mocks.sendChatMessage.mockResolvedValue({
            reply: 'Organiza tus gastos por categorías.',
        })

        const user = userEvent.setup()
        render(<ChatPanel />)

        await user.type(
            screen.getByLabelText('Tu mensaje'),
            '  ¿Cómo puedo ahorrar?  ',
        )
        await user.click(screen.getByRole('button', { name: 'Enviar' }))

        expect(
            await screen.findByText('Organiza tus gastos por categorías.'),
        ).toBeInTheDocument()

        expect(mocks.sendChatMessage).toHaveBeenCalledExactlyOnceWith({
            message: '¿Cómo puedo ahorrar?',
        })
        expect(screen.getByLabelText('Tu mensaje')).toHaveValue('')
        expect(screen.getByLabelText('Tu mensaje')).toBeEnabled()
    })

    it('pide iniciar sesión y no ofrece reintentar cuando recibe 401', async () => {
        mocks.sendChatMessage.mockRejectedValue(
            new ApiError(401, 'Token inválido'),
        )

        const user = userEvent.setup()
        render(<ChatPanel />)

        await user.type(screen.getByLabelText('Tu mensaje'), 'Hola')
        await user.click(screen.getByRole('button', { name: 'Enviar' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Tu sesión no es válida o ha vencido. Vuelve a iniciar sesión.',
        )
        expect(
            screen.queryByRole('button', { name: 'Reintentar' }),
        ).not.toBeInTheDocument()
        expect(screen.getByLabelText('Tu mensaje')).toBeEnabled()
    })

    it('permite reintentar un 503 sin duplicar el mensaje', async () => {
        mocks.sendChatMessage
            .mockRejectedValueOnce(new ApiError(503, 'Configuración pendiente'))
            .mockResolvedValueOnce({ reply: 'Empieza registrando tus gastos.' })

        const user = userEvent.setup()
        render(<ChatPanel />)

        await user.type(
            screen.getByLabelText('Tu mensaje'),
            'Quiero organizar mis gastos',
        )
        await user.click(screen.getByRole('button', { name: 'Enviar' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'El asistente no está disponible en este momento. Intenta más tarde.',
        )
        expect(screen.getByLabelText('Tu mensaje')).toBeEnabled()

        await user.click(screen.getByRole('button', { name: 'Reintentar' }))

        expect(
            await screen.findByText('Empieza registrando tus gastos.'),
        ).toBeInTheDocument()

        expect(mocks.sendChatMessage).toHaveBeenCalledTimes(2)
        expect(mocks.sendChatMessage).toHaveBeenNthCalledWith(2, {
            message: 'Quiero organizar mis gastos',
        })
        expect(screen.getAllByText('Quiero organizar mis gastos')).toHaveLength(1)
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('muestra un mensaje específico cuando recibe 504', async () => {
        mocks.sendChatMessage.mockRejectedValue(
            new ApiError(504, 'Tiempo de espera agotado'),
        )

        const user = userEvent.setup()
        render(<ChatPanel />)

        await user.type(screen.getByLabelText('Tu mensaje'), 'Hola')
        await user.click(screen.getByRole('button', { name: 'Enviar' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'El asistente tardó demasiado en responder. Puedes reintentar.',
        )
        expect(
            screen.getByRole('button', { name: 'Reintentar' }),
        ).toBeEnabled()
        expect(screen.getByLabelText('Tu mensaje')).toBeEnabled()
    })

    it('bloquea el envío mientras espera la respuesta', async () => {
        let resolveReply!: (value: { reply: string }) => void

        mocks.sendChatMessage.mockReturnValue(
            new Promise<{ reply: string }>((resolve) => {
                resolveReply = resolve
            }),
        )

        const user = userEvent.setup()
        render(<ChatPanel />)

        await user.type(screen.getByLabelText('Tu mensaje'), 'Hola')
        await user.click(screen.getByRole('button', { name: 'Enviar' }))

        expect(screen.getByLabelText('Tu mensaje')).toBeDisabled()

        const loadingButton = screen.getByRole('button', {
            name: /Respondiendo/,
        })
        expect(loadingButton).toBeDisabled()

        await user.click(loadingButton)
        expect(mocks.sendChatMessage).toHaveBeenCalledTimes(1)

        await act(async () => {
            resolveReply({ reply: 'Hola, puedo orientarte.' })
        })

        expect(
            await screen.findByText('Hola, puedo orientarte.'),
        ).toBeInTheDocument()
        expect(screen.getByLabelText('Tu mensaje')).toBeEnabled()
    })
})