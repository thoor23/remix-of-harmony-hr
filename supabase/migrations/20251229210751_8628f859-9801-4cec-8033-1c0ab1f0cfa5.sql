-- Add type column to stores table for differentiating between stores and offices
ALTER TABLE stores ADD COLUMN IF NOT EXISTS type text DEFAULT 'store';

-- Add check constraint
ALTER TABLE stores ADD CONSTRAINT stores_type_check CHECK (type IN ('store', 'office'));

-- Add regional settings columns for per-location timezone, date format, currency
ALTER TABLE stores ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Kolkata';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS date_format text DEFAULT 'DD/MM/YYYY';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS locale text DEFAULT 'en-IN';

-- Update existing records to have type 'store'
UPDATE stores SET type = 'store' WHERE type IS NULL;