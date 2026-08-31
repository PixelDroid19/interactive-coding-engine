import React, { useEffect, useMemo, useState } from 'react';
import type { LearningProfile, NotebookEntry } from '../../learning/types';

interface LearningNotebookProps {
  courseId: string;
  profile: LearningProfile;
  onSave: (entry: Omit<NotebookEntry, 'id' | 'updatedAt'>) => Promise<void>;
}

type Draft = Pick<NotebookEntry, 'mentalModel' | 'pattern' | 'ownExample' | 'personalMistake'>;
const EMPTY: Draft = { mentalModel: '', pattern: '', ownExample: '', personalMistake: '' };

export const LearningNotebook: React.FC<LearningNotebookProps> = ({ courseId, profile, onSave }) => {
  const skills = useMemo(() => [...new Set(profile.evidence.filter((evidence) => evidence.courseId === courseId).map((evidence) => evidence.skillId))].sort(), [courseId, profile.evidence]);
  const [skillId, setSkillId] = useState(skills[0] ?? 'primer-concepto');
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!skills.includes(skillId) && skills[0]) setSkillId(skills[0]);
  }, [skillId, skills]);

  useEffect(() => {
    const entry = profile.notebook.find((candidate) => candidate.courseId === courseId && candidate.skillId === skillId);
    setDraft(entry ? {
      mentalModel: entry.mentalModel,
      pattern: entry.pattern,
      ownExample: entry.ownExample,
      personalMistake: entry.personalMistake,
    } : EMPTY);
  }, [courseId, profile.notebook, skillId]);

  useEffect(() => {
    setSaved(false);
    setSaveError('');
  }, [courseId, skillId]);

  const update = (field: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setSaveError('');
  };

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await onSave({ courseId, skillId, concept: skillId.replace(/-/g, ' '), ...draft });
      setSaved(true);
    } catch {
      setSaved(false);
      setSaveError('No se pudo guardar tu ficha. El borrador sigue aquí para que puedas reintentar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="learning-notebook">
      <div className="learning-notebook__intro">
        <h3>Tu explicación corta, no otra documentación</h3>
        <p>Guarda lo que te ayuda a reconstruir el concepto cuando vuelvas dentro de una semana.</p>
      </div>
      <label>Concepto<select value={skillId} disabled={saving} onChange={(event) => setSkillId(event.target.value)}>{skills.length ? skills.map((skill) => <option key={skill} value={skill}>{skill.replace(/-/g, ' ')}</option>) : <option value="primer-concepto">Primer concepto</option>}</select></label>
      <label>Modelo mental<textarea rows={2} value={draft.mentalModel} disabled={saving} onChange={(event) => update('mentalModel', event.target.value)} placeholder="Lo imagino como…" /></label>
      <label>Patrón que quiero recordar<textarea rows={2} value={draft.pattern} disabled={saving} onChange={(event) => update('pattern', event.target.value)} placeholder="Cuando aparece…, hago…" /></label>
      <label>Mi ejemplo<textarea rows={3} value={draft.ownExample} disabled={saving} onChange={(event) => update('ownExample', event.target.value)} placeholder="Un caso distinto al curso…" /></label>
      <label>Error que ya cometí<textarea rows={2} value={draft.personalMistake} disabled={saving} onChange={(event) => update('personalMistake', event.target.value)} placeholder="Me confundí cuando…" /></label>
      {saveError && <p className="learning-notebook__error" role="alert">{saveError}</p>}
      <button type="button" className="learning-primary" onClick={() => void save()} disabled={saving || !Object.values(draft).some((value) => value.trim())}>{saving ? 'Guardando…' : saveError ? 'Reintentar guardado' : saved ? 'Guardado' : 'Guardar ficha'}</button>
    </section>
  );
};
