import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef } from "react";
import { Icon } from "./icon";

export type LightboxPhoto = { id: string; width: number; height: number };

/** An album photo at one of the widths /photos/<id> serves. */
export const sized = (id: string, width: 32 | 400 | 800 | 1200 | 2048) =>
  `/photos/${id}?w=${width}`;

const control =
  "grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-[background-color,scale] duration-150 ease-out hover:bg-white/20 active:scale-[0.96]";

/**
 * Full-screen viewer on a native <dialog>: focus trap, Escape and the backdrop
 * come with it. Arrow keys step through; the neighbours preload.
 */
export function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: LightboxPhoto[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const photo = photos[index];
  const step = (by: number) =>
    onIndex((index + by + photos.length) % photos.length);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    for (const by of [1, -1]) {
      const next = photos[(index + by + photos.length) % photos.length];
      new Image().src = sized(next.id, 2048);
    }
  }, [index, photos]);

  return (
    <dialog
      ref={dialog}
      aria-label={`Photo ${index + 1} of ${photos.length}`}
      className="lightbox"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialog.current?.close();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      }}
    >
      <img
        key={photo.id}
        src={sized(photo.id, 2048)}
        width={photo.width}
        height={photo.height}
        alt=""
        className="lightbox-image"
      />
      <div className="fixed inset-x-0 bottom-6 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => step(-1)}
          className={control}
        >
          <Icon icon={ArrowLeft01Icon} size={18} />
        </button>
        <span className="min-w-16 text-center text-sm text-white/80 tabular-nums">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => step(1)}
          className={control}
        >
          <Icon icon={ArrowRight01Icon} size={18} />
        </button>
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={() => dialog.current?.close()}
        className={`${control} fixed top-5 right-5`}
      >
        <Icon icon={Cancel01Icon} size={18} />
      </button>
    </dialog>
  );
}
