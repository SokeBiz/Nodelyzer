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

def gini_coefficient(values):
    import numpy as np
    arr = np.sort([v for v in values if v > 0])
    n = len(arr)
    if n <= 1: return 0
    index = np.arange(1, n + 1)
    return (np.sum((2 * index - n - 1) * arr) / (n * np.sum(arr)))  # Gini formula

def nakamoto_coefficient(values):
    sorted_values = sorted(values, reverse=True)
    total = sum(sorted_values)
    cumulative = 0
    for i, val in enumerate(sorted_values, 1):
        cumulative += val
        if cumulative >= total / 2:
            return i
    return len(values)  # Fallback

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
def simulate_failure(data: NodeData, scenario: str = "", target: str = ""):  # Allow empty defaults for overview
    # Convert nodes to a Pandas DataFrame for easier analysis
    df = pd.DataFrame(data.nodes)
    
    total_nodes = len(data.nodes)
    
    if total_nodes == 0:
        raise HTTPException(status_code=400, detail="No nodes provided.")
    
    if scenario == "cloud":
        if 'provider' not in df.columns or df['provider'].isnull().all():
            raise HTTPException(status_code=400, detail="Node data lacks 'provider' information for cloud scenario. Please include provider details or choose another scenario.")
    
    # Calculate general metrics unconditionally
    country_counts = df['country'].value_counts().tolist()  # List of node counts per country
    gini = gini_coefficient(country_counts)
    nakamoto = nakamoto_coefficient(country_counts)
    
    if scenario == "":
        logging.info(f"Running overview for {total_nodes} nodes")
        failed_count = 0
        connectivity_loss = 0
    else:
        if not target:
            raise HTTPException(status_code=400, detail="Target must be provided for selected scenario.")
        logging.info(f"Simulating {scenario} failure for {total_nodes} nodes targeting {target}")
        
        # Calculate failed nodes based on scenario
        if scenario == "region":
            failed_count = df[df['country'] == target].shape[0]  # Counts rows matching the target country
        elif scenario == "cloud":
            failed_count = df[df.get('provider', '') == target].shape[0]  # Assumes nodes have a 'provider' field like "AWS"
        elif scenario == "attack":
            failed_count = int(total_nodes * 0.1)  # Dummy: Assume 10% nodes fail in a targeted attack
        else:
            failed_count = 0
        
        connectivity_loss = (failed_count / total_nodes) * 100 if total_nodes > 0 else 0  # Percentage of nodes lost
    
    # Return all results
    return {
        "total_nodes": total_nodes,
        "failed_nodes": failed_count,
        "connectivity_loss": f"{connectivity_loss:.2f}%",
        "scenario": scenario or "overview",
        "gini": gini,
        "nakamoto": nakamoto
    }

@app.post("/optimize")
def optimize(data: NodeData):
    df = pd.DataFrame(data.nodes)
    
    if len(data.nodes) == 0:
        raise HTTPException(status_code=400, detail="No nodes provided.")
    
    logging.info(f"Optimizing for {len(data.nodes)} nodes")

    # Reuse existing metrics
    country_counts_list = df['country'].value_counts().tolist()
    gini = gini_coefficient(country_counts_list)
    nakamoto = nakamoto_coefficient(country_counts_list)
    
    # Generate suggestions
    suggestions = generate_suggestions(df, gini, nakamoto)
    
    return {
        "gini": gini,
        "nakamoto": nakamoto,
        "suggestions": suggestions
    }
