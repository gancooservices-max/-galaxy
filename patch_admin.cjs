const fs = require('fs');

let code = fs.readFileSync('src/admin/index.jsx', 'utf8');

if (!code.includes('PublishedMoments')) {
  // 1. Add Tab Button
  code = code.replace(
    '✉️ Contact Inquiries\n          </button>',
    '✉️ Contact Inquiries\n          </button>\n          <button \n            onClick={() => setActiveTab(\'moments\')} \n            className={`w-full text-left px-4 py-2 rounded transition ${activeTab === \'moments\' ? \'bg-slate-700 text-white\' : \'text-slate-400 hover:bg-slate-700/50 hover:text-white\'}`}\n          >\n            📸 Published Moments\n          </button>'
  );

  // 2. Add Tab Content
  code = code.replace(
    "{activeTab === 'inquiries' && <Inquiries token={token} />}",
    "{activeTab === 'inquiries' && <Inquiries token={token} />}\n        {activeTab === 'moments' && <PublishedMoments token={token} />}"
  );

  // 3. Add Component Definition
  const componentCode = `
function PublishedMoments({ token }) {
  const [moments, setMoments] = useState([]);
  const [stars, setStars] = useState([]);
  const [form, setForm] = useState({ star_id: '', description: '', image: null });

  const fetchData = async () => {
    const resM = await fetch('/api/admin/moments', { headers: { 'Authorization': \`Bearer \${token}\` } });
    if (resM.ok) setMoments(await resM.json());

    const resS = await fetch('/api/admin/registrations', { headers: { 'Authorization': \`Bearer \${token}\` } });
    if (resS.ok) setStars(await resS.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image || !form.star_id) {
      alert('Please select a star and an image.');
      return;
    }
    const formData = new FormData();
    formData.append('star_id', form.star_id);
    formData.append('description', form.description);
    formData.append('image', form.image);

    const res = await fetch('/api/admin/moments', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${token}\` },
      body: formData
    });
    if (res.ok) {
      setForm({ star_id: '', description: '', image: null });
      document.getElementById('imageUpload').value = '';
      fetchData();
    } else {
      alert('Failed to publish moment');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this published moment?')) return;
    const res = await fetch(\`/api/admin/moments/\${id}\`, { method: 'DELETE', headers: { 'Authorization': \`Bearer \${token}\` } });
    if (res.ok) fetchData();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Published Moments</h2>
      
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-slate-200">Publish New Moment</h3>
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
            <label className="block text-sm text-slate-400 mb-1">Upload Photo</label>
            <input id="imageUpload" type="file" accept="image/*" required onChange={e=>setForm({...form, image: e.target.files[0]})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100" />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition">Publish Moment</button>
        </form>
      </div>

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
                <td className="p-4 text-slate-300 max-w-xs truncate">{m.description}</td>
                <td className="p-4 text-slate-400 text-sm">{new Date(m.created_at).toLocaleDateString()}</td>
                <td className="p-4 text-right">
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
`;

  code = code.replace("const root = createRoot(document.getElementById('admin-root'));", componentCode + "\nconst root = createRoot(document.getElementById('admin-root'));");
  fs.writeFileSync('src/admin/index.jsx', code);
  console.log("Patched admin index.jsx");
} else {
  console.log("Already patched");
}
