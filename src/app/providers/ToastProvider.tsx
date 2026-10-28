import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let counter = 0

const icons = {
  success: <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />,
  error: <AlertCircle className="size-5 text-rose-600" aria-hidden="true" />,
  info: <Info className="size-5 text-brand-600" aria-hidden="true" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'info', duration = 5000 }: ToastOptions) => {
      counter += 1
      const id = `toast-${counter}`
      setToasts((current) => [...current.slice(-2), { id, title, description, variant, duration }])
      const timer = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const currentTimers = timers.current
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer))
      currentTimers.clear()
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      success: (title, description) => toast({ title, description, variant: 'success' }),
      error: (title, description) => toast({ title, description, variant: 'error', duration: 6500 }),
      info: (title, description) => toast({ title, description, variant: 'info' }),
    }),
    [toast, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            <div
              className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:top-5 sm:items-end"
              aria-live="polite"
              aria-relevant="additions"
            >
              {toasts.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-xl border bg-surface p-4 shadow-pop',
                    item.variant === 'error' ? 'border-rose-100' : 'border-line',
                  )}
                  role={item.variant === 'error' ? 'alert' : 'status'}
                >
                  <span className="mt-0.5 shrink-0">{icons[item.variant]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{item.title}</p>
                    {item.description ? (
                      <p className="mt-0.5 text-sm leading-relaxed text-muted">{item.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(item.id)}
                    className="-m-1 rounded-lg p-1 text-muted transition-colors hover:bg-canvas-deep hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-500"
                    aria-label="Dismiss notification"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside a ToastProvider')
  return context
}
