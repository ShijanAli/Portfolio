import {
  ArrowRightLeft,
  CalendarCheck,
  CalendarCog,
  CalendarOff,
  ChartLine,
  Clock,
  SearchCheck,
  Send,
  Settings,
  Award,
  Briefcase,
  FileText,
  FolderKanban,
  FolderTree,
  GraduationCap,
  HandCoins,
  Hash,
  Images,
  LayoutDashboard,
  Mail,
  MessageSquareQuote,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

/** The sidebar. Adding a screen is one line here plus one route. */
export const NAVIGATION: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
      { label: 'Analytics', to: '/analytics', icon: ChartLine },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Projects', to: '/projects', icon: FolderKanban },
      { label: 'Services', to: '/services', icon: HandCoins },
      { label: 'Experience', to: '/experiences', icon: Briefcase },
      { label: 'Education', to: '/educations', icon: GraduationCap },
      { label: 'Technologies', to: '/technologies', icon: Award },
      { label: 'Testimonials', to: '/testimonials', icon: MessageSquareQuote },
      { label: 'Project categories', to: '/project-categories', icon: FolderTree },
    ],
  },
  {
    title: 'Blog',
    items: [
      { label: 'Posts', to: '/posts', icon: FileText },
      { label: 'Categories', to: '/blog-categories', icon: Tags },
      { label: 'Tags', to: '/tags', icon: Hash },
    ],
  },
  {
    title: 'Bookings',
    items: [
      { label: 'Bookings', to: '/bookings', icon: CalendarCheck },
      { label: 'Working hours', to: '/availability', icon: Clock },
      { label: 'Days off', to: '/days-off', icon: CalendarOff },
      { label: 'Booking settings', to: '/booking-settings', icon: CalendarCog },
    ],
  },
  {
    title: 'Audience',
    items: [
      { label: 'Messages', to: '/messages', icon: Mail },
      { label: 'Subscribers', to: '/subscribers', icon: Users },
      { label: 'Campaigns', to: '/campaigns', icon: Send },
    ],
  },
  {
    title: 'Site',
    items: [
      { label: 'Site settings', to: '/settings', icon: Settings },
      { label: 'Page SEO', to: '/seo', icon: SearchCheck },
      { label: 'Media library', to: '/media', icon: Images },
      { label: 'Redirects', to: '/redirects', icon: ArrowRightLeft },
    ],
  },
];
