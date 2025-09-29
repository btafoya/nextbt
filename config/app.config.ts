// /config/app.config.ts
export const appConfig = {
  appName: "MantisLite",
  requirePrivateNotesRole: false, // if true, restrict private note viewing
  defaultPageSize: 50,

  // MantisBT configuration
  defaultTimezone: "America/New_York",
  reauthenticationExpiry: 120, // seconds
  allowSignup: false,
  allowAnonymousLogin: false,
  anonymousAccount: "",
  emailNotificationsVerbose: false,
  emailLoginEnabled: true,

  // MantisBT enum configurations
  severityEnum: '10:feature,20:trivial,30:text,40:tweak,50:minor,60:major,70:crash,80:block'
} as const;
