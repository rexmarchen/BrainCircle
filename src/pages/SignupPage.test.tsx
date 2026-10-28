import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ToastProvider } from '@/app/providers/ToastProvider'
import { SignupPage } from '@/pages/SignupPage'
import { FakeAuthService } from '@/test/fakeAuthService'

function renderSignup(service: FakeAuthService) {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <ToastProvider>
        <AuthProvider service={service}>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/rooms" element={<p>Rooms page</p>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('SignupPage', () => {
  it('creates an account and navigates to the rooms page', async () => {
    const user = userEvent.setup()
    const service = new FakeAuthService()
    renderSignup(service)

    await user.type(screen.getByLabelText(/^Display name/), 'Ananya Sharma')
    await user.type(screen.getByLabelText(/^Email/), 'ananya@university.edu')
    await user.type(screen.getByLabelText(/^Password/), 'a-strong-password')
    await user.type(screen.getByLabelText(/^Confirm password/), 'a-strong-password')
    await user.click(screen.getByRole('button', { name: 'Create free account' }))

    expect(await screen.findByText('Rooms page')).toBeInTheDocument()
    expect(service.signUpCalls).toEqual([
      {
        displayName: 'Ananya Sharma',
        email: 'ananya@university.edu',
        password: 'a-strong-password',
      },
    ])
  })

  it('validates mismatched passwords before calling the service', async () => {
    const user = userEvent.setup()
    const service = new FakeAuthService()
    renderSignup(service)

    await user.type(screen.getByLabelText(/^Display name/), 'Ananya Sharma')
    await user.type(screen.getByLabelText(/^Email/), 'ananya@university.edu')
    await user.type(screen.getByLabelText(/^Password/), 'a-strong-password')
    await user.type(screen.getByLabelText(/^Confirm password/), 'another-password')
    await user.click(screen.getByRole('button', { name: 'Create free account' }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(service.signUpCalls).toHaveLength(0)
  })

  it('requires a display name of at least two characters', async () => {
    const user = userEvent.setup()
    renderSignup(new FakeAuthService())

    await user.type(screen.getByLabelText(/^Display name/), 'A')
    await user.type(screen.getByLabelText(/^Email/), 'ananya@university.edu')
    await user.type(screen.getByLabelText(/^Password/), 'a-strong-password')
    await user.type(screen.getByLabelText(/^Confirm password/), 'a-strong-password')
    await user.click(screen.getByRole('button', { name: 'Create free account' }))

    expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument()
  })
})
