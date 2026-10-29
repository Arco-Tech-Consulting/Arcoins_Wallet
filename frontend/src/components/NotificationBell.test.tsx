import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationBell } from './NotificationBell'
import type { TransferNotification } from '@/context/SocketContext'

const mocks = vi.hoisted(() => ({
  useSocket: vi.fn(),
}))

vi.mock('@/context/SocketContext', () => ({
  useSocket: mocks.useSocket,
  TransferNotification: {},
}))

function notificationFixture(
  overrides: Partial<TransferNotification> = {},
): TransferNotification {
  return {
    transferGroupId: 'group-1',
    currency: 'COP',
    amount: 1500,
    description: null,
    createdAt: '2026-10-29T12:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  mocks.useSocket.mockReset()
  mocks.useSocket.mockReturnValue({
    notifications: [],
    unreadCount: 0,
    lastTransferNotification: null,
    markNotificationsAsRead: vi.fn(),
    clearNotifications: vi.fn(),
  })
})

afterEach(cleanup)

describe('NotificationBell', () => {
  it('muestra el badge con la cantidad sin leer y la limpia al abrir el panel', async () => {
    const markNotificationsAsRead = vi.fn()
    mocks.useSocket.mockReturnValue({
      notifications: [],
      unreadCount: 2,
      lastTransferNotification: null,
      markNotificationsAsRead,
      clearNotifications: vi.fn(),
    })

    const user = userEvent.setup()
    render(<NotificationBell />)

    expect(screen.getByTestId('notification-badge')).toHaveTextContent('2')
    expect(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    )

    expect(markNotificationsAsRead).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog', { name: 'Centro de notificaciones' })).toBeInTheDocument()
  })

  it('no muestra badge cuando no hay notificaciones sin leer', () => {
    render(<NotificationBell />)
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay notificaciones', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }))

    expect(screen.getByText(/Aún no tienes notificaciones/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Limpiar' }),
    ).not.toBeInTheDocument()
  })

  it('lista las transferencias recibidas y permite limpiar el historial', async () => {
    const clearNotifications = vi.fn()
    mocks.useSocket.mockReturnValue({
      notifications: [
        notificationFixture(),
        notificationFixture({
          transferGroupId: 'group-2',
          amount: 25,
          currency: 'USD',
          description: 'Almuerzo',
        }),
      ],
      unreadCount: 2,
      lastTransferNotification: null,
      markNotificationsAsRead: vi.fn(),
      clearNotifications,
    })

    const user = userEvent.setup()
    render(<NotificationBell />)

    await user.click(screen.getByRole('button', { name: /sin leer/ }))

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('$1.500')).toBeInTheDocument()
    expect(screen.getByText('Almuerzo')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(clearNotifications).toHaveBeenCalledTimes(1)
  })

  it('cierra el panel con Escape y al hacer click fuera', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)

    const trigger = screen.getByRole('button', { name: 'Notificaciones' })
    await user.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Centro de notificaciones' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('dialog', { name: 'Centro de notificaciones' }),
    ).not.toBeInTheDocument()

    await user.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Centro de notificaciones' })).toBeInTheDocument()

    fireEvent.pointerDown(document.body)
    expect(
      screen.queryByRole('dialog', { name: 'Centro de notificaciones' }),
    ).not.toBeInTheDocument()
  })
})
