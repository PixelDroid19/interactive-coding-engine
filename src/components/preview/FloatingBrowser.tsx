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
  reloadPreview: () => void;
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
  autoReload = true,
  isFloating,
  onToggleFloating,
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;
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

  useEffect(() => {
    const place = () => {
      const width = Math.min(420, Math.max(340, Math.round(window.innerWidth * 0.3)));
      const height = Math.min(540, Math.max(380, window.innerHeight - 148));
      setSize({ width, height });
      setPos({
        x: Math.max(24, window.innerWidth - width - 18),
        y: 76,
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, []);

  useImperativeHandle(ref, () => ({
    getIframeElement: () => iframeRef.current,
    reloadPreview: () => compileAndRun(),
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

      const newX = Math.max(8, Math.min(window.innerWidth - 88, dragStartRef.current.posX + dx));
      const newY = Math.max(44, Math.min(window.innerHeight - 64, dragStartRef.current.posY + dy));

      setPos({ x: newX, y: newY });
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

      setSize({
        width: Math.max(300, Math.min(window.innerWidth - pos.x - 16, resizeStartRef.current.startW + dx)),
        height: Math.max(240, Math.min(window.innerHeight - pos.y - 56, resizeStartRef.current.startH + dy)),
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
          args: [event.data.message || 'Unhandled Runtime Error'],
          timestamp: Date.now(),
        };
        setLogs((prev) => [...prev.slice(-150), errorMsg]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const compileAndRun = () => {
    if (!iframeRef.current) return;
    setIsExecuting(true);
    setLogs([]);
    iframeRef.current.srcdoc = buildPreviewDocument(workspaceRef.current);
    setTimeout(() => setIsExecuting(false), 200);
  };

  useEffect(() => {
    compileAndRun();
  }, []);

  useEffect(() => {
    if (!autoReload) return;
    const timeout = setTimeout(() => {
      compileAndRun();
    }, 350);
    return () => clearTimeout(timeout);
  }, [workspace.files, autoReload]);

  const handleManualRun = () => {
    compileAndRun();
    onRunClick?.();
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
        <button onClick={() => setIsMinimized(false)} className="floating-preview-trigger">
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
        className={`browser-header-clean ${isFloating ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
        title={isFloating ? 'Arrastra para mover' : undefined}
      >
        <div className="browser-header-title">
          <span>Vista previa</span>
          <span className="browser-preview-badge">live</span>
        </div>
        <div className="browser-window-actions">
          <button onClick={compileAndRun} className="browser-btn" title="Recargar">
            <RotateCw size={13} className={isExecuting ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleManualRun} className="browser-btn" title="Ejecutar">
            <Play size={13} />
          </button>
          <button onClick={onToggleFloating} className="browser-btn" title={isFloating ? 'Fijar al lado' : 'Soltar flotante'}>
            {isFloating ? <Pin size={13} /> : <PinOff size={13} />}
          </button>
          {isFloating && (
            <>
              <button onClick={() => setIsMinimized(true)} className="browser-btn" title="Minimizar">
                <Minimize2 size={13} />
              </button>
              <button onClick={() => setIsMaximized(!isMaximized)} className="browser-btn" title={isMaximized ? 'Restaurar' : 'Ampliar'}>
                <Maximize2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="browser-navbar">
        <button className="browser-btn" title="Atrás"><ArrowLeft size={13} /></button>
        <button className="browser-btn" title="Adelante"><ArrowRight size={13} /></button>
        <div className="browser-url-box">
          <input className="browser-url-input" readOnly value="/index.html" />
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
          title="Resize browser"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-zinc-500 rounded-br-sm" />
        </div>
      )}
    </div>
  );
});
