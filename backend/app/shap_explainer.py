"""SHAP explainability module for XGBoost model predictions."""

import shap
import numpy as np
from app import model_loader

# Global singleton explainer
explainer = None

# Feature name to human-readable explanation mapping
FEATURE_EXPLANATIONS = {
    "purchase_bid_mw": "High purchase bid volume",
    "sell_bid_mw": "High sell bid volume",
    "mcv_mw": "Market clearing volume",
    "volume_mw": "Total trading volume",
    "mcp": "Current market price",
    "demand_national": "National electricity demand",
    "demand_north": "North regional demand",
    "demand_west": "West regional demand",
    "demand_east": "East regional demand",
    "demand_south": "South regional demand",
    "demand_northeast": "Northeast regional demand",
    "is_weekend": "Weekend effect",
    "is_peak_hour": "Peak hour demand",
    "mcp_lag1": "Recent price trend (15min lag)",
    "mcp_lag96": "Historical price trend (24hr lag)",
    "demand_lag1": "Recent demand change (15min lag)",
    "demand_lag96": "Historical demand change (24hr lag)",
    "mcp_ma4": "Short-term price average (1hr)",
    "mcp_ma96": "Long-term price average (24hr)",
    "mcp_rollstd96": "Price volatility (24hr)",
    "demand_rollmean96": "Demand average (24hr)",
    "price_momentum": "Price momentum indicator",
    "volatility_idx": "Market volatility index",
    "grid_stress": "Grid stress level",
    "price_chg_pct": "Price change percentage",
    "demand_growth": "Demand growth rate",
    "bid_ask_spread": "Bid-ask spread imbalance",
    "delhi_temp": "Delhi temperature",
    "delhi_humidity": "Delhi humidity",
    "delhi_windspeed": "Delhi wind speed",
    "delhi_precip": "Delhi precipitation",
    "delhi_cloudcover": "Delhi cloud cover",
    "mumbai_temp": "Mumbai temperature",
    "mumbai_humidity": "Mumbai humidity",
    "mumbai_windspeed": "Mumbai wind speed",
    "mumbai_precip": "Mumbai precipitation",
    "mumbai_cloudcover": "Mumbai cloud cover",
    "kolkata_temp": "Kolkata temperature",
    "kolkata_humidity": "Kolkata humidity",
    "kolkata_windspeed": "Kolkata wind speed",
    "kolkata_precip": "Kolkata precipitation",
    "kolkata_cloudcover": "Kolkata cloud cover",
    "chennai_temp": "Chennai temperature",
    "chennai_humidity": "Chennai humidity",
    "chennai_windspeed": "Chennai wind speed",
    "chennai_precip": "Chennai precipitation",
    "chennai_cloudcover": "Chennai cloud cover",
    "guwahati_temp": "Guwahati temperature",
    "guwahati_humidity": "Guwahati humidity",
    "guwahati_windspeed": "Guwahati wind speed",
    "guwahati_precip": "Guwahati precipitation",
    "guwahati_cloudcover": "Guwahati cloud cover",
    "solar_proxy": "Solar power generation",
    "wind_proxy": "Wind power generation",
    "renewable_proxy": "Renewable energy supply",
    "hour_sin": "Cyclical hour pattern (sine)",
    "hour_cos": "Cyclical hour pattern (cosine)",
    "month_sin": "Cyclical month pattern (sine)",
    "month_cos": "Cyclical month pattern (cosine)",
    "dow_sin": "Cyclical day-of-week pattern (sine)",
    "dow_cos": "Cyclical day-of-week pattern (cosine)",
    "demand_per_mw": "Demand per unit volume",
    "bid_ratio": "Purchase to sell bid ratio",
    "supply_shortage": "Supply shortage indicator",
    "avg_temp": "Average regional temperature",
    "avg_humidity": "Average regional humidity",
    "demand_lag4": "Demand change (1hr lag)",
    "mcp_ma12": "Price average (3hr)",
    "mcp_rollstd12": "Price volatility (3hr)",
    "mcp_lag4": "Price trend (1hr lag)"
}

# Feature name order from features.py
FEATURE_NAMES = [
    'purchase_bid_mw', 'sell_bid_mw', 'mcv_mw', 'volume_mw', 'mcp',
    'demand_national', 'demand_north', 'demand_west', 'demand_east', 'demand_south', 'demand_northeast',
    'is_weekend', 'is_peak_hour', 'mcp_lag1', 'mcp_lag96', 'demand_lag1', 'demand_lag96',
    'mcp_ma4', 'mcp_ma96', 'mcp_rollstd96', 'demand_rollmean96', 'price_momentum', 'volatility_idx',
    'grid_stress', 'price_chg_pct', 'demand_growth', 'bid_ask_spread',
    'delhi_temp', 'delhi_humidity', 'delhi_windspeed', 'delhi_precip', 'delhi_cloudcover',
    'mumbai_temp', 'mumbai_humidity', 'mumbai_windspeed', 'mumbai_precip', 'mumbai_cloudcover',
    'kolkata_temp', 'kolkata_humidity', 'kolkata_windspeed', 'kolkata_precip', 'kolkata_cloudcover',
    'chennai_temp', 'chennai_humidity', 'chennai_windspeed', 'chennai_precip', 'chennai_cloudcover',
    'guwahati_temp', 'guwahati_humidity', 'guwahati_windspeed', 'guwahati_precip', 'guwahati_cloudcover',
    'solar_proxy', 'wind_proxy', 'renewable_proxy',
    'hour_sin', 'hour_cos', 'month_sin', 'month_cos', 'dow_sin', 'dow_cos',
    'demand_per_mw', 'bid_ratio', 'supply_shortage', 'avg_temp', 'avg_humidity',
    'demand_lag4', 'mcp_ma12', 'mcp_rollstd12', 'mcp_lag4'
]


def get_explainer():
    """Get or create SHAP TreeExplainer singleton."""
    global explainer
    if explainer is None:
        # Use the 15min model (t1) for explainability
        model = model_loader.models["t1"]
        explainer = shap.TreeExplainer(model)
        print("SHAP TreeExplainer initialized")
    return explainer


def explain_prediction(features_df, top_n=3):
    """
    Generate SHAP explanation for a single prediction.
    
    Args:
        features_df: DataFrame with feature values (single row)
        top_n: Number of top features to return
    
    Returns:
        List of human-readable feature explanations
    """
    try:
        exp = get_explainer()
        
        # Compute SHAP values for the single row
        shap_values = exp.shap_values(features_df)
        
        # Handle array structure (SHAP may return nested arrays)
        if isinstance(shap_values, list):
            shap_values = shap_values[0]
        
        # Flatten to 1D array
        shap_values_flat = shap_values.flatten()
        
        # Compute absolute importance
        importance = np.abs(shap_values_flat)
        
        # Get top N feature indices
        top_indices = np.argsort(importance)[-top_n:][::-1]
        
        # Map to feature names and explanations
        top_features = []
        for idx in top_indices:
            feature_name = FEATURE_NAMES[idx]
            readable_explanation = FEATURE_EXPLANATIONS.get(feature_name, feature_name)
            top_features.append(readable_explanation)
        
        return top_features
        
    except Exception as e:
        print(f"Error computing SHAP explanation: {e}")
        # Return fallback explanations on error
        return ["Feature importance unavailable", "Model prediction based on multiple factors", "Historical patterns"]
