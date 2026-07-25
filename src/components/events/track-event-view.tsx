"use client";

import { useEffect, useRef } from "react";
import { recordEventView } from "@/app/events/actions";

/** Zapisuje jedno wyświetlenie po otwarciu strony wydarzenia. */
export function TrackEventView({ eventId }: { eventId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void recordEventView(eventId);
  }, [eventId]);

  return null;
}
