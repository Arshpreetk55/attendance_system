import { cn } from '@/lib/utils'
//Loading.tsx
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  text?: string
  className?: string
}

export default function Loading({ size = 'md', fullScreen = false, text, className }: LoadingProps) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn('rounded-full border-[3px] border-t-transparent animate-spin', sizeMap[size])}
        style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}
      />
      {text && (
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        {spinner}
      </div>
    )
  }

  return spinner
}
