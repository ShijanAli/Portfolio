-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_seoId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_seoId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_seoId_fkey";

-- DropIndex
DROP INDEX "Post_seoId_key";

-- DropIndex
DROP INDEX "Project_seoId_key";

-- DropIndex
DROP INDEX "Service_seoId_key";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "seoId";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "seoId";

-- AlterTable
ALTER TABLE "Seo" ADD COLUMN     "postId" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "serviceId" TEXT;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "seoId";

-- CreateIndex
CREATE UNIQUE INDEX "Seo_projectId_key" ON "Seo"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Seo_serviceId_key" ON "Seo"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Seo_postId_key" ON "Seo"("postId");

-- AddForeignKey
ALTER TABLE "Seo" ADD CONSTRAINT "Seo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seo" ADD CONSTRAINT "Seo_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seo" ADD CONSTRAINT "Seo_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

