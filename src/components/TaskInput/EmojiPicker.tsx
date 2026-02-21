export const EMOJI_LIST = [
  '😀', '🎉', '🔥', '💡', '⭐', '🚀', '💪', '🎯', '🌈', '❤️',
  '🍕', '☕', '🎵', '📚', '🌟', '🐶', '🦄', '👑', '💎', '⚡',
] as const;

export interface EmojiPickerProps {
  isOpen: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ isOpen, onSelect, onClose }: EmojiPickerProps) {
  if (!isOpen) return null;

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div
      className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-2 z-10"
      role="dialog"
      aria-label="Emoji picker"
    >
      <div className="grid grid-cols-5 gap-1">
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleEmojiClick(emoji)}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={`Add emoji ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
