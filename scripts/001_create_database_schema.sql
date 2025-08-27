-- Blood Pressure Monitoring System Database Schema
-- Create tables for users, roles, and blood pressure readings

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'nurse', 'admin')),
  phone TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blood pressure readings table
CREATE TABLE IF NOT EXISTS public.blood_pressure_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  systolic INTEGER NOT NULL CHECK (systolic > 0 AND systolic < 300),
  diastolic INTEGER NOT NULL CHECK (diastolic > 0 AND diastolic < 200),
  pulse INTEGER CHECK (pulse > 0 AND pulse < 300),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_by UUID REFERENCES auth.users(id), -- Who recorded it (nurse/doctor/patient)
  notes TEXT,
  location TEXT, -- Where it was taken (clinic, home, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctor-Patient relationships table
CREATE TABLE IF NOT EXISTS public.doctor_patient_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id), -- Admin who assigned
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(doctor_id, patient_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_pressure_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patient_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Doctors can view patient profiles" ON public.profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctor_patient_relationships dpr
      WHERE dpr.doctor_id = auth.uid() 
      AND dpr.patient_id = profiles.id 
      AND dpr.is_active = TRUE
    )
  );

CREATE POLICY "Admins can view all profiles" ON public.profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- RLS Policies for blood pressure readings
CREATE POLICY "Patients can view own readings" ON public.blood_pressure_readings 
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert own readings" ON public.blood_pressure_readings 
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors can view patient readings" ON public.blood_pressure_readings 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctor_patient_relationships dpr
      WHERE dpr.doctor_id = auth.uid() 
      AND dpr.patient_id = blood_pressure_readings.patient_id 
      AND dpr.is_active = TRUE
    )
  );

CREATE POLICY "Healthcare staff can insert readings" ON public.blood_pressure_readings 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('doctor', 'nurse', 'admin')
    )
  );

-- RLS Policies for doctor-patient relationships
CREATE POLICY "Doctors can view their relationships" ON public.doctor_patient_relationships 
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can view their relationships" ON public.doctor_patient_relationships 
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Admins can manage all relationships" ON public.doctor_patient_relationships 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
