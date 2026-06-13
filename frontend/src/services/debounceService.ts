/**
 * @desc Create a debounced function that delays invoking the provided function until after delay milliseconds have elapsed since the last time it was invoked.
 * @input {Function} fn - The function to debounce.
 * @input {number} delay - The number of milliseconds to delay.
 * @output {Function} A new debounced function.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
