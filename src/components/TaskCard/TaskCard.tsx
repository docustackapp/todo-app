import { useState } from 'react';
import { motion } from 'framer-motion';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { EventHandler, SyntheticEvent } from 'react';
import type { Task } from '../../types/index';
import CategoryBadge from '../CategoryBadge/CategoryBadge';

// Defined inline to avoid importing from @dnd-kit internal package paths.
// @dnd-kit/core does NOT export SyntheticListenerMap in its public 'exports' field.
// Using the internal path '@dnd-kit/core/dist/hooks/utilities' risks AC-02 failure
// under moduleResolution:'bundler'. This inline definition is equivalent at runtime.
type SyntheticListenerMap = Record<string, EventHandler<SyntheticEvent>>;

export interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  isDragging?: boolean;
  dragHandleListeners?: SyntheticListenerMap;
  dragHandleAttributes?: DraggableAttributes;
}

export default function TaskCard({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
  isDragging = false,
  dragHandleListeners,
  dragHandleAttributes,
}: TaskCardProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  function handleEditSave() {
    if (editText.trim()) {
      onEdit(task.id, editText.trim());
    } else {
      setEditText(task.text);
    }
    setIsEditing(false);
  }

  function handleEditCancel() {
    setEditText(task.text);
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  }

  return (
    <motion.div
      className={`group flex flex-col gap-1 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:-rotate-1 hover:scale-[1.02] transition-transform duration-150 ease-in-out${isDragging ? ' opacity-60 shadow-xl' : ''}`}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <button
          className="text-gray-300 dark:text-gray-600 hover:text-gray-500 cursor-grab active:cursor-grabbing select-none"
          aria-label="Drag to reorder"
          {...(dragHandleListeners ?? {})}
          {...(dragHandleAttributes ?? {})}
        >
          ⋮⋮
        </button>

        {/* Checkbox */}
        <button
          role="checkbox"
          aria-checked={task.completed}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors${
            task.completed
              ? ' bg-todoodle-teal border-todoodle-teal text-white'
              : ' border-gray-300 dark:border-gray-600 hover:border-todoodle-teal'
          }`}
          onClick={() => onToggleComplete(task.id)}
        >
          {task.completed && '✓'}
        </button>

        {/* Task text */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-b border-todoodle-teal outline-none text-gray-900 dark:text-gray-100 text-sm"
              autoFocus
            />
          ) : (
            <span
              className={`text-gray-900 dark:text-gray-100 text-sm truncate block${
                task.completed ? ' line-through opacity-50' : ''
              }`}
              onDoubleClick={() => setIsEditing(true)}
            >
              {task.text}
            </span>
          )}
        </div>

        {/* Edit button */}
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
          onClick={() => setIsEditing(true)}
          aria-label="Edit task"
        >
          ✏️
        </button>

        {/* Delete button */}
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 text-sm"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
        >
          🗑️
        </button>
      </div>

      {/* CategoryBadge */}
      {task.categoryId !== null && (
        <div className="pl-12">
          <CategoryBadge categoryId={task.categoryId} />
        </div>
      )}
    </motion.div>
  );
}
