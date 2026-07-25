import * as Sentry from "@sentry/nextjs"

export function track(name: string, value: number = 1, attributes?: Record<string, string>) {
  try {
    Sentry.metrics.count(name, value, { attributes })
  } catch {
    // metrics never throw in production
  }
}

export function trackDistribution(name: string, value: number, unit?: string, attributes?: Record<string, string>) {
  try {
    Sentry.metrics.distribution(name, value, { unit, attributes })
  } catch {
    // metrics never throw in production
  }
}
