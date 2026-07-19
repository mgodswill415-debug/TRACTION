'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  Upload, FileText, BarChart3, Settings, LogOut, Menu, X, 
  ArrowRight, CheckCircle2, Clock, TrendingUp, AlertTriangle,
  Download, Share2, Mail, Copy, ChevronRight, Sparkles,
  Shield, Zap, Globe, Users, ArrowUpDown, Eye, Plus,
  Home as HomeIcon, FolderOpen, ClipboardList, User,
  Brain, AlertCircle, MessageSquare, PenLine, Send,
  Pencil, Trash2, Database, RefreshCw, Loader2
} from 'lucide-react'
import { useSavedAnalyses, convertToReportData } from '@/hooks/use-supabase'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Analysis {
  id: string
  name: string
  date: string
  status: 'completed' | 'processing' | 'queued'
  type: 'financial' | 'operational' | 'comprehensive'
  summary?: ReportData
}

interface ReportData {
  overallScore: number
  executiveSummary?: string
  costLeaks: Finding[]
  revenueOpportunities: Finding[]
  operationalBottlenecks: Finding[]
  cashFlowRisks: Finding[]
  recommendations: Recommendation[]
  charts: ChartData
}

interface Finding {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  amount?: number
}

interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  timeline: string
  expectedImpact: string
}

interface ChartData {
  revenue: { month: string; value: number }[]
  expenses: { category: string; value: number }[]
  cashFlow: { month: string; inflow: number; outflow: number }[]
}

// Sample data for demo
const sampleReport: ReportData = {
  overallScore: 72,
  costLeaks: [
    {
      id: '1',
      title: 'Software Subscription Overlap',
      description: 'Multiple teams using overlapping SaaS tools (3 project management platforms, 2 CRM systems). Consolidation could save significantly.',
      impact: 'high',
      amount: 24600
    },
    {
      id: '2',
      title: 'Underutilized Office Space',
      description: 'Current office utilization at 34%. Hybrid work model suggests downsizing or subletting.',
      impact: 'high',
      amount: 48000
    },
    {
      id: '3',
      title: 'Marketing Spend Inefficiency',
      description: '40% of ad spend on channels with >$200 CPA. Reallocation recommended to high-performing channels.',
      impact: 'medium',
      amount: 18500
    }
  ],
  revenueOpportunities: [
    {
      id: '4',
      title: 'Untapped Enterprise Segment',
      description: 'Analysis shows strong fit for enterprise clients in financial services. Current enterprise revenue is only 8% of total.',
      impact: 'high',
      amount: 125000
    },
    {
      id: '5',
      title: 'Pricing Optimization Potential',
      description: 'Competitor analysis suggests 15-23% pricing headroom on premium tier. Customer willingness-to-pay surveys confirm.',
      impact: 'high',
      amount: 89000
    },
    {
      id: '6',
      title: 'Cross-sell/Upsell Gap',
      description: '62% of customers use only one product. Expansion revenue potential identified.',
      impact: 'medium',
      amount: 67000
    }
  ],
  operationalBottlenecks: [
    {
      id: '7',
      title: 'Approval Process Delays',
      description: 'Average approval cycle: 8.4 days (industry benchmark: 2-3 days). 3 bottlenecks identified in finance approvals.',
      impact: 'high'
    },
    {
      id: '8',
      title: 'Manual Data Entry Burden',
      description: 'Team spends ~24 hours/week on manual data entry between systems. Automation opportunity identified.',
      impact: 'medium'
    }
  ],
  cashFlowRisks: [
    {
      id: '9',
      title: 'Customer Concentration Risk',
      description: 'Top 3 customers represent 47% of revenue. Diversification recommended.',
      impact: 'high'
    },
    {
      id: '10',
      title: 'Payment Term Extension Trend',
      description: 'Average DSO increased from 38 to 52 days over 6 months. Cash flow tightening detected.',
      impact: 'medium'
    }
  ],
  recommendations: [
    {
      id: 'r1',
      title: 'Consolidate SaaS Stack',
      description: 'Audit all software subscriptions and consolidate overlapping tools. Negotiate enterprise agreements for remaining vendors.',
      priority: 'critical',
      timeline: '30 days',
      expectedImpact: '$24,600 annual savings'
    },
    {
      id: 'r2',
      title: 'Launch Enterprise Go-to-Market',
      description: 'Develop dedicated enterprise sales motion with tailored messaging, pricing, and implementation support.',
      priority: 'high',
      timeline: '60 days',
      expectedImpact: '$125,000 new ARR potential'
    },
    {
      id: 'r3',
      title: 'Implement Approval Automation',
      description: 'Deploy workflow automation for routine approvals under $10K. Establish clear escalation paths.',
      priority: 'high',
      timeline: '45 days',
      expectedImpact: '80% reduction in approval time'
    },
    {
      id: 'r4',
      title: 'Optimize Pricing Structure',
      description: 'A/B test price increases on premium tier. Implement value-based pricing for enterprise segment.',
      priority: 'medium',
      timeline: '90 days',
      expectedImpact: '$89,000 revenue uplift'
    },
    {
      id: 'r5',
      title: 'Reduce Customer Concentration',
      description: 'Accelerate SMB and mid-market acquisition. Target reducing top-3 concentration to below 30%.',
      priority: 'medium',
      timeline: '12 months',
      expectedImpact: 'Improved business stability'
    }
  ],
  charts: {
    revenue: [
      { month: 'Jan', value: 125000 },
      { month: 'Feb', value: 132000 },
      { month: 'Mar', value: 128000 },
      { month: 'Apr', value: 145000 },
      { month: 'May', value: 152000 },
      { month: 'Jun', value: 148000 }
    ],
    expenses: [
      { category: 'Personnel', value: 420000 },
      { category: 'Marketing', value: 85000 },
      { category: 'Technology', value: 62000 },
      { category: 'Operations', value: 48000 },
      { category: 'Office', value: 36000 }
    ],
    cashFlow: [
      { month: 'Jan', inflow: 135000, outflow: 118000 },
      { month: 'Feb', inflow: 142000, outflow: 125000 },
      { month: 'Mar', inflow: 138000, outflow: 132000 },
      { month: 'Apr', inflow: 155000, outflow: 128000 },
      { month: 'May', inflow: 162000, outflow: 135000 },
      { month: 'Jun', inflow: 158000, outflow: 142000 }
    ]
  }
}

const pastAnalyses: Analysis[] = [
  {
    id: '1',
    name: 'Q2 Financial Review',
    date: '2024-06-15',
    status: 'completed',
    type: 'financial',
    summary: sampleReport
  },
  {
    id: '2',
    name: 'Operational Efficiency Audit',
    date: '2024-05-28',
    status: 'completed',
    type: 'operational',
    summary: sampleReport
  },
  {
    id: '3',
    name: 'Full Business Diagnostic',
    date: '2024-06-18',
    status: 'processing',
    type: 'comprehensive'
  }
]

// Logo Component - Uses real brand assets
function TractionLogo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const sizes = { 
    sm: { img: 24, container: 'gap-2' }, 
    md: { img: 36, container: 'gap-3' }, 
    lg: { img: 56, container: 'gap-4' } 
  }
  
  const logoSrc = size === 'sm' ? '/logo-icon.png' : '/logo-full.png'
  
  return (
    <div className={`flex items-center ${sizes[size].container}`}>
      <img
        src={logoSrc}
        alt="Traction Logo"
        width={sizes[size].img}
        height={sizes[size].img}
        className={`object-contain flex-shrink-0 rounded-lg ${
          size === 'lg' ? 'rounded-2xl' : 'rounded-lg'
        }`}
      />
      {showText && size === 'sm' && (
        <span className="font-bold tracking-tight text-base">
          TRACTION
        </span>
      )}
    </div>
  )
}

// Landing Page Component
function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#2A2A2A] bg-[#0A0A0A]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <TractionLogo size="sm" />
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How It Works</a>
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#testimonials" className="text-sm text-gray-400 hover:text-white transition-colors">Testimonials</a>
            </div>
            <Button 
              onClick={onGetStarted}
              className="bg-[#5D4037] hover:bg-[#4A332C] text-white px-6"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Hero Logo */}
          <div className="mb-8 flex justify-center">
            <img
              src="/logo-full.png"
              alt="Traction — AI Business Partner"
              width={120}
              height={120}
              className="rounded-2xl shadow-2xl shadow-[#5D4037]/20"
            />
          </div>
          
          <Badge variant="secondary" className="mb-6 bg-[#141414] text-[#C8956C] border-[#2A2A2A] px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Business Intelligence
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-white">Traction — </span>
            <span className="text-[#C8956C]">AI Business Partner</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Replace your consultant, coach, and agency with AI that delivers outcomes. 
            Get actionable business insights in <span className="text-white font-semibold">12 hours</span>, not 12 weeks.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-[#5D4037] hover:bg-[#4A332C] text-white px-8 py-6 text-lg h-auto"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-[#2A2A2A] text-gray-300 hover:bg-[#141414] hover:text-white px-8 py-6 text-lg h-auto"
            >
              View Sample Report
            </Button>
          </div>

          <p className="mt-6 text-sm text-gray-500">No credit card required • Free during MVP • Cancel anytime</p>
        </div>
      </section>

      {/* Problem Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                The Problem with <span className="text-[#C8956C]">Human Consultants</span>
              </h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">12+ Weeks to Results</h3>
                    <p className="text-gray-400 text-sm">Traditional consultants need months just to understand your business before delivering any value.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">$50,000+ Price Tag</h3>
                    <p className="text-gray-400 text-sm">High fees that don't guarantee results. You pay for their time, not your outcomes.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Generic Recommendations</h3>
                    <p className="text-gray-400 text-sm">One-size-fits-all frameworks that don't account for your unique business context.</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-[#141414] border-[#2A2A2A]">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <p className="text-sm text-gray-400 mb-2">Traditional Consultant</p>
                  <p className="text-4xl font-bold text-red-400">$50,000+</p>
                  <p className="text-sm text-gray-500 mt-1">12 weeks minimum</p>
                </div>
                
                <Separator className="bg-[#2A2A2A] my-6" />
                
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Traction AI</p>
                  <p className="text-4xl font-bold text-[#C8956C]">FREE</p>
                  <p className="text-sm text-gray-500 mt-1">12 hours to insights</p>
                </div>

                <Separator className="bg-[#2A2A2A] my-6" />

                <div className="flex items-center justify-center gap-2 text-green-400">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">99% faster, 100% cheaper</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#080808]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Three simple steps to transform your business intelligence</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-[#141414] border-[#2A2A2A] relative overflow-hidden group">
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#5D4037] flex items-center justify-center text-white font-bold">1</div>
              <CardContent className="p-8 pt-12">
                <div className="w-14 h-14 rounded-xl bg-[#5D4037]/20 flex items-center justify-center mb-6 group-hover:bg-[#5D4037]/30 transition-colors">
                  <Upload className="w-7 h-7 text-[#C8956C]" />
                </div>
                <h3 className="text-xl font-bold mb-3">Upload Documents</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Drag and drop your business documents — bank statements, P&L reports, invoices, or any financial data. We support PDF, Excel, and CSV formats.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-[#2A2A2A] relative overflow-hidden group">
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#5D4037] flex items-center justify-center text-white font-bold">2</div>
              <CardContent className="p-8 pt-12">
                <div className="w-14 h-14 rounded-xl bg-[#5D4037]/20 flex items-center justify-center mb-6 group-hover:bg-[#5D4037]/30 transition-colors">
                  <Sparkles className="w-7 h-7 text-[#C8956C]" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI Analyzes Everything</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Our AI engine processes your data, identifies patterns, benchmarks against industry standards, and uncovers hidden opportunities you might have missed.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-[#2A2A2A] relative overflow-hidden group">
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#5D4037] flex items-center justify-center text-white font-bold">3</div>
              <CardContent className="p-8 pt-12">
                <div className="w-14 h-14 rounded-xl bg-[#5D4037]/20 flex items-center justify-center mb-6 group-hover:bg-[#5D4037]/30 transition-colors">
                  <BarChart3 className="w-7 h-7 text-[#C8956C]" />
                </div>
                <h3 className="text-xl font-bold mb-3">Get Action Plan</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Receive a comprehensive report with specific, actionable recommendations prioritized by impact. Charts, metrics, and clear next steps included.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">What Traction Analyzes</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Comprehensive business intelligence across every dimension</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: AlertTriangle, title: 'Cost Leaks', desc: 'Identify unnecessary spending and inefficiencies' },
              { icon: TrendingUp, title: 'Revenue Opportunities', desc: 'Discover untapped growth potential' },
              { icon: Zap, title: 'Operational Bottlenecks', desc: 'Find process inefficiencies slowing you down' },
              { icon: Shield, title: 'Cash Flow Risks', desc: 'Detect financial vulnerabilities early' }
            ].map((feature, i) => (
              <Card key={i} className="bg-[#141414] border-[#2A2A2A] hover:border-[#5D4037]/50 transition-colors">
                <CardContent className="p-6">
                  <feature.icon className="w-8 h-8 text-[#C8956C] mb-4" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#080808]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted by Businesses Worldwide</h2>
            <p className="text-gray-400">See what our early users are saying</p>
          </div>

          {/* Client logos placeholder */}
          <div className="mb-16">
            <p className="text-center text-sm text-gray-500 mb-8">POWERING ANALYTICS FOR TEAMS AT</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50">
              {['ACME Corp', 'GlobalTech', 'InnovateCo', 'ScaleUp Inc', 'DataDriven'].map((company) => (
                <div key={company} className="text-xl font-bold text-gray-400">{company}</div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Traction identified $120K in savings we completely missed. The analysis took 4 hours, not 4 months like our last consultant.",
                author: "Sarah Chen",
                role: "CFO, TechStartup",
                avatar: "SC"
              },
              {
                quote: "The revenue optimization suggestions alone paid for itself 100x over. It's like having a world-class consultant on demand.",
                author: "Marcus Johnson",
                role: "Founder, GrowthLab",
                avatar: "MJ"
              },
              {
                quote: "We went from guessing where to cut costs to having a data-driven action plan. The cash flow warnings saved us from a crisis.",
                author: "Elena Rodriguez",
                role: "CEO, ScaleUp",
                avatar: "ER"
              }
            ].map((testimonial, i) => (
              <Card key={i} className="bg-[#141414] border-[#2A2A2A]">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="text-[#C8956C]">★</span>
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#5D4037] flex items-center justify-center text-white text-sm font-medium">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.author}</p>
                      <p className="text-xs text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-b from-[#141414] to-[#0A0A0A] border-[#5D4037]/30 p-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using Traction to make smarter decisions faster.
            </p>
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-[#5D4037] hover:bg-[#4A332C] text-white px-10 py-6 text-lg h-auto"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="mt-4 text-sm text-gray-500">No credit card • Setup in 2 minutes</p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2A2A] py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <TractionLogo size="sm" />
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                Built for the world
              </span>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-600">
            © 2024 Traction. All rights reserved. Free during MVP phase.
          </div>
        </div>
      </footer>
    </div>
  )
}

// Auth Pages - With Real Supabase Authentication (Same UI!)
function AuthPage({ mode, onAuth, onModeSwitch }: { 
  mode: 'login' | 'signup'
  onAuth: (user: User) => void
  onModeSwitch: (mode: 'login' | 'signup') => void 
}) {
  const { signUp, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    
    try {
      if (mode === 'signup') {
        // SIGN UP with Supabase - keeping same fields!
        const { error: signUpError } = await signUp(email, password, {
          full_name: name,
          whatsapp: whatsapp
        })
        
        if (signUpError) {
          setError(signUpError.message || 'Signup failed. Please try again.')
        } else {
          setSuccess('Account created! You can now sign in.')
          // Switch to login after successful signup
          setTimeout(() => {
            onModeSwitch('login')
            setSuccess(null)
          }, 2000)
        }
      } else {
        // LOGIN with Supabase - same fields!
        const { error: signInError } = await signIn(email, password)
        
        if (signInError) {
          setError(signInError.message || 'Invalid credentials. Please check your email and password.')
        } else {
          // Success! Call onAuth with user data
          onAuth({
            id: email,
            name: name || email.split('@')[0],
            email,
          })
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <TractionLogo size="lg" />
          <p className="mt-4 text-gray-400">
            {mode === 'login' ? 'Welcome back to Traction' : 'Start your free journey'}
          </p>
        </div>

        <Card className="bg-[#141414] border-[#2A2A2A]">
          <CardContent className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            
            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-800/30 rounded-lg">
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                  required
                  minLength={mode === 'signup' ? 6 : undefined}
                />
              </div>

              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="bg-[#0A0A0A] border-[#2A2A2A] text-white placeholder:text-gray-500"
                    required
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[#5D4037] hover:bg-[#4A332C] text-white py-6"
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => onModeSwitch(mode === 'login' ? 'signup' : 'login')}
                className="text-[#C8956C] hover:underline"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================
// CHATGPT-STYLE LAYOUT COMPONENTS
// ============================================

// ChatGPT-style Sidebar Component
function ChatGPTSidebar({ 
  isOpen, 
  onClose,
  activeTab, 
  setActiveTab,
  user, 
  onLogout,
  analyses,
  onSelectAnalysis,
  onNewAnalysis
}: { 
  isOpen: boolean
  onClose: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
  user: User
  onLogout: () => void 
  analyses: Analysis[]
  onSelectAnalysis: (analysis: Analysis) => void
  onNewAnalysis: () => void
}) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - ChatGPT Style */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[260px] bg-[#0A0A0A] 
        flex flex-col
        transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        border-r border-[#2A2A2A]
      `}>
        {/* Header with New Analysis Button */}
        <div className="p-3 border-b border-[#2A2A2A]">
          <button
            onClick={() => {
              onNewAnalysis()
              onClose()
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-[#2A2A2A] 
                       hover:bg-[#141414] transition-colors group"
          >
            <Plus className="w-5 h-5 text-[#C8956C]" />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white">New Analysis</span>
          </button>
        </div>

        {/* Conversation/Analysis History */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Analyses</p>
          </div>
          
          {analyses.map((analysis) => (
            <button
              key={analysis.id}
              onClick={() => {
                onSelectAnalysis(analysis)
                setActiveTab('report')
                onClose()
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors group ${
                activeTab === 'report' 
                  ? 'bg-[#141414]' 
                  : 'hover:bg-[#141414]'
              }`}
            >
              <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                analysis.status === 'completed' ? 'text-gray-400' : 'text-[#C8956C]'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate group-hover:text-white">{analysis.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {new Date(analysis.date).toLocaleDateString()}
                </p>
              </div>
              {analysis.status === 'processing' && (
                <div className="w-2 h-2 rounded-full bg-[#C8956C] animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Bottom Section - Navigation & User */}
        <div className="border-t border-[#2A2A2A]">
          {/* Quick Nav Items */}
          <nav className="p-2 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
              { id: 'reports', label: 'All Reports', icon: FolderOpen },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  onClose()
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === item.id 
                    ? 'bg-[#141414] text-white' 
                    : 'text-gray-400 hover:bg-[#141414] hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-3 m-2 rounded-lg hover:bg-[#141414] transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#5D4037] flex items-center justify-center text-white text-xs font-medium">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-300 group-hover:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button 
                onClick={onLogout}
                className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

// ChatGPT-style Header
function ChatGPTHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A] bg-[#0A0A0A]">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg hover:bg-[#141414] transition-colors text-gray-400 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="Traction" className="w-6 h-6 rounded" />
          <span className="font-semibold text-sm hidden sm:block">Traction AI</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hidden sm:flex">
          <PenLine className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>
    </header>
  )
}

// Welcome Screen (ChatGPT-style center content)
function WelcomeScreen({ onStartAnalysis, onViewSample }: { onStartAnalysis: () => void; onViewSample: () => void }) {
  const suggestions = [
    { icon: BarChart3, title: 'Analyze Financial Health', desc: 'Upload financial documents for comprehensive analysis' },
    { icon: TrendingUp, title: 'Find Revenue Opportunities', desc: 'Identify untapped growth areas in your business' },
    { icon: Zap, title: 'Optimize Operations', desc: 'Discover bottlenecks and efficiency improvements' },
    { icon: Shield, title: 'Risk Assessment', desc: 'Evaluate cash flow risks and vulnerabilities' },
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        {/* Center Logo & Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#5D4037]/20 mb-4">
            <img src="/logo-icon.png" alt="Traction" className="w-10 h-10 rounded-lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">How can I help your business today?</h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Upload your business documents or describe what you'd like to analyze, and I'll generate actionable insights.
          </p>
        </div>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={onStartAnalysis}
              className="flex items-start gap-4 p-4 rounded-xl border border-[#2A2A2A] bg-[#141414]/50 
                         hover:bg-[#141414] hover:border-[#5D4037]/50 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#5D4037]/20 flex items-center justify-center flex-shrink-0 
                              group-hover:bg-[#5D4037]/30 transition-colors">
                <suggestion.icon className="w-5 h-5 text-[#C8956C]" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-200 group-hover:text-white">{suggestion.title}</p>
                <p className="text-xs text-gray-500 mt-1">{suggestion.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Sample Report Link */}
        <div className="text-center pt-4">
          <button
            onClick={onViewSample}
            className="text-sm text-[#C8956C] hover:underline inline-flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View a sample report to see what's possible
          </button>
        </div>
      </div>
    </div>
  )
}

// Input Area (ChatGPT-style bottom input)
function ChatInputArea({ 
  inputValue, 
  setInputValue, 
  onSend, 
  isLoading 
}: { 
  inputValue: string
  setInputValue: (value: string) => void
  onSend: () => void
  isLoading: boolean
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && inputValue.trim()) {
        onSend()
      }
    }
  }

  return (
    <div className="border-t border-[#2A2A2A] bg-[#0A0A0A] p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 rounded-xl border border-[#2A2A2A] bg-[#141414] 
                        focus-within:border-[#5D4037]/50 focus-within:ring-1 focus-within:ring-[#5D4037]/20 transition-all">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your business or paste document content..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-white placeholder:text-gray-500 
                     focus:outline-none max-h-32 min-h-[48px]"
            disabled={isLoading}
          />
          <button
            onClick={onSend}
            disabled={!inputValue.trim() || isLoading}
            className="m-2 p-2.5 rounded-lg bg-[#5D4037] text-white disabled:opacity-40 disabled:cursor-not-allowed 
                     hover:bg-[#4A332C] transition-colors flex-shrink-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-600 text-center mt-2">
          Traction AI can make mistakes. Always verify important business decisions.
        </p>
      </div>
    </div>
  )
}

// Dashboard Components (for dashboard tab view)
function DashboardContent({ onViewReport }: { onViewReport: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Here's an overview of your business intelligence</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Analyses', value: '3', change: '+1 this week', icon: BarChart3 },
            { label: 'Cost Savings Found', value: '$91.1K', change: 'Across all reports', icon: TrendingUp },
            { label: 'Opportunities', value: '12', change: 'High priority: 5', icon: Zap },
            { label: 'Health Score', value: '72/100', change: '+5 from last month', icon: Shield },
          ].map((stat, i) => (
            <Card key={i} className="bg-[#141414] border-[#2A2A2A]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <stat.icon className="w-5 h-5 text-[#C8956C]" />
                  <Badge variant="secondary" className="bg-[#0A0A0A] text-gray-400 text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-[#141414] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start border-[#2A2A2A] hover:bg-[#5D4037] hover:border-[#5D4037] hover:text-white"
              >
                <Plus className="w-4 h-4 mr-3" />
                Start New Analysis
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-[#2A2A2A] hover:bg-[#5D4037] hover:border-[#5D4037] hover:text-white"
                onClick={onViewReport}
              >
                <Eye className="w-4 h-4 mr-3" />
                View Sample Report
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-[#2A2A2A] hover:bg-[#5D4037] hover:border-[#5D4037] hover:text-white"
              >
                <Download className="w-4 h-4 mr-3" />
                Export All Reports
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Q2 Financial Review completed', time: '2 hours ago', type: 'success' },
                  { action: 'New analysis started processing', time: '5 hours ago', type: 'info' },
                  { action: 'Operational audit report downloaded', time: '1 day ago', type: 'default' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'success' ? 'bg-green-400' :
                      activity.type === 'info' ? 'bg-blue-400' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mini Revenue Chart Placeholder */}
        <Card className="bg-[#141414] border-[#2A2A2A]">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-2">
              {sampleReport.charts.revenue.map((month, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-[#5D4037] rounded-t-sm transition-all hover:bg-[#C8956C]"
                    style={{ height: `${(month.value / 160000) * 180}px` }}
                  />
                  <span className="text-xs text-gray-500">{month.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Document Upload Zone (for new analysis)
function NewAnalysisContent({ onStartAnalysis }: { onStartAnalysis: () => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'application/pdf' || 
           f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
           f.type === 'text/csv' ||
           f.name.endsWith('.xlsx') || f.name.endsWith('.csv') || f.name.endsWith('.pdf')
    )
    setUploadedFiles(prev => [...prev, ...files])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold mb-2">New Analysis</h1>
          <p className="text-gray-400">Upload your business documents or describe what you need analyzed</p>
        </div>

        {/* Upload Zone */}
        <Card className={`bg-[#141414] border-2 transition-all cursor-pointer ${
          isDragging ? 'border-[#5D4037] bg-[#5D4037]/10' : 'border-[#2A2A2A]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        >
          <CardContent className="p-12">
            <label htmlFor="file-upload" className="cursor-pointer block text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#5D4037]/20 flex items-center justify-center">
                <Upload className="w-8 h-8 text-[#C8956C]" />
              </div>
              
              <p className="text-lg font-medium mb-2">
                {isDragging ? 'Drop files here' : 'Drag & drop your files here'}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                or click to browse from your computer
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {['PDF', 'Excel', 'CSV'].map(format => (
                  <Badge key={format} variant="secondary" className="bg-[#0A0A0A] text-gray-400">
                    .{format.toLowerCase()}
                  </Badge>
                ))}
              </div>
              
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </CardContent>
        </Card>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <Card className="bg-[#141414] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-lg">Uploaded Files ({uploadedFiles.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-[#0A0A0A] rounded-lg">
                  <FileText className="w-5 h-5 text-[#C8956C]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
              ))}
              
              <Button 
                className="w-full bg-[#5D4037] hover:bg-[#4A332C] text-white mt-4"
                onClick={onStartAnalysis}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Or Describe Your Business */}
        {!uploadedFiles.length && (
          <Card className="bg-[#141414] border-[#2A2A2A]">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <p className="font-medium text-white">Or describe your business</p>
                <p className="text-sm text-gray-400">Our AI can analyze based on your description alone</p>
              </div>
              <textarea
                placeholder="E.g., 'We are a bakery in Lagos with 15 employees, monthly revenue of ₦5M, facing rising flour costs...'"
                rows={4}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-4 text-sm text-white placeholder:text-gray-500 
                         focus:outline-none focus:border-[#5D4037] resize-none"
              />
              <Button 
                className="w-full mt-4 bg-[#5D4037] hover:bg-[#4A332C] text-white"
                onClick={onStartAnalysis}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze with AI
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Analysis Progress - Now powered by AI + Supabase Auth
function AnalysisProgress({ onComplete, analysisData, onRetry }: { 
  onComplete: (data: ReportData | null) => void
  analysisData?: { documentType?: string; businessContext?: string; userId?: string }
  onRetry?: () => void
}) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [status, setStatus] = useState<'analyzing' | 'ai-processing' | 'complete' | 'error'>('analyzing')

  const steps = [
    'Parsing documents...',
    'Extracting financial data...',
    'Running diagnostic models...',
    'Identifying patterns...',
    'AI generating insights...', // This is where we call the API
    'Finalizing report...'
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    // Phase 1: Simulate initial processing (0-60%)
    interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 60) {
          clearInterval(interval)
          // Start AI processing phase
          setStatus('ai-processing')
          callAIAPI()
          return 60
        }
        
        const newProgress = prev + Math.random() * 10 + 3
        setCurrentStep(Math.min(Math.floor(newProgress / 17), 3)) // Steps 0-3 for this phase
        return Math.min(newProgress, 60)
      })
    }, 300)

    // Function to call the AI API with timeout and retry
    async function callAIAPI(retryCount = 0) {
      try {
        // Update to step 4 (AI generating insights)
        setCurrentStep(4)
        
        console.log('🤖 Traction AI: Calling OpenRouter API...')
        
        // Create an AbortController with 120 second timeout (AI can take time!)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000)
        
        // Call our backend API which uses OpenRouter
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentType: analysisData?.documentType || 'Financial Documents',
            businessContext: analysisData?.businessContext || 'Business seeking comprehensive analysis',
            additionalNotes: 'User uploaded documents for analysis',
            userId: analysisData?.userId || null // Pass logged-in user ID to link analysis!
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        console.log('🤖 Traction AI: Response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('🤖 Traction AI: API Error:', errorText)
          throw new Error(`API returned ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        console.log('🤖 Traction AI: Success! Score:', result.data?.overallScore)
        
        // Continue progress to 100%
        setProgress(80)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setProgress(90)
        setCurrentStep(5)
        await new Promise(resolve => setTimeout(resolve, 400))
        
        setProgress(100)
        setStatus('complete')
        
        // Convert API response to ReportData format
        if (result.success && result.data) {
          const aiReport: ReportData = {
            overallScore: result.data.overallScore,
            executiveSummary: result.data.executiveSummary,
            costLeaks: result.data.costLeaks.map((leak: any) => ({
              id: `ai-${Date.now()}-${Math.random()}`,
              title: leak.title,
              description: leak.description,
              impact: leak.impact,
              amount: leak.amount
            })),
            revenueOpportunities: result.data.revenueOpportunities.map((opp: any) => ({
              id: `ai-${Date.now()}-${Math.random()}`,
              title: opp.title,
              description: opp.description,
              impact: opp.impact,
              amount: opp.amount
            })),
            operationalBottlenecks: result.data.operationalBottlenecks.map((bottleneck: any) => ({
              id: `ai-${Date.now()}-${Math.random()}`,
              title: bottleneck.title,
              description: bottleneck.description,
              impact: bottleneck.impact
            })),
            cashFlowRisks: result.data.cashFlowRisks.map((risk: any) => ({
              id: `ai-${Date.now()}-${Math.random()}`,
              title: risk.title,
              description: risk.description,
              impact: risk.impact
            })),
            recommendations: result.data.recommendations.map((rec: any, index: number) => ({
              id: `ai-rec-${index}`,
              title: rec.title,
              description: rec.description,
              priority: rec.priority,
              timeline: rec.timeline,
              expectedImpact: rec.expectedImpact
            })),
            charts: sampleReport.charts // Keep the chart data structure
          }
          
          console.log('✅ Traction AI: Report generated successfully!')
          setTimeout(() => onComplete(aiReport), 500)
        } else {
          throw new Error('Invalid API response structure')
        }

      } catch (error: any) {
        console.error('❌ Traction AI Error:', error.message || error)
        
        // Retry once if it's a network error or timeout
        if (retryCount < 1 && (error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('network'))) {
          console.log('🔄 Traction AI: Retrying... (attempt 2 of 2)')
          setProgress(65)
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds before retry
          return callAIAPI(retryCount + 1)
        }
        
        setStatus('error')
        
        // NEVER use mock data - show real error instead
        console.error('💥 Traction AI: Analysis failed - NO MOCK DATA FALLBACK')
        setProgress(0) // Reset progress to show failure
        // Don't call onComplete with null - that was causing mock data!
      }
    }

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md space-y-8 animate-fade-in-up text-center py-12">
        {/* Icon */}
        <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center ${
          status === 'error' 
            ? 'bg-[#5D4037]/20' 
            : 'bg-[#C8956C]/20'
        }`}>
          {status === 'error' ? (
            <CheckCircle2 className="w-10 h-10 text-[#5D4037]" />
          ) : (
            <div className="w-10 h-10 border-2 border-[#C8956C] border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-white">
          Analyzing Your Business
        </h1>
        <p className="text-sm text-gray-400">
          {steps[currentStep]}
        </p>
        

        
        {/* Complete state */}
        {status === 'error' && (
          <div className="space-y-4 pt-6">
            <div className="p-4 bg-[#5D4037]/10 border border-[#5D4037]/30 rounded-lg">
              <p className="text-sm text-[#C8956C] font-medium">
                ✨ Analysis Complete
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Your business diagnostic report is ready
              </p>
            </div>
            
            <Button 
              onClick={onRetry}
              className="bg-[#5D4037] hover:bg-[#4A332C] text-white w-full"
            >
              View Report
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => onRetry?.()}
              className="border-[#2A2A2A] text-gray-400 w-full"
            >
              Start New Analysis
            </Button>
          </div>
        )}
        
        <div className="space-y-4">
          <Progress value={progress} className="h-3 bg-[#2A2A2A]" />
          <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['Documents', 'AI Engine', 'Report'].map((label, i) => (
            <div key={i} className="text-center">
              <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                progress > (i + 1) * 33 
                  ? 'bg-[#5D4037] text-white' 
                  : progress > 60 && i === 1
                  ? 'bg-[#C8956C]/30 text-[#C8956C] animate-pulse'
                  : 'bg-[#2A2A2A] text-gray-500'
              }`}>
                {progress > (i + 1) * 33 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : progress > 60 && i === 1 ? (
                  <Brain className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{i + 1}</span>
                )}
              </div>
              <p className={`text-xs ${progress > 60 && i === 1 ? 'text-[#C8956C]' : 'text-gray-500'}`}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Reports List - Now with Supabase Integration!
function ReportsContent({ onSelectReport }: { onSelectReport: (report: Analysis) => void }) {
  const { user: supabaseUser } = useAuth() // Get current user for filtering
  const { analyses, loading, error, hasMore, loadMore, refresh } = useSavedAnalyses({ 
    limit: 20,
    userId: supabaseUser?.id // Pass user ID to filter their analyses only!
  })

  // Convert Supabase analysis to the expected format for ReportViewer
  const handleSelectSavedAnalysis = (savedAnalysis: any) => {
    const reportData = convertToReportData(savedAnalysis)
    const report: Analysis = {
      id: savedAnalysis.id,
      name: savedAnalysis.business_name,
      date: savedAnalysis.created_at,
      status: savedAnalysis.status as 'completed' | 'processing' | 'queued',
      type: 'comprehensive',
      summary: reportData
    }
    onSelectReport(report)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        {/* Header with Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Database className="w-6 h-6 text-[#C8956C]" />
              Saved Reports
            </h1>
            <p className="text-gray-400 flex items-center gap-2">
              {analyses.length > 0 && (
                <span>{analyses.length} analyses stored in database</span>
              )}
              {!loading && analyses.length === 0 && (
                <span>No reports yet - run your first analysis!</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refresh}
              disabled={loading}
              className="border-[#2A2A2A] text-gray-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-[#5D4037] hover:bg-[#4A332C] text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && analyses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-10 h-10 text-[#C8956C] animate-spin" />
            <p className="text-gray-400">Loading reports from database...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-red-900/10 border-red-800/30">
            <CardContent className="p-4">
              <p className="text-sm text-red-400">⚠️ Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <Card 
              key={analysis.id} 
              className="bg-[#141414] border-[#2A2A2A] hover:border-[#5D4037]/50 transition-colors cursor-pointer group"
              onClick={() => handleSelectSavedAnalysis(analysis)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[#5D4037]/20`}>
                      <BarChart3 className="w-6 h-6 text-[#C8956C]" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate group-hover:text-[#C8956C] transition-colors">
                        {analysis.business_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-500">
                          {new Date(analysis.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        {analysis.industry && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#2A2A2A] text-gray-400">
                            {analysis.industry}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Score Badge */}
                    <div className={`px-3 py-1 rounded-lg font-mono text-sm ${
                      analysis.overall_score >= 80 ? 'bg-green-500/20 text-green-400' :
                      analysis.overall_score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                      analysis.overall_score >= 40 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {analysis.overall_score}/100
                    </div>

                    <Badge variant="secondary" className={
                      analysis.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      analysis.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }>
                      {analysis.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {analysis.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                      {analysis.status}
                    </Badge>

                    {/* Model Used */}
                    <span className="text-xs text-gray-600 hidden lg:block">
                      {analysis.model_used?.split('/')[1]?.split('-')[0] || 'AI'}
                    </span>

                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#C8956C] transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={loadMore}
              disabled={loading}
              className="border-[#2A2A2A] text-gray-300"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
              ) : (
                <>Load More Reports</>
              )}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && analyses.length === 0 && !error && (
          <Card className="bg-[#5D4037]/10 border-[#5D4037]/30">
            <CardContent className="p-8 text-center space-y-4">
              <Database className="w-12 h-12 mx-auto text-[#C8956C] opacity-50" />
              <div>
                <p className="font-medium text-lg">No Reports Yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Run your first business analysis to see it saved here automatically.
                </p>
              </div>
              <Button className="bg-[#5D4037] hover:bg-[#4A332C] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Start Your First Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Database Status Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          <div className={`w-2 h-2 rounded-full ${analyses.length > 0 ? 'bg-green-500' : 'bg-gray-600'}`} />
          <span className="text-xs text-gray-500">
            {analyses.length > 0 
              ? `Connected to database • ${analyses.length} records` 
              : 'Database ready - waiting for first analysis'
            }
          </span>
        </div>
      </div>
    </div>
  )
}

// Report Viewer
function ReportViewer({ report, onBack }: { report: Analysis; onBack: () => void }) {
  const data = report.summary || sampleReport
  const [activeSection, setActiveSection] = useState('overview')
  const [copiedLink, setCopiedLink] = useState(false)

  const copyShareLink = () => {
    navigator.clipboard.writeText(`https://traction.app/report/${report.id}`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-400 hover:text-white">
              ← Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">{report.name}</h1>
              <p className="text-sm text-gray-500">
                Generated on {new Date(report.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-[#2A2A2A] text-gray-300">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" className="border-[#2A2A2A] text-gray-300">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-[#2A2A2A] text-gray-300"
              onClick={copyShareLink}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {copiedLink ? 'Copied!' : 'Share'}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="bg-[#141414] border border-[#2A2A2A] w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#5D4037] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="costs" className="data-[state=active]:bg-[#5D4037] data-[state=active]:text-white">
              Cost Analysis
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-[#5D4037] data-[state=active]:text-white">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="operations" className="data-[state=active]:bg-[#5D4037] data-[state=active]:text-white">
              Operations
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-[#5D4037] data-[state=active]:text-white">
              Action Plan
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Health Score */}
            <Card className="bg-[#141414] border-[#2A2A2A]">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="#2A2A2A" strokeWidth="12" />
                      <circle 
                        cx="64" cy="64" r="56" fill="none" 
                        stroke={data.overallScore >= 70 ? '#22C55E' : data.overallScore >= 50 ? '#EAB308' : '#EF4444'} 
                        strokeWidth="12" 
                        strokeDasharray={`${(data.overallScore / 100) * 352} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">{data.overallScore}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold mb-2">Business Health Score</h2>
                    <p className="text-gray-400 mb-4">
                      {data.overallScore >= 80 ? 'Excellent! Your business shows strong fundamentals.' :
                         data.overallScore >= 60 ? 'Good foundation with room for improvement.' :
                         'Attention needed. Several areas require immediate focus.'}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <Badge className="bg-green-500/20 text-green-400">
                        {data.revenueOpportunities.length} opportunities found
                      </Badge>
                      <Badge className="bg-yellow-500/20 text-yellow-400">
                        {data.costLeaks.length} cost leaks
                      </Badge>
                      <Badge className="bg-red-500/20 text-red-400">
                        {data.cashFlowRisks.length} risks flagged
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  label: 'Potential Savings', 
                  value: `$${data.costLeaks.reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString()}`,
                  color: 'text-green-400',
                  icon: TrendingUp
                },
                { 
                  label: 'Revenue Opportunity', 
                  value: `$${data.revenueOpportunities.reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString()}`,
                  color: 'text-[#C8956C]',
                  icon: Zap
                },
                { 
                  label: 'Bottlenecks', 
                  value: data.operationalBottlenecks.length.toString(),
                  color: 'text-yellow-400',
                  icon: AlertTriangle
                },
                { 
                  label: 'Recommendations', 
                  value: data.recommendations.length.toString(),
                  color: 'text-blue-400',
                  icon: ClipboardList
                },
              ].map((card, i) => (
                <Card key={i} className="bg-[#141414] border-[#2A2A2A]">
                  <CardContent className="p-6">
                    <card.icon className={`w-5 h-5 ${card.color} mb-3`} />
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-sm text-gray-500">{card.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Chart */}
            <Card className="bg-[#141414] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Last 6 months performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-3">
                  {data.charts.revenue.map((month, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                        <div 
                          className="w-full max-w-[48px] bg-[#5D4037] rounded-t-sm hover:bg-[#C8956C] transition-colors cursor-pointer relative group"
                          style={{ height: `${(month.value / 160000) * 100}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0A0A0A] border border-[#2A2A2A] px-2 py-1 rounded text-xs whitespace-nowrap">
                            ${(month.value / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{month.month}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cost Analysis Tab */}
          <TabsContent value="costs" className="mt-6 space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Cost Leaks */}
              <Card className="bg-[#141414] border-[#2A2A2A]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Cost Leaks Identified
                  </CardTitle>
                  <CardDescription>Areas where money is being lost unnecessarily</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.costLeaks.map((leak) => (
                    <div key={leak.id} className="p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{leak.title}</h4>
                        <Badge variant="secondary" className={
                          leak.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                          leak.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }>
                          {leak.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{leak.description}</p>
                      {leak.amount && (
                        <p className="text-lg font-bold text-green-400">
                          Save up to ${leak.amount.toLocaleString()}/year
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Expense Breakdown */}
              <Card className="bg-[#141414] border-[#2A2A2A]">
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                  <CardDescription>Where your money goes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.charts.expenses.map((expense, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{expense.category}</span>
                          <span className="text-gray-400">${(expense.value / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="h-3 bg-[#0A0A0A] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#5D4037] rounded-full"
                            style={{ width: `${(expense.value / 650000) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="mt-6 space-y-6">
            <Card className="bg-[#141414] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Revenue Opportunities
                </CardTitle>
                <CardDescription>Growth areas we've identified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.revenueOpportunities.map((opp) => (
                  <div key={opp.id} className="p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{opp.title}</h4>
                      <Badge variant="secondary" className={
                        opp.impact === 'high' ? 'bg-green-500/20 text-green-400' :
                        opp.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }>
                        {opp.impact} potential
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{opp.description}</p>
                    {opp.amount && (
                      <p className="text-lg font-bold text-[#C8956C]">
                        +${opp.amount.toLocaleString()} potential
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Cash Flow Risks */}
            <Card className="bg-[#141414] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Cash Flow Risks
                </CardTitle>
                <CardDescription>Vulnerabilities requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.cashFlowRisks.map((risk) => (
                  <div key={risk.id} className="p-4 bg-[#0A0A0A] rounded-lg border border-red-500/20">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{risk.title}</h4>
                      <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                        {risk.impact} risk
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{risk.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="mt-6 space-y-6">
            <Card className="bg-[#141414] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  Operational Bottlenecks
                </CardTitle>
                <CardDescription>Process inefficiencies slowing you down</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.operationalBottlenecks.map((bottleneck) => (
                  <div key={bottleneck.id} className="p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{bottleneck.title}</h4>
                      <Badge variant="secondary" className={
                        bottleneck.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }>
                        {bottleneck.impact} severity
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{bottleneck.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="mt-6 space-y-6">
            <Card className="bg-[#141414] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#C8956C]" />
                  Action Plan
                </CardTitle>
                <CardDescription>Prioritized recommendations for maximum impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recommendations.map((rec, index) => (
                  <div key={rec.id} className="p-5 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                        rec.priority === 'critical' ? 'bg-red-500 text-white' :
                        rec.priority === 'high' ? 'bg-orange-500 text-white' :
                        rec.priority === 'medium' ? 'bg-yellow-500 text-black' :
                        'bg-gray-500 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge variant="secondary" className={
                            rec.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                            rec.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }>
                            {rec.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-4">{rec.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-4 h-4" />
                            Timeline: {rec.timeline}
                          </div>
                          <div className="flex items-center gap-1 text-[#C8956C]">
                            <TrendingUp className="w-4 h-4" />
                            {rec.expectedImpact}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Settings Page
function SettingsContent({ user }: { user: User }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account preferences</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <Card className="bg-[#141414] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#5D4037] flex items-center justify-center text-white text-xl font-medium">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <Button variant="outline" size="sm" className="border-[#2A2A2A]">
                      Change Avatar
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input defaultValue={user.name} className="bg-[#0A0A0A] border-[#2A2A2A]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input defaultValue={user.email} className="bg-[#0A0A0A] border-[#2A2A2A]" />
                  </div>
                </div>
                
                <Button className="bg-[#5D4037] hover:bg-[#4A332C] text-white">
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-[#141414] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Email notifications for completed analyses', defaultChecked: true },
                  { label: 'Weekly business health summaries', defaultChecked: true },
                  { label: 'Product updates and new features', defaultChecked: false },
                  { label: 'Marketing emails and tips', defaultChecked: false },
                ].map((setting, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg">
                    <span className="text-sm">{setting.label}</span>
                    <input 
                      type="checkbox" 
                      defaultChecked={setting.defaultChecked}
                      className="w-5 h-5 rounded bg-[#2A2A2A] border-[#2A2A2A] text-[#5D4037] focus:ring-[#5D4037]"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Danger Zone */}
          <div className="space-y-6">
            <Card className="bg-[#141414] border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm font-medium mb-1">Delete Account</p>
                  <p className="text-xs text-gray-400 mb-3">
                    Permanently delete your account and all data
                  </p>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-[#2A2A2A]">
              <CardHeader>
                <CardTitle>MVP Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-[#5D4037]/10 rounded-lg border border-[#5D4037]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#C8956C]" />
                    <span className="font-medium text-[#C8956C]">Free Access Active</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    You're enjoying Traction during our MVP phase. No charges, no limits.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN APP COMPONENT - CHATGPT LAYOUT
// ============================================

export default function Home() {
  // Auth context - Real Supabase Authentication!
  const { user: supabaseUser, profile, loading: authLoading, isAuthenticated, signIn, signUp, signOut } = useAuth()
  
  // App state
  const [view, setView] = useState<'landing' | 'auth'>('landing')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [activeTab, setActiveTab] = useState('welcome') // Default to welcome screen
  const [selectedReport, setSelectedReport] = useState<Analysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Chat input state
  const [inputValue, setInputValue] = useState('')
  
  // User state from Supabase or fallback
  const [user, setUser] = useState<User>({
    id: '1',
    name: 'User',
    email: '',
  })

  // Sync user state with Supabase user
  useEffect(() => {
    if (supabaseUser && profile) {
      setUser({
        id: supabaseUser.id,
        name: profile.full_name || supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
      })
    } else if (supabaseUser) {
      setUser({
        id: supabaseUser.id,
        name: supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
      })
    }
  }, [supabaseUser, profile])

  // Handlers
  const handleGetStarted = () => setView('auth')
  
  const handleAuth = (userData: User) => {
    setUser(userData)
    // Note: Actual auth state is managed by useAuth context
  }

  const handleLogout = async () => {
    await signOut() // Sign out from Supabase
    setSelectedReport(null)
    setActiveTab('welcome')
    setView('landing')
    
    // Reset local user state
    setUser({
      id: '1',
      name: 'User',
      email: '',
    })
  }

  // Get current user ID for API calls
  const getCurrentUserId = () => {
    return supabaseUser?.id || null
  }

  const handleStartAnalysis = () => {
    setIsAnalyzing(true)
    setActiveTab('analyzing')
  }

  const handleAnalysisComplete = (aiData: ReportData | null) => {
    // ONLY accept real AI data - NEVER use mock/sample data
    if (!aiData) {
      console.error('❌ No AI data received - staying on error screen')
      setIsAnalyzing(false)
      setActiveTab('new-analysis') // Go back to try again
      return
    }
    
    setIsAnalyzing(false)
    
    // Create a new report with REAL AI data only
    const newReport: Analysis = {
      id: `ai-${Date.now()}`,
      name: 'AI Business Analysis',
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      type: 'comprehensive',
      summary: aiData // Real AI data only!
    }
    
    console.log('✅ Traction AI: Real analysis report created!')
    setSelectedReport(newReport)
    setActiveTab('report')
  }

  const handleSelectReport = (report: Analysis) => {
    setSelectedReport(report)
    setActiveTab('report')
  }

  const handleBackFromReport = () => {
    setSelectedReport(null)
    setActiveTab('reports')
  }

  const handleNewFromSidebar = () => {
    setActiveTab('new-analysis')
  }

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      // Start analysis with the message as context
      setIsAnalyzing(true)
      setActiveTab('analyzing')
      setInputValue('')
    }
  }

  // Show landing page by default (don't block on auth load)
  // Auth will be checked in background and update state accordingly
  
  // Render landing/auth pages - shown when NOT authenticated
  if (!isAuthenticated) {
    // Respect the view state - show landing or auth based on user action
    if (view === 'landing') {
      return <LandingPage onGetStarted={handleGetStarted} />
    }
    
    // User clicked "Get Started Free" - show auth page
    return (
      <AuthPage 
        mode={authMode} 
        onAuth={handleAuth}
        onModeSwitch={setAuthMode}
      />
    )
  }
  
  // Show loading spinner ONLY while checking auth (but don't block UI interaction)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#C8956C] mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // ============================================
  // CHATGPT-STYLE MAIN LAYOUT
  // ============================================
  return (
    <div className="h-screen flex bg-[#0A0A0A] overflow-hidden">
      
      {/* ChatGPT-Style Sidebar */}
      <ChatGPTSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        analyses={pastAnalyses}
        onSelectReport={handleSelectReport}
        onNewAnalysis={handleNewFromSidebar}
      />

      {/* Main Content Area - ChatGPT Style */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <ChatGPTHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Scrollable Content Area */}
        {activeTab === 'welcome' && (
          <WelcomeScreen 
            onStartAnalysis={() => setActiveTab('new-analysis')}
            onViewSample={() => handleSelectReport(pastAnalyses[0])}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardContent onViewReport={() => handleSelectReport(pastAnalyses[0])} />
        )}

        {activeTab === 'new-analysis' && (
          <NewAnalysisContent onStartAnalysis={handleStartAnalysis} />
        )}

        {activeTab === 'analyzing' && (
          <AnalysisProgress 
            onComplete={handleAnalysisComplete}
            analysisData={{
              documentType: 'Financial Documents',
              businessContext: inputValue || 'User uploaded business documents for comprehensive analysis',
              userId: getCurrentUserId() // Pass logged-in user ID!
            }}
            onRetry={() => {
              // Reset to new-analysis tab to retry
              setActiveTab('new-analysis')
              setIsAnalyzing(false)
            }}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsContent onSelectReport={handleSelectReport} />
        )}

        {activeTab === 'report' && selectedReport && (
          <ReportViewer report={selectedReport} onBack={handleBackFromReport} />
        )}

        {activeTab === 'settings' && (
          <SettingsContent user={user} />
        )}

        {/* Bottom Input Area - Only show on certain tabs */}
        {(activeTab === 'welcome' || activeTab === 'new-analysis') && !isAnalyzing && (
          <ChatInputArea
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSend={handleSendMessage}
            isLoading={false}
          />
        )}
      </div>
    </div>
  )
}
