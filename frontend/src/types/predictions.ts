export interface LiveDataExplanation {
  top_features: string[];
}

export interface LiveDataPoint {
  datetime: string;
  current_mcp: number;
  "pred_t+15min": number;
  "pred_t+1hr": number;
  "pred_t+2hr": number;
  decision: string;
  confidence: number;
  explanation?: LiveDataExplanation;
}

export interface LiveDataResponse {
  data: LiveDataPoint[];
  is_running: boolean;
  current_index: number;
  total_processed: number;
}

export interface SimulationControlPayload {
  speed: number;
  limit: number | null;
}
