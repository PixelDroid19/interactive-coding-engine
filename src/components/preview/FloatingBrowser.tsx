import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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
  instructorPointer?: { x: number; y: number; clicked?: boolean; targetArea: 'editor' | 'preview' | 'files' | 'global' };
  isFloating: boolean;
  onToggleFloating: () => void;
}

export const FloatingBrowser = forwardRef<FloatingBrowserRef, FloatingBrowserProps>(({
  workspace,
  onRunClick,
  autoReload = true,
  instructorPointer,
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
    const width = Math.min(420, Math.max(340, Math.round(window.innerWidth * 0.3)));
    const height = Math.min(540, Math.max(380, window.innerHeight - 148));
    setSize({ width, height });
    setPos({
      x: Math.max(24, window.innerWidth - width - 18),
      y: 76,
    });
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

  // If floating and minimized, show collapsed pill in corner
  if (isFloating && isMinimized) {
    return (
      <div className="fixed top-14 right-5 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-xs text-zinc-200 shadow-2xl backdrop-blur-md transition-all hover:scale-105"
        >
          <Globe className="h-3.5 w-3.5 text-zinc-300" />
          <span className="font-medium font-sans">Abrir navegador</span>
          <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">/index.html</span>
        </button>
      </div>
    );
  }

  const containerClasses = isFloating
    ? isMaximized
      ? 'fixed inset-10 z-50 rounded-xl shadow-2xl border border-zinc-700/80 bg-[#121214] flex flex-col overflow-hidden backdrop-blur-xl'
      : 'fixed z-50 rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.55)] border border-zinc-600/70 bg-[#121214] flex flex-col overflow-hidden'
    : 'flex h-full w-full flex-col bg-[#121214] border-l border-zinc-800/80 relative overflow-hidden';

  const containerStyle =
    isFloating && !isMaximized
      ? {
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }
      : undefined;

  return (
    <div className={containerClasses} style={containerStyle}>
      {/* Top Browser Chrome Header */}
      <div
        onMouseDown={handleMouseDownHeader}
        className={`flex h-10 items-center justify-between px-3 bg-[#141416] border-b border-zinc-800/80 text-xs font-mono select-none ${
          isFloating ? (isDragging ? 'cursor-grabbing bg-zinc-800' : 'cursor-grab hover:bg-[#1a1a1d]') : ''
        }`}
        title={isFloating ? 'Arrastra para mover' : undefined}
      >
        <div className="flex items-center gap-1 text-zinc-400">
          <button className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-200" title="Atrás">
            <ArrowLeft className="h-3 w-3" />
          </button>
          <button className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-200" title="Adelante">
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            onClick={compileAndRun}
            className={`p-1 rounded hover:bg-zinc-800 hover:text-zinc-200 ${isExecuting ? 'animate-spin' : ''}`}
            title="Recargar"
          >
            <RotateCw className="h-3 w-3" />
          </button>
        </div>

        <div className="flex-1 max-w-[200px] sm:max-w-[240px] mx-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#09090b] border border-zinc-800 text-[11px] text-zinc-300 font-mono">
            <span className="text-zinc-500">/</span>
            <span className="truncate">index.html</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleManualRun}
            className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 px-2 py-0.5 text-zinc-200 font-medium text-[11px]"
            title="Ejecutar"
          >
            <Play className="h-2.5 w-2.5 fill-zinc-200" />
            <span className="hidden sm:inline">Run</span>
          </button>

          <button
            onClick={onToggleFloating}
            className="p-1 rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            title={isFloating ? 'Fijar al lado' : 'Soltar flotante'}
          >
            {isFloating ? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
          </button>

          {isFloating && (
            <>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
                title="Minimizar"
              >
                <Minimize2 className="h-3 w-3" />
              </button>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
                title={isMaximized ? 'Restaurar' : 'Ampliar'}
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Preview Sandbox Iframe Container */}
      <div className="relative flex-1 w-full bg-white overflow-hidden">
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

        {/* Instructor Cursor overlay inside preview area */}
        {instructorPointer && instructorPointer.targetArea === 'preview' && (
          <InstructorCursor pointer={instructorPointer} containerType="preview" />
        )}
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
