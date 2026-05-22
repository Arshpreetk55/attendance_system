'use client'
//Sidebar.tsx

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { HiOutlineLogout, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'

interface SidebarLink {
  href: string
  label: string
  icon: React.ReactNode
}

interface SidebarProps {
  links: SidebarLink[]
  portalName: string
}

export default function Sidebar({ links, portalName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { appUser, signOut } = useAuth()

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300 z-30',
        collapsed ? 'w-16' : 'w-64'
      )}
      style={{ background: 'var(--color-sidebar)' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-400 flex items-center justify-center text-white font-display font-bold text-lg">
              A
            </div>
            <div>
              <p className="font-display font-bold text-white text-base leading-tight">AttendX</p>
              <p className="text-xs" style={{ color: 'var(--color-sidebar-text)', opacity: 0.7 }}>{portalName}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-blue-200 ml-auto"
        >
          {collapsed ? <HiOutlineChevronRight size={16} /> : <HiOutlineChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-1">
        {links.map(link => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link key={link.href} href={link.href}
              title={collapsed ? link.label : undefined}
              className={cn(
                'sidebar-link',
                collapsed ? 'justify-center px-2' : '',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-blue-200 hover:bg-white/8 hover:text-white'
              )}
              style={isActive ? { background: 'rgba(255,255,255,0.15)' } : {}}>
              <span className="flex-shrink-0">{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {!collapsed && appUser && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {appUser.displayName?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{appUser.displayName}</p>
              <p className="text-xs capitalize truncate" style={{ color: 'var(--color-sidebar-text)', opacity: 0.7 }}>
                {appUser.role}
              </p>
            </div>
          </div>
        )}
        <button onClick={signOut}
          className={cn(
            'sidebar-link w-full text-red-300 hover:bg-red-500/20 hover:text-red-200',
            collapsed ? 'justify-center px-2' : ''
          )}>
          <HiOutlineLogout size={18} />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  )
}
