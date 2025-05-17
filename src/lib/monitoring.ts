// Simple monitoring utility for tracking performance and errors
export const monitoring = {
  // Track page views
  trackPageView: (path: string) => {
    if (typeof window !== 'undefined') {
      // Send to Vercel Analytics
      if (window.va) {
        window.va('track', { path });
      }
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Page View: ${path}`);
      }
    }
  },

  // Track errors
  trackError: (error: Error, context?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      // Send to Vercel Analytics
      if (window.va) {
        window.va('track', {
          type: 'error',
          message: error.message,
          stack: error.stack,
          ...context
        });
      }
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error:', error, context);
      }
    }
  },

  // Track performance metrics
  trackPerformance: (metric: { name: string; value: number }) => {
    if (typeof window !== 'undefined') {
      // Send to Vercel Analytics
      if (window.va) {
        window.va('track', {
          type: 'performance',
          ...metric
        });
      }
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Performance:', metric);
      }
    }
  }
}; 