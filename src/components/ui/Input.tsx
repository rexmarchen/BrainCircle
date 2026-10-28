import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

const control =
  'w-full rounded-xl border border-line bg-surface px-3.5 text-[0.95rem] text-ink shadow-[0_1px_1px_rgba(16,24,40,0.02)] transition-colors placeholder:text-muted/70 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none disabled:cursor-not-allowed disabled:bg-canvas-deep/70 disabled:text-muted'

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-semibold text-ink">
      {children}
      {required ? (
        <span className="text-brand-600" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  )
}

interface InputProps extends ComponentPropsWithRef<'input'> {
  label: string
  hint?: string
  error?: string
  icon?: ReactNode
  trailing?: ReactNode
}

export function Input({
  label,
  hint,
  error,
  icon,
  trailing,
  className,
  id,
  required,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descriptionId = `${inputId}-description`

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={inputId} required={required}>
        {label}
      </FieldLabel>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? descriptionId : undefined}
          className={cn(
            control,
            'h-11',
            icon && 'pl-10',
            trailing && 'pr-11',
            error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100',
            className,
          )}
          {...props}
        />
        {trailing ? (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </div>
      {error ? (
        <p id={descriptionId} className="text-sm font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={descriptionId} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  label: string
  hint?: string
  error?: string
  maxLength?: number
  showCount?: boolean
}

export function Textarea({
  label,
  hint,
  error,
  className,
  id,
  required,
  maxLength,
  showCount,
  value,
  ...props
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const descriptionId = `${textareaId}-description`
  const length = typeof value === 'string' ? value.length : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel htmlFor={textareaId} required={required}>
          {label}
        </FieldLabel>
        {showCount && maxLength ? (
          <span className="text-xs tabular-nums text-muted">
            {length}/{maxLength}
          </span>
        ) : null}
      </div>
      <textarea
        id={textareaId}
        required={required}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? descriptionId : undefined}
        className={cn(
          control,
          'min-h-24 resize-y py-3 leading-relaxed',
          error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={descriptionId} className="text-sm font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={descriptionId} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface SelectProps extends ComponentPropsWithRef<'select'> {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

export function Select({
  label,
  hint,
  error,
  className,
  id,
  required,
  children,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const descriptionId = `${selectId}-description`

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={selectId} required={required}>
        {label}
      </FieldLabel>
      <select
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? descriptionId : undefined}
        className={cn(
          control,
          'h-11 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10',
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23667085' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
          error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={descriptionId} className="text-sm font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={descriptionId} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
