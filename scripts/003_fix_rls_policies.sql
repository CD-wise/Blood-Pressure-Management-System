-- Fix infinite recursion in RLS policies
-- Drop existing problematic policies and recreate them properly

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Healthcare staff can insert readings" ON public.blood_pressure_readings;
DROP POLICY IF EXISTS "Admins can manage all relationships" ON public.doctor_patient_relationships;

-- Create non-recursive policies using auth.jwt() claims instead of profile lookups
-- Create a function to get user role from JWT claims or direct auth metadata
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Try to get role from auth.users metadata first
  RETURN COALESCE(
    (auth.jwt() ->> 'user_role'),
    (SELECT raw_user_meta_data ->> 'role' FROM auth.users WHERE id = auth.uid()),
    'patient'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate admin policies using the function
CREATE POLICY "Admins can view all profiles" ON public.profiles 
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles" ON public.profiles 
  FOR UPDATE USING (get_user_role() = 'admin');

-- Fix healthcare staff policy to avoid recursion
CREATE POLICY "Healthcare staff can insert readings" ON public.blood_pressure_readings 
  FOR INSERT WITH CHECK (get_user_role() IN ('doctor', 'nurse', 'admin'));

CREATE POLICY "Healthcare staff can view all readings" ON public.blood_pressure_readings 
  FOR SELECT USING (get_user_role() IN ('doctor', 'nurse', 'admin'));

-- Fix admin relationship management policy
CREATE POLICY "Admins can manage all relationships" ON public.doctor_patient_relationships 
  FOR ALL USING (get_user_role() = 'admin');

-- Add nurses can view patient relationships
CREATE POLICY "Nurses can view relationships" ON public.doctor_patient_relationships 
  FOR SELECT USING (get_user_role() = 'nurse');
