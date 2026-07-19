import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════
// TRACTION AI - Dashboard Statistics API
// ═══════════════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate Supabase configuration
const isValidSupabaseUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseServiceKey && isValidSupabaseUrl(supabaseUrl) && !supabaseUrl.includes('your-')) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  if (!supabase) {
    // Return default stats if no database
    return NextResponse.json({
      success: true,
      stats: {
        totalAnalyses: 0,
        avgScore: 0,
        recentAnalyses: [],
        scoreDistribution: {
          excellent: 0, // 80-100
          good: 0,      // 60-79
          fair: 0,      // 40-59
          poor: 0       // 0-39
        },
        industryBreakdown: {},
        topCostLeaks: [],
        topOpportunities: []
      }
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Build base query
    let baseQuery = supabase
      .from('business_analyses')
      .select('*')
      .eq('status', 'completed')
      .gte('created_at', sinceDate.toISOString());

    if (userId) {
      baseQuery = baseQuery.eq('user_id', userId);
    }

    const { data: analyses, error } = await baseQuery;

    if (error) throw error;

    // Calculate statistics
    const totalAnalyses = analyses?.length || 0;
    const avgScore = totalAnalyses > 0 
      ? Math.round(analyses!.reduce((sum, a) => sum + a.overall_score, 0) / totalAnalyses)
      : 0;

    // Score distribution
    const scoreDistribution = {
      excellent: analyses?.filter(a => a.overall_score >= 80).length || 0,
      good: analyses?.filter(a => a.overall_score >= 60 && a.overall_score < 80).length || 0,
      fair: analyses?.filter(a => a.overall_score >= 40 && a.overall_score < 60).length || 0,
      poor: analyses?.filter(a => a.overall_score < 40).length || 0
    };

    // Industry breakdown
    const industryBreakdown: Record<string, number> = {};
    analyses?.forEach(analysis => {
      const industry = analysis.industry || 'Other';
      industryBreakdown[industry] = (industryBreakdown[industry] || 0) + 1;
    });

    // Extract top cost leaks and opportunities
    const allCostLeaks: Array<{ title: string; count: number }> = [];
    const allOpportunities: Array<{ title: string; count: number }> = [];

    analyses?.forEach(analysis => {
      (analysis.cost_leaks || []).forEach((leak: any) => {
        allCostLeaks.push({ title: leak.title, count: 1 });
      });
      (analysis.revenue_opportunities || []).forEach((opp: any) => {
        allOpportunities.push({ title: opp.title, count: 1 });
      });
    });

    // Count occurrences
    const leakCounts: Record<string, number> = {};
    allCostLeaks.forEach(leak => {
      leakCounts[leak.title] = (leakCounts[leak.title] || 0) + leak.count;
    });

    const oppCounts: Record<string, number> = {};
    allOpportunities.forEach(opp => {
      oppCounts[opp.title] = (oppCounts[opp.title] || 0) + opp.count;
    });

    // Get top 5
    const topCostLeaks = Object.entries(leakCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([title, count]) => ({ title, count }));

    const topOpportunities = Object.entries(oppCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([title, count]) => ({ title, count }));

    // Recent analyses (last 5)
    const recentAnalyses = (analyses || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(analysis => ({
        id: analysis.id,
        businessName: analysis.business_name,
        overallScore: analysis.overall_score,
        industry: analysis.industry,
        createdAt: analysis.created_at
      }));

    return NextResponse.json({
      success: true,
      stats: {
        totalAnalyses,
        avgScore,
        scoreDistribution,
        industryBreakdown,
        topCostLeaks,
        topOpportunities,
        recentAnalyses,
        periodDays: days
      }
    });

  } catch (error: any) {
    console.error('❌ Stats error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
