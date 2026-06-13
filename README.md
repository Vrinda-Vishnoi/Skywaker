# Skyward 🛰️
**Live Orbital Telemetry & Pass Prediction Engine**

Skyward is a full-stack MERN application I built to render a live 3D globe of actively tracked satellites and predict when a selected satellite will be visible from any given location. 

## How I Implemented It

I architected this project with a strict separation of concerns to handle computationally heavy orbital mechanics efficiently:

- **Client-Side SGP4 Propagation:** The frontend uses `react-globe.gl` and `satellite.js` to propagate satellite positions in real-time. By doing this natively in the browser, I achieved smooth 60fps WebGL rendering without needing constant round-trips to the server.
- **Backend Prediction Engine:** The Node.js/Express backend handles the heavy orbital mechanics and solar visibility checks required for forecasting future passes. I utilized `astronomy-engine` to calculate the precise altitude of the Sun to determine twilight visibility conditions.
- **MongoDB TTL Caching:** Because forecasting satellite passes over multiple days is mathematically intensive, I implemented a caching layer. The backend buckets geographic coordinates to an ~11km grid and caches the pass predictions in MongoDB using Time-To-Live (TTL) indexes. The first request calculates the passes, and subsequent requests from the same region are served instantly from the database cache.
- **Automated Data Ingestion:** The server automatically fetches and parses fresh Two-Line Element (TLE) datasets from CelesTrak to ensure orbits are always accurate.

## Core Features

- **Live 3D WebGL Globe:** High-performance rendering of live satellites with interactive tracking.
- **Explainable Predictions:** The engine doesn't just say if a pass is visible; it returns a breakdown of exactly *why* a pass is hidden (e.g., "Observer in daylight", "Satellite in Earth's shadow").
- **Level of Detail (LOD):** Satellite names dynamically fade in only when zooming close to the surface to prevent visual clutter.
- **Physics Validation Page:** A dedicated route that runs the physics engine against known truth data to validate the accuracy of the SGP4 propagation.
- **Demo Mode:** An interactive UI to cycle through preset locations (Delhi, Kanpur, Faridabad, New York, etc.) and instantly fly the camera and prediction engine to that city.

## Tech Stack
- **Frontend:** React, TypeScript, Vite, TailwindCSS, Three.js, react-globe.gl
- **Backend:** Node.js, Express, TypeScript, Mongoose
- **Database:** MongoDB Atlas
- **Physics Libraries:** satellite.js, astronomy-engine

## Local Setup

1. Add your MongoDB connection string to `backend/.env`
2. Install dependencies and start the backend: 
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. Install dependencies and start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`

---

## Strict No Copy Policy
This project is for people to see my work and portfolio. Any copying, reproduction, modification, or updating of this code for personal or commercial use is **strictly prohibited**. All rights reserved.
