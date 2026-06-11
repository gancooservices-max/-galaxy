import React, { useState, useEffect } from 'react';
import StarInfoPanel from './modules/StarInfoPanel';
import PlanetComparison from './modules/PlanetComparison';
import StarComparison from './modules/StarComparison';
import DistanceScale from './modules/DistanceScale';
import UniverseScale from './modules/UniverseScale';
import CapsuleTerminal from './modules/CapsuleTerminal';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { Star, Shield, Lock, Unlock, Calendar, MapPin, Award, ArrowLeft, Send, Compass, Crosshair, Radio, Circle, X, Maximize, Orbit, ZoomIn, ZoomOut, Box, Globe2, Trash2 } from 'lucide-react';

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

const glassBase = "bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]";
const glassHover = "hover:bg-white/[0.08] hover:border-white/20 transition-colors";

export default function MyStarPortal({ onBack }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [starData, setStarData] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeComparison, setActiveComparison] = useState(null);
  const [clickedItem, setClickedItem] = useState(null);

  useEffect(() => {
    const handleItemClick = (e) => {
      setClickedItem(e.detail);
    };
    window.addEventListener('mystar-item-click', handleItemClick);
    return () => window.removeEventListener('mystar-item-click', handleItemClick);
  }, []);

  // Dashboard Data
  const [capsules, setCapsules] = useState([]);
  const [wishes, setWishes] = useState([]);

  // Forms
  const [newCapsule, setNewCapsule] = useState({ message: '', open_on_date: '' });
  const [newWish, setNewWish] = useState({ wish_text: '', passcode: '' });
  const [unlockPasscodes, setUnlockPasscodes] = useState({});

  useEffect(() => {
    // Hide 3D UI while portal is open using a robust CSS class
    document.body.classList.add('is-mystar-tracking');
    
    const elsToManage = ['app-header', 'bottom-controls', 'btn-toggle-features', 'corner-menubar', 'time-controller', 'side-panel'];
    elsToManage.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    return () => {
      // Restore 3D UI when portal closes
      document.body.classList.remove('is-mystar-tracking');
      
      const elsToShow = ['app-header', 'bottom-controls', 'btn-toggle-features', 'corner-menubar', 'time-controller'];
      elsToShow.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = '';
      });
    };
  }, []);

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

  const handleDeleteWish = async (wishId) => {
    if (!window.confirm('Are you sure you want to delete this wish?')) return;
    try {
      const res = await fetch(`/api/mystar/${starData.star_id}/wishes/${wishId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setWishes(wishes.filter(w => w.id !== wishId));
      } else {
        alert('Failed to delete wish');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const handleLocateStar = () => {
    setIsMinimized(true);
    window.dispatchEvent(new CustomEvent('locate-mystar', { detail: { starId: starData.star_id, capsules, wishes } }));
  };

  const activeCapsulesCount = capsules.filter(c => c.isLocked).length;

  if (isMinimized) {
    return (
      <>
      <div className="fixed inset-0 pointer-events-none z-[200]">
        
        {/* Item View Popup */}
        <AnimatePresence>
          {clickedItem && (
            clickedItem.type === 'capsule' ? (
              <CapsuleTerminal item={clickedItem} onClose={() => setClickedItem(null)} />
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] bg-[#050B14]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl max-w-md w-full pointer-events-auto"
              >
                <button onClick={() => setClickedItem(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                
                <div>
                  <h3 className="text-2xl font-bold text-nebula-pink flex items-center gap-2 mb-4">
                    <Star className="w-6 h-6" /> Secret Wish {clickedItem.index} of {clickedItem.total}
                  </h3>
                  <div className="text-sm text-gray-400 mb-4 pb-4 border-b border-white/10">Made on: {new Date(clickedItem.data.created_at).toLocaleDateString()}</div>
                  {clickedItem.data.unlocked ? (
                    <p className="text-white whitespace-pre-wrap font-handwriting text-xl">{clickedItem.data.wish_text}</p>
                  ) : (
                    <p className="text-gray-500 italic flex items-center gap-2"><Lock className="w-4 h-4"/> This wish is locked. Unlock it in the dashboard to view it here.</p>
                  )}
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>

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

             <div className="flex flex-col gap-2 mb-4">
               <div className="flex gap-2">
                 <button 
                   onClick={() => setActiveComparison('planet')}
                   className="flex-1 py-2 bg-white/5 hover:bg-galaxy-blue/20 text-white hover:text-galaxy-blue rounded-lg transition-colors border border-white/10 hover:border-galaxy-blue/50 text-xs flex items-center justify-center gap-1"
                 >
                   <Maximize className="w-3.5 h-3.5" /> Planets
                 </button>
                 <button 
                   onClick={() => setActiveComparison('star')}
                   className="flex-1 py-2 bg-white/5 hover:bg-yellow-400/20 text-white hover:text-yellow-400 rounded-lg transition-colors border border-white/10 hover:border-yellow-400/50 text-xs flex items-center justify-center gap-1"
                 >
                   <Star className="w-3.5 h-3.5" /> Stars
                 </button>
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setActiveComparison('distance')}
                   className="flex-1 py-2 bg-white/5 hover:bg-nebula-pink/20 text-white hover:text-nebula-pink rounded-lg transition-colors border border-white/10 hover:border-nebula-pink/50 text-xs flex items-center justify-center gap-1"
                 >
                   <Orbit className="w-3.5 h-3.5" /> Distance
                 </button>
                 <button 
                   onClick={() => setActiveComparison('universe')}
                   className="flex-1 py-2 bg-white/5 hover:bg-aurora-cyan/20 text-white hover:text-aurora-cyan rounded-lg transition-colors border border-white/10 hover:border-aurora-cyan/50 text-xs flex items-center justify-center gap-1"
                 >
                   <ZoomOut className="w-3.5 h-3.5" /> Scale
                 </button>
               </div>
             </div>

             <button 
               onClick={() => {
                 setIsMinimized(false);
                 setActiveComparison(null);
                 window.dispatchEvent(new CustomEvent('stop-tracking-mystar'));
               }} 
               className="w-full py-2.5 bg-aurora-cyan/10 hover:bg-aurora-cyan/20 text-aurora-cyan font-bold rounded-lg transition-colors border border-aurora-cyan/30 text-sm flex items-center justify-center gap-2"
             >
               Return to Dashboard
             </button>
          </div>
        </motion.div>
        
      </div>
        
      {/* Comparison Overlays - Must be rendered even when minimized */}
      <AnimatePresence>
        {activeComparison === 'planet' && <PlanetComparison starData={starData} onClose={() => setActiveComparison(null)} />}
        {activeComparison === 'star' && <StarComparison starData={starData} onClose={() => setActiveComparison(null)} />}
        {activeComparison === 'distance' && <DistanceScale starData={starData} onClose={() => setActiveComparison(null)} />}
        {activeComparison === 'universe' && <UniverseScale starData={starData} onClose={() => setActiveComparison(null)} />}
      </AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white font-sans overflow-x-hidden overflow-y-auto h-screen pointer-events-auto selection:bg-nebula-pink/30 selection:text-white relative">
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

              {/* SCIENTIFIC PROFILE PANEL */}
              <FadeIn delay={0.1}>
                <StarInfoPanel starData={starData} />
              </FadeIn>

              {/* EDUCATIONAL MODULES */}
              <FadeIn delay={0.15}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  <button onClick={() => setActiveComparison('planet')} className="p-6 bg-[#050B14]/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-4 group">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Maximize className="w-8 h-8 text-blue-400" />
                    </div>
                    <span className="font-bold text-sm text-center">Compare With Planets</span>
                  </button>
                  <button onClick={() => setActiveComparison('star')} className="p-6 bg-[#050B14]/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-4 group">
                    <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                    </div>
                    <span className="font-bold text-sm text-center">Compare With Stars</span>
                  </button>
                  <button onClick={() => setActiveComparison('distance')} className="p-6 bg-[#050B14]/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-4 group">
                    <div className="w-16 h-16 rounded-full bg-nebula-pink/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Orbit className="w-8 h-8 text-nebula-pink" />
                    </div>
                    <span className="font-bold text-sm text-center">Cosmic Distance</span>
                  </button>
                  <button onClick={() => setActiveComparison('universe')} className="p-6 bg-[#050B14]/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-4 group">
                    <div className="w-16 h-16 rounded-full bg-aurora-cyan/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ZoomOut className="w-8 h-8 text-aurora-cyan" />
                    </div>
                    <span className="font-bold text-sm text-center">Universe Scale</span>
                  </button>
                </div>
              </FadeIn>

              <div className={`p-8 rounded-3xl ${glassBase} grid lg:grid-cols-3 gap-8 mt-12`}>
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
                    
                    <button 
                      onClick={() => {
                        handleLocateStar();
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('mystar-cinematic-journey', { detail: { starData, capsules, wishes } }));
                        }, 1000);
                      }}
                      className="w-full px-6 py-3 bg-nebula-purple/20 hover:bg-nebula-purple/30 border border-nebula-purple/50 text-nebula-purple font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_15px_rgba(138,43,226,0.2)]"
                    >
                      <Orbit className="w-5 h-5" /> Travel To My Star
                    </button>
                  </div>
                </div>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8">
              {/* TIME CAPSULE */}
              <FadeIn delay={0.2} className={`p-8 rounded-3xl ${glassBase}`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 w-full">
                    <Calendar className="text-aurora-cyan" /> Time Capsule
                    <span className="text-sm font-normal bg-white/10 px-3 py-1 rounded-full ml-auto text-aurora-cyan border border-aurora-cyan/30">
                      {activeCapsulesCount}/2 Active
                    </span>
                  </h2>
                </div>
                
                <div className="space-y-4 mb-8">
                  {capsules.length === 0 && <p className="text-gray-500 italic">No time capsules sealed yet.</p>}
                  {capsules.map((cap, index) => (
                    <div key={cap.id} className="relative overflow-hidden p-3 rounded-xl bg-[#0a1220] border border-aurora-cyan/30 shadow-[0_0_10px_rgba(0,255,204,0.05)] group transition-all hover:border-aurora-cyan/60 hover:shadow-[0_0_15px_rgba(0,255,204,0.15)]">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aurora-cyan/5 to-transparent h-[200%] w-full opacity-0 group-hover:opacity-100 group-hover:animate-scan transition-opacity" />
                      
                      <div className="relative flex justify-between items-start mb-2 pb-2 border-b border-aurora-cyan/10">
                        <div>
                          <h5 className="text-[9px] text-aurora-cyan/60 font-mono tracking-widest uppercase mb-0.5">Payload Designation</h5>
                          <div className="text-sm text-white font-bold tracking-wider">Capsule {index + 1}</div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-aurora-cyan/60 font-mono tracking-widest uppercase mb-0.5">Decryption Date</span>
                          <span className="text-xs font-mono text-white/90 bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                            {new Date(cap.open_on_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="relative flex gap-3 items-start">
                        <div className={`shrink-0 p-1.5 rounded-lg border ${cap.isLocked ? 'bg-red-500/10 border-red-500/20' : 'bg-aurora-cyan/10 border-aurora-cyan/20'}`}>
                          {cap.isLocked ? <Lock className="w-3.5 h-3.5 text-red-400" /> : <Unlock className="w-3.5 h-3.5 text-aurora-cyan" />}
                        </div>
                        <div className="flex-1">
                          {cap.isLocked ? (
                            <div>
                              <h5 className="text-[10px] text-red-400 font-bold font-mono tracking-wider mb-0.5">ENCRYPTION ACTIVE</h5>
                              <p className="text-[10px] text-gray-500 font-mono leading-tight opacity-80 blur-[2px] select-none">
                                Data fragment is temporally sealed. Access is strictly forbidden until the stardate aligns with the decryption key.
                              </p>
                            </div>
                          ) : (
                            <div>
                              <h5 className="text-[10px] text-aurora-cyan font-bold font-mono tracking-wider mb-0.5">DECRYPTED PAYLOAD</h5>
                              <p className="text-xs text-white/90 whitespace-pre-wrap leading-tight custom-scrollbar max-h-24 overflow-y-auto">
                                {cap.message}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {activeCapsulesCount < 2 ? (
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
                ) : (
                  <div className="border-t border-white/10 pt-6 text-center">
                    <p className="text-aurora-cyan font-bold">Limit Reached: 2/2 Capsules Created</p>
                    <p className="text-sm text-gray-400 mt-1">You have reached the maximum number of time capsules.</p>
                  </div>
                )}
              </FadeIn>

              {/* SECRET WISHES */}
              <FadeIn delay={0.4} className={`p-8 rounded-3xl ${glassBase}`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 w-full">
                    <Star className="text-nebula-pink" /> Secret Wishes
                    <span className="text-sm font-normal bg-white/10 px-3 py-1 rounded-full ml-auto text-nebula-pink border border-nebula-pink/30">
                      {wishes.length}/3 Made
                    </span>
                  </h2>
                </div>

                <div className="space-y-4 mb-8">
                  {wishes.length === 0 && <p className="text-gray-500 italic">No secret wishes made yet.</p>}
                  <AnimatePresence>
                    {wishes.map(wish => (
                      <motion.div 
                        key={wish.id}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20, filter: "blur(10px)" }}
                        transition={{ duration: 0.3 }}
                        className="p-4 rounded-xl bg-black/40 border border-white/10 relative group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm text-gray-400">Made on: {new Date(wish.created_at).toLocaleDateString()}</span>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleDeleteWish(wish.id)}
                              className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Wish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {!wish.unlocked && <Lock className="w-4 h-4 text-nebula-pink" />}
                          </div>
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
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {wishes.length < 3 ? (
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
                ) : (
                  <div className="border-t border-white/10 pt-6 text-center">
                    <p className="text-nebula-pink font-bold">Limit Reached: 3/3 Wishes Made</p>
                    <p className="text-sm text-gray-400 mt-1">You have reached the maximum number of secret wishes.</p>
                  </div>
                )}

              </FadeIn>
            </div>
            
            {/* Cosmic Event Feed */}
            <CosmicEventFeed starData={starData} />
          </div>
        )}
      </div>

      {/* COMPARISON OVERLAYS */}
      <AnimatePresence>
        {activeComparison === 'planet' && (
          <PlanetComparison starData={starData} onClose={() => setActiveComparison(null)} />
        )}
        {activeComparison === 'star' && (
          <StarComparison starData={starData} onClose={() => setActiveComparison(null)} />
        )}
        {activeComparison === 'distance' && (
          <DistanceScale starData={starData} onClose={() => setActiveComparison(null)} />
        )}
        {activeComparison === 'universe' && (
          <UniverseScale starData={starData} onClose={() => setActiveComparison(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
