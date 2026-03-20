export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatTime(seconds: number) {
  return `0:${String(seconds).padStart(2, "0")}`;
}
