import { useState, useCallback, useMemo } from 'react';
import type { Task } from '../types/index';
import { generateId } from '../utils/id';
import { readState, writeState } from '../utils/localStorage';
import { triggerConfetti } from '../utils/confetti';

export interface UseTasksReturn {
  tasks: Task[];
  filteredTasks: Task[];
  activeFilter: string | null;
  addTask: (text: string, categoryId: string | null) => void;
  deleteTask: (id: string) => void;
  editTask: (id: string, text: string) => void;
  toggleComplete: (id: string) => void;
  reorderTasks: (activeId: string, overId: string) => void;
  setActiveFilter: (categoryId: string | null) => void;
}

/**
 * Central task-management hook.
 *
 * State is initialised from localStorage and persisted on every mutation
 * using a read-before-write strategy so that the `theme` slice managed by
 * useTheme is never overwritten.
 */
export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>(() => readState().tasks);
  const [activeFilter, setActiveFilterState] = useState<string | null>(
    () => readState().activeFilter,
  );

  /**
   * Persist helper: reads the full current AppState so the `theme` slice
   * (owned by useTheme) is preserved, then writes the updated tasks and
   * activeFilter values.
   */
  const persist = useCallback(
    (newTasks: Task[], newFilter: string | null) => {
      const current = readState();
      writeState({ ...current, tasks: newTasks, activeFilter: newFilter });
    },
    [],
  );

  const addTask = useCallback(
    (text: string, categoryId: string | null) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setTasks((prev) => {
        const newTask: Task = {
          id: generateId(),
          text: trimmed,
          completed: false,
          categoryId,
          order: prev.length,
          createdAt: new Date().toISOString(),
        };
        const next = [...prev, newTask];
        persist(next, activeFilter);
        return next;
      });
    },
    [activeFilter, persist],
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const next = prev
          .filter((t) => t.id !== id)
          .map((t, i) => ({ ...t, order: i }));
        persist(next, activeFilter);
        return next;
      });
    },
    [activeFilter, persist],
  );

  const editTask = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setTasks((prev) => {
        const next = prev.map((t) =>
          t.id === id ? { ...t, text: trimmed } : t,
        );
        persist(next, activeFilter);
        return next;
      });
    },
    [activeFilter, persist],
  );

  /**
   * Toggles the `completed` field of the task with the given id.
   * Fires confetti exactly once on the false→true transition.
   */
  const toggleComplete = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const next = prev.map((t) => {
          if (t.id !== id) return t;
          const wasCompleted = t.completed;
          if (!wasCompleted) {
            triggerConfetti();
          }
          return { ...t, completed: !wasCompleted };
        });
        persist(next, activeFilter);
        return next;
      });
    },
    [activeFilter, persist],
  );

  /**
   * ID-based reorder (v1.1 signature).
   * Resolves positions internally on the full unfiltered tasks array so that
   * dragging works correctly even when a category filter is active.
   */
  const reorderTasks = useCallback(
    (activeId: string, overId: string) => {
      setTasks((prev) => {
        const oldIndex = prev.findIndex((t) => t.id === activeId);
        const newIndex = prev.findIndex((t) => t.id === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, moved);
        const reindexed = next.map((t, i) => ({ ...t, order: i }));
        persist(reindexed, activeFilter);
        return reindexed;
      });
    },
    [activeFilter, persist],
  );

  const setActiveFilter = useCallback(
    (categoryId: string | null) => {
      setActiveFilterState(categoryId);
      persist(tasks, categoryId);
    },
    [tasks, persist],
  );

  const filteredTasks = useMemo(
    () =>
      activeFilter === null
        ? tasks
        : tasks.filter((t) => t.categoryId === activeFilter),
    [tasks, activeFilter],
  );

  return {
    tasks,
    filteredTasks,
    activeFilter,
    addTask,
    deleteTask,
    editTask,
    toggleComplete,
    reorderTasks,
    setActiveFilter,
  };
}
