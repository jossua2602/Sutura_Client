'use client';

import { LayoutGrid } from 'lucide-react';
import type { PublicService } from '../types';

export interface ServiceGroup {
  value: string;
  label: string;
  services: PublicService[];
}

/**
 * One storefront category (Uniform, Alterations & Repairs…): its name and "View services", which opens the
 * category's services in a dialog (ServiceCategoryModal).
 *
 * No photo: the only photo available was the first service's, so a "Uniform" card showing a PNP uniform read as
 * "this shop only does PNP uniforms". Each service shows its own photo inside the dialog.
 * Same card frame as the admin console (admin-card: 1.5px warm border, 14px corners, soft shadow).
 */
export default function ServiceCategoryCard({ group, onViewCatalog }: Readonly<{
  group: ServiceGroup;
  onViewCatalog: () => void;
}>) {
  const count = group.services.length;

  return (
    <article className="admin-card group flex w-[78%] min-[480px]:w-[46%] md:w-[31.5%] lg:w-[23.6%] shrink-0 snap-start flex-col p-4 sm:p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-line-strong hover:shadow-[0_4px_14px_rgba(45,42,38,0.08)]">
      <h3 className="text-base sm:text-lg font-medium leading-snug text-ink line-clamp-2">{group.label}</h3>

      <button
        type="button"
        onClick={onViewCatalog}
        aria-haspopup="dialog"
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-sunken text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <LayoutGrid size={15} aria-hidden="true" />
        View services
        <span className="text-xs font-normal text-ink-muted tabular-nums">({count})</span>
      </button>
    </article>
  );
}
