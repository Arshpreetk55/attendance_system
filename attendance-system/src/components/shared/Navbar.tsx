      //Navbar.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  HiOutlineBell, HiOutlineMenu, HiOutlineX, HiOutlineSun,
  HiOutlineMoon, HiOutlineLogout, HiOutlineUser,
} from 'react-icons/hi'

interface NavbarProps {
  portalName: string
  links: { href: string; label: string }[]
}

export default function Navbar({ portalName, links }: NavbarProps) {
  const { appUser, signOut, updateTheme } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
const [isDark, setIsDark] = useState(false)
useEffect(() => {
  setIsDark(document.documentElement.classList.contains('dark'))
}, [appUser?.theme])
  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    updateTheme(newTheme)
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b" style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-display font-bold"
              style={{ background: 'var(--color-primary)' }}>
              A
            </div>
            <div>
              <span className="font-display font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                AttendX
              </span>
              <span className="hidden sm:inline text-xs ml-1.5 px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'var(--color-surface-2)', color: 'var(--color-primary)' }}>
                {portalName}
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link key={link.href} href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-white'
                    : 'hover:opacity-80'
                )}
                style={{
                  background: pathname === link.href ? 'var(--color-primary)' : 'transparent',
                  color: pathname === link.href ? 'white' : 'var(--color-text-muted)',
                }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}>
              {isDark ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
            </button>

            {/* Notifications */}
            {appUser && (
              <button className="relative p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}>
                <HiOutlineBell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
              </button>
            )}

            {/* User Menu */}
            {appUser && (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'var(--color-primary)' }}>
                    {appUser.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {appUser.displayName?.split(' ')[0]}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-card-hover border py-1 z-50"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {appUser.displayName}
                      </p>
                      <p className="text-xs capitalize" style={{ color: 'var(--color-text-muted)' }}>
                        {appUser.role}
                      </p>
                    </div>
                    <button onClick={() => { signOut(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors">
                      <HiOutlineLogout size={15} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger */}
            <button className="md:hidden p-2 rounded-lg"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}
              onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <HiOutlineX size={20} /> : <HiOutlineMenu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-3 flex flex-col gap-1 animate-slide-up"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
            {links.map(link => (
              <Link key={link.href} href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  pathname === link.href ? 'text-white' : ''
                )}
                style={{
                  background: pathname === link.href ? 'var(--color-primary)' : 'var(--color-surface-2)',
                  color: pathname === link.href ? 'white' : 'var(--color-text)',
                }}>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Overlay to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  )
}
