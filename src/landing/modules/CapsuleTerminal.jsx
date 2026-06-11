import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Calendar, Lock, Unlock, Clock, AlertTriangle } from 'lucide-react';

const CapsuleTerminal = ({ item, onClose }) => {
  const mountRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Countdown Timer Logic
  useEffect(() => {
    if (!item || item.type !== 'capsule' || !item.data.open_on_date) return;
    
    const targetDate = new Date(item.data.open_on_date).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      if (distance <= 0) {
        setIsUnlocked(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      setIsUnlocked(false);
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [item]);

  // 3D Scene Logic
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Clear any existing canvases (React Strict Mode fix)
    while (currentMount.firstChild) {
      currentMount.removeChild(currentMount.firstChild);
    }

    // Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
    camera.position.z = 1.2;
    camera.position.y = 0.2;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(80, 80);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(2, 2, 2);
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x00ffcc, 5, 2);
    blueLight.position.set(0, 0.5, 0.5);
    scene.add(blueLight);

    // Create Capsule Geometry (Matches StarRenderer.js)
    // Create Geometry based on type
    const itemGroup = new THREE.Group();
    let geoToDispose, matToDispose;
    
    if (item.type === 'wish') {
      const octaGeo = new THREE.OctahedronGeometry(0.18, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        metalness: 0.5,
        roughness: 0.2,
        emissive: 0x440044,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(octaGeo, mat);

      const wireGeo = new THREE.EdgesGeometry(octaGeo);
      const wireMat = new THREE.LineBasicMaterial({ color: 0xffaaff, linewidth: 2 });
      const wire = new THREE.LineSegments(wireGeo, wireMat);

      itemGroup.add(mesh, wire);
      
      geoToDispose = octaGeo;
      matToDispose = mat;
    } else {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x223344,
        metalness: 0.9,
        roughness: 0.2,
      });
      
      const geo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 32);
      const mainBody = new THREE.Mesh(geo, mat);
      
      const capGeo = new THREE.SphereGeometry(0.12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const topCap = new THREE.Mesh(capGeo, mat);
      topCap.position.y = 0.25;
      const bottomCap = new THREE.Mesh(capGeo, mat);
      bottomCap.position.y = -0.25;
      bottomCap.rotation.x = Math.PI;
      
      const ringGeo = new THREE.TorusGeometry(0.13, 0.015, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
      
      const ring1 = new THREE.Mesh(ringGeo, ringMat);
      ring1.position.y = 0.12;
      ring1.rotation.x = Math.PI / 2;
      
      const ring2 = new THREE.Mesh(ringGeo, ringMat);
      ring2.position.y = -0.12;
      ring2.rotation.x = Math.PI / 2;

      itemGroup.add(mainBody, topCap, bottomCap, ring1, ring2);
      itemGroup.rotation.z = Math.PI / 8; // Slanted look
      
      geoToDispose = geo;
      matToDispose = mat;
    }
    
    scene.add(itemGroup);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      itemGroup.rotation.y += 0.015;
      itemGroup.rotation.x += 0.005; // Added tumbling rotation so movement is visible
      itemGroup.rotation.z += 0.002;
      
      // Pulse effect on rings if it's a capsule
      if (item.type === 'capsule') {
        const scale = 1 + Math.sin(Date.now() * 0.005) * 0.05;
        itemGroup.children.forEach(c => {
          if (c.geometry && c.geometry.type === 'TorusGeometry') {
            c.scale.set(scale, scale, scale);
          }
        });
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (geoToDispose) geoToDispose.dispose();
      if (matToDispose) matToDispose.dispose();
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] pointer-events-auto"
    >
      <div className="relative bg-[#020610]/90 backdrop-blur-xl border border-aurora-cyan/30 rounded-2xl shadow-[0_0_30px_rgba(0,255,204,0.1)] w-[320px] overflow-hidden flex flex-col">
        {/* Holographic background grid */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(0,255,204,0.3)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-aurora-cyan/10 bg-aurora-cyan/5">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${item.type === 'wish' ? 'bg-nebula-pink' : 'bg-aurora-cyan'}`} />
            <span className={`text-[10px] font-bold tracking-widest uppercase ${item.type === 'wish' ? 'text-nebula-pink' : 'text-aurora-cyan'}`}>
              {item.type === 'wish' ? 'Secret Wish' : 'Capsule'} {item.index} / {item.total}
            </span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            className="text-aurora-cyan/40 hover:text-aurora-cyan transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-4 flex gap-4">
          {/* 3D Render Area */}
          <div className="relative shrink-0 flex items-center justify-center bg-black/40 rounded-xl border border-aurora-cyan/20 w-[80px] h-[80px] overflow-hidden">
            <div ref={mountRef} className="absolute inset-0" />
            {/* Corner brackets */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-aurora-cyan/40" />
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-aurora-cyan/40" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-aurora-cyan/40" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-aurora-cyan/40" />
          </div>

          {/* Countdown & Status */}
          <div className="flex-1 flex flex-col justify-center">
            {item.type === 'capsule' ? (
              <>
                <p className="text-[9px] text-aurora-cyan/60 font-mono tracking-widest uppercase mb-1 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Time to Unlock
                </p>
                
                {timeLeft ? (
                  isUnlocked ? (
                    <div className="text-green-400 font-mono font-bold text-xs flex items-center gap-1 mt-1">
                      <Unlock className="w-3.5 h-3.5" /> DECRYPTED
                    </div>
                  ) : (
                    <div className="flex gap-1.5 mt-1">
                      <div className="text-center bg-aurora-cyan/10 rounded px-1.5 py-0.5 border border-aurora-cyan/20">
                        <div className="text-xs font-mono font-bold text-aurora-cyan">{timeLeft.days}</div>
                        <div className="text-[7px] text-aurora-cyan/60 uppercase">D</div>
                      </div>
                      <div className="text-center bg-aurora-cyan/10 rounded px-1.5 py-0.5 border border-aurora-cyan/20">
                        <div className="text-xs font-mono font-bold text-aurora-cyan">{timeLeft.hours.toString().padStart(2, '0')}</div>
                        <div className="text-[7px] text-aurora-cyan/60 uppercase">H</div>
                      </div>
                      <div className="text-center bg-aurora-cyan/10 rounded px-1.5 py-0.5 border border-aurora-cyan/20">
                        <div className="text-xs font-mono font-bold text-aurora-cyan">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                        <div className="text-[7px] text-aurora-cyan/60 uppercase">M</div>
                      </div>
                      <div className="text-center bg-aurora-cyan/10 rounded px-1.5 py-0.5 border border-aurora-cyan/20">
                        <div className="text-xs font-mono font-bold text-aurora-cyan">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                        <div className="text-[7px] text-aurora-cyan/60 uppercase">S</div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-aurora-cyan/50 text-xs font-mono animate-pulse mt-1">Calculating...</div>
                )}
              </>
            ) : (
              <p className="text-[9px] text-nebula-pink/60 font-mono tracking-widest uppercase mb-1 flex items-center gap-1">
                 <Lock className="w-2.5 h-2.5" /> Protected Wish
              </p>
            )}
          </div>
        </div>
        
        {/* Message Area */}
        <div className="px-4 pb-4">
           {item.type === 'wish' ? (
              // WISH VIEW
              item.data.unlocked ? (
                <div className="text-white text-xs whitespace-pre-wrap bg-white/5 p-3 rounded-lg border border-white/10 max-h-32 overflow-y-auto custom-scrollbar font-handwriting text-lg">
                  {item.data.wish_text}
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-lg bg-[#140a1c] border border-nebula-pink/20 p-2.5">
                  <div className="relative flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-nebula-pink shrink-0" />
                    <p className="text-[9px] text-nebula-pink/80 font-mono leading-tight">
                      This wish is protected. Only the owner can unlock it from their dashboard.
                    </p>
                  </div>
                </div>
              )
           ) : (
              // CAPSULE VIEW
              isUnlocked || !item.data.isLocked ? (
                <div className="text-white text-xs whitespace-pre-wrap bg-white/5 p-3 rounded-lg border border-white/10 max-h-32 overflow-y-auto custom-scrollbar">
                  {item.data.message}
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-lg bg-[#0a1220] border border-aurora-cyan/20 p-2.5">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aurora-cyan/5 to-transparent h-[200%] w-full animate-scan" />
                  <div className="relative flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-aurora-cyan shrink-0" />
                    <p className="text-[9px] text-aurora-cyan/80 font-mono leading-tight">
                      ENCRYPTION ACTIVE. Temporal seal intact until stardate.
                    </p>
                  </div>
                </div>
              )
           )}
        </div>
      </div>
    </motion.div>
  );
};

export default CapsuleTerminal;
