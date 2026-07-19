'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// Types for Supabase data
interface SavedAnalysis {
  id: string
  business_name: string
  industry: string | null
  revenue: string | null
  team_size: string | null
  geography: string | null
  overall_score: number
  executive_summary: string
  cost_leaks: any[]
  revenue_opportunities: any[]
  operational_bottlenecks: any[]
  cash_flow_risks: any[]
  recommendations: any[]
  model_used: string
  status: 'completed' | 'failed' | 'processing'
  created_at: string
  updated_at: string
}

interface StatsData {
  totalAnalyses: number
  avgScore: number
  scoreDistribution: {
    excellent: number
    good: number
    fair: number
    poor: number
  }
  industryBreakdown: Record<string, number>
  recentAnalyses: Array<{
    id: string
    businessName: string
    overallScore: number
    industry: string | null
    createdAt: string
  }>
}

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Custom hook for fetching saved analyses from Supabase
export function useSavedAnalyses(options?: { userId?: string; limit?: number }) {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchAnalyses = useCallback(async (offset = 0) => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return []
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (options?.userId) params.set('userId', options.userId)
      params.set('limit', (options?.limit || 20).toString())
      params.set('offset', offset.toString())

      const response = await fetch(`/api/analyze?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        if (offset === 0) {
          setAnalyses(result.analyses)
        } else {
          setAnalyses(prev => [...prev, ...result.analyses])
        }
        setHasMore(result.hasMore)
        setError(null)
        return result.analyses
      } else {
        throw new Error(result.error || 'Failed to fetch analyses')
      }
    } catch (err: any) {
      console.error('Fetch analyses error:', err)
      setError(err.message || 'Failed to load analyses')
      return []
    } finally {
      setLoading(false)
    }
  }, [options?.userId, options?.limit])

  useEffect(() => {
    fetchAnalyses(0)
  }, [fetchAnalyses])

  // Load more (pagination)
  const loadMore = useCallback(() => {
    fetchAnalyses(analyses.length)
  }, [analyses.length, fetchAnalyses])

  // Refresh list
  const refresh = useCallback(() => {
    fetchAnalyses(0)
  }, [fetchAnalyses])

  return { analyses, loading, error, hasMore, loadMore, refresh }
}

// Custom hook for fetching a single analysis
export function useAnalysis(id: string | null) {
  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !isSupabaseConfigured()) {
      setAnalysis(null)
      return
    }

    const fetchAnalysis = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analyses/${id}`)
        const result = await response.json()

        if (result.success) {
          setAnalysis(result.analysis)
          setError(null)
        } else {
          throw new Error(result.error || 'Analysis not found')
        }
      } catch (err: any) {
        console.error('Fetch analysis error:', err)
        setError(err.message || 'Failed to load analysis')
        setAnalysis(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [id])

  return { analysis, loading, error }
}

// Custom hook for dashboard statistics
export function useStats(options?: { userId?: string; days?: number }) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (options?.userId) params.set('userId', options.userId)
      if (options?.days) params.set('days', options.days.toString())

      const response = await fetch(`/api/stats?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setStats(result.stats)
        setError(null)
      } else {
        throw new Error(result.error || 'Failed to fetch stats')
      }
    } catch (err: any) {
      console.error('Fetch stats error:', err)
      setError(err.message || 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }, [options?.userId, options?.days])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refresh: fetchStats }
}

// Helper to convert SavedAnalysis to ReportData format (for existing components)
export function convertToReportData(savedAnalysis: SavedAnalysis): any {
  return {
    overallScore: savedAnalysis.overall_score,
    executiveSummary: savedAnalysis.executive_summary,
    costLeaks: (savedAnalysis.cost_leaks || []).map((leak: any, i: number) => ({
      id: `db-${savedAnalysis.id}-${i}`,
      title: leak.title,
      description: leak.description,
      impact: leak.impact,
      amount: leak.amount
    })),
    revenueOpportunities: (savedAnalysis.revenue_opportunities || []).map((opp: any, i: number) => ({
      id: `db-${savedAnalysis.id}-opp-${i}`,
      title: opp.title,
      description: opp.description,
      impact: opp.impact,
      amount: opp.amount
    })),
    operationalBottlenecks: (savedAnalysis.operational_bottlenecks || []).map((b: any, i: number) => ({
      id: `db-${savedAnalysis.id}-b-${i}`,
      title: b.title,
      description: b.description,
      impact: b.impact
    })),
    cashFlowRisks: (savedAnalysis.cash_flow_risks || []).map((r: any, i: number) => ({
      id: `db-${savedAnalysis.id}-r-${i}`,
      title: r.title,
      description: r.description,
      impact: r.impact
    })),
    recommendations: (savedAnalysis.recommendations || []).map((rec: any, i: number) => ({
      id: `db-${savedAnalysis.id}-rec-${i}`,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      timeline: rec.timeline,
      expectedImpact: rec.expected_impact
    })),
    charts: {
      revenue: [],
      expenses: [],
      cashFlow: []
    }
  }
}
