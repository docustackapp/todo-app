import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import type { Task } from '../../types/index';
import { SortableTaskCard } from './SortableTaskCard';

export interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onReorder: (activeId: string, overId: string) => void;
}

export function TaskList({ tasks, onToggleComplete, onDelete, onEdit, onReorder }: TaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // v1.1: Pass IDs directly from DndContext event — no index lookup needed here.
  // The hook resolves indices against the FULL tasks array, not filteredTasks,
  // eliminating the filtered-index mismatch bug.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(active.id as string, over.id as string);
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-600">
        <p className="text-4xl mb-4">🎨</p>
        <p className="text-lg">Nothing here yet! Add something fun ✨</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </AnimatePresence>
      </SortableContext>
    </DndContext>
  );
}

export default TaskList;
