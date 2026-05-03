# 🛰️ SPOTTER ELD: Mission Control v2.5.1

**Spotter ELD Mission Control** is a professional-grade, DOT-audit-ready mission planning and Hours of Service (HOS) visualization system. Engineered for property-carrying drivers, it transforms complex logistical routes into high-fidelity, compliant records of duty status.

![Mission Control HUD](https://img.shields.io/badge/Status-Audit_Ready-emerald?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Django_|_React-blue?style=for-the-badge)
![Compliance](https://img.shields.io/badge/Compliance-FMCSA_§_395.8-navy?style=for-the-badge)

---

## 🚀 Key Features

### 1. Tactical Mission Planning
- **Precision Geocoding**: High-accuracy vector calculation for Origin, Pickup, and Dropoff points.
- **Interactive Map Visualizer**: Automated `fitBounds` routing with animated tactical polylines and interactive stop cards.
- **Multi-Step Initialization**: A sophisticated loading sequence that simulates geocoding, routing, and HOS application.

### 2. Automated HOS Engine (§ 395.3)
- **Shift Enforcement**: Automatic monitoring of 11-hour driving limits and 14-hour duty windows.
- **Smart Rests**: Proactive insertion of 10-hour rest periods and 34-hour restarts to maintain 100% compliance.
- **8-Hour Break Integration**: Automated 30-minute break scheduling before the 8th hour of driving.
- **Logistics Constraints**: Enforces fueling every 1,000 miles and 1-hour cargo handling activities.

### 3. Mission Control HUD
- **Unified Stats Bar**: Real-time tracking of Total Distance, ETA, Active Drive Time, and Compliance Status.
- **Tactical Aesthetic**: High-contrast, monochromatic dark mode (`#0f1117`) optimized for low-light cockpit operation.
- **Operational History**: Persistent localStorage tracking of recent mission vectors.

### 4. Audit-Ready Daily Logs
- **Dynamic Grid Rendering**: High-density SVG grids with FMCSA-standard hour markers and status-colored timelines.
- **Automated Remarks**: Intelligent timeline generation with deduplicated status updates and cleaned location names.
- **Mission Debriefing**: A comprehensive summary grid of total performance metrics, optimized for professional PDF export.

---

## 🛠️ Tech Stack

- **Backend**: Django 5.0, Django REST Framework, Python HOS Engine.
- **Frontend**: React 18, Tailwind CSS, Framer Motion (Animations), Lucide (Icons).
- **Mapping**: Leaflet.js, OpenStreetMap (OSRM), Nominatim Geocoding.
- **Export**: Professional CSS Print Media queries for audit-compliant PDF generation.

---

## 📂 Project Structure

```text
Spotter/
├── src/                    # React 18 Application (Frontend)
│   ├── components/         # UI Components (DailyLog, MapView, HUD)
│   ├── api/                # Tactical Downlink (API Client)
│   └── App.jsx             # Mission Control Entry Point
├── backend/                # Django REST API & HOS Logic
│   ├── trip_planner/       # Core Application Logic
│   │   ├── hos_calculator.py  # Automated Compliance Engine
│   │   └── views.py        # API Entry Points
│   └── manage.py
├── public/                 # Static Assets
├── package.json            # Frontend Dependencies
├── vite.config.js          # Vite Configuration
└── README.md               # Tactical Documentation
```

## ⚡ Quick Start

The project is now structured with frontend at root for easy Vercel deployment. 

### Option 1: Automated Launch (Unified)
```powershell
# 1. Environment Setup (if node is not in path)
$env:Path += ";C:\Program Files\nodejs"

# 2. Install all dependencies
npm install

# 3. Launch Mission Control (Starts BOTH Backend & Frontend)
npm run dev
```

### Option 2: Manual Terminal Setup (Advanced)
If you want to see separate logs or debug one specifically:
```powershell
# Terminal 1: Backend (Django)
cd backend
python manage.py runserver

# Terminal 2: Frontend (React)
$env:Path += ";C:\Program Files\nodejs"
npm run dev
```

### Option 3: PowerShell Script
```powershell
# Run the provided PowerShell script (use .\ prefix for PowerShell)
.\run_all.ps1
```

> [!NOTE]
> - **Backend runs on**: http://127.0.0.1:8000/
> - **Frontend runs on**: http://localhost:5173/
> - Access the tactical interface at http://localhost:5173/
> - The backend API is available at http://127.0.0.1:8000/api/trip-planner/

---

## � Vercel Deployment

### **Method 1: Vercel CLI (Recommended)**
```powershell
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from project root
vercel

# 4. Follow the prompts to connect your GitHub repo
```

### **Method 2: GitHub Integration**
1. Push your code to GitHub (already done!)
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository: `RAJBHUSHAN2001/Spotter_TripPlanner`
5. Vercel will auto-detect the framework and deploy

### **Environment Variables Needed**
In your Vercel dashboard, add these environment variables:
- `ORS_API_KEY` - Your OpenRouteService API key (optional, for routing)

### **Deployment URLs**
- **Frontend**: Automatically assigned (e.g., `spotter-eld.vercel.app`)
- **Backend API**: `https://your-app.vercel.app/api/trip-planner/`

---

## ��️ Extensive Feature Breakdown

### 🛰️ Tactical Mission Interface
- **Geographic Vectors**: Precise input handling for Origin, Pickup, and Dropoff using human-readable names or raw coordinates.
- **Auto-Fit Navigation**: Map automatically bounds to show the entire route with 60px safety padding.
- **Animated Polyline**: Visualizing the mission route with a high-fidelity dashed tactical line.
- **Interactive HUD**: Bottom-docked status bar providing real-time telemetry:
    - **Total Distance**: Aggregated mileage across the entire mission.
    - **ETA**: Projected arrival time based on HOS-compliant scheduling.
    - **Active Drive Time**: Total cumulative hours behind the wheel.
    - **Compliance Status**: Authoritative DOT verification badge.

### 🧠 Advanced HOS Compliance Engine (§ 395.3)
The engine simulates a property-carrying driver's lifecycle with 100% adherence to FMCSA regulations:
- **11-Hour Driving Limit**: Forces a 10-hour rest if driving exceeds 11 hours in a shift or calendar day.
- **14-Hour Duty Window**: Monitors the clock from the first "On-Duty" event and prevents driving after 14 hours.
- **8-Hour Rest Rule**: Automatically schedules a 30-minute break before the 8th consecutive hour of driving.
- **70-Hour / 8-Day Rule**: Tracks cumulative cycle time and triggers a **34-hour restart** when limits are reached.
- **Logistics Overlays**: 
    - **Fueling**: Automatic stops every 1,000 miles.
    - **Cargo Handling**: 1-hour "On-Duty Not Driving" segments for all pickups and dropoffs.
    - **Pre-trip**: Mandatory inspection segment at mission start.

### 📄 Audit-Ready Daily Logs
- **Custom SVG Grid**: High-precision 24-hour grid with status-colored lines (Driving=Navy, On-Duty=Emerald, Off-Duty=Blue).
- **Intelligent Remarks**: 
    - Auto-geocoded location names (no raw coordinates in remarks).
    - Deduplicated entries to prevent redundant status lines.
    - Professional event formatting: `[HH:MM] Location - Status`.
- **Mission Debriefing**: A 2-column performance summary optimized for PDF export, detailing total mission impact.

---

## 📜 Compliance Standards
The Spotter ELD system is designed to adhere to **FMCSA 49 CFR § 395.8** regulations for Record of Duty Status (RODS). 

---
**Developed by Raj** • *Mission Control v2.5 Tactical*
