import { avatarStyle, initials } from '@/utils/avatar'
import { cn } from '@/utils/cn'

const sizes = {
  xs: 'size-6 text-[0.6rem]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-base',
  xl: 'size-20 text-xl',
} as const

export function Avatar({
  name,
  uid,
  size = 'md',
  className,
  ring = false,
  title,
}: {
  name: string
  uid: string
  size?: keyof typeof sizes
  className?: string
  ring?: boolean
  title?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold tracking-tight',
        sizes[size],
        avatarStyle(uid),
        ring && 'ring-2 ring-surface',
        className,
      )}
      title={title ?? name}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

export function AvatarStack({
  people,
  max = 3,
}: {
  people: Array<{ uid: string; displayName: string }>
  max?: number
}) {
  const visible = people.slice(0, max)
  const overflow = people.length - visible.length

  return (
    <div className="flex items-center" aria-hidden="true">
      <div className="flex -space-x-2">
        {visible.map((person) => (
          <Avatar key={person.uid} name={person.displayName} uid={person.uid} size="sm" ring />
        ))}
      </div>
      {overflow > 0 ? (
        <span className="ml-2 text-xs font-semibold text-muted">+{overflow}</span>
      ) : null}
    </div>
  )
}
