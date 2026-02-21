import { useState } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { CATEGORIES } from '../../constants/categories';
import EmojiPicker from './EmojiPicker';

export const PLACEHOLDERS = [
  'Teach a parrot to code... 🦜',
  'Buy more sticky notes... 📝',
  'Defeat the final boss... 🎮',
  'Eat that frog first thing... 🐸',
  'Reorganize the sock drawer... 🧦',
  'Learn to juggle flaming tasks... 🔥',
] as const;

export interface TaskInputProps {
  onAdd: (text: string, categoryId: string | null) => void;
}

export default function TaskInput({ onAdd }: TaskInputProps) {
  const [text, setText] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState<string>(PLACEHOLDERS[0]);

  const handleFocus = () => {
    setPlaceholder(PLACEHOLDERS[Date.now() % 6 as 0 | 1 | 2 | 3 | 4 | 5]);
  };

  const handleSubmit = () => {
    if (text.trim() === '') return;
    onAdd(text.trim(), categoryId);
    setText('');
    setEmojiPickerOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setCategoryId(value === '' ? null : value);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {/* Emoji picker toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setEmojiPickerOpen((prev) => !prev)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle emoji picker"
            aria-expanded={emojiPickerOpen}
          >
            😊
          </button>
          <EmojiPicker
            isOpen={emojiPickerOpen}
            onSelect={handleEmojiSelect}
            onClose={() => setEmojiPickerOpen(false)}
          />
        </div>

        {/* Text input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium"
          aria-label="New task text"
        />

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-todoodle-coral text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          aria-label="Add task"
        >
          +
        </button>
      </div>

      {/* Category selector */}
      <select
        value={categoryId ?? ''}
        onChange={handleCategoryChange}
        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 text-sm font-medium outline-none"
        aria-label="Select category"
      >
        <option value="">None</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.emoji} {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}
