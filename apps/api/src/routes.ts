import { Router } from 'express';
import analyticsRoutes from '@/modules/analytics/analytics.routes';
import auditLogRoutes from '@/modules/audit-log/audit-log.routes';
import authRoutes from '@/modules/auth/auth.routes';
import availabilityExceptionRoutes from '@/modules/availability-exception/availability-exception.routes';
import availabilityRoutes from '@/modules/availability/availability.routes';
import blogCategoryRoutes from '@/modules/blog-category/blog-category.routes';
import blogRoutes from '@/modules/blog/blog.routes';
import bookingRoutes from '@/modules/booking/booking.routes';
import campaignRoutes from '@/modules/campaign/campaign.routes';
import contactRoutes from '@/modules/contact/contact.routes';
import dashboardRoutes from '@/modules/dashboard/dashboard.routes';
import educationRoutes from '@/modules/education/education.routes';
import experienceRoutes from '@/modules/experience/experience.routes';
import healthRoutes from '@/modules/health/health.routes';
import mediaRoutes from '@/modules/media/media.routes';
import newsletterRoutes from '@/modules/newsletter/newsletter.routes';
import projectCategoryRoutes from '@/modules/project-category/project-category.routes';
import projectRoutes from '@/modules/project/project.routes';
import redirectRoutes from '@/modules/redirect/redirect.routes';
import seoRoutes from '@/modules/seo/seo.routes';
import serviceRoutes from '@/modules/service/service.routes';
import settingRoutes from '@/modules/setting/setting.routes';
import subscriberRoutes from '@/modules/subscriber/subscriber.routes';
import tagRoutes from '@/modules/tag/tag.routes';
import technologyRoutes from '@/modules/technology/technology.routes';
import testimonialRoutes from '@/modules/testimonial/testimonial.routes';

/** Every module router is mounted here, under API_PREFIX. */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Content
router.use('/projects', projectRoutes);
router.use('/project-categories', projectCategoryRoutes);
router.use('/technologies', technologyRoutes);
router.use('/services', serviceRoutes);
router.use('/experiences', experienceRoutes);
router.use('/educations', educationRoutes);
router.use('/testimonials', testimonialRoutes);

// Blog
router.use('/blogs', blogRoutes);
router.use('/blog-categories', blogCategoryRoutes);
router.use('/tags', tagRoutes);

// Booking
router.use('/bookings', bookingRoutes);
router.use('/availability', availabilityRoutes);
router.use('/availability-exceptions', availabilityExceptionRoutes);

// Newsletter
router.use('/newsletter', newsletterRoutes);
router.use('/subscribers', subscriberRoutes);
router.use('/campaigns', campaignRoutes);

// Site
router.use('/media', mediaRoutes);
router.use('/settings', settingRoutes);
router.use('/seo', seoRoutes);
router.use('/redirects', redirectRoutes);
router.use('/contact', contactRoutes);

// Insights
router.use('/analytics', analyticsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;
