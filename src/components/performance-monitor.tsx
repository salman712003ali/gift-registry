'use client'

import { useEffect } from 'react'
import { monitoring } from '@/lib/monitoring'

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
}

export function PerformanceMonitor() {
  useEffect(() => {
    // Track page load performance
    if (typeof window !== 'undefined') {
      // Track First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          monitoring.trackPerformance({
            name: 'FCP',
            value: entry.startTime
          })
        })
      })
      fcpObserver.observe({ entryTypes: ['paint'] })

      // Track Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          monitoring.trackPerformance({
            name: 'LCP',
            value: entry.startTime
          })
        })
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // Track First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const fidEntry = entry as FirstInputEntry
          monitoring.trackPerformance({
            name: 'FID',
            value: fidEntry.processingStart - entry.startTime
          })
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // Track Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const clsEntry = entry as LayoutShiftEntry
          monitoring.trackPerformance({
            name: 'CLS',
            value: clsEntry.value
          })
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })

      // Cleanup observers on unmount
      return () => {
        fcpObserver.disconnect()
        lcpObserver.disconnect()
        fidObserver.disconnect()
        clsObserver.disconnect()
      }
    }
  }, [])

  return null
} 