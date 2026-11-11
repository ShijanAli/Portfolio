import { env, isTest } from '@/config/env';
import { logger } from './logger';

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailAddress;
  subject: string;
  html: string;
  replyTo?: EmailAddress;
  headers?: Record<string, string>;
}

interface MailProvider {
  send(message: EmailMessage): Promise<void>;
}

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

const brevoProvider = (apiKey: string): MailProvider => ({
  async send(message) {
    const response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: env.MAIL_FROM_NAME, email: env.MAIL_FROM_EMAIL },
        to: [message.to],
        subject: message.subject,
        htmlContent: message.html,
        replyTo: message.replyTo,
        headers: message.headers,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`Brevo responded ${response.status}: ${await response.text()}`);
    }
  },
});

/** Development fallback: nothing leaves the machine. */
const logProvider: MailProvider = {
  async send(message) {
    logger.info(
      { to: message.to.email, subject: message.subject },
      'Email logged, not sent (BREVO_API_KEY is not set)',
    );
  },
};

/** Tests read what would have been sent from here. */
export const testOutbox: EmailMessage[] = [];

const testProvider: MailProvider = {
  async send(message) {
    testOutbox.push(message);
  },
};

function selectProvider(): MailProvider {
  if (isTest) return testProvider;
  return env.BREVO_API_KEY ? brevoProvider(env.BREVO_API_KEY) : logProvider;
}

const provider = selectProvider();

export const sendEmail = (message: EmailMessage) => provider.send(message);

/**
 * For emails that must not delay or fail the request that triggered them
 * (notifications, confirmations). Failures are logged.
 */
export function sendEmailInBackground(message: EmailMessage): void {
  void sendEmail(message).catch((error: unknown) => {
    logger.error({ err: error, to: message.to.email, subject: message.subject }, 'Email failed');
  });
}
