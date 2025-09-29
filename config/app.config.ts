// /config/app.config.ts
export const appConfig = {
  appName: "MantisLite",
  requirePrivateNotesRole: false, // if true, restrict private note viewing
  defaultPageSize: 50
} as const;
