// ═══════════════════════════════════════════════════════════════════════════
// TRACTION AI - Supabase Database Types
// ═══════════════════════════════════════════════════════════════════════════

export interface BusinessAnalysis {
  id: string;
  user_id?: string;
  business_name: string;
  industry: string;
  revenue: string;
  team_size: string;
  geography: string;
  document_type: string;
  business_context: string;
  additional_notes?: string;
  
  // Analysis Results
  overall_score: number;
  executive_summary: string;
  
  // Analysis Data (JSON)
  cost_leaks: CostLeak[];
  revenue_opportunities: RevenueOpportunity[];
  operational_bottlenecks: OperationalBottleneck[];
  cash_flow_risks: CashFlowRisk[];
  recommendations: Recommendation[];
  
  // Metadata
  model_used: string;
  analysis_duration_ms: number;
  status: 'completed' | 'failed' | 'processing';
  error_message?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CostLeak {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  amount?: number;
  root_cause?: string;
  fix?: string;
}

export interface RevenueOpportunity {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  amount?: number;
  timeframe?: string;
  confidence?: string;
}

export interface OperationalBottleneck {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  current_state?: string;
  target_state?: string;
}

export interface CashFlowRisk {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  probability?: string;
  mitigation?: string;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeline: string;
  expected_impact: string;
  owner?: string;
  kpi?: string;
  risk?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  plan: 'free' | 'pro' | 'enterprise';
  analyses_count: number;
  created_at: string;
}
