"use client";

import { useEffect } from "react";

export function ReminderHeartbeat() {
  useEffect(() => {
    let cancelled = false;

    const sweep = async () => {
      try {
        await fetch("/api/reminders/sweep", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch {
        if (!cancelled) {
          // silent background sync
        }
      }
    };

    void sweep();
    const timer = window.setInterval(() => {
      void sweep();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
