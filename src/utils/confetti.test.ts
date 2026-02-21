import { triggerConfetti } from './confetti';

// vi.mock is hoisted to the top of the file, so mockConfetti must be
// declared with vi.hoisted() to be accessible inside the factory.
const mockConfetti = vi.hoisted(() => vi.fn());

vi.mock('canvas-confetti', () => ({
  default: mockConfetti,
}));

describe('triggerConfetti', () => {
  beforeEach(() => {
    mockConfetti.mockClear();
  });

  it('calls canvas-confetti exactly once per triggerConfetti() invocation', () => {
    triggerConfetti();
    expect(mockConfetti.mock.calls.length).toBe(1);
  });

  it('does not call canvas-confetti before triggerConfetti() is invoked', () => {
    expect(mockConfetti.mock.calls.length).toBe(0);
  });

  it('calls canvas-confetti once per call when invoked multiple times', () => {
    triggerConfetti();
    triggerConfetti();
    expect(mockConfetti.mock.calls.length).toBe(2);
  });
});
