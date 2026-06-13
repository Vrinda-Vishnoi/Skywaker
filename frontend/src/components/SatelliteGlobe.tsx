import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as satellite from 'satellite.js';
import * as THREE from 'three';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

function createSatelliteTexture(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    
    // body
    ctx.fillRect(24, 24, 16, 16);
    // left panel
    ctx.fillRect(4, 28, 16, 8);
    // right panel
    ctx.fillRect(44, 28, 16, 8);
    // antenna
    ctx.beginPath();
    ctx.moveTo(32, 24);
    ctx.lineTo(32, 8);
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
    // dish
    ctx.beginPath();
    ctx.arc(32, 8, 6, Math.PI, 0);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

const satTexture = createSatelliteTexture('#0ea5e9'); // Default blue
const satMaterial = new THREE.SpriteMaterial({ map: satTexture, color: 0xffffff });

const satSelectedTexture = createSatelliteTexture('#fbbf24'); // Amber gold for selected
const satSelectedMaterial = new THREE.SpriteMaterial({ map: satSelectedTexture, color: 0xffffff });

// We will fetch real data from the API
interface SatelliteGlobeProps {
  onSatelliteClick?: (sat: any) => void;
  selectedNoradId?: number;
  userLocation?: { lat: number, lon: number };
}

export function SatelliteGlobe({ onSatelliteClick, selectedNoradId, userLocation }: SatelliteGlobeProps) {
  const globeEl = useRef<any>();
  const [satData, setSatData] = useState<any[]>([]);
  const [satRecords, setSatRecords] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [altitude, setAltitude] = useState(2.5);

  // Handle window resize for full screen globe
  useEffect(() => {
    function handleResize() {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fly camera to user location when it changes
  useEffect(() => {
    if (globeEl.current && userLocation) {
      globeEl.current.pointOfView({
        lat: userLocation.lat,
        lng: userLocation.lon,
        altitude: 2.5
      }, 1500); // 1.5 seconds animation
    }
  }, [userLocation]);

  // Configure smoother Globe controls for trackpad/mouse
  useEffect(() => {
    const timer = setTimeout(() => {
      if (globeEl.current && globeEl.current.controls) {
        const controls = globeEl.current.controls();
        if (controls) {
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
          controls.enablePan = false; // Prevents two-finger swiping from moving the globe off-center
          controls.rotateSpeed = 0.8;
          controls.zoomSpeed = 1.2;
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch satellites from API
  useEffect(() => {
    async function fetchSatellites() {
      try {
        const res = await fetch(`${API_URL}/api/satellites?group=visual`);
        const data = await res.json();
        
        const records = data.map((sat: any) => {
          return {
            ...sat,
            satrec: satellite.twoline2satrec(sat.tleLine1, sat.tleLine2)
          };
        });
        setSatRecords(records);
      } catch (err) {
        console.error('Failed to fetch satellites', err);
      }
    }
    fetchSatellites();
  }, []);

  // Compute position every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (satRecords.length === 0) return;
      const now = new Date();
      const gmst = satellite.gstime(now);
      
      const newSatData = satRecords.map(sat => {
        const positionAndVelocity = satellite.propagate(sat.satrec, now);
        const positionEci = positionAndVelocity.position;
        
        if (positionEci && typeof positionEci !== 'boolean') {
          const positionGd = satellite.eciToGeodetic(positionEci, gmst);
          const longitude = satellite.degreesLong(positionGd.longitude);
          const latitude = satellite.degreesLat(positionGd.latitude);
          const altitude = positionGd.height;

          return {
            ...sat,
            lat: latitude,
            lng: longitude,
            alt: altitude / 6371, // Normalize altitude relative to Earth radius
          };
        }
        return null;
      }).filter(Boolean);

      setSatData(newSatData);
    }, 1000);
    return () => clearInterval(interval);
  }, [satRecords]);

  // Generate orbit trail (90 mins future) for selected satellite only
  // (Rendering paths for all satellites is too heavy)
  const orbitPath = useMemo(() => {
    // For now we don't render trails for all satellites to save performance
    // We could render it only for a selected satellite if we pass it down
    return [];
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  return (
    <div className="w-full h-full cursor-move overflow-hidden">
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Custom Satellite Marker using Icon
        customLayerData={satData}
        customLayerLabel={(d: any) => `
          <div class="bg-surface/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-white/10 text-sm shadow-xl pointer-events-none">
            ${d.name} <span style="color: #0ea5e9; font-size: 0.8em; margin-left: 4px;">#${d.noradId}</span>
          </div>
        `}
        onCustomLayerClick={(d: any) => onSatelliteClick?.(d)}
        customThreeObject={(d: any) => {
          const isSelected = d.noradId === selectedNoradId;
          const sprite = new THREE.Sprite(isSelected ? satSelectedMaterial : satMaterial);
          const size = isSelected ? 12 : 6;
          sprite.scale.set(size, size, 1);
          return sprite;
        }}
        customThreeObjectUpdate={(obj: any, d: any) => {
          Object.assign(obj.position, globeEl.current?.getCoords(d.lat, d.lng, d.alt));
          
          // Update material and scale based on selection state
          const isSelected = d.noradId === selectedNoradId;
          obj.material = isSelected ? satSelectedMaterial : satMaterial;
          const size = isSelected ? 10 : 6;
          obj.scale.set(size, size, 1);
        }}

        // HTML Marker for Labels (Zoom LOD)
        htmlElementsData={satData}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          // Only render the label if the camera is zoomed in (altitude < 1.5)
          if (altitude < 1.5) {
            el.innerHTML = `
              <div style="color: white; background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; font-size: 10px; border: 1px solid rgba(255,255,255,0.2); pointer-events: none; margin-left: 10px; margin-top: 10px; white-space: nowrap; font-weight: bold; text-shadow: 0 1px 2px black;">
                ${d.name} <span style="color: #0ea5e9;">#${d.noradId}</span>
              </div>
            `;
          }
          return el;
        }}
        
        // Listen to zoom to update altitude state
        onZoom={({ altitude }) => setAltitude(altitude)}
        
        // Paths for orbit
        pathsData={orbitPath}
        pathColor={() => 'rgba(14, 165, 233, 0.4)'}
        pathDashLength={0.01}
        pathDashGap={0.005}
        pathDashAnimateTime={10000}

        // Location Marker (Demo Mode / GPS)
        ringsData={userLocation ? [{ lat: userLocation.lat, lng: userLocation.lon }] : []}
        ringColor={() => '#10b981'} // Emerald green marker
        ringMaxRadius={2}
        ringPropagationSpeed={1}
        ringRepeatPeriod={1000}
      />
    </div>
  );
}
