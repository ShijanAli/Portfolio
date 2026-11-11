import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Fills an empty site with PLACEHOLDER content, so the design can be seen before the real
 * content is written. Everything here is sample text: replace it in the admin panel.
 *
 * Run with `pnpm db:seed:demo`. It refuses to run if projects already exist.
 */
const prisma = new PrismaClient();

const TECHNOLOGIES: [
  name: string,
  category: 'FRONTEND' | 'BACKEND' | 'DATABASE' | 'DEVOPS' | 'TOOL',
][] = [
  ['React', 'FRONTEND'],
  ['Next.js', 'FRONTEND'],
  ['Vue.js', 'FRONTEND'],
  ['Nuxt', 'FRONTEND'],
  ['TypeScript', 'FRONTEND'],
  ['Tailwind CSS', 'FRONTEND'],
  ['Node.js', 'BACKEND'],
  ['Express.js', 'BACKEND'],
  ['PostgreSQL', 'DATABASE'],
  ['Prisma', 'DATABASE'],
  ['Docker', 'DEVOPS'],
  ['Git', 'TOOL'],
];

const slugOf = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const monthsAgo = (months: number) => new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);

const SETTINGS: Record<string, object> = {
  general: {
    siteName: 'Shijan',
    ownerName: 'Md Shijan Ali',
    tagline: 'Full stack developer building ERP, POS and e-commerce software.',
    bio: 'I am a software engineer with 4+ years of industry experience and 5+ years as a freelancer. I turn complex business processes into fast, clear web applications: ERP systems, POS software, e-commerce stores, admin panels and business websites, built with React, Vue and Node.js.',
    location: 'Bangladesh',
    availableForWork: true,
  },
  hero: {
    greeting: "Hi, I'm",
    headline: 'I design and build web software that businesses run on.',
    subheadline: 'Frontend, backend and database: one developer for the whole product.',
    roles: ['Full Stack Developer', 'React & Next.js Engineer', 'Vue & Nuxt Engineer'],
    primaryCta: { label: 'Book a call', href: '/book' },
    secondaryCta: { label: 'View work', href: '/#projects' },
  },
  socials: {
    github: 'https://github.com/MdShijanAli',
    linkedin: 'https://www.linkedin.com/in/mdshijanali',
  },
  seo: {
    titleTemplate: '%s | Md Shijan Ali',
    defaultTitle: 'Md Shijan Ali | Full Stack Developer',
    defaultDescription:
      'Full stack developer building ERP, POS and e-commerce software with React, Next.js, Vue and Node.js.',
    keywords: [
      'full stack developer',
      'react developer',
      'next.js developer',
      'vue developer',
      'erp software',
    ],
  },
};

const PROJECTS = [
  {
    title: 'Sample ERP Dashboard',
    summary:
      'Placeholder project. Inventory, sales and accounting brought together in one real-time dashboard.',
    category: 'Business software',
    role: 'Full stack developer',
    technologies: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL'],
  },
  {
    title: 'Sample POS System',
    summary:
      'Placeholder project. A point-of-sale app for retail shops with barcode scanning and offline billing.',
    category: 'Business software',
    role: 'Frontend lead',
    technologies: ['Vue.js', 'Nuxt', 'Express.js', 'PostgreSQL'],
  },
  {
    title: 'Sample Online Store',
    summary:
      'Placeholder project. A fast storefront with search, cart, checkout and an order management panel.',
    category: 'E-commerce',
    role: 'Full stack developer',
    technologies: ['React', 'Next.js', 'Tailwind CSS', 'Prisma'],
  },
];

const SERVICES = [
  {
    title: 'Web application development',
    shortDesc: 'Custom software for your business: ERP, POS, CRM and internal tools.',
    features: [
      'Requirements and planning',
      'Frontend and backend',
      'Database design',
      'Deployment and handover',
    ],
  },
  {
    title: 'E-commerce websites',
    shortDesc: 'Online stores that load fast, rank well and are easy to manage.',
    features: [
      'Product catalogue and search',
      'Cart and checkout',
      'Order management',
      'SEO friendly pages',
    ],
  },
  {
    title: 'Admin panels and dashboards',
    shortDesc: 'Clear, data-rich interfaces your team will actually enjoy using.',
    features: [
      'Roles and permissions',
      'Tables, filters and exports',
      'Charts and reports',
      'Responsive layout',
    ],
  },
  {
    title: 'Frontend development',
    shortDesc: 'Pixel-accurate, accessible interfaces in React or Vue from your designs.',
    features: [
      'React, Next.js, Vue, Nuxt',
      'Reusable component library',
      'Animations',
      'Performance tuning',
    ],
  },
];

const POSTS = [
  { title: 'Sample post: structuring a large React project', category: 'Engineering' },
  { title: 'Sample post: scroll animations without hurting performance', category: 'Frontend' },
  { title: 'Sample post: designing a PostgreSQL schema for an ERP', category: 'Engineering' },
];

async function main() {
  if ((await prisma.project.count()) > 0) {
    console.log('Projects already exist. Demo content was NOT added.');
    return;
  }
  const author = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!author) throw new Error('Run `pnpm db:seed` first to create the admin user.');

  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.siteSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  for (const [index, [name, category]] of TECHNOLOGIES.entries()) {
    await prisma.technology.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugOf(name), category, order: index },
    });
  }

  for (const [index, project] of PROJECTS.entries()) {
    await prisma.project.create({
      data: {
        title: project.title,
        slug: slugOf(project.title),
        summary: project.summary,
        role: project.role,
        status: 'PUBLISHED',
        isFeatured: true,
        order: index,
        content:
          '<p>Placeholder case study. Describe the problem, your approach and the result here.</p>',
        category: {
          connectOrCreate: {
            where: { name: project.category },
            create: { name: project.category, slug: slugOf(project.category) },
          },
        },
        technologies: { connect: project.technologies.map((name) => ({ name })) },
      },
    });
  }

  for (const [index, service] of SERVICES.entries()) {
    await prisma.service.create({
      data: { ...service, slug: slugOf(service.title), status: 'PUBLISHED', order: index },
    });
  }

  await prisma.experience.createMany({
    data: [
      {
        company: 'Freelance',
        position: 'Full Stack Developer',
        location: 'Remote',
        employmentType: 'Freelance',
        startDate: monthsAgo(64),
        isCurrent: true,
        description:
          'Placeholder entry (edit the details). ERP, POS, e-commerce, admin panels and business websites for clients.',
        highlights: ['Custom software and websites for clients'],
        techStack: ['React', 'Vue.js', 'Node.js', 'PostgreSQL'],
      },
      {
        company: 'Sample Software Company',
        position: 'Software Engineer',
        location: 'Bangladesh',
        employmentType: 'Full-time',
        startDate: monthsAgo(26),
        isCurrent: true,
        description:
          'Placeholder entry. Building ERP and POS products used by businesses every day.',
        highlights: [
          'Led the frontend of a multi-branch ERP',
          'Built a reusable component library',
        ],
        techStack: ['React', 'Next.js', 'Node.js', 'PostgreSQL'],
      },
      {
        company: 'Sample Digital Agency',
        position: 'Frontend Developer',
        location: 'Bangladesh',
        employmentType: 'Full-time',
        startDate: monthsAgo(52),
        endDate: monthsAgo(26),
        description: 'Placeholder entry. Delivered e-commerce sites and admin panels for clients.',
        highlights: ['Shipped 20+ client websites'],
        techStack: ['Vue.js', 'Nuxt', 'Tailwind CSS'],
      },
    ],
  });

  await prisma.testimonial.createMany({
    data: [
      {
        name: 'Sample Client',
        role: 'Founder',
        company: 'Sample Retail',
        message:
          'Placeholder testimonial. Clear communication, delivered on time, and the software just works.',
        rating: 5,
        order: 0,
      },
      {
        name: 'Another Client',
        role: 'Operations Manager',
        company: 'Sample Trading',
        message:
          'Placeholder testimonial. Our team adopted the new system in a week. Reporting takes minutes now.',
        rating: 5,
        order: 1,
      },
      {
        name: 'Third Client',
        role: 'CTO',
        company: 'Sample Tech',
        message:
          'Placeholder testimonial. Strong on both frontend and backend, and easy to work with.',
        rating: 5,
        order: 2,
      },
    ],
  });

  for (const [index, post] of POSTS.entries()) {
    await prisma.post.create({
      data: {
        title: post.title,
        slug: slugOf(post.title),
        excerpt: 'Placeholder article. Replace this with a real post from the admin panel.',
        content: '<p>Placeholder article body.</p>',
        status: 'PUBLISHED',
        publishedAt: monthsAgo(index + 1),
        readingTime: 4 + index,
        author: { connect: { id: author.id } },
        category: {
          connectOrCreate: {
            where: { name: post.category },
            create: { name: post.category, slug: slugOf(post.category) },
          },
        },
      },
    });
  }

  console.log('Demo content added. Everything is placeholder text: replace it in the admin panel.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
