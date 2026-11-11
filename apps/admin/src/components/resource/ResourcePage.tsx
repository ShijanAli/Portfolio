import type { Entity } from '@portfolio/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/DataTable';
import type { RowAction } from '@/components/data-table/types';
import { ResourceForm } from '@/components/form/ResourceForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { useConfirm } from '@/components/modal/ConfirmProvider';
import { Modal } from '@/components/modal/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/feedback';
import { errorMessage } from '@/lib/errors';
import { ResourceToolbar } from './ResourceToolbar';
import type { FormAction, ResourceConfig, ResourceHelpers } from './types';
import { useResourceList, useResourceMutations } from './useResource';
import { useTableState } from './useTableState';

type Dialog<T> =
  | { kind: 'create' }
  | { kind: 'edit'; row: T }
  | { kind: 'view'; row: T }
  | { kind: 'action'; row: T; action: FormAction<T> }
  | null;

const NO_FILTERS: never[] = [];

/**
 * A complete CRUD screen generated from a config: searchable, filterable, sortable table
 * with bulk delete, plus create/edit in a modal (or on a page), an optional detail view
 * and custom row actions.
 */
export function ResourcePage<T extends Entity>({ config }: { config: ResourceConfig<T> }) {
  const { path, singular, fields, view, canDelete = true } = config;
  const filters = config.filters ?? NO_FILTERS;
  const canCreate = Boolean(fields) && (config.canCreate ?? true);
  const opensFormPage = config.formLayout === 'page';

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const table = useTableState(filters.map((filter) => filter.name));
  const list = useResourceList<T>(path, table.query);
  const mutations = useResourceMutations<T>(path, singular);

  const [dialog, setDialog] = useState<Dialog<T>>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const close = () => setDialog(null);

  const helpers: ResourceHelpers<T> = useMemo(
    () => ({
      update: (id, body) => mutations.update.mutateAsync({ id, body }),
      run: async (action, successMessage) => {
        try {
          await action();
          toast.success(successMessage);
          await queryClient.invalidateQueries({ queryKey: [path] });
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    }),
    [mutations.update, queryClient, path],
  );

  const deleteOne = async (row: T) => {
    if (
      await confirm({ title: `Delete this ${singular}?`, confirmLabel: 'Delete', danger: true })
    ) {
      mutations.remove.mutate(row.id);
    }
  };

  const deleteSelected = async () => {
    const title = `Delete ${selected.size} selected item${selected.size === 1 ? '' : 's'}?`;
    if (await confirm({ title, confirmLabel: 'Delete', danger: true })) {
      await mutations.removeMany.mutateAsync([...selected]);
      setSelected(new Set());
    }
  };

  const openEdit = (row: T) =>
    opensFormPage ? void navigate(`${row.id}/edit`) : setDialog({ kind: 'edit', row });

  const openView = (row: T) => {
    setDialog({ kind: 'view', row });
    view?.onOpen?.(row, helpers);
  };

  const rowActions: RowAction<T>[] = [
    ...(view ? [{ label: 'View', icon: Eye, onSelect: openView }] : []),
    ...(config.actions?.(helpers) ?? []).map(({ confirm: ask, onSelect, ...action }) => ({
      ...action,
      onSelect: async (row: T) => {
        if (!ask || (await confirm(ask(row)))) onSelect(row);
      },
    })),
    ...(config.formActions ?? []).map((action) => ({
      label: action.label,
      icon: action.icon,
      danger: action.danger,
      hidden: action.hidden,
      onSelect: (row: T) => setDialog({ kind: 'action', row, action }),
    })),
    ...(fields
      ? [
          {
            label: 'Edit',
            icon: Pencil,
            onSelect: openEdit,
            hidden: (row: T) => config.canEdit?.(row) === false,
          },
        ]
      : []),
    ...(canDelete ? [{ label: 'Delete', icon: Trash2, onSelect: deleteOne, danger: true }] : []),
  ];

  const createButton = canCreate && (
    <Button onClick={() => (opensFormPage ? void navigate('new') : setDialog({ kind: 'create' }))}>
      <Plus className="size-4" />
      Add {singular}
    </Button>
  );

  const isFiltered = Boolean(table.search) || Object.values(table.filters).some(Boolean);

  return (
    <>
      <PageHeader title={config.title} description={config.description} actions={createButton} />

      <ResourceToolbar
        searchable={config.searchable ?? true}
        search={table.search}
        onSearchChange={table.setSearch}
        filters={filters}
        filterValues={table.filters}
        onFilterChange={table.setFilter}
        selectedCount={selected.size}
        onDeleteSelected={deleteSelected}
      />

      <DataTable
        columns={config.columns}
        rows={list.data?.items}
        meta={list.data?.meta}
        isLoading={list.isLoading}
        error={list.error}
        onRetry={() => void list.refetch()}
        sort={table.sort}
        onSortChange={table.setSort}
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
        rowActions={rowActions.length > 0 ? rowActions : undefined}
        selection={canDelete ? { selected, onChange: setSelected } : undefined}
        emptyState={
          isFiltered ? (
            <EmptyState title="No results" description="Try a different search or filter." />
          ) : (
            <EmptyState title={`No ${config.title.toLowerCase()} yet`} action={createButton} />
          )
        }
      />

      {fields && (dialog?.kind === 'create' || dialog?.kind === 'edit') && (
        <Modal
          open
          onClose={close}
          title={dialog.kind === 'create' ? `Add ${singular}` : `Edit ${singular}`}
          size="lg"
        >
          <ResourceForm
            fields={fields}
            record={dialog.kind === 'edit' ? dialog.row : undefined}
            onCancel={close}
            onSubmit={async (body) => {
              if (dialog.kind === 'edit')
                await mutations.update.mutateAsync({ id: dialog.row.id, body });
              else await mutations.create.mutateAsync(body);
              close();
            }}
          />
        </Modal>
      )}

      {dialog?.kind === 'action' && (
        <Modal open onClose={close} title={dialog.action.label}>
          <ResourceForm
            fields={dialog.action.fields}
            submitLabel={dialog.action.submitLabel ?? dialog.action.label}
            onCancel={close}
            onSubmit={async (values) => {
              await dialog.action.submit(dialog.row, values);
              toast.success(dialog.action.successMessage);
              await queryClient.invalidateQueries({ queryKey: [path] });
              close();
            }}
          />
        </Modal>
      )}

      {view && dialog?.kind === 'view' && (
        <Modal open onClose={close} title={view.title(dialog.row)}>
          {view.render(dialog.row)}
        </Modal>
      )}
    </>
  );
}
