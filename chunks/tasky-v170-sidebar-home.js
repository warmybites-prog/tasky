
/* ============================================================
   Tasky V170 — Compact sidebar footer + Home indicator hydration
   ============================================================ */
(() => {
  'use strict';

  window.TASKY_UI_BUILD = 'V170';
  console.info('Tasky UI build', window.TASKY_UI_BUILD);

  const state = {
    hydratedWorkspace: null,
    hydrating: null,
    lastHydratedAt: 0,
    renderTimer: null
  };

  /* ------------------------------------------------------------
     1) Compact sidebar footer
     ------------------------------------------------------------ */
  const style = document.createElement('style');
  style.id = 'tasky-v170-sidebar-home-css';
  style.textContent = `
  /* Footer no longer consumes a large part of the navigation drawer. */
  .sidebar{
    overflow:hidden !important;
  }
  .sidebar .main-nav{
    flex:1 1 auto !important;
    min-height:0 !important;
    overflow-y:auto !important;
    overflow-x:hidden !important;
    overscroll-behavior:contain;
    -webkit-overflow-scrolling:touch;
  }
  .sidebar-bottom{
    margin-top:0 !important;
    flex:0 0 auto !important;
    display:grid !important;
    grid-template-columns:minmax(0,1fr) auto !important;
    grid-template-rows:auto auto !important;
    column-gap:8px !important;
    row-gap:6px !important;
    align-items:center !important;
    padding:8px 4px 4px !important;
    border-top:1px solid rgba(255,255,255,.08) !important;
    background:#12291A !important;
    min-height:0 !important;
  }
  .sidebar-bottom > div:first-child{
    grid-column:1 / -1 !important;
    min-width:0 !important;
    display:flex !important;
    align-items:center !important;
    gap:8px !important;
    padding:0 2px !important;
  }
  .sidebar-bottom > div:nth-child(2){
    grid-column:1 !important;
    min-width:0 !important;
  }
  .sidebar-bottom > button:last-child{
    grid-column:2 !important;
    align-self:stretch !important;
    margin:0 !important;
    padding:5px 8px !important;
    min-height:30px !important;
    border:1px solid rgba(255,255,255,.08) !important;
    border-radius:8px !important;
    background:rgba(255,255,255,.035) !important;
    color:#9FB09B !important;
    font-size:10.5px !important;
    line-height:1.2 !important;
    white-space:nowrap !important;
  }
  .sidebar-bottom > button:last-child:hover{
    background:rgba(255,255,255,.07) !important;
    color:#fff !important;
  }
  .sidebar-bottom .avatar{
    width:30px !important;
    height:30px !important;
    font-size:11px !important;
  }
  .sidebar-bottom .user-info{
    min-width:0 !important;
    flex:1 !important;
    line-height:1.15 !important;
  }
  .sidebar-bottom .user-info b{
    font-size:12px !important;
    white-space:nowrap !important;
    overflow:hidden !important;
    text-overflow:ellipsis !important;
  }
  .sidebar-bottom .user-info span{
    font-size:10.5px !important;
    white-space:nowrap !important;
    overflow:hidden !important;
    text-overflow:ellipsis !important;
  }
  #previewAsLabel{
    display:none !important;
  }
  .sidebar-bottom .role-toggle{
    width:min(150px,100%) !important;
    min-height:30px !important;
    padding:2px !important;
    gap:2px !important;
    border-radius:8px !important;
  }
  .sidebar-bottom .role-toggle button{
    min-height:26px !important;
    padding:4px 7px !important;
    font-size:10px !important;
    line-height:1.15 !important;
    border-radius:6px !important;
    white-space:nowrap !important;
  }

  /* Wider desktop: footer remains compact even when the sidebar is tall. */
  @media(min-width:821px){
    .sidebar-bottom{
      max-height:92px !important;
    }
  }

  /* Phones / tablets / narrow landscape. */
  @media(max-width:820px){
    .sidebar{
      height:100dvh !important;
      max-height:100dvh !important;
      padding-bottom:max(8px,env(safe-area-inset-bottom)) !important;
    }
    .sidebar-bottom{
      position:relative !important;
      z-index:3 !important;
      max-height:96px !important;
      padding:7px 8px max(5px,env(safe-area-inset-bottom)) !important;
      box-shadow:0 -8px 20px rgba(6,25,16,.12) !important;
    }
    .sidebar-bottom > div:first-child{
      gap:7px !important;
    }
    .sidebar-bottom .avatar{
      width:28px !important;
      height:28px !important;
    }
    .sidebar-bottom .user-info b{font-size:11.5px !important}
    .sidebar-bottom .user-info span{font-size:10px !important}
    .sidebar-bottom .role-toggle{
      width:min(132px,100%) !important;
      min-height:28px !important;
    }
    .sidebar-bottom .role-toggle button{
      min-height:24px !important;
      padding:3px 6px !important;
      font-size:9.5px !important;
    }
    .sidebar-bottom > button:last-child{
      min-height:28px !important;
      padding:4px 7px !important;
      font-size:10px !important;
    }
  }

  /* Very small/short screens: one slim profile line + controls line. */
  @media(max-width:480px), (max-height:700px){
    .sidebar-bottom{
      max-height:86px !important;
      row-gap:4px !important;
      padding-top:5px !important;
    }
    .sidebar-bottom .avatar{
      width:26px !important;
      height:26px !important;
    }
    .sidebar-bottom .user-info span{
      display:none !important;
    }
    .sidebar-bottom .role-toggle{
      width:min(118px,100%) !important;
    }
  }
  `;
  document.head.appendChild(style);

  function normalizeSidebarFooter() {
    const footer = document.querySelector('.sidebar-bottom');
    if (!footer) return;

    // Remove old inline layout values that forced a large vertical block.
    footer.style.removeProperty('flex-direction');
    footer.style.removeProperty('align-items');
    footer.style.removeProperty('gap');

    const label = document.getElementById('previewAsLabel');
    if (label) {
      label.title = (window.lang === 'en' ? 'Your role' : 'صلاحيتك');
      label.setAttribute('aria-hidden','true');
    }
  }

  /* ------------------------------------------------------------
     2) Home "Additional indicators" data hydration
     ------------------------------------------------------------
     Root cause:
     Tasky V83 loads Inventory/Budgets/Procurement/Marketing only when
     their modules are opened. Home reads their in-memory state, so on a
     fresh session it can display empty values until the user visits
     Budgets (or another source module).

     Fix:
     When Home is shown, hydrate only the data sources used by the home
     indicators, respecting package/module entitlements.
     ------------------------------------------------------------ */

  function moduleAllowed(id) {
    try {
      if (typeof window.taskyModuleAvailableV165 === 'function') {
        const available = window.taskyModuleAvailableV165(id);
        if (available === false) return false;
      }
    } catch (_) {}

    try {
      if (typeof window.planAllows === 'function' && window.currentPlan) {
        const allowed = window.planAllows(window.currentPlan, id);
        if (allowed === false) return false;
      }
    } catch (_) {}

    return true;
  }

  async function loadIndicatorSource(id) {
    if (!moduleAllowed(id)) return {id, skipped:true};

    if (typeof window.taskyEnsureModuleLoadedV83 === 'function') {
      return window.taskyEnsureModuleLoadedV83(id);
    }

    // Compatibility fallback for builds where V83 loader is unavailable.
    const fallbacks = {
      inventory: 'fetchInventory',
      budgets: 'fetchBudgets',
      vendors: 'fetchProcurementData',
      campaigns: 'fetchMarketingData'
    };
    const fn = window[fallbacks[id]];
    if (typeof fn === 'function') return fn();

    return {id, skipped:true};
  }

  function refreshHomeAfterHydration() {
    if (window.activeNav !== 'home') return;
    try {
      if (typeof window.renderAll === 'function') window.renderAll();
      else if (typeof window.renderModule === 'function') window.renderModule();
    } catch (e) {
      console.warn('V170 home indicator rerender', e);
    }
  }

  async function hydrateHomeIndicators({force=false}={}) {
    const workspace = window.currentWorkspaceId;
    if (!workspace) return false;

    const fresh = (
      !force &&
      state.hydratedWorkspace === workspace &&
      Date.now() - state.lastHydratedAt < 120000
    );
    if (fresh) return true;
    if (state.hydrating) return state.hydrating;

    state.hydrating = (async () => {
      try {
        await Promise.allSettled([
          loadIndicatorSource('inventory'),
          loadIndicatorSource('budgets'),
          loadIndicatorSource('vendors'),
          loadIndicatorSource('campaigns')
        ]);
        state.hydratedWorkspace = workspace;
        state.lastHydratedAt = Date.now();
        refreshHomeAfterHydration();
        return true;
      } finally {
        state.hydrating = null;
      }
    })();

    return state.hydrating;
  }

  function scheduleHomeHydration(delay=0) {
    clearTimeout(state.renderTimer);
    state.renderTimer = setTimeout(() => {
      if (window.activeNav === 'home' && window.currentWorkspaceId) {
        hydrateHomeIndicators().catch(e => console.warn('V170 home hydration', e));
      }
    }, delay);
  }

  /* Hook navigation without changing the existing routing logic. */
  function installNavigationHook() {
    if (typeof window.setActiveNav !== 'function' || window.__taskyV170NavHook) return false;
    window.__taskyV170NavHook = true;
    const base = window.setActiveNav;
    window.setActiveNav = async function(id, ...args) {
      const result = await base(id, ...args);
      normalizeSidebarFooter();
      if (id === 'home') scheduleHomeHydration(0);
      return result;
    };
    return true;
  }

  /* If budget/procurement/marketing data changes while the user is elsewhere,
     invalidate the home indicator cache so Home refreshes next time. */
  function wrapDataFetcher(name) {
    const fn = window[name];
    if (typeof fn !== 'function' || fn.__taskyV170Wrapped) return;
    const wrapped = async function(...args) {
      const result = await fn.apply(this,args);
      state.lastHydratedAt = 0;
      if (window.activeNav === 'home') refreshHomeAfterHydration();
      return result;
    };
    wrapped.__taskyV170Wrapped = true;
    window[name] = wrapped;
  }

  function installFetchHooks() {
    ['fetchInventory','fetchBudgets','fetchProcurementData','fetchMarketingData'].forEach(wrapDataFetcher);
  }

  function boot() {
    normalizeSidebarFooter();
    installNavigationHook();
    installFetchHooks();

    // Hydrate the default Home after workspace/session bootstrap, not before auth.
    let tries = 0;
    const timer = setInterval(() => {
      normalizeSidebarFooter();
      installNavigationHook();
      installFetchHooks();

      if (window.currentWorkspaceId) {
        if (window.activeNav === 'home') scheduleHomeHydration(60);
        if (++tries > 30) clearInterval(timer);
      } else if (++tries > 60) {
        clearInterval(timer);
      }
    }, 250);

    // DOM changes can recreate role buttons/footer; normalize cheaply.
    let raf = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(normalizeSidebarFooter);
    });
    observer.observe(document.body,{subtree:true,childList:true});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  } else {
    boot();
  }

  window.taskyHydrateHomeIndicatorsV170 = hydrateHomeIndicators;
})();
