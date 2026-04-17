from fastapi import FastAPI, HTTPException, BackgroundTasks
from pathlib import Path
from app.schemas import InputData, BatchInput, SimulationRequest
from app.features import create_features
from app import model_loader
from app.simulator import simulator

app = FastAPI()

@app.on_event("startup")
def startup():
    try:
        # Load single model for existing endpoints
        model_loader.load_model()
        if model_loader.is_model_loaded():
            print("Model verified and ready for predictions")
        else:
            print("Warning: Model loading verification failed")
        
        # Load all models for multi-model endpoint
        model_loader.load_all_models()
        if model_loader.are_models_loaded():
            print("All models verified and ready for multi-model predictions")
        else:
            print("Warning: Multi-model loading verification failed")
    except Exception as e:
        print(f"Failed to load models during startup: {e}")
        raise

@app.get("/")
def home():
    return {"message": "VoltWise 15min Prediction API running"}

@app.post("/predict")
def predict_price(data: InputData):
    # Check if model is loaded
    if not model_loader.is_model_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded or unavailable")
    
    try:
        df = create_features(data.dict())

        # IMPORTANT: ensure column order matches training
        X = df  # later we will strictly align FEATURES

        prediction = model_loader.model.predict(X)[0]

        return {
            "prediction_t+15min": float(prediction)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict-batch")
def predict_batch(batch: BatchInput):
    # Check if model is loaded
    if not model_loader.is_model_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded or unavailable")
    
    try:
        # Convert list of InputData to list of dicts
        data_list = [item.dict() for item in batch.data]
        
        # Create features for all inputs at once
        df = create_features(data_list)
        
        # Run vectorized prediction
        predictions = model_loader.model.predict(df)
        
        # Format response
        result = {
            "count": len(predictions),
            "predictions": [{"prediction_t+15min": float(pred)} for pred in predictions]
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

@app.post("/predict-batch-all")
def predict_batch_all(batch: BatchInput):
    # Check if all models are loaded
    if not model_loader.are_models_loaded():
        raise HTTPException(status_code=503, detail="Models not loaded or unavailable")
    
    try:
        # Convert list of InputData to list of dicts
        data_list = [item.dict() for item in batch.data]
        
        # Create features for all inputs at once
        df = create_features(data_list)
        
        # Run vectorized predictions for all three models
        pred_t1 = model_loader.models["t1"].predict(df)
        pred_t4 = model_loader.models["t4"].predict(df)
        pred_t8 = model_loader.models["t8"].predict(df)
        
        # Format response with combined predictions per row
        predictions = [
            {
                "t+15min": float(pred_t1[i]),
                "t+1hr": float(pred_t4[i]),
                "t+2hr": float(pred_t8[i])
            }
            for i in range(len(pred_t1))
        ]
        
        result = {
            "count": len(predictions),
            "predictions": predictions
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multi-model batch prediction failed: {str(e)}")

def run_simulation_task(speed: float, limit: int):
    """Background task to run simulation."""
    try:
        csv_path = Path(__file__).parent.parent / "data" / "voltwise_final.csv"
        output_path = Path(__file__).parent.parent / "data" / "simulation_output.csv"
        
        summary = simulator.run_simulation(
            csv_path=csv_path,
            speed=speed,
            limit=limit,
            output_path=output_path
        )
        
        print(f"Simulation completed: {summary}")
    except Exception as e:
        print(f"Simulation failed: {e}")

@app.post("/simulate")
def start_simulation(request: SimulationRequest, background_tasks: BackgroundTasks):
    """Start continuous historical data simulation in background."""
    # Check if all models are loaded
    if not model_loader.are_models_loaded():
        raise HTTPException(status_code=503, detail="Models not loaded or unavailable")
    
    # Check if simulation is already running
    if simulator.is_running:
        raise HTTPException(status_code=409, detail="Simulation already in progress")
    
    # Add background task
    background_tasks.add_task(run_simulation_task, request.speed, request.limit)
    
    return {
        "message": "Continuous simulation started in background",
        "speed": request.speed,
        "limit": request.limit,
        "status": "running"
    }

@app.get("/live-data")
def get_live_data():
    """Get latest streaming results from live buffer."""
    return {
        "data": list(simulator.live_buffer),
        "is_running": simulator.is_running,
        "current_index": simulator.current_index,
        "total_processed": len(simulator.results)
    }

@app.post("/stop-simulation")
def stop_simulation():
    """Stop the running continuous simulation."""
    if not simulator.is_running:
        raise HTTPException(status_code=409, detail="No simulation is currently running")
    
    simulator.stop()
    
    return {
        "message": "Simulation stopped",
        "status": "stopped",
        "total_processed": len(simulator.results)
    }