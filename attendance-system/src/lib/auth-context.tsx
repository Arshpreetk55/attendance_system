'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserById, createUser, updateUser } from '@/lib/db'
import type { AppUser, UserRole } from '@/types'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user:              User | null
  appUser:           AppUser | null
  loading:           boolean
  signIn:            (email: string, password: string) => Promise<AppUser>
  signUp:            (email: string, password: string, userData: Partial<AppUser> & { role?: UserRole }) => Promise<void>
  signOut:           () => Promise<void>
  resetPassword:     (email: string) => Promise<void>
  changePassword:    (currentPassword: string, newPassword: string) => Promise<void>
  updateProfileInfo: (data: { displayName?: string; photoURL?: string }) => Promise<void>
  updateTheme:       (theme: 'light' | 'dark') => Promise<void>
  updateColorTheme:  (colorTheme: 'blue' | 'ocean') => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const userData = await getUserById(firebaseUser.uid)
        setAppUser(userData)
        if (userData?.theme === 'dark') {
          document.documentElement.classList.add('dark')
          localStorage.setItem('theme', 'dark')
        } else {
          document.documentElement.classList.remove('dark')
          localStorage.setItem('theme', 'light')
        }
      } else {
        setAppUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = async (email: string, password: string): Promise<AppUser> => {
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password)
    const userData = await getUserById(firebaseUser.uid)
    if (!userData) throw new Error('User data not found')
    setAppUser(userData)
    return userData
  }

  const signUp = async (
    email:    string,
    password: string,
    userData: Partial<AppUser> & { role?: UserRole },
  ): Promise<void> => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)
    if (userData.displayName) {
      await updateProfile(firebaseUser, { displayName: userData.displayName })
    }
    await createUser(firebaseUser.uid, {
      email,
      displayName:      userData.displayName || '',
      role:             userData.role || 'teacher',
      theme:            'light',
      colorTheme:       'blue',
      isFirstLogin:     true,
      showProfileSetup: false,
      ...userData,
    } as Omit<AppUser, 'uid'>)
  }

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth)
    setUser(null)
    setAppUser(null)
    router.push('/')
  }

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email)
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user || !user.email) throw new Error('Not logged in')
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword)
    await updateUser(user.uid, { isFirstLogin: false } as Partial<AppUser>)
    setAppUser(prev => prev ? { ...prev, isFirstLogin: false } : null)
  }

  const updateProfileInfo = async (data: { displayName?: string; photoURL?: string }): Promise<void> => {
    if (!user) throw new Error('Not logged in')
    await updateProfile(user, data)
    const updates: Partial<AppUser> = {}
    if (data.displayName) updates.displayName = data.displayName
    if (data.photoURL) updates.photoURL = data.photoURL
    await updateUser(user.uid, updates)
    setAppUser(prev => prev ? ({ ...prev, ...updates } as AppUser) : null)
  }

  const updateTheme = async (theme: 'light' | 'dark'): Promise<void> => {
    if (!user) return
    await updateUser(user.uid, { theme })
    setAppUser(prev => prev ? { ...prev, theme } : null)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const updateColorTheme = async (colorTheme: 'blue' | 'ocean'): Promise<void> => {
    if (!user) return
    await updateUser(user.uid, { colorTheme })
    setAppUser(prev => prev ? { ...prev, colorTheme } : null)
    document.documentElement.setAttribute('data-color-theme', colorTheme)
  }

  return (
    <AuthContext.Provider value={{
      user, appUser, loading,
      signIn, signUp, signOut, resetPassword,
      changePassword, updateProfileInfo,
      updateTheme, updateColorTheme,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}