import type { FieldConfig } from '@/components/form/types';
import { SectionsEditor } from './SectionsEditor';

const SOCIALS = [
  'github',
  'linkedin',
  'twitter',
  'facebook',
  'youtube',
  'whatsapp',
  'upwork',
  'fiverr',
];

const cta = (name: string, title: string): FieldConfig[] => [
  { name: `${name}.label`, label: `${title} button text`, type: 'text' },
  { name: `${name}.href`, label: `${title} button link`, type: 'text', placeholder: '/book' },
];

/** One tab per settings document. The key is the API's settings key. */
export const SETTINGS_TABS: { key: string; label: string; fields: FieldConfig[] }[] = [
  {
    key: 'general',
    label: 'General',
    fields: [
      { name: 'siteName', label: 'Site name', type: 'text' },
      { name: 'ownerName', label: 'Your name', type: 'text' },
      {
        name: 'tagline',
        label: 'Tagline',
        type: 'text',
        wide: true,
        placeholder: 'Full stack developer',
      },
      { name: 'bio', label: 'Short bio', type: 'textarea', wide: true },
      { name: 'email', label: 'Public email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'location', label: 'Location', type: 'text', placeholder: 'Dhaka, Bangladesh' },
      {
        name: 'resumeUrl',
        label: 'Resume URL',
        type: 'text',
        placeholder: 'https://',
        help: 'Upload the PDF in the media library and paste its URL.',
      },
      { name: 'avatar', label: 'Your photo', type: 'image' },
      { name: 'logo', label: 'Logo', type: 'image' },
      { name: 'favicon', label: 'Favicon', type: 'image' },
      {
        name: 'availableForWork',
        label: 'Available for work',
        type: 'switch',
        help: 'Shows an "available" badge on the site.',
      },
    ],
  },
  {
    key: 'hero',
    label: 'Hero',
    fields: [
      { name: 'greeting', label: 'Greeting', type: 'text', placeholder: "Hi, I'm" },
      { name: 'headline', label: 'Headline', type: 'text' },
      { name: 'subheadline', label: 'Subheadline', type: 'textarea', wide: true },
      {
        name: 'roles',
        label: 'Rotating roles',
        type: 'tags',
        wide: true,
        placeholder: 'Full Stack Developer, then Enter',
      },
      { name: 'image', label: 'Hero image', type: 'image', wide: true },
      ...cta('primaryCta', 'Main'),
      ...cta('secondaryCta', 'Second'),
    ],
  },
  {
    key: 'socials',
    label: 'Social links',
    fields: SOCIALS.map((name) => ({
      name,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      type: 'url' as const,
      placeholder: 'https://',
    })),
  },
  {
    key: 'sections',
    label: 'Home sections',
    fields: [
      {
        name: 'items',
        label: 'Sections of the home page',
        type: 'custom',
        help: 'Reorder with the arrows. Switch a section off to hide it.',
        render: (props) => <SectionsEditor {...props} />,
      },
    ],
  },
  {
    key: 'theme',
    label: 'Theme',
    fields: [
      { name: 'accentColor', label: 'Accent color', type: 'color', required: true },
      {
        name: 'defaultMode',
        label: 'Default mode',
        type: 'select',
        required: true,
        options: [
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
          { value: 'system', label: 'Follow the visitor’s device' },
        ],
      },
    ],
  },
  {
    key: 'seo',
    label: 'SEO defaults',
    fields: [
      { name: 'siteUrl', label: 'Site URL', type: 'url', placeholder: 'https://yourdomain.com' },
      {
        name: 'titleTemplate',
        label: 'Title template',
        type: 'text',
        help: '%s is replaced by the page title.',
      },
      { name: 'defaultTitle', label: 'Default title', type: 'text', wide: true },
      { name: 'defaultDescription', label: 'Default description', type: 'textarea', wide: true },
      { name: 'keywords', label: 'Site keywords', type: 'tags', wide: true },
      { name: 'ogImage', label: 'Default sharing image', type: 'image' },
      { name: 'twitterHandle', label: 'X / Twitter handle', type: 'text', placeholder: '@you' },
      {
        name: 'googleSiteVerification',
        label: 'Google site verification code',
        type: 'text',
        wide: true,
      },
    ],
  },
  {
    key: 'integrations',
    label: 'Integrations',
    fields: [
      {
        name: 'gaMeasurementId',
        label: 'Google Analytics measurement ID',
        type: 'text',
        placeholder: 'G-XXXXXXXXXX',
      },
      {
        name: 'turnstileSiteKey',
        label: 'Cloudflare Turnstile site key',
        type: 'text',
        help: 'Spam protection for public forms.',
      },
    ],
  },
];
