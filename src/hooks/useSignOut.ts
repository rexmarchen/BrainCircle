import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/app/providers/ToastProvider'

export function useSignOut() {
  const { signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  return useCallback(async () => {
    try {
      await signOut()
      toast.success('Signed out', 'See you at the next study session.')
      navigate('/')
    } catch {
      toast.error('Could not sign out', 'Please try again.')
    }
  }, [navigate, signOut, toast])
}
