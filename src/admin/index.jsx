import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');

  if (!token) {
    return <Login onLogin={(t) => { setToken(t); localStorage.setItem('adminToken', t); }} />;
  }

  return <Dashboard token={token} onLogout={() => { setToken(''); localStorage.removeItem('adminToken'); }} />;
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.token);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 font-sans">
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl w-96 border border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-yellow-400">Galaxy Admin</h2>
        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Admin ID</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100" required />
          </div>
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100" required />
          </div>
          <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded transition">Login</button>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState('registrations');

  return (
    <div className="h-screen flex bg-slate-900 text-slate-100 font-sans">
      <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 flex flex-col">
        <h1 className="text-xl font-bold text-yellow-400 mb-8 px-2">Galaxy Admin</h1>
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('registrations')} 
            className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'registrations' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
          >
            ⭐ Star Registrations
          </button>
          <button 
            onClick={() => setActiveTab('custom')} 
            className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'custom' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
          >
            ✨ Custom Stars
          </button>
          <button 
            onClick={() => setActiveTab('inquiries')} 
            className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'inquiries' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
          >
            ✉️ Contact Inquiries
          </button>
          <button 
            onClick={() => setActiveTab('moments')} 
            className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'moments' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
          >
            📸 Published Moments
          </button>
        </nav>
        <button onClick={onLogout} className="mt-auto px-4 py-2 text-slate-400 hover:text-white text-left hover:bg-slate-700 rounded transition">Logout</button>
      </div>
      <div className="flex-1 p-8 overflow-auto">
        {activeTab === 'registrations' && <Registrations token={token} />}
        {activeTab === 'custom' && <CustomStars token={token} />}
        {activeTab === 'inquiries' && <Inquiries token={token} />}
        {activeTab === 'moments' && <PublishedMoments token={token} />}
      </div>
    </div>
  );
}

function Registrations({ token }) {
  const [regs, setRegs] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [wishes, setWishes] = useState([]);

  const fetchRegs = async () => {
    const res = await fetch('/api/admin/registrations', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setRegs(await res.json());
  };

  useEffect(() => { fetchRegs(); }, []);

  useEffect(() => {
    if (selectedReg) {
      fetch(`/api/mystar/${selectedReg.star_id}/capsules`)
        .then(res => res.json())
        .then(data => setCapsules(Array.isArray(data) ? data : []))
        .catch(() => setCapsules([]));
      
      fetch(`/api/mystar/${selectedReg.star_id}/wishes`)
        .then(res => res.json())
        .then(data => setWishes(Array.isArray(data) ? data : []))
        .catch(() => setWishes([]));
    } else {
      setCapsules([]);
      setWishes([]);
    }
  }, [selectedReg]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to revoke this registration?')) return;
    const res = await fetch(`/api/admin/registrations/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) fetchRegs();
  };

  const handleActivate = async (id) => {
    if (!confirm('Are you sure you want to activate and send the certificate email?')) return;
    const res = await fetch(`/api/admin/registrations/${id}/activate`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      alert('Email sent successfully!');
      fetchRegs();
    } else {
      const data = await res.json();
      alert('Error: ' + (data.error || 'Failed to send email'));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Star Registrations</h2>
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700">
              <th className="p-4 font-semibold text-slate-300">ID</th>
              <th className="p-4 font-semibold text-slate-300">Star Name</th>
              <th className="p-4 font-semibold text-slate-300">Orig. Name</th>
              <th className="p-4 font-semibold text-slate-300">Owner</th>
              <th className="p-4 font-semibold text-slate-300">Email</th>
              <th className="p-4 font-semibold text-slate-300">Status</th>
              <th className="p-4 font-semibold text-slate-300">Date</th>
              <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {regs.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-slate-500">No registrations found.</td></tr>}
            {regs.map(reg => (
              <tr key={reg.star_id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="p-4 text-slate-300">{reg.star_id}</td>
                <td className="p-4 font-medium text-yellow-400">{reg.star_name}</td>
                <td className="p-4 text-slate-400 italic text-sm">{reg.original_name || 'Unknown'}</td>
                <td className="p-4 text-blue-400 cursor-pointer hover:underline" onClick={() => setSelectedReg(reg)}>
                  {reg.owner_name}
                </td>
                <td className="p-4 text-slate-400 text-sm">{reg.email}</td>
                <td className="p-4 text-sm">
                  {reg.email_sent ? 
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Sent</span> : 
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending</span>}
                </td>
                <td className="p-4 text-slate-400 text-sm">{new Date(reg.registration_date).toLocaleDateString()}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  {!reg.email_sent ? (
                    <button onClick={() => handleActivate(reg.star_id)} className="text-green-400 hover:text-green-300 text-sm px-2 py-1 rounded bg-green-400/10 hover:bg-green-400/20 transition">Activate & Send Email</button>
                  ) : (
                    <button onClick={() => handleActivate(reg.star_id)} className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded bg-blue-400/10 hover:bg-blue-400/20 transition">Resend Email</button>
                  )}
                  <button onClick={() => handleDelete(reg.star_id)} className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded bg-red-400/10 hover:bg-red-400/20 transition">Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_0_50px_rgba(0,255,255,0.1)] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20 relative z-10">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-aurora-cyan to-nebula-pink tracking-wide">
                Stellar Registry Details
              </h3>
              <button onClick={() => setSelectedReg(null)} className="text-white/50 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all text-xl leading-none pb-1">&times;</button>
            </div>
            
            <div className="p-8 space-y-6 text-slate-200 overflow-y-auto relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                  <strong className="text-aurora-cyan/70 block text-xs uppercase tracking-wider mb-1">Owner Name</strong>
                  <div className="text-xl font-semibold text-white">{selectedReg.owner_name}</div>
                </div>
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                  <strong className="text-aurora-cyan/70 block text-xs uppercase tracking-wider mb-1">Email</strong>
                  <div className="text-base text-slate-300">{selectedReg.email}</div>
                </div>
                
                <div className="col-span-2 bg-black/30 p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-yellow-500/10 to-transparent pointer-events-none" />
                  <strong className="text-yellow-500/70 block text-xs uppercase tracking-wider mb-1">Custom Star Name</strong>
                  <div className="text-2xl text-yellow-400 font-bold tracking-wide">{selectedReg.star_name}</div>
                  <div className="text-slate-400 text-sm mt-1">Orig: {selectedReg.original_name || 'Unknown'}</div>
                </div>

                <div className="col-span-2 bg-black/30 p-4 rounded-2xl border border-white/5">
                  <strong className="text-aurora-cyan/70 block text-xs uppercase tracking-wider mb-2">Dedicated Message</strong>
                  <div className="italic text-slate-300 leading-relaxed">"{selectedReg.message || 'No message provided'}"</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                  <strong className="text-aurora-cyan/70 block text-xs uppercase tracking-wider mb-1">Star ID (Database)</strong>
                  <div className="font-mono text-sm text-slate-300">{selectedReg.star_id}</div>
                </div>
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                  <strong className="text-aurora-cyan/70 block text-xs uppercase tracking-wider mb-1">Registry Unique ID</strong>
                  <div className="font-mono text-sm text-green-400">{selectedReg.unique_id}</div>
                </div>
                <div className="col-span-2 bg-black/30 p-4 rounded-2xl border border-purple-500/20">
                  <strong className="text-purple-400/70 block text-xs uppercase tracking-wider mb-1">Secret Security Key</strong>
                  <div className="font-mono text-base text-purple-300 tracking-widest">{selectedReg.secret_key}</div>
                </div>
                <div className="col-span-2 bg-black/30 p-4 rounded-2xl border border-white/5">
                  <strong className="text-aurora-cyan/70 block text-xs uppercase tracking-wider mb-1">Registration Date</strong>
                  <div className="text-slate-300">{new Date(selectedReg.registration_date).toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                  <span>⏳ Time Capsules</span> 
                  <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">{capsules.length}/2</span>
                </h4>
                {capsules.length === 0 ? <div className="text-slate-500 text-sm italic ml-2">No capsules created.</div> : (
                  <div className="space-y-3">
                    {capsules.map(cap => (
                      <div key={cap.id} className="bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-aurora-cyan">Unlock Date: <span className="text-white font-medium">{new Date(cap.open_on_date).toLocaleDateString()}</span></span>
                          <span className="text-slate-500 text-xs">{new Date(cap.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-slate-400 italic text-sm flex items-center gap-2 bg-black/50 p-2 rounded-lg">
                          <span className="text-lg">🔒</span> Message hidden for privacy
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-bold text-nebula-pink flex items-center gap-2">
                  <span>✨ Secret Wishes</span>
                  <span className="text-xs bg-nebula-pink/20 text-nebula-pink px-2 py-0.5 rounded-full">{wishes.length}/3</span>
                </h4>
                {wishes.length === 0 ? <div className="text-slate-500 text-sm italic ml-2">No wishes created.</div> : (
                  <div className="space-y-3">
                    {wishes.map(wish => (
                      <div key={wish.id} className="bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-nebula-pink">Wish <span className="text-white font-medium">#{wish.id}</span></span>
                          <span className="text-slate-500 text-xs">{new Date(wish.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-slate-400 italic text-sm flex items-center gap-2 bg-black/50 p-2 rounded-lg">
                          <span className="text-lg">🔒</span> Wish text is encrypted and hidden
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-black/20 relative z-10 flex justify-end">
              <button onClick={() => setSelectedReg(null)} className="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-2 rounded-xl text-white font-medium transition-all shadow-lg hover:shadow-white/10">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomStars({ token }) {
  const [stars, setStars] = useState([]);
  const [form, setForm] = useState({ name: '', ra: '', dec_coord: '', magnitude: '5.0', distance: '100', color: '#ffcc00' });

  const fetchStars = async () => {
    const res = await fetch('/api/admin/custom-stars', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setStars(await res.json());
  };

  useEffect(() => { fetchStars(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/custom-stars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        name: form.name,
        ra: parseFloat(form.ra),
        dec_coord: parseFloat(form.dec_coord),
        magnitude: parseFloat(form.magnitude),
        distance: parseFloat(form.distance),
        color: form.color,
        spectral_type: 'G'
      })
    });
    if (res.ok) {
      setForm({ name: '', ra: '', dec_coord: '', magnitude: '5.0', distance: '100', color: '#ffcc00' });
      fetchStars();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this custom star?')) return;
    const res = await fetch(`/api/admin/custom-stars/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) fetchStars();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Custom Stars</h2>
      
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-slate-200">Create New Star</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Star Name</label>
            <input type="text" required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100" placeholder="E.g. Alpha Centauri X" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Color (Hex)</label>
            <div className="flex gap-2">
              <input type="color" value={form.color} onChange={e=>setForm({...form, color: e.target.value})} className="h-10 w-12 bg-slate-900 border border-slate-700 rounded cursor-pointer" />
              <input type="text" required value={form.color} onChange={e=>setForm({...form, color: e.target.value})} className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Right Ascension (Hours: 0-24)</label>
            <input type="number" step="0.0001" required value={form.ra} onChange={e=>setForm({...form, ra: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100" placeholder="E.g. 14.5" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Declination (Degrees: -90 to 90)</label>
            <input type="number" step="0.0001" required value={form.dec_coord} onChange={e=>setForm({...form, dec_coord: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100" placeholder="E.g. -60.8" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Magnitude (Brightness, lower is brighter)</label>
            <input type="number" step="0.1" required value={form.magnitude} onChange={e=>setForm({...form, magnitude: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Distance (Light Years)</label>
            <input type="number" step="1" required value={form.distance} onChange={e=>setForm({...form, distance: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
          </div>
          <div className="col-span-2 mt-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition">Create Star</button>
          </div>
        </form>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700">
              <th className="p-4 font-semibold text-slate-300">ID</th>
              <th className="p-4 font-semibold text-slate-300">Name</th>
              <th className="p-4 font-semibold text-slate-300">RA / Dec</th>
              <th className="p-4 font-semibold text-slate-300">Mag</th>
              <th className="p-4 font-semibold text-slate-300">Color</th>
              <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stars.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-slate-500">No custom stars created yet.</td></tr>}
            {stars.map(star => (
              <tr key={star.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="p-4 text-slate-300">CUST-{star.id}</td>
                <td className="p-4 font-medium text-white">{star.name}</td>
                <td className="p-4 text-slate-400 text-sm">{star.ra}h / {star.dec_coord}°</td>
                <td className="p-4 text-slate-300">{star.magnitude}</td>
                <td className="p-4 text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: star.color }}></div>
                    {star.color}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(star.id)} className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded bg-red-400/10 hover:bg-red-400/20 transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Inquiries({ token }) {
  const [inquiries, setInquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const fetchInquiries = async () => {
    const res = await fetch('/api/admin/inquiries', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setInquiries(await res.json());
  };

  useEffect(() => { fetchInquiries(); }, []);

  const handleReply = async (id) => {
    const res = await fetch(`/api/admin/inquiries/${id}/reply`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) fetchInquiries();
  };

  const filteredInquiries = inquiries.filter(inq => 
    inq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inq.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Contact Inquiries</h2>
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 w-64"
        />
      </div>
      
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700">
              <th className="p-4 font-semibold text-slate-300">Date</th>
              <th className="p-4 font-semibold text-slate-300">Name</th>
              <th className="p-4 font-semibold text-slate-300">Email</th>
              <th className="p-4 font-semibold text-slate-300">Subject</th>
              <th className="p-4 font-semibold text-slate-300">Status</th>
              <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInquiries.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-slate-500">No inquiries found.</td></tr>}
            {filteredInquiries.map(inq => (
              <tr key={inq.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 cursor-pointer" onClick={() => setSelectedInquiry(inq)}>
                <td className="p-4 text-slate-400 text-sm">{new Date(inq.created_at).toLocaleDateString()}</td>
                <td className="p-4 font-medium text-white">{inq.name}</td>
                <td className="p-4 text-slate-400 text-sm">{inq.email}</td>
                <td className="p-4 text-slate-300 max-w-[200px] truncate">{inq.subject}</td>
                <td className="p-4 text-sm">
                  {inq.status === 'Replied' ? 
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Replied</span> : 
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending</span>}
                </td>
                <td className="p-4 text-right">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedInquiry(inq); }} className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded bg-blue-400/10 hover:bg-blue-400/20 transition">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900/50">
              <h3 className="text-xl font-bold text-yellow-400">Inquiry Details</h3>
              <button onClick={() => setSelectedInquiry(null)} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-slate-200 overflow-auto flex-1">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-700 pb-4">
                <div><strong className="text-slate-400 block text-sm">From</strong><div className="text-lg">{selectedInquiry.name}</div><div className="text-blue-400 text-sm">{selectedInquiry.email}</div></div>
                <div><strong className="text-slate-400 block text-sm">Mobile</strong><div>{selectedInquiry.mobile || 'N/A'}</div><div className="text-slate-400 text-sm mt-1">{new Date(selectedInquiry.created_at).toLocaleString()}</div></div>
              </div>
              <div><strong className="text-slate-400 block text-sm mb-1">Subject</strong><div className="font-medium text-lg">{selectedInquiry.subject}</div></div>
              <div><strong className="text-slate-400 block text-sm mb-2">Message</strong>
                <div className="bg-slate-900/50 p-4 rounded border border-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedInquiry.message}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-between items-center">
              <div>
                {selectedInquiry.status === 'Pending' && (
                  <button onClick={() => { handleReply(selectedInquiry.id); setSelectedInquiry({...selectedInquiry, status: 'Replied'}); }} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-white transition font-medium">Mark as Replied</button>
                )}
                {selectedInquiry.status === 'Replied' && <span className="text-green-400 flex items-center gap-2">✓ Marked as Replied</span>}
              </div>
              <button onClick={() => setSelectedInquiry(null)} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-white transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function PublishedMoments({ token }) {
  const [moments, setMoments] = useState([]);
  const [stars, setStars] = useState([]);
  const [form, setForm] = useState({ star_id: '', description: '', image: null });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchData = async () => {
    const resM = await fetch('/api/admin/moments', { headers: { 'Authorization': `Bearer ${token}` } });
    if (resM.ok) setMoments(await resM.json());

    const resS = await fetch('/api/admin/registrations', { headers: { 'Authorization': `Bearer ${token}` } });
    if (resS.ok) setStars(await resS.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (m) => {
    setEditId(m.id);
    setForm({ star_id: m.star_id, description: m.description, image: null });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editId && !form.image) {
      alert('Please select an image.');
      return;
    }
    if (!form.star_id) {
      alert('Please select a star.');
      return;
    }
    const formData = new FormData();
    formData.append('star_id', form.star_id);
    formData.append('description', form.description);
    if (form.image) formData.append('image', form.image);

    const url = editId ? `/api/admin/moments/${editId}` : '/api/admin/moments';
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      setForm({ star_id: '', description: '', image: null });
      document.getElementById('imageUpload').value = '';
      setShowForm(false);
      setEditId(null);
      fetchData();
    } else {
      alert('Failed to save moment');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this published moment?')) return;
    const res = await fetch(`/api/admin/moments/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) fetchData();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Published Moments</h2>
        <button onClick={() => {
          setShowForm(!showForm);
          if (showForm) {
            setEditId(null);
            setForm({ star_id: '', description: '', image: null });
          }
        }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition">
          {showForm ? 'Cancel' : '+ Create Moment'}
        </button>
      </div>
      
      {showForm && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-slate-200">{editId ? 'Edit Moment' : 'Publish New Moment'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Select Registered Star</label>
            <select required value={form.star_id} onChange={e=>setForm({...form, star_id: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100">
              <option value="">-- Choose a star --</option>
              {stars.map(s => <option key={s.star_id} value={s.star_id}>{s.star_name} (Owner: {s.owner_name})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description (Story / Message)</label>
            <textarea required rows="3" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100" placeholder="A beautiful story..."></textarea>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Upload Photo {editId && '(Optional - Leave blank to keep current)'}</label>
            <input id="imageUpload" type="file" accept="image/*" required={!editId} onChange={e=>setForm({...form, image: e.target.files[0]})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition">
            {editId ? 'Save Changes' : 'Publish Moment'}
          </button>
        </form>
      </div>
      )}

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700">
              <th className="p-4 font-semibold text-slate-300">Image</th>
              <th className="p-4 font-semibold text-slate-300">Star Name</th>
              <th className="p-4 font-semibold text-slate-300">Description</th>
              <th className="p-4 font-semibold text-slate-300">Date</th>
              <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {moments.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-slate-500">No published moments yet.</td></tr>}
            {moments.map(m => (
              <tr key={m.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="p-4"><img src={m.image_url} alt="Moment" className="h-16 w-16 object-cover rounded shadow" /></td>
                <td className="p-4 font-medium text-yellow-400">{m.star_name}<br/><span className="text-sm text-slate-400 font-normal">by {m.owner_name}</span></td>
                <td className="p-4 text-slate-300"><div className="max-w-md line-clamp-3">{m.description}</div></td>
                <td className="p-4 text-slate-400 text-sm">{new Date(m.created_at).toLocaleDateString()}</td>
                <td className="p-4 text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(m)} className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded bg-blue-400/10 hover:bg-blue-400/20 transition mr-2">Edit</button>
                  <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded bg-red-400/10 hover:bg-red-400/20 transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('admin-root'));
root.render(<App />);
