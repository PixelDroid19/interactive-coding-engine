import React from 'react';
import { Course, CurriculumItem, UserProgressRecord } from '../../types/curriculum';
import { Clock, ChevronRight } from 'lucide-react';

interface CourseOverviewProps {
  course: Course;
  progress: UserProgressRecord;
  onSelectItem: (item: CurriculumItem, moduleId: string) => void;
  introOnly?: boolean;
  modulesOnly?: boolean;
}

export const CourseOverview: React.FC<CourseOverviewProps> = ({
  course,
  progress,
  onSelectItem,
  introOnly = false,
  modulesOnly = false,
}) => {
  const allItems: CurriculumItem[] = [];
  course.modules.forEach((mod) => allItems.push(...mod.items));

  const completedCount = allItems.filter((it) => progress.completedItemIds.includes(it.id)).length;
  const totalCount = allItems.length;
  const percentage = Math.round((completedCount / (totalCount || 1)) * 100);

  const intro = (
    <div className="course-hero">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <span className="category-tag">{course.level === 'Beginner' ? 'Desde cero' : course.level}</span>
        <span className="timestamp-text">{percentage}% hecho</span>
      </div>
      <h1 className="topbar-app-name" style={{ fontSize: 28, lineHeight: 1.1, marginBottom: 10 }}>
        {course.title}
      </h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.55 }}>
        {course.description}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 18,
          paddingTop: 14,
          borderTop: '2px dashed rgba(35, 39, 51, 0.2)',
        }}
      >
        <div className="lesson-num-badge">{course.instructor.name.charAt(0)}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{course.instructor.name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{course.instructor.role}</div>
        </div>
      </div>
    </div>
  );

  const modules = (
    <div className="home-modules">
      {course.modules.map((module) => (
        <section key={module.id}>
          <div className="module-heading">
            <div>
              <h3>{module.title}</h3>
              {module.description && <p className="module-desc">{module.description}</p>}
            </div>
            <span className="timestamp-text">{module.items.length} lecciones</span>
          </div>

          <div className="lesson-list">
            {module.items.map((item, itemIdx) => {
              const isCompleted = progress.completedItemIds.includes(item.id);
              const isRecent = progress.lastAccessedItemId === item.id;
              const n = String(itemIdx + 1).padStart(2, '0');

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectItem(item, module.id)}
                  className={`lesson-row ${isRecent ? 'lesson-row-active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      className={`lesson-num-badge ${
                        isCompleted ? 'lesson-num-badge-completed' : isRecent ? 'lesson-num-badge-active' : ''
                      }`}
                    >
                      {n}
                    </div>
                    <span className="lesson-row-title">{item.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span className="timestamp-text" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {item.estimatedMinutes}m
                    </span>
                    <ChevronRight size={16} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  if (introOnly) return intro;
  if (modulesOnly) return modules;

  return (
    <div className="home-modules">
      {intro}
      {modules}
    </div>
  );
};
