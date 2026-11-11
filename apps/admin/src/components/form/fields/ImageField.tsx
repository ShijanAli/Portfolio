import { ImagePlus, X } from 'lucide-react';
import { useState } from 'react';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import { Button } from '@/components/ui/Button';

interface ImageFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

/** One image, chosen from the media library. Stores the image URL. */
export function ImageField({ id, value, onChange }: ImageFieldProps) {
  const [picking, setPicking] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img
          src={value}
          alt=""
          className="size-16 shrink-0 rounded-lg border border-border object-cover"
        />
      ) : (
        <span className="grid size-16 shrink-0 place-items-center rounded-lg border border-dashed border-border text-muted">
          <ImagePlus className="size-5" />
        </span>
      )}
      <div className="flex gap-2">
        <Button id={id} variant="secondary" size="sm" onClick={() => setPicking(true)}>
          {value ? 'Change' : 'Choose image'}
        </Button>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange('')}>
            <X className="size-4" />
            Remove
          </Button>
        )}
      </div>
      <MediaPickerModal
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(media) => onChange(media.url)}
      />
    </div>
  );
}

interface ImagesFieldProps {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
}

/** A gallery: an ordered list of image URLs. */
export function ImagesField({ id, value, onChange }: ImagesFieldProps) {
  const [picking, setPicking] = useState(false);

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {value.map((url) => (
          <li key={url} className="relative">
            <img
              src={url}
              alt=""
              className="size-20 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange(value.filter((other) => other !== url))}
              className="absolute -top-1.5 -right-1.5 cursor-pointer rounded-full border border-border bg-surface p-0.5 text-muted hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
        <li>
          <button
            id={id}
            type="button"
            aria-label="Add image"
            onClick={() => setPicking(true)}
            className="grid size-20 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted hover:border-accent hover:text-fg"
          >
            <ImagePlus className="size-5" />
          </button>
        </li>
      </ul>
      <MediaPickerModal
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(media) => !value.includes(media.url) && onChange([...value, media.url])}
      />
    </div>
  );
}
