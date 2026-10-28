import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RoomCard } from '@/components/rooms/RoomCard'
import { fullRoom, room } from '@/test/factories'

function renderCard(element: ReactElement) {
  return render(<MemoryRouter>{element}</MemoryRouter>)
}

describe('RoomCard', () => {
  it('shows live occupancy and a join action for an open room', async () => {
    const onJoin = vi.fn()
    const user = userEvent.setup()
    renderCard(<RoomCard room={room()} onJoin={onJoin} />)

    expect(screen.getByText('3 seats open')).toBeInTheDocument()
    expect(screen.getByText('1/4')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')

    await user.click(screen.getByRole('button', { name: 'Join Graphs and DP' }))
    expect(onJoin).toHaveBeenCalledWith(expect.objectContaining({ id: 'room-1' }))
  })

  it('disables joining when the room is full', () => {
    renderCard(<RoomCard room={fullRoom()} onJoin={vi.fn()} />)

    const button = screen.getByRole('button', { name: 'Join Graphs and DP' })
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Full')
    expect(screen.getAllByText('Room full').length).toBeGreaterThan(0)
  })

  it('disables joining when the room is closed', () => {
    renderCard(<RoomCard room={room({ status: 'closed' })} onJoin={vi.fn()} />)

    const button = screen.getByRole('button', { name: 'Join Graphs and DP' })
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Closed')
    expect(screen.getAllByText('Closed').length).toBeGreaterThanOrEqual(2)
  })

  it('shows an open action instead of join for existing members', () => {
    renderCard(<RoomCard room={room()} currentUserId="creator" onJoin={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Join Graphs and DP' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open/ })).toBeInTheDocument()
  })

  it('does not allow joining while another join is pending', () => {
    renderCard(<RoomCard room={room()} onJoin={vi.fn()} joining />)

    expect(screen.getByRole('button', { name: 'Join Graphs and DP' })).toBeDisabled()
  })
})
