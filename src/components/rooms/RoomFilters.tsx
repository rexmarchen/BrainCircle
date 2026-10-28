import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { RoomFilterState, RoomSort } from '@/utils/roomFilters'
import { cn } from '@/utils/cn'
import { SUBJECTS } from '@/config/rooms'

const SORT_LABELS: Record<RoomSort, string> = {
  newest: 'Newest first',
  availability: 'Most seats open',
}

export function RoomFilters({
  value,
  onChange,
  subjects,
  resultCount,
  availableSubjects = SUBJECTS,
}: {
  value: RoomFilterState
  onChange: (next: Partial<RoomFilterState>) => void
  subjects: string[]
  resultCount: number
  availableSubjects?: readonly string[]
}) {
  const activeCount =
    (value.query.trim() ? 1 : 0) + (value.subject !== 'all' ? 1 : 0) + (value.availableOnly ? 1 : 0)
  const allSubjects = Array.from(new Set([...subjects, ...availableSubjects])).sort((a, b) =>
    a.localeCompare(b),
  )

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <label htmlFor="room-search" className="sr-only">
            Search rooms by name, subject, or host
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="room-search"
            type="search"
            value={value.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder="Search by room, subject, or host…"
            className="h-11 w-full rounded-xl border border-line bg-canvas/60 pl-10 pr-10 text-sm text-ink transition-colors placeholder:text-muted/80 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-100 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {value.query ? (
            <button
              type="button"
              onClick={() => onChange({ query: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas-deep hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-500"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <div>
            <label htmlFor="subject-filter" className="sr-only">
              Filter by subject
            </label>
            <select
              id="subject-filter"
              value={value.subject}
              onChange={(event) => onChange({ subject: event.target.value })}
              className="h-11 w-full cursor-pointer rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink-soft focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none sm:w-44"
            >
              <option value="all">All subjects</option>
              {allSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort-filter" className="sr-only">
              Sort rooms
            </label>
            <select
              id="sort-filter"
              value={value.sort}
              onChange={(event) => onChange({ sort: event.target.value as RoomSort })}
              className="h-11 w-full cursor-pointer rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink-soft focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none sm:w-44"
            >
              {Object.entries(SORT_LABELS).map(([sortValue, label]) => (
                <option key={sortValue} value={sortValue}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line/70 pt-4">
        <label
          htmlFor="available-only"
          className="group flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink-soft"
        >
          <span className="relative inline-flex">
            <input
              id="available-only"
              type="checkbox"
              checked={value.availableOnly}
              onChange={(event) => onChange({ availableOnly: event.target.checked })}
              className="peer sr-only"
            />
            <span className="block h-6 w-10 rounded-full bg-line-strong transition-colors peer-checked:bg-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500" />
            <span className="pointer-events-none absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
          </span>
          Seats available
        </label>

        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          {resultCount} {resultCount === 1 ? 'room' : 'rooms'}
        </span>

        {activeCount > 0 ? (
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="brand">
              {activeCount} {activeCount === 1 ? 'filter' : 'filters'}
            </Badge>
            <button
              type="button"
              onClick={() => onChange({ query: '', subject: 'all', availableOnly: false })}
              className={cn(
                'rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50',
              )}
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
