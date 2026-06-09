import { useEffect, useRef } from 'react';
import { getStoredTokens } from '../api/axios';

interface SSEOptions {
  onJobUpdate?: (data: unknown) => void;
  onMessage?: (event: MessageEvent) => void;
  enabled?: boolean;
}

export function useSSE({ onJobUpdate, onMessage, enabled = true }: SSEOptions) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const tokens = getStoredTokens();
    if (!tokens?.access) return;

    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    const url = `${base}/api/jobs/sse`;
    // EventSource doesn't support custom headers; pass token as query param
    const es = new EventSource(`${url}?token=${tokens.access}`);
    esRef.current = es;

    es.addEventListener('job_updated', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onJobUpdate?.(data);
      } catch { /* noop */ }
    });

    if (onMessage) es.onmessage = onMessage;

    es.onerror = () => {
      es.close();
      esRef.current = null;
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [enabled]);
}
