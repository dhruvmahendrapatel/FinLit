import { toISODate } from "@finlit/core";
import { useEffect, useState } from "react";

/** Today's ISO date; re-evaluated every minute so midnight rolls over. */
export function useToday(): string {
  const [today, setToday] = useState(() => toISODate(new Date()));
  useEffect(() => {
    const id = setInterval(() => {
      const next = toISODate(new Date());
      setToday((prev) => (prev === next ? prev : next));
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}
