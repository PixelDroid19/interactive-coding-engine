import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrainCircuit, ChevronDown, ChevronUp, LoaderCircle, Play, ShieldCheck } from 'lucide-react';
import { BrowserApiProvider, ProviderSessionStore } from '../../engine/ai/browserApiProvider';
import { LocalEmbeddingService, type EmbeddingResult } from '../../engine/ai/localEmbeddingService';
import type { BrowserProviderConfig } from '../../engine/ai/learningProvider';
import { ProviderSettings } from './ProviderSettings';

const DOCUMENTS = [
  'Cómo restablecer la contraseña de una cuenta.',
  'Guía para cambiar el método de pago.',
  'Pasos para cancelar una suscripción.',
];

function cosine(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let index = 0; index < length; index++) {
    dot += a[index] * b[index];
    aa += a[index] * a[index];
    bb += b[index] * b[index];
  }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}

export function AILearningLab() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('No recuerdo mi clave para entrar');
  const [embeddingState, setEmbeddingState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [embeddingResult, setEmbeddingResult] = useState<EmbeddingResult | null>(null);
  const [embeddingMessage, setEmbeddingMessage] = useState('El modelo se descarga solo cuando pulses Probar embeddings.');
  const [providerConfig, setProviderConfig] = useState<BrowserProviderConfig | null>(null);
  const [providerPrompt, setProviderPrompt] = useState('Resume en una frase qué es un embedding.');
  const [providerOutput, setProviderOutput] = useState('');
  const [providerState, setProviderState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const service = useRef<LocalEmbeddingService | null>(null);
  const store = useMemo(() => new ProviderSessionStore(), []);

  useEffect(() => () => service.current?.dispose(), []);

  const ranking = useMemo(() => {
    if (!embeddingResult) return [];
    const [queryVector, ...documentVectors] = embeddingResult.vectors;
    return DOCUMENTS.map((text, index) => ({ text, score: cosine(queryVector, documentVectors[index]) }))
      .sort((a, b) => b.score - a.score);
  }, [embeddingResult]);

  const runEmbeddings = async () => {
    setEmbeddingState('loading');
    setEmbeddingMessage('Preparando el modelo local…');
    service.current ??= new LocalEmbeddingService();
    try {
      const result = await service.current.embed([query, ...DOCUMENTS], {
        onProgress: (progress) => setEmbeddingMessage(progress.label),
      });
      setEmbeddingResult(result);
      setEmbeddingState('ready');
      setEmbeddingMessage(result.warning ?? `Modelo local listo: ${result.model}`);
    } catch (error) {
      setEmbeddingState('error');
      setEmbeddingMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const runProvider = async () => {
    if (!providerConfig) return;
    setProviderState('loading');
    setProviderOutput('');
    try {
      const response = await new BrowserApiProvider(providerConfig).generate({
        messages: [
          { role: 'system', content: 'Responde en español, de forma breve y didáctica.' },
          { role: 'user', content: providerPrompt },
        ],
        temperature: 0.2,
        maxTokens: 180,
      });
      setProviderOutput(response.text);
      setProviderState('ready');
    } catch (error) {
      setProviderOutput(error instanceof Error ? error.message : String(error));
      setProviderState('error');
    }
  };

  return (
    <section className="mt-5 border-2 border-zinc-700 bg-zinc-950 text-zinc-100 shadow-[5px_5px_0_#000]" aria-labelledby="ai-lab-title">
      <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="flex items-center gap-2"><BrainCircuit size={18} className="text-yellow-300" /><strong id="ai-lab-title">Laboratorio de IA en el navegador</strong></span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="grid gap-4 border-t border-zinc-700 p-4 lg:grid-cols-2">
          <article className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
            <div className="mb-3 flex items-start gap-2"><ShieldCheck size={18} className="mt-0.5 text-emerald-400" /><div><h3 className="font-bold">Embeddings locales</h3><p className="text-sm text-zinc-400">El texto se procesa en este dispositivo. La primera carga descarga el modelo.</p></div></div>
            <label className="block text-sm font-semibold">Consulta<input className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 p-2 text-zinc-100" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <button type="button" className="mt-3 flex items-center gap-2 rounded bg-yellow-300 px-3 py-2 font-bold text-zinc-950 disabled:opacity-60" disabled={!query.trim() || embeddingState === 'loading'} onClick={runEmbeddings}>{embeddingState === 'loading' ? <LoaderCircle className="animate-spin" size={16} /> : <Play size={16} />} Probar embeddings</button>
            <p className={`mt-2 text-xs ${embeddingState === 'error' ? 'text-rose-300' : embeddingResult?.mode === 'teaching-fallback' ? 'text-amber-300' : 'text-zinc-400'}`} role="status">{embeddingMessage}</p>
            {ranking.length > 0 && <ol className="mt-3 space-y-2">{ranking.map((item) => <li key={item.text} className="flex justify-between gap-3 rounded bg-zinc-950 p-2 text-sm"><span>{item.text}</span><code>{item.score.toFixed(3)}</code></li>)}</ol>}
          </article>
          <article className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
            <ProviderSettings scope="ai-engineer-lab" store={store} onConfigured={setProviderConfig} />
            {providerConfig && <div className="mt-4 border-t border-zinc-700 pt-4"><label className="block text-sm font-semibold">Mensaje de prueba<textarea className="mt-1 min-h-20 w-full rounded border border-zinc-600 bg-zinc-950 p-2 text-zinc-100" value={providerPrompt} onChange={(event) => setProviderPrompt(event.target.value)} /></label><button type="button" className="mt-3 flex items-center gap-2 rounded bg-violet-500 px-3 py-2 font-bold text-white disabled:opacity-60" disabled={!providerPrompt.trim() || providerState === 'loading'} onClick={runProvider}>{providerState === 'loading' ? <LoaderCircle className="animate-spin" size={16} /> : <Play size={16} />} Probar API</button>{providerOutput && <pre className={`mt-3 whitespace-pre-wrap rounded bg-zinc-950 p-3 text-sm ${providerState === 'error' ? 'text-rose-300' : 'text-zinc-200'}`} role={providerState === 'error' ? 'alert' : 'status'}>{providerOutput}</pre>}</div>}
          </article>
        </div>
      )}
    </section>
  );
}
