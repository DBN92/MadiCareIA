-- Fix patients table column structure
-- The database schema shows 'name' column but the application expects 'full_name'
-- We need to add the full_name column and populate it with data from name column

-- Add full_name column to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Copy data from name to full_name
UPDATE public.patients 
SET full_name = name 
WHERE full_name IS NULL;

-- Make full_name NOT NULL after populating data
ALTER TABLE public.patients 
ALTER COLUMN full_name SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON public.patients(full_name);

-- Optional: Keep both columns for backward compatibility
-- Or you could drop the name column if you want to fully migrate:
-- ALTER TABLE public.patients DROP COLUMN name;