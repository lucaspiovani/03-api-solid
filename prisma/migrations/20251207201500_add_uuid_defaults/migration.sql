-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add UUID defaults
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "check_ins" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "gyms" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
