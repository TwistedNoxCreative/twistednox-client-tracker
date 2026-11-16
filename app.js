/**
 * ==============================================================================
 * TWISTEDNOX CREATIVE — CLIENT TRACKER APPLICATION LOGIC
 * "Don't just stream. Be remembered."
 * Production-grade Vanilla ES6+ JavaScript client with Supabase JS v2 & Demo Mode
 * ==============================================================================
 */

(function () {
  'use strict';

  // ----------------------------------------------------------------------------
  // 1. CONSTANTS & CONFIGURATION
  // ----------------------------------------------------------------------------
  const STORAGE_KEY_URL = 'twistednox_supabase_url';
  const STORAGE_KEY_KEY = 'twistednox_supabase_key';
  const STORAGE_KEY_DEMO = 'twistednox_demo_clients';

  const ALLOWED_STATUSES = [
    'New Inquiry',
    'In Progress',
    'Revisions',
    'Completed',
    'Cancelled'
  ];

  // Realistic sample seed data for TwistedNox Creative (streamer & VTuber branding)
  const INITIAL_DEMO_CLIENTS = [
    {
      id: 'd9b32c21-120a-48f8-b397-6a10738e4a11',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      name: 'Valkyrie_Streamz (Sarah Jenkins)',
      email: 'sarah@valkyriestreamz.tv',
      phone: '+1 (555) 234-5678',
      notes: 'Cyber-goth animated stream pack: Starting Soon, BRB, Ending, and Gameplay overlays. Webcam border with reactive audio visualizer. Deliverables in 1080p 60fps WebM format.',
      last_contact_date: getOffsetDateString(-1),
      status: 'In Progress'
    },
    {
      id: 'e4a19f82-7481-4e78-952b-426d0bc88190',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      name: 'KitsuneLuna (VTuber Debut)',
      email: 'luna.kitsune.mgmt@gmail.com',
      phone: 'Discord: LunaKitsune#7777',
      notes: 'Full VTuber branding package: Japanese folklore logo, Twitter banner, Twitch offline screen, 6 sub badges (fox spirits), and 10 animated chibi emotes. Currently reviewing round 2 color revisions.',
      last_contact_date: getOffsetDateString(-2),
      status: 'Revisions'
    },
    {
      id: 'f72a4209-66bf-4071-b016-1b4d081275ca',
      created_at: new Date().toISOString(),
      name: 'ShadowRogue99 (Marcus Vance)',
      email: 'marcus.vance99@outlook.com',
      phone: '+1 (555) 345-6789',
      notes: 'YouTube & Kick channel overhaul. Requested animated stinger transition with custom dagger swoosh SFX, plus 3 custom alert popups (Follow, Sub, Raid). Awaiting contract sign-off.',
      last_contact_date: getOffsetDateString(0),
      status: 'New Inquiry'
    },
    {
      id: 'a12f901a-8e2b-4779-a728-403ce8fa46b1',
      created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
      name: 'PixelKnight (David Chen)',
      email: 'pixelknightgaming@gmail.com',
      phone: '+1 (555) 654-3210',
      notes: '16-bit retro arcade stream package: animated pixel bedroom scene, 8-bit chiptune stinger, and custom alert box CSS. Delivered final master files to client Google Drive.',
      last_contact_date: getOffsetDateString(-14),
      status: 'Completed'
    },
    {
      id: 'b65c34e8-8a90-410a-9d62-67fe5491e32d',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      name: 'EchoNebula (Aria Montgomery)',
      email: 'aria@echonebula.com',
      phone: '+1 (555) 987-1234',
      notes: 'Consultation for 3D model texturing and stream alert animations. Client postponed stream launch indefinitely due to personal scheduling conflict.',
      last_contact_date: getOffsetDateString(-25),
      status: 'Cancelled'
    },
    {
      id: 'c89e112d-90fb-48a3-b4e0-76ab902e88a3',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      name: 'BobaBeats Lo-Fi (Kenji Sato)',
      email: 'kenji@bobabeats.media',
      phone: '+1 (555) 432-8765',
      notes: '24/7 Lo-Fi music stream animation: cozy coffee shop scene with rain on windows, steaming cup, sleeping cat loop, and day-to-night lighting transitions. In final rendering.',
      last_contact_date: getOffsetDateString(-3),
      status: 'In Progress'
    },
    {
      id: 'a71b2390-34fa-4d10-85b9-4a9218d84bc7',
      created_at: new Date().toISOString(),
      name: 'DragonSlayer_FPS (Tyler Brooks)',
      email: 'tyler.brooks.gg@gmail.com',
      phone: 'Discord: DragonTyler#1337',
      notes: 'High-energy competitive FPS branding: aggressive red/carbon-fiber theme, custom scoreboard HUD overlay, Twitch info panels, and animated Hype Train overlay.',
      last_contact_date: getOffsetDateString(0),
      status: 'New Inquiry'
    }
  ];

  // Helper for generating YYYY-MM-DD string relative to today
  function getOffsetDateString(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  // ----------------------------------------------------------------------------
  // 2. STATE MANAGEMENT
  // ----------------------------------------------------------------------------
  let supabase = null;
  let realtimeChannel = null;
  let isDemoMode = false;
  let allClients = [];
  let sortColumn = 'last_contact_date';
  let sortAscending = false;
  let searchQuery = '';
  let statusFilter = 'ALL';
  let stagedDeleteClientId = null;

  // DOM Elements Cache
  const elements = {};

  // ----------------------------------------------------------------------------
  // 3. INITIALIZATION & LIFECYCLE
  // ----------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    cacheDomElements();
    attachEventListeners();
    initializeSupabaseClient();
  });

  function cacheDomElements() {
    elements.connectionBadge = document.getElementById('connectionBadge');
    elements.connectionDot = document.getElementById('connectionDot');
    elements.connectionText = document.getElementById('connectionText');
    elements.btnOpenConfig = document.getElementById('btnOpenConfig');
    elements.demoBanner = document.getElementById('demoBanner');
    elements.btnBannerConnect = document.getElementById('btnBannerConnect');

    // KPI elements
    elements.kpiInquiries = document.getElementById('kpiInquiries');
    elements.kpiInquiriesPercent = document.getElementById('kpiInquiriesPercent');
    elements.kpiActive = document.getElementById('kpiActive');
    elements.kpiActivePercent = document.getElementById('kpiActivePercent');
    elements.kpiRevisions = document.getElementById('kpiRevisions');
    elements.kpiRevisionsPercent = document.getElementById('kpiRevisionsPercent');
    elements.kpiCompleted = document.getElementById('kpiCompleted');
    elements.kpiTotalClients = document.getElementById('kpiTotalClients');

    // Controls
    elements.searchInput = document.getElementById('searchInput');
    elements.statusFilter = document.getElementById('statusFilter');
    elements.btnResetDemo = document.getElementById('btnResetDemo');
    elements.btnExportCsv = document.getElementById('btnExportCsv');
    elements.btnAddLead = document.getElementById('btnAddLead');

    // Table & States
    elements.clientsTable = document.getElementById('clientsTable');
    elements.clientsTableBody = document.getElementById('clientsTableBody');
    elements.emptyState = document.getElementById('emptyState');
    elements.btnEmptyAddLead = document.getElementById('btnEmptyAddLead');

    // Modals
    elements.addLeadModal = document.getElementById('addLeadModal');
    elements.addLeadForm = document.getElementById('addLeadForm');
    elements.addLeadDate = document.getElementById('addLeadDate');

    elements.editClientModal = document.getElementById('editClientModal');
    elements.editClientForm = document.getElementById('editClientForm');
    elements.editClientId = document.getElementById('editClientId');
    elements.editClientName = document.getElementById('editClientName');
    elements.editClientEmail = document.getElementById('editClientEmail');
    elements.editClientPhone = document.getElementById('editClientPhone');
    elements.editClientStatus = document.getElementById('editClientStatus');
    elements.editClientDate = document.getElementById('editClientDate');
    elements.editClientNotes = document.getElementById('editClientNotes');

    elements.deleteConfirmModal = document.getElementById('deleteConfirmModal');
    elements.deleteClientNameTarget = document.getElementById('deleteClientNameTarget');
    elements.btnConfirmDelete = document.getElementById('btnConfirmDelete');

    elements.configModal = document.getElementById('configModal');
    elements.configForm = document.getElementById('configForm');
    elements.cfgSupabaseUrl = document.getElementById('cfgSupabaseUrl');
    elements.cfgSupabaseKey = document.getElementById('cfgSupabaseKey');
    elements.btnUseDemoMode = document.getElementById('btnUseDemoMode');
    elements.btnClearConfig = document.getElementById('btnClearConfig');

    elements.toastContainer = document.getElementById('toastContainer');
  }

  // ----------------------------------------------------------------------------
  // 4. SUPABASE CLIENT & CREDENTIALS
  // ----------------------------------------------------------------------------
  async function initializeSupabaseClient() {
    setConnectionState('syncing', 'Connecting...');

    // 1. Check localStorage first
    const storedUrl = localStorage.getItem(STORAGE_KEY_URL);
    const storedKey = localStorage.getItem(STORAGE_KEY_KEY);

    // 2. Check window.SUPABASE_CONFIG if present
    const windowConfig = window.SUPABASE_CONFIG || {};
    const url = storedUrl || windowConfig.url;
    const anonKey = storedKey || windowConfig.anonKey;

    if (url && anonKey && isValidHttpUrl(url)) {
      try {
        if (!window.supabase || !window.supabase.createClient) {
          throw new Error('Supabase JS library not loaded from CDN');
        }

        supabase = window.supabase.createClient(url, anonKey, {
          auth: { persistSession: false }
        });

        // Test connection by running a ping query against `clients`
        const { error } = await supabase.from('clients').select('id', { count: 'exact', head: true });

        if (error) {
          throw error;
        }

        // Live connection confirmed!
        isDemoMode = false;
        elements.demoBanner.style.display = 'none';
        setConnectionState('connected', 'Live Cloud (Supabase)');
        setupRealtimeSubscription();
        await fetchClients();
        return;
      } catch (err) {
        console.warn('Supabase connection attempt failed:', err.message);
        showToast(`Could not connect to Supabase: ${err.message}. Entering local Demo Sandbox.`, 'warning', 6000);
      }
    }

    // Default: Fallback to Demo Mode
    enterDemoMode();
  }

  function enterDemoMode() {
    isDemoMode = true;
    supabase = null;
    if (realtimeChannel) {
      try { realtimeChannel.unsubscribe(); } catch (_) {}
      realtimeChannel = null;
    }

    setConnectionState('demo', 'Demo Sandbox (Local)');
    elements.demoBanner.style.display = 'flex';

    // Load or initialize demo clients
    const savedDemo = localStorage.getItem(STORAGE_KEY_DEMO);
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        allClients = parsed.map(c => ({
          ...c,
          notes: c.notes !== undefined && c.notes !== null ? c.notes : (c.project_notes || '')
        }));
      } catch (e) {
        allClients = [...INITIAL_DEMO_CLIENTS];
        saveDemoClients();
      }
    } else {
      allClients = [...INITIAL_DEMO_CLIENTS];
      saveDemoClients();
    }

    applyFilterAndRender();
  }

  function saveDemoClients() {
    localStorage.setItem(STORAGE_KEY_DEMO, JSON.stringify(allClients));
  }

  function setupRealtimeSubscription() {
    if (!supabase || isDemoMode) return;

    if (realtimeChannel) {
      try { supabase.removeChannel(realtimeChannel); } catch (_) {}
    }

    try {
      realtimeChannel = supabase
        .channel('public:clients')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'clients' },
          (payload) => {
            console.log('Realtime DB change received:', payload.eventType);
            fetchClients(false); // Background silent update
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime client channel active.');
          }
        });
    } catch (e) {
      console.warn('Realtime subscription not supported or blocked:', e);
    }
  }

  function setConnectionState(state, label) {
    elements.connectionDot.className = 'status-dot';
    if (state === 'connected') {
      elements.connectionDot.classList.add('connected');
    } else if (state === 'syncing') {
      elements.connectionDot.classList.add('syncing');
    } else if (state === 'demo') {
      elements.connectionDot.classList.add('syncing');
    } else {
      elements.connectionDot.classList.add('disconnected');
    }
    elements.connectionText.textContent = label;
  }

  // ----------------------------------------------------------------------------
  // 5. DATA OPERATIONS (FETCH, CREATE, UPDATE, DELETE)
  // ----------------------------------------------------------------------------
  async function fetchClients(showLoadingIndicator = true) {
    if (showLoadingIndicator) {
      renderLoadingSkeleton();
    }

    if (isDemoMode) {
      const saved = localStorage.getItem(STORAGE_KEY_DEMO);
      const parsed = saved ? JSON.parse(saved) : [...INITIAL_DEMO_CLIENTS];
      allClients = parsed.map(c => ({
        ...c,
        notes: c.notes !== undefined && c.notes !== null ? c.notes : (c.project_notes || '')
      }));
      applyFilterAndRender();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      allClients = (Array.isArray(data) ? data : []).map(c => ({
        ...c,
        notes: c.notes !== undefined && c.notes !== null ? c.notes : (c.project_notes || '')
      }));
      applyFilterAndRender();
    } catch (err) {
      console.error('fetchClients failed:', err);
      showToast(`Database query error: ${err.message}`, 'error');
      // If error occurs, render whatever we currently have
      applyFilterAndRender();
    }
  }

  async function createClient(clientData) {
    // Basic validation
    if (!clientData.name || !clientData.name.trim()) {
      showToast('Client or streamer name is required.', 'error');
      return false;
    }

    const noteValue = clientData.notes !== undefined && clientData.notes !== null
      ? clientData.notes.trim()
      : (clientData.project_notes ? clientData.project_notes.trim() : null);

    const payload = {
      name: clientData.name.trim(),
      email: clientData.email ? clientData.email.trim() : null,
      phone: clientData.phone ? clientData.phone.trim() : null,
      notes: noteValue,
      last_contact_date: clientData.last_contact_date || getOffsetDateString(0),
      status: clientData.status || 'New Inquiry'
    };

    if (isDemoMode) {
      const newRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'demo-' + Date.now(),
        created_at: new Date().toISOString(),
        ...payload,
        project_notes: noteValue
      };
      allClients.unshift(newRecord);
      saveDemoClients();
      showToast(`Added lead "${escapeHtml(payload.name)}" to Demo Sandbox.`, 'success');
      applyFilterAndRender();
      return true;
    }

    try {
      // Primary insert with `notes`. Fallback to `project_notes` if table schema is legacy.
      let { data, error } = await supabase
        .from('clients')
        .insert([payload])
        .select();

      if (error && error.message && error.message.includes('notes')) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.notes;
        fallbackPayload.project_notes = noteValue;
        const retryRes = await supabase.from('clients').insert([fallbackPayload]).select();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) throw error;

      showToast(`Client lead "${escapeHtml(payload.name)}" created!`, 'success');
      await fetchClients(false);
      return true;
    } catch (err) {
      console.error('createClient error:', err);
      showToast(`Failed to add client: ${err.message}`, 'error');
      return false;
    }
  }

  async function updateClient(id, updatedData) {
    if (!id) return false;

    const noteValue = updatedData.notes !== undefined && updatedData.notes !== null
      ? updatedData.notes.trim()
      : (updatedData.project_notes ? updatedData.project_notes.trim() : null);

    const payload = {
      name: updatedData.name.trim(),
      email: updatedData.email ? updatedData.email.trim() : null,
      phone: updatedData.phone ? updatedData.phone.trim() : null,
      notes: noteValue,
      last_contact_date: updatedData.last_contact_date || null,
      status: updatedData.status
    };

    if (isDemoMode) {
      const index = allClients.findIndex(c => c.id === id);
      if (index !== -1) {
        allClients[index] = { 
          ...allClients[index], 
          ...payload, 
          project_notes: noteValue 
        };
        saveDemoClients();
        showToast('Client details updated in Demo Sandbox.', 'success');
        applyFilterAndRender();
        return true;
      }
      return false;
    }

    try {
      // Primary update with `notes`. Fallback to `project_notes` if table schema is legacy.
      let { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', id);

      if (error && error.message && error.message.includes('notes')) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.notes;
        fallbackPayload.project_notes = noteValue;
        const retryRes = await supabase.from('clients').update(fallbackPayload).eq('id', id);
        error = retryRes.error;
      }

      if (error) throw error;

      showToast('Client record updated successfully!', 'success');
      await fetchClients(false);
      return true;
    } catch (err) {
      console.error('updateClient error:', err);
      showToast(`Failed to update client: ${err.message}`, 'error');
      return false;
    }
  }

  async function updateClientStatus(id, newStatus) {
    if (!ALLOWED_STATUSES.includes(newStatus)) {
      showToast('Invalid status choice.', 'error');
      return;
    }

    if (isDemoMode) {
      const client = allClients.find(c => c.id === id);
      if (client) {
        client.status = newStatus;
        saveDemoClients();
        showToast(`Status updated to "${newStatus}" for ${escapeHtml(client.name)}`, 'success');
        applyFilterAndRender();
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update locally immediately for snappy responsiveness
      const client = allClients.find(c => c.id === id);
      if (client) client.status = newStatus;
      showToast(`Status updated to "${newStatus}"`, 'success');
      applyFilterAndRender();
    } catch (err) {
      console.error('updateClientStatus error:', err);
      showToast(`Failed to update status: ${err.message}`, 'error');
      await fetchClients(false);
    }
  }

  async function deleteClient(id) {
    if (!id) return;

    if (isDemoMode) {
      const beforeLen = allClients.length;
      allClients = allClients.filter(c => c.id !== id);
      if (allClients.length < beforeLen) {
        saveDemoClients();
        showToast('Client record deleted from Demo Sandbox.', 'success');
        applyFilterAndRender();
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Client record permanently removed.', 'success');
      await fetchClients(false);
    } catch (err) {
      console.error('deleteClient error:', err);
      showToast(`Failed to delete client: ${err.message}`, 'error');
    }
  }

  // ----------------------------------------------------------------------------
  // 6. FILTERING, SORTING & RENDERING
  // ----------------------------------------------------------------------------
  function applyFilterAndRender() {
    // 1. Filter by status
    let list = allClients.slice();
    if (statusFilter && statusFilter !== 'ALL') {
      list = list.filter(c => c.status === statusFilter);
    }

    // 2. Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => {
        const name = (c.name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const notes = (c.notes || c.project_notes || '').toLowerCase();
        const status = (c.status || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || notes.includes(q) || status.includes(q);
      });
    }

    // 3. Sort records
    list.sort((a, b) => {
      let valA = a[sortColumn] || '';
      let valB = b[sortColumn] || '';

      if (sortColumn === 'last_contact_date' || sortColumn === 'created_at') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (valA < valB) return sortAscending ? -1 : 1;
      if (valA > valB) return sortAscending ? 1 : -1;
      return 0;
    });

    // 4. Update KPI metrics (calculated from the full client list)
    updateKpiMetrics();

    // 5. Render rows or empty state
    renderTableRows(list);
  }

  function updateKpiMetrics() {
    const total = allClients.length;
    const inquiries = allClients.filter(c => c.status === 'New Inquiry').length;
    const active = allClients.filter(c => c.status === 'In Progress').length;
    const revisions = allClients.filter(c => c.status === 'Revisions').length;
    const completed = allClients.filter(c => c.status === 'Completed').length;

    elements.kpiInquiries.textContent = inquiries;
    elements.kpiActive.textContent = active;
    elements.kpiRevisions.textContent = revisions;
    elements.kpiCompleted.textContent = completed;

    // Percentages of active production workload
    const activeTotal = total > 0 ? total : 1;
    elements.kpiInquiriesPercent.textContent = `${Math.round((inquiries / activeTotal) * 100)}%`;
    elements.kpiActivePercent.textContent = `${Math.round((active / activeTotal) * 100)}%`;
    elements.kpiRevisionsPercent.textContent = `${Math.round((revisions / activeTotal) * 100)}%`;
    elements.kpiTotalClients.textContent = `Total: ${total}`;
  }

  function renderTableRows(records) {
    if (!records || records.length === 0) {
      elements.clientsTableBody.innerHTML = '';
      elements.emptyState.style.display = 'flex';
      return;
    }

    elements.emptyState.style.display = 'none';

    const rowsHtml = records.map(client => {
      const initials = getInitials(client.name);
      const safeId = escapeHtml(client.id);
      const safeName = escapeHtml(client.name || 'Unnamed Client');
      const safeEmail = client.email ? escapeHtml(client.email) : '';
      const safePhone = client.phone ? escapeHtml(client.phone) : '';
      const rawNotes = client.notes || client.project_notes || '';
      const safeNotes = rawNotes ? escapeHtml(rawNotes) : 'No notes provided.';
      const safeDate = client.last_contact_date ? formatDate(client.last_contact_date) : '—';
      const status = client.status || 'New Inquiry';

      return `
        <tr data-client-id="${safeId}">
          <td>
            <div class="client-info-cell">
              <div class="client-avatar" aria-hidden="true">${initials}</div>
              <div class="client-name-wrap">
                <span class="client-name">${safeName}</span>
                <span class="client-subtext">${safeEmail || safePhone || 'No contact info'}</span>
              </div>
            </div>
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              ${safeEmail ? `<span style="font-size: 0.85rem; color: var(--text-primary);"><a href="mailto:${safeEmail}" style="color: inherit; text-decoration: none;">✉ ${safeEmail}</a></span>` : ''}
              ${safePhone ? `<span style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">📞 ${safePhone}</span>` : ''}
              ${!safeEmail && !safePhone ? `<span style="color: var(--text-dim); font-size: 0.8rem;">—</span>` : ''}
            </div>
          </td>
          <td>
            <div class="notes-cell" title="${safeNotes}">
              ${safeNotes}
            </div>
          </td>
          <td>
            <span class="date-cell">${safeDate}</span>
          </td>
          <td>
            <div class="status-cell-wrapper" style="display: inline-flex; align-items: center; gap: 0.5rem;">
              <span class="badge ${getStatusBadgeClass(status)}" data-status="${status}">
                <span class="badge-dot"></span>
                <span>${status}</span>
              </span>
              <!-- Fast Quick Status Select Dropdown -->
              <select 
                class="cyber-select quick-status-select" 
                data-change-status-id="${safeId}"
                title="Quick change status"
                style="padding: 0.25rem 1.6rem 0.25rem 0.5rem; font-size: 0.75rem; height: 26px;"
                aria-label="Change status for ${safeName}"
              >
                ${ALLOWED_STATUSES.map(st => `
                  <option value="${st}" ${st === status ? 'selected' : ''}>${st}</option>
                `).join('')}
              </select>
            </div>
          </td>
          <td class="actions-cell">
            <div class="actions-group">
              <button 
                class="btn btn-icon btn-edit-client" 
                data-client-id="${safeId}" 
                title="Edit client details"
                aria-label="Edit client ${safeName}"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button 
                class="btn btn-icon btn-icon-danger btn-delete-client" 
                data-client-id="${safeId}" 
                data-client-name="${safeName}"
                title="Delete client record"
                aria-label="Delete client ${safeName}"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    elements.clientsTableBody.innerHTML = rowsHtml;
  }

  function renderLoadingSkeleton() {
    elements.emptyState.style.display = 'none';
    elements.clientsTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="padding: 2.5rem 1rem; text-align: center;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
            <div class="cyber-spinner"></div>
            <div style="font-family: var(--font-subheading); color: var(--neon-cyan); letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.85rem;">
              Retrieving Neural Client Records...
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  // ----------------------------------------------------------------------------
  // 7. CSV EXPORT UTILITY
  // ----------------------------------------------------------------------------
  function exportClientsCsv() {
    if (!allClients || allClients.length === 0) {
      showToast('No clients available to export.', 'warning');
      return;
    }

    // Determine records to export (honor active search and status filter)
    let recordsToExport = allClients.slice();
    if (statusFilter && statusFilter !== 'ALL') {
      recordsToExport = recordsToExport.filter(c => c.status === statusFilter);
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      recordsToExport = recordsToExport.filter(c => {
        const name = (c.name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const notes = (c.notes || c.project_notes || '').toLowerCase();
        const status = (c.status || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || notes.includes(q) || status.includes(q);
      });
    }

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Notes', 'Last Contact Date', 'Status', 'Created At'];
    
    const rows = recordsToExport.map(c => [
      c.id || '',
      c.name || '',
      c.email || '',
      c.phone || '',
      c.notes || c.project_notes || '',
      c.last_contact_date || '',
      c.status || '',
      c.created_at || ''
    ]);

    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map(row => row.map(escapeCsvField).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];

    downloadAnchor.href = url;
    downloadAnchor.setAttribute('download', `twistednox-clients-${today}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);

    showToast(`Exported ${recordsToExport.length} clients to CSV.`, 'success');
  }

  function escapeCsvField(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  // ----------------------------------------------------------------------------
  // 8. EVENT LISTENERS & MODAL CONTROLS
  // ----------------------------------------------------------------------------
  function attachEventListeners() {
    // Search input (debounced)
    let searchTimeout = null;
    elements.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        applyFilterAndRender();
      }, 150);
    });

    // Status filter
    elements.statusFilter.addEventListener('change', (e) => {
      statusFilter = e.target.value;
      applyFilterAndRender();
    });

    // Sortable table headers
    const sortHeaders = elements.clientsTable.querySelectorAll('th.sortable');
    sortHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const targetCol = th.getAttribute('data-sort');
        if (sortColumn === targetCol) {
          sortAscending = !sortAscending;
        } else {
          sortColumn = targetCol;
          sortAscending = true;
        }

        // Update header classes and indicator icons
        sortHeaders.forEach(h => {
          h.classList.remove('sorted');
          const icon = h.querySelector('.sort-icon');
          if (icon) icon.textContent = '↕';
        });

        th.classList.add('sorted');
        const activeIcon = th.querySelector('.sort-icon');
        if (activeIcon) {
          activeIcon.textContent = sortAscending ? '▲' : '▼';
        }

        applyFilterAndRender();
      });
    });

    // Action buttons
    elements.btnAddLead.addEventListener('click', () => {
      openAddLeadModal();
    });

    elements.btnEmptyAddLead.addEventListener('click', () => {
      openAddLeadModal();
    });

    elements.btnExportCsv.addEventListener('click', () => {
      exportClientsCsv();
    });

    elements.btnResetDemo.addEventListener('click', () => {
      if (confirm('Reset demo client records to initial template dataset?')) {
        allClients = [...INITIAL_DEMO_CLIENTS];
        saveDemoClients();
        applyFilterAndRender();
        showToast('Demo dataset has been reset.', 'info');
      }
    });

    elements.btnOpenConfig.addEventListener('click', () => {
      openConfigModal();
    });

    elements.btnBannerConnect.addEventListener('click', () => {
      openConfigModal();
    });

    // Table body event delegation (Quick Status change, Edit, Delete)
    elements.clientsTableBody.addEventListener('change', (e) => {
      const select = e.target.closest('.quick-status-select');
      if (select) {
        const id = select.getAttribute('data-change-status-id');
        const newStatus = select.value;
        updateClientStatus(id, newStatus);
      }
    });

    elements.clientsTableBody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-client');
      if (editBtn) {
        const id = editBtn.getAttribute('data-client-id');
        openEditClientModal(id);
        return;
      }

      const deleteBtn = e.target.closest('.btn-delete-client');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-client-id');
        const name = deleteBtn.getAttribute('data-client-name');
        openDeleteConfirmModal(id, name);
        return;
      }
    });

    // Modal Close Buttons (delegated)
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        closeModal(modalId);
      });
    });

    // Close modal on click outside box
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal.id);
        }
      });
    });

    // Keyboard support: Escape closes active modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-backdrop.active');
        if (openModal) closeModal(openModal.id);
      }
    });

    // Form Submissions
    elements.addLeadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('addLeadName').value;
      const email = document.getElementById('addLeadEmail').value;
      const phone = document.getElementById('addLeadPhone').value;
      const status = document.getElementById('addLeadStatus').value;
      const last_contact_date = elements.addLeadDate.value;
      const notes = document.getElementById('addLeadNotes').value;

      const success = await createClient({
        name,
        email,
        phone,
        status,
        last_contact_date,
        notes
      });

      if (success) {
        elements.addLeadForm.reset();
        closeModal('addLeadModal');
      }
    });

    elements.editClientForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = elements.editClientId.value;
      const name = elements.editClientName.value;
      const email = elements.editClientEmail.value;
      const phone = elements.editClientPhone.value;
      const status = elements.editClientStatus.value;
      const last_contact_date = elements.editClientDate.value;
      const notes = elements.editClientNotes.value;

      const success = await updateClient(id, {
        name,
        email,
        phone,
        status,
        last_contact_date,
        notes
      });

      if (success) {
        closeModal('editClientModal');
      }
    });

    elements.btnConfirmDelete.addEventListener('click', async () => {
      if (stagedDeleteClientId) {
        const id = stagedDeleteClientId;
        stagedDeleteClientId = null;
        closeModal('deleteConfirmModal');
        await deleteClient(id);
      }
    });

    elements.configForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = elements.cfgSupabaseUrl.value.trim();
      const key = elements.cfgSupabaseKey.value.trim();

      if (!url || !key) {
        showToast('Please enter both Supabase Project URL and Anon Public Key.', 'error');
        return;
      }

      if (!isValidHttpUrl(url)) {
        showToast('Please enter a valid HTTP/HTTPS Supabase URL.', 'error');
        return;
      }

      localStorage.setItem(STORAGE_KEY_URL, url);
      localStorage.setItem(STORAGE_KEY_KEY, key);
      closeModal('configModal');
      showToast('Testing Supabase credentials...', 'info');
      await initializeSupabaseClient();
    });

    elements.btnUseDemoMode.addEventListener('click', () => {
      closeModal('configModal');
      enterDemoMode();
      showToast('Switched to local Demo Sandbox.', 'info');
    });

    elements.btnClearConfig.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_KEY);
      elements.cfgSupabaseUrl.value = '';
      elements.cfgSupabaseKey.value = '';
      closeModal('configModal');
      enterDemoMode();
      showToast('Supabase credentials removed from browser storage.', 'info');
    });
  }

  // ----------------------------------------------------------------------------
  // 9. MODAL HELPER FUNCTIONS
  // ----------------------------------------------------------------------------
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function openAddLeadModal() {
    elements.addLeadForm.reset();
    // Default contact date to current day
    elements.addLeadDate.value = getOffsetDateString(0);
    openModal('addLeadModal');
    setTimeout(() => {
      const firstInput = document.getElementById('addLeadName');
      if (firstInput) firstInput.focus();
    }, 50);
  }

  function openEditClientModal(id) {
    const client = allClients.find(c => c.id === id);
    if (!client) {
      showToast('Client record not found.', 'error');
      return;
    }

    elements.editClientId.value = client.id;
    elements.editClientName.value = client.name || '';
    elements.editClientEmail.value = client.email || '';
    elements.editClientPhone.value = client.phone || '';
    elements.editClientStatus.value = client.status || 'New Inquiry';
    elements.editClientDate.value = client.last_contact_date || '';
    elements.editClientNotes.value = client.notes || client.project_notes || '';

    openModal('editClientModal');
    setTimeout(() => {
      elements.editClientName.focus();
    }, 50);
  }

  function openDeleteConfirmModal(id, name) {
    stagedDeleteClientId = id;
    elements.deleteClientNameTarget.textContent = name || 'this client';
    openModal('deleteConfirmModal');
  }

  function openConfigModal() {
    elements.cfgSupabaseUrl.value = localStorage.getItem(STORAGE_KEY_URL) || '';
    elements.cfgSupabaseKey.value = localStorage.getItem(STORAGE_KEY_KEY) || '';
    openModal('configModal');
  }

  // ----------------------------------------------------------------------------
  // 10. TOAST NOTIFICATION SYSTEM
  // ----------------------------------------------------------------------------
  function showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '✦';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '⚠';
    if (type === 'warning') icon = '⚡';

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
      </div>
      <button type="button" class="toast-close" aria-label="Dismiss toast">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      dismissToast(toast);
    });

    elements.toastContainer.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(toast);
      }, duration);
    }
  }

  function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }

  // ----------------------------------------------------------------------------
  // 11. GENERAL UTILITY FUNCTIONS
  // ----------------------------------------------------------------------------
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getInitials(name) {
    if (!name) return 'TN';
    const clean = name.replace(/\(.*?\)/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'TN';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch (_) {
      return dateStr;
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'New Inquiry':
        return 'badge-new-inquiry';
      case 'In Progress':
        return 'badge-in-progress';
      case 'Revisions':
        return 'badge-revisions';
      case 'Completed':
        return 'badge-completed';
      case 'Cancelled':
        return 'badge-cancelled';
      default:
        return 'badge-new-inquiry';
    }
  }

  function isValidHttpUrl(string) {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
    return url.protocol === 'http:' || url.protocol === 'https:';
  }

})();
