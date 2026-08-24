import React from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Code2, Route } from 'lucide-react';
import { Course, UserProgressRecord } from '../../types/curriculum';

interface CourseCatalogProps {
  courses: Course[];
  progress: UserProgressRecord;
  onOpenCourse: (courseId: string) => void;
  onPlayground: () => void;
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({ courses, progress, onOpenCourse, onPlayground }) => (
  <div className="course-catalog">
    <header className="course-catalog__nav">
      <div className="course-catalog__brand"><Route size={18} /> Aprende<span>Código</span></div>
      <button type="button" className="rm-play-btn" onClick={onPlayground}><Code2 size={14} /> Playground</button>
    </header>
    <main className="course-catalog__main">
      <section className="course-catalog__intro">
        <p className="rm-pill">Rutas de aprendizaje</p>
        <h1>Elige qué quieres aprender</h1>
        <p>Cada curso conserva su propio recorrido. Puedes volver cuando quieras y continuar desde la última actividad.</p>
      </section>
      <section className="course-catalog__grid" aria-label="Cursos disponibles">
        {courses.map((course, index) => {
          const items = course.modules.flatMap((module) => module.items);
          const completed = items.filter((item) => progress.completedItemIds.includes(item.id)).length;
          const lessons = items.filter((item) => item.type === 'scrim').length;
          const percent = items.length ? Math.round((completed / items.length) * 100) : 0;
          return (
            <article key={course.id} className={`course-card course-card--${index % 2 ? 'blue' : 'yellow'}`}>
              <div className="course-card__topline">
                <span>{course.level === 'Beginner' ? 'Desde cero' : course.level}</span>
                <span>{lessons} clases</span>
              </div>
              <div className="course-card__icon"><BookOpen size={25} /></div>
              <h2>{course.title}</h2>
              <p>{course.tagline}</p>
              <div className="course-card__tags">{course.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="course-card__progress" aria-label={`${percent}% completado`}>
                <div><span style={{ width: `${percent}%` }} /></div>
                <small>{completed > 0 ? `${percent}% completado` : 'Listo para empezar'}</small>
              </div>
              <button
                type="button"
                onClick={() => onOpenCourse(course.id)}
                aria-label={`${completed > 0 ? 'Continuar curso' : 'Ver recorrido'}: ${course.title}`}
              >
                {completed > 0 ? <><CheckCircle2 size={16} /> Continuar curso</> : <>Ver recorrido <ArrowRight size={16} /></>}
              </button>
            </article>
          );
        })}
      </section>
    </main>
  </div>
);
