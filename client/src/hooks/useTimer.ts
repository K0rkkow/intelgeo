import { useEffect, useRef, useState, useCallback } from "react";

export function useTimer(initial: number, onExpire: () => void, active: boolean) {
  const [remaining, setRemaining] = useState(initial);
  const ref = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const clear = useCallback(() => {
    if (ref.current) window.clearInterval(ref.current);
    ref.current = null;
  }, []);

  useEffect(() => {
    setRemaining(initial);
    clear();
    if (!active) return;
    ref.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clear();
          // defer to avoid state update during render
          setTimeout(() => onExpireRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clear;
  }, [initial, active, clear]);

  // reset when initial changes
  useEffect(() => { setRemaining(initial); }, [initial]);

  return { remaining, reset: (v: number) => setRemaining(v) };
}
