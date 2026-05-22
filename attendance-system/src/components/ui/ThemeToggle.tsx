'use client'
//ThemeToggle.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  showColorTheme?: boolean
  className?: string
}

export default function ThemeToggle({ showColorTheme = false, className }: ThemeToggleProps) {
  const { appUser, updateTheme, updateColorTheme } = useAuth()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [appUser?.theme])

  const toggleDark = async () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    await updateTheme(newTheme)
  }

  const setColorTheme = async (theme: 'blue' | 'ocean') => {
    document.documentElement.setAttribute('data-color-theme', theme)
    await updateColorTheme(theme)
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Dark/Light toggle */}
      <button
        onClick={toggleDark}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
        style={{
          background: 'var(--color-surface-2)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        {isDark
          ? <><HiOutlineSun size={15} /> Light</>
          : <><HiOutlineMoon size={15} /> Dark</>
        }
      </button>

      {/* Color theme switcher */}
      {showColorTheme && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border"
          style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
          <span className="text-xs font-medium mr-1" style={{ color: 'var(--color-text-muted)' }}>Theme:</span>
          <button
            onClick={() => setColorTheme('blue')}
            title="Blue"
            className={cn(
              'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
              appUser?.colorTheme === 'blue' || !appUser?.colorTheme ? 'border-gray-400 scale-110' : 'border-transparent'
            )}
            style={{ background: '#2563eb' }}
          />
          <button
            onClick={() => setColorTheme('ocean')}
            title="Ocean"
            className={cn(
              'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
              appUser?.colorTheme === 'ocean' ? 'border-gray-400 scale-110' : 'border-transparent'
            )}
            style={{ background: '#0ea5e9' }}
          />
        </div>
      )}
    </div>
  )
}
