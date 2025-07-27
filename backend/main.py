from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd  # Example use
from fastapi import HTTPException
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
import math

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
    network: str = "bitcoin"

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
    
    if request.scenario == "cloud":
        connectivity_loss = (failed_count / total_nodes * 100) if total_nodes > 0 else 0.0
    elif 'stake' in df.columns and not df['stake'].isnull().all():
        total_stake = float(df['stake'].sum())
        failed_stake = float(df[failed_mask]['stake'].sum())
        connectivity_loss = (failed_stake / total_stake * 100) if total_stake > 0 else 0.0
    else:
        connectivity_loss = (failed_count / total_nodes * 100) if total_nodes > 0 else 0.0
    
    remaining_df = df[~failed_mask]
    if 'stake' in df.columns and not df['stake'].isnull().all():
        country_values = remaining_df.groupby('country')['stake'].sum().tolist()
    else:
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
def optimize(request: FailureRequest):
    df = pd.DataFrame(request.nodes)
    
    if len(request.nodes) == 0:
        raise HTTPException(status_code=400, detail="No nodes provided.")
    
    logging.info(f"Optimizing for {len(request.nodes)} nodes")
    
    # Hardcoded list of country codes (partial for brevity; in real, add all 249)
    all_countries = ["us", "ca", "gb", "fr", "de", "jp", "au", "in", "br", "mx", "ru", "cn", "it", "es", "kr", "za", "ng", "eg", "tr", "sa", "id", "pk", "bd", "ar", "co", "cl", "pe", "ve", "my", "ph", "vn", "th", "sg", "nz", "se", "no", "dk", "fi", "nl", "be", "ch", "at", "pl", "cz", "hu", "gr", "pt", "ie", "il", "ua", "ro", "bg", "hr", "rs", "sk", "si", "lt", "lv", "ee", "is", "mt", "cy", "lu", "mc", "ad", "sm", "va", "li", "fo", "gi", "gl", "al", "ba", "me", "mk", "md", "by", "kz", "uz", "tm", "tj", "kg", "am", "az", "ge", "mn", "kp", "tw", "hk", "mo", "kh", "la", "mm", "bn", "bt", "np", "lk", "mv", "af", "ir", "iq", "sy", "lb", "jo", "ps", "kw", "bh", "qa", "ae", "om", "ye", "ye", "tn", "dz", "ma", "ly", "ml", "sn", "gm", "gw", "gn", "sl", "lr", "ci", "gh", "tg", "bj", "bf", "ne", "td", "cf", "cm", "ga", "cg", "cd", "ao", "na", "bw", "zw", "mz", "mg", "mw", "zm", "tz", "ke", "ug", "rw", "bi", "so", "et", "dj", "er", "ss", "sd", "mr", "eh", "km", "sc", "mu", "cv", "st", "gq", "sz", "ls", "na"]  # Add more as needed
    
    # Simulate failure like in simulate_failure
    total_nodes = len(df)
    
    if request.scenario == "cloud":
        if 'provider' not in df.columns or df['provider'].isnull().all():
            raise HTTPException(status_code=400, detail="Node data lacks 'provider' information for cloud scenario.")
    
    if request.scenario == "region":
        failed_mask = df['country'].str.lower().isin([t.lower() for t in request.targets])
    elif request.scenario == "cloud":
        failed_mask = df.get('provider', '').str.lower().isin([t.lower() for t in request.targets])
    elif request.scenario == "51":  
        failed_mask = pd.Series([False] * len(df))  # Placeholder
    else:
        failed_mask = pd.Series([False] * len(df))
    
    failed_count = int(failed_mask.sum())
    
    if request.scenario == "cloud":
        connectivity_loss = (failed_count / total_nodes * 100) if total_nodes > 0 else 0.0
    elif 'stake' in df.columns and not df['stake'].isnull().all():
        total_stake = float(df['stake'].sum())
        failed_stake = float(df[failed_mask]['stake'].sum())
        connectivity_loss = (failed_stake / total_stake * 100) if total_stake > 0 else 0.0
    else:
        connectivity_loss = (failed_count / total_nodes * 100) if total_nodes > 0 else 0.0
    
    remaining_df = df[~failed_mask]
    if 'stake' in df.columns and not df['stake'].isnull().all():
        country_values = remaining_df.groupby('country')['stake'].sum().tolist()
    else:
        country_values = remaining_df['country'].value_counts().tolist()
    
    gini = gini_coefficient(country_values)
    nakamoto = nakamoto_coefficient(country_values)
    
    suggestions = []
    
    current_countries = set(remaining_df['country'].str.lower().unique()) if 'country' in remaining_df else set()
    available_countries = [c for c in all_countries if c not in current_countries]
    current_num_countries = len(current_countries)
    
    additional_nodes = int(0.25 * total_nodes)  # This is approximate; we'll adjust total based on ceil
    new_num_countries = max(1, int(0.25 * current_num_countries))
    suggested_countries = available_countries[:new_num_countries]
    nodes_per_country = math.ceil(additional_nodes / new_num_countries) if new_num_countries > 0 else 0
    total_added_countries = nodes_per_country * new_num_countries
    
    # Forecast new Gini
    is_stake_based = 'stake' in df.columns and not df['stake'].isnull().all()
    remaining_total_stake = sum(country_values) if is_stake_based else len(remaining_df)
    remaining_node_count = len(remaining_df)
    avg_per_node = remaining_total_stake / remaining_node_count if remaining_node_count > 0 and remaining_total_stake > 0 else 1
    new_values = country_values.copy()
    for _ in range(new_num_countries):
        new_values.append(nodes_per_country * avg_per_node)
    new_gini = gini_coefficient(new_values)
    
    is_minimal = connectivity_loss < 25
    
    if request.scenario == "":  # Overview
        if gini > 0.7:
            suggestions.append(f"Gini coefficient is high ({gini:.3f}). Add {nodes_per_country} nodes to each of {new_num_countries} new countries (e.g., {', '.join([c.upper() for c in suggested_countries])}) (total {total_added_countries} nodes). Forecasted Gini would then be: {new_gini:.3f}. This would improve decentralization.")
        else:
            suggestions.append("Network is balanced; no changes needed.")
    elif request.scenario in ["region", "cloud"]:
        if connectivity_loss == 0.0:
            suggestions.append("network is working perfectly, no outage detected.")
        elif is_minimal:
            suggestions.append(f"Network is resilient to this outage (connectivity loss is just {connectivity_loss:.2f}% ); network is not really affected by this outage, no changes needed but outage should be mitigated.")
        else:
            if connectivity_loss < 50:
                impact = "be noticeable by users as transactions would be slower and take more time" if connectivity_loss >= 25 else "not really affect user experience on the network as it might not be really noticeable"
            else:
                impact = "make the network really congested, transactions would take very long time to go through or even fail, transactions fees would spike and this would cause problems for users on the network and could lead to network crash or failure" 
            suggestions.append(f"Connectivity loss {connectivity_loss:.2f}% would {impact}.")
            if request.network == "solana":
                original_tps = 1400
                new_tps = int(original_tps * (1 - connectivity_loss / 100))
                suggestions.append(f"TPS would drop from {original_tps} to approximately {new_tps}.")
            elif request.network == "ethereum":
                suggestions.append("Gwei would spike over 100 leading to ridiculous gas fees.")
            # Suggestion
            if request.scenario == "region":
                suggestions.append(f"To mitigate, add {nodes_per_country} nodes to each of {new_num_countries} new countries (e.g., {', '.join([c.upper() for c in suggested_countries])}) (total {total_added_countries} nodes). Forecasted Gini would then be: {new_gini:.3f}.")
            else:  # cloud
                if 'provider' in remaining_df:
                    provider_counts = remaining_df['provider'].value_counts()
                    sorted_providers = provider_counts.sort_values().index.tolist()
                    if connectivity_loss < 50:
                        additional_nodes = int(0.15 * total_nodes)
                        num_bottom = max(1, int(0.10 * len(provider_counts)))
                    else:
                        additional_nodes = int(0.30 * total_nodes)
                        num_bottom = max(1, int(0.25 * len(provider_counts)))
                    bottom_providers = sorted_providers[:num_bottom]
                    nodes_per_provider = math.ceil(additional_nodes / num_bottom) if num_bottom > 0 else 0
                    total_added_providers = nodes_per_provider * num_bottom
                    suggestions.append(f"To mitigate, add {nodes_per_provider} nodes to each of these {num_bottom} providers: {', '.join(bottom_providers)} (total {total_added_providers} nodes). This would improve decentralization and network resilience.")
                else:
                    suggestions.append("No provider data available for cloud suggestions.")
    elif request.scenario == "51":
        if nakamoto <= 1:
            suggestions.append(f"High risk of 51% attack (Nakamoto {nakamoto}). Distribute stake more evenly across entities.")
        else:
            suggestions.append("Network is resilient to 51% attacks; no changes needed.")
    
    # General metrics
    # if gini > 0.5 and not is_minimal:
    #     suggestions.append(f"High concentration (Gini {gini:.3f}). Consider redistributing nodes.")
    # if nakamoto < 5 and not is_minimal:
    #     suggestions.append(f"Low Nakamoto coefficient ({nakamoto}). Add nodes to diverse locations.")
    
    if not suggestions:
        suggestions = ["Network looks balanced—no major suggestions."]
    
    return {
        "gini": gini,
        "nakamoto": nakamoto,
        "total_nodes": total_nodes,
        "failed_nodes": failed_count,
        "connectivity_loss": f"{connectivity_loss:.2f}%",
        "remaining_countries": len(remaining_df['country'].unique()) if 'country' in remaining_df else 0,
        "suggestions": suggestions
    }
