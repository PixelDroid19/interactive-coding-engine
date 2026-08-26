import React, { useEffect, useMemo, useState } from 'react';
import type { CellsPreviewBuild } from '../../engine/cells/cellsPreviewCompiler';

type ComponentDemo = NonNullable<CellsPreviewBuild['componentDemo']>;
type WorkbenchTab = 'visual' | 'code' | 'docs';
type ViewportPreset = '375' | '768' | '1024' | '1280' | 'fluid';

interface CellsPreviewWorkbenchProps {
  html: string;
  demo: ComponentDemo;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  title?: string;
  compact?: boolean;
}

interface ObservedEvent {
  id: number;
  name: string;
  detail: unknown;
}

const VIEWPORTS: Array<{ id: ViewportPreset; label: string }> = [
  { id: '375', label: 'Móvil' },
  { id: '768', label: 'Tablet' },
  { id: '1024', label: 'Escritorio' },
  { id: '1280', label: 'Escritorio grande' },
  { id: 'fluid', label: 'Fluido' },
];

export const CellsPreviewWorkbench: React.FC<CellsPreviewWorkbenchProps> = ({
  html,
  demo,
  iframeRef,
  title = 'Vista previa del componente Cells',
  compact = false,
}) => {
  const [tab, setTab] = useState<WorkbenchTab>('visual');
  const [caseId, setCaseId] = useState(demo.cases[0]?.id ?? 'basic');
  const [locale, setLocale] = useState<'es' | 'en'>('es');
  const [viewport, setViewport] = useState<ViewportPreset>('fluid');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [appliedSize, setAppliedSize] = useState<{ width?: number; height?: number }>({});
  const [interfaceHidden, setInterfaceHidden] = useState(false);
  const [events, setEvents] = useState<ObservedEvent[]>([]);
  const selectedCase = useMemo(
    () => demo.cases.find((candidate) => candidate.id === caseId) ?? demo.cases[0],
    [caseId, demo.cases],
  );

  const postState = () => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame || !selectedCase) return;
    frame.postMessage({ source: 'open-cells-shell', type: 'locale:set', locale }, '*');
    frame.postMessage({
      source: 'open-cells-shell',
      type: 'demo:set-case',
      caseId: selectedCase.id,
      properties: selectedCase.properties,
    }, '*');
  };

  useEffect(() => {
    postState();
  }, [caseId, html, locale]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || event.data?.source !== 'open-cells-preview') return;
      if (event.data.type === 'ready') postState();
      if (event.data.type === 'component:event') {
        setEvents((current) => [...current.slice(-19), {
          id: Date.now() + Math.random(),
          name: String(event.data.name),
          detail: event.data.detail,
        }]);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [caseId, html, locale]);

  const frameWidth = appliedSize.width
    ?? (viewport === 'fluid' ? undefined : Number(viewport));
  const applyCustomSize = () => {
    const width = Number(customWidth);
    const height = Number(customHeight);
    setAppliedSize({
      ...(width > 0 ? { width } : {}),
      ...(height > 0 ? { height } : {}),
    });
  };
  const chooseViewport = (next: ViewportPreset) => {
    setViewport(next);
    setAppliedSize({});
  };

  return (
    <section className={`cells-preview-workbench ${compact ? 'is-compact' : ''} ${interfaceHidden ? 'is-interface-hidden' : ''}`}>
      {!interfaceHidden && (
        <>
          <header className="cells-preview-workbench__header">
            <div className="cells-preview-workbench__identity">
              <strong>Demostración de {demo.tagName}</strong>
              <span>{demo.packageName}</span>
            </div>
            <label className="cells-preview-workbench__case">
              <span>Caso</span>
              <select aria-label="Caso de demostración" value={caseId} onChange={(event) => setCaseId(event.target.value)}>
                {demo.cases.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
              </select>
            </label>
            <div className="cells-preview-workbench__tabs" role="tablist" aria-label="Vista de la demostración">
              {(['visual', 'code', 'docs'] as const).map((candidate) => (
                <button key={candidate} type="button" role="tab" aria-selected={tab === candidate} onClick={() => setTab(candidate)}>
                  {candidate === 'visual' ? 'Visual' : candidate === 'code' ? 'Código' : 'Documentación'}
                </button>
              ))}
            </div>
            <div className="cells-preview-workbench__languages" aria-label="Idioma de la demostración">
              <button type="button" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>Inglés</button>
              <button type="button" aria-pressed={locale === 'es'} onClick={() => setLocale('es')}>Español</button>
            </div>
            <label className="cells-preview-workbench__hide"><input type="checkbox" checked={interfaceHidden} onChange={(event) => setInterfaceHidden(event.target.checked)} /> Ocultar interfaz</label>
          </header>
          {tab === 'visual' && (
            <div className="cells-preview-workbench__viewportbar">
              <div className="cells-preview-workbench__presets" aria-label="Tamaño de la demostración">
                {VIEWPORTS.map((preset) => (
                  <button key={preset.id} type="button" aria-pressed={viewport === preset.id && Object.keys(appliedSize).length === 0} onClick={() => chooseViewport(preset.id)}>{preset.label}</button>
                ))}
              </div>
              <label>Ancho <input aria-label="Ancho personalizado" inputMode="numeric" placeholder="auto" value={customWidth} onChange={(event) => setCustomWidth(event.target.value)} /></label>
              <span>×</span>
              <label>Alto <input aria-label="Alto personalizado" inputMode="numeric" placeholder="auto" value={customHeight} onChange={(event) => setCustomHeight(event.target.value)} /></label>
              <button type="button" className="cells-preview-workbench__apply" onClick={applyCustomSize}>Aplicar</button>
            </div>
          )}
        </>
      )}

      {tab === 'visual' && (
        <div className="cells-preview-workbench__visual">
          <div className="cells-preview-workbench__canvas">
            <div className="cells-preview-workbench__device" style={{ width: frameWidth ? `${frameWidth}px` : undefined, height: appliedSize.height ? `${appliedSize.height}px` : undefined }}>
              {!interfaceHidden && <div className="cells-preview-workbench__devicebar"><span>{selectedCase?.label}</span><code>#{String(demo.cases.findIndex((item) => item.id === caseId) + 1).padStart(2, '0')}</code></div>}
              <iframe ref={iframeRef} title={title} sandbox="allow-scripts" srcDoc={html} onLoad={postState} />
            </div>
          </div>
          {!interfaceHidden && (
            <aside className="cells-preview-workbench__events" aria-label="Eventos del componente">
              <header><strong>Eventos</strong><span>{String(events.length).padStart(2, '0')}</span></header>
              <p>Los eventos públicos aparecen aquí con su nombre y detail.</p>
              {events.length === 0 ? <div className="cells-preview-workbench__event"><code>Sin eventos todavía</code><output>Interactúa con el componente para inspeccionar su salida.</output></div> : events.map((observed) => (
                <div className="cells-preview-workbench__event" key={observed.id}><code>{observed.name}</code><output>{JSON.stringify(observed.detail)}</output></div>
              ))}
            </aside>
          )}
        </div>
      )}
      {tab === 'code' && <article className="cells-preview-workbench__reference"><h4>Entrada pública del componente</h4><p>La demo consume el mismo módulo que usaría una aplicación.</p><pre>{demo.source}</pre></article>}
      {tab === 'docs' && <article className="cells-preview-workbench__reference"><h4>Contrato público</h4><dl>{demo.contract.map((entry) => <React.Fragment key={entry.term}><dt>{entry.term}</dt><dd>{entry.description}</dd></React.Fragment>)}</dl></article>}
      {interfaceHidden && <button type="button" className="cells-preview-workbench__show" onClick={() => setInterfaceHidden(false)}>Mostrar interfaz</button>}
    </section>
  );
};
