import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star as StarIcon } from 'lucide-react';

const FAMOUS_STARS = [
  { name: 'The Sun', radius: 1, type: 'G', temp: '5,778 K', color: '#FFD700', shadow: 'rgba(255,215,0,0.6)', size: 20 },
  { name: 'Sirius A', radius: 1.71, type: 'A', temp: '9,940 K', color: '#FFFFFF', shadow: 'rgba(255,255,255,0.8)', size: 34 },
  { name: 'Vega', radius: 2.36, type: 'A', temp: '9,602 K', color: '#E0F2FE', shadow: 'rgba(224,242,254,0.8)', size: 47 },
  { name: 'Polaris', radius: 37.5, type: 'F', temp: '6,015 K', color: '#FEF08A', shadow: 'rgba(254,240,138,0.7)', size: 100 },
  { name: 'Rigel', radius: 78.9, type: 'B', temp: '12,100 K', color: '#93C5FD', shadow: 'rgba(147,197,253,0.9)', size: 160 },
  { name: 'Betelgeuse', radius: 764, type: 'M', temp: '3,600 K', color: '#FCA5A5', shadow: 'rgba(252,165,165,0.8)', size: 250 },
];

export default function StarComparison({ starData, onClose }) {
  const [selectedStar, setSelectedStar] = useState(FAMOUS_STARS[0]);

  let starMultiplier = 1;
  const spect = starData.spect ? starData.spect.charAt(0).toUpperCase() : 'G';
  let myStarColor = '#FFD700';
  let myStarShadow = 'rgba(255,215,0,0.6)';

  if (spect === 'O') { starMultiplier = 15; myStarColor = '#93C5FD'; myStarShadow = 'rgba(147,197,253,0.8)'; }
  else if (spect === 'B') { starMultiplier = 6; myStarColor = '#BFDBFE'; myStarShadow = 'rgba(191,219,254,0.8)'; }
  else if (spect === 'A') { starMultiplier = 2; myStarColor = '#FFFFFF'; myStarShadow = 'rgba(255,255,255,0.8)'; }
  else if (spect === 'F') { starMultiplier = 1.3; myStarColor = '#FEF08A'; myStarShadow = 'rgba(254,240,138,0.7)'; }
  else if (spect === 'G') { starMultiplier = 1; myStarColor = '#FFD700'; myStarShadow = 'rgba(255,215,0,0.6)'; }
  else if (spect === 'K') { starMultiplier = 0.7; myStarColor = '#FDBA74'; myStarShadow = 'rgba(253,186,116,0.6)'; }
  else if (spect === 'M') { starMultiplier = 0.3; myStarColor = '#FCA5A5'; myStarShadow = 'rgba(252,165,165,0.8)'; }

  // Adjust visualization size non-linearly
  const myStarVisualSize = Math.max(10, Math.min(250, 20 * Math.pow(starMultiplier, 0.7)));
  const theirStarVisualSize = Math.max(10, Math.min(250, 20 * Math.pow(selectedStar.radius, 0.7)));

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
            <StarIcon className="w-8 h-8 text-aurora-cyan fill-aurora-cyan" /> Compare With Famous Stars
          </h2>
          <p className="text-gray-400 max-w-2xl text-sm md:text-base">
            See how {starData.star_name} measures up against some of the most famous stars in our galaxy.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-12">
          {/* Controls & Stats */}
          <div className="lg:w-1/3 flex flex-col gap-8">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Select a Star</h3>
              <div className="flex flex-wrap gap-2">
                {FAMOUS_STARS.map(star => (
                  <button 
                    key={star.name}
                    onClick={() => setSelectedStar(star)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedStar.name === star.name ? 'bg-aurora-cyan text-black border-aurora-cyan shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:bg-white/10'}`}
                  >
                    {star.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-black/50 border border-white/5 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">{starData.star_name} vs {selectedStar.name}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Radius (Solar Radii)</p>
                  <p className="text-lg text-white font-mono">{starMultiplier} R☉ <span className="text-gray-500 text-sm">vs</span> {selectedStar.radius} R☉</p>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Spectral Class</p>
                  <p className="text-white font-mono">{spect} <span className="text-gray-500 text-sm">vs</span> {selectedStar.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Surface Temperature</p>
                  <p className="text-white font-mono">Est. {spect === 'G' ? '5,800' : spect === 'O' ? '35,000' : 'Unknown'} K <span className="text-gray-500 text-sm">vs</span> {selectedStar.temp}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Scale Area */}
          <div className="lg:w-2/3 min-h-[400px] bg-black/40 border border-white/5 rounded-3xl relative flex items-end justify-center overflow-hidden pb-8 gap-12 md:gap-24">
            
            {/* My Star */}
            <div className="flex flex-col items-center gap-4 z-10">
              <motion.div 
                layoutId="mystar-render"
                className="rounded-full relative"
                style={{ 
                  width: `${myStarVisualSize}px`, 
                  height: `${myStarVisualSize}px`,
                  backgroundColor: myStarColor,
                  boxShadow: `0 0 40px ${myStarShadow}, inset -10px -10px 20px rgba(0,0,0,0.5)`
                }}
              />
              <div className="text-center">
                <p className="text-white font-bold whitespace-nowrap">{starData.star_name}</p>
                <p className="text-xs text-gray-500">{starMultiplier}x Sun Radius</p>
              </div>
            </div>

            {/* Famous Star */}
            <div className="flex flex-col items-center gap-4 z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedStar.name}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="rounded-full relative"
                  style={{ 
                    width: `${theirStarVisualSize}px`, 
                    height: `${theirStarVisualSize}px`, 
                    backgroundColor: selectedStar.color,
                    boxShadow: `0 0 40px ${selectedStar.shadow}, inset -10px -10px 20px rgba(0,0,0,0.5)`
                  }}
                />
              </AnimatePresence>
              <div className="text-center">
                <p className="text-white font-bold whitespace-nowrap">{selectedStar.name}</p>
                <p className="text-xs text-gray-500">{selectedStar.radius}x Sun Radius</p>
              </div>
            </div>

            {/* Connecting Base Line */}
            <div className="absolute bottom-16 inset-x-12 h-px bg-white/10 pointer-events-none" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
