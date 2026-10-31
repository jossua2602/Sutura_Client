import type { ReactNode } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/shared/PublicNav';

export interface LegalSection {
  readonly heading: string;
  readonly body: ReactNode;
}

/**
 * Shared shell for /privacy and /terms: plain reading layout, same public
 * nav and canvas as the rest of the customer-facing site. Google's OAuth
 * consent screen links to these pages, so they must stay public.
 */
export default function LegalPage({ title, updated, intro, sections }: {
  readonly title: string;
  readonly updated: string;
  readonly intro: ReactNode;
  readonly sections: readonly LegalSection[];
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav featureNav />
      <main className="flex-1 mobile-screen-margins py-10 sm:py-16">
        <article className="mx-auto w-full max-w-2xl">
          <h1 className="mobile-h1 sm:tablet-h1 text-ink mb-2">{title}</h1>
          <p className="mobile-caption text-ink-muted mb-6">Last updated {updated}</p>
          <div className="mobile-body-md sm:tablet-body-md text-ink-body space-y-4 mb-10">{intro}</div>

          <div className="space-y-8">
            {sections.map((s) => (
              <section key={s.heading} className="border-t border-line pt-6">
                <h2 className="text-lg font-semibold text-ink mb-3">{s.heading}</h2>
                <div className="mobile-body-md sm:tablet-body-md text-ink-body space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-12 border-t border-line pt-6 mobile-caption text-ink-muted">
            See also: <Link href="/privacy" className="font-semibold text-taupe hover:text-taupe-hover">Privacy Policy</Link>
            {' · '}
            <Link href="/terms" className="font-semibold text-taupe hover:text-taupe-hover">Terms of Service</Link>
          </p>
        </article>
      </main>
    </div>
  );
}
