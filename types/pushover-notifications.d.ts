declare module 'pushover-notifications' {
  interface PushoverOptions {
    user: string;
    token: string;
  }
  
  interface PushoverMessage {
    message: string;
    title?: string;
  }
  
  class Pushover {
    constructor(options: PushoverOptions);
    send(message: PushoverMessage, callback: (err: any, res: any) => void): void;
  }
  
  export = Pushover;
}
