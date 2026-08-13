
/* ============================================================
   Tasky Requests V169 — Service Desk UX + UUID/translation hotfix
   Drop-in patch for the current Tasky customer app.
   ============================================================ */
(() => {
  'use strict';

  window.TASKY_REQUESTS_BUILD = 'V169';
  console.info('Tasky Requests build', window.TASKY_REQUESTS_BUILD);

  const AR = {
    home:'الرئيسية',
    requests:'الطلبات',
    teamInbox:'صندوق الفريق',
    catalog:'الكتالوج',
    approvals:'الموافقات',
    knowledge:'المعرفة',
    sla:'SLA',
    reports:'التقارير',
    more:'المزيد',
    external:'العملاء الخارجيون',
    automation:'الأتمتة',
    settings:'الإعدادات',
    newRequest:'طلب جديد',
    impact:'الأثر',
    urgency:'الاستعجال',
    service:'الخدمة',
    team:'الفريق',
    priority:'الأولوية',
    description:'الوصف',
    notSet:'غير محدد',
    low:'منخفض',
    medium:'متوسط',
    high:'مرتفع',
    urgent:'عاجل',
    new:'جديدة',
    open:'مفتوحة',
    waitingCustomer:'بانتظار العميل',
    awaitingApproval:'بانتظار الموافقة',
    overdue:'متأخرة SLA',
    resolved:'محلولة',
    myRequests:'طلباتي',
    unassigned:'غير مسندة',
    vip:'VIP',
    today:'اليوم',
    search:'بحث في الطلبات…',
    filter:'فلترة',
    sort:'ترتيب',
    savedView:'عرض محفوظ',
    bulk:'إجراءات جماعية',
    reply:'رد',
    internalNote:'ملاحظة داخلية',
    attach:'إرفاق',
    transfer:'تحويل لفريق',
    escalate:'تصعيد',
    resolve:'حل الطلب',
    publicReply:'رد للعميل',
    queueHealth:'صحة الطابور',
    firstResponse:'وقت أول رد',
    resolutionTime:'وقت الحل',
    slaBreach:'تجاوز SLA',
    backlog:'الطلبات المتراكمة',
    csat:'رضا الخدمة',
    invalidUuid:'تعذر حفظ الطلب لأن أحد الحقول الاختيارية أُرسل بقيمة غير صحيحة. تمت معالجة الحقول الفارغة تلقائيًا؛ حاول الحفظ مرة أخرى.'
  };

  const EN = {
    home:'Home',requests:'Requests',teamInbox:'Team Inbox',catalog:'Catalog',
    approvals:'Approvals',knowledge:'Knowledge',sla:'SLA',reports:'Reports',more:'More',
    external:'External Customers',automation:'Automation',settings:'Settings',
    newRequest:'New Request',impact:'Impact',urgency:'Urgency',service:'Service',
    team:'Team',priority:'Priority',description:'Description',notSet:'Not set',
    low:'Low',medium:'Medium',high:'High',urgent:'Urgent',new:'New',open:'Open',
    waitingCustomer:'Waiting for customer',awaitingApproval:'Awaiting approval',
    overdue:'SLA overdue',resolved:'Resolved',myRequests:'My requests',
    unassigned:'Unassigned',vip:'VIP',today:'Today',search:'Search requests…',
    filter:'Filter',sort:'Sort',savedView:'Saved view',bulk:'Bulk actions',
    reply:'Reply',internalNote:'Internal note',attach:'Attach',transfer:'Transfer team',
    escalate:'Escalate',resolve:'Resolve',publicReply:'Public reply',queueHealth:'Queue health',
    firstResponse:'First response',resolutionTime:'Resolution time',
    slaBreach:'SLA breach',backlog:'Backlog',csat:'CSAT',
    invalidUuid:'The request could not be saved because an optional ID field was sent with an invalid value. Empty ID fields are now normalized automatically; try saving again.'
  };

  const L = () => (window.lang === 'en' ? EN : AR);

  /* ---------- 1) UUID empty-string hotfix ----------
     The screenshot error is PostgreSQL rejecting "" as uuid.
     Normalize empty optional *_id values to null before any Requests/Support RPC.
  */
  function sanitizeIds(value, key='') {
    if (Array.isArray(value)) {
      if (/(^|_)(ids|user_ids|member_ids|asset_ids)$/i.test(key)) {
        return value.filter(v => String(v ?? '').trim() !== '').map(v => sanitizeIds(v, ''));
      }
      return value.map(v => sanitizeIds(v, ''));
    }
    if (value && typeof value === 'object') {
      const out = {};
      for (const [k,v] of Object.entries(value)) out[k] = sanitizeIds(v, k);
      return out;
    }
    if (typeof value === 'string') {
      const s = value.trim();
      if (s === '' && (
        /(^|_)(id|uuid)$/i.test(key) ||
        /(^|_)(service_id|team_id|assignee_id|requester_id|customer_id|contact_id|asset_id|approver_id|owner_id|workspace_id|category_id|problem_id|change_id)$/i.test(key)
      )) return null;
    }
    return value;
  }

  function installRpcSanitizer() {
    if (!window.sb || typeof window.sb.rpc !== 'function' || window.__taskyReq169RpcPatched) return false;
    window.__taskyReq169RpcPatched = true;
    const base = window.sb.rpc.bind(window.sb);
    window.sb.rpc = function(fn, args, options) {
      let clean = args;
      if (/request|ticket|support|service|incident|problem|change|approval/i.test(String(fn||''))) {
        clean = sanitizeIds(args || {});
      }
      return base(fn, clean, options);
    };
    return true;
  }

  /* ---------- 2) Friendly UUID error localization ---------- */
  function localizeErrorMessage(msg) {
    const s = String(msg || '');
    if (/invalid input syntax for type uuid/i.test(s)) return L().invalidUuid;
    if (/null value in column .* violates not-null constraint/i.test(s))
      return window.lang === 'en' ? 'A required field is missing. Complete the required fields and try again.' : 'يوجد حقل مطلوب غير مكتمل. أكمل البيانات المطلوبة ثم حاول مرة أخرى.';
    if (/violates foreign key constraint/i.test(s))
      return window.lang === 'en' ? 'One of the selected records is no longer available. Refresh the page and choose again.' : 'أحد الخيارات المحددة لم يعد متاحًا. حدّث الصفحة واختره مرة أخرى.';
    return s;
  }

  function installDialogLocalization() {
    if (typeof window.showTaskyDialog !== 'function' || window.__taskyReq169DialogPatched) return false;
    window.__taskyReq169DialogPatched = true;
    const base = window.showTaskyDialog;
    window.showTaskyDialog = function(opts={}) {
      if (opts && typeof opts === 'object' && opts.message) {
        opts = {...opts, message:localizeErrorMessage(opts.message)};
      }
      return base(opts);
    };
    return true;
  }

  /* ---------- 3) Modal translations + optional-id normalization ---------- */
  const textMapAr = new Map([
    ['Impact','الأثر'], ['Urgency','الاستعجال'], ['Service','الخدمة'],
    ['Team','الفريق'], ['Priority','الأولوية'], ['Description','الوصف'],
    ['Low','منخفض'], ['Medium','متوسط'], ['High','مرتفع'], ['Urgent','عاجل'],
    ['New request','طلب جديد'], ['Save','حفظ'], ['Cancel','إلغاء']
  ]);

  function isRequestModal(root) {
    if (!root) return false;
    const t = (root.textContent || '').replace(/\s+/g,' ').trim();
    return /طلب جديد|New request|Requests|Service Desk|Impact|Urgency/.test(t);
  }

  function translateRequestModal(root) {
    if (!isRequestModal(root)) return;
    const isAr = window.lang !== 'en';
    root.classList.add('req169-modal');

    root.querySelectorAll('label,button,option,.tasky-select-value,.tasky-select-option').forEach(el => {
      const raw = (el.textContent || '').trim();
      if (isAr && textMapAr.has(raw)) el.textContent = textMapAr.get(raw);
      if (isAr && (raw === '—' || raw === '-' || raw === '--')) el.textContent = AR.notSet;
      if (!isAr && (raw === '—' || raw === '-' || raw === '--')) el.textContent = EN.notSet;
    });

    // Give optional UUID selects a semantic empty value.
    root.querySelectorAll('select').forEach(sel => {
      const label = (sel.closest('.field')?.querySelector('label')?.textContent || '').trim();
      if (/الخدمة|الفريق|Service|Team/i.test(label)) {
        [...sel.options].forEach(opt => {
          if (!String(opt.value ?? '').trim() || /^[—\-–]+$/.test((opt.textContent||'').trim())) {
            opt.value = '';
            opt.textContent = isAr ? AR.notSet : EN.notSet;
          }
        });
      }
    });

    // Before form submission, normalize select/input empty IDs in-place.
    root.querySelectorAll('form').forEach(form => {
      if (form.dataset.req169Sanitized) return;
      form.dataset.req169Sanitized = '1';
      form.addEventListener('submit', () => {
        form.querySelectorAll('select,input').forEach(el => {
          const id = String(el.id || '');
          const name = String(el.name || '');
          if (/(service|team|assignee|customer|asset|approver|owner).*id/i.test(id+' '+name) && !String(el.value||'').trim()) {
            el.value = '';
          }
        });
      }, true);
    });
  }

  /* ---------- 4) Requests page structure ---------- */
  function findRequestsRoot() {
    if (window.activeNav !== 'requests') return null;
    return document.getElementById('moduleArea') || document.querySelector('.content');
  }

  const normalizedLabels = {
    'نظرة عامة':'home','Overview':'home',
    'الطلبات':'requests','Requests':'requests',
    'صندوق الفريق':'teamInbox','Team Inbox':'teamInbox',
    'الكتالوج':'catalog','Catalog':'catalog','Service Catalog':'catalog',
    'الموافقات':'approvals','Approvals':'approvals',
    'المعرفة':'knowledge','Knowledge':'knowledge','Knowledge Base':'knowledge',
    'SLA':'sla',
    'التقارير':'reports','Reports':'reports',
    'العملاء الخارجيون':'external','External Customers':'external',
    'الأتمتة':'automation','Automation':'automation',
    'الإعدادات':'settings','Settings':'settings'
  };

  function semanticButtonLabel(btn) {
    const raw = (btn.textContent || '').replace(/\s+/g,' ').trim();
    return normalizedLabels[raw] || null;
  }

  function relabelRequestTabs(root) {
    const langMap = L();
    root.querySelectorAll('button').forEach(btn => {
      const key = semanticButtonLabel(btn);
      if (!key) return;
      const txt = langMap[key];
      if (txt) btn.textContent = txt;
      btn.dataset.req169Tab = key;
    });

    // Keep the daily tabs primary; less-used tabs visually grouped as "More".
    const tabs = [...root.querySelectorAll('button[data-req169-tab]')];
    const primary = new Set(['home','requests','teamInbox','catalog','approvals','knowledge','sla','reports']);
    tabs.forEach(b => b.classList.toggle('req169-secondary-tab', !primary.has(b.dataset.req169Tab)));
  }

  function tableRows(root) {
    return [...root.querySelectorAll('table tbody tr')].filter(r => r.querySelectorAll('td').length);
  }

  function textOfRow(row) { return (row.textContent || '').replace(/\s+/g,' ').trim().toLowerCase(); }

  function matchesStatus(row, key) {
    const t = textOfRow(row);
    const map = {
      new:['جديد','جديدة','new'],
      open:['مفتوح','مفتوحة','قيد التنفيذ','open','in progress','in_progress'],
      waitingCustomer:['بانتظار العميل','waiting customer','waiting for customer'],
      awaitingApproval:['بانتظار الموافقة','بانتظار الاعتماد','awaiting approval','pending approval'],
      overdue:['متأخر','متأخرة','تجاوز','overdue','breach'],
      resolved:['محلول','محلولة','مكتمل','مغلقة','مغلق','resolved','closed','completed']
    };
    return (map[key]||[]).some(x => t.includes(x));
  }

  function statusCount(root, key) {
    return tableRows(root).filter(r => matchesStatus(r,key)).length;
  }

  function applyRequestFilter(root, key='all') {
    root.dataset.req169Filter = key;
    tableRows(root).forEach(row => {
      const show = key==='all' || matchesStatus(row,key);
      row.classList.toggle('req169-hidden-row', !show);
    });
    root.querySelectorAll('.req169-status-btn').forEach(b => b.classList.toggle('active',b.dataset.filter===key));
  }

  function makeStatusStrip(root) {
    if (root.querySelector('.req169-status-strip')) return;
    const target = root.querySelector('.req169-command-anchor') || root.firstElementChild;
    const wrap = document.createElement('div');
    wrap.className = 'req169-status-strip';
    const statuses = [
      ['new',L().new],['open',L().open],['waitingCustomer',L().waitingCustomer],
      ['awaitingApproval',L().awaitingApproval],['overdue',L().overdue],['resolved',L().resolved]
    ];
    wrap.innerHTML = statuses.map(([k,label]) =>
      `<button type="button" class="req169-status-btn" data-filter="${k}"><span>${label}</span><b>${statusCount(root,k)}</b></button>`
    ).join('');
    wrap.addEventListener('click', e => {
      const b = e.target.closest('.req169-status-btn'); if (!b) return;
      applyRequestFilter(root,b.dataset.filter);
    });
    if (target?.parentNode) target.parentNode.insertBefore(wrap, target.nextSibling);
    else root.prepend(wrap);
  }

  function makeCommandBar(root) {
    if (root.querySelector('.req169-command-bar')) return;
    const bar = document.createElement('div');
    bar.className = 'req169-command-bar req169-command-anchor';
    bar.innerHTML = `
      <div class="req169-search"><svg viewBox="0 0 24 24"><path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"/></svg><input type="search" placeholder="${L().search}"></div>
      <div class="req169-command-actions">
        <button type="button" data-action="mine">${L().myRequests}</button>
        <button type="button" data-action="unassigned">${L().unassigned}</button>
        <button type="button" data-action="today">${L().today}</button>
        <button type="button" data-action="clear">${L().filter}</button>
      </div>`;
    const input = bar.querySelector('input');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      tableRows(root).forEach(row => row.classList.toggle('req169-hidden-row', !!q && !textOfRow(row).includes(q)));
    });
    bar.addEventListener('click', e => {
      const b = e.target.closest('button[data-action]'); if (!b) return;
      const action=b.dataset.action;
      if(action==='clear'){input.value='';applyRequestFilter(root,'all');tableRows(root).forEach(r=>r.classList.remove('req169-hidden-row'));return;}
      if(action==='unassigned'){
        tableRows(root).forEach(r=>r.classList.toggle('req169-hidden-row',!/غير مسند|unassigned/.test(textOfRow(r))));
      } else if(action==='today'){
        const today=new Date(),d=String(today.getDate()),iso=today.toISOString().slice(0,10);
        tableRows(root).forEach(r=>r.classList.toggle('req169-hidden-row',!(textOfRow(r).includes(iso)||textOfRow(r).includes(d))));
      } else if(action==='mine'){
        const me=(document.getElementById('userName')?.textContent||'').trim().toLowerCase();
        if(me)tableRows(root).forEach(r=>r.classList.toggle('req169-hidden-row',!textOfRow(r).includes(me)));
      }
    });
    const heading = [...root.querySelectorAll('h1,h2,h3')].find(h=>/الطلبات|Requests/i.test(h.textContent||''));
    const container = heading?.closest('.section-card,div') || root;
    if(container===root) root.prepend(bar); else container.insertAdjacentElement('afterend',bar);
  }

  /* ---------- 5) Mobile table → cards ---------- */
  function cardifyTables(root) {
    root.querySelectorAll('table').forEach(table => {
      if (table.dataset.req169Cardified) return;
      table.dataset.req169Cardified='1';
      table.classList.add('req169-table');
      const heads=[...table.querySelectorAll('thead th')].map(th=>(th.textContent||'').trim());
      table.querySelectorAll('tbody tr').forEach(tr => {
        tr.classList.add('req169-request-row');
        [...tr.children].forEach((td,i)=>td.dataset.label=heads[i]||'');
      });
    });
  }

  /* ---------- 6) Public reply vs Internal note ---------- */
  function markComposeActions(root=document) {
    root.querySelectorAll('button,label').forEach(el => {
      const t=(el.textContent||'').trim();
      if (/Public Reply|رد للعميل|رد عام|رد$/.test(t)) el.classList.add('req169-public-reply');
      if (/Internal Note|ملاحظة داخلية/.test(t)) el.classList.add('req169-internal-note');
      if (/تصعيد|Escalate/.test(t)) el.classList.add('req169-escalate');
      if (/حل الطلب|Resolve/.test(t)) el.classList.add('req169-resolve');
    });
  }

  /* ---------- 7) SLA countdown ----------
     Works on existing elements that expose an ISO due date in data-sla-due,
     datetime, title or text. Does not invent SLA data.
  */
  function parseDateCandidate(el) {
    const vals=[el.dataset?.slaDue,el.getAttribute?.('datetime'),el.getAttribute?.('title'),(el.textContent||'').trim()];
    for(const v of vals){
      if(!v)continue;
      const d=new Date(v);
      if(!Number.isNaN(d.getTime()) && d.getFullYear()>2020)return d;
    }
    return null;
  }
  function formatCountdown(ms){
    const overdue=ms<0,abs=Math.abs(ms),mins=Math.floor(abs/60000),h=Math.floor(mins/60),m=mins%60,d=Math.floor(h/24),hh=h%24;
    let s=d?`${d}${window.lang==='en'?'d':'ي'} ${hh}${window.lang==='en'?'h':'س'}`:`${h}${window.lang==='en'?'h':'س'} ${m}${window.lang==='en'?'m':'د'}`;
    return overdue?(window.lang==='en'?`Overdue ${s}`:`متأخر ${s}`):(window.lang==='en'?`${s} left`:`متبقي ${s}`);
  }
  function updateSlaCountdowns(root=document){
    root.querySelectorAll('[data-sla-due],time.req-sla,[class*="sla"]').forEach(el=>{
      if(el.closest('.req169-status-strip'))return;
      const d=parseDateCandidate(el);if(!d)return;
      el.classList.add('req169-sla-countdown');
      const ms=d-Date.now();el.dataset.req169Original=el.dataset.req169Original||el.textContent;
      el.textContent=formatCountdown(ms);el.classList.toggle('overdue',ms<0);
    });
  }

  /* ---------- 8) Request modal styling / mobile bottom action strip ---------- */
  function enhanceOpenModals() {
    const overlay=document.getElementById('addModalOverlay');
    const body=document.getElementById('addModalBody');
    if(body){translateRequestModal(body);markComposeActions(body);}
    if(overlay && !overlay.classList.contains('hidden') && isRequestModal(body)){
      overlay.classList.add('req169-request-overlay');
    } else overlay?.classList.remove('req169-request-overlay');
  }

  function enhanceRequestsPage() {
    installRpcSanitizer();
    installDialogLocalization();
    const root=findRequestsRoot();
    if(!root){enhanceOpenModals();return;}
    root.classList.add('req169-root');
    relabelRequestTabs(root);
    makeCommandBar(root);
    makeStatusStrip(root);
    cardifyTables(root);
    markComposeActions(root);
    updateSlaCountdowns(root);
    enhanceOpenModals();
  }

  /* ---------- 9) CSS ---------- */
  const style=document.createElement('style');
  style.id='tasky-requests-v169-css';
  style.textContent=`
  .req169-root{--req169-gap:14px}
  .req169-root h2,.req169-root h3{letter-spacing:0}
  .req169-root .section-card{border-radius:16px}
  .req169-secondary-tab{opacity:.72}
  .req169-command-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border:1px solid var(--border);border-radius:14px;background:var(--card);margin:12px 0}
  .req169-search{display:flex;align-items:center;gap:8px;min-width:260px;flex:1;max-width:560px;background:var(--paper);border:1px solid var(--border);border-radius:11px;padding:8px 11px}
  .req169-search svg{width:16px;height:16px;fill:none;stroke:var(--muted);stroke-width:1.8}
  .req169-search input{width:100%;border:0;outline:0;background:transparent;color:var(--ink);font-size:13px}
  .req169-command-actions{display:flex;gap:7px;overflow:auto;scrollbar-width:none}
  .req169-command-actions::-webkit-scrollbar{display:none}
  .req169-command-actions button{border:1px solid var(--border);background:var(--card);border-radius:10px;padding:8px 10px;color:var(--ink-soft);white-space:nowrap;font-size:11.5px;font-weight:700}
  .req169-status-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:10px 0 14px}
  .req169-status-btn{border:1px solid var(--border);background:var(--card);border-radius:12px;padding:10px 11px;display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--ink-soft);font-size:11.5px}
  .req169-status-btn b{font:800 15px Inter,'IBM Plex Sans Arabic';color:var(--ink)}
  .req169-status-btn.active{border-color:color-mix(in srgb,var(--green) 35%,var(--border));background:var(--green-tint);color:var(--green)}
  .req169-status-btn[data-filter="overdue"] b{color:var(--danger)}
  .req169-hidden-row{display:none!important}
  .req169-public-reply{background:var(--green)!important;color:#fff!important;border-color:var(--green)!important}
  .req169-internal-note{background:var(--amber-tint)!important;color:#7d5b12!important;border-color:color-mix(in srgb,var(--amber) 32%,var(--border))!important}
  .req169-escalate{color:var(--danger)!important}
  .req169-resolve{color:var(--green)!important}
  .req169-sla-countdown{display:inline-flex!important;align-items:center;gap:5px;font-weight:800;color:var(--green)}
  .req169-sla-countdown.overdue{color:var(--danger)}
  .req169-modal .field label{font-weight:700}
  .req169-modal .field select,.req169-modal .field input,.req169-modal .field textarea{min-height:44px}
  .req169-modal textarea{min-height:120px}
  .req169-modal .modal-head{margin-bottom:18px}
  .req169-request-overlay{z-index:5000!important}
  @media(max-width:1100px){
    .req169-status-strip{grid-template-columns:repeat(3,minmax(0,1fr))}
  }
  @media(max-width:700px){
    .req169-command-bar{position:sticky;top:0;z-index:8;display:block;padding:10px;margin-inline:-4px}
    .req169-search{min-width:0;max-width:none;width:100%}
    .req169-command-actions{margin-top:8px}
    .req169-status-strip{display:flex;overflow-x:auto;gap:7px;scroll-snap-type:x proximity;scrollbar-width:none;padding-bottom:3px}
    .req169-status-strip::-webkit-scrollbar{display:none}
    .req169-status-btn{min-width:148px;scroll-snap-align:start}
    .req169-table,.req169-table thead{display:block}
    .req169-table thead{display:none}
    .req169-table tbody{display:grid;gap:10px}
    .req169-table tr.req169-request-row{display:block;border:1px solid var(--border);background:var(--card);border-radius:14px;padding:11px 12px;box-shadow:0 2px 8px rgba(18,41,26,.035)}
    .req169-table tr.req169-request-row td{display:grid;grid-template-columns:minmax(90px,.8fr) minmax(0,1.2fr);gap:8px;padding:6px 0;border:0;font-size:12px;align-items:start}
    .req169-table tr.req169-request-row td:before{content:attr(data-label);color:var(--muted);font-size:10.5px;font-weight:700}
    .req169-modal{padding:16px!important}
    .req169-request-overlay{align-items:flex-end!important;padding:0!important}
    .req169-request-overlay .modal-card{width:100%!important;max-width:none!important;max-height:92dvh!important;border-radius:20px 20px 0 0!important;padding-bottom:calc(18px + env(safe-area-inset-bottom))!important}
  }`;
  document.head.appendChild(style);

  /* ---------- 10) Boot/observer ---------- */
  let raf=0;
  function schedule(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(enhanceRequestsPage);
  }
  const mo=new MutationObserver(schedule);
  const start=()=>{
    installRpcSanitizer();
    installDialogLocalization();
    mo.observe(document.body,{subtree:true,childList:true,characterData:false});
    schedule();
    setInterval(()=>{ if(window.activeNav==='requests') updateSlaCountdowns(findRequestsRoot()||document); },60000);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true}); else start();

  // Retry after Supabase/global dialogs finish booting.
  let attempts=0;
  const retry=setInterval(()=>{
    installRpcSanitizer();installDialogLocalization();schedule();
    if(++attempts>20 || (window.__taskyReq169RpcPatched && window.__taskyReq169DialogPatched))clearInterval(retry);
  },250);
})();
