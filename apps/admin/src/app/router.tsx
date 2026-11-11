import type { Entity } from '@portfolio/api-client';
import { lazy } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import type { ResourceFormPage as ResourceFormPageType } from '@/components/resource/ResourceFormPage';
import { ResourcePage } from '@/components/resource/ResourcePage';
import type { ResourceConfig } from '@/components/resource/types';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import {
  availabilityConfig,
  availabilityExceptionsConfig,
} from '@/features/availability/availability.config';
import { blogCategoriesConfig } from '@/features/blog-categories/blog-categories.config';
import { bookingsConfig } from '@/features/bookings/bookings.config';
import { campaignsConfig } from '@/features/campaigns/campaigns.config';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { educationsConfig } from '@/features/educations/educations.config';
import { experiencesConfig } from '@/features/experiences/experiences.config';
import { messagesConfig } from '@/features/messages/messages.config';
import { postsConfig } from '@/features/posts/posts.config';
import { projectCategoriesConfig } from '@/features/project-categories/project-categories.config';
import { projectsConfig } from '@/features/projects/projects.config';
import { redirectsConfig } from '@/features/redirects/redirects.config';
import { servicesConfig } from '@/features/services/services.config';
import { subscribersConfig } from '@/features/subscribers/subscribers.config';
import { tagsConfig } from '@/features/tags/tags.config';
import { technologiesConfig } from '@/features/technologies/technologies.config';
import { testimonialsConfig } from '@/features/testimonials/testimonials.config';

// Screens that are large or rarely opened are downloaded on demand, which keeps the first
// load of the admin (login, dashboard, tables) small.
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage'));
// `lazy` erases the component's generic parameter; the cast restores its real type.
const ResourceFormPage = lazy(() =>
  import('@/components/resource/ResourceFormPage').then((module) => ({
    default: module.ResourceFormPage,
  })),
) as unknown as typeof ResourceFormPageType;
const BookingSettingsPage = lazy(() =>
  import('@/features/bookings/BookingSettingsPage').then((module) => ({
    default: module.BookingSettingsPage,
  })),
);
const MediaLibraryPage = lazy(() =>
  import('@/features/media/MediaLibraryPage').then((module) => ({
    default: module.MediaLibraryPage,
  })),
);
const SeoPagesPage = lazy(() =>
  import('@/features/seo/SeoPagesPage').then((module) => ({ default: module.SeoPagesPage })),
);
const SiteSettingsPage = lazy(() =>
  import('@/features/settings/SiteSettingsPage').then((module) => ({
    default: module.SiteSettingsPage,
  })),
);

/**
 * The routes of a config-driven screen: its list, plus create and edit pages when the
 * config asks for a full-page form. Keys reset state when moving between resources.
 */
function resource<T extends Entity>(path: string, config: ResourceConfig<T>): RouteObject[] {
  const list = { path, element: <ResourcePage key={config.path} config={config} /> };
  if (config.formLayout !== 'page') return [list];

  const form = <ResourceFormPage key={config.path} config={config} />;
  return [
    list,
    { path: `${path}/new`, element: form },
    { path: `${path}/:id/edit`, element: form },
  ];
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          ...resource('projects', projectsConfig),
          ...resource('services', servicesConfig),
          ...resource('posts', postsConfig),
          ...resource('experiences', experiencesConfig),
          ...resource('educations', educationsConfig),
          ...resource('technologies', technologiesConfig),
          ...resource('testimonials', testimonialsConfig),
          ...resource('project-categories', projectCategoriesConfig),
          ...resource('blog-categories', blogCategoriesConfig),
          ...resource('tags', tagsConfig),
          ...resource('bookings', bookingsConfig),
          ...resource('availability', availabilityConfig),
          ...resource('days-off', availabilityExceptionsConfig),
          { path: 'booking-settings', element: <BookingSettingsPage /> },
          ...resource('messages', messagesConfig),
          ...resource('subscribers', subscribersConfig),
          ...resource('campaigns', campaignsConfig),
          { path: 'settings', element: <SiteSettingsPage /> },
          { path: 'seo', element: <SeoPagesPage /> },
          { path: 'media', element: <MediaLibraryPage /> },
          ...resource('redirects', redirectsConfig),
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
