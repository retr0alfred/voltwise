"""Real-time simulation pipeline for historical data replay."""

import pandas as pd
import numpy as np
import time
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime
from collections import deque

from app.features import create_features
from app import model_loader
from app.decision_engine import make_decision
from app.shap_explainer import explain_prediction


class SimulationPipeline:
    """Pipeline for simulating real-time predictions on historical data."""
    
    def __init__(self):
        self.is_running = False
        self.results = []
        self.simulation_id = None
        # Queue-based real lag features (persistent)
        self.mcp_history = deque(maxlen=96)
        self.demand_history = deque(maxlen=96)
        # Evaluation metrics
        self.correct_predictions = 0
        self.total_predictions = 0
        # Continuous streaming state
        self.current_index = 0
        self.df = None  # Store loaded DataFrame for reuse
        self.csv_path = None
        self.live_buffer = deque(maxlen=100)  # Rolling buffer for live data
        self.initialized = False  # Track if lag queues have been initialized
        
    def load_data(self, csv_path: Path) -> pd.DataFrame:
        """Load and sort CSV data by datetime."""
        df = pd.read_csv(csv_path)
        
        # Sort by datetime if column exists
        if 'datetime' in df.columns:
            df = df.sort_values('datetime')
        
        return df
    
    def extract_input_data(self, row: pd.Series) -> Dict[str, Any]:
        """Extract fields required by InputData schema from CSV row."""
        # Map CSV columns to InputData fields
        # This mapping may need adjustment based on actual CSV structure
        input_data = {
            "purchase_bid_mw": row.get('purchase_bid_mw', 0),
            "sell_bid_mw": row.get('sell_bid_mw', 0),
            "mcv_mw": row.get('mcv_mw', 0),
            "volume_mw": row.get('volume_mw', 0),
            "mcp": row.get('mcp', 0),
            
            "demand_national": row.get('demand_national', 0),
            "demand_north": row.get('demand_north', 0),
            "demand_west": row.get('demand_west', 0),
            "demand_east": row.get('demand_east', 0),
            "demand_south": row.get('demand_south', 0),
            "demand_northeast": row.get('demand_northeast', 0),
            
            "hour": int(row.get('hour', 0)),
            "month": int(row.get('month', 1)),
            "day_of_week": int(row.get('day_of_week', 0)),
            
            "delhi_temp": row.get('delhi_temp', 25),
            "mumbai_temp": row.get('mumbai_temp', 27),
            "kolkata_temp": row.get('kolkata_temp', 26),
            "chennai_temp": row.get('chennai_temp', 28),
            "guwahati_temp": row.get('guwahati_temp', 24),
            
            "delhi_humidity": row.get('delhi_humidity', 60),
            "mumbai_humidity": row.get('mumbai_humidity', 70),
            "kolkata_humidity": row.get('kolkata_humidity', 65),
            "chennai_humidity": row.get('chennai_humidity', 75),
            "guwahati_humidity": row.get('guwahati_humidity', 80)
        }
        
        return input_data
    
    def run_simulation(
        self,
        csv_path: Path,
        speed: float = 1.0,
        limit: Optional[int] = None,
        output_path: Optional[Path] = None
    ) -> Dict[str, Any]:
        """
        Run continuous simulation on historical data with persistent state.
        
        Args:
            csv_path: Path to historical CSV file
            speed: Delay multiplier (1.0 = 1 second per row)
            limit: Maximum number of rows to process (None = infinite loop)
            output_path: Path to save results CSV (periodic snapshots)
        
        Returns:
            Summary of simulation results
        """
        if not model_loader.are_models_loaded():
            raise RuntimeError("Models not loaded. Cannot run simulation.")
        
        # Load data once (reuse for continuous streaming)
        if self.df is None or self.csv_path != str(csv_path):
            self.df = self.load_data(csv_path)
            self.csv_path = str(csv_path)
            self.current_index = 0  # Reset index on new data load
        
        # Apply limit if specified (only for initial dataset size)
        df = self.df
        if limit and limit < len(df):
            df = df.head(limit)
        
        # Initialize persistent state only on first run
        if not self.initialized:
            self.is_running = True
            self.results = []
            self.simulation_id = datetime.now().strftime("%Y%m%d_%H%M%S")
            # Only clear lag queues on first initialization
            self.mcp_history.clear()
            self.demand_history.clear()
            self.correct_predictions = 0
            self.total_predictions = 0
            self.initialized = True
        else:
            # Resume with persistent state
            self.is_running = True
        
        print(f"Starting continuous simulation on {len(df)} rows with speed={speed}")
        
        # Continuous streaming loop
        loop_count = 0
        while self.is_running:
            try:
                # Get current row using pointer-based iteration
                row = df.iloc[self.current_index]
                
                # Extract input data
                input_data = self.extract_input_data(row)
                current_mcp = input_data['mcp']
                current_demand = input_data['demand_national']
                
                # Get datetime if available
                row_datetime = row.get('datetime', f"row_{self.current_index}")
                
                # Inject real lag values from persistent history
                if len(self.mcp_history) >= 1:
                    input_data['mcp_lag1'] = self.mcp_history[-1]
                else:
                    input_data['mcp_lag1'] = current_mcp * 0.95  # fallback
                
                if len(self.mcp_history) >= 96:
                    input_data['mcp_lag96'] = self.mcp_history[0]
                else:
                    input_data['mcp_lag96'] = current_mcp * 0.90  # fallback
                
                if len(self.demand_history) >= 1:
                    input_data['demand_lag1'] = self.demand_history[-1]
                else:
                    input_data['demand_lag1'] = current_demand * 0.98  # fallback
                
                if len(self.demand_history) >= 96:
                    input_data['demand_lag96'] = self.demand_history[0]
                else:
                    input_data['demand_lag96'] = current_demand * 0.92  # fallback
                
                # Create features
                features_df = create_features(input_data)
                
                # Generate predictions using all three models
                pred_t1 = model_loader.models["t1"].predict(features_df)[0]
                pred_t4 = model_loader.models["t4"].predict(features_df)[0]
                pred_t8 = model_loader.models["t8"].predict(features_df)[0]
                
                # Stability fix: clamp extreme predictions
                pred_t8 = min(max(pred_t8, current_mcp * 0.5), current_mcp * 2)
                
                # Get actual future values for evaluation
                next_idx = self.current_index + 1
                actual_t1 = df.iloc[next_idx]['mcp'] if next_idx < len(df) else None
                actual_t4 = df.iloc[self.current_index + 4]['mcp'] if self.current_index + 4 < len(df) else None
                actual_t8 = df.iloc[self.current_index + 8]['mcp'] if self.current_index + 8 < len(df) else None
                
                # Make decision
                decision_result = make_decision(current_mcp, pred_t1, pred_t4, pred_t8)
                
                # Evaluate prediction accuracy
                correct_prediction = False
                if actual_t1 is not None:
                    pred_direction = "UP" if pred_t1 > current_mcp else "DOWN"
                    actual_direction = "UP" if actual_t1 > current_mcp else "DOWN"
                    correct_prediction = (pred_direction == actual_direction)
                    self.total_predictions += 1
                    if correct_prediction:
                        self.correct_predictions += 1
                
                # Store result with enhanced fields
                result = {
                    "datetime": row_datetime,
                    "current_mcp": current_mcp,
                    "pred_t+15min": float(pred_t1),
                    "pred_t+1hr": float(pred_t4),
                    "pred_t+2hr": float(pred_t8),
                    "actual_t1": float(actual_t1) if actual_t1 is not None else None,
                    "actual_t4": float(actual_t4) if actual_t4 is not None else None,
                    "actual_t8": float(actual_t8) if actual_t8 is not None else None,
                    "decision": decision_result["decision"],
                    "confidence": decision_result["confidence"],
                    "reason": decision_result["reason"],
                    "correct_prediction": correct_prediction
                }
                
                self.results.append(result)
                
                # Compute SHAP explanation for latest prediction only
                top_features = explain_prediction(features_df, top_n=3)
                
                # Add to live buffer for dashboard
                live_result = {
                    "datetime": row_datetime,
                    "current_mcp": current_mcp,
                    "pred_t+15min": float(pred_t1),
                    "pred_t+1hr": float(pred_t4),
                    "pred_t+2hr": float(pred_t8),
                    "decision": decision_result["decision"],
                    "confidence": decision_result["confidence"],
                    "explanation": {
                        "top_features": top_features
                    }
                }
                self.live_buffer.append(live_result)
                
                # Update persistent history with current values
                self.mcp_history.append(current_mcp)
                self.demand_history.append(current_demand)
                
                # Progress logging (every 100 rows)
                if (self.current_index + 1) % 100 == 0:
                    print(f"Processed {self.current_index + 1}/{len(df)} rows (loop {loop_count})")
                
                # Periodic snapshot save (every 500 rows)
                if output_path and len(self.results) % 500 == 0:
                    self.save_results(output_path)
                
                # Move to next row
                self.current_index += 1
                
                # Loop back to start when reaching end (continuous streaming)
                if self.current_index >= len(df):
                    self.current_index = 0
                    loop_count += 1
                    print(f"Completed loop {loop_count}. Restarting from beginning...")
                
                # Simulate real-time delay
                delay = 1.0 / speed
                if delay > 0:
                    time.sleep(delay)
                    
            except Exception as e:
                print(f"Error processing row {self.current_index}: {e}")
                self.current_index += 1
                if self.current_index >= len(df):
                    self.current_index = 0
                continue
        
        # Final save when simulation stops
        if output_path and self.results:
            self.save_results(output_path)
        
        self.is_running = False
        
        # Generate summary
        summary = self.generate_summary()
        
        print(f"Simulation stopped. Processed {len(self.results)} rows total.")
        
        return summary
    
    def save_results(self, output_path: Path):
        """Save simulation results to CSV."""
        results_df = pd.DataFrame(self.results)
        results_df.to_csv(output_path, index=False)
        print(f"Results saved to {output_path}")
    
    def generate_summary(self) -> Dict[str, Any]:
        """Generate summary statistics from simulation results with accuracy metrics."""
        if not self.results:
            return {"error": "No results to summarize"}
        
        df = pd.DataFrame(self.results)
        
        # Decision distribution
        decision_counts = df['decision'].value_counts().to_dict()
        
        # Average confidence
        avg_confidence = df['confidence'].mean()
        
        # Directional accuracy
        accuracy = 0.0
        if self.total_predictions > 0:
            accuracy = self.correct_predictions / self.total_predictions
        
        # Prediction statistics
        pred_stats = {
            "t+15min": {
                "mean": df['pred_t+15min'].mean(),
                "std": df['pred_t+15min'].std(),
                "min": df['pred_t+15min'].min(),
                "max": df['pred_t+15min'].max()
            },
            "t+1hr": {
                "mean": df['pred_t+1hr'].mean(),
                "std": df['pred_t+1hr'].std(),
                "min": df['pred_t+1hr'].min(),
                "max": df['pred_t+1hr'].max()
            },
            "t+2hr": {
                "mean": df['pred_t+2hr'].mean(),
                "std": df['pred_t+2hr'].std(),
                "min": df['pred_t+2hr'].min(),
                "max": df['pred_t+2hr'].max()
            }
        }
        
        summary = {
            "simulation_id": self.simulation_id,
            "total_rows": len(self.results),
            "decision_distribution": decision_counts,
            "average_confidence": round(avg_confidence, 4),
            "directional_accuracy": round(accuracy, 4),
            "total_evaluated": self.total_predictions,
            "correct_predictions": self.correct_predictions,
            "prediction_statistics": pred_stats
        }
        
        return summary
    
    def stop(self):
        """Stop the running simulation."""
        self.is_running = False


# Global simulator instance
simulator = SimulationPipeline()
