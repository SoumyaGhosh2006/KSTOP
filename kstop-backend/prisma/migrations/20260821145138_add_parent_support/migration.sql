-- AlterTable 
ALTER TABLE \" "User\ ADD COLUMN \childRollNumber\ TEXT; 
 
-- CreateIndex 
CREATE UNIQUE INDEX \" "User_rollNumber_key\ ON \User\(\rollNumber\); 
 
-- CreateTable 
CREATE TABLE \" "ParentMessage\ ( 
    \" "id\ TEXT NOT NULL, 
    \" "parentId\ TEXT NOT NULL, 
    \" "mentorId\ TEXT NOT NULL, 
    \" "studentId\ TEXT NOT NULL, 
    \" "message\ TEXT NOT NULL, 
    \" "createdAt\ TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT \" "ParentMessage_pkey\ PRIMARY KEY (\id\) 
); 
 
-- CreateIndex 
CREATE INDEX \" "ParentMessage_parentId_idx\ ON \ParentMessage\(\parentId\); 
CREATE INDEX \" "ParentMessage_mentorId_idx\ ON \ParentMessage\(\mentorId\); 
CREATE INDEX \" "ParentMessage_studentId_idx\ ON \ParentMessage\(\studentId\); 
 
-- AddForeignKey 
ALTER TABLE \" "ParentMessage\ ADD CONSTRAINT \ParentMessage_parentId_fkey\ FOREIGN KEY (\parentId\) REFERENCES \User\(\id\) ON DELETE RESTRICT ON UPDATE CASCADE; 
