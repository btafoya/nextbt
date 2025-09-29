declare module 'postmark' {
  export interface EmailMessage {
    From: string;
    To: string;
    Subject: string;
    HtmlBody?: string;
    TextBody?: string;
  }
  
  export class ServerClient {
    constructor(token: string);
    sendEmail(message: EmailMessage): Promise<any>;
  }
}
