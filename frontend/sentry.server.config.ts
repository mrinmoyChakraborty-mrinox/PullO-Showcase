import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b01391d1a9210169ad3ea58c8aafcef4@o4511719557038080.ingest.de.sentry.io/4511719571456080",
  tracesSampleRate: 0.1,
});
