import React from 'react';
import { Course, CurriculumItem, UserProgressRecord } from '../../types/curriculum';
import {
  Play,
  CheckCircle2,
  Circle,
  HelpCircle,
  Bug,
  Rocket,
  Clock,
  Radio,
  BookOpen,
  Award,
  Sparkles,
  ChevronRight,
  Code2
} from 'lucide-react';

interface CourseOverviewProps {
  course: Course;
  progress: UserProgressRecord;
  onSelectItem: (item: CurriculumItem, moduleId: string) => void;
}

export const CourseOverview: React.FC<CourseOverviewProps> = ({
  course,
  progress,
  onSelectItem,
}) => {
  // Calculate total items and completed items
  const allItems: CurriculumItem[] = [];
  course.modules.forEach((mod) => allItems.push(...mod.items));

  const completedCount = allItems.filter((it) => progress.completedItemIds.includes(it.id)).length;
  const totalCount = allItems.length;
  const percentage = Math.round((completedCount / (totalCount || 1)) * 100);

  const getItemIcon = (type: CurriculumItem['type']) => {
    switch (type) {
      case 'scrim':
        return <Radio className="h-4 w-4 text-sky-400" />;
      case 'challenge':
        return <Sparkles className="h-4 w-4 text-amber-400" />;
      case 'debugging':
        return <Bug className="h-4 w-4 text-rose-400" />;
      case 'solo-project':
        return <Rocket className="h-4 w-4 text-indigo-400" />;
    }
  };

  const getItemTypeBadge = (type: CurriculumItem['type']) => {
    switch (type) {
      case 'scrim':
        return (
          <span className="rounded bg-sky-950/80 border border-sky-800/80 px-2 py-0.5 text-[10px] font-mono font-medium text-sky-300">
            Lección viva
          </span>
        );
      case 'challenge':
        return (
          <span className="rounded bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-300">
            In-Lesson Challenge
          </span>
        );
      case 'debugging':
        return (
          <span className="rounded bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 text-[10px] font-mono font-medium text-rose-300">
            Debugging Lab
          </span>
        );
      case 'solo-project':
        return (
          <span className="rounded bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 text-[10px] font-mono font-medium text-indigo-300">
            Solo Project
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Course Banner Header */}
      <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="rounded bg-zinc-800 border border-zinc-700/60 text-zinc-200 px-2.5 py-0.5 text-xs font-semibold">
              {course.level === 'Beginner' ? 'Desde cero' : course.level}
            </span>
            {course.tags.map((tag) => (
              <span key={tag} className="text-xs text-zinc-400 font-mono">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Progreso</div>
              <div className="text-xs font-semibold text-zinc-200">{percentage}% hecho</div>
            </div>
            <div className="w-24 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-zinc-300 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            {course.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
            {course.description}
          </p>
        </div>

        {/* Instructor Info */}
        <div className="pt-3.5 border-t border-zinc-800/80 flex items-center gap-3">
          {course.instructor.avatarUrl ? (
            <img
              src={course.instructor.avatarUrl}
              alt={course.instructor.name}
              className="h-9 w-9 rounded-full object-cover border border-zinc-700"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold">
              {course.instructor.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="text-xs font-medium text-zinc-200">{course.instructor.name}</div>
            <div className="text-[11px] text-zinc-400">{course.instructor.role}</div>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-5">
        {course.modules.map((module, modIdx) => (
          <div
            key={module.id}
            className="rounded-xl bg-[#141416] border border-zinc-800/80 overflow-hidden shadow-sm"
          >
            <div className="px-5 py-3 bg-[#111113] border-b border-zinc-800/80 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-100 text-xs sm:text-sm">{module.title}</h3>
                {module.description && (
                  <p className="text-[11px] text-zinc-400 mt-0.5">{module.description}</p>
                )}
              </div>
              <span className="text-[11px] font-mono text-zinc-400">{module.items.length} lecciones</span>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {module.items.map((item, itemIdx) => {
                const isCompleted = progress.completedItemIds.includes(item.id);
                const isRecent = progress.lastAccessedItemId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item, module.id)}
                    className={`group flex items-center justify-between px-5 py-3 hover:bg-white/5 cursor-pointer transition-colors ${
                      isRecent ? 'bg-zinc-800/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      {/* Completion status glyph */}
                      <div className="shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : isRecent ? (
                          <div className="h-4 w-4 rounded-full border border-zinc-400 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-zinc-200" />
                          </div>
                        ) : (
                          <Circle className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 truncate">
                        <div className="p-1 rounded bg-zinc-900 border border-zinc-800 shrink-0">
                          {getItemIcon(item.type)}
                        </div>
                        <span
                          className={`text-xs font-medium truncate ${
                            isCompleted
                              ? 'text-zinc-300'
                              : isRecent
                              ? 'text-zinc-100 font-semibold'
                              : 'text-zinc-300 group-hover:text-white'
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {getItemTypeBadge(item.type)}
                      <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {item.estimatedMinutes}m
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
