# Nodelyzer 🔒🌐

**A comprehensive blockchain node infrastructure analysis and security assessment platform**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116.1-green)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://typescriptlang.org/)

## 📖 Overview

Nodelyzer is a developer-oriented tool designed to analyze and improve the geographic and infrastructural distribution of blockchain nodes. Poorly distributed nodes introduce single points of failure: for example, nodes clustered in one region or cloud provider can be wiped out by a regional outage, power failure, or cloud provider failure. A broad geographic spread of nodes increases fault tolerance and resilience.

Nodelyzer helps designers simulate various failure scenarios (data center outages, regional blackouts, or cloud provider failures) and measure their impact on network connectivity. By quantifying decentralization using metrics like the Gini coefficient and the Nakamoto coefficient, Nodelyzer identifies vulnerabilities in the network's topology and suggests how to re-distribute or add nodes to improve resilience.

## Key Features

###  **Failure Modeling Framework**
- **Regional Outages**: Simulate entire data center or country failures
- **Cloud Infrastructure Failures**: Model AWS, GCP, or other cloud provider outages
- **51% Attack Analysis**: Analyze network resilience to majority attacks
- **Impact Analysis**: Calculate connectivity loss and remaining network capacity

###  **Interactive Visualization Dashboard**
- **Geographic Mapping**: Highcharts-powered world map with node locations
- **Multiple View Modes**: Switch between map view, bar charts, and pie charts
- **Dynamic Updates**: Visualization updates based on failure scenarios
- **Interactive Selection**: Click on regions to simulate specific outages
- **Color-coded Regions**: Visual representation of node density per country

###  **Optimization Engine**
- **Decentralization Metrics**: Calculate Gini and Nakamoto coefficients
- **Smart Recommendations**: Heuristic-based suggestions for node redistribution
- **Geographic Optimization**: Identify underrepresented regions for new nodes
- **Provider Diversification**: Reduce dependency on single cloud providers
- **Performance Forecasting**: Predict network resilience improvements

###  **Security & Privacy Features**
- **TOR Node Detection**: Identify anonymous nodes in the network
- **Stake-based Analysis**: Weighted calculations for proof-of-stake networks
- **Provider Analysis**: Cloud provider concentration assessment
- **Network Resilience Assessment**: Identify single points of failure

##  Architecture

### Frontend (Next.js + React)
- **Framework**: Next.js 15.3.0 with React 19
- **Styling**: Tailwind CSS with custom design system
- **Charts**: Highcharts for 2D maps and 3D visualizations
- **State Management**: React Context for authentication and analysis state
- **Authentication**: Firebase Auth with Google OAuth and email/password

### Backend (Python + FastAPI)
- **API Framework**: FastAPI with automatic OpenAPI documentation
- **Data Processing**: Pandas, NumPy, and SciPy for mathematical computations
- **CORS Support**: Cross-origin resource sharing enabled
- **Error Handling**: Comprehensive HTTP error responses
- **Basic Logging**: Logging for debugging and monitoring

### Data Storage
- **Authentication**: Firebase Authentication
- **Analysis Storage**: Firestore database for saving analysis results
- **File Processing**: Support for JSON, CSV, and TXT node data files

##  Getting Started

### Prerequisites

- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- **Python**: 3.9 or higher
- **Firebase Account**: For authentication and data storage

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nodelyzer.git
   cd nodelyzer
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

5. **Start the development servers**
   
   **Terminal 1 - Backend:**
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python main.py
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Usage Guide

### 1. **Authentication**
- Sign up with email/password or Google OAuth
- Login to access the analysis dashboard

### 2. **Data Input**
- **File Upload**: Upload JSON, CSV, or TXT files containing node data
- **Manual Input**: Paste node data directly into the text area
- **Auto-detection**: Nodelyzer automatically detects network type (Bitcoin, Ethereum, Solana)

### 3. **Network Analysis**
- **Overview Mode**: Analyze current network distribution without failures
- **Regional Outage**: Click on map regions to simulate geographic failures
- **Cloud Provider Failure**: Select cloud providers to simulate infrastructure outages
- **51% Attack**: Analyze network resilience to majority attacks

### 4. **Results Interpretation**
- **Metrics Dashboard**: View Gini coefficient, Nakamoto coefficient, and connectivity loss
- **Visualizations**: Interactive maps, bar charts, and pie charts
- **Optimization Suggestions**: Heuristic-based recommendations for network improvement
- **PDF Reports**: Download comprehensive analysis reports

### 5. **Data Formats**

#### Bitcoin Node Data
```json
{
  "nodes": {
    "1.2.3.4": ["US", 40.7128, -74.0060, "AWS"],
    "5.6.7.8": ["DE", 52.5200, 13.4050, "GCP"]
  }
}
```

#### Ethereum Node Data
```csv
lat,lon,country,name
40.7128,-74.0060,US,Node1
52.5200,13.4050,DE,Node2
```

#### Solana Validator Data
```csv
epoch,activatedstake,nodepubkey,country,location,provider
123,1000000,validator1,US,"40.7128 -74.0060",AWS
123,2000000,validator2,DE,"52.5200 13.4050",GCP
```

##  API Endpoints

### Backend API (FastAPI)

#### `POST /simulate-failure`
Simulate network failures and calculate impact metrics.

**Request Body:**
```json
{
  "nodes": [
    {"lat": 40.7, "lon": -74.0, "country": "US", "stake": 1000, "provider": "AWS"}
  ],
  "scenario": "region",
  "targets": ["US"],
  "network": "bitcoin"
}
```

**Response:**
```json
{
  "total_nodes": 100,
  "failed_nodes": 25,
  "connectivity_loss": "25.00%",
  "gini": 0.45,
  "nakamoto": 8,
  "remaining_countries": 15
}
```

#### `POST /optimize`
Generate optimization suggestions for network improvement.

**Response:**
```json
{
  "gini": 0.45,
  "nakamoto": 8,
  "suggestions": [
    "Add 5 nodes to each of 3 new countries (e.g., BR, IN, NG) to improve decentralization."
  ]
}
```

##  Metrics Explained

### **Gini Coefficient**
- **Range**: 0.0 (perfect equality) to 1.0 (perfect inequality)
- **Interpretation**: Lower values indicate better geographic distribution
- **Formula**: Measures inequality in node distribution across countries

### **Nakamoto Coefficient**
- **Range**: 1 to total number of entities
- **Interpretation**: Higher values indicate better decentralization
- **Formula**: Minimum number of entities needed to control 51% of network resources

### **Connectivity Loss**
- **Range**: 0% to 100%
- **Interpretation**: Percentage of network capacity lost during failure scenarios
- **Calculation**: Based on failed nodes or stake weight

##  Supported Networks

### **Bitcoin**
- Node discovery and mapping
- Geographic distribution analysis
- TOR node detection
- Network resilience assessment

### **Ethereum**
- Validator node analysis
- Geographic diversity metrics
- Network resilience assessment

### **Solana**
- Validator stake analysis
- Cloud provider distribution
- Performance metrics (TPS impact)
- Geographic optimization

##  Deployment

### Frontend Deployment
```bash
npm run build
npm run start
```

### Backend Deployment
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Environment Variables for Production
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_key
# ... other Firebase config
```

##  Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- **Frontend**: ESLint + Prettier configuration
- **Backend**: Black + Flake8 for Python
- **TypeScript**: Strict type checking enabled

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- **Highcharts** for powerful charting capabilities
- **Firebase** for authentication and data storage
- **FastAPI** for high-performance backend API
- **Tailwind CSS** for beautiful, responsive design
- **Highcharts** for powerful charting capabilities

##  Support

- **Documentation**: [https://nodelyzer.com/docs](https://nodelyzer.com/docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/nodelyzer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/nodelyzer/discussions)
- **Email**: support@nodelyzer.com

##  Roadmap

### **Phase 1: Core Features** ✅
- [x] Basic failure simulation (regional, cloud provider, 51% attack)
- [x] Geographic visualization with interactive maps
- [x] Decentralization metrics (Gini, Nakamoto coefficients)
- [x] User authentication and analysis storage
- [x] PDF report generation

### **Phase 2: Advanced Analysis** 🚧
- [ ] Real-time network monitoring
- [ ] Advanced failure scenarios (cascading failures, network partitioning)
- [ ] Machine learning optimization
- [ ] API rate limiting

### **Phase 3: Enterprise Features** 📋
- [ ] Team collaboration
- [ ] Advanced reporting
- [ ] Custom metrics
- [ ] Integration APIs

---

**Built with ❤️ for the blockchain community**

*Nodelyzer*
