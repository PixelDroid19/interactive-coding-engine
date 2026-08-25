import React, { useEffect, useRef, useState } from 'react';
import { BrainCircuit, CheckCircle2, Download, Gauge, LoaderCircle, Play, Square } from 'lucide-react';
import type { InteractiveAILab, InteractiveAILabMode } from '../../types/curriculum';
import { DEFAULT_LOCAL_GENERATION_MODEL, type GenerationProgress, type LocalGenerationRequest, type LocalGenerationResult, type LocalModelInfo } from '../../engine/ai/localGenerationProtocol';
import { LocalGenerationService } from '../../engine/ai/localGenerationService';

export interface LocalGenerationClient {
  inspectModel(model?: string, options?: { signal?: AbortSignal }): Promise<LocalModelInfo>;
  generate(
    request: LocalGenerationRequest,
    options?: {
      signal?: AbortSignal;
      onProgress?: (progress: GenerationProgress) => void;
      onChunk?: (text: string) => void;
      model?: string;
    },
  ): Promise<LocalGenerationResult>;
  dispose(): void;
}

interface AIInteractivePracticeProps {
  lab: InteractiveAILab;
  createLocalClient?: () => LocalGenerationClient;
  webGpuAvailable?: boolean;
}

interface VisibleResult extends Partial<LocalGenerationResult> {
  label: string;
  error?: string;
}

function summaryInstruction(type: string, length: string) {
  const typeCopy: Record<string, string> = {
    'key-points': 'Extrae los puntos clave como una lista',
    tldr: 'Escribe un resumen directo',
    teaser: 'Escribe un avance que invite a leer',
    headline: 'Escribe un titular fiel al texto',
  };
  const lengthCopy: Record<string, string> = {
    short: 'breve',
    medium: 'medio',
    long: 'amplio',
  };
  return `${typeCopy[type] ?? typeCopy['key-points']}. Usa una longitud ${lengthCopy[length] ?? 'breve'}. No inventes información.`;
}

function writeInstruction(tone: string, length: string) {
  const toneCopy: Record<string, string> = {
    formal: 'formal',
    neutral: 'neutral',
    casual: 'cercano',
  };
  return `Redacta el contenido solicitado con tono ${toneCopy[tone] ?? 'neutral'} y longitud ${length}. No agregues hechos que no estén en el contexto.`;
}

function jsonKeysFromInstruction(instruction: string) {
  const schema = instruction.split(/Ejemplo/i)[0] ?? instruction;
  return [...schema.matchAll(/"([^"]+)"\s*:/g)].map((match) => match[1]);
}

export function AIInteractivePractice({ lab, createLocalClient = () => new LocalGenerationService(), webGpuAvailable = typeof navigator !== 'undefined' && 'gpu' in navigator }: AIInteractivePracticeProps) {
  const [mode, setMode] = useState<InteractiveAILabMode>(lab.defaultMode);
  const [systemPrompt, setSystemPrompt] = useState(lab.systemPrompt);
  const [promptA, setPromptA] = useState(lab.promptA);
  const [promptB, setPromptB] = useState(lab.promptB);
  const [input, setInput] = useState(lab.input);
  const [temperatureA, setTemperatureA] = useState(0);
  const [temperatureB, setTemperatureB] = useState(0);
  const [topP, setTopP] = useState(0.9);
  const [summaryType, setSummaryType] = useState('key-points');
  const [summaryLength, setSummaryLength] = useState('short');
  const [writerTone, setWriterTone] = useState('neutral');
  const [writerLength, setWriterLength] = useState('medium');
  const [context, setContext] = useState('La persona está aprendiendo y necesita un texto claro.');
  const [modelInfo, setModelInfo] = useState<LocalModelInfo | null>(null);
  const [status, setStatus] = useState<'idle' | 'inspecting' | 'ready' | 'running' | 'error'>('idle');
  const [statusText, setStatusText] = useState('El modelo no se carga hasta que tú lo decidas.');
  const [progress, setProgress] = useState<number | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const [results, setResults] = useState<VisibleResult[]>([]);
  const [observation, setObservation] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const clientRef = useRef<LocalGenerationClient | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const client = () => {
    clientRef.current ??= createLocalClient();
    return clientRef.current;
  };

  useEffect(
    () => () => {
      abortRef.current?.abort();
      clientRef.current?.dispose();
    },
    [],
  );

  const inspect = async () => {
    setStatus('inspecting');
    setStatusText('Consultando el modelo WebLLM y su caché…');
    try {
      const info = await client().inspectModel();
      setModelInfo(info);
      setStatus('ready');
      setStatusText(info.cached ? 'El modelo ya está en caché y puede ejecutarse sin volver a descargarlo.' : 'La descarga empezará únicamente cuando pulses ejecutar.');
    } catch (error) {
      setStatus('error');
      setStatusText(error instanceof Error ? error.message : String(error));
    }
  };

  const runOne = async (label: string, instruction: string, temperature: number) => {
    const expectsJson = /\bjson\b/i.test(instruction);
    const request: LocalGenerationRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${instruction}\n\nEntrada:\n${input}${mode === 'write' ? `\n\nContexto:\n${context}` : ''}`,
        },
      ],
      temperature,
      topP,
      maxNewTokens: mode === 'prompt' ? 128 : 160,
      expectedFormat: expectsJson ? 'json_object' : 'text',
      expectedJsonKeys: expectsJson ? (lab.expectedJsonKeys ?? jsonKeysFromInstruction(instruction)) : undefined,
    };
    setStreamedText('');
    const result = await client().generate(request, {
      signal: abortRef.current?.signal,
      onProgress: (event) => {
        setStatusText(event.label);
        setProgress(event.progress ?? null);
      },
      onChunk: (chunk) => setStreamedText((current) => current + chunk),
    });
    return { ...result, label };
  };

  const runOneSafely = async (label: string, instruction: string, temperature: number): Promise<VisibleResult> => {
    try {
      return await runOne(label, instruction, temperature);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      return {
        label,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const run = async () => {
    if (!modelInfo || !webGpuAvailable || !input.trim()) return;
    abortRef.current = new AbortController();
    setStatus('running');
    setStatusText(modelInfo.cached ? 'Ejecutando el modelo local…' : 'Descargando y preparando el modelo local…');
    setProgress(null);
    setResults([]);
    setReviewed(false);
    try {
      let nextResults: VisibleResult[];
      if (mode === 'prompt') {
        const first = await runOneSafely('Prompt A', promptA, temperatureA);
        const second = await runOneSafely('Prompt B', promptB, temperatureB);
        nextResults = [first, second];
      } else if (mode === 'summarize') {
        nextResults = [await runOneSafely('Resumen', summaryInstruction(summaryType, summaryLength), 0.2)];
      } else {
        nextResults = [await runOneSafely('Texto', `${writeInstruction(writerTone, writerLength)}\n\nObjetivo:\n${promptA}`, 0.5)];
      }
      setResults(nextResults);
      setModelInfo((current) => (current ? { ...current, cached: true } : current));
      const passedCount = nextResults.filter((result) => !result.error).length;
      setStatus(passedCount > 0 ? 'ready' : 'error');
      setStatusText(passedCount === nextResults.length ? 'Generación terminada en este dispositivo. Revisa la salida; un modelo puede equivocarse.' : passedCount > 0 ? 'Una salida falló el contrato y la otra pudo revisarse. Esa diferencia también es evidencia del experimento.' : 'Ninguna salida cumplió el contrato. Revisa cada diagnóstico, reduce la tarea o cambia una sola variable.');
      setProgress(1);
      setStreamedText('');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus('ready');
        setStatusText('Generación cancelada. Puedes cambiar la entrada y volver a intentarlo.');
      } else {
        setStatus('error');
        setStatusText(error instanceof Error ? error.message : String(error));
      }
    }
  };

  const actionCopy = mode === 'prompt' ? 'comparar prompts' : mode === 'summarize' ? 'resumir' : 'escribir';
  const runLabel = `${modelInfo?.cached ? 'Ejecutar y' : 'Descargar y'} ${actionCopy}`;

  return (
    <section className="ai-lab-shell min-w-0 text-zinc-100" aria-labelledby="interactive-ai-title">
      <header className="ai-lab-heading flex flex-col gap-3 border-l-2 border-yellow-300 pl-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-yellow-300">Práctica interactiva · WebGPU</p>
          <h2 id="interactive-ai-title" className="mt-1 text-2xl font-bold sm:text-3xl">
            {lab.title}
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-zinc-300">{lab.description}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1 rounded border border-emerald-700 bg-emerald-950/40 px-2 py-1 text-xs text-emerald-200">
          <BrainCircuit size={13} /> Todo ocurre en este dispositivo
        </span>
      </header>

      <div className="mt-7 grid grid-cols-3 border-y border-zinc-700 bg-zinc-950" role="tablist" aria-label="Tipo de experimento">
        {lab.allowedModes.map((currentMode) => {
          const label = currentMode === 'prompt' ? 'Compara prompts' : currentMode === 'summarize' ? 'Resume' : 'Escribe';
          return (
            <button
              key={currentMode}
              type="button"
              role="tab"
              aria-selected={mode === currentMode}
              className={`border-r border-zinc-800 px-3 py-3 text-sm font-bold transition last:border-r-0 ${mode === currentMode ? 'bg-yellow-300 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
              onClick={() => {
                setMode(currentMode);
                setResults([]);
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="ai-lab-workflow mt-5 space-y-5">
        <div className="ai-lab-config space-y-4 border border-zinc-700 bg-zinc-900/80 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-700 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-300">Paso 1</p>
              <h3 className="mt-1 text-lg font-bold text-zinc-100">Configura el experimento</h3>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-zinc-500">Cambia una variable por vez para que la comparación tenga sentido.</p>
          </div>
          <label className="block text-xs font-bold text-zinc-300">
            Instrucción del sistema
            <textarea aria-label="Instrucción del sistema" className="mt-1 min-h-16 w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm" value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} />
          </label>
          {mode === 'prompt' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-zinc-300">
                Prompt A
                <textarea aria-label="Prompt A" className="mt-1 min-h-24 w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm" value={promptA} onChange={(event) => setPromptA(event.target.value)} />
              </label>
              <label className="text-xs font-bold text-zinc-300">
                Prompt B
                <textarea aria-label="Prompt B" className="mt-1 min-h-24 w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm" value={promptB} onChange={(event) => setPromptB(event.target.value)} />
              </label>
            </div>
          )}
          {mode === 'summarize' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-zinc-300">
                Tipo de resumen
                <select aria-label="Tipo de resumen" className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2" value={summaryType} onChange={(event) => setSummaryType(event.target.value)}>
                  <option value="key-points">Puntos clave</option>
                  <option value="tldr">Resumen directo</option>
                  <option value="teaser">Avance</option>
                  <option value="headline">Titular</option>
                </select>
              </label>
              <label className="text-xs font-bold text-zinc-300">
                Longitud
                <select aria-label="Longitud del resumen" className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2" value={summaryLength} onChange={(event) => setSummaryLength(event.target.value)}>
                  <option value="short">Breve</option>
                  <option value="medium">Media</option>
                  <option value="long">Amplia</option>
                </select>
              </label>
            </div>
          )}
          {mode === 'write' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-300">
                Objetivo
                <textarea aria-label="Objetivo de escritura" className="mt-1 min-h-20 w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm" value={promptA} onChange={(event) => setPromptA(event.target.value)} />
              </label>
              <label className="block text-xs font-bold text-zinc-300">
                Contexto
                <textarea aria-label="Contexto de escritura" className="mt-1 min-h-20 w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm" value={context} onChange={(event) => setContext(event.target.value)} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-zinc-300">
                  Tono
                  <select aria-label="Tono" className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2" value={writerTone} onChange={(event) => setWriterTone(event.target.value)}>
                    <option value="formal">Formal</option>
                    <option value="neutral">Neutral</option>
                    <option value="casual">Cercano</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-zinc-300">
                  Longitud
                  <select aria-label="Longitud de escritura" className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2" value={writerLength} onChange={(event) => setWriterLength(event.target.value)}>
                    <option value="short">Breve</option>
                    <option value="medium">Media</option>
                    <option value="long">Amplia</option>
                  </select>
                </label>
              </div>
            </div>
          )}
          <label className="block text-xs font-bold text-zinc-300">
            Entrada del experimento
            <textarea aria-label="Entrada del experimento" className="mt-1 min-h-28 w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm leading-relaxed" value={input} onChange={(event) => setInput(event.target.value)} />
          </label>
          {mode === 'prompt' && (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-zinc-300">
                Temperatura A <output>{temperatureA.toFixed(1)}</output>
                <input aria-label="Temperatura A" className="block w-full" type="range" min="0" max="1.2" step="0.1" value={temperatureA} onChange={(event) => setTemperatureA(Number(event.target.value))} />
              </label>
              <label className="text-xs font-bold text-zinc-300">
                Temperatura B <output>{temperatureB.toFixed(1)}</output>
                <input aria-label="Temperatura B" className="block w-full" type="range" min="0" max="1.2" step="0.1" value={temperatureB} onChange={(event) => setTemperatureB(Number(event.target.value))} />
              </label>
              <label className="text-xs font-bold text-zinc-300">
                Top-p <output>{topP.toFixed(1)}</output>
                <input aria-label="Top-p" className="block w-full" type="range" min="0.1" max="1" step="0.1" value={topP} onChange={(event) => setTopP(Number(event.target.value))} />
              </label>
            </div>
          )}
          {mode === 'prompt' && <p className="text-[11px] leading-relaxed text-zinc-500">Empieza con ambas temperaturas en 0 para comparar solo el texto de los prompts. Después cambia una temperatura si quieres estudiar variación.</p>}
        </div>

        <aside aria-label="Runtime local" className="ai-lab-runtime border border-yellow-700/70 bg-[#17150e] p-5 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:items-center lg:gap-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-yellow-500 bg-zinc-950">
                <Gauge size={16} className="text-yellow-300" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-yellow-500">Paso 2</p>
                <h3 className="text-lg font-bold">Prepara el modelo local</h3>
              </div>
            </div>
            <code className="mt-4 block w-fit max-w-full break-all rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-cyan-200">{DEFAULT_LOCAL_GENERATION_MODEL}</code>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">WebLLM ejecuta Qwen2.5 de 0.5B parámetros en un Worker y usa exclusivamente WebGPU. El modelo entiende español, sigue instrucciones y puede producir JSON validable. No hay una respuesta simulada ni una ruta CPU escondida.</p>
            {!webGpuAvailable && (
              <p className="mt-3 rounded-lg border border-amber-700 bg-amber-950/40 p-3 text-xs text-amber-200" role="alert">
                WebGPU no está disponible. Prueba Chrome de escritorio actualizado y revisa la aceleración gráfica.
              </p>
            )}
            {modelInfo && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5">
                  <strong>{Math.round(modelInfo.estimatedVramMB)} MB</strong> de memoria GPU estimada
                </span>
                <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-400">{modelInfo.cached ? 'Ya está en caché.' : 'Todavía no está en caché.'}</span>
                <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-400">{modelInfo.engine} · {modelInfo.device.toUpperCase()}</span>
                {modelInfo.contextWindowSize > 0 && <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-500">Contexto: {modelInfo.contextWindowSize.toLocaleString('es')} tokens</span>}
              </div>
            )}
          </div>
          <div className="mt-5 rounded-xl border border-zinc-700 bg-zinc-950/70 p-4 lg:mt-0">
            {!modelInfo ? (
              <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-950 disabled:opacity-50" disabled={status === 'inspecting'} onClick={inspect}>
                {status === 'inspecting' ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />} Revisar modelo local
              </button>
            ) : (
              <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 py-3 text-sm font-black text-zinc-950 disabled:opacity-50" disabled={!webGpuAvailable || status === 'running' || !input.trim()} onClick={run}>
                {status === 'running' ? <LoaderCircle size={15} className="animate-spin" /> : <Play size={15} />} {runLabel}
              </button>
            )}
            {status === 'running' && (
              <button type="button" className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-700 px-3 py-2 text-xs font-bold text-rose-200" onClick={() => abortRef.current?.abort()}>
                <Square size={12} /> Cancelar
              </button>
            )}
            <p className={`mt-3 text-xs leading-relaxed ${status === 'error' ? 'text-rose-300' : 'text-zinc-400'}`} role={status === 'error' ? 'alert' : 'status'}>
              {statusText}
            </p>
            {progress !== null && <progress aria-label="Progreso del modelo" className="mt-2 w-full" max={1} value={progress} />}
          </div>
          {streamedText && <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 text-xs text-zinc-300 lg:col-span-2">{streamedText}</pre>}
        </aside>
      </div>

      {results.length > 0 && (
        <div className={`mt-4 grid gap-3 ${results.length > 1 ? 'md:grid-cols-2' : ''}`} aria-label="Resultados del experimento">
          {results.map((result) =>
            result.error ? (
              <article key={result.label} className="rounded-lg border border-rose-900 bg-rose-950/20 p-4">
                <h3 className="font-bold text-rose-200">{result.label} no produjo una salida válida</h3>
                <p className="mt-3 text-sm leading-relaxed text-rose-100">{result.error}</p>
              </article>
            ) : (
              <article key={result.label} className="rounded-lg border border-fuchsia-900 bg-zinc-950 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-fuchsia-200">{result.label}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">WebGPU · {result.elapsedMs} ms</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{result.text}</p>
                {result.warning && (
                  <p className="mt-4 border-l-2 border-amber-400 bg-amber-950/30 px-3 py-2 text-xs leading-relaxed text-amber-100">
                    <strong className="block text-amber-300">Advertencia del modelo</strong>
                    {result.warning}
                  </p>
                )}
              </article>
            ),
          )}
        </div>
      )}

      {results.some((result) => !result.error) && (
        <div className="mt-4 rounded-lg border border-cyan-900 bg-cyan-950/20 p-4">
          <label className="block text-sm font-bold text-cyan-100">
            {lab.observationPrompt}
            <textarea
              aria-label="Conclusión del experimento"
              className="mt-2 min-h-20 w-full rounded border border-cyan-900 bg-zinc-950 p-2 text-sm text-zinc-100"
              value={observation}
              onChange={(event) => {
                setObservation(event.target.value);
                setReviewed(false);
              }}
            />
          </label>
          <button type="button" className="mt-3 flex items-center gap-2 rounded bg-cyan-300 px-3 py-2 text-xs font-black text-zinc-950 disabled:opacity-40" disabled={observation.trim().length < 12} onClick={() => setReviewed(true)}>
            <CheckCircle2 size={14} /> Marcar experimento revisado
          </button>
          {reviewed && (
            <p className="mt-2 text-xs font-bold text-emerald-300" role="status">
              Experimento revisado. Conserva la conclusión y cambia una sola variable en la siguiente ejecución.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
