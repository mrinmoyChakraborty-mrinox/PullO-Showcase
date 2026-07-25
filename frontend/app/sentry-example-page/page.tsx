"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Sentry Test</h1>
      <button
        className="rounded bg-red-600 px-4 py-2 text-white"
        onClick={() => {
          Sentry.captureException(new Error("Sentry test error from the frontend!"));
        }}
      >
        Send Error to Sentry
      </button>
    </main>
  );
}
