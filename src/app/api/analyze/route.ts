import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════
// TRACTION AI - AI Analysis with Supabase Database Integration
// ═══════════════════════════════════════════════════════════════════════════

const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Primary model - DeepSeek (proven reliable)
const PRIMARY_MODEL = 'deepseek/deepseek-chat';

// Supabase Configuration
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

// Initialize Supabase client (only if configured)
let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseServiceKey && isValidSupabaseUrl(supabaseUrl) && !supabaseUrl.includes('your-')) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase connected');
} else {
  console.log('⚠️ Supabase not configured - running without database');
}

interface AnalysisRequest {
  documentType?: string;
  businessContext?: string;
  additionalNotes?: string;
  businessName?: string;
  industry?: string;
  revenue?: string;
  teamSize?: string;
  geography?: string;
  userId?: string; // Optional user ID for authenticated users
}

interface AnalysisResponse {
  success: boolean;
  data?: {
    overallScore: number;
    executiveSummary: string;
    strategicAssessment?: {
      currentStage: string;
      marketPosition: string;
      growthPotential: string;
      keyChallenge: string;
    };
    costLeaks: Array<{
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      amount?: number;
      rootCause?: string;
      fix?: string;
    }>;
    revenueOpportunities: Array<{
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      amount?: number;
      timeframe?: string;
      confidence?: string;
    }>;
    operationalBottlenecks: Array<{
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      currentState?: string;
      targetState?: string;
    }>;
    cashFlowRisks: Array<{
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      probability?: string;
      mitigation?: string;
    }>;
    recommendations: Array<{
      title: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      timeline: string;
      expectedImpact: string;
      owner?: string;
      kpi?: string;
      risk?: string;
    }>;
    immediateActions?: Array<{
      action: string;
      owner: string;
      deadline: string;
      outcome: string;
    }>;
    analysisId?: string; // Include DB ID when saved
  };
  error?: string;
  modelUsed?: string;
}

// System prompt - clean and effective
const SYSTEM_PROMPT = `You are TRACTION, an AI Business Consultant. You deliver completed analysis reports.

RULES:
1. Output ONLY valid JSON, no markdown, no explanation
2. Use MECE structure. Quantify everything possible.
3. Every recommendation needs: WHAT, WHO, WHEN, HOW MUCH.
4. Detect geography from context. Adapt currency/tone accordingly.

OUTPUT FORMAT:
{
  "overallScore": <0-100>,
  "executiveSummary": "<3-4 sentences>",
  "costLeaks": [{"title","description","impact":"high|medium|low","amount":<number>}],
  "revenueOpportunities": [{"title","description","impact":"high|medium|low","amount":<number>}],
  "operationalBottlenecks": [{"title","description","impact":"high|medium|low"}],
  "cashFlowRisks": [{"title","description","impact":"high|medium|low"}],
  "recommendations": [{"title","description","priority":"critical|high|medium|low","timeline","expectedImpact"}]
}`;

function buildPrompt(request: AnalysisRequest): string {
  return `Analyze this business and provide a comprehensive diagnostic report:

BUSINESS DETAILS:
${request.businessContext || 'Business seeking analysis'}
${request.documentType ? `\nDocument Type: ${request.documentType}` : ''}
${request.industry ? `\nIndustry: ${request.industry}` : ''}
${request.revenue ? `\nRevenue: ${request.revenue}` : ''}
${request.teamSize ? `\nTeam Size: ${request.teamSize}` : ''}
${request.geography ? `\nLocation: ${request.geography}` : ''}

Provide realistic, context-aware insights with specific dollar amounts where applicable.
Score the business honestly based on the information provided.`;
}

function parseJSON(content: string): any | null {
  try {
    let cleaned = content.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Extract JSON object
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.substring(start, end + 1));
    }
    
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Parse error:', e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SAVE ANALYSIS TO SUPABASE
// ═══════════════════════════════════════════════════════════════════════════
async function saveAnalysisToSupabase(
  request: AnalysisRequest,
  data: NonNullable<AnalysisResponse['data']>,
  modelUsed: string,
  durationMs: number
): Promise<string | null> {
  if (!supabase) {
    console.log('⚠️ Skipping database save - Supabase not configured');
    return null;
  }

  try {
    const { data: savedAnalysis, error } = await supabase
      .from('business_analyses')
      .insert({
        user_id: request.userId || null,
        business_name: request.businessName || 'Unknown Business',
        industry: request.industry || null,
        revenue: request.revenue || null,
        team_size: request.teamSize || null,
        geography: request.geography || null,
        document_type: request.documentType || 'manual',
        business_context: request.businessContext || null,
        additional_notes: request.additionalNotes || null,
        
        // Analysis Results
        overall_score: data.overallScore,
        executive_summary: data.executiveSummary,
        
        // Analysis Components (JSONB)
        cost_leaks: data.costLeaks || [],
        revenue_opportunities: data.revenueOpportunities || [],
        operational_bottlenecks: data.operationalBottlenecks || [],
        cash_flow_risks: data.cashFlowRisks || [],
        recommendations: data.recommendations || [],
        
        // Metadata
        model_used: modelUsed,
        analysis_duration_ms: durationMs,
        status: 'completed'
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Supabase save error:', error.message);
      return null;
    }

    console.log(`✅ Analysis saved to Supabase: ${savedAnalysis.id}`);
    return savedAnalysis.id;

  } catch (error: any) {
    console.error('❌ Failed to save to Supabase:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN API HANDLER
// ═══════════════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🤖 Traction AI: Analysis request received');
  
  try {
    const body: AnalysisRequest = await request.json();
    const prompt = buildPrompt(body);
    
    console.log('🤖 Calling OpenRouter API...');
    
    // Call API with extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://traction.app',
        'X-Title': 'Traction AI'
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3500
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`🤖 Response in ${elapsed}s`);

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ API Error:', response.status, errText.substring(0, 200));
      
      return NextResponse.json({ 
        success: false, 
        error: `API Error: ${response.status}`,
        details: errText.substring(0, 300)
      }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('❌ No content in response');
      return NextResponse.json({ 
        success: false, 
        error: 'No content from AI'
      }, { status: 502 });
    }

    // Parse response
    const parsed = parseJSON(content);
    
    if (!parsed) {
      console.error('❌ Failed to parse response');
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to parse AI response',
        rawPreview: content.substring(0, 500)
      }, { status: 502 });
    }

    console.log(`✅ Success! Score: ${parsed.overallScore}`);

    // Build response data
    const responseData = {
      overallScore: parsed.overallScore || 70,
      executiveSummary: parsed.executiveSummary || 'Analysis completed successfully.',
      costLeaks: (parsed.costLeaks || []).slice(0, 5),
      revenueOpportunities: (parsed.revenueOpportunities || []).slice(0, 4),
      operationalBottlenecks: (parsed.operationalBottlenecks || []).slice(0, 3),
      cashFlowRisks: (parsed.cashFlowRisks || []).slice(0, 3),
      recommendations: (parsed.recommendations || []).slice(0, 5)
    };

    // Save to Supabase (non-blocking - don't fail if DB save fails)
    const durationMs = Date.now() - startTime;
    const analysisId = await saveAnalysisToSupabase(body, responseData, PRIMARY_MODEL, durationMs);
    
    // Add analysis ID to response if saved
    if (analysisId) {
      (responseData as any).analysisId = analysisId;
    }

    // Build final response
    const result: AnalysisResponse = {
      success: true,
      data: responseData,
      modelUsed: PRIMARY_MODEL
    };

    return NextResponse.json(result);

  } catch (error: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error('❌ Error after', elapsed, 's:', error.message);
    
    const isTimeout = error.name === 'AbortError';
    
    return NextResponse.json({ 
      success: false, 
      error: isTimeout ? 'Request timed out - please try again' : error.message
    }, { status: isTimeout ? 504 : 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET endpoint - Retrieve saved analyses
// ═══════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ 
      success: false, 
      error: 'Database not configured',
      analyses: [] 
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('business_analyses')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by user if provided
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // Only show public/guest analyses if no user filter
      query = query.is('user_id', null);
    }

    const { data: analyses, error, count } = await query;

    if (error) {
      console.error('❌ Fetch error:', error.message);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        analyses: [] 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analyses: analyses || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0)
    });

  } catch (error: any) {
    console.error('❌ GET error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      analyses: [] 
    }, { status: 500 });
  }
}
