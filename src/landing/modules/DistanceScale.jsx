import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Route, Info } from 'lucide-react';

const DISTANCES = [
  { name: 'Earth to Moon', km: 384400, label: '384,400 km', timeLight: '1.3 seconds' },
  { name: 'Earth to Sun', km: 149597870, label: '149.6 Million km (1 AU)', timeLight: '8 minutes' },
  { name: 'Earth to Mars (Avg)', km: 225000000, label: '225 Million km (1.5 AU)', timeLight: '12.5 minutes' },
  { name: 'Earth to Jupiter', km: 778000000, label: '778 Million km (5.2 AU)', timeLight: '43 minutes' },
  { name: 'Earth to Pluto', km: 5900000000, label: '5.9 Billion km (39 AU)', timeLight: '5.5 hours' },
];

export default function DistanceScale({ starData, onClose }) {
  const [scaleLevel, setScaleLevel] = useState(0);

  const distanceLY = starData.dist_ly || (starData.distance ? starData.distance.toFixed(2) : 100);
  const distanceKm = distanceLY * 9.461e12; // 1 LY = 9.461 trillion km
  
  const currentObjects = DISTANCES.slice(0, scaleLevel + 1);
  if (scaleLevel === DISTANCES.length) {
    currentObjects.push({
      name: `Earth to ${starData.star_name}`,
      km: distanceKm,
      label: `${distanceLY.toLocaleString()} Light Years`,
      timeLight: `${distanceLY.toLocaleString()} years`
    });
  }

  // Find max distance in current view to normalize positions
  const maxDistance = currentObjects[currentObjects.length - 1].km;

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
            <Route className="w-8 h-8 text-aurora-cyan" /> Cosmic Distance Scale
          </h2>
          <p className="text-gray-400 max-w-2xl text-sm md:text-base">
            Visualize the immense distance to {starData.star_name} by zooming out through our solar system.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
          
          <div className="flex gap-2 mb-8 flex-wrap justify-center">
            {DISTANCES.map((d, idx) => (
              <button 
                key={idx}
                onClick={() => setScaleLevel(idx)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${scaleLevel === idx ? 'bg-white/20 text-white border-white/50' : 'bg-transparent text-gray-500 border-white/5 hover:border-white/20 hover:text-gray-300'}`}
              >
                {d.name}
              </button>
            ))}
            <button 
              onClick={() => setScaleLevel(DISTANCES.length)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${scaleLevel === DISTANCES.length ? 'bg-aurora-cyan text-black border-aurora-cyan shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'bg-aurora-cyan/10 text-aurora-cyan border-aurora-cyan/30 hover:bg-aurora-cyan/20'}`}
            >
              To {starData.star_name}
            </button>
          </div>

          <div className="relative w-full h-48 bg-black/50 border border-white/5 rounded-2xl p-8 flex items-center">
            {/* The ruler line */}
            <div className="absolute left-8 right-8 h-px bg-white/20 top-1/2 -translate-y-1/2" />
            
            {/* Earth (Origin) */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center -translate-x-1/2">
              <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              <p className="text-xs text-white mt-2 absolute top-full font-bold">Earth</p>
            </div>

            {/* Current Markers */}
            {currentObjects.map((obj, i) => {
              // Calculate percentage across the line. Avoid 0 to prevent overlap with Earth.
              // We use a slight logarithmic push for the final star view so solar system planets aren't perfectly overlaid on 0.
              let pct = (obj.km / maxDistance) * 100;
              if (scaleLevel === DISTANCES.length && i < DISTANCES.length) {
                 pct = Math.max(1, (i+1) * 2); // Spread the inner planets out visually just a tiny bit when viewing the star
              }

              return (
                <motion.div 
                  key={obj.name}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, left: `calc(2rem + calc(100% - 4rem) * ${pct / 100})` }}
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center -translate-x-1/2"
                >
                  <div className={`w-3 h-3 rounded-full ${i === currentObjects.length - 1 ? 'bg-aurora-cyan shadow-[0_0_15px_rgba(0,255,255,0.8)]' : 'bg-gray-400'}`} />
                  <div className={`absolute whitespace-nowrap text-center ${i % 2 === 0 ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                    <p className={`text-xs font-bold ${i === currentObjects.length - 1 ? 'text-aurora-cyan' : 'text-gray-300'}`}>{obj.name.replace('Earth to ', '')}</p>
                    <p className="text-[10px] text-gray-500">{obj.label}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-black/40 border border-white/5 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Distance Fact</h3>
              <p className="text-white text-lg">
                Your star is <strong>{distanceLY.toLocaleString()} light years</strong> away.
              </p>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                This means that the light you see from this star today actually left it {distanceLY.toLocaleString()} years ago. If you were to travel at the speed of light, it would take you that many years to reach it.
              </p>
            </div>
            
            <div className="bg-black/40 border border-white/5 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Travel Time</h3>
              <p className="text-white text-lg">
                Current target: <strong>{currentObjects[currentObjects.length - 1].name}</strong>
              </p>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed flex items-center gap-2">
                <Info className="w-4 h-4" /> Light takes {currentObjects[currentObjects.length - 1].timeLight} to make this journey.
              </p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
