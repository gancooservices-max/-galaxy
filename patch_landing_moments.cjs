const fs = require('fs');

let code = fs.readFileSync('src/landing/LandingPage.jsx', 'utf8');

// 1. Add moments state
if (!code.includes('const [moments, setMoments] = useState([]);')) {
  code = code.replace(
    'const LandingPage = ({ onExplore }) => {\n  const { scrollYProgress } = useScroll();',
    'const LandingPage = ({ onExplore }) => {\n  const { scrollYProgress } = useScroll();\n  const [moments, setMoments] = useState([]);\n\n  useEffect(() => {\n    fetch(\'/api/moments\').then(r => r.json()).then(setMoments).catch(console.error);\n  }, []);\n'
  );
}

// 2. Add the Moments gallery section
if (!code.includes('Celestial Gallery')) {
  const gallerySection = `
      {moments.length > 0 && (
        <section className="py-32 px-6 relative" id="gallery">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Celestial Gallery</h2>
              <p className="text-xl text-gray-400 font-light">Real moments shared by our star owners.</p>
            </FadeIn>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {moments.map((moment, i) => (
                <FadeIn key={moment.id} delay={i * 0.1} className={\`p-6 rounded-3xl flex flex-col \${glassBase} \${glassHover} transition-transform hover:-translate-y-2\`}>
                  <div className="w-full h-64 mb-6 rounded-2xl overflow-hidden shadow-lg border border-white/10 relative group">
                    <img src={moment.image_url} alt={moment.star_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-5 h-5 text-premium-gold fill-premium-gold" />
                      <h3 className="text-2xl font-bold text-white">{moment.star_name}</h3>
                    </div>
                    <p className="text-gray-300 italic mb-4">"{moment.description}"</p>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <span className="text-sm text-aurora-cyan font-medium">Dedicated by {moment.owner_name}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}
`;
  code = code.replace(
    '<section className="py-32 px-6 relative border-y border-white/5" id="contact" style={{ background: "rgba(255,255,255,0.01)" }}>',
    gallerySection + '\n      <section className="py-32 px-6 relative border-y border-white/5" id="contact" style={{ background: "rgba(255,255,255,0.01)" }}>'
  );
}

fs.writeFileSync('src/landing/LandingPage.jsx', code);
console.log("Patched LandingPage.jsx");
