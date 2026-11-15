-- ==============================================================================
-- TwistedNox Creative - Client Tracker Database Schema
-- Supabase (PostgreSQL) Schema Definition, Migrations, RLS, and Seed Data
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. QUICK MIGRATION (For Existing Tables)
-- If you already have a `clients` table and only need to add the `status` column,
-- run this standalone statement:
-- ------------------------------------------------------------------------------
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'New Inquiry' 
CHECK (status IN ('New Inquiry', 'In Progress', 'Revisions', 'Completed', 'Cancelled'));


-- ------------------------------------------------------------------------------
-- 2. FULL TABLE DEFINITION (Fresh Installation)
-- Creates the `clients` table with UUID primary key, timestamp tracking,
-- client details, project notes, contact dates, and project status.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    project_notes TEXT,
    last_contact_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'New Inquiry' NOT NULL 
        CHECK (status IN ('New Inquiry', 'In Progress', 'Revisions', 'Completed', 'Cancelled'))
);


-- ------------------------------------------------------------------------------
-- 3. PERFORMANCE INDEXES
-- Index frequently queried and filtered columns (status filtering, date sorting)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON clients(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);


-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ------------------------------------------------------------------------------
-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running script to ensure clean setup
DROP POLICY IF EXISTS "Allow public read access" ON clients;
DROP POLICY IF EXISTS "Allow public insert access" ON clients;
DROP POLICY IF EXISTS "Allow public update access" ON clients;
DROP POLICY IF EXISTS "Allow public delete access" ON clients;

-- Policies for public (anon) key access:
-- Note: These policies allow anyone with the Supabase anon key (used in frontend / GitHub Pages)
-- to read, add, update, and delete clients. This enables a zero-backend, client-side dashboard.

-- Allow read access
CREATE POLICY "Allow public read access" 
ON clients 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Allow insert access
CREATE POLICY "Allow public insert access" 
ON clients 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow update access
CREATE POLICY "Allow public update access" 
ON clients 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow delete access
CREATE POLICY "Allow public delete access" 
ON clients 
FOR DELETE 
TO anon, authenticated
USING (true);

/*
 ==============================================================================
 SECURITY ADVICE FOR PRODUCTION & GITHUB PAGES
 ==============================================================================
 1. Public Anon Key Exposure:
    The anon key in Supabase is intended to be public. Because GitHub Pages hosts 
    static assets, anyone viewing the source can see the anon key and project URL.
    
 2. Restricting Public Writes (Optional Hardening):
    If the tracker will be publicly hosted on GitHub Pages but only you should 
    edit records, consider:
      a) Using Supabase Auth (Email/Password or OAuth) and changing the policy:
         CREATE POLICY "Authenticated users can modify" ON clients 
         FOR ALL TO authenticated USING (true);
      b) Storing Supabase credentials only in localStorage / in-app settings modal 
         so each user inputs their own Supabase keys, keeping your repository 
         code clean of credentials.
      c) Restricting IP access or enabling HTTP referer checks in Supabase 
         Dashboard -> Project Settings -> API.
 ==============================================================================
*/


-- ------------------------------------------------------------------------------
-- 5. REALISTIC SAMPLE SEED DATA
-- Sample clients for TwistedNox Creative (Streamer Overlays, VTubers, Branding)
-- ------------------------------------------------------------------------------
INSERT INTO clients (name, email, phone, project_notes, last_contact_date, status)
VALUES
    (
        'Valkyrie_Streamz (Sarah Jenkins)', 
        'sarah@valkyriestreamz.tv', 
        '+1 (555) 234-5678', 
        'Cyber-goth animated stream pack: Starting Soon, BRB, Ending, and Gameplay overlays. Webcam border with reactive audio visualizer. Deliverables in 1080p 60fps WebM format.', 
        CURRENT_DATE - INTERVAL '1 day', 
        'In Progress'
    ),
    (
        'KitsuneLuna (VTuber Debut)', 
        'luna.kitsune.mgmt@gmail.com', 
        '+1 (555) 876-5432', 
        'Full VTuber branding package: Japanese folklore logo, Twitter banner, Twitch offline screen, 6 sub badges (fox spirits), and 10 animated chibi emotes. Currently reviewing round 2 color revisions.', 
        CURRENT_DATE - INTERVAL '2 days', 
        'Revisions'
    ),
    (
        'ShadowRogue99 (Marcus Vance)', 
        'marcus.vance99@outlook.com', 
        '+1 (555) 345-6789', 
        'YouTube & Kick channel overhaul. Requested animated stinger transition with custom dagger swoosh SFX, plus 3 custom alert popups (Follow, Sub, Raid). Awaiting contract sign-off.', 
        CURRENT_DATE, 
        'New Inquiry'
    ),
    (
        'PixelKnight (David Chen)', 
        'pixelknightgaming@gmail.com', 
        '+1 (555) 654-3210', 
        '16-bit retro arcade stream package: animated pixel bedroom scene, 8-bit chiptune stinger, and custom alert box CSS. Delivered final master files to client Google Drive.', 
        CURRENT_DATE - INTERVAL '14 days', 
        'Completed'
    ),
    (
        'EchoNebula (Aria Montgomery)', 
        'aria@echonebula.com', 
        '+1 (555) 987-1234', 
        'Consultation for 3D model texturing and stream alert animations. Client postponed stream launch indefinitely due to personal scheduling conflict.', 
        CURRENT_DATE - INTERVAL '25 days', 
        'Cancelled'
    ),
    (
        'BobaBeats Lo-Fi (Kenji Sato)', 
        'kenji@bobabeats.media', 
        '+1 (555) 432-8765', 
        '24/7 Lo-Fi music stream animation: cozy coffee shop scene with rain on windows, steaming cup, sleeping cat loop, and day-to-night lighting transitions. In final rendering.', 
        CURRENT_DATE - INTERVAL '3 days', 
        'In Progress'
    ),
    (
        'DragonSlayer_FPS (Tyler Brooks)', 
        'tyler.brooks.gg@gmail.com', 
        '+1 (555) 789-0123', 
        'High-energy competitive FPS branding: aggressive red/carbon-fiber theme, custom scoreboard HUD overlay, Twitch info panels, and animated Hype Train overlay.', 
        CURRENT_DATE, 
        'New Inquiry'
    )
ON CONFLICT DO NOTHING;


-- ------------------------------------------------------------------------------
-- 6. VERIFICATION QUERY
-- Run this query to verify your setup:
-- ------------------------------------------------------------------------------
-- SELECT id, name, status, last_contact_date, created_at FROM clients ORDER BY created_at DESC;
