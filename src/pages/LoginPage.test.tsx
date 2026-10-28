import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ToastProvider } from '@/app/providers/ToastProvider'
import { LoginPage } from '@/pages/LoginPage'
import { FakeAuthService } from '@/test/fakeAuthService'

function renderLogin(service: FakeAuthService, path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AuthProvider service={service}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/rooms" element={<p>Rooms page</p>} />
            <Route path="/rooms/:roomId" element={<p>Room detail page</p>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('signs in and follows a safe redirect', async () => {
    const user = userEvent.setup()
    const service = new FakeAuthService()
    renderLogin(service, '/login?redirect=%2Frooms%2Froom-42')

    await user.type(screen.getByLabelText(/^Email/), 'student@example.edu')
    await user.type(screen.getByLabelText(/^Password/), 'a-strong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Room detail page')).toBeInTheDocument()
    expect(service.signInCalls).toEqual([
      { email: 'student@example.edu', password: 'a-strong-password' },
    ])
  })

  it('shows a friendly message for invalid credentials and stays on the page', async () => {
    const user = userEvent.setup()
    const error = Object.assign(new Error('Firebase: Error (auth/invalid-credential).'), {
      code: 'auth/invalid-credential',
    })
    const service = new FakeAuthService({ signInError: error })
    renderLogin(service)

    await user.type(screen.getByLabelText(/^Email/), 'student@example.edu')
    await user.type(screen.getByLabelText(/^Password/), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.')
    expect(screen.queryByText('Rooms page')).not.toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderLogin(new FakeAuthService())

    const password = screen.getByLabelText(/^Password/)
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('ignores an external redirect target', async () => {
    const user = userEvent.setup()
    renderLogin(new FakeAuthService(), '/login?redirect=https%3A%2F%2Fevil.example')

    await user.type(screen.getByLabelText(/^Email/), 'student@example.edu')
    await user.type(screen.getByLabelText(/^Password/), 'a-strong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Rooms page')).toBeInTheDocument()
  })
})
