import { useEffect, useState } from 'react';

/**
 * Today's date, null until mounted. Rendering "today" during SSR bakes the
 * server's clock (UTC on Vercel) into the HTML, and React hydration does not
 * patch mismatched attributes — a wrong highlight would stick until the next
 * re-render. Null-until-mounted means the server emits no highlight at all.
 * Refreshes when the tab regains visibility/focus (midnight crossings,
 * suspended background tabs).
 */
export function useToday(): Date | null {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    const refresh = () => setToday(new Date());
    refresh();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return today;
}
