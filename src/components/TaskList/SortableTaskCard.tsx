import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import TaskCard from '../TaskCard/TaskCard';
import type { TaskCardProps } from '../TaskCard/TaskCard';
import type { Task } from '../../types/index';

export interface SortableTaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

export function SortableTaskCard({ task, onToggleComplete, onDelete, onEdit }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.8 }}
      transition={{ duration: 0.3, type: 'spring', bounce: 0.25 }}
      layout
    >
      <TaskCard
        task={task}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        onEdit={onEdit}
        isDragging={isDragging}
        dragHandleListeners={listeners as TaskCardProps['dragHandleListeners']}
        dragHandleAttributes={attributes}
      />
    </motion.div>
  );
}

export default SortableTaskCard;
