'use client'

import { useState } from 'react'
import { 
  Upload, FileText, BarChart3, LogOut, Menu, X, 
  ArrowRight, CheckCircle2, Clock, TrendingUp, AlertTriangle,
  Download, Share2, ChevronRight, Sparkles,
  Shield, Zap, Globe, Users, Eye, Plus,
  Home as HomeIcon, FolderOpen, ClipboardList, User,
  Brain, AlertCircle, MessageSquare, Send,
  Pencil, Trash2, RefreshCw, Loader2
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

// Types
interface Analysis {
  id: string
  name: string
  date: string
  status: 'completed' | 'processing' | 'queued'
}

// Logo Component
function TractionLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }
  return (
    <div className="flex items-center gap-2">
      <div className={`font-bold ${sizes[size]} tracking-tight`}>
        <span className="text-[#C8956C]">T</span>
        <span className="text-white">RACTION</span>
      </div>
    </div>
  )
}

// Landing Page
function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#2A2A2A] bg-[#0A0A0A]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <TractionLogo size="sm" />
            <button 
              onClick={onGetStarted}
              className="bg-[#5D4037] hover:bg-[#4A332C] text-white px-6 py-2 rounded-md transition-colors"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-1 border border-[#5D4037] rounded-full text-[#C8956C] text-sm">
            ✨ AI-Powered Business Intelligence
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold mb-6">
            Your Business, <span className="text-[#C8956C]">Decoded</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
            Get actionable business insights in <span className="text-white font-semibold">12 hours</span>, not 12 weeks.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onGetStarted}
              className="bg-[#5D4037] hover:bg-[#4A332C] text-white px-8 py-4 text-lg rounded-md transition-colors flex items-center justify-center"
            >
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border border-[#2A2A2A] text-gray-300 hover:bg-[#141414] px-8 py-4 text-lg rounded-md transition-colors">
              View Sample Report
            </button>
          </div>

          <p className="mt-6 text-sm text-gray-500">No credit card required • Free during MVP</p>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: Brain, title: 'AI Analysis', desc: 'DeepSeek AI analyzes your business in minutes' },
            { icon: BarChart3, title: 'Actionable Insights', desc: 'Clear recommendations you can implement today' },
            { icon: Shield, title: 'Secure & Private', desc: 'Your data stays yours, always encrypted' }
          ].map((f, i) => (
            <div key={i} className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
              <f.icon className="w-10 h-10 text-[#C8956C] mb-4" />
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-b from-[#141414] to-[#0A0A0A] border border-[#5D4037]/30 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-gray-400 mb-8">Join businesses using Traction for smarter decisions.</p>
          <button 
            onClick={onGetStarted}
            className="bg-[#5D4037] hover:bg-[#4A332C] text-white px-10 py-4 text-lg rounded-md transition-colors inline-flex items-center"
          >
            Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-[#2A2A2A] py-8 px-4 text-center text-gray-600 text-sm">
        © 2024 Traction. All rights reserved. Free during MVP phase.
      </footer>
    </div>
  )
}

// Auth Page
function AuthPage({ mode, onModeSwitch }: { mode: 'login' | 'signup'; onModeSwitch: (mode: 'login' | 'signup') => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ name: '', email: '', password: '', whatsapp: '' })
  const { signUp, signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'signup') {
      const { error: signUpError } = await signUp(formData.email, formData.password, { full_name: formData.name, whatsapp: formData.whatsapp })
      if (signUpError) setError(signUpError.message)
    } else {
      const { error: signInError } = await signIn(formData.email, formData.password)
      if (signInError) setError(signInError.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <TractionLogo size="lg" />
          <p className="mt-4 text-gray-400">{mode === 'login' ? 'Welcome back to Traction' : 'Start your free journey'}</p>
        </div>
        
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-md text-white focus:outline-none focus:border-[#5D4037]"
                  required 
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-md text-white focus:outline-none focus:border-[#5D4037]"
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-md text-white focus:outline-none focus:border-[#5D4037]"
                required 
                minLength={6}
              />
            </div>
            
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp Number (Optional)</label>
                <input 
                  type="text" 
                  placeholder="+234 XXX XXX XXXX" 
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-md text-white focus:outline-none focus:border-[#5D4037]"
                />
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#5D4037] hover:bg-[#4A332C] text-white py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => onModeSwitch(mode === 'login' ? 'signup' : 'login')} 
              className="text-[#C8956C] hover:underline"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sidebar Component
function ChatGPTSidebar({ activeTab, setActiveTab, user, onLogout }: any) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#141414] rounded-lg border border-[#2A2A2A]">
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#111111] border-r border-[#2A2A2A] transition-transform duration-200 flex flex-col`}>
        <div className="p-4 border-b border-[#2A2A2A]">
          <TractionLogo size="sm" />
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <button onClick={() => setActiveTab('welcome')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === 'welcome' ? 'bg-[#1a1a1a] text-white' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}>
            <HomeIcon className="w-4 h-4" /> New Analysis
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === 'reports' ? 'bg-[#1a1a1a] text-white' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}>
            <FolderOpen className="w-4 h-4" /> Saved Reports
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === 'settings' ? 'bg-[#1a1a1a] text-white' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}>
            <Settings className="w-4 h-4" /> Settings
          </button>
        </nav>

        <div className="p-3 border-t border-[#2A2A2A] space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#5D4037] flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/20 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden" />}
    </>
  )
}

function Settings() { 
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <p className="text-gray-400">Coming soon...</p>
    </div> 
  )
}

// MAIN COMPONENT
export default function Home() {
  const { user: supabaseUser, profile, loading: authLoading, isAuthenticated, signIn, signUp, signOut } = useAuth()
  
  const [view, setView] = useState<'landing' | 'auth'>('landing')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [activeTab, setActiveTab] = useState('welcome')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [businessUrl, setBusinessUrl] = useState('')
  
  const [user, setUser] = useState({ id: '1', name: 'User', email: '' })

  // Update user when auth state changes
  if (supabaseUser && isAuthenticated && (user.id === '1' || user.email !== supabaseUser.email)) {
    setUser({
      id: supabaseUser.id,
      name: profile?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
    })
  }

  const handleGetStarted = () => setView('auth')
  
  const handleLogout = async () => {
    await signOut()
    setActiveTab('welcome')
    setView('landing')
    setUser({ id: '1', name: 'User', email: '' })
  }

  const startAnalysis = async () => {
    if (!inputValue.trim()) return
    
    setIsAnalyzing(true)
    setActiveTab('analyzing')
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: inputValue,
          businessUrl: businessUrl,
          userId: supabaseUser?.id || null
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setTimeout(() => {
          setActiveTab('results')
          setIsAnalyzing(false)
        }, 3000)
      } else {
        setIsAnalyzing(false)
        setActiveTab('welcome')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setIsAnalyzing(false)
      setActiveTab('welcome')
    }
  }

  // Show landing or auth pages when not authenticated
  if (!isAuthenticated) {
    if (view === 'landing') {
      return <LandingPage onGetStarted={handleGetStarted} />
    }
    return <AuthPage mode={authMode} onModeSwitch={setAuthMode} />
  }
  
  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8956C]" />
      </div>
    )
  }

  // Main App Layout
  return (
    <div className="h-screen flex bg-[#0A0A0A] overflow-hidden">
      <ChatGPTSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'welcome' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Welcome to Traction</h1>
                <p className="text-gray-400">Enter your business details to get started</p>
              </div>
              
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Business Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Acme Corp" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-md text-white focus:outline-none focus:border-[#5D4037]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Website URL (Optional)</label>
                  <input 
                    type="url" 
                    placeholder="https://example.com" 
                    value={businessUrl}
                    onChange={(e) => setBusinessUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-md text-white focus:outline-none focus:border-[#5D4037]"
                  />
                </div>
                <button 
                  onClick={startAnalysis} 
                  disabled={!inputValue.trim()}
                  className="w-full bg-[#5D4037] hover:bg-[#4A332C] text-white py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Analyze My Business
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analyzing' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#141414] border border-[#2A2A2A] rounded-lg p-8 text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-[#2A2A2A]" />
                <div className="absolute inset-0 rounded-full border-4 transparent border-t-[#C8956C] animate-spin" />
                <Brain className="absolute inset-0 m-auto w-10 h-10 text-[#C8956C]" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">Analyzing Your Business</h3>
                <p className="text-gray-400 text-sm">Our AI is examining {inputValue}</p>
              </div>

              <div className="w-full bg-[#2A2A2A] rounded-full h-2">
                <div className="bg-[#C8956C] h-2 rounded-full w-2/3"></div>
              </div>

              <div className="space-y-2 text-left text-sm">
                {['Collecting business data...', 'Running AI analysis...', 'Generating insights...'].map((step, i) => (
                  <div key={i} className={`flex items-center gap-2 ${i < 2 ? 'text-green-400' : 'text-gray-500'}`}>
                    {i < 2 ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{inputValue}</h1>
                  <p className="text-gray-400 text-sm">Analysis Complete</p>
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1 border border-green-500 text-green-400 rounded-full text-sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Score: 85/100
                </div>
              </div>

              <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3">Executive Summary</h2>
                <p className="text-gray-300">Your business shows strong potential with several areas for optimization.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Key Findings</h3>
                  <div className="space-y-2">
                    {['High operational costs detected', 'Revenue leakage identified'].map((f, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-[#0A0A0A] rounded">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Recommendations</h3>
                  <div className="space-y-2">
                    {['Optimize pricing strategy', 'Improve customer retention'].map((r, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-[#0A0A0A] rounded">
                        <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="bg-[#5D4037] hover:bg-[#4A332C] text-white px-4 py-2 rounded-md flex items-center">
                  <Download className="w-4 h-4 mr-2" /> Export PDF
                </button>
                <button className="border border-[#2A2A2A] text-gray-300 hover:bg-[#141414] px-4 py-2 rounded-md flex items-center">
                  <Share2 className="w-4 h-4 mr-2" /> Share Report
                </button>
                <button 
                  onClick={() => setActiveTab('welcome')}
                  className="text-gray-400 ml-auto hover:text-white"
                >
                  New Analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Saved Reports</h1>
              <div className="text-center py-12 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No saved reports yet</p>
                <p className="text-sm mt-2">Complete your first analysis to see it here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  )
}
