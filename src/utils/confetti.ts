import confetti from 'canvas-confetti';

/**
 * Fires a confetti burst. Called exactly once per false→true task completion.
 * canvas-confetti is mocked in unit tests.
 */
export function triggerConfetti(): void {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}
