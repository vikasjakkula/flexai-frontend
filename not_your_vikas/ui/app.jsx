// App root
const App = () => (
  <main style={{ background: '#0C0C0C', overflowX: 'clip' }}>
    <HeroSection />
    <MarqueeSection />
    <AboutSection />
    <ServicesSection />
    <ProjectsSection />
  </main>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
