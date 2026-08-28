import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Code2,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Maximize2,
  RotateCcw,
  Smartphone,
  Trash2,
} from 'lucide-react';
import type { CellsPreviewBuild } from '../../engine/cells/cellsPreviewCompiler';

export type ComponentDemo = NonNullable<CellsPreviewBuild['componentDemo']>;
export type WorkbenchTab = 'visual' | 'code' | 'docs';
export type ViewportPreset = '375' | '768' | '1024' | '1280' | 'fluid';

export interface ObservedEvent {
  id: string;
  seq: number;
  name: string;
  detail: unknown;
  bubbles?: boolean;
  composed?: boolean;
  timestamp: number;
  timeFormatted: string;
  isExpanded?: boolean;
}

export interface ConsoleLogEntry {
  id: string;
  level: 'log' | 'warn' | 'error' | 'info';
  args: string[];
  timestamp: number;
  timeFormatted: string;
}

export interface CellsPreviewWorkbenchProps {
  html: string;
  demo: ComponentDemo;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  title?: string;
  compact?: boolean;
  className?: string;
  onRequestExpand?: () => void;
  fillContainer?: boolean;
}

export const VIEWPORTS: Array<{ id: ViewportPreset; label: string; width?: number; height?: number }> = [
  { id: '375', label: 'Móvil', width: 375, height: 667 },
  { id: '768', label: 'Tablet', width: 768, height: 900 },
  { id: '1024', label: 'Escritorio', width: 1024, height: 720 },
  { id: '1280', label: 'Escritorio grande', width: 1280, height: 800 },
  { id: 'fluid', label: 'Fluido' },
];

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

export const CellsPreviewWorkbench: React.FC<CellsPreviewWorkbenchProps> = ({
  html,
  demo,
  iframeRef,
  title = 'Vista previa del componente Cells',
  compact = false,
  className = '',
  onRequestExpand,
  fillContainer = false,
}) => {
  const [tab, setTab] = useState<WorkbenchTab>('visual');
  const [caseId, setCaseId] = useState(demo.cases[0]?.id ?? 'basic');
  const [locale, setLocale] = useState<'es' | 'en'>(() => demo.locales.includes('es') ? 'es' : (demo.locales[0] ?? 'es'));
  const [viewport, setViewport] = useState<ViewportPreset>('375');
  const [customWidth, setCustomWidth] = useState('375');
  const [customHeight, setCustomHeight] = useState('667');
  const [appliedSize, setAppliedSize] = useState<{ width?: number; height?: number }>({ width: 375, height: 667 });
  const [interfaceHidden, setInterfaceHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [events, setEvents] = useState<ObservedEvent[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([]);
  const [consoleTab, setConsoleTab] = useState<'console' | 'errors'>('console');
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [activeCodeSubTab, setActiveCodeSubTab] = useState<'js' | 'html' | 'css'>('js');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const eventCounterRef = useRef(0);
  const initialPropsRef = useRef<Record<string, any>>({});

  const selectedCase = useMemo(
    () => demo.cases.find((candidate) => candidate.id === caseId) ?? demo.cases[0],
    [caseId, demo.cases],
  );

  // Extract all real properties of the component dynamically from documentation + active case
  const availableProps = useMemo(() => {
    const map: Record<string, { type: 'string' | 'boolean' | 'number'; label: string; defaultValue: any }> = {};

    if (demo.documentation?.properties) {
      for (const prop of demo.documentation.properties) {
        map[prop.name] = {
          type: prop.type.includes('boolean') ? 'boolean' : prop.type.includes('number') ? 'number' : 'string',
          label: prop.name,
          defaultValue: prop.default ? prop.default.replace(/^['"]|['"]$/g, '') : '',
        };
      }
    }

    if (selectedCase?.properties) {
      for (const [key, value] of Object.entries(selectedCase.properties)) {
        if (!map[key]) {
          map[key] = {
            type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
            label: key,
            defaultValue: value,
          };
        }
      }
    }

    return map;
  }, [demo.documentation?.properties, selectedCase]);

  // Track which props the user has explicitly changed via the PROPS panel
  const userModifiedPropsRef = useRef<Set<string>>(new Set());

  // Live dynamic props for the selected case
  const [liveProps, setLiveProps] = useState<Record<string, any>>(() => selectedCase?.properties ?? {});

  // When switching case, update live props to the selected case properties
  useEffect(() => {
    if (selectedCase?.properties) {
      setLiveProps(selectedCase.properties);
      userModifiedPropsRef.current.clear();
    }
  }, [caseId, selectedCase]);

  const activePreset = VIEWPORTS.find((p) => p.id === viewport);

  const postState = (propsToSend?: Record<string, any>) => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage({ source: 'open-cells-shell', type: 'locale:set', locale }, '*');

    // Only send properties that the user has explicitly modified
    const modifiedProps: Record<string, any> = {};
    if (propsToSend) {
      Object.assign(modifiedProps, propsToSend);
    } else {
      for (const key of userModifiedPropsRef.current) {
        if (liveProps[key] !== undefined) {
          modifiedProps[key] = liveProps[key];
        }
      }
      // Also include case properties if case has properties
      if (selectedCase?.properties && Object.keys(selectedCase.properties).length > 0) {
        Object.assign(modifiedProps, selectedCase.properties);
      }
    }

    frame.postMessage({
      source: 'open-cells-shell',
      type: 'demo:set-case',
      caseId: selectedCase?.id ?? 'default',
      markup: selectedCase?.markup,
      properties: modifiedProps,
    }, '*');
  };

  useEffect(() => {
    postState();
  }, [caseId, html, locale]);

  // When liveProps change due to user interaction, send only user-modified props
  useEffect(() => {
    if (userModifiedPropsRef.current.size > 0) {
      postState();
    }
  }, [liveProps]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || event.data?.source !== 'open-cells-preview') return;
      if (event.data.type === 'ready') {
        // Populate PROPS panel with real values from the running component
        if (event.data.initialProps && typeof event.data.initialProps === 'object') {
          initialPropsRef.current = event.data.initialProps;
          setLiveProps(event.data.initialProps);
          userModifiedPropsRef.current.clear();
        }
        // Send locale only, don't override component's own property defaults
        const frame = iframeRef.current?.contentWindow;
        if (frame) {
          frame.postMessage({ source: 'open-cells-shell', type: 'locale:set', locale }, '*');
        }
      } else if (event.data.type === 'component:event') {
        eventCounterRef.current += 1;
        const now = Date.now();
        const newObserved: ObservedEvent = {
          id: `evt-${now}-${Math.random().toString(36).substring(2, 7)}`,
          seq: eventCounterRef.current,
          name: String(event.data.name),
          detail: event.data.detail,
          bubbles: Boolean(event.data.bubbles),
          composed: Boolean(event.data.composed),
          timestamp: typeof event.data.timestamp === 'number' ? event.data.timestamp : now,
          timeFormatted: formatTime(now),
          isExpanded: true,
        };
        setEvents((current) => [newObserved, ...current.slice(0, 29)]);

        setConsoleLogs((prev) => [
          ...prev.slice(-49),
          {
            id: `log-evt-${now}`,
            level: 'log',
            args: [`<${demo.tagName}> emitió: ${event.data.name}`],
            timestamp: now,
            timeFormatted: formatTime(now),
          },
        ]);
      } else if (event.data.type === 'console') {
        const now = Date.now();
        const newLog: ConsoleLogEntry = {
          id: `log-${now}-${Math.random().toString(36).substring(2, 6)}`,
          level: event.data.level || 'log',
          args: Array.isArray(event.data.args) ? event.data.args : [String(event.data.args)],
          timestamp: typeof event.data.timestamp === 'number' ? event.data.timestamp : now,
          timeFormatted: formatTime(now),
        };
        setConsoleLogs((current) => [...current.slice(-49), newLog]);
      } else if (event.data.type === 'error') {
        const now = Date.now();
        const newError: ConsoleLogEntry = {
          id: `err-${now}-${Math.random().toString(36).substring(2, 6)}`,
          level: 'error',
          args: [String(event.data.message || 'Error en el runtime')],
          timestamp: now,
          timeFormatted: formatTime(now),
        };
        setConsoleLogs((current) => [...current.slice(-49), newError]);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [demo.tagName, html, iframeRef, locale]);

  const frameWidth = appliedSize.width
    ?? (viewport === 'fluid' ? undefined : (activePreset?.width ?? Number(viewport)));

  const frameHeight = appliedSize.height
    ?? (viewport === 'fluid' ? undefined : activePreset?.height);

  const chooseViewport = (next: ViewportPreset) => {
    setViewport(next);
    const targetPreset = VIEWPORTS.find((p) => p.id === next);
    if (targetPreset?.width) {
      setCustomWidth(String(targetPreset.width));
      setCustomHeight(String(targetPreset.height ?? 667));
      setAppliedSize({ width: targetPreset.width, height: targetPreset.height ?? 667 });
    } else {
      setAppliedSize({});
      setCustomWidth('auto');
      setCustomHeight('auto');
    }
  };

  const handlePropChange = (key: string, value: any) => {
    userModifiedPropsRef.current.add(key);
    setLiveProps((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetProps = () => {
    userModifiedPropsRef.current.clear();
    const caseProps = selectedCase?.properties ?? {};
    const resetProps = Object.fromEntries(
      Object.entries(availableProps).map(([key, meta]) => [
        key,
        caseProps[key] !== undefined
          ? caseProps[key]
          : (initialPropsRef.current[key] !== undefined ? initialPropsRef.current[key] : meta.defaultValue),
      ]),
    );

    // Restore the values reported by the running component through `ready`;
    // case-specific values still take precedence over the component defaults.
    setLiveProps(resetProps);
    postState(resetProps);
  };

  const handleClearEvents = () => {
    setEvents([]);
    eventCounterRef.current = 0;
  };

  const toggleEventExpanded = (id: string) => {
    setEvents((current) =>
      current.map((e) => (e.id === id ? { ...e, isExpanded: !e.isExpanded } : e)),
    );
  };

  const handleCopyEventJson = (id: string, detail: unknown) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(detail, null, 2));
      setCopiedEventId(id);
      setTimeout(() => setCopiedEventId(null), 1800);
    }
  };

  const handleCopyCode = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const docs = demo.documentation;

  const errorLogs = consoleLogs.filter((l) => l.level === 'error');
  const propKeys = Object.keys(availableProps);

  return (
    <section
      className={`cells-studio ${compact ? 'is-compact' : ''} ${interfaceHidden ? 'is-interface-hidden' : ''} ${isFullscreen ? 'is-fullscreen' : ''} ${className}`}
      data-testid="cells-preview-workbench"
      style={fillContainer ? { position: 'absolute', inset: 0, width: 'auto', height: 'auto' } : undefined}
    >
      {/* 1. TOP COMPONENT HEADER BAR */}
      {!interfaceHidden && (
        <header className="cells-studio__header" role="banner">
          {/* Left: Component Name + Version + Case Selector */}
          <div className="cells-studio__header-left">
            <h2 className="cells-studio__title">{demo.tagName}</h2>
            {demo.packageVersion && <span className="cells-studio__version-tag">v{demo.packageVersion}</span>}

            {demo.cases.length > 1 && (
              <>
                <div className="cells-studio__divider" aria-hidden="true" />
                <label className="cells-studio__case-picker">
                  <span className="cells-studio__case-label">Demo</span>
                  <div className="cells-studio__select-wrapper">
                    <select
                      aria-label="Caso de demostración"
                      value={caseId}
                      onChange={(e) => setCaseId(e.target.value)}
                    >
                      {demo.cases.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="cells-studio__select-icon" />
                  </div>
                </label>
              </>
            )}
          </div>

          {/* Center: View Tabs [ Visual | Código | Documentación ] */}
          <div className="cells-studio__tabs" role="tablist" aria-label="Vista de la demostración">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'visual'}
              className={tab === 'visual' ? 'is-active' : ''}
              onClick={() => setTab('visual')}
            >
              Visual
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'code'}
              className={tab === 'code' ? 'is-active' : ''}
              onClick={() => setTab('code')}
            >
              Código
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'docs'}
              className={tab === 'docs' ? 'is-active' : ''}
              onClick={() => setTab('docs')}
            >
              Documentación
            </button>
          </div>

          {/* Right: Language Dropdown + Menu */}
          <div className="cells-studio__header-right">
            {demo.locales.length > 1 && (
              <div className="cells-studio__locale-wrapper" role="group" aria-label="Idioma de la demostración">
                <Globe size={14} className="cells-studio__globe-icon" />
                {demo.locales.map((language) => (
                  <button
                    key={language}
                    type="button"
                    aria-pressed={locale === language}
                    className={`cells-studio__locale-btn ${locale === language ? 'is-active' : ''}`}
                    onClick={() => setLocale(language)}
                  >
                    {language === 'es' ? 'Español' : 'Inglés'}
                  </button>
                ))}
              </div>
            )}

            {compact ? (
              <button
                type="button"
                className="cells-studio__expand-tools"
                onClick={onRequestExpand}
                aria-label="Abrir herramientas de desarrollo"
              >
                <Maximize2 size={14} />
                <span>Herramientas</span>
              </button>
            ) : (
              <button
                type="button"
                className="cells-studio__icon-btn"
                onClick={() => setInterfaceHidden(true)}
                aria-label="Mostrar solo el componente"
                title="Mostrar solo el componente"
              >
                <EyeOff size={15} />
              </button>
            )}
          </div>
        </header>
      )}

      {/* 2. MAIN 3-PANEL WORK AREA */}
      <div className="cells-studio__body">
        {tab === 'visual' && (
          <div className="cells-studio__visual-layout">
            {/* COLUMN 1: DYNAMIC PROPS PANEL (Connected to actual component properties) */}
            {!interfaceHidden && !compact && (
              <aside className="cells-studio__props-panel" aria-label="Panel de propiedades">
                <div className="cells-studio__props-header">
                  <span className="cells-studio__panel-title">PROPS</span>
                  <button
                    type="button"
                    className="cells-studio__reset-btn"
                    onClick={handleResetProps}
                    title="Restablecer propiedades por defecto"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="cells-studio__props-list">
                  {propKeys.length === 0 ? (
                    <div className="cells-studio__empty-props">
                      <span>Sin propiedades configurables</span>
                    </div>
                  ) : (
                    propKeys.map((key) => {
                      const meta = availableProps[key];
                      const currentValue = liveProps[key] !== undefined ? liveProps[key] : (selectedCase?.properties?.[key] ?? meta.defaultValue);

                      if (meta.type === 'boolean') {
                        const isChecked = Boolean(currentValue === true || currentValue === 'true');
                        return (
                          <div key={key} className="cells-studio__prop-toggle-item">
                            <span className="cells-studio__prop-label">{key}</span>
                            <button
                              type="button"
                              role="switch"
                              aria-label={key}
                              aria-checked={isChecked}
                              className={`cells-studio__toggle-switch ${isChecked ? 'is-checked' : ''}`}
                              onClick={() => handlePropChange(key, !isChecked)}
                            >
                              <span className="cells-studio__toggle-thumb" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div key={key} className="cells-studio__prop-item">
                          <label className="cells-studio__prop-label" htmlFor={`prop-${key}`}>
                            {key}
                          </label>
                          <input
                            id={`prop-${key}`}
                            aria-label={key}
                            type={meta.type === 'number' ? 'number' : 'text'}
                            className="cells-studio__prop-input"
                            value={currentValue ?? ''}
                            onChange={(e) =>
                              handlePropChange(
                                key,
                                meta.type === 'number' ? Number(e.target.value) : e.target.value,
                              )
                            }
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>
            )}

            {/* COLUMN 2: CENTER CANVAS & VIEWPORT TOOLBAR */}
            <main className="cells-studio__center-area">
              {/* Sleek Viewport Toolbar */}
              {!interfaceHidden && !compact && (
                <div className="cells-studio__viewport-toolbar" role="toolbar" aria-label="Controles de viewport">
                  {/* Preset Dropdown */}
                  <div className="cells-studio__toolbar-group">
                    <div className="cells-studio__select-wrapper is-toolbar">
                      <Smartphone size={14} className="cells-studio__device-icon" />
                      <select
                        value={viewport}
                        onChange={(e) => chooseViewport(e.target.value as ViewportPreset)}
                        aria-label="Preset de dispositivo"
                      >
                        {VIEWPORTS.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="cells-studio__select-icon" />
                    </div>

                    {/* Dimensions Pill */}
                    <div className="cells-studio__dim-pill">
                      <span>{appliedSize.width ?? 375} × {appliedSize.height ?? 667}</span>
                    </div>

                    <button
                      type="button"
                      className="cells-studio__quick-device"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      title={isFullscreen ? 'Restaurar' : 'Pantalla completa'}
                      aria-label={isFullscreen ? 'Restaurar' : 'Pantalla completa'}
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>

                  {/* Custom Dimensions Form */}
                  <div className="cells-studio__custom-dim-group">
                    <label className="cells-studio__dim-field">
                      <span>Ancho</span>
                      <input
                        aria-label="Ancho personalizado"
                        inputMode="numeric"
                        value={customWidth}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomWidth(value);
                          const width = Number(value);
                          setAppliedSize((current) => ({ ...current, ...(width > 0 ? { width } : {}) }));
                        }}
                      />
                      <span className="cells-studio__unit">px</span>
                    </label>

                    <label className="cells-studio__dim-field">
                      <span>Alto</span>
                      <input
                        aria-label="Alto personalizado"
                        inputMode="numeric"
                        value={customHeight}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomHeight(value);
                          const height = Number(value);
                          setAppliedSize((current) => ({ ...current, ...(height > 0 ? { height } : {}) }));
                        }}
                      />
                      <span className="cells-studio__unit">px</span>
                    </label>

                  </div>
                </div>
              )}

              {/* Dotted Grid Canvas Surface */}
              <div className="cells-studio__canvas">
                <div
                  className="cells-studio__device-card"
                  style={{
                    width: frameWidth ? `${frameWidth}px` : (viewport === 'fluid' ? '100%' : 'min(100%, 50rem)'),
                    height: frameHeight ? `${frameHeight}px` : undefined,
                    maxWidth: '100%',
                  }}
                >
                  <iframe
                    key={html}
                    ref={iframeRef}
                    title={title}
                    sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                    srcDoc={html}
                    onLoad={() => postState()}
                    className="cells-studio__iframe"
                  />
                </div>
              </div>
            </main>

            {/* COLUMN 3: INSPECTOR PANEL (Eventos) */}
            {!interfaceHidden && !compact && (
              <aside className="cells-studio__inspector-panel" aria-label="Inspector de eventos">
                <div className="cells-studio__inspector-header">
                  <div className="cells-studio__inspector-tabs">
                    <span className="cells-studio__inspector-title">INSPECTOR</span>
                    <button type="button" className="cells-studio__inspector-tab is-active">
                      Eventos
                    </button>
                  </div>
                  <ChevronDown size={14} className="text-zinc-500" />
                </div>

                <div className="cells-studio__inspector-actions">
                  <span className="cells-studio__inspector-subtitle">
                    Eventos emitidos por el componente
                  </span>
                  {events.length > 0 && (
                    <button
                      type="button"
                      className="cells-studio__clear-btn"
                      onClick={handleClearEvents}
                      title="Limpiar eventos"
                      aria-label="Limpiar eventos"
                    >
                      <Trash2 size={12} />
                      <span>Limpiar</span>
                    </button>
                  )}
                </div>

                {/* Event Accordion Stream */}
                <div className="cells-studio__event-stream">
                  {events.length === 0 ? (
                    <div className="cells-studio__empty-events">
                      <code>Sin eventos todavía</code>
                      <p>Interactúa con el componente para ver sus eventos aquí.</p>
                    </div>
                  ) : (
                    events.map((evt) => (
                      <div key={evt.id} className="cells-studio__event-item">
                        <div
                          className="cells-studio__event-row"
                          onClick={() => toggleEventExpanded(evt.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <span className="cells-studio__event-seq">
                            {String(evt.seq).padStart(2, '0')}
                          </span>
                          <span className="cells-studio__event-dot" />
                          <code className="cells-studio__event-name">{evt.name}</code>
                          <span className="cells-studio__event-time">{evt.timeFormatted}</span>
                          {evt.isExpanded ? <ChevronUp size={13} /> : <ChevronRight size={13} />}
                        </div>

                        {evt.isExpanded && (
                          <div className="cells-studio__event-payload-box">
                            <button
                              type="button"
                              className="cells-studio__payload-copy"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyEventJson(evt.id, evt.detail);
                              }}
                              title="Copiar JSON"
                            >
                              {copiedEventId === evt.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                            </button>
                            <pre className="cells-studio__event-json">
                              <code>{JSON.stringify(evt.detail ?? {}, null, 2)}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </aside>
            )}
          </div>
        )}

        {/* TAB: CÓDIGO */}
        {tab === 'code' && (
          <article className="cells-studio__code-panel" aria-label="Código del componente">
            <header className="cells-studio__code-header">
              <div className="cells-studio__code-subtabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCodeSubTab === 'js'}
                  className={activeCodeSubTab === 'js' ? 'is-active' : ''}
                  onClick={() => setActiveCodeSubTab('js')}
                >
                  JavaScript
                </button>
                {demo.htmlSource && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeCodeSubTab === 'html'}
                    className={activeCodeSubTab === 'html' ? 'is-active' : ''}
                    onClick={() => setActiveCodeSubTab('html')}
                  >
                    HTML
                  </button>
                )}
                {demo.cssSource && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeCodeSubTab === 'css'}
                    className={activeCodeSubTab === 'css' ? 'is-active' : ''}
                    onClick={() => setActiveCodeSubTab('css')}
                  >
                    CSS / SCSS
                  </button>
                )}
              </div>

              <button
                type="button"
                className="cells-studio__code-copy-btn"
                onClick={() =>
                  handleCopyCode(
                    activeCodeSubTab === 'js'
                      ? demo.source
                      : activeCodeSubTab === 'html'
                      ? (demo.htmlSource || '')
                      : (demo.cssSource || ''),
                  )
                }
              >
                {copiedCode ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                <span>{copiedCode ? 'Copiado' : 'Copiar código'}</span>
              </button>
            </header>

            <div className="cells-studio__code-content">
              <pre>
                <code>
                  {activeCodeSubTab === 'js'
                    ? demo.source
                    : activeCodeSubTab === 'html'
                    ? (demo.htmlSource || '<!doctype html>\n<!-- Sin HTML adicional -->')
                    : (demo.cssSource || '/* Estilos en línea */')}
                </code>
              </pre>
            </div>
          </article>
        )}

        {/* TAB: DOCUMENTACIÓN */}
        {tab === 'docs' && (
          <article className="cells-studio__docs-panel" aria-label="Documentación del componente">
            <div className="cells-studio__docs-hero">
              <h3>&lt;{demo.tagName}&gt;</h3>
              <p>{docs?.description ?? 'Este proyecto todavía no documenta su API pública.'}</p>
            </div>

            {/* Properties Table */}
            {docs?.properties && docs.properties.length > 0 && (
              <section className="cells-studio__docs-section">
                <h4>Propiedades y Atributos</h4>
                <div className="cells-studio__table-wrapper">
                  <table className="cells-studio__table">
                    <thead>
                      <tr>
                        <th>Propiedad</th>
                        <th>Atributo</th>
                        <th>Tipo</th>
                        <th>Por defecto</th>
                        <th>Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.properties.map((p) => (
                        <tr key={p.name}>
                          <td><code className="text-yellow-300">{p.name}</code></td>
                          <td><code>{p.attribute || p.name}</code></td>
                          <td><span className="cells-studio__type-pill">{p.type}</span></td>
                          <td><code>{p.default || '-'}</code></td>
                          <td>{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Events Table */}
            {docs?.events && docs.events.length > 0 && (
              <section className="cells-studio__docs-section">
                <h4>Eventos</h4>
                <div className="cells-studio__table-wrapper">
                  <table className="cells-studio__table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Detail (Payload)</th>
                        <th>Bubbles</th>
                        <th>Composed</th>
                        <th>Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.events.map((e) => (
                        <tr key={e.name}>
                          <td><code className="text-sky-300">{e.name}</code></td>
                          <td><code>{e.detail || 'unknown'}</code></td>
                          <td>{e.bubbles === undefined ? '—' : e.bubbles ? '✓' : '✗'}</td>
                          <td>{e.composed === undefined ? '—' : e.composed ? '✓' : '✗'}</td>
                          <td>{e.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* CSS Variables */}
            {docs?.cssProperties && docs.cssProperties.length > 0 && (
              <section className="cells-studio__docs-section">
                <h4>CSS Custom Properties</h4>
                <div className="cells-studio__table-wrapper">
                  <table className="cells-studio__table">
                    <thead>
                      <tr>
                        <th>Variable</th>
                        <th>Por defecto</th>
                        <th>Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.cssProperties.map((cp) => (
                        <tr key={cp.name}>
                          <td><code>{cp.name}</code></td>
                          <td><code>{cp.default || '-'}</code></td>
                          <td>{cp.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </article>
        )}
      </div>

      {/* 3. BOTTOM CONSOLE / ERRORS DRAWER */}
      <div className={`cells-studio__console-drawer ${isConsoleOpen ? 'is-open' : ''}`}>
        <div className="cells-studio__console-bar">
          <div className="cells-studio__console-tabs">
            <button
              type="button"
              className={`cells-studio__console-tab ${consoleTab === 'console' ? 'is-active' : ''}`}
              onClick={() => {
                setConsoleTab('console');
                setIsConsoleOpen(true);
              }}
            >
              Consola
            </button>
            <button
              type="button"
              className={`cells-studio__console-tab ${consoleTab === 'errors' ? 'is-active' : ''}`}
              onClick={() => {
                setConsoleTab('errors');
                setIsConsoleOpen(true);
              }}
            >
              Errores {errorLogs.length > 0 && `(${errorLogs.length})`}
            </button>
          </div>

          <div className="cells-studio__console-controls">
            {consoleLogs.length > 0 && (
              <button
                type="button"
                className="cells-studio__console-clear"
                onClick={() => setConsoleLogs([])}
                title="Limpiar logs"
              >
                <Trash2 size={12} />
                <span>Limpiar</span>
              </button>
            )}
            <button
              type="button"
              className="cells-studio__console-toggle"
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              aria-label={isConsoleOpen ? 'Cerrar consola' : 'Abrir consola'}
            >
              {isConsoleOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {isConsoleOpen && (
          <div className="cells-studio__console-body">
            {(consoleTab === 'console' ? consoleLogs : errorLogs).length === 0 ? (
              <div className="cells-studio__empty-logs">
                <span>Sin registros en {consoleTab === 'console' ? 'consola' : 'errores'}.</span>
              </div>
            ) : (
              (consoleTab === 'console' ? consoleLogs : errorLogs).map((log) => (
                <div key={log.id} className={`cells-studio__log-row is-${log.level}`}>
                  <span className={`cells-studio__log-dot is-${log.level}`} />
                  <span className="cells-studio__log-time">{log.timeFormatted}</span>
                  <span className="cells-studio__log-msg">{log.args.join(' ')}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* FLOATING SHOW INTERFACE BUTTON */}
      {interfaceHidden && (
        <button
          type="button"
          className="cells-studio__show-floating"
          onClick={() => setInterfaceHidden(false)}
        >
          <Eye size={14} className="inline mr-1" />
          Mostrar interfaz
        </button>
      )}
    </section>
  );
};
