import React, { useCallback, useEffect, useState } from 'react';
import { ArrowBigUp, GitPullRequest, Lightbulb, X } from 'lucide-react';
import { UiButton } from '../components/ui/UiButton';
import { UiField } from '../components/ui/UiField';
import { UiSurface } from '../components/ui/UiSurface';
import {
  improvementApi,
  type AdminImprovementProposal,
  type ImprovementCycle,
  type ImprovementProposal,
  type ImprovementTarget,
} from '../services/improvementApi';

const TARGET_LABEL: Record<ImprovementTarget, string> = {
  practice: 'Prácticas', lesson: 'Lecciones', playground: 'Playground', accessibility: 'Accesibilidad', interface: 'Interfaz',
};
const PROPOSAL_STATUS_LABEL: Record<ImprovementProposal['status'], string> = {
  open: 'Abierta', queued: 'En cola', building: 'Construyendo', preview: 'Validando despliegue',
  published: 'Desplegado', rejected: 'Rechazada', failed: 'Falló', grouped: 'Agrupada con otra idea',
};
const RUN_STATUS_LABEL: Record<AdminImprovementProposal['runs'][number]['status'], string> = {
  queued: 'en cola', running: 'construyendo', succeeded: 'publicado', rejected: 'rechazado',
  failed: 'falló', timed_out: 'agotó el tiempo',
};

function safePullRequestUrl(value: string | null | undefined): string | null {
  if (!value || !URL.canParse(value)) return null;
  const url = new URL(value);
  return url.protocol === 'https:' && url.hostname === 'github.com'
    && /^\/PixelDroid19\/interactive-coding-engine\/pull\/[1-9][0-9]*$/.test(url.pathname)
    && !url.search && !url.hash ? url.href : null;
}

export function ImprovementCenter({ canAdmin, onClose }: { canAdmin: boolean; onClose(): void }) {
  const [items, setItems] = useState<readonly (ImprovementProposal | AdminImprovementProposal)[]>([]);
  const [cycles, setCycles] = useState<readonly ImprovementCycle[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetArea, setTargetArea] = useState<ImprovementTarget>('practice');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [proposals, recentCycles] = await Promise.all([
        canAdmin ? improvementApi.listAdmin() : improvementApi.list(),
        improvementApi.listCycles(),
      ]);
      setItems(proposals);
      setCycles(recentCycles);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos cargar las propuestas.'); }
  }, [canAdmin]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [onClose]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy('create'); setError(null);
    try {
      await improvementApi.create({ title: title.trim(), description: description.trim(), targetArea });
      setTitle(''); setDescription(''); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos enviar la propuesta.'); }
    finally { setBusy(null); }
  }

  async function vote(item: ImprovementProposal) {
    setBusy(item.id); setError(null);
    try { await improvementApi.vote(item.id, !item.votedByMe); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos registrar tu voto.'); }
    finally { setBusy(null); }
  }

  return <div className="improvement-center" role="dialog" aria-modal="true" aria-label="Mejorar la plataforma" aria-describedby="improvement-flow-description">
    <UiSurface as="main" className="improvement-center__panel">
      <header className="improvement-center__header">
        <div><span>Mejoras de la comunidad</span><h2>Construyamos una plataforma mejor</h2><p id="improvement-flow-description">Propón una mejora y vota. Cada 30 minutos, agrupamos ideas parecidas y contamos personas únicas. Muse revisa la ganadora, la implementa, la valida y la despliega. Si producción falla, revierte el cambio.</p></div>
        <UiButton variant="icon" data-dialog-initial-focus onClick={onClose} aria-label="Cerrar"><X size={20} /></UiButton>
      </header>
      {error && <p className="improvement-center__error" role="alert">{error}</p>}
      <div className="improvement-center__grid">
        <form className="improvement-compose" onSubmit={(event) => void create(event)}>
          <div className="improvement-compose__title"><Lightbulb size={20} /><div><h3>Propón una mejora</h3><p>Describe un problema concreto y el resultado que esperas.</p></div></div>
          <UiField label="Título corto"><input value={title} onChange={(event) => setTitle(event.target.value)} minLength={5} maxLength={120} required /></UiField>
          <UiField label="Área"><select value={targetArea} onChange={(event) => setTargetArea(event.target.value as ImprovementTarget)}>{Object.entries(TARGET_LABEL).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></UiField>
          <UiField label="Qué debería mejorar"><textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={20} maxLength={2000} required placeholder="Ejemplo: en esta práctica no queda claro qué resultado debo obtener…" /></UiField>
          <UiButton variant="primary" type="submit" disabled={busy === 'create' || title.trim().length < 5 || description.trim().length < 20}>{busy === 'create' ? 'Enviando…' : 'Enviar propuesta'}</UiButton>
        </form>
        <section className="improvement-list" aria-label="Propuestas de la comunidad">
          <header><h3>Propuestas</h3><small>{items.length === 1 ? '1 propuesta visible' : `${items.length} propuestas visibles`}</small></header>
          {cycles[0] && <UiSurface as="aside" className="improvement-cycle" aria-label="Resultado del último ciclo">
            <div><span>Último ciclo</span><small>{new Date(cycles[0].closedAt).toLocaleString('es-CO')}</small></div>
            <strong>{cycles[0].winner.title}</strong>
            <p>{cycles[0].candidateCount} propuestas · {cycles[0].clusterCount} grupos · {cycles[0].winningScore} personas apoyaron al ganador</p>
            <small>{cycles[0].rationale}</small>
          </UiSurface>}
          {items.map((item) => {
            const adminItem = item as AdminImprovementProposal;
            const latestRun = Array.isArray(adminItem.runs) ? adminItem.runs[0] : undefined;
            const pullRequestUrl = safePullRequestUrl(latestRun?.pullRequestUrl);
            return <UiSurface as="article" className="improvement-card" key={item.id}>
              <div className="improvement-card__meta"><span>{TARGET_LABEL[item.targetArea]}</span><small>{PROPOSAL_STATUS_LABEL[item.status]}</small></div>
              <h4>{item.title}</h4><p>{item.description}</p>
              <footer>
                <UiButton variant={item.votedByMe ? 'primary' : 'secondary'} disabled={Boolean(busy) || canAdmin || item.status !== 'open'} onClick={() => void vote(item)} aria-label={`${item.votedByMe ? 'Quitar voto de' : 'Votar por'} ${item.title}`}><ArrowBigUp size={16} /> {item.votes}</UiButton>
              </footer>
              {latestRun && <div className="improvement-run">
                <strong>{latestRun.status === 'succeeded' ? 'Desplegado y verificado' : `Muse: ${RUN_STATUS_LABEL[latestRun.status]}`}</strong>
                {latestRun.validation?.ci === 'passed' && <span className="improvement-run__ci improvement-run__ci--passed">CI aprobada</span>}
                {latestRun.validation?.ci === 'failed' && <span className="improvement-run__ci improvement-run__ci--failed">CI fallida</span>}
                {latestRun.summary && <p>{latestRun.summary}</p>}
                {pullRequestUrl && latestRun.pullRequestNumber && <a className="improvement-run__pr" href={pullRequestUrl} target="_blank" rel="noopener noreferrer"><GitPullRequest size={15} /> Ver PR #{latestRun.pullRequestNumber}</a>}
                {latestRun.changedFiles?.length > 0 && <ul>{latestRun.changedFiles.map((file) => <li key={file.path}>{file.path} <small>+{file.added} −{file.deleted}</small></li>)}</ul>}
              </div>}
            </UiSurface>;
          })}
          {items.length === 0 && !error && <p className="improvement-list__empty">Todavía no hay propuestas. Puedes abrir la primera.</p>}
        </section>
      </div>
    </UiSurface>
  </div>;
}
