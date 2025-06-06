from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import httpx
import googlemaps
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Soya Excel IoT & Route Optimization Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Maps client
gmaps = googlemaps.Client(key=os.getenv('GOOGLE_MAPS_API_KEY', ''))

# Django API base URL
DJANGO_API_URL = os.getenv('DJANGO_API_URL', 'http://localhost:8000/api')


# Pydantic models
class SensorData(BaseModel):
    sensor_id: str
    current_quantity: float
    timestamp: datetime
    temperature: Optional[float] = None
    humidity: Optional[float] = None


class RouteOptimizationRequest(BaseModel):
    route_id: int
    optimization_type: str = 'distance'  # distance, duration, balanced
    origin: Optional[Dict] = None
    destination: Optional[Dict] = None


class Location(BaseModel):
    latitude: float
    longitude: float
    address: str


@app.get("/")
async def root():
    return {"message": "Soya Excel IoT & Route Optimization Service"}


@app.post("/iot/sensor-data")
async def receive_sensor_data(sensor_data: SensorData):
    """Receive data from IoT sensors and update feed storage in Django"""
    try:
        async with httpx.AsyncClient() as client:
            # Find feed storage by sensor ID
            response = await client.get(
                f"{DJANGO_API_URL}/clients/feed-storage/",
                params={"sensor_id": sensor_data.sensor_id}
            )
            
            if response.status_code == 200:
                feed_storages = response.json()
                if feed_storages and len(feed_storages) > 0:
                    feed_storage_id = feed_storages[0]['id']
                    
                    # Update quantity
                    update_response = await client.post(
                        f"{DJANGO_API_URL}/clients/feed-storage/{feed_storage_id}/update_quantity/",
                        json={"current_quantity": sensor_data.current_quantity}
                    )
                    
                    if update_response.status_code == 200:
                        return {"status": "success", "data": update_response.json()}
                    else:
                        raise HTTPException(status_code=400, detail="Failed to update feed storage")
                else:
                    raise HTTPException(status_code=404, detail="Sensor not found")
            else:
                raise HTTPException(status_code=500, detail="Error connecting to Django API")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/routes/optimize")
async def optimize_route(request: RouteOptimizationRequest):
    """Optimize delivery routes using Google Maps API"""
    try:
        async with httpx.AsyncClient() as client:
            # Get route details from Django
            route_response = await client.get(
                f"{DJANGO_API_URL}/routes/routes/{request.route_id}/"
            )
            
            if route_response.status_code != 200:
                raise HTTPException(status_code=404, detail="Route not found")
            
            route_data = route_response.json()
            stops = route_data.get('stops', [])
            
            if len(stops) < 2:
                return {"message": "Route has too few stops to optimize"}
            
            # Prepare waypoints for Google Maps
            waypoints = []
            for stop in stops:
                if stop['farmer_address']:
                    waypoints.append(stop['farmer_address'])
            
            # Define origin and destination
            origin = request.origin or waypoints[0]
            destination = request.destination or waypoints[-1]
            intermediate_waypoints = waypoints[1:-1] if len(waypoints) > 2 else []
            
            # Call Google Maps Directions API
            directions_result = gmaps.directions(
                origin,
                destination,
                waypoints=intermediate_waypoints,
                optimize_waypoints=True,
                mode="driving",
                departure_time=datetime.now()
            )
            
            if directions_result:
                route = directions_result[0]
                
                # Extract optimized order
                waypoint_order = route.get('waypoint_order', [])
                total_distance = sum(leg['distance']['value'] for leg in route['legs'])
                total_duration = sum(leg['duration']['value'] for leg in route['legs'])
                
                # Prepare optimization result
                optimization_result = {
                    "route_id": request.route_id,
                    "optimization_type": request.optimization_type,
                    "optimized_order": waypoint_order,
                    "total_distance_km": total_distance / 1000,
                    "total_duration_minutes": total_duration / 60,
                    "waypoints": [],
                    "legs": []
                }
                
                # Add detailed leg information
                for i, leg in enumerate(route['legs']):
                    leg_info = {
                        "from": leg['start_address'],
                        "to": leg['end_address'],
                        "distance_km": leg['distance']['value'] / 1000,
                        "duration_minutes": leg['duration']['value'] / 60
                    }
                    optimization_result['legs'].append(leg_info)
                
                # Save optimization result to Django
                save_response = await client.post(
                    f"{DJANGO_API_URL}/routes/route-optimizations/",
                    json={
                        "route": request.route_id,
                        "request_data": request.dict(),
                        "response_data": optimization_result,
                        "optimization_type": request.optimization_type,
                        "success": True
                    }
                )
                
                return optimization_result
            else:
                raise HTTPException(status_code=400, detail="No route found")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/delivery-efficiency")
async def get_delivery_efficiency(start_date: str, end_date: str):
    """Calculate delivery efficiency metrics"""
    try:
        async with httpx.AsyncClient() as client:
            # Get deliveries within date range
            deliveries_response = await client.get(
                f"{DJANGO_API_URL}/drivers/deliveries/",
                params={
                    "start_date": start_date,
                    "end_date": end_date,
                    "status": "completed"
                }
            )
            
            if deliveries_response.status_code == 200:
                deliveries = deliveries_response.json()
                
                # Calculate metrics
                total_deliveries = len(deliveries)
                on_time_deliveries = sum(1 for d in deliveries if d.get('on_time', False))
                
                efficiency_metrics = {
                    "total_deliveries": total_deliveries,
                    "on_time_deliveries": on_time_deliveries,
                    "efficiency_percentage": (on_time_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0,
                    "average_delivery_time": 0,  # Calculate based on actual data
                    "period": {
                        "start": start_date,
                        "end": end_date
                    }
                }
                
                return efficiency_metrics
            else:
                raise HTTPException(status_code=500, detail="Error fetching delivery data")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 