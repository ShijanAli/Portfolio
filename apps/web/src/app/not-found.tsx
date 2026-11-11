import { ButtonLink } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="font-mono text-sm tracking-[0.2em] text-accent-text uppercase">404</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-7xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <ButtonLink href="/" className="mt-8">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
