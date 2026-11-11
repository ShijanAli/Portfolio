import type { Serialized } from '@portfolio/api-client';
import type * as Api from '@portfolio/api/types';

/** The API's own model types, as they look after JSON serialization. */
export type Testimonial = Serialized<Api.Testimonial>;
export type Technology = Serialized<Api.Technology>;
export type Experience = Serialized<Api.Experience>;
export type Education = Serialized<Api.Education>;
export type Tag = Serialized<Api.Tag> & { _count: { posts: number } };
export type BlogCategory = Serialized<Api.BlogCategory> & { _count: { posts: number } };
export type ProjectCategory = Serialized<Api.ProjectCategory> & { _count: { projects: number } };
export type Redirect = Serialized<Api.Redirect>;
export type ContactMessage = Serialized<Api.ContactMessage>;
export type Subscriber = Serialized<Omit<Api.Subscriber, 'confirmToken' | 'unsubscribeToken'>>;

export type Seo = Serialized<Api.Seo>;

export type Project = Serialized<Api.Project> & {
  category: Serialized<Api.ProjectCategory> | null;
  technologies: Technology[];
  seo: Seo | null;
};

export type Service = Serialized<Api.Service> & {
  faqs: Serialized<Api.ServiceFaq>[];
  seo: Seo | null;
};

export type Post = Serialized<Api.Post> & {
  author: { id: string; name: string; avatar: string | null };
  category: Serialized<Api.BlogCategory> | null;
  tags: Serialized<Api.Tag>[];
  seo: Seo | null;
};

export type Availability = Serialized<Api.Availability>;
export type AvailabilityException = Serialized<Api.AvailabilityException>;
export type Booking = Serialized<Api.Booking> & {
  service: { id: string; title: string; slug: string } | null;
};
export type Campaign = Serialized<Api.Campaign>;
