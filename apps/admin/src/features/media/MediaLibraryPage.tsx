import { Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { MediaBrowser } from '@/components/media/MediaBrowser';
import { isImage, useMediaActions, type Media } from '@/components/media/useMedia';
import { useConfirm } from '@/components/modal/ConfirmProvider';
import { Modal } from '@/components/modal/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/inputs';
import { formatDateTime } from '@/lib/format';

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function copyUrl(url: string) {
  await navigator.clipboard.writeText(url);
  toast.success('URL copied');
}

function MediaDetails({ media, onClose }: { media: Media; onClose: () => void }) {
  const { updateAlt } = useMediaActions();
  const [alt, setAlt] = useState(media.alt ?? '');

  return (
    <Modal open onClose={onClose} title={media.filename}>
      <div className="space-y-4">
        {isImage(media) && (
          <img
            src={media.url}
            alt={media.alt ?? ''}
            className="max-h-72 w-full rounded-lg border border-border object-contain"
          />
        )}
        <p className="text-muted">
          {media.mimeType} · {formatSize(media.size)}
          {media.width && media.height ? ` · ${media.width}×${media.height}` : ''} ·{' '}
          {formatDateTime(media.createdAt)}
        </p>
        <div className="flex gap-2">
          <Input
            readOnly
            aria-label="File URL"
            value={media.url}
            onFocus={(event) => event.target.select()}
          />
          <Button variant="secondary" onClick={() => void copyUrl(media.url)}>
            <Copy className="size-4" />
            Copy
          </Button>
        </div>
        <div>
          <label htmlFor="media-alt" className="mb-1.5 block font-medium">
            Description (alt text)
          </label>
          <div className="flex gap-2">
            <Input
              id="media-alt"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="What the image shows"
            />
            <Button
              loading={updateAlt.isPending}
              disabled={alt === (media.alt ?? '')}
              onClick={() => updateAlt.mutate({ id: media.id, alt }, { onSuccess: onClose })}
            >
              Save
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted">Read by screen readers and search engines.</p>
        </div>
      </div>
    </Modal>
  );
}

export function MediaLibraryPage() {
  const [open, setOpen] = useState<Media | null>(null);
  const { remove } = useMediaActions();
  const confirm = useConfirm();

  const deleteFile = async (media: Media) => {
    const confirmed = await confirm({
      title: `Delete ${media.filename}?`,
      description: 'Pages that use this file will show a broken image.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (confirmed) remove.mutate(media.id);
  };

  return (
    <>
      <PageHeader title="Media library" description="Images and documents used across your site." />
      <MediaBrowser
        onSelect={setOpen}
        tileActions={(media) => (
          <Button
            variant="danger"
            size="icon"
            aria-label={`Delete ${media.filename}`}
            onClick={() => void deleteFile(media)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      />
      {open && <MediaDetails media={open} onClose={() => setOpen(null)} />}
    </>
  );
}
