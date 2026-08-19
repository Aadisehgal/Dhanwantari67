-- Run once in Neon's SQL Editor. Safe to re-run.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medicine_batches' AND column_name = 'form'
  ) THEN
    ALTER TABLE "medicine_batches" ADD COLUMN "form" TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medicine_batches' AND column_name = 'packSize'
  ) THEN
    ALTER TABLE "medicine_batches" ADD COLUMN "packSize" TEXT;
  END IF;
END $$;
