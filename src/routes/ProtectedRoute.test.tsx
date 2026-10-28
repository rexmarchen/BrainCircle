import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { FakeAuthService, testUser } from '@/test/fakeAuthService'

function LoginProbe() {
  const location = useLocation()
  return <p>Login page {location.search}</p>
}

function renderProtected(service: FakeAuthService, initialPath = '/rooms/new?draft=1') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider service={service}>
        <Routes>
          <Route
            path="/rooms/new"
            element={
              <ProtectedRoute>
                <p>Protected room form</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginProbe />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects signed-out visitors to login with the full intended path', async () => {
    renderProtected(new FakeAuthService())

    expect(await screen.findByText(/login page/i)).toHaveTextContent(
      '?redirect=%2Frooms%2Fnew%3Fdraft%3D1',
    )
  })

  it('renders children for signed-in users', async () => {
    renderProtected(new FakeAuthService({ user: testUser }))

    expect(await screen.findByText('Protected room form')).toBeInTheDocument()
    expect(screen.queryByText(/login page/i)).not.toBeInTheDocument()
  })
})
