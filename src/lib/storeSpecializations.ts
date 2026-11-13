// The services a shop offers: the 10 standard ones, modelled on Davao shops' own
// signboards (Men / Women / Kids were dropped as shop tags on 2026-11-14). A shop's
// own extra services are stores.custom_services. Mirrors
// CanonicalTaxonomy::STORE_SERVICE_TAGS on the backend.
const STORE_SERVICE_TAGS: { value: string; label: string }[] = [
  { value: 'custom_tailoring', label: 'Custom Tailoring' },
  { value: 'alterations_repairs', label: 'Alterations & Repairs' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  // Office / School / Medical / Maritime were merged into Uniform (2026-11-14); the kind
  // of uniform is each service's type (see lib/uniformTypes.ts).
  { value: 'uniform', label: 'Uniform' },
  { value: 'sports', label: 'Sports' },
  { value: 'embroidery', label: 'Embroidery' },
];

export const STORE_SPECIALIZATIONS: { value: string; label: string; group: 'Services' }[] =
  STORE_SERVICE_TAGS.map((s) => ({ ...s, group: 'Services' as const }));

// No longer offered, but still saved on shops that picked them before —
// labelled so they don't show as raw slugs. Server: LEGACY_STORE_SERVICE_TAGS.
const LEGACY_LABELS: Record<string, string> = {
  men: "Men's Apparel",
  women: "Women's Apparel",
  children: "Children's Apparel",
  office: 'Office',
  school: 'School',
  maritime: 'Maritime',
  medical: 'Medical',
  uniform_production: 'Uniform Production',
  printing_sublimation: 'Printing & Sublimation',
  custom_costume_creation: 'Custom Costume Creation',
  others: 'Others',
};

export function specializationLabel(value: string): string {
  return STORE_SPECIALIZATIONS.find((s) => s.value === value)?.label ?? LEGACY_LABELS[value] ?? value.replace(/_/g, ' ');
}
