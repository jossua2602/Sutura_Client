import type { Metadata } from 'next';
import LegalPage, { type LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | SUTURA',
  description: 'What information SUTURA collects, how it is used, and your choices.',
};

const SECTIONS: LegalSection[] = [
  {
    heading: 'Information we collect',
    body: (
      <ul>
        <li><strong>Account details</strong>: your name, email address, phone number and password (stored encrypted).</li>
        <li><strong>Google sign-in</strong>: if you choose &quot;Continue with Google&quot;, we receive your name, email address and profile picture from Google. We do not receive your Google password or access your other Google data.</li>
        <li><strong>Orders and appointments</strong>: the garments you order, appointment times, body measurements and reference photos you or the shop record.</li>
        <li><strong>Payments</strong>: amounts paid and the payment receipts or reference numbers you upload. SUTURA does not process card or bank payments itself.</li>
        <li><strong>Location</strong>: only if you allow it, your device location is used to show nearby shops on the map.</li>
      </ul>
    ),
  },
  {
    heading: 'How we use it',
    body: (
      <ul>
        <li>To create and secure your account and sign you in.</li>
        <li>To let tailoring shops manage your orders, fittings, measurements and payments.</li>
        <li>To send you notices about your orders and appointments by email, in-app notification or text message.</li>
        <li>To help you find shops near you.</li>
      </ul>
    ),
  },
  {
    heading: 'Who can see it',
    body: (
      <>
        <p>
          A shop you book or order with can see the details it needs to serve you: your name, contact details,
          measurements, orders and payments with that shop. Other shops cannot see them.
        </p>
        <p>We do not sell your information or share it with advertisers.</p>
      </>
    ),
  },
  {
    heading: 'How long we keep it',
    body: (
      <p>
        We keep your information while your account is active and as long as a shop needs its order records.
        You can ask us to delete your account and personal information at any time.
      </p>
    ),
  },
  {
    id: 'shop-applications',
    heading: 'Shop applications',
    body: (
      <>
        <p>When you apply to open a shop on SUTURA, we collect:</p>
        <ul>
          <li>Your name, date of birth, contact number and email.</li>
          <li>Your business documents: DTI registration, TIN or BIR Form 2303, barangay clearance, business permits and a photo of your shop front.</li>
          <li>A photo of one government ID and the ID type.</li>
          <li>A selfie of you holding that ID, taken live with your device camera.</li>
          <li>Your plan payment receipt.</li>
        </ul>
        <p>
          We use these only to check that the shop and its owner are real before the shop goes live. When you take the
          selfie, a check runs on your own device: it makes sure your face is visible and compares it with the photo on
          the ID you are holding. Your face data never leaves your device; only the result (for example &quot;likely the
          same person&quot;) is sent to SUTURA. That result is only a hint: a person on the SUTURA review team compares the
          selfie with your ID and makes the decision. The automatic check never approves or rejects an application.
        </p>
        <p>
          Only the SUTURA review team can see these files. They are stored privately, never shown on your shop profile,
          and never shared with customers or other shops.
        </p>
        <p>
          Your selfie is deleted 30 days after your application is approved or rejected. Your other documents are kept
          while your shop is on SUTURA, so we can re-check them if a question comes up. You can ask us to delete them
          when you close your shop.
        </p>
        <p>We record when you gave this consent and agreed to our terms.</p>
      </>
    ),
  },
  {
    heading: 'Your rights',
    body: (
      <p>
        Under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), you may ask to see, correct or
        delete your personal information, and you may object to its processing. You can update most details
        yourself in your account settings, and turn off text messages in your notification settings.
      </p>
    ),
  },
  {
    heading: 'Contact us',
    body: (
      <p>
        For privacy questions or requests, reply to any email you received from SUTURA, and we will respond
        as soon as we can.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="November 10, 2026"
      intro={
        <p>
          SUTURA connects customers with tailoring shops in Davao City and helps shops track orders. This page
          explains what information we collect when you use suturaofficial.tech, why we collect it, and the
          choices you have.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
