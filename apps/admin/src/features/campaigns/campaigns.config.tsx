import { useQuery } from '@tanstack/react-query';
import { FlaskConical, Send } from 'lucide-react';
import { dateCell, statusCell, titleCell } from '@/components/data-table/cells';
import type { ResourceConfig } from '@/components/resource/types';
import { DetailList } from '@/components/ui/DetailList';
import { Skeleton } from '@/components/ui/feedback';
import { api } from '@/lib/api';
import { formatDateTime, formatNumber, humanize } from '@/lib/format';
import type { Campaign } from '@/types';

const TOPICS = ['blog', 'projects', 'offers'].map((value) => ({ value, label: humanize(value) }));
const STATUSES = ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED'].map((value) => ({
  value,
  label: humanize(value),
}));
const TONES = {
  DRAFT: 'warning',
  SCHEDULED: 'accent',
  SENDING: 'accent',
  SENT: 'success',
  FAILED: 'danger',
} as const;

/** Only campaigns that have not started sending can be changed or sent. */
const isEditable = (campaign: Campaign) =>
  campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED';

interface CampaignStats {
  status: string;
  audience: number;
  recipients: { QUEUED: number; SENT: number; FAILED: number; BOUNCED: number };
}

function CampaignDetails({ campaign }: { campaign: Campaign }) {
  const { data } = useQuery({
    queryKey: ['campaigns', 'stats', campaign.id],
    queryFn: () => api.get<CampaignStats>(`/campaigns/${campaign.id}/stats`),
  });

  if (!data) return <Skeleton className="h-32 w-full" />;

  return (
    <DetailList
      rows={[
        ['Status', statusCell(data.status, TONES)],
        [
          'Topics',
          campaign.topics.length ? campaign.topics.map(humanize).join(', ') : 'All subscribers',
        ],
        // Before sending: who it would reach. After: what happened.
        ...(isEditable(campaign)
          ? ([['Would reach', `${formatNumber(data.audience)} confirmed subscribers`]] as [
              string,
              string,
            ][])
          : ([
              ['Sent', formatNumber(data.recipients.SENT)],
              ['Failed', formatNumber(data.recipients.FAILED)],
              ['Still queued', formatNumber(data.recipients.QUEUED)],
            ] as [string, string][])),
        ['Scheduled for', campaign.scheduledAt ? formatDateTime(campaign.scheduledAt) : null],
        ['Sent at', campaign.sentAt ? formatDateTime(campaign.sentAt) : null],
      ]}
    />
  );
}

export const campaignsConfig: ResourceConfig<Campaign> = {
  path: 'campaigns',
  title: 'Campaigns',
  singular: 'campaign',
  description: 'Emails to your newsletter subscribers.',
  formLayout: 'page',
  canEdit: isEditable,
  columns: [
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      cell: (row) => titleCell(row.subject, row.preheader),
    },
    { key: 'status', header: 'Status', cell: (row) => statusCell(row.status, TONES) },
    {
      key: 'topics',
      header: 'Audience',
      cell: (row) => (row.topics.length ? row.topics.map(humanize).join(', ') : 'Everyone'),
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      sortable: true,
      cell: (row) => dateCell(row.scheduledAt),
    },
    { key: 'sentAt', header: 'Sent', sortable: true, cell: (row) => dateCell(row.sentAt) },
  ],
  filters: [{ name: 'status', label: 'Status', options: STATUSES }],
  view: { title: (row) => row.subject, render: (row) => <CampaignDetails campaign={row} /> },
  fields: [
    { name: 'subject', label: 'Subject', type: 'text', required: true, wide: true },
    {
      name: 'preheader',
      label: 'Preview text',
      type: 'text',
      wide: true,
      help: 'Shown next to the subject in the inbox.',
    },
    { name: 'content', label: 'Content', type: 'richtext', required: true },
    {
      name: 'topics',
      label: 'Send to subscribers interested in',
      type: 'multiselect',
      options: TOPICS,
      help: 'Select none to send to every confirmed subscriber.',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'DRAFT',
      options: STATUSES.filter(({ value }) => value === 'DRAFT' || value === 'SCHEDULED'),
      help: 'A scheduled campaign is sent automatically at the date you set.',
    },
    { name: 'scheduledAt', label: 'Send date', type: 'datetime' },
  ],
  formActions: [
    {
      label: 'Send a test',
      icon: FlaskConical,
      successMessage: 'Test email sent',
      submitLabel: 'Send test',
      fields: [
        {
          name: 'email',
          label: 'Send to',
          type: 'email',
          required: true,
          wide: true,
          placeholder: 'you@example.com',
        },
      ],
      submit: (row, values) => api.post(`/campaigns/${row.id}/test`, values),
    },
  ],
  actions: ({ run }) => [
    {
      label: 'Send now',
      icon: Send,
      hidden: (row) => !isEditable(row),
      confirm: (row) => ({
        title: `Send "${row.subject}" now?`,
        description:
          'It goes to every matching confirmed subscriber and cannot be stopped or edited afterwards.',
        confirmLabel: 'Send campaign',
      }),
      onSelect: (row) =>
        void run(() => api.post(`/campaigns/${row.id}/send`), 'Campaign is being sent'),
    },
  ],
};
