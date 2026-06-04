import { useEffect, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function usePrefetchOnHover(prefetchFn: Function, delay: number = 65) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = () => (timer.current = setTimeout(prefetchFn, delay));

  const onMouseLeave = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  // useEffect to clear the timer on unmount
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { onMouseEnter, onMouseLeave };
}
