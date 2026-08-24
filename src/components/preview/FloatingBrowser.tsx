import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { WorkspaceSnapshot } from '../../types/scrim';
import { ConsoleMessage } from '../../types/runtime';
import { RuntimeConsole } from './RuntimeConsole';
import { InstructorCursor } from '../player/InstructorCursor';
import { buildPreviewDocument } from '../../engine/previewDocument';
import { 
  Play, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  Maximize2, 
  Minimize2, 
  Pin, 
  PinOff, 
  Globe
} from 'lucide-react';

export interface FloatingBrowserRef {
  getIframeElement: () => HTMLIFrameElement | null;
  reloadPreview: () => Promise<void>;
  getGeneration: () => number;
}

interface FloatingBrowserProps {
  workspace: WorkspaceSnapshot;
  onRunClick?: () => void;
  autoReload?: boolean;
  isFloating: boolean;
  onToggleFloating: () => void;
}

export const FloatingBrowser = forwardRef<FloatingBrowserRef, FloatingBrowserProps>(({
  workspace,
  onRunClick,
  autoReload = false,
  isFloating,
  onToggleFloating,
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;
  const generationRef = useRef(0);
  const [logs, setLogs] = useState<ConsoleMessage[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [pos, setPos] = useState({ x: 24, y: 52 });
  const [size, setSize] = useState({ width: 400, height: 480 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, startW: 0, startH: 0 });

  const clampPosition = useCallback((nextX: number, nextY: number, nextSize = size) => ({
    x: Math.max(8, Math.min(Math.max(8, window.innerWidth - nextSize.width - 8), nextX)),
    y: Math.max(44, Math.min(Math.max(44, window.innerHeight - nextSize.height - 8), nextY)),
  }), [size]);

  useEffect(() => {
    const place = () => {
      const availableWidth = Math.max(160, window.innerWidth - 16);
      const minimumWidth = Math.min(340, availableWidth);
      const isNarrowViewport = window.innerWidth <= 768;
      const width = isNarrowViewport
        ? availableWidth
        : Math.min(availableWidth, 420, Math.max(minimumWidth, Math.round(window.innerWidth * 0.3)));
      const availableHeight = Math.max(180, window.innerHeight - 52);
      const minimumHeight = Math.min(380, availableHeight);
      const narrowTop = 96;
      const height = isNarrowViewport
        ? Math.min(320, Math.max(180, window.innerHeight - narrowTop - 120))
        : Math.min(availableHeight, 540, Math.max(minimumHeight, window.innerHeight - 148));
      setSize({ width, height });
      setPos({
        x: Math.max(8, window.innerWidth - width - 18),
        y: isNarrowViewport
          ? narrowTop
          : Math.max(44, Math.min(76, window.innerHeight - height - 8)),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, []);

  useImperativeHandle(ref, () => ({
    getIframeElement: () => iframeRef.current,
    reloadPreview: () => compileAndRun(),
    getGeneration: () => generationRef.current,
  }));

  // Handle Dragging
  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if (!isFloating || isMaximized) return;
    // Don't drag if clicking buttons or input
    if ((e.target as HTMLElement).closest('button, input, a')) return;

    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.mouseX;
      const dy = moveEvent.clientY - dragStartRef.current.mouseY;

      setPos(clampPosition(dragStartRef.current.posX + dx, dragStartRef.current.posY + dy));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Keyboard support for moving floating browser
  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (!isFloating || isMaximized) return;
    let dx = 0, dy = 0;
    switch (e.key) {
      case 'ArrowLeft': dx = -20; break;
      case 'ArrowRight': dx = 20; break;
      case 'ArrowUp': dy = -20; break;
      case 'ArrowDown': dy = 20; break;
      default: return;
    }
    e.preventDefault();
    setPos((prev) => clampPosition(prev.x + dx, prev.y + dy));
  };

  // Handle Resizing
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    isResizingRef.current = true;
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: size.width,
      startH: size.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dx = moveEvent.clientX - resizeStartRef.current.mouseX;
      const dy = moveEvent.clientY - resizeStartRef.current.mouseY;

      const maxWidth = Math.max(160, window.innerWidth - pos.x - 8);
      const maxHeight = Math.max(180, window.innerHeight - pos.y - 8);
      setSize({
        width: Math.max(Math.min(340, maxWidth), Math.min(maxWidth, resizeStartRef.current.startW + dx)),
        height: Math.max(Math.min(260, maxHeight), Math.min(maxHeight, resizeStartRef.current.startH + dy)),
      });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Listen for iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.__preview_source !== 'preview-sandbox') return;

      if (event.data.type === 'console') {
        const newMsg: ConsoleMessage = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: event.data.level || 'log',
          args: event.data.args.map((a: any) => (typeof a === 'object' ? JSON.stringify(a) : String(a))),
          timestamp: Date.now(),
        };
        setLogs((prev) => [...prev.slice(-150), newMsg]);
      } else if (event.data.type === 'error') {
        const errorMsg: ConsoleMessage = {
          id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'error',
          args: [event.data.message || 'Error en la ejecución'],
          timestamp: Date.now(),
        };
        setLogs((prev) => [...prev.slice(-150), errorMsg]);
        setIsConsoleOpen(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const compileAndRun = useCallback(() => {
    if (!iframeRef.current) return Promise.resolve();
    const gen = ++generationRef.current;
    (iframeRef.current as any).__generation = gen;
    setLogs([]);
    setIsExecuting(true);
    return new Promise<void>((resolve) => {
      const iframe = iframeRef.current!;
      const onLoad = () => {
        setIsExecuting(false);
        iframe.removeEventListener('load', onLoad);
        // Small delay to let JS execute
        setTimeout(() => resolve(), 50);
      };
      iframe.addEventListener('load', onLoad);
      iframe.srcdoc = buildPreviewDocument(workspaceRef.current);
      // Fallback if load doesn't fire (srcdoc)
      setTimeout(() => {
        iframe.removeEventListener('load', onLoad);
        setIsExecuting(false);
        resolve();
      }, 350);
    });
  }, []);

  useEffect(() => {
    compileAndRun();
  }, [compileAndRun]);

  useEffect(() => {
    if (!autoReload) return;
    const timeout = setTimeout(() => {
      compileAndRun();
    }, 350);
    return () => clearTimeout(timeout);
  }, [workspace.files, autoReload]);

  const handleManualRun = () => {
    if (onRunClick) {
      onRunClick();
    } else {
      compileAndRun();
    }
  };

  const mapPreviewPointer = useCallback((x: number, y: number) => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const viewportH = iframe?.clientHeight || 1;
    const viewportW = iframe?.clientWidth || 1;
    const body = doc?.body;
    const contentH = Math.max(120, Math.min(body?.scrollHeight || viewportH, viewportH));
    const contentW = Math.max(160, Math.min(body?.scrollWidth || viewportW, viewportW));
    return {
      x: Math.min(92, Math.max(8, (x / 100) * (contentW / viewportW) * 100)),
      y: Math.min(90, Math.max(8, (y / 100) * (contentH / viewportH) * 100)),
    };
  }, []);

  // If floating and minimized, show collapsed pill in corner
  if (isFloating && isMinimized) {
    return (
      <div className="fixed top-14 right-5 z-40">
        <button onClick={() => setIsMinimized(false)} className="floating-preview-trigger" aria-label="Abrir vista previa">
          <Globe size={14} />
          <span>Abrir navegador</span>
        </button>
      </div>
    );
  }

  const containerClasses = isFloating
    ? isMaximized
      ? 'browser-window floating-browser-expanded'
      : 'browser-window fixed z-50'
    : 'browser-window h-full w-full relative';

  const containerStyle =
    isFloating && !isMaximized
      ? {
          position: 'fixed' as const,
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }
      : isFloating
        ? { position: 'fixed' as const }
        : undefined;

  return (
    <div className={containerClasses} style={containerStyle}>
      {/* Top Browser Chrome Header */}
      <div
        onMouseDown={handleMouseDownHeader}
        onKeyDown={handleHeaderKeyDown}
        tabIndex={isFloating && !isMaximized ? 0 : -1}
        role={isFloating ? 'toolbar' : undefined}
        aria-label={isFloating ? 'Barra de vista previa, usa flechas para mover' : undefined}
        className={`browser-header-clean ${isFloating ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
        title={isFloating ? 'Arrastra para mover (o flechas)' : undefined}
      >
        <div className="browser-header-title">
          <span>Vista previa</span>
          <span className="browser-preview-badge">{autoReload ? 'En vivo' : 'Ejecutado'}</span>
        </div>
        <div className="browser-window-actions">
          <button onClick={compileAndRun} className="browser-btn" aria-label="Recargar vista previa" title="Recargar">
            <RotateCw size={13} className={isExecuting ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleManualRun} className="browser-btn" aria-label="Ejecutar código" title="Ejecutar">
            <Play size={13} />
          </button>
          <button onClick={onToggleFloating} className="browser-btn" aria-label={isFloating ? 'Fijar al lado' : 'Soltar flotante'} title={isFloating ? 'Fijar al lado' : 'Soltar flotante'}>
            {isFloating ? <Pin size={13} /> : <PinOff size={13} />}
          </button>
          {isFloating && (
            <>
              <button onClick={() => setIsMinimized(true)} className="browser-btn" aria-label="Minimizar vista previa" title="Minimizar">
                <Minimize2 size={13} />
              </button>
              <button onClick={() => setIsMaximized(!isMaximized)} className="browser-btn" aria-label={isMaximized ? 'Restaurar tamaño' : 'Ampliar vista previa'} title={isMaximized ? 'Restaurar' : 'Ampliar'}>
                <Maximize2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="browser-navbar">
        <button className="browser-btn" aria-label="Atrás (no disponible)" title="Navegación no disponible" disabled aria-disabled="true" style={{ opacity: 0.4, cursor: 'not-allowed' }}><ArrowLeft size={13} /></button>
        <button className="browser-btn" aria-label="Adelante (no disponible)" title="Navegación no disponible" disabled aria-disabled="true" style={{ opacity: 0.4, cursor: 'not-allowed' }}><ArrowRight size={13} /></button>
        <div className="browser-url-box" aria-label="Ruta actual">
          <span className="browser-url-text">/index.html</span>
        </div>
      </div>

      {/* Main Preview Sandbox Iframe Container */}
      <div className="browser-viewport">
        {/* Transparent overlay while dragging to prevent iframe from intercepting mouse events */}
        {(isDragging || isResizing) && (
          <div className="absolute inset-0 z-30 bg-transparent cursor-move select-none" />
        )}

        <iframe
          ref={iframeRef}
          title="Vista previa"
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
          className="h-full w-full border-none bg-white"
        />

        <InstructorCursor containerType="preview" mapPosition={mapPreviewPointer} />
      </div>

      {/* Embedded Runtime Console Drawer */}
      <RuntimeConsole
        logs={logs}
        onClearLogs={() => setLogs([])}
        isOpen={isConsoleOpen}
        onToggle={() => setIsConsoleOpen(!isConsoleOpen)}
      />

      {/* Resize Handle for Floating Window */}
      {isFloating && !isMaximized && (
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-50 flex items-end justify-end p-0.5 opacity-60 hover:opacity-100"
          aria-label="Redimensionar vista previa"
          title="Arrastrar para redimensionar"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-zinc-500 rounded-br-sm" />
        </div>
      )}
    </div>
  );
});
