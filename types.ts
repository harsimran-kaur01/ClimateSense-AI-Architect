export interface Room {
  id: string;
  name: string;
  type: 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'utility' | 'buffer' | 'circulation';
  x: number;
  y: number;
  width: number;
  height: number;
  windows: WindowPlacement[];
  reasoning: string;
}

export interface WindowPlacement {
  side: 'north' | 'south' | 'east' | 'west';
  position: number; // 0 to 1 relative to wall
  width: number;
  shading: boolean;
}

export interface ClimateData {
  location: string;
  climateZone: string;
  averageTemp: { min: number; max: number };
  solarPotential: string;
  prevailingWinds: string;
  climate_challenges: string[];
  design_strategies: string[];
  orientation_guidance: string;
  window_guidance: string;
  zoning_guidance: string;
}

export interface RejectedAlternative {
  option: string;
  reason_for_rejection: string;
}

export interface HeatRiskZone {
  room: string;
  level: 'low' | 'medium' | 'high';
}

export interface AirflowPath {
  from: string;
  to: string;
  strength: 'weak' | 'moderate' | 'strong';
}

export interface DaylightZone {
  room: string;
  quality: 'low' | 'medium' | 'high';
}

export interface ClimateDiagnostics {
  heat_risk: HeatRiskZone[];
  airflow: AirflowPath[];
  daylight: DaylightZone[];
}

export interface OptimizationEvaluation {
  iterate: boolean;
  recommended_adjustments: string[];
  expected_benefit: string;
}

export interface FloorPlan {
  designTitle: string;
  orientation: number; // Degrees from North
  rooms: Room[];
  totalArea: number;
  performanceMetrics: {
    naturalLightScore: number;
    ventilationEfficiency: number;
    thermalMassUtilization: number;
    solarControlRating: number;
  };
  architectReasoning: string;
  rejected_alternatives: RejectedAlternative[];
  diagnostics: ClimateDiagnostics;
}

export interface RefinementResult {
  revised_floor_plan: FloorPlan;
  changes_made: string[];
  expected_improvements: {
    heat: string;
    airflow: string;
    heat_improvement_pct: number;
    airflow_improvement_pct: number;
  };
}

export interface DesignState {
  isGenerating: boolean;
  isRefining: boolean;
  isEvaluating: boolean;
  isDiagnosing: boolean;
  climate?: ClimateData;
  floorPlan?: FloorPlan;
  previousFloorPlan?: FloorPlan;
  refinement?: RefinementResult;
  optimizationVerdict?: OptimizationEvaluation;
  error?: string;
  history: string[];
}
