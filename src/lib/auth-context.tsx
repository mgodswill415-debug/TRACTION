'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Types
interface UserProfile {
  id: string
  email: string
  full_name?: string
  whatsapp?: string
  company?: string
  avatar_url?: string
  plan: 'free' | 'pro' | 'enterprise'
  analyses_count: number
  created_at: string
}

interface AuthContextType {
  user: SupabaseUser | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, userData: { full_name?: string; whatsapp?: string }) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
}

// Validate Supabase URL
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || url.includes('your-')) return null
  
  try {
    new URL(url)
    return url
  } catch {
    return null
  }
}

const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create client only if configured
let supabase: ReturnType<typeof createClient> | null = null
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

// Context
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ error: null })
})

// Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    if (!supabase) return null
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.log('Profile not found yet (may be new user)')
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Fetch profile error:', error)
      return null
    }
  }

  // Create profile for new users
  const createProfile = async (userId: string, email: string, userData: { full_name?: string; whatsapp?: string }) => {
    if (!supabase) return null

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name: userData.full_name || null,
          // Store whatsapp in company field temporarily or we can add a column
          company: userData.whatsapp ? `WhatsApp: ${userData.whatsapp}` : null,
          plan: 'free',
          analyses_count: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Create profile error:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Create profile error:', error)
      return null
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true
    
    // Safety timeout - ensure loading is never stuck for more than 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('⏰ Auth: Safety timeout reached - forcing loading false')
        setLoading(false)
      }
    }, 5000)
    
    if (!supabase) {
      console.log('⚠️ Auth: No supabase client - skipping auth')
      setLoading(false)
      clearTimeout(safetyTimeout)
      return
    }

    console.log('🔐 Auth: Checking session...')

    // Get initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return
        clearTimeout(safetyTimeout) // Clear timeout on success
        
        if (error) {
          console.error('❌ Auth: Session error:', error.message)
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('✅ Auth: User found:', session.user.email)
          fetchProfile(session.user.id).then(profile => {
            if (mounted) {
              setProfile(profile)
              setLoading(false)
            }
          }).catch(() => {
            if (mounted) setLoading(false)
          })
        } else {
          console.log('✅ Auth: No user session')
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('❌ Auth: Failed to get session:', err?.message || err)
        if (mounted) setLoading(false)
        clearTimeout(safetyTimeout)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        
        console.log('🔄 Auth state changed:', _event, session?.user?.email || 'no user')
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id)
          
          if (!userProfile && _event === 'SIGNED_IN') {
            // Profile will be created in signUp function
            setLoading(false)
          } else {
            setProfile(userProfile)
            setLoading(false)
          }
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => { 
      mounted = false 
      subscription.unsubscribe() 
      clearTimeout(safetyTimeout)
    }
  }, [])

  // Sign Up with Email/Password
  const signUp = async (
    email: string, 
    password: string, 
    userData: { full_name?: string; whatsapp?: string }
  ): Promise<{ error: AuthError | null }> => {
    if (!supabase) {
      return { error: { name: 'AuthError', message: 'Supabase not configured', status: 503 } as AuthError }
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            whatsapp: userData.whatsapp
          }
        }
      })

      if (error) {
        return { error }
      }

      // If signup successful, create profile
      // Note: User might need email confirmation first depending on Supabase settings
      return { error: null }
    } catch (error: any) {
      return { error: error as AuthError }
    }
  }

  // Sign In with Email/Password
  const signIn = async (
    email: string, 
    password: string
  ): Promise<{ error: AuthError | null }> => {
    if (!supabase) {
      return { error: { name: 'AuthError', message: 'Supabase not configured', status: 503 } as AuthError }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error: any) {
      return { error: error as AuthError }
    }
  }

  // Sign Out
  const signOut = async () => {
    if (!supabase) return

    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Update Profile
  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error: Error | null }> => {
    if (!supabase || !user) {
      return { error: new Error('Not authenticated') }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        return { error }
      }

      // Refresh profile
      const updatedProfile = await fetchProfile(user.id)
      setProfile(updatedProfile)

      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
