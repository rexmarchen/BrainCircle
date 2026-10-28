import { useEffect, useState } from 'react'
import { FileText, Save, Check, Copy } from 'lucide-react'
import { roomBackend } from '@/services'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/app/providers/ToastProvider'
import { formatRelativeTime } from '@/utils/format'

interface RoomNotesProps {
  roomId: string
  currentUser: { uid: string; displayName: string } | null
  isMember: boolean
}

export function RoomNotes({ roomId, currentUser, isMember }: RoomNotesProps) {
  const [content, setContent] = useState('')
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const [updatedBy, setUpdatedBy] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const unsubscribe = roomBackend.subscribeNotes(roomId, (note) => {
      if (note) {
        setContent(note.content)
        setUpdatedAt(note.updatedAt)
        setUpdatedBy(note.updatedBy)
      }
    })
    return unsubscribe
  }, [roomId])

  const handleSave = async () => {
    if (!currentUser || !isMember) return
    setSaving(true)
    try {
      await roomBackend.saveNotes(roomId, content, currentUser)
      toast.success('Notes saved', 'Shared with everyone in the room.')
    } catch {
      toast.error('Could not save notes', 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="flex h-[420px] flex-col rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-brand-600" aria-hidden="true" />
          <h3 className="text-sm font-bold text-ink">Shared Study Scratchpad</h3>
        </div>
        <div className="flex items-center gap-2">
          {updatedAt ? (
            <span className="text-[0.7rem] text-muted hidden sm:inline">
              Saved by {updatedBy} {formatRelativeTime(updatedAt)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!content}
            className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[0.7rem] font-semibold text-ink-soft hover:bg-canvas-deep disabled:opacity-40"
            title="Copy notes to clipboard"
          >
            {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="flex-1 p-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!isMember}
          placeholder={
            isMember
              ? 'Shared notes, code snippets, key formulas, or reference links for this session…'
              : 'Join this room to view and edit shared notes.'
          }
          className="size-full resize-none rounded-xl border border-line/60 bg-canvas/40 p-3 font-mono text-xs leading-relaxed text-ink placeholder:text-muted focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-70"
        />
      </div>

      {isMember ? (
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 bg-canvas/30">
          <span className="text-[0.7rem] text-muted">
            Collaborative notes sync across all members.
          </span>
          <Button
            size="sm"
            onClick={handleSave}
            loading={saving}
            icon={<Save className="size-3.5" />}
          >
            Save Notes
          </Button>
        </div>
      ) : null}
    </div>
  )
}
