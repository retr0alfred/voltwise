import joblib
import os
from pathlib import Path

# Single model for backward compatibility with existing /predict endpoint
model = None

# Dictionary to store all three models for multi-model predictions
models = {
    "t1": None,  # 15min model
    "t4": None,  # 1hr model (4 * 15min)
    "t8": None,  # 2hr model (8 * 15min)
}

# DAM model for day-ahead market prediction (24hr ahead)
dam_model = None

def load_model():
    """Load single 15min model for backward compatibility"""
    global model
    try:
        model_path = Path(__file__).parent.parent / "models" / "xgb_Tp15min.pkl"
        model = joblib.load(model_path)
        print(f"Model loaded successfully from: {model_path}")
        
        if model is None:
            raise ValueError("Model is None after loading")
        if not hasattr(model, 'predict'):
            raise ValueError("Loaded model does not have predict method")
            
        print(f"Model type: {type(model)}")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        raise

def load_all_models():
    """Load all three models (15min, 1hr, 2hr) for multi-model predictions"""
    global models
    try:
        models_dir = Path(__file__).parent.parent / "models"
        
        # Load all three models
        models["t1"] = joblib.load(models_dir / "xgb_Tp15min.pkl")
        models["t4"] = joblib.load(models_dir / "xgb_Tp1hr.pkl")
        models["t8"] = joblib.load(models_dir / "xgb_Tp2hr.pkl")
        
        # Verify all models are loaded
        for key, m in models.items():
            if m is None:
                raise ValueError(f"Model {key} is None after loading")
            if not hasattr(m, 'predict'):
                raise ValueError(f"Model {key} does not have predict method")
        
        print("All models loaded successfully:")
        print(f"  t1 (15min): {type(models['t1'])}")
        print(f"  t4 (1hr): {type(models['t4'])}")
        print(f"  t8 (2hr): {type(models['t8'])}")
        
        return True
    except Exception as e:
        print(f"Error loading models: {e}")
        raise

def is_model_loaded():
    """Check if single model is loaded and ready for prediction (backward compatibility)"""
    return model is not None and hasattr(model, 'predict')

def are_models_loaded():
    """Check if all three models are loaded and ready for prediction"""
    return all(m is not None and hasattr(m, 'predict') for m in models.values())

def load_dam_model():
    """Load DAM model for day-ahead market prediction"""
    global dam_model
    try:
        models_dir = Path(__file__).parent.parent / "models"
        dam_model = joblib.load(models_dir / "xgb_dam_T24hr.pkl")
        
        if dam_model is None:
            raise ValueError("DAM model is None after loading")
        if not hasattr(dam_model, 'predict'):
            raise ValueError("DAM model does not have predict method")
        
        print(f"DAM model loaded successfully: {type(dam_model)}")
        return True
    except Exception as e:
        print(f"Error loading DAM model: {e}")
        raise

def is_dam_model_loaded():
    """Check if DAM model is loaded and ready for prediction"""
    return dam_model is not None and hasattr(dam_model, 'predict')