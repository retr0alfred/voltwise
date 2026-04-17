"""Day-Ahead Market (DAM) simulation pipeline for 24hr ahead predictions."""

import pandas as pd
import numpy as np
import time
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime
from collections import deque

from app.features import create_dam_features
from app import model_loader


class DAMSimulationPipeline:
    """Pipeline for simulating day-ahead market predictions on historical data."""
    
    def __init__(self):
        self.is_running = False
        self.results = []
        self.simulation_id = None
        # Queue-based real lag features (persistent)
        self.mcp_history = deque(maxlen=1344)  # Need up to 1344 lags for DAM
        self.demand_history = deque(maxlen=672)  # Need up to 672 lags for DAM
        # Live buffer for dashboard (last 100 results)
        self.live_buffer = deque(maxlen=100)
        # Evaluation metrics
        self.correct_predictions = 0
        self.total_predictions = 0
        # Continuous streaming state
        self.current_index = 0
        self.df = None  # Store loaded DataFrame for reuse
        self.csv_path = None
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
        Run DAM simulation on historical data with persistent state.
        
        Args:
            csv_path: Path to historical CSV file
            speed: Delay multiplier (1.0 = 1 second per row)
            limit: Maximum number of rows to process (None = infinite loop)
            output_path: Path to save results CSV (periodic snapshots)
        
        Returns:
            Summary of simulation results
        """
        if not model_loader.is_dam_model_loaded():
            raise RuntimeError("DAM model not loaded. Cannot run simulation.")
        
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
        
        print(f"Starting DAM simulation on {len(df)} rows with speed={speed}")
        
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
                
                # Create DAM features with lag history
                features_df = create_dam_features(input_data, self.mcp_history, self.demand_history)
                
                # Generate DAM prediction (24hr ahead)
                pred_dam = model_loader.dam_model.predict(features_df)[0]
                
                # Get actual DAM price for evaluation (96 rows ahead)
                actual_dam = df.iloc[self.current_index + 96]['mcp'] if self.current_index + 96 < len(df) else None
                
                # Evaluate prediction accuracy
                correct_prediction = False
                if actual_dam is not None:
                    pred_direction = "UP" if pred_dam > current_mcp else "DOWN"
                    actual_direction = "UP" if actual_dam > current_mcp else "DOWN"
                    correct_prediction = (pred_direction == actual_direction)
                    self.total_predictions += 1
                    if correct_prediction:
                        self.correct_predictions += 1
                
                # Store result
                result = {
                    "datetime": row_datetime,
                    "current_mcp": current_mcp,
                    "predicted_dam_price": float(pred_dam),
                    "actual_dam_price": float(actual_dam) if actual_dam is not None else None,
                    "error": float(actual_dam - pred_dam) if actual_dam is not None else None,
                    "abs_error": float(abs(actual_dam - pred_dam)) if actual_dam is not None else None,
                    "correct_prediction": correct_prediction
                }
                
                self.results.append(result)
                
                # Add to live buffer for dashboard
                live_result = {
                    "datetime": row_datetime,
                    "current_mcp": float(current_mcp),
                    "predicted_dam_price": float(pred_dam),
                    "actual_dam_price": float(actual_dam) if actual_dam is not None else None,
                    "error": float(actual_dam - pred_dam) if actual_dam is not None else None,
                    "abs_error": float(abs(actual_dam - pred_dam)) if actual_dam is not None else None,
                    "correct_prediction": correct_prediction
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
        
        print(f"DAM simulation stopped. Processed {len(self.results)} rows total.")
        
        return summary
    
    def save_results(self, output_path: Path):
        """Save DAM simulation results to CSV."""
        results_df = pd.DataFrame(self.results)
        results_df.to_csv(output_path, index=False)
        print(f"DAM results saved to {output_path}")
    
    def generate_summary(self) -> Dict[str, Any]:
        """Generate summary statistics from DAM simulation results."""
        if not self.results:
            return {"error": "No results to summarize"}
        
        df = pd.DataFrame(self.results)
        
        # Directional accuracy
        accuracy = 0.0
        if self.total_predictions > 0:
            accuracy = self.correct_predictions / self.total_predictions
        
        # Prediction statistics
        pred_stats = {
            "predicted_dam": {
                "mean": df['predicted_dam_price'].mean(),
                "std": df['predicted_dam_price'].std(),
                "min": df['predicted_dam_price'].min(),
                "max": df['predicted_dam_price'].max()
            }
        }
        
        # Error statistics
        error_stats = {}
        if 'error' in df.columns and df['error'].notna().any():
            error_stats = {
                "mae": df['abs_error'].mean(),
                "rmse": np.sqrt((df['error'] ** 2).mean()),
                "mape": (df['abs_error'] / df['current_mcp']).mean() * 100
            }
        
        summary = {
            "simulation_id": self.simulation_id,
            "total_rows": len(self.results),
            "directional_accuracy": round(accuracy, 4),
            "total_evaluated": self.total_predictions,
            "correct_predictions": self.correct_predictions,
            "prediction_statistics": pred_stats,
            "error_statistics": error_stats
        }
        
        return summary
    
    def stop(self):
        """Stop the running DAM simulation."""
        self.is_running = False


# Global DAM simulator instance
dam_simulator = DAMSimulationPipeline()
