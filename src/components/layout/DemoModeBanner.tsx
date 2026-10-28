import { Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { appMode } from '@/app/config'

export function DemoModeBanner() {
  if (appMode !== 'demo') return null

  return (
    <div className="border-b border-amber-200/70 bg-amber-50/80">
      <div className="container-page flex items-start gap-2.5 py-2.5 text-xs leading-relaxed text-amber-900 sm:items-center">
        <Info className="mt-0.5 size-3.5 shrink-0 sm:mt-0" aria-hidden="true" />
        <p>
          <span className="font-bold">Demo mode.</span> Rooms and accounts live in this browser
          only. Connect Firebase for live rooms —{' '}
          <Link
            to="/how-it-works#demo"
            className="font-semibold underline underline-offset-2 hover:text-amber-950"
          >
            see setup
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
