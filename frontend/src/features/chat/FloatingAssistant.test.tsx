import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter } from 'react-router-dom'
import FloatingAssistant from './FloatingAssistant'

vi.mock('@/api/chat.api', () => ({ sendChatMessage: vi.fn() }))

afterEach(cleanup)

describe('FloatingAssistant', () => {
  it('conserva el borrador al cerrar y navegar, y restaura el foco con Escape', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Link to="/history">Ir al historial</Link>
        <FloatingAssistant />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Abrir asistente' }))
    await user.type(screen.getByLabelText('Tu mensaje'), 'Quiero organizar mis gastos')
    await user.click(screen.getByRole('button', { name: 'Cerrar asistente' }))
    expect(screen.getByRole('button', { name: 'Abrir asistente' })).toHaveFocus()
    expect(screen.queryByRole('region', { name: 'Asistente de Arcoins' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Abrir asistente' }))
    expect(screen.getByLabelText('Tu mensaje')).toHaveValue('Quiero organizar mis gastos')
    await user.click(screen.getByRole('link', { name: 'Ir al historial' }))
    expect(screen.getByLabelText('Tu mensaje')).toHaveValue('Quiero organizar mis gastos')

    await user.click(screen.getByLabelText('Tu mensaje'))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Abrir asistente' })).toHaveFocus()
  })

  it('abre un único panel al entrar a la ruta del chat', async () => {
    render(
      <MemoryRouter initialEntries={['/chat']}>
        <FloatingAssistant />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('region', { name: 'Asistente de Arcoins' })).toBeVisible()
    expect(screen.getAllByRole('log')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Ocultar asistente' })).toHaveAttribute('aria-expanded', 'true')
  })
})
