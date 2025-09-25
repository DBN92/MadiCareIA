-- Fix patients table column structure - CORRECTED VERSION
-- The database already has 'full_name' column but the application also expects 'name'
-- We need to add the 'name' column and populate it with data from 'full_name' column

-- Add name column to patients table for backward compatibility
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Copy data from full_name to name
UPDATE public.patients 
SET name = full_name 
WHERE name IS NULL;

-- Make name NOT NULL after populating data
ALTER TABLE public.patients 
ALTER COLUMN name SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(name);

-- Now both columns exist for compatibility:
-- - full_name (original column)
-- - name (new column for backward compatibility)