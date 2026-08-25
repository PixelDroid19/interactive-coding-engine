import React, { useEffect, useState } from 'react';
import { Palette, Sparkles } from 'lucide-react';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [isHud, setIsHud] = useState(false);

  useEffect(() => {
    const check = () => setIsHud(document.documentElement.classList.contains('hud'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const toggle = () => {
    const next = !isHud;
    if (next) {
      document.documentElement.classList.add('hud');
      try { localStorage.setItem('theme', 'hud'); } catch {}
    } else {
      document.documentElement.classList.remove('hud');
      try { localStorage.setItem('theme', 'default'); } catch {}
    }
    setIsHud(next);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={isHud ? 'Cambiar a tema por defecto' : 'Cambiar a tema cyberpunk'}
        title={isHud ? 'Tema cyberpunk activo — volver al tema por defecto' : 'Activar tema cyberpunk'}
        className="cyber-theme-toggle grid place-items-center"
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          border: isHud ? '1.5px solid #ffe600' : '1.5px solid #374151',
          background: isHud ? '#ffe600' : '#1a1a1f',
          color: isHud ? '#000000' : '#cbd5e1',
          boxShadow: isHud ? '0 0 10px rgba(255,230,0,0.4)' : 'none',
        }}
      >
        {isHud ? <Sparkles size={14} style={{ color: '#000000' }} /> : <Palette size={14} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isHud ? 'Cambiar a tema por defecto' : 'Cambiar a tema cyberpunk'}
      title={isHud ? 'Tema cyberpunk activo — volver al tema por defecto' : 'Activar tema cyberpunk'}
      className="cyber-theme-toggle flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider"
      style={{
        borderRadius: 6,
        border: isHud ? '1.5px solid #ffe600' : '1.5px solid #374151',
        background: isHud ? '#ffe600' : '#1a1a1f',
        color: isHud ? '#000000' : '#cbd5e1',
        boxShadow: isHud ? '0 0 12px rgba(255,230,0,0.45)' : '1px 1px 0 #000',
        fontFamily: isHud ? 'Chakra Petch, Space Grotesk, sans-serif' : 'Space Grotesk, sans-serif',
      }}
    >
      <Palette size={13} style={{ color: isHud ? '#000000' : 'inherit' }} />
      <span style={{ color: isHud ? '#000000' : 'inherit', fontWeight: 900 }}>{isHud ? 'CYBER ✓' : 'CYBER'}</span>
    </button>
  );
};
