import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize, AlertCircle } from 'lucide-react';

const PLANETS = [
  { name: 'Mercury', radius: 2439.7, color: 'bg-gray-400', shadow: 'rgba(156,163,175,0.5)', mass: '0.055 Earths', volume: '0.056 Earths', size: 2 },
  { name: 'Venus', radius: 6051.8, color: 'bg-orange-300', shadow: 'rgba(253,186,116,0.6)', mass: '0.815 Earths', volume: '0.866 Earths', size: 6 },
  { name: 'Earth', radius: 6371, color: 'bg-blue-400', shadow: 'rgba(96,165,250,0.8)', mass: '1 Earth', volume: '1 Earth', size: 8 },
  { name: 'Mars', radius: 3389.5, color: 'bg-red-400', shadow: 'rgba(248,113,113,0.8)', mass: '0.107 Earths', volume: '0.151 Earths', size: 4 },
  { name: 'Jupiter', radius: 69911, color: 'bg-[#E5B581]', shadow: 'rgba(229,181,129,0.5)', mass: '317.8 Earths', volume: '1,321 Earths', size: 40 },
  { name: 'Saturn', radius: 58232, color: 'bg-yellow-200', shadow: 'rgba(253,224,71,0.5)', mass: '95.1 Earths', volume: '763 Earths', size: 34 },
  { name: 'Uranus', radius: 25362, color: 'bg-cyan-200', shadow: 'rgba(165,243,252,0.6)', mass: '14.5 Earths', volume: '63 Earths', size: 18 },
  { name: 'Neptune', radius: 24622, color: 'bg-blue-600', shadow: 'rgba(37,99,235,0.8)', mass: '17.1 Earths', volume: '57 Earths', size: 17 },
];

export default function PlanetComparison({ starData, onClose }) {
  const [selectedPlanet, setSelectedPlanet] = useState(PLANETS[2]); // Earth default
  const [scaleMode, setScaleMode] = useState('visual'); // 'visual' or 'realistic'

  let starMultiplier = 1;
  const spect = starData.spect ? starData.spect.charAt(0).toUpperCase() : 'G';
  if (spect === 'O') starMultiplier = 15;
  else if (spect === 'B') starMultiplier = 6;
  else if (spect === 'A') starMultiplier = 2;
  else if (spect === 'F') starMultiplier = 1.3;
  else if (spect === 'K') starMultiplier = 0.7;
  else if (spect === 'M') starMultiplier = 0.3;

  const starRadiusKm = Math.round(696340 * starMultiplier);
  const starPixelSize = Math.max(150, Math.min(300, 100 * starMultiplier));
  
  const radiusRatio = selectedPlanet.radius / starRadiusKm;
  
  // Visual scale uses a power curve so planets don't disappear.
  // Realistic scale uses a direct linear ratio (with min 1px).
  const planetVisualSize = scaleMode === 'visual' 
    ? Math.max(2, starPixelSize * Math.pow(radiusRatio, 0.4))
    : Math.max(1, starPixelSize * radiusRatio * 2); // multiplied by 2 because starPixelSize is radius


  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-auto p-4 md:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-5xl bg-[#0A0C10]/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 md:p-8 border-b border-white/10 shrink-0 relative">
          <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6"/>
          </button>
          <h2 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Maximize className="w-8 h-8 text-aurora-cyan" /> Planet vs Star
          </h2>
          <p className="text-gray-400 max-w-2xl text-sm md:text-base">
            Understand the true scale of {starData.star_name} by comparing it directly to the planets in our Solar System.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-12">
          {/* Controls & Stats */}
          <div className="lg:w-1/3 flex flex-col gap-8">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Select a Planet</h3>
              <div className="flex flex-wrap gap-2">
                {PLANETS.map(planet => (
                  <button 
                    key={planet.name}
                    onClick={() => setSelectedPlanet(planet)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedPlanet.name === planet.name ? 'bg-aurora-cyan text-black border-aurora-cyan shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:bg-white/10'}`}
                  >
                    {planet.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-black/50 border border-white/5 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">{selectedPlanet.name} vs {starData.star_name}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Radius Comparison</p>
                  <p className="text-lg text-white font-mono">{selectedPlanet.radius.toLocaleString()} km <span className="text-gray-500 text-sm">vs</span> {starRadiusKm.toLocaleString()} km</p>
                  <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-aurora-cyan" style={{ width: `${Math.max(1, (selectedPlanet.radius / starRadiusKm) * 100)}%` }} />
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mass (Relative to Earth)</p>
                  <p className="text-white font-mono">{selectedPlanet.mass}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Volume (Relative to Earth)</p>
                  <p className="text-white font-mono">{selectedPlanet.volume}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-auto p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-200/80 italic">
                "If {selectedPlanet.name} were placed directly beside {starData.star_name}, it would appear as a tiny speck against the immense glowing surface."
              </p>
            </div>
          </div>

          {/* Visual Scale Area */}
          <div className="lg:w-2/3 min-h-[400px] bg-black/40 border border-white/5 rounded-3xl relative flex items-center justify-center overflow-hidden">
            <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
              <button 
                onClick={() => setScaleMode('visual')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${scaleMode === 'visual' ? 'bg-aurora-cyan text-black' : 'text-gray-400 hover:text-white'}`}
              >
                Visual Scale
              </button>
              <button 
                onClick={() => setScaleMode('realistic')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${scaleMode === 'realistic' ? 'bg-aurora-cyan text-black' : 'text-gray-400 hover:text-white'}`}
              >
                Realistic Scale
              </button>
            </div>
            {/* The Star (Partial Arc to show immense size) */}
            <motion.div 
              layoutId="star-arc"
              className="absolute left-[-20%] top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-white via-yellow-100 to-transparent shadow-[0_0_100px_rgba(255,255,255,0.2)]"
              style={{ 
                width: `${starPixelSize * 2}px`, 
                height: `${starPixelSize * 2}px`,
                backgroundColor: spect === 'O' ? '#60A5FA' : spect === 'M' ? '#EF4444' : spect === 'K' ? '#F97316' : spect === 'A' ? '#FFFFFF' : '#FEF08A'
              }}
            />
            
            {/* The Planet */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPlanet.name}
                initial={{ opacity: 0, x: 50, scale: 0.5 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.5 }}
                className="absolute right-[20%] flex flex-col items-center gap-4"
              >
                <div 
                  className={`rounded-full ${selectedPlanet.color} relative overflow-hidden`}
                  style={{ width: `${planetVisualSize}px`, height: `${planetVisualSize}px`, boxShadow: `0 0 20px ${selectedPlanet.shadow}` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/60" />
                </div>
                <div className="absolute top-full mt-4 text-center">
                  <p className="text-white font-bold whitespace-nowrap">{selectedPlanet.name}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Connecting Line */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
