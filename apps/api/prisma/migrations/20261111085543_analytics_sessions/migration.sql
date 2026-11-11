-- DropIndex
DROP INDEX "VisitorSession_visitorId_idx";

-- AlterTable
ALTER TABLE "VisitorSession" DROP COLUMN "endedAt",
ADD COLUMN     "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "DailyStat";

-- CreateIndex
CREATE INDEX "VisitorSession_visitorId_lastSeenAt_idx" ON "VisitorSession"("visitorId", "lastSeenAt");

