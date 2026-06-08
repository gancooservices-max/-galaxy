import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe2, ArrowRight } from 'lucide-react';

const SCALES = [
  { name: 'Human', size: '1.7 meters', desc: 'An average human being on Earth.', icon: '🧍' },
  { name: 'Building', size: '828 meters', desc: 'The Burj Khalifa, the tallest building on Earth.', icon: '🏢' },
  { name: 'City', size: '45 kilometers', desc: 'The approximate width of a major metropolitan city.', icon: '🏙️' },
  { name: 'Earth', size: '12,742 kilometers', desc: 'Our home planet.', icon: '🌍' },
  { name: 'Jupiter', size: '139,820 kilometers', desc: 'The largest planet in our solar system.', icon: '🪐' },
  { name: 'The Sun', size: '1.39 million kilometers', desc: 'The star at the center of our solar system.', icon: '☀️' },
];

export default function UniverseScale({ starData, onClose }) {
  const [step, setStep] = useState(0);

  let starMultiplier = 1;
  const spect = starData.spect ? starData.spect.charAt(0).toUpperCase() : 'G';
  if (spect === 'O') starMultiplier = 15;
  else if (spect === 'B') starMultiplier = 6;
  else if (spect === 'A') starMultiplier = 2;
  else if (spect === 'F') starMultiplier = 1.3;
  else if (spect === 'K') starMultiplier = 0.7;
  else if (spect === 'M') starMultiplier = 0.3;

  const starRadiusKm = Math.round(696340 * starMultiplier);
  const diameterMillionKm = (starRadiusKm * 2) / 1000000;

  const steps = [...SCALES, {
    name: starData.star_name,
    size: `${diameterMillionKm > 1 ? diameterMillionKm.toFixed(1) + ' million' : (starRadiusKm * 2).toLocaleString()} kilometers`,
    desc: `Your registered star, a class ${spect} star.`,
    icon: '✨'
  }];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-auto p-4 md:p-6">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-6 md:p-8 border-b border-white/10 shrink-0 relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
              <Globe2 className="w-8 h-8 text-aurora-cyan" /> How Big Is My Star?
            </h2>
            <p className="text-gray-400 text-sm">Zoom out step by step to comprehend the scale of the universe.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6"/>
          </button>
        </div>
        
        <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 5, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="text-center z-10 flex flex-col items-center"
            >
              <div className="text-8xl mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                {current.icon}
              </div>
              <h3 className="text-5xl font-display font-bold text-white mb-4 tracking-wider">{current.name}</h3>
              <p className="text-2xl text-aurora-cyan font-mono mb-6">{current.size}</p>
              <p className="text-gray-400 max-w-md mx-auto text-lg leading-relaxed">{current.desc}</p>
            </motion.div>
          </AnimatePresence>

        </div>

        <div className="p-6 border-t border-white/10 bg-[#050508] flex items-center justify-between">
          <button 
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold disabled:opacity-30 hover:bg-white/5 transition-colors"
          >
            Zoom In
          </button>

          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-aurora-cyan shadow-[0_0_10px_rgba(0,255,255,0.8)]' : 'bg-gray-600'}`} />
            ))}
          </div>

          <button 
            onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
            disabled={step === steps.length - 1}
            className="px-6 py-3 rounded-xl bg-aurora-cyan/20 border border-aurora-cyan/50 text-aurora-cyan font-bold disabled:opacity-30 hover:bg-aurora-cyan/30 transition-colors flex items-center gap-2"
          >
            Zoom Out <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
