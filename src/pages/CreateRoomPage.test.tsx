import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ToastProvider } from '@/app/providers/ToastProvider'
import { CreateRoomPage } from '@/pages/CreateRoomPage'
import { FakeAuthService, testUser } from '@/test/fakeAuthService'
import { RoomError } from '@/types/errors'

const mocks = vi.hoisted(() => ({
  createRoom: vi.fn(),
}))

vi.mock('@/services', () => ({
  roomBackend: { createRoom: mocks.createRoom },
  authService: undefined,
  backendLabel: 'test',
}))

function renderCreateRoom(service = new FakeAuthService({ user: testUser })) {
  return render(
    <MemoryRouter initialEntries={['/rooms/create']}>
      <ToastProvider>
        <AuthProvider service={service}>
          <Routes>
            <Route path="/rooms/create" element={<CreateRoomPage />} />
            <Route path="/rooms/:roomId" element={<p>Room detail page</p>} />
            <Route path="/rooms" element={<p>Rooms page</p>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Room name/), 'Graphs and DP')
  await user.type(screen.getByLabelText(/^Subject/), 'DSA')
  await user.type(
    screen.getByLabelText(/^Short description/),
    'Working through graph traversal problems.',
  )
}

describe('CreateRoomPage', () => {
  beforeEach(() => {
    mocks.createRoom.mockReset()
  })

  it('creates a room and opens it', async () => {
    const user = userEvent.setup()
    mocks.createRoom.mockResolvedValue('room-42')
    renderCreateRoom()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'Create room' }))

    expect(await screen.findByText('Room detail page')).toBeInTheDocument()
    expect(mocks.createRoom).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Graphs and DP',
        subject: 'DSA',
        description: 'Working through graph traversal problems.',
        maxCapacity: 6,
      }),
      { uid: testUser.uid, displayName: testUser.displayName },
    )
  })

  it('uses preset capacity controls', async () => {
    const user = userEvent.setup()
    mocks.createRoom.mockResolvedValue('room-43')
    renderCreateRoom()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: '10' }))
    expect(screen.getByLabelText('Maximum capacity')).toHaveValue(10)

    await user.click(screen.getByRole('button', { name: 'Create room' }))
    expect(mocks.createRoom).toHaveBeenCalledWith(
      expect.objectContaining({ maxCapacity: 10 }),
      expect.anything(),
    )
  })

  it('blocks submission when capacity is below the minimum', async () => {
    const user = userEvent.setup()
    renderCreateRoom()

    await fillRequiredFields(user)
    const capacity = screen.getByLabelText('Maximum capacity')
    await user.clear(capacity)
    await user.type(capacity, '1')
    await user.click(screen.getByRole('button', { name: 'Create room' }))

    expect(await screen.findByText('Capacity must be at least 2')).toBeInTheDocument()
    expect(mocks.createRoom).not.toHaveBeenCalled()
  })

  it('shows a friendly error when the backend rejects the room', async () => {
    const user = userEvent.setup()
    mocks.createRoom.mockRejectedValue(new RoomError('permission-denied'))
    renderCreateRoom()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'Create room' }))

    expect(
      (await screen.findAllByText('You do not have permission to do that.')).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('Room not created')).toBeInTheDocument()
  })
})
