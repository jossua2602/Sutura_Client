import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { type LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service | SUTURA',
  description: 'The rules for using SUTURA as a customer or a tailoring shop.',
};

const SECTIONS: LegalSection[] = [
  {
    heading: 'Your account',
    body: (
      <p>
        Give accurate information and keep your password safe. You are responsible for what happens under your
        account. Shop owners are responsible for the staff accounts they create.
      </p>
    ),
  },
  {
    heading: 'Orders and payments',
    body: (
      <>
        <p>
          Orders, prices, deposits, fittings and pickup are agreed between you and the shop. SUTURA records them
          so both sides can track progress, but the shop is responsible for the work it accepts.
        </p>
        <p>
          SUTURA does not take or hold payments. Payments are made directly to the shop, and SUTURA only records
          the amounts and receipts you or the shop provide.
        </p>
      </>
    ),
  },
  {
    heading: 'Shops',
    body: (
      <p>
        Shops must describe their services and prices honestly, keep customer information private, and use it
        only to serve that customer. Shop applications and branch locations are reviewed before they appear
        publicly, and a subscription plan may be required for some features.
      </p>
    ),
  },
  {
    heading: 'Acceptable use',
    body: (
      <ul>
        <li>Don&apos;t upload content that is false, offensive or not yours to share.</li>
        <li>Don&apos;t try to access other people&apos;s accounts or data, or disrupt the service.</li>
        <li>Don&apos;t use SUTURA to send spam or misleading messages.</li>
      </ul>
    ),
  },
  {
    heading: 'Changes and availability',
    body: (
      <p>
        We may update SUTURA and these terms. We try to keep the service running, but it may sometimes be
        unavailable. We may suspend accounts that break these terms.
      </p>
    ),
  },
  {
    heading: 'Privacy',
    body: (
      <p>
        How we handle your information is described in our{' '}
        <Link href="/privacy" className="font-semibold text-taupe hover:text-taupe-hover">Privacy Policy</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="October 31, 2026"
      intro={
        <p>
          These terms apply to everyone who uses SUTURA at suturaofficial.tech, whether you are ordering from a
          tailoring shop or running one. By creating an account, you agree to them.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
