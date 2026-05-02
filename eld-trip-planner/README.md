# 🚛 SPOTTER ELD: The Professional HOS Compliance Command Center

**SPOTTER ELD** is a high-precision, industrial-grade routing and compliance engine designed for the modern long-haul trucking industry. It transforms the complexities of US Federal Motor Carrier Safety Administration (FMCSA) regulations into a streamlined, automated, and visually stunning logistics experience. 

Built with a robust **Django** backend and a cutting-edge **React 19** frontend, SPOTTER ELD ensures drivers stay compliant, safe, and efficient on every mile of the road.

---

## 👨‍💻 Developed By
**Raj Bhushan**

> **Developer's Note:** Engineering a system that perfectly synchronizes real-time spatial routing with the rigid, minute-by-minute state machine of HOS (Hours of Service) regulations was a formidable challenge. From interpolating GPS coordinates along a 2,000-mile route to pixel-perfect SVG grid rendering for DOT-compliant logs, every line of code was written to ensure zero-margin-for-error accuracy. 

---

## 🌟 In-Depth Feature Catalog

### 1. The HOS Simulation "Brain"
The core engine is a deterministic state machine that simulates a driver's journey second-by-second.
- **🕒 Clock Hardening:** Strictly enforces the **11-Hour Driving Limit**, **14-Hour On-Duty Window**, and **70-Hour/8-Day Cycle**.
- **🛑 Smart Interruption Engine:** Automatically injects mandatory **30-minute breaks** after 8 cumulative hours of driving and **10-hour rest resets** when shift limits are reached.
- **⛽ Logistical Automation:** Intelligently schedules fueling stops every **1,000 miles**, factoring in the 30-minute on-duty time penalty for each stop.
- **📦 Hub Operations:** Automatically accounts for **1-hour loading/unloading** on-duty times at both pickup and drop-off points.

### 2. Tactical Mission Control (UI/UX)
Designed for high-stakes enterprise logistics with a focus on "Glassmorphism 2.0" aesthetics.
- **🛰️ Mission Control Layout:** A full-screen, fixed-height "Command Center" that maximizes information density without sacrificing clarity.
- **🌓 Dynamic Dark Mode:** A deep slate and blue aesthetic optimized for night-shift operations to reduce driver eye strain.
- **🛡️ Compliance Metadata Panel:** A dedicated section to capture 100% of DOT-mandated info: **Driver Name, Vehicle ID, Trailer ID, License Plate, and Carrier HQ**.
- **🕹️ Tactical Navigation:** Interactive map-click assignment for Origin, Hub Intercept, and Target Destination.

### 3. Authentic DOT Daily Logs (Form 395.8)
Transform digital simulation data into official US DOT Driver's Daily Logs.
- **📏 High-Density SVG Grid:** A pixel-perfect recreation of the official paper log, featuring 15-minute sub-ticks and 24:00 terminal hour logic.
- **📈 Status Graphing:** Real-time rendering of the duty-status line that "steps" across Off Duty, Sleeper, Driving, and On Duty rows.
- **✍️ Digital Certification:** Automatically populates carrier details and generates a digital signature block for the primary driver.

### 4. Spatial Intelligence
- **📍 Linear Path Interpolation:** Uses advanced geometry to find the exact GPS coordinate at any mile-marker where an HOS event (rest, fuel, break) must occur.
- **🌍 Reverse Geocode Enrichment:** Every stop is automatically queried against the Nominatim API to provide city and state names (e.g., *"Rest near Springfield, MO"*).
- **🖱️ Map-to-Form Integration:** Map clicks instantly resolve into human-readable addresses in the input fields.

---

## ⚖️ The "Active Cycle" (HRS): Why it Matters
The **Active Cycle** input is a critical component of DOT compliance. 
*   **The Rule:** Drivers are limited to 70 hours of on-duty time in any rolling 8-day period.
*   **The Logic:** SPOTTER ELD takes your "Hours already used" as an input. If you have used 60 hours already, the system knows you only have 10 hours of "work-budget" left before a mandatory daily rest or cycle reset is required.
*   **The Result:** The engine intelligently forces rest segments earlier in the trip if the driver is "running out of cycle," ensuring no driver ever enters a violation state.

---

## 🏗️ Architectural Excellence

1.  **The Spatial Interpolation Problem:** Solved with a custom **Linear Interpolation Algorithm** traversing route polylines to find exact HOS trigger coordinates.
2.  **24-Hour Normalization:** A backend engine that slices continuous trip data into exact midnight-to-midnight periods for DOT-compliant daily logs.
3.  **Stateless Session Integrity:** The workspace is designed to reset on reload, ensuring a clean "Blank Slate" for every new mission plan.

---

## 🚀 Technical Stack

- **Backend:** Django 4.2, Django REST Framework, Geopy.
- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Leaflet.js.
- **APIs:** OSRM (Routing Engine), Nominatim (Reverse Geocoding), ORS (Geocoding).

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 20+**

### 2. Quick Launch
From the root of the workspace:
```powershell
cd eld-trip-planner
npm run install-all
npm run dev
```

---

**SPOTTER ELD: Compliant. Efficient. Tactical. Ready for the Road.**
