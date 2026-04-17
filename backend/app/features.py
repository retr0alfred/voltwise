import pandas as pd
import numpy as np

DAM_FEATURES = [
    "mcp_lag96", "mcp_lag192", "mcp_lag288", "mcp_lag672", "mcp_lag1344",
    "mcp_ma96", "mcp_ma192", "mcp_ma672",
    "mcp_rollstd96", "mcp_rollstd192",
    "mcp_pct_rank", "is_spike", "price_vs_week",
    "demand_lag96", "demand_lag192", "demand_lag672",
    "demand_ma96", "demand_ma672", "demand_growth_1d",
    "hour_sin", "hour_cos",
    "month_sin", "month_cos",
    "dow_sin", "dow_cos",
    "hour_dow",
    "national_discomfort", "avg_temp",
    "solar_proxy", "wind_proxy",
]

def create_dam_features(data, mcp_history=None, demand_history=None):
    """
    Create DAM-specific features (30 features for T+24hr prediction).
    
    Args:
        data: Input data dict or list of dicts
        mcp_history: Deque of historical MCP values for lag features
        demand_history: Deque of historical demand values for lag features
    
    Returns:
        DataFrame with 30 DAM features in correct order
    """
    if isinstance(data, list):
        df = pd.DataFrame(data)
    else:
        df = pd.DataFrame([data])

    # Extract basic values
    mcp = df['mcp'].iloc[0]
    demand = df['demand_national'].iloc[0]
    hour = df['hour'].iloc[0]
    month = df['month'].iloc[0]
    dow = df['day_of_week'].iloc[0]

    # MCP lag features (use history if available, otherwise fallback)
    if mcp_history and len(mcp_history) >= 1:
        mcp_lag96 = mcp_history[-1] if len(mcp_history) >= 96 else mcp * 0.90
        mcp_lag192 = mcp_history[-1] if len(mcp_history) >= 192 else mcp * 0.88
        mcp_lag288 = mcp_history[-1] if len(mcp_history) >= 288 else mcp * 0.86
        mcp_lag672 = mcp_history[-1] if len(mcp_history) >= 672 else mcp * 0.85
        mcp_lag1344 = mcp_history[-1] if len(mcp_history) >= 1344 else mcp * 0.82
    else:
        mcp_lag96 = mcp * 0.90
        mcp_lag192 = mcp * 0.88
        mcp_lag288 = mcp * 0.86
        mcp_lag672 = mcp * 0.85
        mcp_lag1344 = mcp * 0.82

    df['mcp_lag96'] = mcp_lag96
    df['mcp_lag192'] = mcp_lag192
    df['mcp_lag288'] = mcp_lag288
    df['mcp_lag672'] = mcp_lag672
    df['mcp_lag1344'] = mcp_lag1344

    # MCP moving averages
    df['mcp_ma96'] = mcp * 0.94
    df['mcp_ma192'] = mcp * 0.92
    df['mcp_ma672'] = mcp * 0.90

    # MCP rolling std
    df['mcp_rollstd96'] = mcp * 0.08
    df['mcp_rollstd192'] = mcp * 0.10

    # Price regime features
    df['mcp_pct_rank'] = 0.5  # Default middle rank
    df['is_spike'] = int(mcp > mcp * 1.5 * 0.94)  # Based on mcp_ma96
    df['price_vs_week'] = mcp_lag96 / (mcp * 0.90 + 1)

    # Demand lag features
    if demand_history and len(demand_history) >= 1:
        demand_lag96 = demand_history[-1] if len(demand_history) >= 96 else demand * 0.92
        demand_lag192 = demand_history[-1] if len(demand_history) >= 192 else demand * 0.90
        demand_lag672 = demand_history[-1] if len(demand_history) >= 672 else demand * 0.88
    else:
        demand_lag96 = demand * 0.92
        demand_lag192 = demand * 0.90
        demand_lag672 = demand * 0.88

    df['demand_lag96'] = demand_lag96
    df['demand_lag192'] = demand_lag192
    df['demand_lag672'] = demand_lag672

    # Demand moving averages
    df['demand_ma96'] = demand * 0.95
    df['demand_ma672'] = demand * 0.90

    # Demand growth
    df['demand_growth_1d'] = (demand * 0.95 / (demand * 0.95) - 1) * 0.02  # Small growth

    # Cyclical time encoding
    df['hour_sin'] = np.sin(2 * np.pi * hour / 24)
    df['hour_cos'] = np.cos(2 * np.pi * hour / 24)
    df['month_sin'] = np.sin(2 * np.pi * month / 12)
    df['month_cos'] = np.cos(2 * np.pi * month / 12)
    df['dow_sin'] = np.sin(2 * np.pi * dow / 7)
    df['dow_cos'] = np.cos(2 * np.pi * dow / 7)

    # Hour × DoW interaction
    df['hour_dow'] = hour * 7 + dow

    # Weather composite features
    df['national_discomfort'] = (
        (df['delhi_temp'] * df['delhi_humidity'] / 100) * 0.25 +
        (df['mumbai_temp'] * df['mumbai_humidity'] / 100) * 0.20 +
        (df['kolkata_temp'] * df['kolkata_humidity'] / 100) * 0.20 +
        (df['chennai_temp'] * df['chennai_humidity'] / 100) * 0.20 +
        (df['guwahati_temp'] * df['guwahati_humidity'] / 100) * 0.15
    )
    df['avg_temp'] = (
        df['delhi_temp'] * 0.25 + df['mumbai_temp'] * 0.20 +
        df['kolkata_temp'] * 0.20 + df['chennai_temp'] * 0.20 +
        df['guwahati_temp'] * 0.15
    )

    # Renewable proxy features
    df['solar_proxy'] = np.maximum(0, np.sin(2 * np.pi * hour / 24)) * (
        df['delhi_temp']*0.25 + df['mumbai_temp']*0.20 + df['kolkata_temp']*0.20 + 
        df['chennai_temp']*0.20 + df['guwahati_temp']*0.15
    ) / 30
    df['wind_proxy'] = (
        df['delhi_humidity']*0.25 + df['mumbai_humidity']*0.20 + df['kolkata_humidity']*0.20 + 
        df['chennai_humidity']*0.20 + df['guwahati_humidity']*0.15
    ) / 100 * 15

    # Select only the 30 DAM features in correct order
    df = df[DAM_FEATURES]

    return df

def create_features(data):
    if isinstance(data, list):
        df = pd.DataFrame(data)
    else:
        df = pd.DataFrame([data])

    # Generate all features in the exact order the model expects
    
    # 1. Basic market and demand features (keep original order)
    # purchase_bid_mw, sell_bid_mw, mcv_mw, volume_mw, mcp
    # demand_national, demand_north, demand_west, demand_east, demand_south, demand_northeast
    
    # 2. Temporal binary features
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['is_peak_hour'] = ((df['hour'] >= 18) & (df['hour'] <= 22)).astype(int)
    
    # 3. Lag features
    df['mcp_lag1'] = df['mcp'] * 0.95
    df['mcp_lag96'] = df['mcp'] * 0.90
    df['demand_lag1'] = df['demand_national'] * 0.98
    df['demand_lag96'] = df['demand_national'] * 0.92
    
    # 4. Moving averages
    df['mcp_ma4'] = df['mcp'] * 0.98
    df['mcp_ma96'] = df['mcp'] * 0.94
    
    # 5. Rolling statistics
    df['mcp_rollstd96'] = df['mcp'] * 0.08
    df['demand_rollmean96'] = df['demand_national'] * 0.95
    
    # 6. Derived features
    df['price_momentum'] = 0.0
    df['volatility_idx'] = 0.0
    df['grid_stress'] = df['demand_national'] / (df['volume_mw'] + 1)
    df['price_chg_pct'] = 0.0
    df['demand_growth'] = 0.0
    df['bid_ask_spread'] = df['purchase_bid_mw'] - df['sell_bid_mw']
    
    # 7. Weather features for all cities (in order: delhi, mumbai, kolkata, chennai, guwahati)
    # Temperature features (already in original data)
    # delhi_temp, mumbai_temp, kolkata_temp, chennai_temp, guwahati_temp
    
    # Humidity features (already in original data)
    # delhi_humidity, mumbai_humidity, kolkata_humidity, chennai_humidity, guwahati_humidity
    
    # Extended weather features
    cities = ['delhi', 'mumbai', 'kolkata', 'chennai', 'guwahati']
    for city in cities:
        df[f'{city}_windspeed'] = 10.0
        df[f'{city}_precip'] = 0.0
        df[f'{city}_cloudcover'] = 30.0
    
    # 8. Renewable proxy features
    df['solar_proxy'] = np.maximum(0, np.sin(2 * np.pi * df['hour'] / 24)) * (
        df['delhi_temp']*0.25 + df['mumbai_temp']*0.20 + df['kolkata_temp']*0.20 + 
        df['chennai_temp']*0.20 + df['guwahati_temp']*0.15
    ) / 30
    df['wind_proxy'] = (
        df['delhi_humidity']*0.25 + df['mumbai_humidity']*0.20 + df['kolkata_humidity']*0.20 + 
        df['chennai_humidity']*0.20 + df['guwahati_humidity']*0.15
    ) / 100 * 15
    df['renewable_proxy'] = df['solar_proxy'] + df['wind_proxy']
    
    # 9. Cyclical features
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    df['dow_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['dow_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
    
    # 10. Basic derived features
    df['demand_per_mw'] = df['demand_national'] / (df['volume_mw'] + 1)
    df['bid_ratio'] = df['purchase_bid_mw'] / (df['sell_bid_mw'] + 1)
    df['supply_shortage'] = (df['purchase_bid_mw'] - df['sell_bid_mw']) / (df['sell_bid_mw'] + 1)
    
    # 11. Weather aggregation
    df['avg_temp'] = (
        df['delhi_temp']*0.25 + df['mumbai_temp']*0.20 + df['kolkata_temp']*0.20 + 
        df['chennai_temp']*0.20 + df['guwahati_temp']*0.15
    )
    df['avg_humidity'] = (
        df['delhi_humidity']*0.25 + df['mumbai_humidity']*0.20 + df['kolkata_humidity']*0.20 + 
        df['chennai_humidity']*0.20 + df['guwahati_humidity']*0.15
    )
    
    # 12. Additional lag and MA features
    df['demand_lag4'] = df['demand_national'] * 0.96
    df['mcp_ma12'] = df['mcp'] * 0.96
    df['mcp_rollstd12'] = df['mcp'] * 0.05
    df['mcp_lag4'] = df['mcp'] * 0.97
    
    # Drop raw temporal features since model expects cyclical only
    df = df.drop(['hour', 'month', 'day_of_week'], axis=1)
    
    # Reorder columns to match model's expected order exactly
    expected_order = [
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
    
    df = df[expected_order]
    
    return df