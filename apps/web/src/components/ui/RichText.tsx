import { cn } from '@/lib/cn';

/**
 * Renders HTML written in the admin's editor. The API sanitizes this HTML when it is saved
 * (scripts, event handlers and unknown tags are removed), which is what makes inserting it
 * directly safe.
 */
export function RichText({ html, className }: { html: string; className?: string }) {
  return <div className={cn('prose', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
