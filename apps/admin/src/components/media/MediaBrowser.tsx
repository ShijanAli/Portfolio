import { FileText, Search, Upload } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Input, Select } from '@/components/ui/inputs';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/cn';
import { humanize } from '@/lib/format';
import {
  isImage,
  MEDIA_FOLDERS,
  useMediaList,
  useMediaUpload,
  type Media,
  type MediaFolder,
} from './useMedia';

const FOLDER_OPTIONS = MEDIA_FOLDERS.map((value) => ({ value, label: humanize(value) }));
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif,application/pdf';
const PAGE_SIZE = 24;

interface MediaBrowserProps {
  /** Folder new uploads go into, and the initial filter. */
  defaultFolder?: MediaFolder;
  /** Only offer images, e.g. when picking a cover photo. */
  imagesOnly?: boolean;
  /** Called when a file is clicked. */
  onSelect: (media: Media) => void;
  selectedId?: string;
  /** Extra controls rendered on each tile, e.g. a delete button. */
  tileActions?: (media: Media) => ReactNode;
}

/**
 * Browse, search and upload files. The media library page and the picker modal are both
 * this component with a different `onSelect`.
 */
export function MediaBrowser({
  defaultFolder,
  imagesOnly,
  onSelect,
  selectedId,
  tileActions,
}: MediaBrowserProps) {
  const [folder, setFolder] = useState<string>(defaultFolder ?? '');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const fileInput = useRef<HTMLInputElement>(null);

  const list = useMediaList({
    page: 1,
    limit,
    folder: folder || undefined,
    search: useDebouncedValue(search) || undefined,
  });
  const upload = useMediaUpload((folder || defaultFolder || 'general') as MediaFolder);

  const files = (list.data?.items ?? []).filter((media) => !imagesOnly || isImage(media));
  const hasMore = (list.data?.meta.total ?? 0) > limit;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            aria-label="Search files"
            placeholder="Search files..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          aria-label="Folder"
          className="w-auto"
          options={FOLDER_OPTIONS}
          placeholder="All folders"
          value={folder}
          onChange={(event) => setFolder(event.target.value)}
        />
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          accept={imagesOnly ? ACCEPT.replace(',application/pdf', '') : ACCEPT}
          onChange={(event) => {
            const chosen = [...(event.target.files ?? [])];
            if (chosen.length > 0) upload.mutate(chosen);
            event.target.value = '';
          }}
        />
        <Button
          className="ml-auto"
          loading={upload.isPending}
          onClick={() => fileInput.current?.click()}
        >
          <Upload className="size-4" />
          Upload
        </Button>
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : list.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          title="No files here"
          description="Upload images (JPEG, PNG, WebP, AVIF, GIF) or PDFs up to 8 MB."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {files.map((media) => (
            <li key={media.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(media)}
                title={media.filename}
                className={cn(
                  'block w-full cursor-pointer overflow-hidden rounded-lg border bg-bg text-left transition-colors hover:border-accent',
                  selectedId === media.id ? 'border-accent ring-2 ring-accent/40' : 'border-border',
                )}
              >
                {isImage(media) ? (
                  <img
                    src={media.url}
                    alt={media.alt ?? ''}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <span className="grid aspect-square w-full place-items-center text-muted">
                    <FileText className="size-8" />
                  </span>
                )}
                <span className="block truncate border-t border-border px-2 py-1.5 text-xs text-muted">
                  {media.filename}
                </span>
              </button>
              {tileActions && (
                <div className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  {tileActions(media)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="mt-4 text-center">
          <Button
            variant="secondary"
            size="sm"
            loading={list.isFetching}
            onClick={() => setLimit(limit + PAGE_SIZE)}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
