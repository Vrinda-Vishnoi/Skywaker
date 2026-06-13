import React, { useState } from 'react';
import { Preloader } from './components/Preloader';
import { SatelliteGlobe } from './components/SatelliteGlobe';
import { ValidationPage } from './components/ValidationPage';
import { Satellite, MapPin, Search, Clock, Eye, EyeOff, X, Menu, ChevronRight, Mouse, ShieldCheck, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [selectedSat, setSelectedSat] = useState<any>(null);
  const [passes, setPasses] = useState<any[] | null>(null);
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [isLoadingPasses, setIsLoadingPasses] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 28.6139, lon: 77.2090 });
  const [locationName, setLocationName] = useState('Detecting...');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allSatellites, setAllSatellites] = useState<any[]>([]);
  const [showMouseTip, setShowMouseTip] = useState(true);
  const [currentView, setCurrentView] = useState<'globe' | 'validation'>('globe');

  const presetCities = [
    { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
    { name: 'Kanpur', lat: 26.4499, lon: 80.3319 },
    { name: 'Faridabad', lat: 28.4089, lon: 77.3178 },
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 }
  ];
  const [cityIndex, setCityIndex] = useState(-1);

  const triggerAutoDetect = () => {
    setLocationName('Detecting...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setLocationName(`GPS: ${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`);
          setCityIndex(-1);
        },
        () => {
          setUserLocation({ lat: 28.6139, lon: 77.2090 });
          setLocationName('Delhi (Default)');
          setCityIndex(-1);
        }
      );
    }
  };

  // Auto-detect user location on mount
  React.useEffect(() => {
    triggerAutoDetect();
  }, []);

  const cycleLocation = () => {
    const nextIdx = cityIndex + 1;
    if (nextIdx >= presetCities.length) {
      triggerAutoDetect();
    } else {
      const city = presetCities[nextIdx];
      setUserLocation({ lat: city.lat, lon: city.lon });
      setLocationName(city.name);
      setCityIndex(nextIdx);
    }
  };

  // Fetch all satellites for search
  React.useEffect(() => {
    fetch('http://localhost:10000/api/satellites?group=visual')
      .then(res => res.json())
      .then(data => setAllSatellites(data))
      .catch(err => console.error(err));
  }, []);

  const handlePredictPasses = async () => {
    if (!selectedSat) return;
    setIsLoadingPasses(true);
    try {
      const res = await fetch(`${API_URL}/api/passes?noradId=${selectedSat.noradId}&lat=${userLocation.lat}&lon=${userLocation.lon}`);
      const data = await res.json();
      setPasses(data.passes || []);
      setCacheStatus(data.cache);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPasses(false);
    }
  };

  // Auto-refresh passes if location changes while passes panel is open
  React.useEffect(() => {
    if (selectedSat && passes) {
      handlePredictPasses();
    }
  }, [userLocation]);

  return (
    <>
      {!isReady && <Preloader onReady={() => setIsReady(true)} />}
      
      <div className={`w-screen h-screen bg-background relative transition-opacity duration-1000 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Globe Background */}
        <div className="absolute inset-0 z-0">
          {isReady && (
            <SatelliteGlobe 
              onSatelliteClick={setSelectedSat} 
              selectedNoradId={selectedSat?.noradId} 
              userLocation={userLocation}
            />
          )}
        </div>

        {/* UI Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start pointer-events-auto space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors bg-surface/50 backdrop-blur-md border border-white/10">
                <Menu className="w-6 h-6 text-white" />
              </button>
              <div>
                <div className="flex items-center space-x-4">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">SKYWARD</h1>
                </div>
                <p className="text-gray-400 text-xs md:text-sm tracking-widest uppercase mt-1">Live Orbital Telemetry</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-end md:items-center space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto mt-4 md:mt-0">
              <button 
                onClick={() => setCurrentView('validation')} 
                className="hidden md:flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-accent/80 to-primary/80 hover:from-accent hover:to-primary rounded-full shadow-[0_0_15px_rgba(14,165,233,0.3)] text-xs font-bold text-white transition-all transform hover:scale-105 border border-white/20"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Physics Validation</span>
              </button>

              <div className="glass-panel px-4 py-2 flex items-center justify-between w-full md:w-auto space-x-4">
                <button 
                  onClick={cycleLocation}
                  className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer group truncate"
                  title="Click to cycle demo locations"
                >
                  <MapPin className="w-4 h-4 flex-shrink-0 text-accent group-hover:scale-110 transition-transform" />
                  <span className="truncate">{locationName}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-white/10 px-1.5 py-0.5 rounded text-gray-400 group-hover:text-white group-hover:bg-accent/20 transition-colors ml-1">Demo Mode</span>
                </button>
                <div className="h-4 w-px bg-white/10 hidden md:block"></div>
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 flex items-center text-gray-300 hover:text-white">
                  <Search className="w-4 h-4 md:mr-2" />
                  <span className="text-sm font-semibold hidden sm:inline">Search</span>
                </button>
              </div>
            </div>
          </header>

          {/* Left Sidebar (Search) */}
          <div className={`fixed inset-y-0 left-0 w-full sm:w-80 bg-surface/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out pointer-events-auto flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Search className="w-5 h-5 mr-2 text-accent" />
                Satellites
              </h2>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <input 
                type="text" 
                placeholder="Search satellite..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {allSatellites
                .filter(sat => sat.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(sat => (
                  <button
                    key={sat.noradId}
                    onClick={() => {
                      setSelectedSat(sat);
                      setPasses(null);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-white font-medium">{sat.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">NORAD: {sat.noradId}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary transition-colors" />
                  </button>
                ))}
            </div>
          </div>

        {/* Desktop Mouse Tip */}
        {showMouseTip && isReady && (
          <div className="hidden md:flex pointer-events-auto absolute bottom-6 left-6 z-50 items-center space-x-3 bg-surface/90 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-8">
            <div className="p-1.5 bg-accent/20 rounded-lg text-accent">
              <Mouse className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-white pr-2">Use a mouse for the best 3D experience</span>
            <button onClick={() => setShowMouseTip(false)} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Developer Info Button */}
        <a 
          href="#"
          title="About the Developer"
          className="pointer-events-auto absolute bottom-16 right-6 z-50 flex items-center space-x-3 px-6 py-3 bg-surface/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl hover:bg-white/10 hover:border-white/30 transition-all transform hover:scale-105 group"
        >
          <User className="w-6 h-6 text-accent group-hover:text-white" />
          <span className="text-sm font-semibold text-gray-300 group-hover:text-white tracking-wide">About Developer</span>
        </a>

        {/* Bottom Panel / Selected Sat Details */}
          {selectedSat && (
            <div className="glass-panel p-4 md:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-sm md:w-96 mx-auto md:mx-0 pointer-events-auto self-end md:self-end mb-4 animate-in fade-in slide-in-from-bottom-8 md:slide-in-from-right-8 duration-300 relative">
              <button 
                onClick={() => { setSelectedSat(null); setPasses(null); }}
                className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-3 mb-4 pr-6">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Satellite className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">{selectedSat.name}</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">Active Tracking</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {selectedSat.alt !== undefined && (
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Altitude</span>
                    <span className="font-mono text-accent">{(selectedSat.alt * 6371).toFixed(2)} km</span>
                  </div>
                )}
                {selectedSat.lat !== undefined && (
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Latitude</span>
                    <span className="font-mono text-white">{selectedSat.lat.toFixed(4)}°</span>
                  </div>
                )}
                {selectedSat.lng !== undefined && (
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Longitude</span>
                    <span className="font-mono text-white">{selectedSat.lng.toFixed(4)}°</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">NORAD ID</span>
                  <span className="font-mono text-white">{selectedSat.noradId}</span>
                </div>
              </div>

              <button 
                onClick={handlePredictPasses}
                disabled={isLoadingPasses}
                className="w-full mt-6 bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white font-medium py-2 rounded-lg transition-all shadow-lg shadow-primary/20 flex justify-center items-center">
                {isLoadingPasses ? <div className="spinner border-2 border-white/20 border-t-white w-5 h-5 mb-0" /> : 'Predict Passes'}
              </button>
            </div>
          )}

          {/* Passes Panel */}
          {passes && (
            <div className="glass-panel p-4 md:p-6 w-[calc(100vw-2rem)] sm:w-full md:max-w-md pointer-events-auto absolute inset-x-4 bottom-4 top-24 md:inset-auto md:right-6 md:top-24 md:bottom-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-8 md:slide-in-from-right-8 duration-300 z-40">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-surface/90 backdrop-blur-md p-2 -m-2 rounded-lg z-10 border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-accent" />
                  Upcoming Passes
                </h2>
                <button onClick={() => setPasses(null)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {cacheStatus && (
                <div className={`flex justify-between items-center text-sm mb-6 px-4 py-3 rounded-lg border-2 shadow-lg ${cacheStatus.status === 'hit' ? 'bg-green-500/20 border-green-500/50' : 'bg-amber-500/20 border-amber-500/50'}`}>
                  <span className="font-semibold text-white">Prediction Engine</span>
                  <span className={`font-bold tracking-wider flex items-center space-x-1 ${cacheStatus.status === 'hit' ? 'text-green-400' : 'text-amber-400'}`}>
                    {cacheStatus.status === 'hit' ? (
                      <><span>⚡</span> <span>CACHE HIT (0ms)</span></>
                    ) : (
                      <><span>⚙️</span> <span>COMPUTED (CPU)</span></>
                    )}
                  </span>
                </div>
              )}

              {passes.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No passes found in the next 48 hours.</div>
              ) : (
                <div className="space-y-4">
                  {passes.map((pass, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${pass.visible ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-sm font-bold text-white">
                            {new Date(pass.peak.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(pass.peak.time).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-md ${pass.visible ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {pass.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{pass.visible ? 'VISIBLE' : 'HIDDEN'}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs mb-3 border-y border-white/10 py-2">
                        <div>
                          <div className="text-gray-500">Rise</div>
                          <div className="text-white font-mono">{pass.rise.azimuthDeg.toFixed(0)}° Az</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Peak</div>
                          <div className="text-accent font-mono">{pass.peak.elevationDeg.toFixed(1)}° El</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Set</div>
                          <div className="text-white font-mono">{pass.set.azimuthDeg.toFixed(0)}° Az</div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 space-y-1">
                        <div className="font-semibold text-gray-300 mb-1">Visibility Engine:</div>
                        {pass.explanation.reasons.map((reason: string, rIdx: number) => (
                          <div key={rIdx} className="flex items-start">
                            <span className="text-accent mr-2">•</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Validation View */}
      {currentView === 'validation' && (
        <ValidationPage onBack={() => setCurrentView('globe')} />
      )}
    </>
  );
}

export default App;
