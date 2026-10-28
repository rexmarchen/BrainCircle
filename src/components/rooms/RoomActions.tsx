import { Check, Copy, Loader2, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { Button } from '@/components/ui/Button'
import type { ConnectionStatus } from '@/hooks/useConnectionStatus'
import { cn } from '@/utils/cn'

export function ConnectionPill({ status }: { status: ConnectionStatus }) {
  const palette =
    status === 'online'
      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
      : status === 'connecting'
        ? 'border-brand-100 bg-brand-50 text-brand-700'
        : 'border-amber-200 bg-amber-50 text-amber-800'
  const label = status === 'online' ? 'Live' : status === 'connecting' ? 'Connecting' : 'Offline'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        palette,
      )}
      role="status"
      aria-live="polite"
    >
      {status === 'connecting' ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : status === 'online' ? (
        <Wifi className="size-3.5" aria-hidden="true" />
      ) : (
        <WifiOff className="size-3.5" aria-hidden="true" />
      )}
      {label}
    </span>
  )
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export function CopyLinkButton({ roomName }: { roomName: string }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const [copying, setCopying] = useState(false)

  const copy = async () => {
    setCopying(true)
    try {
      await copyText(window.location.href)
      setCopied(true)
      toast.success('Link copied', `Share ${roomName} with your study circle.`)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      toast.error('Could not copy the link', 'Copy the address from your browser instead.')
    } finally {
      setCopying(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="md"
      onClick={copy}
      loading={copying}
      icon={copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
    >
      {copied ? 'Copied' : 'Copy link'}
    </Button>
  )
}
