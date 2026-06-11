import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Heart, Gift, Globe2, Star, ChevronDown, 
  Users, Award, Scroll, Key, ShieldCheck, 
  CalendarHeart, Search, CheckCircle2, Send, Mail, Phone, MessageSquare, User, Check, Rocket,
  Menu, X
} from 'lucide-react';
import MyStarPortal from './MyStarPortal';
import CapsuleTerminal from './modules/CapsuleTerminal';

const FadeIn = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// --- Colorful Canvas Starfield ---
const StarrySky = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    let mouse = { x: null, y: null, radius: 250 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    });

    const colors = ['#8A2BE2', '#FF69B4', '#00FFFF', '#1E90FF', '#FFD700', '#ffffff'];

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.speedY = Math.random() * 0.4 - 0.2;
        this.color = colors[Math.floor(Math.random() * colors.length)]; 
        this.opacity = Math.random() * 0.7 + 0.3;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;

        if (mouse.x != null && mouse.y != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= (dx * force) / 30;
            this.y -= (dy * force) / 30;
          }
        }
      }
      draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }

    const init = () => {
      particles = [];
      let numberOfParticles = (canvas.width * canvas.height) / 6000;
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        for (let j = i; j < particles.length; j++) {
          let dx = particles[i].x - particles[j].x;
          let dy = particles[i].y - particles[j].y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = particles[i].color; 
            ctx.globalAlpha = (1 - distance/120) * 0.2;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <img src="/images/space_bg.png?v=4" alt="Space Background" className="fixed inset-0 w-full h-full object-cover z-[-3]" />
      <div className="fixed inset-0 bg-black/40 z-[-3]" />
      {/* Nebula gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-nebula-purple/20 blur-[150px] z-[-2] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-galaxy-blue/20 blur-[150px] z-[-2] pointer-events-none" />
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[-1] opacity-80" />
    </>
  );
};

// --- Navbar ---
const Navbar = ({ onExplore, onOpenMyStar }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-[100] bg-[#050508]/40 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[22px] font-display font-bold tracking-widest">
          <img src="/logo.png" alt="LUMORA" className="w-7 h-7 rounded-[4px]" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-aurora-cyan via-nebula-pink to-nebula-purple">LUMORA</span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2 text-[15px] font-sans font-medium text-gray-300">
          <a href="#" className="px-4 py-2 rounded-full hover:bg-white/10 hover:text-white transition-all">Home</a>
          <a href="#how-it-works" className="px-4 py-2 rounded-full hover:bg-white/10 hover:text-white transition-all">How It Works</a>
          <a href="#contact" className="px-4 py-2 rounded-full hover:bg-white/10 hover:text-white transition-all">Contact</a>
          <button onClick={() => onOpenMyStar('landing')} className="px-4 py-2 rounded-full text-premium-gold hover:bg-premium-gold/10 transition-all font-bold flex items-center gap-2">
            <Star className="w-4 h-4" /> My Star
          </button>
        </div>

        <div className="hidden md:block">
          <button onClick={onExplore} className="px-6 py-2 rounded-full bg-gradient-to-r from-nebula-purple to-galaxy-blue text-white font-bold text-[15px] hover:shadow-[0_0_20px_rgba(138,43,226,0.4)] transition-all">
            Explore Galaxy
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-0 w-full bg-[#0B0C10]/95 backdrop-blur-3xl border-b border-white/10 flex flex-col items-center py-8 gap-6 md:hidden"
          >
            <a href="#" onClick={() => setIsOpen(false)} className="text-lg text-gray-300 hover:text-white">Home</a>
            <a href="#how-it-works" onClick={() => setIsOpen(false)} className="text-lg text-gray-300 hover:text-white">How It Works</a>
            <a href="#contact" onClick={() => setIsOpen(false)} className="text-lg text-gray-300 hover:text-white">Contact</a>
            <button onClick={() => { setIsOpen(false); onOpenMyStar('landing'); }} className="text-lg text-premium-gold hover:text-premium-gold/80 font-bold flex items-center gap-2">
              <Star className="w-5 h-5" /> My Star
            </button>
            <button onClick={() => { onExplore(); setIsOpen(false); }} className="px-8 py-3 rounded-full bg-gradient-to-r from-nebula-purple to-galaxy-blue text-white font-bold mt-4">
              Explore Galaxy
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Contact Form Component ---
const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '', subject: '', message: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'Your message has been sent across the universe.' });
        setFormData({ name: '', email: '', mobile: '', subject: '', message: '' });
      } else {
        const data = await res.json().catch(()=>({}));
        setStatus({ type: 'error', message: data.error || 'Failed to send message.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Connection error. Please try again.' });
    }
    setLoading(false);
  };

  const inputClasses = "w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-white font-sans focus:outline-none focus:border-nebula-pink focus:bg-white/10 transition-all placeholder-gray-500 shadow-inner";

  return (
    <form onSubmit={handleSubmit} className="bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] p-8 md:p-12 rounded-[2rem] relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-galaxy-blue/20 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-nebula-pink/20 blur-[80px] rounded-full pointer-events-none" />
      
      {status.message && (
        <div className={`mb-8 p-5 rounded-2xl border flex items-center gap-4 ${status.type === 'success' ? 'bg-aurora-cyan/10 border-aurora-cyan/30 text-aurora-cyan' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {status.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : null}
          <span className="font-medium">{status.message}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6 relative z-10">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name</label>
          <input required type="text" placeholder="John Doe" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className={inputClasses} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
          <input required type="email" placeholder="john@example.com" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} className={inputClasses} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Mobile Number</label>
          <input type="tel" placeholder="+1 (555) 000-0000" value={formData.mobile} onChange={e=>setFormData({...formData, mobile:e.target.value})} className={inputClasses} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Subject</label>
          <input required type="text" placeholder="Inquiry" value={formData.subject} onChange={e=>setFormData({...formData, subject:e.target.value})} className={inputClasses} />
        </div>
      </div>
      
      <div className="mb-8 relative z-10">
        <label className="block text-sm font-semibold text-gray-300 mb-2">Message</label>
        <textarea required rows="4" placeholder="Begin your celestial journey here..." value={formData.message} onChange={e=>setFormData({...formData, message:e.target.value})} className={`${inputClasses} resize-none`} />
      </div>

      <button disabled={loading} type="submit" className="w-full relative z-10 py-5 rounded-2xl bg-gradient-to-r from-nebula-pink to-nebula-purple text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(255,105,180,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
        {loading ? 'Transmitting...' : <><Send className="w-5 h-5" /> Send Message</>}
      </button>
    </form>
  );
};

const MomentCard = ({ moment, index, glassBase, glassHover }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = moment.description && moment.description.length > 120;
  
  return (
    <FadeIn delay={index * 0.1} className={`p-6 rounded-3xl flex flex-col ${glassBase} ${glassHover} transition-transform hover:-translate-y-2`}>
      <div className="w-full h-64 mb-6 rounded-2xl overflow-hidden shadow-lg border border-white/10 relative group">
        <img src={moment.image_url} alt={moment.star_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-premium-gold fill-premium-gold" />
          <h3 className="text-2xl font-bold text-white">{moment.star_name}</h3>
        </div>
        <p className={`text-gray-300 italic mb-2 ${!isExpanded ? 'line-clamp-3' : ''}`}>
          "{moment.description}"
        </p>
        {isLong && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-aurora-cyan text-sm font-semibold hover:text-white transition-colors mb-4 self-start"
          >
            {isExpanded ? 'Show Less' : 'Read More'}
          </button>
        )}
      </div>
      <div className="pt-4 border-t border-white/10 mt-auto">
        <span className="text-sm text-aurora-cyan font-medium">Dedicated by {moment.owner_name}</span>
      </div>
    </FadeIn>
  );
};

export default function LandingPage({ onExplore }) {
  const { scrollYProgress } = useScroll();
  const [moments, setMoments] = useState([]);
  const [currentView, setCurrentView] = useState('landing');
  const [mystarSource, setMystarSource] = useState('landing');
  const [publicItem, setPublicItem] = useState(null);

  useEffect(() => {
    fetch('/api/moments').then(r => r.json()).then(setMoments).catch(console.error);

    const handleItemClick = (e) => {
      // Only show public terminal if we are not in mystar view
      if (currentView !== 'mystar') {
        setPublicItem(e.detail);
      }
    };
    window.addEventListener('mystar-item-click', handleItemClick);

    const handleOpenMyStar = (e) => {
      setMystarSource(e.detail?.source || 'landing');
      setCurrentView('mystar');
    };
    const handleCloseMyStar = () => {
      setCurrentView('landing');
      const rootEl = document.getElementById('react-root');
      if (rootEl) {
        rootEl.style.pointerEvents = 'none';
        rootEl.style.display = 'none';
      }
    };
    window.addEventListener('open-mystar', handleOpenMyStar);
    window.addEventListener('close-mystar', handleCloseMyStar);

    // Enable native scrolling
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    const rootEl = document.getElementById('react-root');
    if (rootEl) {
      rootEl.style.height = 'auto';
      rootEl.style.minHeight = '100vh';
    }

    return () => {
      window.removeEventListener('open-mystar', handleOpenMyStar);
      window.removeEventListener('close-mystar', handleCloseMyStar);
      // Revert when unmounting (for 3D view)
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (rootEl) {
        rootEl.style.height = '100%';
        rootEl.style.minHeight = '';
      }
    };
  }, [currentView]);

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  const glassBase = "bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]";
  const glassHover = "hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.15)]";

  const handleBackFromMyStar = () => {
    setCurrentView('landing');
    window.dispatchEvent(new CustomEvent('stop-tracking-mystar'));
    if (mystarSource === 'galaxy') {
      const rootEl = document.getElementById('react-root');
      if (rootEl) {
        rootEl.style.pointerEvents = 'none';
        rootEl.style.display = 'none';
      }
    }
  };

  if (currentView === 'mystar') {
    return <MyStarPortal onBack={handleBackFromMyStar} />;
  }

  // If viewing the public galaxy and an item is clicked, show it!
  if (publicItem) {
    return (
      <div className="fixed inset-0 z-[9999] pointer-events-auto">
        <CapsuleTerminal item={publicItem} onClose={() => {
          setPublicItem(null);
          const rootEl = document.getElementById('react-root');
          if (rootEl) {
            rootEl.style.opacity = '0';
            rootEl.style.pointerEvents = 'none';
            setTimeout(() => { rootEl.style.display = 'none'; }, 300);
          }
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white font-sans overflow-x-hidden selection:bg-nebula-pink/30 selection:text-white relative z-0">
      <img src="/images/space_bg.png?v=4" alt="Space Background" className="fixed inset-0 w-full h-full object-cover z-[-3]" />
      <StarrySky />
      <Navbar onExplore={onExplore} onOpenMyStar={(source) => window.dispatchEvent(new CustomEvent('open-mystar', { detail: { source } }))} />
      
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20">
        <motion.div style={{ y }} className="absolute inset-0 z-[-1] pointer-events-none flex items-center justify-center">
           <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-nebula-purple via-nebula-pink to-aurora-cyan opacity-20 blur-[100px]" />
        </motion.div>
        
        <FadeIn className={`inline-flex items-center gap-2 px-6 py-2 rounded-full mb-8 ${glassBase}`}>
          <Sparkles className="w-4 h-4 text-premium-gold" />
          <span className="text-sm font-bold tracking-wide text-premium-gold">Where Every Star Tells a Story</span>
        </FadeIn>
        
        <FadeIn delay={0.2} className="max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-[90px] font-display font-bold tracking-tight mb-8 text-white drop-shadow-2xl leading-[1.1]">
            Dedicate a Star to<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-aurora-cyan via-nebula-pink to-nebula-purple">Someone You Love</span>
          </h1>
        </FadeIn>
        
        <FadeIn delay={0.4} className="max-w-3xl mx-auto">
          <p className="text-lg md:text-2xl text-gray-300 mb-12 leading-relaxed font-light">
            Turn special moments into celestial memories. Explore the galaxy, choose a star, and dedicate it to someone who means the world to you.
          </p>
        </FadeIn>
        
        <FadeIn delay={0.6} className="flex flex-col sm:flex-row gap-6 justify-center items-center relative z-10">
          <button 
            onClick={onExplore}
            className={`px-10 py-5 rounded-full ${glassBase} ${glassHover} text-white font-bold text-lg transition-all flex items-center gap-3`}
          >
            <Star className="w-5 h-5 text-premium-gold fill-premium-gold" /> Dedicate a Star
          </button>
        </FadeIn>

        <motion.div 
          animate={{ y: [0, 10, 0] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </section>

      {moments.length > 0 && (
        <section className="py-32 px-6 relative" id="gallery">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Celestial Gallery</h2>
              <p className="text-xl text-gray-400 font-light">Real moments shared by our star owners.</p>
            </FadeIn>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {moments.map((moment, i) => (
                <MomentCard key={moment.id} moment={moment} index={i} glassBase={glassBase} glassHover={glassHover} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Some Memories Deserve a Place in the Universe</h2>
          </FadeIn>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "🎂", title: "Birthday Surprise", color: "hover:shadow-[0_0_40px_rgba(255,105,180,0.3)]", bg: "bg-gradient-to-br from-nebula-pink/20 to-transparent" },
              { icon: "❤️", title: "For Someone You Love", color: "hover:shadow-[0_0_40px_rgba(255,0,0,0.3)]", bg: "bg-gradient-to-br from-red-500/20 to-transparent" },
              { icon: "💍", title: "Wedding Gift", color: "hover:shadow-[0_0_40px_rgba(255,215,0,0.3)]", bg: "bg-gradient-to-br from-premium-gold/20 to-transparent" },
              { icon: "🎉", title: "Anniversary Celebration", color: "hover:shadow-[0_0_40px_rgba(138,43,226,0.3)]", bg: "bg-gradient-to-br from-nebula-purple/20 to-transparent" },
              { icon: "👶", title: "Welcome a New Life", color: "hover:shadow-[0_0_40px_rgba(0,255,255,0.3)]", bg: "bg-gradient-to-br from-aurora-cyan/20 to-transparent" },
              { icon: "🌹", title: "In Loving Memory", color: "hover:shadow-[0_0_40px_rgba(30,144,255,0.3)]", bg: "bg-gradient-to-br from-galaxy-blue/20 to-transparent" }
            ].map((card, i) => (
              <FadeIn key={i} delay={i * 0.1} className={`group relative rounded-3xl ${glassBase} ${glassHover} p-10 cursor-pointer transition-all duration-500 hover:-translate-y-2 ${card.color} overflow-hidden`}>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${card.bg}`} />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500">{card.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{card.title}</h3>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 relative border-y border-white/5" style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">Journey Through the Solar System</h2>
              <p className="text-xl text-gray-300 mb-10 font-light leading-relaxed">
                Discover planets, constellations, and thousands of stars waiting to become part of someone's story.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  { label: '☀ Sun', target: 'Sun' },
                  { label: '🌍 Earth', target: 'Earth' },
                  { label: '🪐 Saturn', target: 'Saturn' },
                  { label: '🔴 Mars', target: 'Mars' },
                  { label: '🌙 Moon', target: 'Moon' },
                  { label: '⭐ Thousands of Stars', target: 'Stars' }
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => onExplore(item.target)}
                    className={`flex items-center gap-3 rounded-xl p-4 font-medium text-white ${glassBase} ${glassHover} transition-all text-left`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

            </FadeIn>
            
            <FadeIn delay={0.3} className="relative">
              <div className="w-full aspect-square rounded-full border border-white/10 flex items-center justify-center relative animate-[spin_60s_linear_infinite]">
                <div className="w-3/4 aspect-square rounded-full border border-white/10 flex items-center justify-center relative">
                  <div className="absolute top-0 -mt-6 w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-green-400 shadow-[0_0_30px_rgba(0,255,0,0.3)]" /> 
                  <div className="w-1/2 aspect-square rounded-full border border-white/10 flex items-center justify-center relative">
                    <div className="absolute bottom-0 -mb-4 w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_0_20px_rgba(255,0,0,0.3)]" /> 
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 shadow-[0_0_60px_rgba(255,215,0,0.6)] animate-pulse" />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 relative" id="how-it-works">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white">How It Works</h2>
          </FadeIn>

          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-[28px] md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-nebula-purple before:via-nebula-pink before:to-aurora-cyan">
            {[
              { num: "1", title: "Explore the Galaxy", desc: "Navigate through an interactive universe.", icon: <Globe2 /> },
              { num: "2", title: "Choose a Star", desc: "Select an available star.", icon: <Search /> },
              { num: "3", title: "Dedicate It", desc: "Add a name and personal message.", icon: <Heart /> },
              { num: "4", title: "Receive Your Certificate", desc: "Get your premium registration certificate.", icon: <Scroll /> },
              { num: "5", title: "Find It Anytime", desc: "Access your star using your secret key.", icon: <Key /> }
            ].map((step, i) => (
              <FadeIn key={i} delay={0.1 * i} className="relative flex items-center justify-between md:justify-normal md:even:flex-row-reverse group">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#0B0C10] border-4 border-nebula-pink text-white font-bold z-10 shadow-[0_0_20px_rgba(255,105,180,0.5)] md:order-1 md:group-even:-ml-7 md:group-odd:-mr-7">
                  {step.num}
                </div>
                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl ${glassBase} ${glassHover} transition-colors`}>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-aurora-cyan">{step.icon}</div>
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="text-gray-400 pl-10">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 relative border-y border-white/5" style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-7xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-16">More Than a Gift</h2>
          </FadeIn>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Premium Certificate", icon: "✨" },
              { title: "Secret Star Access Key", icon: "🔑" },
              { title: "Interactive Galaxy Access", icon: "🌌" },
              { title: "Unique Star Coordinates", icon: "📍" },
              { title: "Personalized Dedication", icon: "💖" },
              { title: "Lifetime Archive Record", icon: "⭐" }
            ].map((feat, i) => (
              <FadeIn key={i} delay={i * 0.1} className={`flex items-center justify-center gap-4 p-8 rounded-2xl ${glassBase} ${glassHover} transition-colors`}>
                <span className="text-3xl">{feat.icon}</span>
                <span className="text-white font-bold text-lg">{feat.title}</span>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white">Stories Written Among the Stars</h2>
          </FadeIn>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { text: "I dedicated a star to my mother. Every time I look at the night sky, I feel closer to her.", author: "Sarah M." },
              { text: "The perfect anniversary gift. My wife was in tears when she saw her name in the constellation.", author: "James T." },
              { text: "Such a premium experience. The interactive app made this the best gift I've ever given.", author: "Elena R." }
            ].map((testimonial, i) => (
              <FadeIn key={i} delay={0.2 + (i * 0.2)} className={`p-8 rounded-3xl relative border-t-2 border-t-nebula-purple ${glassBase}`}>
                <div className="flex gap-1 mb-6 text-premium-gold">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-300 mb-8 italic text-lg leading-relaxed">"{testimonial.text}"</p>
                <div className="font-bold text-white">{testimonial.author}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 relative border-y border-white/5" id="contact" style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Begin Your Celestial Journey</h2>
            <p className="text-xl text-gray-400 font-light">We're here to help you navigate the stars.</p>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <ContactForm />
          </FadeIn>
        </div>
      </section>

      <section className="py-32 px-6 relative text-center">
        <div className="absolute inset-0 bg-gradient-to-t from-nebula-purple/20 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <FadeIn>
            <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
              The Universe Is Waiting For Your Story
            </h2>
            <p className="text-xl text-gray-300 mb-12 font-light">
              Choose a star, create a memory, and leave a mark among the stars.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                onClick={onExplore}
                className={`px-10 py-5 rounded-full ${glassBase} ${glassHover} text-white transition-all flex items-center justify-center gap-3 text-xl font-bold`}
              >
                <Star className="w-6 h-6 text-premium-gold fill-premium-gold" /> Dedicate a Star
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-2xl font-display font-bold text-white">
            <Star className="w-6 h-6 text-nebula-pink fill-nebula-pink" /> LUMORA
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400 font-medium">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">FAQ</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
          
          <div className="flex items-center gap-6 text-gray-400">
             <a href="#" className="hover:text-nebula-pink transition-colors">X</a>
             <a href="#" className="hover:text-nebula-pink transition-colors">IG</a>
             <a href="#" className="hover:text-nebula-pink transition-colors">FB</a>
          </div>
        </div>
      </footer>
    </div>
  );
};


