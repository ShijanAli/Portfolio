import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { seoFields } from '@/components/form/common-fields';
import { ResourceForm } from '@/components/form/ResourceForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/modal/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import { api } from '@/lib/api';
import { humanize } from '@/lib/format';
import type { Seo } from '@/types';

interface PageSeo {
  pageKey: string;
  seo: Seo | null;
}

/** The same SEO fields content items use, without the `seo.` nesting. */
const FIELDS = seoFields.map((field) => ({
  ...field,
  name: field.name.replace(/^seo\./, ''),
  section: undefined,
}));

const QUERY_KEY = ['seo', 'pages'];

export function SeoPagesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PageSeo | null>(null);
  const { data, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.get<PageSeo[]>('/seo/pages'),
  });

  return (
    <>
      <PageHeader
        title="Page SEO"
        description="Titles and descriptions for the fixed pages of your site. Projects, services and posts have their own SEO in their forms."
      />

      {error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Card className="divide-y divide-border">
          {data.map((page) => (
            <div key={page.pageKey} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  {humanize(page.pageKey)}
                  {page.seo?.noIndex && <Badge tone="warning">Hidden from search</Badge>}
                </p>
                <p className="truncate text-muted">
                  {page.seo?.metaTitle ?? 'No custom title yet. The site default is used.'}
                </p>
                {page.seo?.metaDescription && (
                  <p className="truncate text-xs text-muted">{page.seo.metaDescription}</p>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => setEditing(page)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            </div>
          ))}
        </Card>
      )}

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={`SEO: ${humanize(editing.pageKey)} page`}
          size="lg"
        >
          <ResourceForm
            fields={FIELDS}
            record={editing.seo ?? {}}
            submitLabel="Save"
            onCancel={() => setEditing(null)}
            onSubmit={async (body) => {
              await api.put(`/seo/pages/${editing.pageKey}`, body);
              toast.success('SEO saved');
              await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
