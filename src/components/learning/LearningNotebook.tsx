import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, FileText, Trash2 } from 'lucide-react';
import type { LearningProfile, NotebookEntry } from '../../learning/types';
import { UiButton } from '../ui/UiButton';
import { UiField } from '../ui/UiField';

export type NotebookSaveInput = Omit<NotebookEntry, 'id' | 'updatedAt'> & { id?: string };

interface LearningNotebookProps {
  courseId: string;
  profile: LearningProfile;
  onSave: (entry: NotebookSaveInput) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}

function noteLabel(note: NotebookEntry): string {
  return note.title.trim() || 'Nota sin título';
}

export const LearningNotebook: React.FC<LearningNotebookProps> = ({ courseId, profile, onSave, onDelete }) => {
  const notes = useMemo(
    () => profile.notebook.filter((entry) => entry.courseId === courseId).sort((left, right) => right.updatedAt - left.updatedAt),
    [courseId, profile.notebook],
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [baseRevision, setBaseRevision] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [remoteConflict, setRemoteConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remoteEditingNote = editingId ? notes.find((note) => note.id === editingId) : undefined;

  useEffect(() => {
    if (!editingId || !remoteEditingNote || baseRevision === remoteEditingNote.updatedAt) return;
    if (dirty) {
      setRemoteConflict(true);
      return;
    }
    setTitle(remoteEditingNote.title);
    setBody(remoteEditingNote.body);
    setBaseRevision(remoteEditingNote.updatedAt);
    setRemoteConflict(false);
  }, [baseRevision, dirty, editingId, remoteEditingNote]);

  const resetComposer = () => {
    setTitle('');
    setBody('');
    setEditingId(null);
    setBaseRevision(null);
    setDirty(false);
    setRemoteConflict(false);
    setSaveError('');
  };

  const beginEdit = (note: NotebookEntry) => {
    setTitle(note.title);
    setBody(note.body);
    setEditingId(note.id);
    setBaseRevision(note.updatedAt);
    setDirty(false);
    setRemoteConflict(false);
    setSaveError('');
  };

  const reloadRemote = () => {
    if (!remoteEditingNote) return;
    setTitle(remoteEditingNote.title);
    setBody(remoteEditingNote.body);
    setBaseRevision(remoteEditingNote.updatedAt);
    setDirty(false);
    setRemoteConflict(false);
    setSaveError('');
  };

  const save = async () => {
    if (!body.trim() || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await onSave({
        ...(editingId ? { id: editingId } : {}),
        courseId,
        title: title.trim(),
        body: body.trim(),
        ...(remoteEditingNote?.itemId ? { itemId: remoteEditingNote.itemId } : {}),
      });
      resetComposer();
    } catch {
      setSaveError('No se pudo guardar la nota. Tu borrador sigue aquí para que puedas reintentar.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (noteId: string) => {
    if (deletingId) return;
    setDeletingId(noteId);
    try {
      await onDelete(noteId);
      if (editingId === noteId) resetComposer();
      setPendingDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const markDirty = (change: () => void) => {
    change();
    setDirty(true);
    setRemoteConflict(false);
    setSaveError('');
  };

  return (
    <section className="learning-notebook">
      <header className="learning-notebook__intro">
        <div>
          <span>CUADERNO PERSONAL</span>
          <h3>{editingId ? 'Editar nota' : 'Anota lo que te resulte útil'}</h3>
          <p>Una idea, una duda o un ejemplo basta. El curso se asocia automáticamente.</p>
        </div>
        {editingId && <UiButton variant="quiet" onClick={resetComposer} disabled={saving}>Cancelar edición</UiButton>}
      </header>

      <div className="learning-notebook__composer">
        <UiField label="Título de la nota" hint="Opcional. El curso se asocia automáticamente.">
          <input
            value={title}
            maxLength={120}
            disabled={saving}
            onChange={(event) => markDirty(() => setTitle(event.target.value))}
            placeholder="Opcional, por ejemplo: retorno de funciones"
          />
        </UiField>
        <UiField label="Nota">
          <textarea
            value={body}
            maxLength={12000}
            rows={5}
            disabled={saving}
            onChange={(event) => markDirty(() => setBody(event.target.value))}
            placeholder="Escribe una idea, duda, ejemplo o recordatorio…"
          />
        </UiField>
        {remoteConflict && (
          <div className="learning-notebook__conflict" role="alert">
            <p>Esta nota cambió en otro lugar. Conservamos tu borrador para que no pierdas lo que escribiste.</p>
            <button type="button" onClick={reloadRemote} disabled={saving}>Recargar copia remota</button>
          </div>
        )}
        {saveError && <p className="learning-notebook__error" role="alert">{saveError}</p>}
        <UiButton variant="primary" onClick={() => void save()} disabled={saving || !body.trim()}>
          {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar nota'}
        </UiButton>
      </div>

      <section className="learning-notebook__saved" aria-labelledby="saved-notes-title">
        <div className="learning-section-heading">
          <div>
            <span>TUS APUNTES</span>
            <h3 id="saved-notes-title">Notas guardadas</h3>
          </div>
          <strong>{notes.length}</strong>
        </div>
        {notes.length === 0 ? (
          <div className="learning-notebook__empty">
            <FileText size={20} aria-hidden="true" />
            <p>Cuando guardes una nota aparecerá aquí. No necesitas completar una plantilla.</p>
          </div>
        ) : (
          <div className="learning-notebook__list">
            {notes.map((note) => {
              const label = noteLabel(note);
              const confirmingDelete = pendingDeleteId === note.id;
              return (
                <article key={note.id} className={editingId === note.id ? 'is-editing' : ''}>
                  <header>
                    <div>
                      <h4>{label}</h4>
                      <small>
                        {note.itemId ? `Lección ${note.itemId} · ` : ''}
                        {new Date(note.updatedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </small>
                    </div>
                    <div className="learning-notebook__note-actions">
                      <button type="button" aria-label={`Editar ${label}`} onClick={() => beginEdit(note)} disabled={saving || Boolean(deletingId)}><Edit3 size={15} /></button>
                      <button type="button" aria-label={`Eliminar ${label}`} onClick={() => setPendingDeleteId(note.id)} disabled={saving || Boolean(deletingId)}><Trash2 size={15} /></button>
                    </div>
                  </header>
                  <p>{note.body}</p>
                  {confirmingDelete && (
                    <div className="learning-notebook__delete-confirm" role="group" aria-label={`Confirmar eliminación de ${label}`}>
                      <span>¿Eliminar esta nota?</span>
                      <button type="button" onClick={() => void remove(note.id)} disabled={Boolean(deletingId)}>Confirmar eliminación</button>
                      <button type="button" onClick={() => setPendingDeleteId(null)} disabled={Boolean(deletingId)}>Conservar nota</button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
};
