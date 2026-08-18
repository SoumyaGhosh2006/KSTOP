CREATE TABLE "HostelLeaveRecord" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "leaveStartDate" TIMESTAMP(3) NOT NULL,
    "leaveEndDate" TIMESTAMP(3) NOT NULL,
    "parentsPhoneNumber" TEXT NOT NULL,
    "mentorName" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelLeaveRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HostelLeaveRecord_hostelId_idx" ON "HostelLeaveRecord"("hostelId");
CREATE INDEX "HostelLeaveRecord_rollNumber_idx" ON "HostelLeaveRecord"("rollNumber");

ALTER TABLE "HostelLeaveRecord"
ADD CONSTRAINT "HostelLeaveRecord_hostelId_fkey"
FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
