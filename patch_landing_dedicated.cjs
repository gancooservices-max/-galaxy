const fs = require('fs');

let code = fs.readFileSync('src/landing/LandingPage.jsx', 'utf8');

// 1. Update formData state to include dedicatedBy
if (!code.includes('dedicatedBy: ""')) {
  code = code.replace(
    'const [formData, setFormData] = useState({ name: "", email: "", message: "" });',
    'const [formData, setFormData] = useState({ name: "", email: "", message: "", dedicatedBy: "" });'
  );
}

// 2. Add input field for dedicatedBy
if (!code.includes('Dedicated By')) {
  const newField = `
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-300 ml-1">Your Name (Dedicated By) <span className="text-nebula-pink">*</span></label>
        <input required type="text" placeholder="e.g. John Doe" value={formData.dedicatedBy} onChange={e=>setFormData({...formData, dedicatedBy:e.target.value})} className={inputClasses} />
      </div>
  `;
  code = code.replace(
    '<label className="text-sm font-semibold text-gray-300 ml-1">Recipient Name',
    newField + '\n      <div className="space-y-2">\n        <label className="text-sm font-semibold text-gray-300 ml-1">Recipient Name'
  );
}

// 3. Include dedicatedBy in the API request
if (!code.includes('dedicatedBy: formData.dedicatedBy')) {
  code = code.replace(
    'message: formData.message,',
    'message: formData.message,\n        dedicatedBy: formData.dedicatedBy,'
  );
}

fs.writeFileSync('src/landing/LandingPage.jsx', code);
console.log('Successfully patched LandingPage.jsx for Dedicated By field');
