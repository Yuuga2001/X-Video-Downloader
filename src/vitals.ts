type Metric = {
  name: string;
  value: number;
  id: string;
};

export const reportWebVitals = (onReport?: (metric: Metric) => void) => {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return;
  }

  const report =
    onReport ??
    ((metric: Metric) => {
      if (import.meta.env.DEV) {
        console.log('[Vitals]', metric.name, metric.value);
      }
    });

  let cls = 0;
  let lcp = 0;

  try {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
        if (!shift.hadRecentInput) {
          cls += shift.value ?? 0;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch {
    // Ignore unsupported browsers.
  }

  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        lcp = last.startTime;
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Ignore unsupported browsers.
  }

  const flush = () => {
    report({ name: 'CLS', value: cls, id: 'cls' });
    report({ name: 'LCP', value: lcp, id: 'lcp' });
  };

  window.addEventListener('pagehide', flush);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });
};
