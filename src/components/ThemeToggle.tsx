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
      try { localStorage.setItem('theme', 'dark'); } catch {}
    }
    setIsHud(next);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={isHud ? 'Cambiar a tema por defecto' : 'Cambiar a tema HUD'}
        title={isHud ? 'Tema HUD activo — clic para volver a Default' : 'Tema Default — clic para probar HUD'}
        className="grid place-items-center"
        style={{
          width: 32, height: 32,
          borderRadius: 8,
          border: isHud ? '2px solid #ffe600' : '1.5px solid #374151',
          background: isHud ? '#ffe600' : '#1a1a1f',
          color: isHud ? '#000' : '#94a3b8',
          boxShadow: isHud ? '0 0 8px rgba(255,230,0,0.3)' : 'none',
        }}
      >
        {isHud ? <Sparkles size={14} /> : <Palette size={14} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isHud ? 'Cambiar a tema por defecto' : 'Cambiar a tema HUD cyber'}
      title={isHud ? 'HUD activo — clic para volver a Default' : 'Probar tema HUD (igual a la captura)'}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
      style={{
        borderRadius: 6,
        border: isHud ? '2px solid #ffe600' : '1.5px solid #374151',
        background: isHud ? '#ffe600' : '#1a1a1f',
        color: isHud ? '#000' : '#cbd5e1',
        boxShadow: isHud ? '0 0 12px rgba(255,230,0,0.35)' : '1px 1px 0 #000',
        fontFamily: 'Space Grotesk', letterSpacing: '0.04em',
      }}
    >
      <Palette size={12} />
      {isHud ? 'HUD ✓' : 'Probar HUD'}
    </button>
  );
};
