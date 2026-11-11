import { useSearchParams } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsForm } from '@/components/resource/SettingsForm';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { api } from '@/lib/api';
import { SETTINGS_TABS } from './settings.fields';

export function SiteSettingsPage() {
  const [params, setParams] = useSearchParams();
  const active = SETTINGS_TABS.find((tab) => tab.key === params.get('tab')) ?? SETTINGS_TABS[0]!;

  return (
    <>
      <PageHeader
        title="Site settings"
        description="Content and configuration used across your website."
      />
      <Tabs
        label="Settings"
        tabs={SETTINGS_TABS}
        active={active.key}
        onChange={(tab) => setParams({ tab }, { replace: true })}
      />
      <Card className="mt-4 max-w-3xl p-5">
        <SettingsForm
          // A separate form per tab, so switching never carries values across.
          key={active.key}
          queryKey={['settings', active.key]}
          load={() => api.get<object>(`/settings/${active.key}`)}
          save={(body) => api.put(`/settings/${active.key}`, body)}
          fields={active.fields}
        />
      </Card>
    </>
  );
}
