import { Modal } from '@/components/modal/Modal';
import { MediaBrowser } from './MediaBrowser';
import type { Media, MediaFolder } from './useMedia';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (media: Media) => void;
  defaultFolder?: MediaFolder;
}

/** Choose an image from the library, or upload a new one, without leaving the form. */
export function MediaPickerModal({ open, onClose, onPick, defaultFolder }: MediaPickerModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Choose an image" size="lg">
      <MediaBrowser
        imagesOnly
        defaultFolder={defaultFolder}
        onSelect={(media) => {
          onPick(media);
          onClose();
        }}
      />
    </Modal>
  );
}
