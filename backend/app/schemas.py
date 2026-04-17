from pydantic import BaseModel
from typing import List, Optional

class InputData(BaseModel):
    purchase_bid_mw: float
    sell_bid_mw: float
    mcv_mw: float
    volume_mw: float
    mcp: float

    demand_national: float
    demand_north: float
    demand_west: float
    demand_east: float
    demand_south: float
    demand_northeast: float

    hour: int
    month: int
    day_of_week: int

    delhi_temp: float
    mumbai_temp: float
    kolkata_temp: float
    chennai_temp: float
    guwahati_temp: float

    delhi_humidity: float
    mumbai_humidity: float
    kolkata_humidity: float
    chennai_humidity: float
    guwahati_humidity: float

class BatchInput(BaseModel):
    data: List[InputData]

class SimulationRequest(BaseModel):
    speed: float = 1.0
    limit: Optional[int] = None

class DAMSimulationRequest(BaseModel):
    speed: float = 1.0
    limit: Optional[int] = None