import React, { useState } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { applyThemeToDocument, useOptionalTheme } from '../themes/ThemeProvider';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const themeContext = useOptionalTheme();
  const [standaloneTheme, setStandaloneTheme] = useState<'normal' | 'cyber'>(() => document.documentElement.classList.contains('hud') ? 'cyber' : 'normal');
  const themeId = themeContext?.themeId ?? standaloneTheme;
  const isHud = themeId === 'cyber';
  const [isGlitching, setIsGlitching] = useState(false);

  const toggle = () => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 550);

    if (themeContext) themeContext.toggleTheme();
    else {
      const next = isHud ? 'normal' : 'cyber';
      applyThemeToDocument(next);
      setStandaloneTheme(next);
    }
  };

  const labelText = isHud ? 'CYBER ✓' : 'CYBER';

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={isHud ? 'Cambiar a tema por defecto' : 'Cambiar a tema cyberpunk'}
        title={isHud ? 'Tema cyberpunk activo — volver al tema por defecto' : 'Activar tema cyberpunk'}
        className={`cyber-theme-toggle cyber-glitch-btn cyber-glitch-compact ${isHud ? 'is-hud' : ''} ${isGlitching ? 'is-glitching' : ''}`}
      >
        <span className="cyber-glitch-scanlines" />
        <span className="cyber-glitch-content flex items-center justify-center">
          {isHud ? <Sparkles size={14} className="cyber-icon" /> : <Zap size={14} className="cyber-icon" />}
        </span>
        <span className="cyber-glitch-ghost cyan" aria-hidden="true">
          {isHud ? <Sparkles size={14} /> : <Zap size={14} />}
        </span>
        <span className="cyber-glitch-ghost pink" aria-hidden="true">
          {isHud ? <Sparkles size={14} /> : <Zap size={14} />}
        </span>
        <span className="cyber-corner-tl" />
        <span className="cyber-corner-br" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isHud ? 'Cambiar a tema por defecto' : 'Cambiar a tema cyberpunk'}
      title={isHud ? 'Tema cyberpunk activo — volver al tema por defecto' : 'Activar tema cyberpunk'}
      className={`cyber-theme-toggle cyber-glitch-btn ${isHud ? 'is-hud' : ''} ${isGlitching ? 'is-glitching' : ''}`}
    >
      {/* Scanline & grid background */}
      <span className="cyber-glitch-scanlines" />

      {/* HUD status badge */}
      <span className="cyber-hud-badge">
        <span className="cyber-pulse-dot" />
        <span className="cyber-hud-text">{isHud ? 'ON' : 'OFF'}</span>
      </span>

      {/* Main Content */}
      <span className="cyber-glitch-content">
        {isHud ? <Sparkles size={13} className="cyber-icon" /> : <Zap size={13} className="cyber-icon" />}
        <span className="cyber-text-main">{labelText}</span>
      </span>

      {/* RGB Chromatic Ghost Layers */}
      <span className="cyber-glitch-ghost cyan" aria-hidden="true">
        {isHud ? <Sparkles size={13} /> : <Zap size={13} />}
        <span>{labelText}</span>
      </span>
      <span className="cyber-glitch-ghost pink" aria-hidden="true">
        {isHud ? <Sparkles size={13} /> : <Zap size={13} />}
        <span>{labelText}</span>
      </span>

      {/* Chamfer corner brackets */}
      <span className="cyber-corner-tl" />
      <span className="cyber-corner-br" />
    </button>
  );
};
