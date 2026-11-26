-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "deliverableId" TEXT;

-- CreateIndex
CREATE INDEX "Task_deliverableId_idx" ON "Task"("deliverableId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
