# 🎨 TwistedNox Creative - Client Tracker Dashboard

A streamlined, modern client tracker dashboard tailored for **TwistedNox Creative** (streamer overlay packages, VTuber branding, animated alerts, motion graphics, and channel assets).

This application connects directly from a client-side frontend (HTML/CSS/JS) to a **Supabase (PostgreSQL)** backend without needing an intermediary Node/Express server, making it 100% compatible with free hosting on **GitHub Pages**.

---

## 📋 Table of Contents
1. [Database Schema Overview](#-database-schema-overview)
2. [Step 1: Setting Up Supabase](#-step-1-setting-up-supabase)
3. [Step 2: Executing the SQL Schema](#-step-2-executing-the-sql-schema)
4. [Step 3: Grabbing Your Supabase Credentials](#-step-3-grabbing-your-supabase-credentials)
5. [Step 4: Configuring the Web App](#-step-4-configuring-the-web-app)
6. [Step 5: Deploying to GitHub Pages](#-step-5-deploying-to-github-pages)
7. [Row Level Security & Production Security Advice](#-row-level-security--production-security-advice)
8. [Troubleshooting & Common Issues](#-troubleshooting--common-issues)

---

## 🗄️ Database Schema Overview

The database uses a single table named `clients` hosted on Supabase (PostgreSQL):

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique client identifier |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now() NOT NULL` | Timestamp when the client record was created |
| `name` | `TEXT` | `NOT NULL` | Client / Streamer / Brand name |
| `email` | `TEXT` | `NULLABLE` | Client contact email |
| `phone` | `TEXT` | `NULLABLE` | Client contact phone number or Discord tag |
| `notes` | `TEXT` | `NULLABLE` | Project notes, scope, deliverables, brief (primary) |
| `project_notes` | `TEXT` | `NULLABLE` | Legacy alias synced with `notes` for backward compatibility |
| `last_contact_date` | `DATE` | `DEFAULT CURRENT_DATE` | Date of last client communication |
| `status` | `VARCHAR(50)` | `DEFAULT 'New Inquiry' NOT NULL` | Current status (constrained to allowed list) |

### Allowed `status` Values
The `status` column is strictly constrained by a SQL `CHECK` constraint:
* 📥 **`New Inquiry`** - Initial message received, quoting, or awaiting brief.
* ⚡ **`In Progress`** - Active design, 3D modeling, animation, or rendering.
* 🔁 **`Revisions`** - Reviewing client feedback (round 1/2/final touches).
* ✅ **`Completed`** - Deliverables sent, assets transferred, project closed.
* 🚫 **`Cancelled`** - Client paused or terminated project.

### Indexes for Performance
* `idx_clients_status`: Optimizes tab filtering and pipeline views by status.
* `idx_clients_last_contact`: Speeds up sorting by most recent or stale contacts.
* `idx_clients_created_at`: Speeds up reverse chronological display.

---

## 🚀 Step 1: Setting Up Supabase

1. Go to [supabase.com](https://supabase.com) and log in or create a free account.
2. Click **New Project** in your dashboard.
3. Choose an organization, enter a project name (e.g., `twistednox-tracker`), and generate a strong database password.
4. Select your preferred region (closest to your primary audience) and click **Create new project**.
5. Wait 1–2 minutes for the database to provision.

---

## 💻 Step 2: Executing the SQL Schema

All required SQL commands are available in [`schema.sql`](./schema.sql).

1. In your Supabase project dashboard, navigate to the **SQL Editor** (icon with terminal `>_` on the left navigation bar).
2. Click **New query** (or `+`).

### Case A: Upgrading an Existing Table (Adding `status` column)
If you already have a `clients` table and only need to add the `status` column with the check constraint, paste and run:
```sql
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'New Inquiry' 
CHECK (status IN ('New Inquiry', 'In Progress', 'Revisions', 'Completed', 'Cancelled'));
```

### Case B: Fresh Setup (Recommended)
Copy the entire contents of [`schema.sql`](./schema.sql) and paste into the SQL Editor. This script:
- Creates the `clients` table with UUID keys and correct data types.
- Sets up performance indexes.
- Enables Row Level Security (RLS) with full CRUD access for the `anon` key.
- Seeds realistic sample client data (Twitch overlays, VTuber branding, Lo-Fi animations).
3. Click the green **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`).
4. You should see `Success. No rows returned`.
5. Go to the **Table Editor** on the left menu and click on `clients` to confirm the table and seed data appear.

---

## 🔑 Step 3: Grabbing Your Supabase Credentials

To allow the frontend to interact with your Supabase database:

1. In Supabase, go to **Project Settings** (gear icon at the bottom of the left sidebar).
2. Click **API** under Configuration.
3. Find the following values:
   - **Project URL**: e.g., `https://abcdefghijklm.supabase.co`
   - **Project API Keys** -> **`anon` `public`**: A long JWT token labeled `anon` `public` (safe for browser use with appropriate RLS policies).
4. Keep this tab open or copy both values.

---

## ⚙️ Step 4: Configuring the Web App

The dashboard supports configuring your Supabase connection directly:

1. **Option 1: Config File (`config.js`)**
   If a `config.js` file is used by the frontend, update it with your credentials:
   ```javascript
   window.SUPABASE_CONFIG = {
     url: "https://YOUR_PROJECT_ID.supabase.co",
     anonKey: "YOUR_SUPABASE_ANON_PUBLIC_KEY"
   };
   ```
2. **Option 2: In-App Settings / LocalStorage**
   Many versions of the tracker include a built-in Settings modal (gear icon) where you can directly paste your **Supabase URL** and **Anon Key**. When entered, credentials are saved securely in your browser's `localStorage`, avoiding the need to hardcode keys into the git repository.

---

## 🌐 Step 5: Deploying to GitHub Pages

Because the app is a static client-side web application, you can host it for free on GitHub Pages:

### 1. Initialize Git Repository
In your terminal, navigate to the project directory:
```bash
cd twistednox-client-tracker
git init
git add .
git commit -m "Initial commit of TwistedNox Client Tracker"
```

### 2. Push to GitHub
1. Create a new public or private repository on [GitHub](https://github.com/new) (e.g. `twistednox-client-tracker`).
2. Link your local repo and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/twistednox-client-tracker.git
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages
1. On GitHub, navigate to your repository's **Settings** tab.
2. In the left sidebar, click **Pages** (under "Code and automation").
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: Select `main` and folder `/ (root)`
4. Click **Save**.
5. Wait 1–2 minutes. Refresh the page until GitHub displays:
   > *"Your site is live at https://YOUR_USERNAME.github.io/twistednox-client-tracker/"*

---

## 🛡️ Row Level Security & Production Security Advice

### How RLS & Permissions are Configured in `schema.sql`
By default, `schema.sql` applies explicit schema and table grants, followed by clean permissive policies for `anon` and `authenticated`:
```sql
-- Explicit Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.clients TO anon, authenticated, service_role;

-- Clean Permissive RLS Policies
CREATE POLICY "Allow anon and auth read" ON public.clients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon and auth insert" ON public.clients FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon and auth update" ON public.clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon and auth delete" ON public.clients FOR DELETE TO anon, authenticated USING (true);

-- Realtime Publication
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
```

### ⚡ Instant Diagnostic One-Liner
If you ever encounter connection issues or suspect an RLS misconfiguration, you can run this one-liner in the Supabase SQL Editor to test if RLS is blocking queries:
```sql
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
```
If your dashboard immediately connects and loads data, re-run Section 4 of `schema.sql` and re-enable RLS:
```sql
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
```

### Security Considerations for GitHub Pages
1. **Public Anon Key Visibility**:
   The `anon` key is intentionally public. When hosted on GitHub Pages, anyone viewing the source code or network inspector can see this key.
2. **Protecting Production Data**:
   - **Option A (Settings via LocalStorage)**: If you use the in-app settings modal, your repository remains clean of keys, and only visitors who configure their keys will interact with your database.
   - **Option B (Supabase Authentication)**: For true multi-user or protected single-tenant use, enable Supabase Auth (Email + Password) and adjust policies so only `authenticated` users can write:
     ```sql
     DROP POLICY "Allow public insert access" ON clients;
     DROP POLICY "Allow public update access" ON clients;
     DROP POLICY "Allow public delete access" ON clients;
     
     CREATE POLICY "Only authenticated users can modify" 
     ON clients FOR ALL 
     TO authenticated 
     USING (true) 
     WITH CHECK (true);
     ```

---

## 🔧 Troubleshooting & Common Issues

### 1. Error: `new row for relation "clients" violates check constraint "clients_status_check"`
* **Cause**: Attempting to insert or update a status value not listed in the check constraint.
* **Fix**: Ensure your status is exactly one of: `'New Inquiry'`, `'In Progress'`, `'Revisions'`, `'Completed'`, `'Cancelled'`. Note that status values are case-sensitive.

### 2. Error: `401 Unauthorized` or `Invalid API Key`
* **Cause**: The `anon` key copied from Supabase is incomplete or truncated.
* **Fix**: Return to Supabase -> Project Settings -> API, re-copy the `anon` public key (make sure not to use the `service_role` secret key in client-side code).

### 3. Error: `permission denied for table clients` (403)
* **Cause**: Row Level Security (RLS) is enabled, but policies were not created.
* **Fix**: Re-run Section 4 of `schema.sql` to apply the public CRUD policies.

### 4. Blank Page or 404 Assets on GitHub Pages
* **Cause**: Absolute file paths like `/style.css` instead of relative paths `./style.css`.
* **Fix**: Ensure all script tags, stylesheets, and images use relative paths (`./`) in `index.html`.

---

© **TwistedNox Creative** — Streamer Overlays • VTuber Assets • Motion Branding
