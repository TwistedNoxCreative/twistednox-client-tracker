-- ==============================================================================
-- TwistedNox Creative - Client Tracker Database Schema & Bulletproof Fix Script
-- Supabase (PostgreSQL) Production Setup, RLS, Permissions, Realtime & Seeds
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENSURE SCHEMA & TABLE EXIST
-- Safely creates the table if missing, or adds any missing columns if the table
-- was created previously with a different schema.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    project_notes TEXT,
    last_contact_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'New Inquiry' NOT NULL
);

-- Idempotently verify and add all required columns to an existing table:
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS project_notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_contact_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'New Inquiry';

-- Synchronize notes and project_notes for full backward and forward compatibility:
UPDATE public.clients SET notes = project_notes WHERE notes IS NULL AND project_notes IS NOT NULL;
UPDATE public.clients SET project_notes = notes WHERE project_notes IS NULL AND notes IS NOT NULL;

-- Ensure status constraint is present and valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clients_status_check' 
          AND conrelid = 'public.clients'::regclass
    ) THEN
        ALTER TABLE public.clients 
        ADD CONSTRAINT clients_status_check 
        CHECK (status IN ('New Inquiry', 'In Progress', 'Revisions', 'Completed', 'Cancelled'));
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 2. SCHEMA & TABLE PRIVILEGES (CRITICAL FOR SUPABASE REST API)
-- Without these grants, the Supabase PostgREST API returns 401 or 403 Forbidden
-- even when RLS policies are created.
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.clients TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 3. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON public.clients(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);


-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) & CLEAN PERMISSIVE POLICIES
-- Enables client-side CRUD access via the anon public key for GitHub Pages.
-- ------------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Remove legacy or duplicate policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON public.clients;
DROP POLICY IF EXISTS "Allow public insert access" ON public.clients;
DROP POLICY IF EXISTS "Allow public update access" ON public.clients;
DROP POLICY IF EXISTS "Allow public delete access" ON public.clients;
DROP POLICY IF EXISTS "Allow anon and auth read" ON public.clients;
DROP POLICY IF EXISTS "Allow anon and auth insert" ON public.clients;
DROP POLICY IF EXISTS "Allow anon and auth update" ON public.clients;
DROP POLICY IF EXISTS "Allow anon and auth delete" ON public.clients;
DROP POLICY IF EXISTS "Enable all for anon" ON public.clients;

-- 1. Read Policy (SELECT)
CREATE POLICY "Allow anon and auth read" 
ON public.clients 
FOR SELECT 
TO anon, authenticated
USING (true);

-- 2. Create Policy (INSERT)
CREATE POLICY "Allow anon and auth insert" 
ON public.clients 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 3. Update Policy (UPDATE)
CREATE POLICY "Allow anon and auth update" 
ON public.clients 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Delete Policy (DELETE)
CREATE POLICY "Allow anon and auth delete" 
ON public.clients 
FOR DELETE 
TO anon, authenticated
USING (true);


-- ------------------------------------------------------------------------------
-- 5. REALTIME PUBLICATION CONFIGURATION
-- Enables live Supabase websocket updates (postgres_changes) for clients.
-- ------------------------------------------------------------------------------
-- Set replica identity to full so update/delete payloads include full rows:
ALTER TABLE public.clients REPLICA IDENTITY FULL;

-- Add clients table to the default supabase_realtime publication:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'clients'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 6. REALISTIC SAMPLE SEED DATA (Only seeded if table is empty)
-- ------------------------------------------------------------------------------
INSERT INTO public.clients (name, email, phone, notes, project_notes, last_contact_date, status)
SELECT * FROM (VALUES
    (
        'Valkyrie_Streamz (Sarah Jenkins)', 
        'sarah@valkyriestreamz.tv', 
        '+1 (555) 234-5678', 
        'Cyber-goth animated stream pack: Starting Soon, BRB, Ending, and Gameplay overlays. Webcam border with reactive audio visualizer. Deliverables in 1080p 60fps WebM format.', 
        'Cyber-goth animated stream pack: Starting Soon, BRB, Ending, and Gameplay overlays. Webcam border with reactive audio visualizer. Deliverables in 1080p 60fps WebM format.', 
        CURRENT_DATE - INTERVAL '1 day', 
        'In Progress'
    ),
    (
        'KitsuneLuna (VTuber Debut)', 
        'luna.kitsune.mgmt@gmail.com', 
        '+1 (555) 876-5432', 
        'Full VTuber branding package: Japanese folklore logo, Twitter banner, Twitch offline screen, 6 sub badges (fox spirits), and 10 animated chibi emotes. Currently reviewing round 2 color revisions.', 
        'Full VTuber branding package: Japanese folklore logo, Twitter banner, Twitch offline screen, 6 sub badges (fox spirits), and 10 animated chibi emotes. Currently reviewing round 2 color revisions.', 
        CURRENT_DATE - INTERVAL '2 days', 
        'Revisions'
    ),
    (
        'ShadowRogue99 (Marcus Vance)', 
        'marcus.vance99@outlook.com', 
        '+1 (555) 345-6789', 
        'YouTube & Kick channel overhaul. Requested animated stinger transition with custom dagger swoosh SFX, plus 3 custom alert popups (Follow, Sub, Raid). Awaiting contract sign-off.', 
        'YouTube & Kick channel overhaul. Requested animated stinger transition with custom dagger swoosh SFX, plus 3 custom alert popups (Follow, Sub, Raid). Awaiting contract sign-off.', 
        CURRENT_DATE, 
        'New Inquiry'
    ),
    (
        'PixelKnight (David Chen)', 
        'pixelknightgaming@gmail.com', 
        '+1 (555) 654-3210', 
        '16-bit retro arcade stream package: animated pixel bedroom scene, 8-bit chiptune stinger, and custom alert box CSS. Delivered final master files to client Google Drive.', 
        '16-bit retro arcade stream package: animated pixel bedroom scene, 8-bit chiptune stinger, and custom alert box CSS. Delivered final master files to client Google Drive.', 
        CURRENT_DATE - INTERVAL '14 days', 
        'Completed'
    ),
    (
        'EchoNebula (Aria Montgomery)', 
        'aria@echonebula.com', 
        '+1 (555) 987-1234', 
        'Consultation for 3D model texturing and stream alert animations. Client postponed stream launch indefinitely due to personal scheduling conflict.', 
        'Consultation for 3D model texturing and stream alert animations. Client postponed stream launch indefinitely due to personal scheduling conflict.', 
        CURRENT_DATE - INTERVAL '25 days', 
        'Cancelled'
    ),
    (
        'BobaBeats Lo-Fi (Kenji Sato)', 
        'kenji@bobabeats.media', 
        '+1 (555) 432-8765', 
        '24/7 Lo-Fi music stream animation: cozy coffee shop scene with rain on windows, steaming cup, sleeping cat loop, and day-to-night lighting transitions. In final rendering.', 
        '24/7 Lo-Fi music stream animation: cozy coffee shop scene with rain on windows, steaming cup, sleeping cat loop, and day-to-night lighting transitions. In final rendering.', 
        CURRENT_DATE - INTERVAL '3 days', 
        'In Progress'
    ),
    (
        'DragonSlayer_FPS (Tyler Brooks)', 
        'tyler.brooks.gg@gmail.com', 
        '+1 (555) 789-0123', 
        'High-energy competitive FPS branding: aggressive red/carbon-fiber theme, custom scoreboard HUD overlay, Twitch info panels, and animated Hype Train overlay.', 
        'High-energy competitive FPS branding: aggressive red/carbon-fiber theme, custom scoreboard HUD overlay, Twitch info panels, and animated Hype Train overlay.', 
        CURRENT_DATE, 
        'New Inquiry'
    )
) AS v(name, email, phone, notes, project_notes, last_contact_date, status)
WHERE NOT EXISTS (SELECT 1 FROM public.clients LIMIT 1);


-- ------------------------------------------------------------------------------
-- 7. INSTANT DIAGNOSTIC CHECKS & VERIFICATION
-- ------------------------------------------------------------------------------
-- Test 1: Check table contents
SELECT id, name, status, last_contact_date, created_at FROM public.clients ORDER BY created_at DESC;

-- Test 2: Check active RLS policies
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'clients';

-- Diagnostic One-Liner (Run this if you ever need to isolate an RLS issue):
-- ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
-- (To re-enable: ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;)
