-- AlterTable
ALTER TABLE "Deliverable" ADD COLUMN     "filePathname" TEXT,
ADD COLUMN     "previousVersionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Deliverable_previousVersionId_key" ON "Deliverable"("previousVersionId");

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "Deliverable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
