
/* ============================================================
   TASKY HR LEAVE V256
   - Half-day leave (first/second half), charged as 0.5 day
   - Study Leave built-in leave type
   - Other built-in leave type + required custom description
   ============================================================ */

(function(){
  if(window.TASKY_HR_LEAVE_V256===true)return;

  const HR256_VERSION='V257';
  let hr256TypesEnsuredWorkspace=null;
  let hr256TypesEnsurePromise=null;

  function hr256L(ar,en){return typeof hrL72==='function'?hrL72(ar,en):(window.lang==='en'?en:ar)}
  function hr256Esc(v){return typeof escapeHtml==='function'?escapeHtml(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  (function(){
    if(document.getElementById('tasky-hr-leave-v256-css'))return;
    const s=document.createElement('style');
    s.id='tasky-hr-leave-v256-css';
    s.textContent=`
      .hr256-leave-card{
        grid-column:1/-1;
        border:1px solid var(--border);
        border-radius:14px;
        background:color-mix(in srgb,var(--green-tint) 36%,var(--card));
        padding:12px;
      }
      .hr256-leave-card h4{font-size:11px;margin:0 0 4px}
      .hr256-leave-card p{font-size:9px;color:var(--muted);line-height:1.65;margin:0}
      .hr256-segment{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:5px;
        padding:4px;
        border:1px solid var(--border);
        background:var(--paper);
        border-radius:11px;
      }
      .hr256-segment button{
        border:0;
        border-radius:8px;
        background:transparent;
        color:var(--muted);
        padding:8px 9px;
        font:inherit;
        font-size:10.5px;
        font-weight:800;
      }
      .hr256-segment button.active{
        background:var(--green-tint);
        color:var(--green);
        box-shadow:0 0 0 1px color-mix(in srgb,var(--green) 20%,transparent);
      }
      .hr256-hidden{display:none!important}
      .hr256-summary{
        grid-column:1/-1;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        border:1px solid var(--border);
        border-radius:12px;
        background:var(--paper);
        padding:10px 12px;
      }
      .hr256-summary span{font-size:9.5px;color:var(--muted)}
      .hr256-summary b{font-size:14px;color:var(--green)}
      .hr256-required-note{font-size:8.5px;color:var(--muted);margin-top:4px}
      @media(max-width:640px){
        .hr256-summary{align-items:flex-start;flex-direction:column}
      }
    `;
    document.head.appendChild(s);
  })();

  function hr256SystemKey(type){
    if(!type)return '';
    const explicit=String(type.system_key||'').trim().toLowerCase();
    if(explicit)return explicit;
    const ar=String(type.name_ar||'').trim().toLowerCase();
    const en=String(type.name_en||'').trim().toLowerCase();
    if(ar.includes('دراس')||en.includes('study'))return 'study';
    if(ar==='أخرى'||ar==='اخرى'||en==='other')return 'other';
    return '';
  }

  function hr256TypeById(id){
    return (hrV72?.leaveTypes||[]).find(x=>String(x.id)===String(id))||null;
  }

  function hr256SelectedType(){
    return hr256TypeById(document.getElementById('hrLeaveType')?.value||'');
  }

  function hr256SelectOptions(types){
    return (types||[]).map(t=>{
      const label=window.lang==='ar'?(t.name_ar||t.name_en):(t.name_en||t.name_ar);
      return `<option value="${hr256Esc(t.id)}" data-system-key="${hr256Esc(hr256SystemKey(t))}">${hr256Esc(label||'—')}</option>`;
    }).join('');
  }

  async function hr256EnsureTypes(force=false){
    if(!window.currentWorkspaceId)return [];
    const key=String(currentWorkspaceId);
    if(!force&&hr256TypesEnsuredWorkspace===key)return hrV72?.leaveTypes||[];
    if(hr256TypesEnsurePromise)return hr256TypesEnsurePromise;

    hr256TypesEnsurePromise=(async()=>{
      const {data,error}=await sb.rpc('tasky_hr_ensure_leave_types_v256',{p_workspace_id:currentWorkspaceId});
      if(error)throw error;

      if(Array.isArray(data)){
        const map=new Map((hrV72.leaveTypes||[]).map(x=>[String(x.id),x]));
        for(const row of data||[])map.set(String(row.id),row);
        hrV72.leaveTypes=[...map.values()];
      }

      hr256TypesEnsuredWorkspace=key;
      return hrV72.leaveTypes||[];
    })();

    try{return await hr256TypesEnsurePromise}
    finally{hr256TypesEnsurePromise=null}
  }

  function hr256DateDays(start,end){
    if(!start)return 0;
    const a=new Date(`${start}T12:00:00`);
    const b=new Date(`${(end||start)}T12:00:00`);
    if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())||b<a)return 0;
    return Math.floor((b-a)/86400000)+1;
  }

  window.hr256SetDuration=function(kind){
    const input=document.getElementById('hrLeaveDuration');
    if(input)input.value=kind;
    document.querySelectorAll('[data-hr256-duration]').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.hr256Duration===kind);
    });
    window.hr256UpdateLeaveForm();
  };

  window.hr256UpdateLeaveForm=function(){
    const duration=document.getElementById('hrLeaveDuration')?.value||'full_day';
    const type=hr256SelectedType();
    const systemKey=hr256SystemKey(type);

    const endWrap=document.getElementById('hr256EndWrap');
    const halfWrap=document.getElementById('hr256HalfWrap');
    const studyWrap=document.getElementById('hr256StudyWrap');
    const otherWrap=document.getElementById('hr256OtherWrap');

    endWrap?.classList.toggle('hr256-hidden',duration==='half_day');
    halfWrap?.classList.toggle('hr256-hidden',duration!=='half_day');
    studyWrap?.classList.toggle('hr256-hidden',systemKey!=='study');
    otherWrap?.classList.toggle('hr256-hidden',systemKey!=='other');

    const start=document.getElementById('hrLeaveStart')?.value||'';
    const endEl=document.getElementById('hrLeaveEnd');
    if(duration==='half_day'&&endEl&&start)endEl.value=start;

    const days=duration==='half_day'?0.5:hr256DateDays(start,endEl?.value||start);
    const daysEl=document.getElementById('hr256DaysValue');
    if(daysEl)daysEl.textContent=days?String(days):'—';

    const periodEl=document.getElementById('hr256PeriodSummary');
    if(periodEl){
      if(duration==='half_day'){
        const period=document.getElementById('hrLeaveHalfPeriod')?.value||'first_half';
        periodEl.textContent=period==='second_half'
          ?hr256L('نصف يوم — الفترة الثانية','Half day — second half')
          :hr256L('نصف يوم — الفترة الأولى','Half day — first half');
      }else{
        periodEl.textContent=hr256L('إجازة يوم كامل','Full-day leave');
      }
    }
  };

  async function hr256OpenLeaveForm(){
    if(!window.currentWorkspaceId)return;
    const ctx=window.hrContextV72||{};
    if(typeof hrCanManage72==='function'&&!hrCanManage72()&&!ctx.employee_id){
      showTaskyDialog({
        title:hr256L('تعذّر فتح طلب الإجازة','Could not open leave request'),
        message:hr256L('لا يوجد ملف موظف مرتبط بهذا المستخدم بعد.','No employee profile is linked to this user yet.'),
        tone:'warning'
      });
      return;
    }

    try{
      await hr256EnsureTypes();
    }catch(err){
      const msg=String(err?.message||err);
      const migrationMissing=/tasky_hr_ensure_leave_types_v256|does not exist|schema cache/i.test(msg);
      showTaskyDialog({
        title:hr256L('تحديث نظام الإجازات مطلوب','Leave system update required'),
        message:migrationMissing
          ?hr256L('شغّل ملف SQL الخاص بـ V256 في Supabase مرة واحدة، ثم افتح طلب الإجازة مجددًا.','Run the V256 SQL once in Supabase, then open Leave Request again.')
          :msg,
        tone:'warning'
      });
      return;
    }

    const selectedEmp=typeof hrCanManage72==='function'&&hrCanManage72()?'':((window.hrContextV72||{}).employee_id||'');
    const empOpts=typeof hrOptions72==='function'?hrOptions72(hrV72.employees,'id',hrName72):'';
    const typeOpts=hr256SelectOptions(hrV72.leaveTypes||[]);

    const employeeField=(typeof hrCanManage72==='function'&&hrCanManage72())
      ?hrSelect72('hrLeaveEmp',hr256L('الموظف','Employee'),empOpts)
      :`<input id="hrLeaveEmp" type="hidden" value="${hr256Esc(selectedEmp)}">`;

    const body=`<form onsubmit="hrSubmitFormV72(event,'leave')">
      <div class="hr72-form">
        <div class="hr256-leave-card">
          <h4>${hr256L('مدة الإجازة','Leave duration')}</h4>
          <p>${hr256L('اختر يومًا كاملًا أو نصف يوم. نصف اليوم يُحتسب 0.5 يوم من نوع الإجازة المحدد.','Choose a full day or half day. A half day counts as 0.5 day from the selected leave type.')}</p>
        </div>

        ${employeeField}

        <div class="field">
          <label>${hr256L('نوع الإجازة','Leave type')}</label>
          <select id="hrLeaveType" onchange="hr256UpdateLeaveForm()" required>${typeOpts}</select>
        </div>

        <div class="field full">
          <label>${hr256L('المدة','Duration')}</label>
          <input id="hrLeaveDuration" type="hidden" value="full_day">
          <div class="hr256-segment">
            <button type="button" class="active" data-hr256-duration="full_day" onclick="hr256SetDuration('full_day')">${hr256L('يوم كامل','Full day')}</button>
            <button type="button" data-hr256-duration="half_day" onclick="hr256SetDuration('half_day')">${hr256L('نصف يوم','Half day')}</button>
          </div>
        </div>

        <div class="field">
          <label>${hr256L('من','From')}</label>
          <input id="hrLeaveStart" type="date" required onchange="hr256UpdateLeaveForm()">
        </div>

        <div class="field" id="hr256EndWrap">
          <label>${hr256L('إلى','To')}</label>
          <input id="hrLeaveEnd" type="date" required onchange="hr256UpdateLeaveForm()">
        </div>

        <div class="field full hr256-hidden" id="hr256HalfWrap">
          <label>${hr256L('فترة نصف اليوم','Half-day period')}</label>
          <select id="hrLeaveHalfPeriod" onchange="hr256UpdateLeaveForm()">
            <option value="first_half">${hr256L('الفترة الأولى','First half')}</option>
            <option value="second_half">${hr256L('الفترة الثانية','Second half')}</option>
          </select>
          <div class="hr256-required-note">${hr256L('تُستخدم الفترة لتوضيح أي نصف من يوم العمل يشمله الطلب.','This indicates which half of the workday the request covers.')}</div>
        </div>

        <div class="field full hr256-hidden" id="hr256StudyWrap">
          <label>${hr256L('الجهة التعليمية','Educational institution')}</label>
          <input id="hrLeaveStudyInstitution" type="text" placeholder="${hr256L('اسم الجامعة أو الجهة التعليمية','University or educational institution')}">
          <label style="margin-top:8px">${hr256L('تفاصيل الدراسة','Study details')}</label>
          <textarea id="hrLeaveStudyDetails" placeholder="${hr256L('مثال: اختبار، حضور برنامج، متطلبات دراسية...','Example: exam, program attendance, study requirement...')}"></textarea>
        </div>

        <div class="field full hr256-hidden" id="hr256OtherWrap">
          <label>${hr256L('نوع الإجازة الأخرى','Other leave description')}</label>
          <input id="hrLeaveOtherLabel" type="text" placeholder="${hr256L('اكتب نوع الإجازة','Describe the leave type')}">
          <div class="hr256-required-note">${hr256L('هذا الحقل إلزامي عند اختيار «أخرى».','Required when “Other” is selected.')}</div>
        </div>

        <div class="field full">
          <label>${hr256L('السبب','Reason')}</label>
          <textarea id="hrLeaveReason"></textarea>
        </div>

        <div class="hr256-summary">
          <div>
            <span id="hr256PeriodSummary">${hr256L('إجازة يوم كامل','Full-day leave')}</span>
          </div>
          <div>
            <span>${hr256L('المدة المحتسبة','Calculated duration')}</span>
            <b><span id="hr256DaysValue">—</span> ${hr256L('يوم','day')}</b>
          </div>
        </div>
      </div>

      <button class="submit-btn" type="submit">${hr256L('إرسال طلب الإجازة','Submit leave request')}</button>
    </form>`;

    const modal=document.getElementById('addModalBody');
    modal.innerHTML=`<div class="modal-head">
      <div>
        <h3>${hr256L('طلب إجازة','Leave request')}</h3>
        <div style="font-size:9px;color:var(--muted);margin-top:4px">${hr256L('يدعم اليوم الكامل ونصف اليوم وإجازة الدراسة وأخرى.','Supports full day, half day, Study Leave, and Other.')}</div>
      </div>
      <button class="modal-close" onclick="closeAddModal()"><svg style="width:18px;height:18px"><use href="#i-x"/></svg></button>
    </div>${body}`;

    modal.classList.add('hr72-modal');
    document.getElementById('addModalOverlay')?.classList.remove('hidden');
    requestAnimationFrame(()=>window.hr256UpdateLeaveForm());
  }

  const hrOpenFormV72BaseV256=window.hrOpenFormV72;

  window.taskyHrOpenLeaveV257=function(event){
    event?.preventDefault?.();
    event?.stopPropagation?.();
    hr256OpenLeaveForm().catch(err=>{
      showTaskyDialog({
        title:hr256L('تعذّر فتح طلب الإجازة','Could not open leave request'),
        message:err?.message||String(err),
        tone:'error'
      });
    });
    return false;
  };

  /* Keep compatibility with every old HR button that calls
     hrOpenFormV72('leave'). Assign both the global property and the
     legacy global binding where the browser exposes it. */
  const hrOpenFormV257=function(type,id=null,parent=null){
    if(type==='leave'){
      window.taskyHrOpenLeaveV257();
      return;
    }
    return hrOpenFormV72BaseV256(type,id,parent);
  };
  window.hrOpenFormV72=hrOpenFormV257;
  try{hrOpenFormV72=hrOpenFormV257}catch(_){}

  /* Capture-phase fallback:
     Some historical HR builds render an inline onclick that can keep a
     reference to the original function. Intercept the actual Leave Request
     button before that old handler executes. */
  document.addEventListener('click',event=>{
    const btn=event.target?.closest?.('button');
    if(!btn)return;

    const inline=btn.getAttribute('onclick')||'';
    const text=String(btn.textContent||'').replace(/\s+/g,' ').trim();

    const isLeaveButton=
      /hrOpenFormV72\(['"]leave['"]\)/.test(inline) ||
      /طلب إجازة|Leave request/i.test(text);

    if(!isLeaveButton)return;

    const leavesPanel=btn.closest('.hr72-panel');
    if(!leavesPanel)return;

    event.preventDefault();
    event.stopImmediatePropagation();
    window.taskyHrOpenLeaveV257(event);
  },true);

  const hrSubmitFormV72BaseV256=window.hrSubmitFormV72;
  window.hrSubmitFormV72=async function(e,type,id=null,parent=null){
    if(type!=='leave')return hrSubmitFormV72BaseV256(e,type,id,parent);

    e.preventDefault();

    const v=x=>document.getElementById(x)?.value||null;
    const btn=e.submitter||e.currentTarget?.querySelector?.('[type="submit"]');
    if(btn)btn.disabled=true;

    try{
      const employeeId=v('hrLeaveEmp');
      const leaveTypeId=v('hrLeaveType');
      const leaveType=hr256TypeById(leaveTypeId);
      const systemKey=hr256SystemKey(leaveType);
      const duration=v('hrLeaveDuration')||'full_day';
      const start=v('hrLeaveStart');
      let end=v('hrLeaveEnd')||start;
      const halfPeriod=duration==='half_day'?(v('hrLeaveHalfPeriod')||'first_half'):null;
      const otherLabel=systemKey==='other'?(v('hrLeaveOtherLabel')||'').trim():null;
      const studyInstitution=systemKey==='study'?(v('hrLeaveStudyInstitution')||'').trim():null;
      const studyDetails=systemKey==='study'?(v('hrLeaveStudyDetails')||'').trim():null;
      const reason=(v('hrLeaveReason')||'').trim();

      if(!employeeId)throw new Error(hr256L('حدد الموظف.','Select an employee.'));
      if(!leaveTypeId)throw new Error(hr256L('حدد نوع الإجازة.','Select a leave type.'));
      if(!start)throw new Error(hr256L('حدد تاريخ الإجازة.','Select the leave date.'));

      if(duration==='half_day')end=start;
      if(duration==='full_day'&&!end)throw new Error(hr256L('حدد تاريخ نهاية الإجازة.','Select the leave end date.'));
      if(new Date(`${end}T12:00:00`)<new Date(`${start}T12:00:00`))throw new Error(hr256L('تاريخ النهاية يجب أن يكون بعد البداية.','End date must be on or after start date.'));
      if(systemKey==='other'&&!otherLabel)throw new Error(hr256L('اكتب نوع الإجازة عند اختيار «أخرى».','Describe the leave type when “Other” is selected.'));

      const {data,error}=await sb.rpc('tasky_hr_submit_leave_v256',{
        p_workspace_id:currentWorkspaceId,
        p_employee_id:employeeId,
        p_leave_type_id:leaveTypeId,
        p_start_date:start,
        p_end_date:end,
        p_reason:reason||null,
        p_duration_type:duration,
        p_half_day_period:halfPeriod,
        p_other_type_label:otherLabel,
        p_study_institution:studyInstitution,
        p_study_details:studyDetails
      });

      if(error)throw error;

      closeAddModal();
      await fetchHrDataV72(true);

      const days=Number(data?.days ?? (duration==='half_day'?0.5:hr256DateDays(start,end)));
      taskyToast(
        hr256L(`تم إرسال طلب الإجازة (${days} يوم)`,`Leave request submitted (${days} day${days===1?'':'s'})`),
        {tone:'success'}
      );
    }catch(err){
      const msg=String(err?.message||err);
      const migrationMissing=/tasky_hr_submit_leave_v256|does not exist|schema cache/i.test(msg);
      showTaskyDialog({
        title:hr256L('تعذّر إرسال طلب الإجازة','Could not submit leave request'),
        message:migrationMissing
          ?hr256L('شغّل ملف SQL الخاص بـ V256 في Supabase مرة واحدة ثم أعد المحاولة.','Run the V256 SQL once in Supabase, then try again.')
          :msg,
        tone:'error'
      });
    }finally{
      if(btn)btn.disabled=false;
    }
  };

  /* Keep built-in special types available if HR data is refreshed later. */
  const fetchHrDataV72BaseV256=window.fetchHrDataV72;
  if(typeof fetchHrDataV72BaseV256==='function'){
    window.fetchHrDataV72=async function(force=false){
      const r=await fetchHrDataV72BaseV256(force);
      if(currentWorkspaceId&&hr256TypesEnsuredWorkspace===String(currentWorkspaceId)){
        try{await hr256EnsureTypes(force)}catch(_){}
      }
      return r;
    };
  }

  window.taskyHrLeaveAuditV256=function(){
    return {
      build:'V256',
      workspace:window.currentWorkspaceId||null,
      leave_types:(window.hrV72?.leaveTypes||[]).map(x=>({id:x.id,system_key:hr256SystemKey(x),name_ar:x.name_ar,name_en:x.name_en})),
      half_day_supported:true,
      study_supported:true,
      other_supported:true
    };
  };

  window.TASKY_HR_LEAVE_V256=true;
  window.TASKY_HR_LEAVE_V257=true;
  console.info('Tasky HR Leave V257 — leave button routing + half-day/study/other ready');
})();
