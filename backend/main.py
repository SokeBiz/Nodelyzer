from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd  # Example use
from fastapi import HTTPException
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader

logging.basicConfig(level=logging.INFO)  # Sets up basic logging

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, GET, etc.
    allow_headers=["*"],
)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

class NodeData(BaseModel):
    nodes: list[dict]  # e.g., [{"lat": 40.7, "lon": -74.0, "country": "US"}]

class FailureRequest(BaseModel):
    nodes: list[dict]  # e.g., [{"lat": 40.7, "lon": -74.0, "country": "us"}]
    scenario: str = ""
    targets: list[str] = []

def gini_coefficient(values):
    import numpy as np
    cleaned_values = [float(v) for v in values if v > 0]
    if not cleaned_values: return 0.0
    arr = np.sort(cleaned_values)
    n = len(arr)
    if n <= 1: return 0.0
    index = np.arange(1, n + 1)
    numerator = np.sum((2 * index - n - 1) * arr)
    denominator = n * np.sum(arr)
    return float(numerator / denominator)

def nakamoto_coefficient(values):
    sorted_values = sorted((float(v) for v in values if v > 0), reverse=True)
    if not sorted_values: return 0
    total = sum(sorted_values)
    cumulative = 0.0
    for i, val in enumerate(sorted_values, 1):
        cumulative += val
        if cumulative >= total / 2:
            return i
    return len(sorted_values)

def generate_suggestions(df, gini, nakamoto):
    suggestions = []
    
    # Simple heuristic: If Gini > 0.5, network is unevenly distributed
    if gini > 0.5:
        suggestions.append("High concentration detected. Consider redistributing nodes to improve decentralization.")
    
    # Suggest adding nodes to underrepresented countries (bottom 5 with fewest nodes)
    country_counts = df['country'].value_counts()
    underrepresented = country_counts.nsmallest(5).index.tolist()  # Countries with least nodes
    if underrepresented:
        suggestions.append(f"Add nodes in underrepresented countries: {', '.join(underrepresented)}")
    
    # If Nakamoto is low (e.g., <5), warn about control risks
    if nakamoto < 5:
        suggestions.append(f"Low Nakamoto coefficient ({nakamoto}). Add nodes to diverse locations to increase resilience.")
    
    return suggestions if suggestions else ["Network looks balanced—no major suggestions."]

@app.post("/simulate-failure")
def simulate_failure(request: FailureRequest):  # Updated to take combined model
    # Convert nodes to a Pandas DataFrame for easier analysis
    df = pd.DataFrame(request.nodes)
    
    total_nodes = len(request.nodes)
    
    if total_nodes == 0:
        raise HTTPException(status_code=400, detail="No nodes provided.")
    
    if request.scenario == "cloud":
        if 'provider' not in df.columns or df['provider'].isnull().all():
            raise HTTPException(status_code=400, detail="Node data lacks 'provider' information for cloud scenario. Please include provider details or choose another scenario.")
    
    # Calculate failed nodes based on scenario
    if request.scenario == "region":
        failed_mask = df['country'].isin(request.targets)
    elif request.scenario == "cloud":
        failed_mask = df.get('provider', '').isin(request.targets)
    elif request.scenario == "51":  # Updated to match frontend value
        failed_mask = pd.Series([False] * len(df))  # Placeholder; cannot accurately simulate without more info
    else:
        failed_mask = pd.Series([False] * len(df))
    
    failed_count = int(failed_mask.sum())
    
    if 'stake' in df.columns and not df['stake'].isnull().all():
        total_stake = float(df['stake'].sum())
        failed_stake = float(df[failed_mask]['stake'].sum())
        connectivity_loss = (failed_stake / total_stake * 100) if total_stake > 0 else 0.0
        remaining_df = df[~failed_mask]
        country_values = remaining_df.groupby('country')['stake'].sum().tolist()
    else:
        connectivity_loss = (failed_count / total_nodes * 100) if total_nodes > 0 else 0.0
        remaining_df = df[~failed_mask]
        country_values = remaining_df['country'].value_counts().tolist()
    
    gini = gini_coefficient(country_values)
    nakamoto = nakamoto_coefficient(country_values)
    remaining_countries = len(remaining_df['country'].unique()) if 'country' in remaining_df.columns else 0

    # Return all results
    return {
        "total_nodes": total_nodes,
        "failed_nodes": failed_count,
        "connectivity_loss": f"{connectivity_loss:.2f}%",
        "scenario": request.scenario or "overview",
        "gini": gini,
        "nakamoto": nakamoto,
        "remaining_countries": remaining_countries
    }

@app.post("/optimize")
def optimize(data: NodeData):
    df = pd.DataFrame(data.nodes)
    
    if len(data.nodes) == 0:
        raise HTTPException(status_code=400, detail="No nodes provided.")
    
    logging.info(f"Optimizing for {len(data.nodes)} nodes")

    # Reuse existing metrics
    if 'stake' in df.columns and not df['stake'].isnull().all():
        country_values = df.groupby('country')['stake'].sum().tolist()
    else:
        country_values = df['country'].value_counts().tolist()
    gini = gini_coefficient(country_values)
    nakamoto = nakamoto_coefficient(country_values)
    
    # Generate suggestions
    if 'stake' in df.columns:
        country_counts = df.groupby('country')['stake'].sum()
    else:
        country_counts = df['country'].value_counts()
    underrepresented = country_counts.nsmallest(5).index.tolist()  # Countries with least nodes/stake
    suggestions = []
    if gini > 0.5:
        suggestions.append("High concentration detected. Consider redistributing nodes to improve decentralization.")
    if underrepresented:
        suggestions.append(f"Add nodes in underrepresented countries: {', '.join(underrepresented)}")
    if nakamoto < 5:
        suggestions.append(f"Low Nakamoto coefficient ({nakamoto}). Add nodes to diverse locations to increase resilience.")
    if not suggestions:
        suggestions = ["Network looks balanced—no major suggestions."]
    
    return {
        "gini": gini,
        "nakamoto": nakamoto,
        "suggestions": suggestions
    }
