import { useEffect, useRef, useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { roomBackend } from '@/services'
import type { RoomMessage } from '@/types/room'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { formatRelativeTime } from '@/utils/format'

interface RoomChatProps {
  roomId: string
  currentUser: { uid: string; displayName: string } | null
  isMember: boolean
}

export function RoomChat({ roomId, currentUser, isMember }: RoomChatProps) {
  const [messages, setMessages] = useState<RoomMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = roomBackend.subscribeMessages(roomId, (msgs) => {
      setMessages(msgs)
    })
    return unsubscribe
  }, [roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputText.trim() || !currentUser || !isMember || sending) return
    const text = inputText.trim()
    setInputText('')
    setSending(true)
    try {
      await roomBackend.sendMessage(roomId, {
        text,
        uid: currentUser.uid,
        displayName: currentUser.displayName,
      })
    } catch {
      setInputText(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[420px] flex-col rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-brand-600" aria-hidden="true" />
          <h3 className="text-sm font-bold text-ink">Quiet Study Chat</h3>
        </div>
        <span className="text-[0.7rem] text-muted">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-xs text-muted">
            <MessageSquare className="size-8 text-muted/40 mb-2" />
            <p className="font-semibold text-ink-soft">No messages yet</p>
            <p className="mt-1 max-w-xs text-muted">
              Share what you're working on, ask a doubt, or drop helpful study links.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.uid === currentUser?.uid
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isMe ? 'flex-row-reverse text-right' : 'flex-row'}`}
              >
                <Avatar name={msg.displayName} uid={msg.uid} size="xs" />
                <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[0.7rem] font-bold text-ink-soft">
                      {isMe ? 'You' : msg.displayName}
                    </span>
                    <span className="text-[0.65rem] text-muted">
                      {formatRelativeTime(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words text-left ${
                      isMe
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-canvas-deep text-ink rounded-tl-none border border-line/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-line p-3">
        {isMember ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a doubt or share a resource link…"
              maxLength={1000}
              className="flex-1 rounded-xl border border-line bg-canvas/60 px-3.5 py-2 text-xs text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputText.trim() || sending}
              loading={sending}
              icon={<Send className="size-3.5" />}
            >
              Send
            </Button>
          </div>
        ) : (
          <p className="text-center text-xs text-muted py-1">
            Take a seat in this room to join the study chat.
          </p>
        )}
      </form>
    </div>
  )
}
