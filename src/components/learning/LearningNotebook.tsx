import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { LearningProfile, NotebookEntry } from '../../learning/types';

interface LearningNotebookProps {
  courseId: string;
  profile: LearningProfile;
  onSave: (entry: Omit<NotebookEntry, 'id' | 'updatedAt'>) => Promise<void>;
}

type Draft = Pick<NotebookEntry, 'mentalModel' | 'pattern' | 'ownExample' | 'personalMistake'>;
const EMPTY: Draft = {
  mentalModel: '',
  pattern: '',
  ownExample: '',
  personalMistake: '',
};

function toDraft(entry: NotebookEntry | undefined): Draft {
  return entry
    ? {
        mentalModel: entry.mentalModel,
        pattern: entry.pattern,
        ownExample: entry.ownExample,
        personalMistake: entry.personalMistake,
      }
    : { ...EMPTY };
}

function revisionOf(entry: NotebookEntry | undefined): string {
  return entry ? `${entry.id}:${entry.updatedAt}` : 'empty';
}

export const LearningNotebook: React.FC<LearningNotebookProps> = ({ courseId, profile, onSave }) => {
  const skills = useMemo(
    () =>
      [
        ...new Set([
          ...profile.evidence.filter((evidence) => evidence.courseId === courseId).map((evidence) => evidence.skillId),
          ...profile.notebook.filter((entry) => entry.courseId === courseId).map((entry) => entry.skillId),
        ]),
      ].sort(),
    [courseId, profile.evidence, profile.notebook],
  );
  const [skillId, setSkillId] = useState(skills[0] ?? '');
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [baseRevision, setBaseRevision] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [remoteConflict, setRemoteConflict] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const activeEntryKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setSkillId((current) => (skills.includes(current) ? current : (skills[0] ?? '')));
  }, [skills]);

  const entry = useMemo(
    () => profile.notebook.find((candidate) => candidate.courseId === courseId && candidate.skillId === skillId),
    [courseId, profile.notebook, skillId],
  );
  const remoteDraft = useMemo(() => toDraft(entry), [entry]);
  const remoteRevision = revisionOf(entry);

  useEffect(() => {
    const entryKey = `${courseId}:${skillId}`;
    if (activeEntryKeyRef.current !== entryKey) {
      activeEntryKeyRef.current = entryKey;
      setDraft(remoteDraft);
      setBaseRevision(remoteRevision);
      setDirty(false);
      setRemoteConflict(false);
      return;
    }

    if (!dirty && baseRevision !== remoteRevision) {
      setDraft(remoteDraft);
      setBaseRevision(remoteRevision);
      setRemoteConflict(false);
      return;
    }

    if (dirty && baseRevision !== remoteRevision) {
      setRemoteConflict(true);
      setSaved(false);
    }
  }, [baseRevision, courseId, dirty, remoteDraft, remoteRevision, skillId]);

  useEffect(() => {
    setSaved(false);
    setSaveError('');
  }, [courseId, skillId]);

  const update = (field: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setDirty(true);
    setSaved(false);
    setSaveError('');
  };

  const reloadRemote = () => {
    setDraft(remoteDraft);
    setBaseRevision(remoteRevision);
    setDirty(false);
    setRemoteConflict(false);
    setSaved(false);
    setSaveError('');
  };

  const save = async () => {
    if (!skillId || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await onSave({
        courseId,
        skillId,
        concept: skillId.replace(/-/g, ' '),
        ...draft,
      });
      setDirty(false);
      setRemoteConflict(false);
      setSaved(true);
    } catch {
      setSaved(false);
      setSaveError('No se pudo guardar tu ficha. El borrador sigue aquí para que puedas reintentar.');
    } finally {
      setSaving(false);
    }
  };

  if (!skills.length) {
    return (
      <section className="learning-notebook learning-notebook--empty">
        <div className="learning-empty">
          <h3>Aún no hay conceptos para anotar</h3>
          <p>Cuando completes una lectura, práctica o desafío, podrás guardar una nota sobre lo que observaste.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="learning-notebook">
      <div className="learning-notebook__intro">
        <h3>Tu explicación corta, no otra documentación</h3>
        <p>Guarda lo que te ayuda a reconstruir el concepto cuando vuelvas dentro de una semana.</p>
      </div>
      <label>
        Concepto
        <select value={skillId} disabled={saving} onChange={(event) => setSkillId(event.target.value)}>
          {skills.map((skill) => (
            <option key={skill} value={skill}>
              {skill.replace(/-/g, ' ')}
            </option>
          ))}
        </select>
      </label>
      <label>
        Modelo mental
        <textarea
          rows={2}
          value={draft.mentalModel}
          disabled={saving}
          onChange={(event) => update('mentalModel', event.target.value)}
          placeholder="Lo imagino como…"
        />
      </label>
      <label>
        Patrón que quiero recordar
        <textarea
          rows={2}
          value={draft.pattern}
          disabled={saving}
          onChange={(event) => update('pattern', event.target.value)}
          placeholder="Cuando aparece…, hago…"
        />
      </label>
      <label>
        Mi ejemplo
        <textarea
          rows={3}
          value={draft.ownExample}
          disabled={saving}
          onChange={(event) => update('ownExample', event.target.value)}
          placeholder="Un caso distinto al curso…"
        />
      </label>
      <label>
        Error que ya cometí
        <textarea
          rows={2}
          value={draft.personalMistake}
          disabled={saving}
          onChange={(event) => update('personalMistake', event.target.value)}
          placeholder="Me confundí cuando…"
        />
      </label>
      {saveError && (
        <p className="learning-notebook__error" role="alert">
          {saveError}
        </p>
      )}
      {remoteConflict && (
        <div className="learning-notebook__conflict" role="alert">
          <p>Una copia remota cambió mientras editabas. Conservamos tu borrador para que elijas qué versión usar.</p>
          <button type="button" onClick={reloadRemote} disabled={saving}>
            Recargar copia remota
          </button>
        </div>
      )}
      <button type="button" className="learning-primary" onClick={() => void save()} disabled={saving || !Object.values(draft).some((value) => value.trim())}>
        {saving ? 'Guardando…' : saveError ? 'Reintentar guardado' : saved ? 'Guardado' : 'Guardar nota'}
      </button>
    </section>
  );
};
