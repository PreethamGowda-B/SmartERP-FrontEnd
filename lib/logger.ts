import * as Sentry from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (message: any, ...args: any[]) => {
    // Errors are always logged to console
    console.error(message, ...args);

    // Capture to Sentry in production
    if (!isDev) {
      // Try to find an Error object in the arguments
      const errorObj = message instanceof Error ? message : args.find(a => a instanceof Error);
      const context = {
        arguments: args,
        message: typeof message === 'string' ? message : undefined
      };

      if (errorObj) {
        Sentry.captureException(errorObj, { extra: context });
      } else {
        Sentry.captureMessage(typeof message === 'string' ? message : "An unknown error occurred", {
          level: "error",
          extra: context,
        });
      }
    }
  },
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  }
};
