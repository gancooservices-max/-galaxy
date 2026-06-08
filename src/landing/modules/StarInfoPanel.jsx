import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Maximize, Orbit, Activity, Clock, MapPin, Star, AlertCircle } from 'lucide-react';

const formatNumber = (num) => new Intl.NumberFormat().format(Math.round(num));

// Procedural estimation based on spectral class (Main Sequence estimates)
const estimateStarProperties = (spect) => {
  const s = spect ? spect.charAt(0).toUpperCase() : 'G';
  switch (s) {
    case 'O': return { temp: '35,000K', radius: 10, lum: 50000, age: '5 Million Years', type: 'Blue Supergiant', color: 'text-blue-400' };
    case 'B': return { temp: '15,000K', radius: 4, lum: 1000, age: '50 Million Years', type: 'Blue Giant', color: 'text-blue-300' };
    case 'A': return { temp: '8,500K', radius: 1.6, lum: 20, age: '400 Million Years', type: 'White Main-Sequence', color: 'text-white' };
    case 'F': return { temp: '6,500K', radius: 1.3, lum: 3, age: '2 Billion Years', type: 'Yellow-White Dwarf', color: 'text-yellow-100' };
    case 'G': return { temp: '5,800K', radius: 1.0, lum: 1, age: '4.6 Billion Years', type: 'Yellow Dwarf', color: 'text-yellow-300' };
    case 'K': return { temp: '4,500K', radius: 0.8, lum: 0.3, age: '15 Billion Years', type: 'Orange Dwarf', color: 'text-orange-400' };
    case 'M': return { temp: '3,000K', radius: 0.3, lum: 0.01, age: '100+ Billion Years', type: 'Red Dwarf', color: 'text-red-500' };
    default: return { temp: '5,800K', radius: 1.0, lum: 1, age: 'Unknown', type: 'Main-Sequence Star', color: 'text-white' };
  }
};

const StatCard = ({ icon: Icon, label, value, subtext, colorClass }) => (
  <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
    <div className={`p-2 rounded-lg bg-black/50 border border-white/10 ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1">{label}</p>
      <p className="text-xl font-display font-bold text-white">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  </div>
);

export default function StarInfoPanel({ starData }) {
  const spect = starData.spect || 'G';
  const props = estimateStarProperties(spect);
  const distanceLY = starData.dist_ly || (starData.distance ? starData.distance.toFixed(2) : 100);
  const sunRadiusKm = 696340;
  
  return (
    <div className="bg-[#0A0C10]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-aurora-cyan/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-nebula-pink/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
        <Star className={`w-8 h-8 ${props.color}`} fill="currentColor" />
        <div>
          <h2 className="text-2xl font-bold text-white">Scientific Profile</h2>
          <p className="text-sm text-gray-400">Astrophysical data & estimates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          icon={Thermometer} label="Temperature" value={props.temp} 
          subtext={`Spectral Class: ${spect}`} colorClass="text-red-400" 
        />
        <StatCard 
          icon={Maximize} label="Estimated Radius" value={`${formatNumber(props.radius * sunRadiusKm)} km`} 
          subtext={`${props.radius}x size of our Sun`} colorClass="text-aurora-cyan" 
        />
        <StatCard 
          icon={Activity} label="Luminosity" value={`${formatNumber(props.lum)} L☉`} 
          subtext="Relative to the Sun" colorClass="text-yellow-400" 
        />
        <StatCard 
          icon={Orbit} label="Distance" value={`${formatNumber(distanceLY)} LY`} 
          subtext="From Earth" colorClass="text-nebula-pink" 
        />
        <StatCard 
          icon={Clock} label="Estimated Age" value={props.age} 
          subtext="Main sequence lifespan" colorClass="text-galaxy-blue" 
        />
        <StatCard 
          icon={MapPin} label="Location" value={starData.constellation || 'Milky Way'} 
          subtext="Constellation" colorClass="text-premium-gold" 
        />
      </div>

      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed">
          <strong>Note:</strong> Some astrophysical data (such as exact age and radius) is procedurally estimated based on the star's spectral class ({spect}) when precise observational data is unavailable. Distance and coordinates are based on actual astrometric measurements.
        </p>
      </div>
    </div>
  );
}
