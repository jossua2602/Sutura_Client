import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Pencil, Trash2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { CatalogItemResult } from '@/types/publicCatalog';
import CatalogDesignModal from './CatalogDesignModal';

/**
 * The single catalog-item card every customer-facing browse surface uses
 * (landing showroom, /search, store profile). Photos and descriptions only:
 * photo, name and the start of the description. Tapping it opens the design
 * in a modal (photos + full description) instead of a separate page.
 */
export default function CatalogItemCard({
  item,
  canManage,
  onDelete,
  hrefOverride,
  isPaused,
  reviewBadge,
}: {
  readonly item: CatalogItemResult;
  /** Kept for existing callers; distance is no longer shown on the card. */
  readonly userCoords?: { lat: number; lng: number } | null;
  /** Owner viewing their own store's catalog — shows an edit/delete overlay. */
  readonly canManage?: boolean;
  readonly onDelete?: (id: number) => void;
  /** Kept for existing callers; the card no longer shows a location. */
  readonly hideLocation?: boolean;
  /** Owner pages link to the design's own management page instead of opening the modal. */
  readonly hrefOverride?: string;
  /** Owner-only: this item is currently paused (is_active === false). */
  readonly isPaused?: boolean;
  /** Owner-only: the design's typed-in apparel name is in SUTURA review ("In review" / "Not approved"). */
  readonly reviewBadge?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const primaryImage = item.images.find((img) => img.is_primary)?.image_url ?? item.images[0]?.image_url;

  const body = (
    <>
      <div className="aspect-3/4 bg-sunken relative overflow-hidden shrink-0 w-full">
        {(isPaused || reviewBadge) && (
          <div className="absolute top-1.5 left-1.5 z-10 flex flex-col items-start gap-1">
            {isPaused && (
              <span className="px-2 py-0.5 bg-ink/85 text-white text-[9px] font-bold uppercase tracking-wider">Paused</span>
            )}
            {reviewBadge && (
              <span className="px-2 py-0.5 bg-taupe text-white text-[9px] font-bold uppercase tracking-wider">{reviewBadge}</span>
            )}
          </div>
        )}
        {primaryImage ? (
          <Image
            src={getMediaUrl(primaryImage)}
            alt={item.name}
            fill
            sizes="(max-width: 600px) 50vw, 300px"
            className={`object-cover object-top transition-transform duration-700 group-hover:scale-105 ${isPaused ? 'grayscale opacity-60' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store size={22} className="text-ink-faint" />
          </div>
        )}
      </div>

      <div className="p-2 sm:p-2.5 flex-1 flex flex-col gap-1.5 w-full">
        <h3 className="text-[13px] font-semibold text-ink line-clamp-2 leading-snug group-hover:text-taupe transition-colors min-h-9">
          {item.name}
        </h3>
        {/* Description (replaces the old location line). */}
        <p className="text-[11px] text-ink-muted leading-snug line-clamp-2 pt-1 border-t border-line/50">
          {item.description?.trim() || 'No description yet.'}
        </p>
      </div>
    </>
  );

  const cardClass =
    'flex flex-col w-full h-full bg-surface border border-line overflow-hidden hover:border-line-strong transition-colors text-left cursor-pointer';

  return (
    <div className="group relative w-full h-full">
      {canManage && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
          <Link
            href={`/dashboard/catalog/${item.id}`}
            aria-label="Edit catalog item"
            className="w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-white text-ink border border-line shadow-xs transition-colors"
          >
            <Pencil size={12} />
          </Link>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(item.id); }}
            aria-label="Delete catalog item"
            className="w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-rose-50 text-danger border border-line shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {hrefOverride ? (
        <Link href={hrefOverride} className={cardClass}>{body}</Link>
      ) : (
        <>
          <button type="button" onClick={() => setModalOpen(true)} className={cardClass} aria-haspopup="dialog">
            {body}
          </button>
          <CatalogDesignModal item={item} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </>
      )}
    </div>
  );
}
