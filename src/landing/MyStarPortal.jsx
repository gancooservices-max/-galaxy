import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { Star, Shield, Lock, Unlock, Calendar, MapPin, Award, ArrowLeft, Send, Compass, Crosshair, Radio, Circle, X, Maximize, Orbit, ZoomIn, ZoomOut, Box } from 'lucide-react';

const FadeIn = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const InteractivePlaque = ({ starData }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);
  
  const background = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.15) 0%, transparent 60%)`;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: 1000 }} className="w-full h-full min-h-[350px] flex items-center justify-center">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-full max-w-[280px] aspect-[3/4] rounded-xl border border-premium-gold/40 shadow-[0_15px_35px_rgba(255,215,0,0.1)] flex flex-col justify-between p-6 cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#151821] to-[#0A0C10] rounded-xl z-[-2]" />
        
        <motion.div 
          className="absolute inset-0 z-[-1] rounded-xl"
          style={{ background }}
        />

        <div style={{ transform: "translateZ(30px)" }} className="text-center">
           <Award className="w-10 h-10 text-premium-gold mx-auto mb-2" />
           <p className="text-[10px] tracking-widest text-premium-gold uppercase font-bold">Official Star Registry</p>
        </div>

        <div style={{ transform: "translateZ(50px)" }} className="text-center space-y-2">
           <h2 className="text-2xl font-display font-bold text-white leading-tight">{starData.star_name}</h2>
           <p className="text-xs font-mono text-gray-400">{starData.unique_id}</p>
        </div>

        <div style={{ transform: "translateZ(40px)" }} className="text-center">
           <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Dedicated To</p>
           <p className="text-sm font-bold text-premium-gold">{starData.owner_name}</p>
        </div>
      </motion.div>
    </div>
  );
};

const simulatedEvents = [
  "The ISS is currently passing through the same sky region as {star}.",
  "A minor meteor shower was recently detected near {constellation}.",
  "Deep space telemetry shows stable solar winds in sector {id}.",
  "A comet is currently passing within 14 light-years of {star}.",
  "Telescopic arrays confirm nominal luminosity for {star}."
];

const CosmicEventFeed = ({ starData }) => {
  const [eventIndex, setEventIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setEventIndex(prev => (prev + 1) % simulatedEvents.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const rawEvent = simulatedEvents[eventIndex];
  const currentEvent = rawEvent
    .replace('{star}', starData.star_name)
    .replace('{constellation}', starData.constellation)
    .replace('{id}', starData.unique_id);

  return (
    <FadeIn delay={0.4} className="mt-8 p-6 rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]">
       <div className="flex items-center justify-between mb-4">
         <h3 className="text-lg font-bold text-white flex items-center gap-2">
           <Radio className="w-5 h-5 text-nebula-pink animate-pulse" />
           Cosmic Live Feed
         </h3>
         <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Live</span>
         </div>
       </div>
       <div className="bg-black/50 rounded-xl p-4 border border-white/5 relative overflow-hidden font-mono">
          <div className="absolute top-0 left-0 w-1 h-full bg-nebula-pink" />
          <AnimatePresence mode="wait">
            <motion.p 
              key={eventIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-aurora-cyan pl-3"
            >
              {currentEvent}
            </motion.p>
          </AnimatePresence>
       </div>
    </FadeIn>
  );
};

const SIZE_OBJECTS = [
  { name: 'The Moon', radius: 1737, color: 'bg-gray-300', shadow: 'rgba(209,213,219,0.5)', size: 4 },
  { name: 'Earth', radius: 6371, color: 'bg-blue-400', shadow: 'rgba(96,165,250,0.8)', size: 8 },
  { name: 'Mars', radius: 3389, color: 'bg-red-400', shadow: 'rgba(248,113,113,0.8)', size: 6 },
  { name: 'Jupiter', radius: 69911, color: 'bg-[#E5B581]', shadow: 'rgba(229,181,129,0.5)', size: 24 },
  { name: 'The Sun', radius: 696340, color: 'bg-[#FFD700]', shadow: 'rgba(255,215,0,0.6)', size: 96 },
  { name: 'Sirius A', radius: 1190000, color: 'bg-white', shadow: 'rgba(255,255,255,0.8)', size: 140 },
];

const SizeComparisonOverlay = ({ starData, onClose }) => {
  const [selectedNames, setSelectedNames] = useState(['Earth', 'Jupiter', 'The Sun']);

  const toggleObject = (name) => {
    if (selectedNames.includes(name)) {
      setSelectedNames(prev => prev.filter(n => n !== name));
    } else if (selectedNames.length < 3) {
      setSelectedNames(prev => [...prev, name]);
    }
  };

  let starMultiplier = 1;
  const spect = starData.spect ? starData.spect.charAt(0).toUpperCase() : 'G';
  if (spect === 'O') starMultiplier = 15;
  else if (spect === 'B') starMultiplier = 6;
  else if (spect === 'A') starMultiplier = 2;
  else if (spect === 'F') starMultiplier = 1.3;
  else if (spect === 'K') starMultiplier = 0.7;
  else if (spect === 'M') starMultiplier = 0.3;

  const starRadiusKm = Math.round(696340 * starMultiplier);
  const starPixelSize = Math.max(12, Math.min(200, 96 * starMultiplier));

  const selectedObjects = SIZE_OBJECTS.filter(o => selectedNames.includes(o.name)).sort((a,b) => a.radius - b.radius);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-auto p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-4xl bg-[#0A0C10]/90 border border-white/10 rounded-3xl p-8 overflow-hidden shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Maximize className="w-6 h-6 text-aurora-cyan" /> Size Comparison</h2>
        <p className="text-gray-400 mb-6">Select up to 3 objects to compare against {starData.star_name}.</p>
        
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-6">
          {SIZE_OBJECTS.map(obj => (
            <button 
              key={obj.name}
              onClick={() => toggleObject(obj.name)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedNames.includes(obj.name) ? 'bg-aurora-cyan text-black border-aurora-cyan shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'}`}
            >
              {obj.name}
            </button>
          ))}
        </div>

        <div className="flex items-end justify-center gap-8 md:gap-16 h-64 pb-4 overflow-x-auto">
          <AnimatePresence>
            {selectedObjects.map(obj => (
              <motion.div 
                key={obj.name}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0 }}
                className="flex flex-col items-center gap-4 min-w-[80px]"
              >
                <div 
                  className={`rounded-full ${obj.color} transition-all duration-500`} 
                  style={{ width: `${obj.size}px`, height: `${obj.size}px`, boxShadow: `0 0 15px ${obj.shadow}` }} 
                />
                <div className="text-center">
                  <p className="text-white font-bold text-sm whitespace-nowrap">{obj.name}</p>
                  <p className="text-xs text-gray-500">{obj.radius.toLocaleString()} km</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div layout className="flex flex-col items-center gap-4 min-w-[120px]">
            <div 
              className="rounded-full bg-aurora-cyan shadow-[0_0_50px_rgba(0,255,255,0.5)] transition-all duration-1000"
              style={{ width: `${starPixelSize}px`, height: `${starPixelSize}px` }} 
            />
            <div className="text-center">
              <p className="text-aurora-cyan font-bold text-sm whitespace-nowrap">{starData.star_name}</p>
              <p className="text-xs text-aurora-cyan/60">{starRadiusKm.toLocaleString()} km (Est.)</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const DISTANCE_MILESTONES = [
  { name: 'The Moon', dist: 0.00000004, label: '0.00000004 LY' },
  { name: 'Mars', dist: 0.000023, label: '0.000023 LY' },
  { name: 'Solar System Edge', dist: 0.002, label: '0.002 LY' },
  { name: 'Alpha Centauri', dist: 4.37, label: '4.37 LY' },
  { name: 'Sirius', dist: 8.6, label: '8.6 LY' },
  { name: 'Orion Nebula', dist: 1344, label: '1,344 LY' },
  { name: 'Galactic Center', dist: 26000, label: '26,000 LY' }
];

const DistanceComparisonOverlay = ({ starData, onClose }) => {
  const [selectedNames, setSelectedNames] = useState(['Solar System Edge', 'Alpha Centauri']);
  
  const toggleMilestone = (name) => {
    if (selectedNames.includes(name)) {
      setSelectedNames(prev => prev.filter(n => n !== name));
    } else if (selectedNames.length < 3) {
      setSelectedNames(prev => [...prev, name]);
    }
  };

  const dist = parseFloat(starData.dist_ly || starData.distance || 100);
  const selectedObjects = DISTANCE_MILESTONES.filter(m => selectedNames.includes(m.name));
  
  const journeyPoints = [
    { name: 'Earth', dist: 0, label: '0 LY', color: 'bg-blue-500', shadow: 'rgba(59,130,246,0.8)', size: 'w-4 h-4' },
    ...selectedObjects.map(m => ({ ...m, color: 'bg-gray-400', shadow: 'transparent', size: 'w-3 h-3' })),
    { name: starData.star_name, dist: dist, label: `${dist} LY`, color: 'bg-nebula-pink', shadow: 'rgba(255,107,181,0.8)', size: 'w-6 h-6', isStar: true }
  ].sort((a,b) => a.dist - b.dist);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-auto p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-4xl bg-[#0A0C10]/90 border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Orbit className="w-6 h-6 text-nebula-pink" /> Cosmic Distance Scale</h2>
        <p className="text-gray-400 mb-6">Select up to 3 milestones to visualize the distance to {starData.star_name}.</p>
        
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-6">
          {DISTANCE_MILESTONES.map(obj => (
            <button 
              key={obj.name}
              onClick={() => toggleMilestone(obj.name)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedNames.includes(obj.name) ? 'bg-nebula-pink text-white border-nebula-pink shadow-[0_0_10px_rgba(255,107,181,0.3)]' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'}`}
            >
              {obj.name}
            </button>
          ))}
        </div>

        <div className="relative py-12 overflow-x-auto">
          <div className="absolute top-1/2 left-0 w-full min-w-[600px] h-[2px] bg-gradient-to-r from-blue-500 via-gray-600 to-nebula-pink -translate-y-1/2" />
          
          <div className="relative flex justify-between items-center w-full min-w-[600px]">
            <AnimatePresence>
              {journeyPoints.map(point => (
                <motion.div 
                  key={point.name}
                  layout
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0 }}
                  className="relative flex flex-col items-center px-4"
                >
                   <div className={`${point.size} ${point.color} rounded-full mb-4`} style={{ boxShadow: `0 0 15px ${point.shadow}` }} />
                   <p className={`${point.isStar ? 'text-nebula-pink text-center whitespace-nowrap' : 'text-white whitespace-nowrap'} font-bold text-sm`}>{point.name}</p>
                   <p className={`text-xs ${point.isStar ? 'text-nebula-pink/80' : 'text-gray-500'}`}>{point.label}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8 bg-white/5 rounded-xl p-4 text-center">
          <p className="text-gray-300 italic">
            "Traveling at the speed of a commercial jet (900 km/h), it would take you 
            <strong className="text-white mx-1">
              {Math.round((dist * 9.461e12) / (900 * 24 * 365)).toLocaleString()} million years
            </strong> 
            to reach your star!"
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const glassBase = "bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]";
const glassHover = "hover:bg-white/[0.08] hover:border-white/20 transition-colors";

export default function MyStarPortal({ onBack }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [starData, setStarData] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeComparison, setActiveComparison] = useState(null);

  // Dashboard Data
  const [capsules, setCapsules] = useState([]);
  const [wishes, setWishes] = useState([]);

  // Forms
  const [newCapsule, setNewCapsule] = useState({ message: '', open_on_date: '' });
  const [newWish, setNewWish] = useState({ wish_text: '', passcode: '' });
  const [unlockPasscodes, setUnlockPasscodes] = useState({});

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!key) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/mystar/verify/${key}`);
      const data = await res.json();
      if (res.ok) {
        setStarData(data.star);
        fetchCapsules(data.star.star_id);
        fetchWishes(data.star.star_id);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCapsules = async (starId) => {
    try {
      const res = await fetch(`/api/mystar/${starId}/capsules`);
      if (res.ok) setCapsules(await res.json());
    } catch (e) {}
  };

  const fetchWishes = async (starId) => {
    try {
      const res = await fetch(`/api/mystar/${starId}/wishes`);
      if (res.ok) setWishes(await res.json());
    } catch (e) {}
  };

  const handleAddCapsule = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/mystar/${starData.star_id}/capsules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCapsule)
      });
      if (res.ok) {
        setNewCapsule({ message: '', open_on_date: '' });
        fetchCapsules(starData.star_id);
      }
    } catch (e) {}
  };

  const handleAddWish = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/mystar/${starData.star_id}/wishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWish)
      });
      if (res.ok) {
        setNewWish({ wish_text: '', passcode: '' });
        fetchWishes(starData.star_id);
      }
    } catch (e) {}
  };

  const handleUnlockWish = async (wishId) => {
    const code = unlockPasscodes[wishId];
    if (!code) return;
    try {
      const res = await fetch(`/api/mystar/${starData.star_id}/wishes/${wishId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code })
      });
      const data = await res.json();
      if (res.ok) {
        setWishes(wishes.map(w => w.id === wishId ? { ...w, wish_text: data.wish_text, unlocked: true } : w));
      } else {
        alert(data.error || 'Unlock failed');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const handleLocateStar = () => {
    setIsMinimized(true);
    window.dispatchEvent(new CustomEvent('locate-mystar', { detail: { starId: starData.star_id } }));
  };

  if (isMinimized) {
    return (
      <div className="fixed inset-0 pointer-events-none z-[200]">
        
        {/* Camera Controls Panel */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 right-6 flex gap-2 bg-[#050B14]/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-auto"
        >
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('mystar-zoom-in'))}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10 text-xs flex items-center justify-center gap-1"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" /> Zoom In
          </button>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('mystar-zoom-out'))}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10 text-xs flex items-center justify-center gap-1"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" /> Zoom Out
          </button>
          <div className="w-px h-6 bg-white/10 self-center mx-1"></div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('mystar-toggle-3d'))}
            className="px-3 py-1.5 bg-white/5 hover:bg-aurora-cyan/20 text-white hover:text-aurora-cyan rounded-lg transition-colors border border-white/10 hover:border-aurora-cyan/50 text-xs flex items-center justify-center gap-1"
            title="Toggle 3D Orbit"
          >
            <Box className="w-4 h-4" /> 3D View
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 50, x: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          className="absolute bottom-8 right-8 w-80 bg-[#050B14]/90 backdrop-blur-xl border border-aurora-cyan/40 rounded-2xl p-5 shadow-[0_0_40px_rgba(0,255,255,0.15)] pointer-events-auto"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-aurora-cyan animate-[spin_3s_linear_infinite]" />
                Tracking Star
              </h3>
              <p className="text-sm text-aurora-cyan/80 font-mono tracking-wider">{starData.unique_id}</p>
            </div>
            <button 
              onClick={() => setIsMinimized(false)} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              title="Maximize Dashboard"
            >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            </button>
          </div>
          <div className="space-y-3">
             <p className="text-xs text-gray-400 leading-relaxed mb-4">
               Autopilot engaged. Your dedicated star is being tracked in the observatory. Feel free to drag the camera to rotate your view!
             </p>

             <button 
               onClick={() => {
                 setIsMinimized(false);
                 setActiveComparison(null);
                 window.dispatchEvent(new CustomEvent('stop-tracking-mystar'));
               }} 
               className="w-full mt-2 py-2.5 bg-aurora-cyan/10 hover:bg-aurora-cyan/20 text-aurora-cyan font-bold rounded-lg transition-colors border border-aurora-cyan/30 text-sm flex items-center justify-center gap-2"
             >
               Return to Dashboard
             </button>
          </div>
        </motion.div>
        
        <AnimatePresence>
          {activeComparison === 'size' && (
            <SizeComparisonOverlay starData={starData} onClose={() => setActiveComparison(null)} />
          )}
          {activeComparison === 'distance' && (
            <DistanceComparisonOverlay starData={starData} onClose={() => setActiveComparison(null)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white font-sans overflow-x-hidden selection:bg-nebula-pink/30 selection:text-white relative">
      <div className="fixed inset-0 bg-[#050508]/50 backdrop-blur-sm z-[-3]" />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] bg-[#050508]/40 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-medium">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="flex items-center gap-3 text-[22px] font-display font-bold tracking-widest">
            <Star className="w-6 h-6 text-premium-gold fill-premium-gold" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-aurora-cyan via-nebula-pink to-nebula-purple">MY STAR</span>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col items-center">
        
        {!starData ? (
          // STEP 1: VERIFICATION
          <FadeIn className="w-full max-w-md mt-20">
            <div className={`p-10 rounded-3xl ${glassBase} text-center relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-aurora-cyan via-nebula-pink to-nebula-purple" />
              <Shield className="w-16 h-16 text-nebula-pink mx-auto mb-6" />
              <h1 className="text-3xl font-display font-bold mb-2">Welcome Back</h1>
              <p className="text-gray-400 mb-8 font-light">Enter your Secret Star Key to access your personal dashboard.</p>
              
              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <input
                    type="text"
                    required
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    placeholder="LMR-XXXX-XXXX"
                    className="w-full text-center tracking-widest font-mono text-xl p-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-nebula-pink transition-colors"
                  />
                </div>
                {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-nebula-purple to-galaxy-blue text-white font-bold text-lg hover:shadow-[0_0_20px_rgba(138,43,226,0.4)] transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'View My Star'}
                </button>
              </form>
            </div>
          </FadeIn>
        ) : (
          // STEP 2: DASHBOARD
          <div className="w-full space-y-12">
            
            <FadeIn>
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                  My Star: <span className="text-transparent bg-clip-text bg-gradient-to-r from-premium-gold to-yellow-200">{starData.star_name}</span>
                </h1>
                <p className="text-xl text-gray-400">Unique Registry ID: {starData.unique_id}</p>
              </div>

              <div className={`p-8 rounded-3xl ${glassBase} grid lg:grid-cols-3 gap-8`}>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-nebula-pink/20 flex items-center justify-center">
                      <Star className="w-6 h-6 text-nebula-pink" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Dedicated To</p>
                      <p className="text-xl font-bold text-white">{starData.owner_name}</p>
                    </div>
                  </div>
                  
                  {starData.dedicated_by && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-aurora-cyan/20 flex items-center justify-center">
                        <Send className="w-6 h-6 text-aurora-cyan" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Dedicated By</p>
                        <p className="text-xl font-bold text-white">{starData.dedicated_by}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-galaxy-blue/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-galaxy-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Registered On</p>
                      <p className="text-xl font-bold text-white">{new Date(starData.registration_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-premium-gold/20 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-premium-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Constellation</p>
                      <p className="text-xl font-bold text-white">{starData.constellation}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden relative min-h-[300px] flex items-center justify-center bg-black/20">
                  <InteractivePlaque starData={starData} />
                </div>

                {/* LOCATOR WIDGET */}
                <div className="rounded-2xl overflow-hidden border border-aurora-cyan/20 relative min-h-[300px] flex flex-col items-center justify-center bg-[#050B14]">
                  {/* Radar Grid Background */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />
                  <div className="absolute inset-0 opacity-10" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #00ffff 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #00ffff 20px)' }} />
                  
                  <div className="relative z-10 text-center flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border border-aurora-cyan/50 flex items-center justify-center mb-6 relative">
                      <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-aurora-cyan animate-[spin_3s_linear_infinite]" />
                      <div className="absolute inset-2 rounded-full border-b-2 border-r-2 border-nebula-pink animate-[spin_4s_linear_infinite_reverse]" />
                      <Crosshair className="w-8 h-8 text-aurora-cyan" />
                      <div className="absolute w-2 h-2 bg-white rounded-full top-[25%] right-[25%] shadow-[0_0_10px_#fff]" />
                    </div>
                    
                    <h3 className="text-xl font-display font-bold text-white mb-2">Live Star Tracker</h3>
                    <p className="text-sm text-aurora-cyan/70 mb-6 font-mono tracking-widest">
                      ID: {starData.star_id || starData.unique_id}
                    </p>
                    
                    <button 
                      onClick={handleLocateStar}
                      className="px-6 py-3 bg-aurora-cyan/10 hover:bg-aurora-cyan/20 border border-aurora-cyan/50 text-aurora-cyan font-bold rounded-full transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)]"
                    >
                      <Compass className="w-5 h-5" /> Locate in Galaxy
                    </button>
                  </div>
                </div>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8">
              {/* TIME CAPSULE */}
              <FadeIn delay={0.2} className={`p-8 rounded-3xl ${glassBase}`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Calendar className="text-aurora-cyan" /> Time Capsule
                  </h2>
                </div>
                
                <div className="space-y-4 mb-8">
                  {capsules.length === 0 && <p className="text-gray-500 italic">No time capsules sealed yet.</p>}
                  {capsules.map(cap => (
                    <div key={cap.id} className="p-4 rounded-xl bg-black/40 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-gray-400">Opens: {new Date(cap.open_on_date).toLocaleDateString()}</span>
                        {cap.isLocked ? <Lock className="w-4 h-4 text-red-400" /> : <Unlock className="w-4 h-4 text-green-400" />}
                      </div>
                      {cap.isLocked ? (
                        <p className="text-gray-500 font-mono text-sm blur-sm select-none">Message is currently locked and cannot be viewed until the specified date.</p>
                      ) : (
                        <p className="text-white whitespace-pre-wrap">{cap.message}</p>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddCapsule} className="space-y-4 border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-white">Seal a New Capsule</h3>
                  <textarea
                    required
                    rows="3"
                    value={newCapsule.message}
                    onChange={e => setNewCapsule({...newCapsule, message: e.target.value})}
                    placeholder="Write a message for the future..."
                    className="w-full p-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-aurora-cyan outline-none transition-colors"
                  />
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-1">Open On Date</label>
                      <input
                        type="date"
                        required
                        value={newCapsule.open_on_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setNewCapsule({...newCapsule, open_on_date: e.target.value})}
                        className="w-full p-3 bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-aurora-cyan"
                      />
                    </div>
                    <button type="submit" className="self-end px-6 py-3 rounded-lg bg-aurora-cyan/20 text-aurora-cyan hover:bg-aurora-cyan/30 border border-aurora-cyan/50 font-bold transition-colors">
                      Seal It
                    </button>
                  </div>
                </form>
              </FadeIn>

              {/* SECRET WISHES */}
              <FadeIn delay={0.4} className={`p-8 rounded-3xl ${glassBase}`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Star className="text-nebula-pink" /> Secret Wishes
                  </h2>
                </div>

                <div className="space-y-4 mb-8">
                  {wishes.length === 0 && <p className="text-gray-500 italic">No secret wishes made yet.</p>}
                  {wishes.map(wish => (
                    <div key={wish.id} className="p-4 rounded-xl bg-black/40 border border-white/10">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm text-gray-400">Made on: {new Date(wish.created_at).toLocaleDateString()}</span>
                        {!wish.unlocked && <Lock className="w-4 h-4 text-nebula-pink" />}
                      </div>
                      
                      {wish.unlocked ? (
                        <p className="text-white whitespace-pre-wrap font-handwriting text-lg">{wish.wish_text}</p>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="password"
                            placeholder="Enter Passcode"
                            value={unlockPasscodes[wish.id] || ''}
                            onChange={e => setUnlockPasscodes({...unlockPasscodes, [wish.id]: e.target.value})}
                            className="flex-1 p-2 bg-black/50 border border-white/10 rounded text-white text-sm outline-none focus:border-nebula-pink"
                          />
                          <button onClick={() => handleUnlockWish(wish.id)} className="px-4 py-2 bg-nebula-pink/20 text-nebula-pink hover:bg-nebula-pink/30 rounded border border-nebula-pink/50 text-sm font-bold transition-colors">
                            Unlock
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddWish} className="space-y-4 border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-white">Make a New Wish</h3>
                  <textarea
                    required
                    rows="3"
                    value={newWish.wish_text}
                    onChange={e => setNewWish({...newWish, wish_text: e.target.value})}
                    placeholder="Whisper your wish to the stars..."
                    className="w-full p-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-nebula-pink outline-none transition-colors font-handwriting text-lg"
                  />
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-1">Secret Passcode</label>
                      <input
                        type="password"
                        required
                        value={newWish.passcode}
                        onChange={e => setNewWish({...newWish, passcode: e.target.value})}
                        placeholder="••••••••"
                        className="w-full p-3 bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-nebula-pink"
                      />
                    </div>
                    <button type="submit" className="self-end px-6 py-3 rounded-lg bg-nebula-pink/20 text-nebula-pink hover:bg-nebula-pink/30 border border-nebula-pink/50 font-bold transition-colors">
                      Lock Wish
                    </button>
                  </div>
                </form>

              </FadeIn>
            </div>
            
            {/* Cosmic Event Feed */}
            <CosmicEventFeed starData={starData} />
          </div>
        )}
      </div>
    </div>
  );
}
