import type { Entity } from '@portfolio/api-client';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { ResourceForm } from '@/components/form/ResourceForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import type { ResourceConfig } from './types';
import { useResourceItem, useResourceMutations } from './useResource';

/**
 * The full-page create/edit screen of a resource whose config says `formLayout: 'page'`.
 * It is the same form the modal uses, given room for long content.
 */
export function ResourceFormPage<T extends Entity>({ config }: { config: ResourceConfig<T> }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = useResourceItem<T>(config.path, id);
  const mutations = useResourceMutations<T>(config.path, config.singular);

  // From /posts/new or /posts/:id/edit back to /posts.
  const listPath = id ? '../..' : '..';
  const backToList = () => void navigate(listPath, { relative: 'path' });

  const renderForm = () => {
    if (id && item.error)
      return <ErrorState error={item.error} onRetry={() => void item.refetch()} />;
    if (id && !item.data) return <Skeleton className="h-96 w-full" />;

    return (
      <ResourceForm
        // A fresh form for each record, so values never leak from one to the next.
        key={item.data?.id ?? 'new'}
        fields={config.fields ?? []}
        record={item.data}
        onCancel={backToList}
        onSubmit={async (body) => {
          if (id) await mutations.update.mutateAsync({ id, body });
          else await mutations.create.mutateAsync(body);
          backToList();
        }}
      />
    );
  };

  return (
    <>
      <Link
        to={listPath}
        relative="path"
        className="mb-3 inline-flex items-center gap-1.5 text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        {config.title}
      </Link>
      <PageHeader title={id ? `Edit ${config.singular}` : `New ${config.singular}`} />
      <Card className="p-5">{renderForm()}</Card>
    </>
  );
}
