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
  statusEnum: '10:new,20:feedback,30:acknowledged,40:confirmed,50:assigned,80:resolved,90:closed',
  priorityEnum: '10:none,20:low,30:normal,40:high,50:urgent,60:immediate',
  severityEnum: '10:feature,20:trivial,30:text,40:tweak,50:minor,60:major,70:crash,80:block',
  reproducibilityEnum: '10:always,30:sometimes,50:random,70:have_not_tried,80:unable_to_reproduce,90:n/a'
} as const;
