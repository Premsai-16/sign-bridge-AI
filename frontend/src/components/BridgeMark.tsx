import { useId } from 'react'

/** Two reaching arches meet at a shared point: a bridge between ways of communicating. */
export default function BridgeMark({ className = '' }: { className?: string }) {
  const gradient = useId()
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true"><defs><linearGradient id={gradient} x1="5" y1="52" x2="58" y2="8" gradientUnits="userSpaceOnUse"><stop stopColor="#14b8a6"/><stop offset=".45" stopColor="#6366f1"/><stop offset=".75" stopColor="#d946ef"/><stop offset="1" stopColor="#fb923c"/></linearGradient></defs><path d="M9 48V30c0-11 8-18 18-18v36M55 48V30c0-11-8-18-18-18v36M9 36c11 0 12-9 23-9s12 9 23 9" stroke={`url(#${gradient})`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="32" cy="53" r="3" fill={`url(#${gradient})`}/></svg>
}
