// Reusable components: FadeIn, Magnet, ContactButton, LiveProjectButton, AnimatedText
const { motion, useScroll, useTransform } = window.framerMotion || window.FramerMotion || window["framer-motion"] || window.Motion || {};
// framer-motion UMD exposes itself as `Motion` on window
const FM = window.Motion || window.framerMotion;

const _motionCache = {};
const _getMotionTag = (as) => {
  if (!_motionCache[as]) {
    _motionCache[as] = FM.motion[as] || FM.motion.create(as);
  }
  return _motionCache[as];
};

// Custom hook: fires true once element intersects viewport (or is already in it on mount)
const useFadeInTrigger = () => {
  const ref = React.useRef(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Immediate check
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight + 50;
    if (rect.top < vh && rect.bottom > -50) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      });
    }, { rootMargin: '50px', threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
};

const FadeIn = ({ as = 'div', children, delay = 0, duration = 0.7, x = 0, y = 30, className, style, ...rest }) => {
  const [ref, inView] = useFadeInTrigger();
  const MotionTag = _getMotionTag(as);
  const safeChildren = React.Children.map(children, (child, i) =>
    React.isValidElement(child) && child.key == null ? React.cloneElement(child, { key: `fi-${i}` }) : child
  );
  return (
    <MotionTag
      ref={ref}
      initial={{ opacity: 0, x, y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x, y }}
      transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      style={style}
      {...rest}
    >
      {safeChildren}
    </MotionTag>
  );
};

// Magnet: mouse-following magnetic translate
const Magnet = ({ children, padding = 100, strength = 2, activeTransition = "transform 0.3s ease-out", inactiveTransition = "transform 0.6s ease-in-out" }) => {
  const ref = React.useRef(null);
  const [trans, setTrans] = React.useState(inactiveTransition);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const within =
        e.clientX > rect.left - padding &&
        e.clientX < rect.right + padding &&
        e.clientY > rect.top - padding &&
        e.clientY < rect.bottom + padding;
      if (within) {
        setTrans(activeTransition);
        el.style.transform = `translate3d(${dx / strength}px, ${dy / strength}px, 0)`;
      } else {
        setTrans(inactiveTransition);
        el.style.transform = `translate3d(0,0,0)`;
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [padding, strength, activeTransition, inactiveTransition]);

  return (
    <div ref={ref} style={{ transition: trans, willChange: 'transform' }}>
      {children}
    </div>
  );
};

const ContactButton = ({ label = "Contact Me", className = "" }) => (
  <button
    className={`rounded-full font-medium uppercase tracking-widest text-white px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm md:text-base whitespace-nowrap ${className}`}
    style={{
      background: 'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
      boxShadow: '0px 4px 4px rgba(181, 1, 167, 0.25), 4px 4px 12px #7721B1 inset',
      outline: '2px solid #ffffff',
      outlineOffset: '-3px',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'Kanit, sans-serif',
    }}
  >
    {label}
  </button>
);

const LiveProjectButton = ({ label = "Live Project", className = "" }) => (
  <button
    className={`rounded-full border-2 font-medium uppercase tracking-widest px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base transition-colors duration-200 hover:bg-[#D7E2EA]/10 whitespace-nowrap ${className}`}
    style={{
      borderColor: '#D7E2EA',
      color: '#D7E2EA',
      background: 'transparent',
      cursor: 'pointer',
      fontFamily: 'Kanit, sans-serif',
    }}
  >
    {label}
  </button>
);
// AnimatedText: per-character scroll-driven opacity 0.2 -> 1
const AnimatedText = ({ text, className = "", style }) => {
  const ref = React.useRef(null);
  const { scrollYProgress } = FM.useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  });

  const totalChars = text.length;
  // Split into words (preserving spaces), so words don't break mid-line
  const tokens = React.useMemo(() => {
    const parts = text.split(/(\s+)/);
    let pos = 0;
    return parts.map((token) => {
      const start = pos;
      pos += token.length;
      return { token, start };
    });
  }, [text]);

  return (
    <p ref={ref} className={className} style={style}>
      {tokens.map(({ token, start: tokenStart }, ti) => {
        if (/^\s+$/.test(token)) return <span key={ti}>{token}</span>;
        return (
          <span key={ti} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {token.split('').map((ch, ci) => {
              const idx = tokenStart + ci;
              const s = idx / totalChars;
              const e = s + 1 / totalChars;
              return <CharSpan key={ci} ch={ch} start={s} end={e} progress={scrollYProgress} />;
            })}
          </span>
        );
      })}
    </p>
  );
};

const CharSpan = ({ ch, start, end, progress }) => {
  const opacity = FM.useTransform(progress, [start, end], [0.2, 1]);
  return (
    <FM.motion.span style={{ display: 'inline-block', opacity }}>{ch}</FM.motion.span>
  );
};

Object.assign(window, { FadeIn, Magnet, ContactButton, LiveProjectButton, AnimatedText, FM });
