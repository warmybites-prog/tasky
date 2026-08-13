/* Tasky V168.1 lazy chunk: brainstorm */

/* --- source script: tasky-v107-brainstorm-canvas-js --- */

window.TASKY_BUILD='V107';console.info('Tasky build',window.TASKY_BUILD);

let brain107MeetingId=null;
let brain107Objects=[];
let brain107Strokes=[];
let brain107Presence=[];
let brain107Timer=null;
let brain107PresenceTimer=null;
let brain107Tool='select';
let brain107Scale=1;
let brain107Tx=0,brain107Ty=0;
let brain107Pan=null;
let brain107Draw=null;
let brain107Drag=null;
let brain107LastPresence=0;

function brain107L(ar,en){return lang==='ar'?ar:en}
function brain107Shell(){
  let el=document.getElementById('brain107CanvasShell');
  if(!el){el=document.createElement('div');el.id='brain107CanvasShell';document.body.appendChild(el)}
  return el;
}
function brain107SessionArgs(){
  return {
    p_meeting_id:brain107MeetingId,
    p_guest_session_id:meetingGuestSessionV102?.id||null,
    p_guest_session_token:meetingGuestSessionV102?.token||null
  };
}
function brain107KindLabel(kind){
  return ({idea:brain107L('فكرة','Idea'),update:brain107L('تحديث','Update'),question:brain107L('سؤال','Question'),decision:brain107L('قرار','Decision')})[kind]||kind;
}
function brain107CanEdit(){
  const m=meetingsV101.find(x=>x.id===brain107MeetingId)||meetingRoomV101;
  return !!m&&['scheduled','live'].includes(m.status);
}
function brain107SvgIcon(name){
  const icons={
    select:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 3l13 8-6 2 3 6-2 1-3-6-5 4z"/></svg>',
    pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20l4-1 10-10-3-3L5 16zM13 8l3 3"/></svg>',
    note:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h6"/></svg>',
    hand:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 11V6a2 2 0 014 0v4-6a2 2 0 014 0v7-4a2 2 0 014 0v5-2a2 2 0 014 0v5c0 4-3 6-7 6h-1c-3 0-5-1-7-4l-2-3a2 2 0 013-2l2 2"/></svg>',
    erase:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 15l8-10 8 7-7 8H8z"/><path d="M11 20h9"/></svg>'
  };
  return icons[name]||'';
}
function brain107RenderShell(){
  const el=brain107Shell();
  const m=meetingsV101.find(x=>x.id===brain107MeetingId)||meetingRoomV101||{};
  const editable=brain107CanEdit();
  el.innerHTML=`<div class="brain107-top">
    <div class="brain107-title"><h2>${brain107L('غرفة العصف الذهني','Brainstorm Room')} — ${escapeHtml(m.title||'')}</h2><p>${brain107L('مساحة حرة مشتركة للكتابة والرسم والتصويت والتحديثات المباشرة','Shared free canvas for writing, drawing, voting and live updates')}</p></div>
    <div class="brain107-top-actions"><span class="brain107-status"><i></i><span id="brain107PresenceCount">${brain107L('متصل','Connected')}</span></span><button type="button" onclick="brain107Fit()">${brain107L('ملاءمة','Fit')}</button><button type="button" onclick="brain107Close()">×</button></div>
  </div>
  <div class="brain107-main">
    <aside class="brain107-tools">
      <button type="button" class="brain107-tool ${brain107Tool==='select'?'active':''}" title="${brain107L('تحديد وتحريك','Select & move')}" onclick="brain107SetTool('select')">${brain107SvgIcon('select')}</button>
      <button type="button" class="brain107-tool ${brain107Tool==='hand'?'active':''}" title="${brain107L('تحريك اللوحة','Pan canvas')}" onclick="brain107SetTool('hand')">${brain107SvgIcon('hand')}</button>
      ${editable?`<button type="button" class="brain107-tool ${brain107Tool==='pen'?'active':''}" title="${brain107L('قلم','Pen')}" onclick="brain107SetTool('pen')">${brain107SvgIcon('pen')}</button><button type="button" class="brain107-tool" title="${brain107L('بطاقة جديدة','New card')}" onclick="brain107ToggleCompose(true)">${brain107SvgIcon('note')}</button>`:''}
    </aside>
    <div class="brain107-stage-wrap" id="brain107StageWrap">
      <div class="brain107-stage ${brain107Tool==='pen'?'pen-mode':brain107Tool==='select'?'select-mode':''}" id="brain107Stage">
        <svg class="brain107-svg" id="brain107Svg" viewBox="0 0 4000 3000"></svg>
        <div id="brain107Cards"></div><div id="brain107Cursors"></div>
      </div>
      ${!editable?`<div class="brain107-readonly">${brain107L('هذه الغرفة للعرض فقط بعد انتهاء الاجتماع','This room is read-only after the meeting ends')}</div>`:''}
      <div class="brain107-legend"><span class="brain107-chip">${brain107L('فكرة','Idea')}</span><span class="brain107-chip">${brain107L('تحديث','Update')}</span><span class="brain107-chip">${brain107L('سؤال','Question')}</span><span class="brain107-chip">${brain107L('قرار','Decision')}</span></div>
      <div class="brain107-bottom"><button type="button" onclick="brain107Zoom(-.15)">−</button><span class="brain107-zoom" id="brain107Zoom">${Math.round(brain107Scale*100)}%</span><button type="button" onclick="brain107Zoom(.15)">+</button><button type="button" onclick="brain107Fit()">${brain107L('ملاءمة','Fit')}</button></div>
    </div>
  </div>
  <div class="brain107-compose-panel" id="brain107Compose">
    <label>${brain107L('نوع البطاقة','Card type')}</label><select id="brain107Kind"><option value="idea">${brain107L('فكرة','Idea')}</option><option value="update">${brain107L('تحديث / خبر','Update / news')}</option><option value="question">${brain107L('سؤال','Question')}</option><option value="decision">${brain107L('قرار','Decision')}</option></select>
    <label style="margin-top:8px">${brain107L('المحتوى','Content')}</label><textarea id="brain107Body" maxlength="1500" placeholder="${brain107L('اكتب هنا…','Write here…')}"></textarea>
    <div class="brain107-compose-actions"><button type="button" onclick="brain107ToggleCompose(false)">${brain107L('إلغاء','Cancel')}</button><button type="button" class="primary" onclick="brain107CreateCard()">${brain107L('إضافة للوحة','Add to canvas')}</button></div>
  </div>`;
  el.classList.add('show');
  brain107ApplyTransform();brain107BindStage();brain107RenderData();
}
function brain107SetTool(t){brain107Tool=t;brain107RenderShell()}
function brain107ToggleCompose(show){
  const p=document.getElementById('brain107Compose');if(!p)return;
  p.classList.toggle('show',!!show);
  if(show)setTimeout(()=>document.getElementById('brain107Body')?.focus(),30);
}
function brain107ScreenToCanvas(clientX,clientY){
  const wrap=document.getElementById('brain107StageWrap'),r=wrap.getBoundingClientRect();
  return {x:(clientX-r.left-brain107Tx)/brain107Scale,y:(clientY-r.top-brain107Ty)/brain107Scale};
}
function brain107ApplyTransform(){
  const s=document.getElementById('brain107Stage');if(!s)return;
  s.style.transform=`translate(${brain107Tx}px,${brain107Ty}px) scale(${brain107Scale})`;
  const z=document.getElementById('brain107Zoom');if(z)z.textContent=Math.round(brain107Scale*100)+'%';
}
function brain107Zoom(delta,clientX=null,clientY=null){
  const wrap=document.getElementById('brain107StageWrap');if(!wrap)return;
  const r=wrap.getBoundingClientRect(),cx=clientX??(r.left+r.width/2),cy=clientY??(r.top+r.height/2);
  const before=brain107ScreenToCanvas(cx,cy),next=Math.max(.35,Math.min(2.2,brain107Scale+delta));
  brain107Scale=next;
  brain107Tx=(cx-r.left)-before.x*next;brain107Ty=(cy-r.top)-before.y*next;brain107ApplyTransform();
}
function brain107Fit(){
  const wrap=document.getElementById('brain107StageWrap');if(!wrap)return;
  if(!brain107Objects.length&&!brain107Strokes.length){brain107Scale=.85;brain107Tx=30;brain107Ty=30;brain107ApplyTransform();return}
  let minX=99999,minY=99999,maxX=0,maxY=0;
  for(const o of brain107Objects){minX=Math.min(minX,o.x);minY=Math.min(minY,o.y);maxX=Math.max(maxX,o.x+240);maxY=Math.max(maxY,o.y+150)}
  for(const st of brain107Strokes){for(const p of st.points||[]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}}
  if(minX===99999){minX=0;minY=0;maxX=800;maxY=600}
  const r=wrap.getBoundingClientRect(),w=Math.max(300,maxX-minX+100),h=Math.max(250,maxY-minY+100);
  brain107Scale=Math.max(.35,Math.min(1.35,Math.min(r.width/w,r.height/h)));
  brain107Tx=(r.width-w*brain107Scale)/2-minX*brain107Scale+50*brain107Scale;
  brain107Ty=(r.height-h*brain107Scale)/2-minY*brain107Scale+50*brain107Scale;
  brain107ApplyTransform();
}
function brain107BindStage(){
  const wrap=document.getElementById('brain107StageWrap'),stage=document.getElementById('brain107Stage');
  if(!wrap||!stage||wrap.__brain107)return;wrap.__brain107=true;
  wrap.addEventListener('wheel',e=>{e.preventDefault();brain107Zoom(e.deltaY>0?-.1:.1,e.clientX,e.clientY)},{passive:false});
  stage.addEventListener('pointerdown',brain107PointerDown);
  window.addEventListener('pointermove',brain107PointerMove);
  window.addEventListener('pointerup',brain107PointerUp);
}
function brain107PointerDown(e){
  if(e.button!=null&&e.button!==0)return;
  const card=e.target.closest?.('.brain107-card');
  if(card&&brain107Tool==='select'&&brain107CanEdit()){
    const o=brain107Objects.find(x=>x.id===card.dataset.id);if(!o||!o.can_move)return;
    const p=brain107ScreenToCanvas(e.clientX,e.clientY);
    brain107Drag={id:o.id,dx:p.x-o.x,dy:p.y-o.y,lastX:o.x,lastY:o.y};
    card.classList.add('dragging');card.setPointerCapture?.(e.pointerId);return;
  }
  if(brain107Tool==='pen'&&brain107CanEdit()){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY);
    brain107Draw={points:[{x:p.x,y:p.y,p:e.pressure||.5}],pointerId:e.pointerId};
    e.target.setPointerCapture?.(e.pointerId);return;
  }
  if(brain107Tool==='hand'||(!card&&brain107Tool==='select')){
    brain107Pan={x:e.clientX,y:e.clientY,tx:brain107Tx,ty:brain107Ty};return;
  }
}
function brain107PointerMove(e){
  if(brain107Drag){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY),o=brain107Objects.find(x=>x.id===brain107Drag.id);
    if(o){o.x=Math.max(0,Math.min(3760,p.x-brain107Drag.dx));o.y=Math.max(0,Math.min(2820,p.y-brain107Drag.dy));brain107Drag.lastX=o.x;brain107Drag.lastY=o.y;brain107RenderCards()}
  }else if(brain107Draw&&e.pointerId===brain107Draw.pointerId){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY);
    const last=brain107Draw.points[brain107Draw.points.length-1];
    if(!last||Math.hypot(p.x-last.x,p.y-last.y)>2){brain107Draw.points.push({x:p.x,y:p.y,p:e.pressure||.5});brain107RenderStrokes(true)}
  }else if(brain107Pan){
    brain107Tx=brain107Pan.tx+(e.clientX-brain107Pan.x);brain107Ty=brain107Pan.ty+(e.clientY-brain107Pan.y);brain107ApplyTransform();
  }
  if(Date.now()-brain107LastPresence>100){
    brain107LastPresence=Date.now();
    const p=brain107ScreenToCanvas(e.clientX,e.clientY);brain107PresencePing(p.x,p.y);
  }
}
async function brain107PointerUp(e){
  if(brain107Drag){
    const d=brain107Drag;brain107Drag=null;
    document.querySelector(`.brain107-card[data-id="${CSS.escape(d.id)}"]`)?.classList.remove('dragging');
    const {error}=await sb.rpc('tasky_meeting_canvas_move_v107',{...brain107SessionArgs(),p_object_id:d.id,p_x:Math.round(d.lastX),p_y:Math.round(d.lastY)});
    if(error)console.warn('V107 move',error);
  }
  if(brain107Draw&&e.pointerId===brain107Draw.pointerId){
    const pts=brain107Draw.points;brain107Draw=null;
    if(pts.length>1){
      const {error}=await sb.rpc('tasky_meeting_canvas_stroke_add_v107',{...brain107SessionArgs(),p_points:pts,p_width:3.2,p_color:'#214f40'});
      if(error)showTaskyDialog({title:brain107L('تعذّر حفظ الرسم','Could not save drawing'),message:error.message,tone:'error'});
      else await brain107Fetch();
    }
  }
  brain107Pan=null;
}
function brain107RenderData(){brain107RenderStrokes();brain107RenderCards();brain107RenderPresence()}
function brain107RenderStrokes(includeDraft=false){
  const svg=document.getElementById('brain107Svg');if(!svg)return;
  const all=[...brain107Strokes];
  if(includeDraft&&brain107Draw?.points?.length)all.push({id:'draft',points:brain107Draw.points,width:3.2,color:'#214f40'});
  svg.innerHTML=all.map(st=>{
    const pts=st.points||[];if(pts.length<2)return'';
    const d=pts.map((p,i)=>`${i?'L':'M'} ${Number(p.x).toFixed(1)} ${Number(p.y).toFixed(1)}`).join(' ');
    return `<path class="brain107-stroke" d="${d}" stroke="${escapeHtml(st.color||'#214f40')}" stroke-width="${Number(st.width||3)}"/>`;
  }).join('');
}
function brain107RenderCards(){
  const host=document.getElementById('brain107Cards');if(!host)return;
  host.innerHTML=brain107Objects.map(o=>`<article class="brain107-card" data-id="${o.id}" data-kind="${escapeHtml(o.kind)}" style="left:${Number(o.x)}px;top:${Number(o.y)}px">
    <div class="brain107-card-head"><span class="brain107-card-kind">${escapeHtml(brain107KindLabel(o.kind))}</span><span class="brain107-card-author">${escapeHtml(o.author_name||'')}</span></div>
    <div class="brain107-card-body">${escapeHtml(o.body)}</div>
    <div class="brain107-card-foot"><button type="button" class="${o.my_vote?'voted':''}" onclick="event.stopPropagation();brain107Vote('${o.id}')">${brain107L('تصويت','Vote')} · ${Number(o.vote_count||0)}</button><div class="actions">${o.can_delete?`<button type="button" onclick="event.stopPropagation();brain107DeleteObject('${o.id}')">${brain107L('حذف','Delete')}</button>`:''}</div></div>
  </article>`).join('');
}
function brain107RenderPresence(){
  const host=document.getElementById('brain107Cursors');if(!host)return;
  host.innerHTML=(brain107Presence||[]).filter(p=>!p.is_me).map(p=>`<div class="brain107-cursor" style="left:${Number(p.cursor_x||0)}px;top:${Number(p.cursor_y||0)}px"><div class="brain107-cursor-dot"></div><div class="brain107-cursor-label">${escapeHtml(p.display_name||brain107L('مشارك','Participant'))}</div></div>`).join('');
  const c=document.getElementById('brain107PresenceCount');if(c)c.textContent=`${Number(brain107Presence?.length||1)} ${brain107L('متصل','online')}`;
}
async function brain107Fetch(){
  if(!brain107MeetingId)return;
  const {data,error}=await sb.rpc('tasky_meeting_canvas_state_v107',brain107SessionArgs());
  if(error){console.warn('V107 canvas state',error);return}
  brain107Objects=Array.isArray(data?.objects)?data.objects:[];
  brain107Strokes=Array.isArray(data?.strokes)?data.strokes:[];
  brain107Presence=Array.isArray(data?.presence)?data.presence:[];
  brain107RenderData();
}
async function brain107PresencePing(x=null,y=null){
  if(!brain107MeetingId)return;
  const args={...brain107SessionArgs(),p_cursor_x:x==null?null:Math.round(x),p_cursor_y:y==null?null:Math.round(y)};
  sb.rpc('tasky_meeting_canvas_presence_v107',args).catch?.(()=>{});
}
async function brain107CreateCard(){
  const body=document.getElementById('brain107Body')?.value.trim()||'',kind=document.getElementById('brain107Kind')?.value||'idea';
  if(!body)return;
  const wrap=document.getElementById('brain107StageWrap'),r=wrap.getBoundingClientRect();
  const center=brain107ScreenToCanvas(r.left+r.width/2,r.top+r.height/2);
  const {error}=await sb.rpc('tasky_meeting_canvas_object_add_v107',{...brain107SessionArgs(),p_kind:kind,p_body:body,p_x:Math.round(center.x-115),p_y:Math.round(center.y-60)});
  if(error)return showTaskyDialog({title:brain107L('تعذّرت إضافة البطاقة','Could not add card'),message:error.message,tone:'error'});
  brain107ToggleCompose(false);await brain107Fetch();
}
async function brain107Vote(id){
  const {error}=await sb.rpc('tasky_meeting_canvas_vote_v107',{...brain107SessionArgs(),p_object_id:id});
  if(error)return taskyToast(error.message,{tone:'warning'});await brain107Fetch();
}
async function brain107DeleteObject(id){
  const ok=await taskyConfirm(brain107L('حذف هذه البطاقة؟','Delete this card?'),{title:brain107L('حذف البطاقة','Delete card'),tone:'danger',confirmText:brain107L('حذف','Delete')});if(!ok)return;
  const {error}=await sb.rpc('tasky_meeting_canvas_object_delete_v107',{...brain107SessionArgs(),p_object_id:id});
  if(error)return showTaskyDialog({title:brain107L('تعذّر الحذف','Could not delete'),message:error.message,tone:'error'});await brain107Fetch();
}
async function brain107Open(meetingId){
  brain107MeetingId=meetingId||meetingRoomV101?.id;if(!brain107MeetingId)return;
  const probe=await sb.rpc('tasky_meeting_canvas_state_v107',brain107SessionArgs());
  if(probe.error){brain107MeetingId=null;return showTaskyDialog({title:brain107L('تعذّر فتح مساحة العصف الذهني','Could not open brainstorm canvas'),message:probe.error.message,tone:'error'})}
  brain107Objects=Array.isArray(probe.data?.objects)?probe.data.objects:[];
  brain107Strokes=Array.isArray(probe.data?.strokes)?probe.data.strokes:[];
  brain107Presence=Array.isArray(probe.data?.presence)?probe.data.presence:[];
  brain107RenderShell();setTimeout(brain107Fit,50);
  clearInterval(brain107Timer);brain107Timer=setInterval(brain107Fetch,1000);
  clearInterval(brain107PresenceTimer);brain107PresencePing();brain107PresenceTimer=setInterval(()=>brain107PresencePing(),4000);
}
function brain107Close(){
  clearInterval(brain107Timer);clearInterval(brain107PresenceTimer);brain107Timer=null;brain107PresenceTimer=null;
  brain107MeetingId=null;brain107Objects=[];brain107Strokes=[];brain107Presence=[];
  brain107Shell().classList.remove('show');
}

/* Make the first-class Brainstorm section open the live canvas rather than the older lane board. */
const brain106OpenLegacyV107=brain106Open;
brain106Open=async function(meetingId){return brain107Open(meetingId)};

/* Section copy now describes the free canvas accurately. */
const meetingsBrainstormTemplateBaseV107=meetingsBrainstormTemplateV10622;
meetingsBrainstormTemplateV10622=function(){
  let h=meetingsBrainstormTemplateBaseV107();
  h=h.replace(
    brain107L('مساحة مرتبطة باجتماعات تاسكي لتجميع الأفكار والفرص والتحديات والقرارات. اختر اجتماعًا لفتح لوحته، وتبقى لوحات الاجتماعات السابقة متاحة كمرجع بعد انتهائها.','A workspace linked to Tasky meetings for capturing ideas, opportunities, challenges and decisions. Choose a meeting to open its board; completed meeting boards remain available as reference.'),
    brain107L('مساحة حرة مشتركة لكل اجتماع للكتابة والرسم بالقلم وإضافة التحديثات والتصويت مباشرة. تبقى اللوحة محفوظة كمرجع بعد انتهاء الاجتماع.','A free shared canvas for every meeting with live writing, stylus drawing, updates and voting. The canvas stays preserved as reference after the meeting ends.')
  );
  return h;
};

/* Cleanup if participant leaves the meeting while canvas is open. */
const leaveMeetingRoomBaseV107=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){if(brain107MeetingId)brain107Close();return leaveMeetingRoomBaseV107(opts)};


/* --- source script: tasky-v108-brainstorm-rooms-js --- */

window.TASKY_BUILD='V108';console.info('Tasky build',window.TASKY_BUILD);

let brain108Rooms=[];
let brain108Loading=false;
let brain108Error='';

function brain108L(ar,en){return lang==='ar'?ar:en}

async function brain108FetchRooms(){
  if(!currentWorkspaceId)return[];
  brain108Loading=true;brain108Error='';
  try{
    const {data,error}=await sb.rpc('tasky_brainstorm_room_list_v108',{p_workspace_id:currentWorkspaceId});
    if(error)throw error;
    brain108Rooms=Array.isArray(data)?data:[];
    return brain108Rooms;
  }catch(e){
    brain108Error=e?.message||String(e);brain108Rooms=[];return[];
  }finally{brain108Loading=false}
}

function brain108OpenCreate(){
  const meetings=meetingsV101.filter(m=>['scheduled','live'].includes(m.status));
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${brain108L('غرفة عصف ذهني جديدة','New brainstorm room')}</h3><div class="subtle">${brain108L('أنشئ مساحة مستقلة، أو اربطها باجتماع إذا احتجت. الربط اختياري.','Create an independent space, or optionally link it to a meeting.')}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
  <form class="brain108-form" onsubmit="brain108Create(event)">
    <div class="field"><label>${brain108L('اسم الغرفة','Room name')}</label><input id="brain108Title" required maxlength="140" placeholder="${brain108L('مثال: أفكار المنتج الجديد','Example: New product ideas')}"></div>
    <div class="field"><label>${brain108L('الوصف — اختياري','Description — optional')}</label><textarea id="brain108Desc" maxlength="1200" placeholder="${brain108L('الهدف أو موضوع العصف الذهني','Purpose or brainstorm topic')}"></textarea></div>
    <div class="field"><label>${brain108L('ربط باجتماع — اختياري','Link to meeting — optional')}</label><select id="brain108Meeting"><option value="">${brain108L('بدون اجتماع — غرفة مستقلة','No meeting — independent room')}</option>${meetings.map(m=>`<option value="${m.id}">${escapeHtml(m.title)}</option>`).join('')}</select></div>
    <div style="display:flex;gap:7px;justify-content:flex-end"><button type="button" class="chip-btn" onclick="closeAddModal()">${brain108L('إلغاء','Cancel')}</button><button type="submit" class="primary-btn">${brain108L('إنشاء الغرفة','Create room')}</button></div>
  </form>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
  setTimeout(()=>{if(typeof taskyEnhanceSelects==='function')taskyEnhanceSelects()},0);
}

async function brain108Create(e){
  e.preventDefault();
  const title=document.getElementById('brain108Title')?.value.trim()||'';
  const description=document.getElementById('brain108Desc')?.value.trim()||'';
  const meetingId=document.getElementById('brain108Meeting')?.value||null;
  const {data,error}=await sb.rpc('tasky_brainstorm_room_create_v108',{
    p_workspace_id:currentWorkspaceId,p_title:title,p_description:description||null,p_meeting_id:meetingId||null
  });
  if(error)return showTaskyDialog({title:brain108L('تعذّر إنشاء الغرفة','Could not create room'),message:error.message,tone:'error'});
  closeAddModal();await brain108FetchRooms();renderModule();
  taskyToast(brain108L('تم إنشاء غرفة العصف الذهني','Brainstorm room created'),{tone:'success'});
  if(data?.id)setTimeout(()=>brain108OpenRoom(data.id),40);
}

async function brain108Archive(id){
  const r=brain108Rooms.find(x=>x.id===id);if(!r)return;
  const ok=await taskyConfirm(brain108L(`إغلاق غرفة "${r.title}"؟ ستبقى محفوظة للرجوع إليها.`,`Close "${r.title}"? It will remain saved for reference.`),{title:brain108L('إغلاق الغرفة','Close room'),confirmText:brain108L('إغلاق','Close')});
  if(!ok)return;
  const {error}=await sb.rpc('tasky_brainstorm_room_archive_v108',{p_room_id:id});
  if(error)return showTaskyDialog({title:brain108L('تعذّر إغلاق الغرفة','Could not close room'),message:error.message,tone:'error'});
  await brain108FetchRooms();renderModule();
}

function brain108Card(r){
  const linked=!!r.meeting_id;
  return `<article class="brain108-card">
    <div class="brain108-card-head"><div><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.description||brain108L('بدون وصف','No description'))}</p></div><span class="brain108-type">${linked?brain108L('مرتبطة باجتماع','Meeting-linked'):brain108L('مستقلة','Independent')}</span></div>
    <div class="brain108-meta">
      <div><span>${brain108L('المالك','Owner')}</span><b>${escapeHtml(r.owner_name||'')}</b></div>
      <div><span>${brain108L('الحالة','Status')}</span><b>${r.status==='active'?brain108L('نشطة','Active'):brain108L('مغلقة','Closed')}</b></div>
      ${linked?`<div style="grid-column:1/-1"><span>${brain108L('الاجتماع','Meeting')}</span><b>${escapeHtml(r.meeting_title||'')}</b></div>`:''}
    </div>
    <div class="brain108-actions"><button class="primary-btn" onclick="brain108OpenRoom('${r.id}')">${r.status==='active'?brain108L('فتح الغرفة','Open room'):brain108L('عرض الغرفة','View room')}</button>${r.can_manage&&r.status==='active'?`<button class="chip-btn" onclick="brain108Archive('${r.id}')">${brain108L('إغلاق','Close')}</button>`:''}</div>
  </article>`;
}

function meetingsBrainstormTemplateV108(){
  if(brain108Loading&&!brain108Rooms.length)return `<div class="brain108-empty">${brain108L('جارٍ تحميل غرف العصف الذهني…','Loading brainstorm rooms…')}</div>`;
  if(brain108Error)return `<div class="brain108-empty">${escapeHtml(brain108Error)}</div>`;
  const active=brain108Rooms.filter(r=>r.status==='active');
  const archived=brain108Rooms.filter(r=>r.status==='archived');
  return `<div class="brain108-groups">
    <div class="brain108-head"><div><h2>${brain108L('غرفة العصف الذهني','Brainstorm Room')}</h2><p>${brain108L('أنشئ مساحة حرة مستقلة للفريق في أي وقت، أو اربطها باجتماع عند الحاجة. كل غرفة تدعم الكتابة والرسم بالقلم والتصويت والعمل المشترك.','Create a free standalone team space at any time, or link it to a meeting when useful. Every room supports writing, stylus drawing, voting and collaboration.')}</p></div><button class="primary-btn" onclick="brain108OpenCreate()">${brain108L('غرفة جديدة','New room')}</button></div>
    <section><div class="brain108-section-title"><h3>${brain108L('الغرف النشطة','Active rooms')}</h3><span>${active.length}</span></div>${active.length?`<div class="brain108-grid">${active.map(brain108Card).join('')}</div>`:`<div class="brain108-empty">${brain108L('لا توجد غرف عصف ذهني نشطة. أنشئ غرفة مستقلة وابدأ مباشرة.','No active brainstorm rooms. Create an independent room and start immediately.')}</div>`}</section>
    ${archived.length?`<section><div class="brain108-section-title"><h3>${brain108L('الغرف المغلقة','Closed rooms')}</h3><span>${archived.length}</span></div><div class="brain108-grid">${archived.slice(0,24).map(brain108Card).join('')}</div></section>`:''}
  </div>`;
}

/* Replace the old meeting-derived Brainstorm section with independent rooms. */
meetingsBrainstormTemplateV10622=meetingsBrainstormTemplateV108;

const setMeetingsSectionBaseV108=setMeetingsSectionV10622;
setMeetingsSectionV10622=function(section){
  meetingsSectionV10622=section==='brainstorm'?'brainstorm':'meetings';
  if(meetingsSectionV10622==='brainstorm'){
    brain108FetchRooms().finally(()=>{if(activeNav==='meetings'&&meetingsSectionV10622==='brainstorm')renderModule()});
  }
  if(activeNav==='meetings')renderModule();
};

/* Open a standalone/linked room using V108 canvas state. */
async function brain108OpenRoom(roomId){
  window.brain108RoomId=roomId;
  const probe=await sb.rpc('tasky_brainstorm_canvas_state_v108',{p_room_id:roomId});
  if(probe.error)return showTaskyDialog({title:brain108L('تعذّر فتح الغرفة','Could not open room'),message:probe.error.message,tone:'error'});
  brain107MeetingId=null;
  brain107Objects=Array.isArray(probe.data?.objects)?probe.data.objects:[];
  brain107Strokes=Array.isArray(probe.data?.strokes)?probe.data.strokes:[];
  brain107Presence=Array.isArray(probe.data?.presence)?probe.data.presence:[];
  brain108RenderCanvasShell(probe.data?.room||{});
  setTimeout(brain107Fit,50);
  clearInterval(brain107Timer);brain107Timer=setInterval(brain108FetchCanvas,1000);
  clearInterval(brain107PresenceTimer);brain108PresencePing();brain107PresenceTimer=setInterval(()=>brain108PresencePing(),4000);
}

function brain108RoomArgs(){return {p_room_id:window.brain108RoomId}}

async function brain108FetchCanvas(){
  if(!window.brain108RoomId)return;
  const {data,error}=await sb.rpc('tasky_brainstorm_canvas_state_v108',brain108RoomArgs());
  if(error){console.warn('V108 canvas state',error);return}
  brain107Objects=Array.isArray(data?.objects)?data.objects:[];
  brain107Strokes=Array.isArray(data?.strokes)?data.strokes:[];
  brain107Presence=Array.isArray(data?.presence)?data.presence:[];
  window.brain108RoomMeta=data?.room||window.brain108RoomMeta||{};
  brain107RenderData();
}

function brain108Editable(){return window.brain108RoomMeta?.status==='active'&&!!window.brain108RoomMeta?.can_edit}

function brain108RenderCanvasShell(room){
  window.brain108RoomMeta=room;
  const el=brain107Shell(),editable=brain108Editable();
  el.innerHTML=`<div class="brain107-top">
    <div class="brain107-title"><h2>${brain108L('غرفة العصف الذهني','Brainstorm Room')} — ${escapeHtml(room.title||'')}</h2><p>${room.meeting_title?escapeHtml(room.meeting_title):brain108L('مساحة مستقلة للفريق','Independent team space')}</p></div>
    <div class="brain107-top-actions"><span class="brain107-status"><i></i><span id="brain107PresenceCount">${brain108L('متصل','Connected')}</span></span><button type="button" onclick="brain107Fit()">${brain108L('ملاءمة','Fit')}</button><button type="button" onclick="brain108CloseCanvas()">×</button></div>
  </div>
  <div class="brain107-main"><aside class="brain107-tools">
    <button type="button" class="brain107-tool ${brain107Tool==='select'?'active':''}" onclick="brain107SetTool('select')">${brain107SvgIcon('select')}</button>
    <button type="button" class="brain107-tool ${brain107Tool==='hand'?'active':''}" onclick="brain107SetTool('hand')">${brain107SvgIcon('hand')}</button>
    ${editable?`<button type="button" class="brain107-tool ${brain107Tool==='pen'?'active':''}" onclick="brain107SetTool('pen')">${brain107SvgIcon('pen')}</button><button type="button" class="brain107-tool" onclick="brain107ToggleCompose(true)">${brain107SvgIcon('note')}</button>`:''}
  </aside><div class="brain107-stage-wrap" id="brain107StageWrap"><div class="brain107-stage ${brain107Tool==='pen'?'pen-mode':brain107Tool==='select'?'select-mode':''}" id="brain107Stage"><svg class="brain107-svg" id="brain107Svg" viewBox="0 0 4000 3000"></svg><div id="brain107Cards"></div><div id="brain107Cursors"></div></div>
  ${!editable?`<div class="brain107-readonly">${brain108L('هذه الغرفة للعرض فقط','This room is read-only')}</div>`:''}
  <div class="brain107-bottom"><button type="button" onclick="brain107Zoom(-.15)">−</button><span class="brain107-zoom" id="brain107Zoom">${Math.round(brain107Scale*100)}%</span><button type="button" onclick="brain107Zoom(.15)">+</button><button type="button" onclick="brain107Fit()">${brain108L('ملاءمة','Fit')}</button></div></div></div>
  <div class="brain107-compose-panel" id="brain107Compose"><label>${brain108L('نوع البطاقة','Card type')}</label><select id="brain107Kind"><option value="idea">${brain108L('فكرة','Idea')}</option><option value="update">${brain108L('تحديث / خبر','Update / news')}</option><option value="question">${brain108L('سؤال','Question')}</option><option value="decision">${brain108L('قرار','Decision')}</option></select><label style="margin-top:8px">${brain108L('المحتوى','Content')}</label><textarea id="brain107Body" maxlength="1500"></textarea><div class="brain107-compose-actions"><button type="button" onclick="brain107ToggleCompose(false)">${brain108L('إلغاء','Cancel')}</button><button type="button" class="primary" onclick="brain108CreateCard()">${brain108L('إضافة للوحة','Add to canvas')}</button></div></div>`;
  el.classList.add('show');brain107ApplyTransform();brain108BindStage();brain107RenderData();
}

function brain108BindStage(){
  const wrap=document.getElementById('brain107StageWrap'),stage=document.getElementById('brain107Stage');
  if(!wrap||!stage||wrap.__brain108)return;wrap.__brain108=true;
  wrap.addEventListener('wheel',e=>{e.preventDefault();brain107Zoom(e.deltaY>0?-.1:.1,e.clientX,e.clientY)},{passive:false});
  stage.addEventListener('pointerdown',brain108PointerDown);
  window.addEventListener('pointermove',brain108PointerMove);
  window.addEventListener('pointerup',brain108PointerUp);
}

function brain108PointerDown(e){
  if(e.button!=null&&e.button!==0)return;
  const card=e.target.closest?.('.brain107-card');
  if(card&&brain107Tool==='select'&&brain108Editable()){
    const o=brain107Objects.find(x=>x.id===card.dataset.id);if(!o||!o.can_move)return;
    const p=brain107ScreenToCanvas(e.clientX,e.clientY);
    brain107Drag={id:o.id,dx:p.x-o.x,dy:p.y-o.y,lastX:o.x,lastY:o.y};card.classList.add('dragging');return;
  }
  if(brain107Tool==='pen'&&brain108Editable()){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY);brain107Draw={points:[{x:p.x,y:p.y,p:e.pressure||.5}],pointerId:e.pointerId};return;
  }
  if(brain107Tool==='hand'||(!card&&brain107Tool==='select'))brain107Pan={x:e.clientX,y:e.clientY,tx:brain107Tx,ty:brain107Ty};
}
function brain108PointerMove(e){
  if(brain107Drag){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY),o=brain107Objects.find(x=>x.id===brain107Drag.id);
    if(o){o.x=Math.max(0,Math.min(3760,p.x-brain107Drag.dx));o.y=Math.max(0,Math.min(2820,p.y-brain107Drag.dy));brain107Drag.lastX=o.x;brain107Drag.lastY=o.y;brain107RenderCards()}
  }else if(brain107Draw&&e.pointerId===brain107Draw.pointerId){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY),last=brain107Draw.points.at(-1);
    if(!last||Math.hypot(p.x-last.x,p.y-last.y)>2){brain107Draw.points.push({x:p.x,y:p.y,p:e.pressure||.5});brain107RenderStrokes(true)}
  }else if(brain107Pan){
    brain107Tx=brain107Pan.tx+(e.clientX-brain107Pan.x);brain107Ty=brain107Pan.ty+(e.clientY-brain107Pan.y);brain107ApplyTransform();
  }
  if(Date.now()-brain107LastPresence>100){brain107LastPresence=Date.now();const p=brain107ScreenToCanvas(e.clientX,e.clientY);brain108PresencePing(p.x,p.y)}
}
async function brain108PointerUp(e){
  if(brain107Drag){
    const d=brain107Drag;brain107Drag=null;
    document.querySelector(`.brain107-card[data-id="${CSS.escape(d.id)}"]`)?.classList.remove('dragging');
    await sb.rpc('tasky_brainstorm_canvas_move_v108',{p_room_id:window.brain108RoomId,p_object_id:d.id,p_x:Math.round(d.lastX),p_y:Math.round(d.lastY)});
  }
  if(brain107Draw&&e.pointerId===brain107Draw.pointerId){
    const pts=brain107Draw.points;brain107Draw=null;
    if(pts.length>1)await sb.rpc('tasky_brainstorm_canvas_stroke_add_v108',{p_room_id:window.brain108RoomId,p_points:pts,p_width:3.2,p_color:'#214f40'});
    await brain108FetchCanvas();
  }
  brain107Pan=null;
}
async function brain108PresencePing(x=null,y=null){
  if(!window.brain108RoomId)return;
  sb.rpc('tasky_brainstorm_canvas_presence_v108',{p_room_id:window.brain108RoomId,p_cursor_x:x==null?null:Math.round(x),p_cursor_y:y==null?null:Math.round(y)}).catch?.(()=>{});
}
async function brain108CreateCard(){
  const body=document.getElementById('brain107Body')?.value.trim()||'',kind=document.getElementById('brain107Kind')?.value||'idea';if(!body)return;
  const wrap=document.getElementById('brain107StageWrap'),r=wrap.getBoundingClientRect(),c=brain107ScreenToCanvas(r.left+r.width/2,r.top+r.height/2);
  const {error}=await sb.rpc('tasky_brainstorm_canvas_object_add_v108',{p_room_id:window.brain108RoomId,p_kind:kind,p_body:body,p_x:Math.round(c.x-115),p_y:Math.round(c.y-60)});
  if(error)return showTaskyDialog({title:brain108L('تعذّرت إضافة البطاقة','Could not add card'),message:error.message,tone:'error'});
  brain107ToggleCompose(false);await brain108FetchCanvas();
}

/* Reuse existing card UI but redirect vote/delete RPCs. */
brain107Vote=async function(id){
  const {error}=await sb.rpc('tasky_brainstorm_canvas_vote_v108',{p_room_id:window.brain108RoomId,p_object_id:id});
  if(error)return taskyToast(error.message,{tone:'warning'});await brain108FetchCanvas();
};
brain107DeleteObject=async function(id){
  const ok=await taskyConfirm(brain108L('حذف هذه البطاقة؟','Delete this card?'),{title:brain108L('حذف البطاقة','Delete card'),tone:'danger',confirmText:brain108L('حذف','Delete')});if(!ok)return;
  const {error}=await sb.rpc('tasky_brainstorm_canvas_object_delete_v108',{p_room_id:window.brain108RoomId,p_object_id:id});
  if(error)return showTaskyDialog({title:brain108L('تعذّر الحذف','Could not delete'),message:error.message,tone:'error'});await brain108FetchCanvas();
};
function brain108CloseCanvas(){
  clearInterval(brain107Timer);clearInterval(brain107PresenceTimer);brain107Timer=null;brain107PresenceTimer=null;
  window.brain108RoomId=null;window.brain108RoomMeta=null;brain107Objects=[];brain107Strokes=[];brain107Presence=[];
  brain107Shell().classList.remove('show');
}

/* Load independent rooms when Brainstorm is initially rendered. */
const meetingsTemplateBaseV108=meetingsTemplateV101;
meetingsTemplateV101=function(){
  if(meetingsSectionV10622==='brainstorm'&&!brain108Loading&&!brain108Rooms.length&&!brain108Error){
    setTimeout(()=>brain108FetchRooms().then(()=>{if(activeNav==='meetings'&&meetingsSectionV10622==='brainstorm')renderModule()}),0);
  }
  return meetingsTemplateBaseV108();
};


/* --- source script: tasky-v109-brainstorm-canvas-js --- */

window.TASKY_BUILD='V109';console.info('Tasky build',window.TASKY_BUILD);

let brain109Shapes=[];
let brain109Connectors=[];
let brain109ConnectStart=null;
let brain109ConnectorStyle='line';
let brain109ShapeDrag=null;
let brain109Abort=null;

function brain109L(ar,en){return lang==='ar'?ar:en}
function brain109RoomMode(){return !!window.brain108RoomId}
function brain109Editable(){return brain109RoomMode()&&brain108Editable()}
function brain109CloseMenus(){
  document.getElementById('brain109ShapeMenu')?.classList.remove('show');
  document.getElementById('brain109LineMenu')?.classList.remove('show');
}
function brain109Hint(text=''){
  const el=document.getElementById('brain109Hint');if(!el)return;
  el.textContent=text;el.classList.toggle('show',!!text);
}
function brain109SetTool(tool){
  brain107Tool=tool;
  brain109ConnectStart=null;
  brain109CloseMenus();
  if(tool==='connect'){
    brain109Hint(brain109L('اختر الفكرة أو الشكل الأول ثم اختر العنصر الثاني','Select the first idea or shape, then select the second'));
  }else{
    brain109Hint('');
  }
  brain108RenderCanvasShell(window.brain108RoomMeta||{});
}
function brain109ToggleShapeMenu(){
  brain109CloseMenus();
  document.getElementById('brain109ShapeMenu')?.classList.toggle('show');
}
function brain109ToggleLineMenu(){
  brain109CloseMenus();
  document.getElementById('brain109LineMenu')?.classList.toggle('show');
}
function brain109BeginConnector(style){
  brain109ConnectorStyle=style;
  brain109SetTool('connect');
}
function brain109NodeCenter(id){
  const o=brain107Objects.find(x=>String(x.id)===String(id));
  if(o)return{x:Number(o.x)+115,y:Number(o.y)+72};
  const s=brain109Shapes.find(x=>String(x.id)===String(id));
  if(s)return{x:Number(s.x)+Number(s.w)/2,y:Number(s.y)+Number(s.h)/2};
  return null;
}
function brain109NodeExists(id){
  return !!brain107Objects.find(x=>String(x.id)===String(id))||!!brain109Shapes.find(x=>String(x.id)===String(id));
}
function brain109RenderConnectors(){
  const svg=document.getElementById('brain107Svg');if(!svg)return;
  const strokes=brain107Strokes.map(st=>{
    const pts=st.points||[];if(pts.length<2)return'';
    const d=pts.map((p,i)=>`${i?'L':'M'} ${Number(p.x).toFixed(1)} ${Number(p.y).toFixed(1)}`).join(' ');
    return `<path class="brain107-stroke" d="${d}" stroke="${escapeHtml(st.color||'#214f40')}" stroke-width="${Number(st.width||3)}"/>`;
  }).join('');
  const connectors=brain109Connectors.map(c=>{
    const a=brain109NodeCenter(c.from_node_id),b=brain109NodeCenter(c.to_node_id);
    if(!a||!b)return'';
    const marker=c.style==='arrow'?' marker-end="url(#brain109Arrow)"':'';
    return `<path class="brain109-connector" data-id="${c.id}" d="M ${a.x} ${a.y} L ${b.x} ${b.y}"${marker}></path>`;
  }).join('');
  svg.innerHTML=`<defs><marker id="brain109Arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,4.5 L0,9 z" fill="#61736c"></path></marker></defs>${connectors}${strokes}`;
}
function brain109RenderShapes(){
  const host=document.getElementById('brain109Shapes');if(!host)return;
  host.innerHTML=brain109Shapes.map(s=>`<div class="brain109-shape ${escapeHtml(s.shape_type)} ${brain109ConnectStart===s.id?'brain109-connect-source':''}" data-shape-id="${s.id}" style="left:${Number(s.x)}px;top:${Number(s.y)}px;width:${Number(s.w)}px;height:${Number(s.h)}px"></div>`).join('');
}
function brain109RenderCards(){
  const host=document.getElementById('brain107Cards');if(!host)return;
  const editable=brain109Editable();
  host.classList.toggle('brain109-card-readonly',!editable);
  host.innerHTML=brain107Objects.map(o=>`<article class="brain107-card ${brain109ConnectStart===o.id?'brain109-connect-source':''}" data-id="${o.id}" data-kind="${escapeHtml(o.kind)}" style="left:${Number(o.x)}px;top:${Number(o.y)}px">
    <div class="brain107-card-head"><span class="brain107-card-kind">${escapeHtml(brain107KindLabel(o.kind))}</span><span class="brain107-card-author">${escapeHtml(o.author_name||'')}</span></div>
    <div class="brain107-card-body">${escapeHtml(o.body)}</div>
    <div class="brain107-card-foot">${editable?`<button type="button" class="${o.my_vote?'voted':''}" onclick="event.stopPropagation();brain107Vote('${o.id}')">${brain109L('تصويت','Vote')} · ${Number(o.vote_count||0)}</button>`:'<span></span>'}<div class="actions">${o.can_delete&&editable?`<button type="button" onclick="event.stopPropagation();brain107DeleteObject('${o.id}')">${brain109L('حذف','Delete')}</button>`:''}</div></div>
  </article>`).join('');
  const empty=document.getElementById('brain109Empty');
  if(empty)empty.style.display=(brain107Objects.length||brain109Shapes.length||brain107Strokes.length)?'none':'block';
}
function brain109RenderData(){
  if(!brain109RoomMode())return;
  brain109RenderConnectors();
  brain109RenderShapes();
  brain109RenderCards();
  brain107RenderPresence();
}

/* Preserve meeting-linked V107 behavior when that legacy canvas is opened. */
const brain107RenderDataBaseV109=brain107RenderData;
brain107RenderData=function(){
  if(brain109RoomMode())return brain109RenderData();
  return brain107RenderDataBaseV109();
};
const brain107RenderStrokesBaseV109=brain107RenderStrokes;
brain107RenderStrokes=function(includeDraft=false){
  if(!brain109RoomMode())return brain107RenderStrokesBaseV109(includeDraft);
  const svg=document.getElementById('brain107Svg');if(!svg)return;
  const saved=[...brain107Strokes];
  if(includeDraft&&brain107Draw?.points?.length)saved.push({id:'draft',points:brain107Draw.points,width:3.2,color:'#214f40'});
  const real=brain107Strokes;brain107Strokes=saved;
  brain109RenderConnectors();
  brain107Strokes=real;
};
const brain107SetToolBaseV109=brain107SetTool;
brain107SetTool=function(t){
  if(brain109RoomMode())return brain109SetTool(t);
  return brain107SetToolBaseV109(t);
};

/* Mode-aware vote/delete fixes a V108 regression where opening the older
   meeting-linked canvas could accidentally call standalone-room RPCs. */
brain107Vote=async function(id){
  if(brain109RoomMode()){
    if(!brain109Editable())return;
    const {error}=await sb.rpc('tasky_brainstorm_canvas_vote_v109',{p_room_id:window.brain108RoomId,p_object_id:id});
    if(error)return taskyToast(error.message,{tone:'warning'});
    return brain108FetchCanvas();
  }
  const {error}=await sb.rpc('tasky_meeting_canvas_vote_v107',{...brain107SessionArgs(),p_object_id:id});
  if(error)return taskyToast(error.message,{tone:'warning'});
  return brain107Fetch();
};
brain107DeleteObject=async function(id){
  if(brain109RoomMode()){
    if(!brain109Editable())return;
    const ok=await taskyConfirm(brain109L('حذف هذه البطاقة؟','Delete this card?'),{title:brain109L('حذف البطاقة','Delete card'),tone:'danger',confirmText:brain109L('حذف','Delete')});if(!ok)return;
    const {error}=await sb.rpc('tasky_brainstorm_canvas_object_delete_v109',{p_room_id:window.brain108RoomId,p_object_id:id});
    if(error)return showTaskyDialog({title:brain109L('تعذّر الحذف','Could not delete'),message:error.message,tone:'error'});
    return brain108FetchCanvas();
  }
  const ok=await taskyConfirm(brain109L('حذف هذه البطاقة؟','Delete this card?'),{title:brain109L('حذف البطاقة','Delete card'),tone:'danger',confirmText:brain109L('حذف','Delete')});if(!ok)return;
  const {error}=await sb.rpc('tasky_meeting_canvas_object_delete_v107',{...brain107SessionArgs(),p_object_id:id});
  if(error)return showTaskyDialog({title:brain109L('تعذّر الحذف','Could not delete'),message:error.message,tone:'error'});
  return brain107Fetch();
};

async function brain109FetchCanvas(){
  if(!window.brain108RoomId)return;
  const {data,error}=await sb.rpc('tasky_brainstorm_canvas_state_v109',{p_room_id:window.brain108RoomId});
  if(error){console.warn('V109 canvas state',error);return}
  brain107Objects=Array.isArray(data?.objects)?data.objects:[];
  brain107Strokes=Array.isArray(data?.strokes)?data.strokes:[];
  brain107Presence=Array.isArray(data?.presence)?data.presence:[];
  brain109Shapes=Array.isArray(data?.shapes)?data.shapes:[];
  brain109Connectors=Array.isArray(data?.connectors)?data.connectors:[];
  window.brain108RoomMeta=data?.room||window.brain108RoomMeta||{};
  brain109RenderData();
}
brain108FetchCanvas=brain109FetchCanvas;

async function brain109AddShape(type){
  brain109CloseMenus();
  if(!brain109Editable())return;
  const wrap=document.getElementById('brain107StageWrap'),r=wrap.getBoundingClientRect(),c=brain107ScreenToCanvas(r.left+r.width/2,r.top+r.height/2);
  const w=type==='ellipse'?180:200,h=type==='ellipse'?120:130;
  const {error}=await sb.rpc('tasky_brainstorm_canvas_shape_add_v109',{p_room_id:window.brain108RoomId,p_shape_type:type,p_x:Math.round(c.x-w/2),p_y:Math.round(c.y-h/2),p_w:w,p_h:h});
  if(error)return showTaskyDialog({title:brain109L('تعذّرت إضافة الشكل','Could not add shape'),message:error.message,tone:'error'});
  await brain109FetchCanvas();
}
async function brain109DeleteShape(id){
  if(!brain109Editable())return;
  const ok=await taskyConfirm(brain109L('حذف هذا الشكل والخطوط المرتبطة به؟','Delete this shape and its connected lines?'),{title:brain109L('حذف الشكل','Delete shape'),tone:'danger',confirmText:brain109L('حذف','Delete')});if(!ok)return;
  const {error}=await sb.rpc('tasky_brainstorm_canvas_shape_delete_v109',{p_room_id:window.brain108RoomId,p_shape_id:id});
  if(error)return showTaskyDialog({title:brain109L('تعذّر الحذف','Could not delete'),message:error.message,tone:'error'});
  await brain109FetchCanvas();
}
async function brain109ConnectorClick(nodeId){
  if(!brain109Editable()||brain107Tool!=='connect')return;
  if(!brain109ConnectStart){
    brain109ConnectStart=nodeId;
    brain109Hint(brain109L('الآن اختر الفكرة أو الشكل الثاني','Now select the second idea or shape'));
    brain109RenderData();
    return;
  }
  if(String(brain109ConnectStart)===String(nodeId)){
    brain109ConnectStart=null;brain109Hint(brain109L('اختر العنصر الأول ثم الثاني','Select the first element, then the second'));brain109RenderData();return;
  }
  const {error}=await sb.rpc('tasky_brainstorm_canvas_connector_add_v109',{
    p_room_id:window.brain108RoomId,p_from_node_id:brain109ConnectStart,p_to_node_id:nodeId,p_style:brain109ConnectorStyle
  });
  brain109ConnectStart=null;
  if(error)return showTaskyDialog({title:brain109L('تعذّر إنشاء الخط','Could not create connector'),message:error.message,tone:'error'});
  brain109Hint(brain109L('تم إنشاء الخط. اختر عنصرًا أول لخط جديد.','Connector created. Select a first element for another line.'));
  await brain109FetchCanvas();
}
async function brain109DeleteConnector(id){
  if(!brain109Editable())return;
  const ok=await taskyConfirm(brain109L('حذف هذا الخط؟','Delete this connector?'),{title:brain109L('حذف الخط','Delete connector'),tone:'danger',confirmText:brain109L('حذف','Delete')});if(!ok)return;
  const {error}=await sb.rpc('tasky_brainstorm_canvas_connector_delete_v109',{p_room_id:window.brain108RoomId,p_connector_id:id});
  if(error)return taskyToast(error.message,{tone:'warning'});
  await brain109FetchCanvas();
}
async function brain109UndoStroke(){
  if(!brain109Editable())return;
  const {data,error}=await sb.rpc('tasky_brainstorm_canvas_stroke_undo_v109',{p_room_id:window.brain108RoomId});
  if(error)return taskyToast(error.message,{tone:'warning'});
  if(!data?.deleted)return taskyToast(brain109L('لا يوجد رسم حديث لك للتراجع عنه','No recent drawing of yours to undo'),{tone:'warning'});
  await brain109FetchCanvas();
}

/* Stable input binding: abort old global listeners on every room render/open. */
function brain109BindStage(){
  brain109Abort?.abort();
  brain109Abort=new AbortController();
  const signal=brain109Abort.signal;
  const wrap=document.getElementById('brain107StageWrap'),stage=document.getElementById('brain107Stage');
  if(!wrap||!stage)return;
  wrap.addEventListener('wheel',e=>{e.preventDefault();brain107Zoom(e.deltaY>0?-.1:.1,e.clientX,e.clientY)},{passive:false,signal});
  stage.addEventListener('pointerdown',brain109PointerDown,{signal});
  window.addEventListener('pointermove',brain109PointerMove,{signal});
  window.addEventListener('pointerup',brain109PointerUp,{signal});
  stage.addEventListener('click',e=>{
    const connector=e.target.closest?.('.brain109-connector');
    if(connector&&brain107Tool==='select'){e.stopPropagation();brain109DeleteConnector(connector.dataset.id)}
  },{signal});
}
function brain109PointerDown(e){
  if(e.button!=null&&e.button!==0)return;
  const card=e.target.closest?.('.brain107-card');
  const shape=e.target.closest?.('.brain109-shape');

  if(brain107Tool==='connect'){
    const id=card?.dataset.id||shape?.dataset.shapeId;
    if(id){e.preventDefault();e.stopPropagation();brain109ConnectorClick(id)}
    return;
  }
  if(shape&&brain107Tool==='select'&&brain109Editable()){
    const s=brain109Shapes.find(x=>String(x.id)===String(shape.dataset.shapeId));if(!s||!s.can_move)return;
    const p=brain107ScreenToCanvas(e.clientX,e.clientY);
    brain109ShapeDrag={id:s.id,dx:p.x-s.x,dy:p.y-s.y,lastX:s.x,lastY:s.y};
    shape.classList.add('dragging');return;
  }
  if(card&&brain107Tool==='select'&&brain109Editable()){
    const o=brain107Objects.find(x=>x.id===card.dataset.id);if(!o||!o.can_move)return;
    const p=brain107ScreenToCanvas(e.clientX,e.clientY);
    brain107Drag={id:o.id,dx:p.x-o.x,dy:p.y-o.y,lastX:o.x,lastY:o.y};
    card.classList.add('dragging');return;
  }
  if(brain107Tool==='pen'&&brain109Editable()){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY);
    brain107Draw={points:[{x:p.x,y:p.y,p:e.pressure||.5}],pointerId:e.pointerId};return;
  }
  if(brain107Tool==='hand'||(!card&&!shape&&brain107Tool==='select')){
    brain107Pan={x:e.clientX,y:e.clientY,tx:brain107Tx,ty:brain107Ty};
  }
}
function brain109PointerMove(e){
  if(brain109ShapeDrag){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY),s=brain109Shapes.find(x=>x.id===brain109ShapeDrag.id);
    if(s){s.x=Math.max(0,Math.min(4000-s.w,p.x-brain109ShapeDrag.dx));s.y=Math.max(0,Math.min(3000-s.h,p.y-brain109ShapeDrag.dy));brain109ShapeDrag.lastX=s.x;brain109ShapeDrag.lastY=s.y;brain109RenderShapes();brain109RenderConnectors()}
  }else if(brain107Drag){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY),o=brain107Objects.find(x=>x.id===brain107Drag.id);
    if(o){o.x=Math.max(0,Math.min(3760,p.x-brain107Drag.dx));o.y=Math.max(0,Math.min(2820,p.y-brain107Drag.dy));brain107Drag.lastX=o.x;brain107Drag.lastY=o.y;brain109RenderCards();brain109RenderConnectors()}
  }else if(brain107Draw&&e.pointerId===brain107Draw.pointerId){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY),last=brain107Draw.points.at(-1);
    if(!last||Math.hypot(p.x-last.x,p.y-last.y)>2){brain107Draw.points.push({x:p.x,y:p.y,p:e.pressure||.5});brain107RenderStrokes(true)}
  }else if(brain107Pan){
    brain107Tx=brain107Pan.tx+(e.clientX-brain107Pan.x);brain107Ty=brain107Pan.ty+(e.clientY-brain107Pan.y);brain107ApplyTransform();
  }
  if(Date.now()-brain107LastPresence>100){
    brain107LastPresence=Date.now();const p=brain107ScreenToCanvas(e.clientX,e.clientY);brain108PresencePing(p.x,p.y);
  }
}
async function brain109PointerUp(e){
  if(brain109ShapeDrag){
    const d=brain109ShapeDrag;brain109ShapeDrag=null;
    document.querySelector(`.brain109-shape[data-shape-id="${CSS.escape(d.id)}"]`)?.classList.remove('dragging');
    const {error}=await sb.rpc('tasky_brainstorm_canvas_shape_move_v109',{p_room_id:window.brain108RoomId,p_shape_id:d.id,p_x:Math.round(d.lastX),p_y:Math.round(d.lastY)});
    if(error)console.warn('V109 shape move',error);
  }
  if(brain107Drag){
    const d=brain107Drag;brain107Drag=null;
    document.querySelector(`.brain107-card[data-id="${CSS.escape(d.id)}"]`)?.classList.remove('dragging');
    const {error}=await sb.rpc('tasky_brainstorm_canvas_move_v108',{p_room_id:window.brain108RoomId,p_object_id:d.id,p_x:Math.round(d.lastX),p_y:Math.round(d.lastY)});
    if(error)console.warn('V109 card move',error);
  }
  if(brain107Draw&&e.pointerId===brain107Draw.pointerId){
    const pts=brain107Draw.points;brain107Draw=null;
    if(pts.length>1){
      const {error}=await sb.rpc('tasky_brainstorm_canvas_stroke_add_v108',{p_room_id:window.brain108RoomId,p_points:pts,p_width:3.2,p_color:'#214f40'});
      if(error)showTaskyDialog({title:brain109L('تعذّر حفظ الرسم','Could not save drawing'),message:error.message,tone:'error'});
    }
    await brain109FetchCanvas();
  }
  brain107Pan=null;
}

/* Full V109 shell fixes V108's tool-switch bug: changing tool no longer falls
   back to the meeting-linked V107 renderer. */
brain108RenderCanvasShell=function(room){
  window.brain108RoomMeta=room;
  const el=brain107Shell(),editable=brain109Editable();
  el.innerHTML=`<div class="brain107-top">
    <div class="brain107-title"><h2>${brain109L('غرفة العصف الذهني','Brainstorm Room')} — ${escapeHtml(room.title||'')}</h2><p>${room.meeting_title?escapeHtml(room.meeting_title):brain109L('مساحة مستقلة للفريق','Independent team space')}</p></div>
    <div class="brain107-top-actions"><span class="brain107-status"><i></i><span id="brain107PresenceCount">${brain109L('متصل','Connected')}</span></span><button type="button" onclick="brain107Fit()">${brain109L('ملاءمة','Fit')}</button><button type="button" onclick="brain108CloseCanvas()">×</button></div>
  </div>
  <div class="brain107-main"><aside class="brain107-tools">
    <button type="button" class="brain107-tool ${brain107Tool==='select'?'active':''}" onclick="brain109SetTool('select')">${brain107SvgIcon('select')}<span class="brain109-tool-label">${brain109L('تحديد','Select')}</span></button>
    <button type="button" class="brain107-tool ${brain107Tool==='hand'?'active':''}" onclick="brain109SetTool('hand')">${brain107SvgIcon('hand')}<span class="brain109-tool-label">${brain109L('تحريك','Pan')}</span></button>
    ${editable?`<div class="brain109-toolbar-sep"></div>
    <button type="button" class="brain107-tool ${brain107Tool==='pen'?'active':''}" onclick="brain109SetTool('pen')">${brain107SvgIcon('pen')}<span class="brain109-tool-label">${brain109L('قلم','Pen')}</span></button>
    <button type="button" class="brain107-tool" onclick="brain107ToggleCompose(true)">${brain107SvgIcon('note')}<span class="brain109-tool-label">${brain109L('بطاقة','Card')}</span></button>
    <button type="button" class="brain107-tool" onclick="brain109ToggleShapeMenu()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="14" rx="2"/></svg><span class="brain109-tool-label">${brain109L('شكل','Shape')}</span></button>
    <button type="button" class="brain107-tool ${brain107Tool==='connect'?'active':''}" onclick="brain109ToggleLineMenu()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="17" r="2"/><circle cx="19" cy="7" r="2"/><path d="M7 16L17 8"/></svg><span class="brain109-tool-label">${brain109L('ربط','Connect')}</span></button>
    <button type="button" class="brain107-tool" onclick="brain109UndoStroke()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 8H4v-5"/><path d="M4 8c3-4 10-5 14-1 3 3 3 8 0 11"/></svg><span class="brain109-tool-label">${brain109L('تراجع عن الرسم','Undo drawing')}</span></button>`:''}
  </aside>
  <div class="brain107-stage-wrap" id="brain107StageWrap">
    <div class="brain107-stage ${brain107Tool==='pen'?'pen-mode':brain107Tool==='select'?'select-mode':''}" id="brain107Stage">
      <svg class="brain107-svg" id="brain107Svg" viewBox="0 0 4000 3000"></svg>
      <div class="brain109-shapes" id="brain109Shapes"></div><div id="brain107Cards"></div><div id="brain107Cursors"></div>
      <div id="brain109Empty" class="brain109-empty-canvas"><b>${brain109L('ابدأ من مساحة فارغة','Start with an empty canvas')}</b>${brain109L('أضف بطاقة أو شكلًا، ارسم بالقلم، ثم اربط العناصر بخطوط.','Add a card or shape, draw with the pen, then connect elements with lines.')}</div>
    </div>
    ${!editable?`<div class="brain107-readonly">${brain109L('هذه الغرفة للعرض فقط','This room is read-only')}</div>`:''}
    <div id="brain109Hint" class="brain109-hint"></div>
    <div class="brain107-bottom"><button type="button" onclick="brain107Zoom(-.15)">−</button><span class="brain107-zoom" id="brain107Zoom">${Math.round(brain107Scale*100)}%</span><button type="button" onclick="brain107Zoom(.15)">+</button><button type="button" onclick="brain107Fit()">${brain109L('ملاءمة','Fit')}</button></div>
  </div></div>
  <div id="brain109ShapeMenu" class="brain109-shape-menu"><button type="button" onclick="brain109AddShape('rect')">${brain109L('مستطيل','Rectangle')}</button><button type="button" onclick="brain109AddShape('ellipse')">${brain109L('دائرة / بيضاوي','Ellipse')}</button></div>
  <div id="brain109LineMenu" class="brain109-line-menu"><button type="button" onclick="brain109BeginConnector('line')">${brain109L('خط','Line')}</button><button type="button" onclick="brain109BeginConnector('arrow')">${brain109L('سهم','Arrow')}</button></div>
  <div class="brain107-compose-panel" id="brain107Compose"><label>${brain109L('نوع البطاقة','Card type')}</label><select id="brain107Kind"><option value="idea">${brain109L('فكرة','Idea')}</option><option value="update">${brain109L('تحديث / خبر','Update / news')}</option><option value="question">${brain109L('سؤال','Question')}</option><option value="decision">${brain109L('قرار','Decision')}</option></select><label style="margin-top:8px">${brain109L('المحتوى','Content')}</label><textarea id="brain107Body" maxlength="1500"></textarea><div class="brain107-compose-actions"><button type="button" onclick="brain107ToggleCompose(false)">${brain109L('إلغاء','Cancel')}</button><button type="button" class="primary" onclick="brain108CreateCard()">${brain109L('إضافة للوحة','Add to canvas')}</button></div></div>`;
  el.classList.add('show');brain107ApplyTransform();brain109BindStage();brain109RenderData();
};

/* Open/fetch use the hardened state with shapes/connectors. */
brain108OpenRoom=async function(roomId){
  window.brain108RoomId=roomId;
  const probe=await sb.rpc('tasky_brainstorm_canvas_state_v109',{p_room_id:roomId});
  if(probe.error){window.brain108RoomId=null;return showTaskyDialog({title:brain109L('تعذّر فتح الغرفة','Could not open room'),message:probe.error.message,tone:'error'})}
  brain107MeetingId=null;
  brain107Objects=Array.isArray(probe.data?.objects)?probe.data.objects:[];
  brain107Strokes=Array.isArray(probe.data?.strokes)?probe.data.strokes:[];
  brain107Presence=Array.isArray(probe.data?.presence)?probe.data.presence:[];
  brain109Shapes=Array.isArray(probe.data?.shapes)?probe.data.shapes:[];
  brain109Connectors=Array.isArray(probe.data?.connectors)?probe.data.connectors:[];
  brain107Tool='select';brain109ConnectStart=null;
  brain108RenderCanvasShell(probe.data?.room||{});
  setTimeout(brain107Fit,50);
  clearInterval(brain107Timer);brain107Timer=setInterval(brain109FetchCanvas,1000);
  clearInterval(brain107PresenceTimer);brain108PresencePing();brain107PresenceTimer=setInterval(()=>brain108PresencePing(),4000);
};

const brain108CloseCanvasBaseV109=brain108CloseCanvas;
brain108CloseCanvas=function(){
  brain109Abort?.abort();brain109Abort=null;brain109Shapes=[];brain109Connectors=[];brain109ConnectStart=null;
  return brain108CloseCanvasBaseV109();
};


/* --- source script: tasky-v110-brainstorm-realtime-js --- */

window.TASKY_BUILD='V110';console.info('Tasky build',window.TASKY_BUILD);
let brain110Channel=null,brain110RoomId=null,brain110RealtimeStatus='offline',brain110RealtimeRefreshTimer=null,brain110FallbackTimer=null,brain110CursorMap=new Map(),brain110LastCursorSent=0,brain110KeysBound=false;
function brain110L(ar,en){return lang==='ar'?ar:en}
function brain110DisplayName(){try{const n=typeof meetingMemberNameV101==='function'?meetingMemberNameV101(currentUserId):'';if(n&&n!==currentUserId)return n}catch(_){}return brain110L('مشارك','Participant')}
function brain110SetStatus(status){brain110RealtimeStatus=status;const el=document.getElementById('brain110Live');if(!el)return;el.className=`brain110-live ${status}`;const label=status==='connected'?brain110L('تحديث مباشر','Live sync'):status==='reconnecting'?brain110L('إعادة الاتصال…','Reconnecting…'):brain110L('وضع احتياطي','Fallback mode');el.innerHTML=`<i></i><span>${label}</span>`}
function brain110ScheduleRefresh(delay=100){clearTimeout(brain110RealtimeRefreshTimer);brain110RealtimeRefreshTimer=setTimeout(()=>{if(window.brain108RoomId)brain109FetchCanvas()},delay)}
function brain110RenderRealtimePresence(){const rows=[];for(const [key,v] of brain110CursorMap.entries()){if(Date.now()-(v.ts||0)>15000){brain110CursorMap.delete(key);continue}rows.push({display_name:v.name||brain110L('مشارك','Participant'),cursor_x:v.x,cursor_y:v.y,is_me:false})}brain107Presence=rows;brain107RenderPresence()}
async function brain110Connect(roomId){brain110Disconnect();brain110RoomId=roomId;brain110SetStatus('reconnecting');const ch=sb.channel(`tasky-brainstorm-v110-${roomId}`,{config:{broadcast:{self:false,ack:false},presence:{key:String(currentUserId||crypto.randomUUID())}}});brain110Channel=ch;const refresh=()=>brain110ScheduleRefresh(90);['tasky_brainstorm_canvas_objects_v108','tasky_brainstorm_canvas_strokes_v108','tasky_brainstorm_canvas_votes_v108','tasky_brainstorm_canvas_shapes_v109','tasky_brainstorm_canvas_connectors_v109'].forEach(table=>ch.on('postgres_changes',{event:'*',schema:'public',table,filter:`room_id=eq.${roomId}`},refresh));ch.on('postgres_changes',{event:'*',schema:'public',table:'tasky_brainstorm_rooms_v108',filter:`id=eq.${roomId}`},refresh);ch.on('broadcast',{event:'cursor'},payload=>{const p=payload?.payload||payload;if(!p||String(p.user_id||'')===String(currentUserId||''))return;brain110CursorMap.set(String(p.user_id||p.session||Math.random()),{x:Number(p.x||0),y:Number(p.y||0),name:p.name||brain110L('مشارك','Participant'),ts:Date.now()});brain110RenderRealtimePresence()});ch.on('presence',{event:'sync'},()=>{const state=ch.presenceState?.()||{};const count=Object.values(state).flat().length||1;const c=document.getElementById('brain107PresenceCount');if(c)c.textContent=`${count} ${brain110L('متصل','online')}`});ch.subscribe(async status=>{if(status==='SUBSCRIBED'){brain110SetStatus('connected');try{await ch.track({user_id:String(currentUserId||''),name:brain110DisplayName(),joined_at:new Date().toISOString()})}catch(_){}clearInterval(brain110FallbackTimer);brain110FallbackTimer=setInterval(()=>{if(window.brain108RoomId)brain109FetchCanvas()},15000)}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){brain110SetStatus('offline');clearInterval(brain110FallbackTimer);brain110FallbackTimer=setInterval(()=>{if(window.brain108RoomId)brain109FetchCanvas()},4000)}})}
function brain110Disconnect(){clearTimeout(brain110RealtimeRefreshTimer);clearInterval(brain110FallbackTimer);brain110CursorMap.clear();if(brain110Channel){try{sb.removeChannel(brain110Channel)}catch(_){}}brain110Channel=null;brain110RoomId=null}
function brain110BroadcastCursor(x,y){if(!brain110Channel||brain110RealtimeStatus!=='connected')return;const now=Date.now();if(now-brain110LastCursorSent<80)return;brain110LastCursorSent=now;brain110Channel.send({type:'broadcast',event:'cursor',payload:{user_id:String(currentUserId||''),name:brain110DisplayName(),x:Math.round(x),y:Math.round(y)}}).catch?.(()=>{})}
brain108PresencePing=async function(x=null,y=null){if(!window.brain108RoomId)return;if(x!=null&&y!=null)brain110BroadcastCursor(x,y);if(Date.now()-(brain108PresencePing.__lastDb||0)<10000)return;brain108PresencePing.__lastDb=Date.now();sb.rpc('tasky_brainstorm_canvas_presence_v108',{p_room_id:window.brain108RoomId,p_cursor_x:x==null?null:Math.round(x),p_cursor_y:y==null?null:Math.round(y)}).catch?.(()=>{})};
function brain110OpenEditCard(id){if(!brain109Editable())return;const o=brain107Objects.find(x=>String(x.id)===String(id));if(!o)return;const layer=document.getElementById('brain110Editing');if(!layer)return;layer.innerHTML=`<div class="brain110-edit-card"><h3>${brain110L('تعديل البطاقة','Edit card')}</h3><select id="brain110EditKind"><option value="idea" ${o.kind==='idea'?'selected':''}>${brain110L('فكرة','Idea')}</option><option value="update" ${o.kind==='update'?'selected':''}>${brain110L('تحديث / خبر','Update / news')}</option><option value="question" ${o.kind==='question'?'selected':''}>${brain110L('سؤال','Question')}</option><option value="decision" ${o.kind==='decision'?'selected':''}>${brain110L('قرار','Decision')}</option></select><textarea id="brain110EditBody" maxlength="1500">${escapeHtml(o.body)}</textarea><div class="brain110-edit-actions"><button type="button" onclick="brain110CloseEdit()">${brain110L('إلغاء','Cancel')}</button><button type="button" class="primary" onclick="brain110SaveEdit('${o.id}')">${brain110L('حفظ','Save')}</button></div></div>`;layer.classList.add('show');setTimeout(()=>document.getElementById('brain110EditBody')?.focus(),20)}
function brain110CloseEdit(){const layer=document.getElementById('brain110Editing');if(layer){layer.classList.remove('show');layer.innerHTML=''}}
async function brain110SaveEdit(id){const body=document.getElementById('brain110EditBody')?.value.trim()||'',kind=document.getElementById('brain110EditKind')?.value||'idea';if(!body)return;const {error}=await sb.rpc('tasky_brainstorm_canvas_object_update_v110',{p_room_id:window.brain108RoomId,p_object_id:id,p_kind:kind,p_body:body});if(error)return showTaskyDialog({title:brain110L('تعذّر حفظ التعديل','Could not save changes'),message:error.message,tone:'error'});brain110CloseEdit();brain110ScheduleRefresh(40)}
brain109RenderCards=function(){const host=document.getElementById('brain107Cards');if(!host)return;const editable=brain109Editable();host.classList.toggle('brain109-card-readonly',!editable);host.innerHTML=brain107Objects.map(o=>`<article class="brain107-card ${brain109ConnectStart===o.id?'brain109-connect-source':''}" data-id="${o.id}" data-kind="${escapeHtml(o.kind)}" style="left:${Number(o.x)}px;top:${Number(o.y)}px"><div class="brain107-card-head"><span class="brain107-card-kind">${escapeHtml(brain107KindLabel(o.kind))}</span><span class="brain107-card-author">${escapeHtml(o.author_name||'')}</span></div><div class="brain107-card-body">${escapeHtml(o.body)}</div><div class="brain107-card-foot">${editable?`<button type="button" class="${o.my_vote?'voted':''}" onclick="event.stopPropagation();brain107Vote('${o.id}')">${brain110L('تصويت','Vote')} · ${Number(o.vote_count||0)}</button>`:'<span></span>'}<div class="actions">${editable&&o.can_edit?`<button type="button" onclick="event.stopPropagation();brain110OpenEditCard('${o.id}')">${brain110L('تعديل','Edit')}</button>`:''}${o.can_delete&&editable?`<button type="button" onclick="event.stopPropagation();brain107DeleteObject('${o.id}')">${brain110L('حذف','Delete')}</button>`:''}</div></div></article>`).join('');const empty=document.getElementById('brain109Empty');if(empty)empty.style.display=(brain107Objects.length||brain109Shapes.length||brain107Strokes.length)?'none':'block'};
const brain108RenderCanvasShellBaseV110=brain108RenderCanvasShell;brain108RenderCanvasShell=function(room){brain108RenderCanvasShellBaseV110(room);const actions=document.querySelector('#brain107CanvasShell .brain107-top-actions');if(actions&&!document.getElementById('brain110Live')){const status=document.createElement('span');status.id='brain110Live';status.className='brain110-live reconnecting';status.innerHTML=`<i></i><span>${brain110L('إعادة الاتصال…','Reconnecting…')}</span>`;actions.insertBefore(status,actions.firstChild)}const wrap=document.getElementById('brain107StageWrap');if(wrap&&!document.getElementById('brain110Shortcuts')){const help=document.createElement('div');help.id='brain110Shortcuts';help.className='brain110-shortcuts';help.textContent=brain110L('V تحديد · H تحريك · P قلم · N بطاقة · L ربط · F ملاءمة','V select · H pan · P pen · N card · L connect · F fit');wrap.appendChild(help)}if(!document.getElementById('brain110Editing')){const layer=document.createElement('div');layer.id='brain110Editing';layer.className='brain110-editing';document.getElementById('brain107CanvasShell').appendChild(layer)}brain110SetStatus(brain110RealtimeStatus)};
function brain110BindKeys(){if(brain110KeysBound)return;brain110KeysBound=true;window.addEventListener('keydown',e=>{if(!window.brain108RoomId)return;const tag=e.target?.tagName?.toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select'||e.metaKey||e.ctrlKey||e.altKey)return;if(e.key==='Escape'){brain109ConnectStart=null;brain109CloseMenus();brain110CloseEdit();brain109SetTool('select');return}const k=e.key.toLowerCase();if(k==='v')brain109SetTool('select');else if(k==='h')brain109SetTool('hand');else if(k==='p'&&brain109Editable())brain109SetTool('pen');else if(k==='n'&&brain109Editable())brain107ToggleCompose(true);else if(k==='l'&&brain109Editable())brain109BeginConnector('line');else if(k==='f')brain107Fit()})}brain110BindKeys();
const brain108OpenRoomBaseV110=brain108OpenRoom;brain108OpenRoom=async function(roomId){await brain108OpenRoomBaseV110(roomId);if(!window.brain108RoomId)return;clearInterval(brain107Timer);brain107Timer=setInterval(()=>brain109FetchCanvas(),15000);clearInterval(brain107PresenceTimer);brain107PresenceTimer=setInterval(()=>brain108PresencePing(),10000);await brain110Connect(roomId)};
const brain108CloseCanvasBaseV110=brain108CloseCanvas;brain108CloseCanvas=function(){brain110Disconnect();brain110CloseEdit();return brain108CloseCanvasBaseV110()};


/* --- source script: tasky-v111-brainstorm-history-js --- */

window.TASKY_BUILD='V111';console.info('Tasky build',window.TASKY_BUILD);

let brain111AutoTimer=null;
let brain111LastAutoAt=0;

function brain111L(ar,en){return lang==='ar'?ar:en}
function brain111CanManage(){
  return !!window.brain108RoomMeta?.can_manage;
}
function brain111Locked(){
  return !!window.brain108RoomMeta?.edit_locked;
}
function brain111CanEdit(){
  return window.brain108RoomMeta?.status==='active'
    && !!window.brain108RoomMeta?.can_edit
    && !brain111Locked();
}

/* V111 is the final edit authority for standalone rooms. */
brain109Editable=brain111CanEdit;
brain108Editable=brain111CanEdit;

async function brain111CreateSnapshot(kind='manual'){
  if(!window.brain108RoomId||!brain111CanManage())return;
  const {data,error}=await sb.rpc('tasky_brainstorm_snapshot_create_v111',{
    p_room_id:window.brain108RoomId,p_kind:kind
  });
  if(error){
    if(kind==='manual')showTaskyDialog({title:brain111L('تعذّر حفظ نسخة','Could not save version'),message:error.message,tone:'error'});
    else console.warn('V111 auto snapshot',error);
    return;
  }
  if(kind==='manual'){
    taskyToast(data?.created===false?brain111L('لا توجد تغييرات جديدة لحفظها','No new changes to save'):brain111L('تم حفظ نسخة من اللوحة','Board version saved'),{tone:'success'});
  }
}
async function brain111ToggleLock(){
  if(!window.brain108RoomId||!brain111CanManage())return;
  const target=!brain111Locked();
  const {error}=await sb.rpc('tasky_brainstorm_room_set_lock_v111',{
    p_room_id:window.brain108RoomId,p_locked:target
  });
  if(error)return showTaskyDialog({title:brain111L('تعذّر تحديث القفل','Could not update board lock'),message:error.message,tone:'error'});
  await brain109FetchCanvas();
  brain108RenderCanvasShell(window.brain108RoomMeta||{});
  brain110Connect(window.brain108RoomId);
  taskyToast(target?brain111L('تم قفل التعديل','Editing locked'):brain111L('تم فتح التعديل','Editing unlocked'),{tone:'success'});
}
async function brain111OpenHistory(){
  if(!window.brain108RoomId)return;
  const {data,error}=await sb.rpc('tasky_brainstorm_snapshot_list_v111',{p_room_id:window.brain108RoomId});
  if(error)return showTaskyDialog({title:brain111L('تعذّر تحميل السجل','Could not load version history'),message:error.message,tone:'error'});
  const rows=Array.isArray(data)?data:[];
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${brain111L('سجل نسخ اللوحة','Board version history')}</h3><div class="subtle">${brain111L('يمكن لمدير الغرفة حفظ نسخة واستعادة حالة سابقة. الاستعادة لا تحذف النسخة الحالية؛ يحفظ تاسكي نسخة أمان قبل الاستعادة.','Room managers can save and restore earlier board states. Restore does not discard the current state; Tasky saves a safety version first.')}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
  <div class="brain111-version-meta">${brain111L('النسخ تشمل البطاقات، مواضعها، الرسم، الأشكال، الخطوط والأسهم. مؤشرات الحضور لا تدخل في النسخ.','Versions include cards, positions, drawings, shapes, lines and arrows. Live presence is not versioned.')}</div>
  ${brain111CanManage()?`<div style="margin-top:9px"><button class="primary-btn" onclick="brain111SaveAndReloadHistory()">${brain111L('حفظ نسخة الآن','Save version now')}</button></div>`:''}
  <div class="brain111-history">${rows.length?rows.map(s=>`<div class="brain111-snapshot"><div><b>${escapeHtml(s.label||brain111L('نسخة محفوظة','Saved version'))}</b><small>${escapeHtml(new Date(s.created_at).toLocaleString(lang==='ar'?'ar-SA':'en-US'))} · ${escapeHtml(s.created_by_name||'')}</small></div><div class="brain111-snapshot-actions">${brain111CanManage()?`<button class="chip-btn" onclick="brain111Restore('${s.id}')">${brain111L('استعادة','Restore')}</button>`:''}</div></div>`).join(''):`<div class="meet101-empty">${brain111L('لا توجد نسخ محفوظة حتى الآن.','No saved versions yet.')}</div>`}</div>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
}
async function brain111SaveAndReloadHistory(){
  await brain111CreateSnapshot('manual');
  await brain111OpenHistory();
}
async function brain111Restore(snapshotId){
  if(!brain111CanManage())return;
  const ok=await taskyConfirm(
    brain111L('استعادة هذه النسخة؟ سيحفظ تاسكي نسخة أمان من الحالة الحالية أولًا.','Restore this version? Tasky will save a safety copy of the current state first.'),
    {title:brain111L('استعادة نسخة','Restore version'),confirmText:brain111L('استعادة','Restore')}
  );
  if(!ok)return;
  const {error}=await sb.rpc('tasky_brainstorm_snapshot_restore_v111',{
    p_room_id:window.brain108RoomId,p_snapshot_id:snapshotId
  });
  if(error)return showTaskyDialog({title:brain111L('تعذّرت الاستعادة','Could not restore version'),message:error.message,tone:'error'});
  closeAddModal();
  await brain109FetchCanvas();
  brain107Fit();
  taskyToast(brain111L('تمت استعادة النسخة','Version restored'),{tone:'success'});
}
async function brain111DuplicateRoom(){
  if(!window.brain108RoomId||!brain111CanManage())return;
  const {data,error}=await sb.rpc('tasky_brainstorm_room_duplicate_v111',{p_room_id:window.brain108RoomId});
  if(error)return showTaskyDialog({title:brain111L('تعذّر تكرار الغرفة','Could not duplicate room'),message:error.message,tone:'error'});
  taskyToast(brain111L('تم إنشاء نسخة مستقلة من الغرفة','A duplicate room was created'),{tone:'success'});
  if(data?.id){
    brain108CloseCanvas();
    await brain108FetchRooms();
    if(activeNav==='meetings'&&meetingsSectionV10622==='brainstorm')renderModule();
    setTimeout(()=>brain108OpenRoom(data.id),80);
  }
}

/* Toolbar injection after V109 shell render. */
const brain108RenderCanvasShellBaseV111=brain108RenderCanvasShell;
brain108RenderCanvasShell=function(room){
  brain108RenderCanvasShellBaseV111(room);

  const actions=document.querySelector('#brain107CanvasShell .brain107-top-actions');
  if(actions){
    const closeBtn=actions.lastElementChild;
    if(!document.getElementById('brain111HistoryBtn')){
      const h=document.createElement('button');
      h.id='brain111HistoryBtn';h.type='button';h.textContent=brain111L('السجل','History');
      h.onclick=brain111OpenHistory;
      actions.insertBefore(h,closeBtn);
    }
    if(brain111CanManage()&&!document.getElementById('brain111LockBtn')){
      const l=document.createElement('button');
      l.id='brain111LockBtn';l.type='button';l.className='brain111-toolbar-btn'+(brain111Locked()?' locked':'');
      l.textContent=brain111Locked()?brain111L('فتح التعديل','Unlock'):brain111L('قفل التعديل','Lock');
      l.onclick=brain111ToggleLock;
      actions.insertBefore(l,closeBtn);
    }
    if(brain111CanManage()&&!document.getElementById('brain111DuplicateBtn')){
      const d=document.createElement('button');
      d.id='brain111DuplicateBtn';d.type='button';d.textContent=brain111L('تكرار','Duplicate');
      d.onclick=brain111DuplicateRoom;
      actions.insertBefore(d,closeBtn);
    }
  }

  if(brain111Locked()){
    const wrap=document.getElementById('brain107StageWrap');
    if(wrap&&!document.getElementById('brain111LockNote')){
      const n=document.createElement('div');
      n.id='brain111LockNote';n.className='brain111-lock-note';
      n.textContent=brain111L('التعديل مقفل مؤقتًا بواسطة مدير الغرفة','Editing is temporarily locked by the room manager');
      wrap.appendChild(n);
    }
  }
};

/* Auto-version only when the manager is actively inside an editable room.
   Server-side fingerprinting prevents duplicate snapshots with no changes. */
function brain111StartAuto(){
  clearInterval(brain111AutoTimer);
  brain111AutoTimer=setInterval(()=>{
    if(window.brain108RoomId&&brain111CanManage()&&brain111CanEdit()){
      brain111CreateSnapshot('auto');
    }
  },10*60*1000);
}
brain111StartAuto();

const brain108OpenRoomBaseV111=brain108OpenRoom;
brain108OpenRoom=async function(roomId){
  await brain108OpenRoomBaseV111(roomId);
  if(window.brain108RoomId&&brain111CanManage()){
    setTimeout(()=>brain111CreateSnapshot('auto'),1200);
  }
};

const brain108CloseCanvasBaseV111=brain108CloseCanvas;
brain108CloseCanvas=function(){
  return brain108CloseCanvasBaseV111();
};


/* --- source script: tasky-v112-brainstorm-actions-js --- */

window.TASKY_BUILD='V112';console.info('Tasky build',window.TASKY_BUILD);

let brain112Selected=new Set();
let brain112Busy=false;

function brain112L(ar,en){return lang==='ar'?ar:en}
function brain112Room(){return window.brain108RoomMeta||{}}
function brain112ClosePanel(){document.getElementById('brain112Actions')?.classList.remove('show')}
function brain112TogglePanel(){document.getElementById('brain112Actions')?.classList.toggle('show')}
function brain112SelectableCards(){return brain107Objects.filter(o=>['idea','update','question','decision'].includes(o.kind))}
function brain112ToggleSelect(id){
  if(brain112Selected.has(id))brain112Selected.delete(id);else brain112Selected.add(id);
  brain109RenderCards();
  brain112RenderSelectionBar();
}
function brain112ClearSelection(){brain112Selected.clear();brain109RenderCards();brain112RenderSelectionBar()}
function brain112RenderSelectionBar(){
  const el=document.getElementById('brain112Selection');if(!el)return;
  const n=brain112Selected.size;
  el.classList.toggle('show',n>0);
  el.innerHTML=n?`<span>${n} ${brain112L('بطاقة محددة','selected')}</span><button type="button" onclick="brain112OpenTaskConversion()">${brain112L('تحويل إلى مهام','Convert to tasks')}</button><button type="button" onclick="brain112ClearSelection()">${brain112L('إلغاء التحديد','Clear')}</button>`:'';
}

/* Enhance card footer without changing the V111 permission model. */
const brain109RenderCardsBaseV112=brain109RenderCards;
brain109RenderCards=function(){
  brain109RenderCardsBaseV112();
  const editable=brain109Editable();
  for(const card of document.querySelectorAll('#brain107Cards .brain107-card')){
    const id=card.dataset.id;
    card.classList.toggle('brain112-selected',brain112Selected.has(id));
    const foot=card.querySelector('.brain107-card-foot .actions');
    if(foot&&!foot.querySelector('[data-brain112-select]')){
      const b=document.createElement('button');
      b.type='button';b.dataset.brain112Select='1';
      b.textContent=brain112Selected.has(id)?brain112L('إلغاء التحديد','Unselect'):brain112L('تحديد','Select');
      b.onclick=e=>{e.stopPropagation();brain112ToggleSelect(id)};
      foot.insertBefore(b,foot.firstChild);
    }
  }
  brain112RenderSelectionBar();
};

function brain112BuildReport(){
  const room=brain112Room();
  const rows=brain112SelectableCards();
  const counts={idea:0,update:0,question:0,decision:0};
  rows.forEach(r=>{counts[r.kind]=(counts[r.kind]||0)+1});
  const report=document.createElement('div');
  report.className='brain112-report';report.id='brain112Report';
  report.dir=lang==='ar'?'rtl':'ltr';
  report.innerHTML=`<h1>${escapeHtml(room.title||brain112L('غرفة العصف الذهني','Brainstorm Room'))}</h1>
  <div class="meta">${escapeHtml(room.meeting_title||brain112L('غرفة مستقلة','Independent room'))} · ${escapeHtml(new Date().toLocaleString(lang==='ar'?'ar-SA':'en-US'))}</div>
  <div class="summary">
    <div><span>${brain112L('أفكار','Ideas')}</span><b>${counts.idea}</b></div>
    <div><span>${brain112L('تحديثات','Updates')}</span><b>${counts.update}</b></div>
    <div><span>${brain112L('أسئلة','Questions')}</span><b>${counts.question}</b></div>
    <div><span>${brain112L('قرارات','Decisions')}</span><b>${counts.decision}</b></div>
  </div>
  <div class="cards">${rows.map(o=>`<div class="card"><small>${escapeHtml(brain107KindLabel(o.kind))} · ${brain112L('تصويت','Votes')}: ${Number(o.vote_count||0)} · ${escapeHtml(o.author_name||'')}</small><p>${escapeHtml(o.body)}</p></div>`).join('')}</div>`;
  document.body.appendChild(report);return report;
}
function brain112DownloadText(){
  const room=brain112Room(),rows=brain112SelectableCards();
  const lines=[room.title||brain112L('غرفة العصف الذهني','Brainstorm Room'),''];
  for(const kind of ['idea','update','question','decision']){
    const group=rows.filter(x=>x.kind===kind);
    if(!group.length)continue;
    lines.push(`## ${brain107KindLabel(kind)}`);
    group.sort((a,b)=>Number(b.vote_count||0)-Number(a.vote_count||0)).forEach(o=>lines.push(`- ${o.body} (${brain112L('تصويت','Votes')}: ${Number(o.vote_count||0)})`));
    lines.push('');
  }
  const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`Tasky-Brainstorm-${String(room.title||'room').replace(/[^\p{L}\p{N}\-_]+/gu,'-').slice(0,60)}.txt`;
  a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function brain112ExportPdf(btn){
  if(brain112Busy)return;brain112Busy=true;if(btn)btn.disabled=true;
  let report=null;
  try{
    if(typeof meetingV1051EnsurePdfLibs==='function')await meetingV1051EnsurePdfLibs();
    else throw new Error(brain112L('مكتبة PDF غير متوفرة','PDF library is unavailable'));
    report=brain112BuildReport();
    const canvas=await html2canvas(report,{scale:1.7,backgroundColor:'#ffffff',useCORS:true,logging:false});
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({orientation:'p',unit:'mm',format:'a4'});
    const margin=10,usableW=190,pxPerMm=canvas.width/usableW,pagePx=Math.floor((297-margin*2)*pxPerMm);
    let y=0,page=0;
    while(y<canvas.height){
      const h=Math.min(pagePx,canvas.height-y),slice=document.createElement('canvas');
      slice.width=canvas.width;slice.height=h;slice.getContext('2d').drawImage(canvas,0,y,canvas.width,h,0,0,canvas.width,h);
      if(page++)pdf.addPage();
      pdf.addImage(slice.toDataURL('image/jpeg',.93),'JPEG',margin,margin,usableW,h/pxPerMm);
      y+=h;
    }
    const room=brain112Room();
    pdf.save(`Tasky-Brainstorm-${String(room.title||'room').replace(/[^\p{L}\p{N}\-_]+/gu,'-').slice(0,60)}.pdf`);
  }catch(e){
    showTaskyDialog({title:brain112L('تعذّر تصدير PDF','Could not export PDF'),message:e.message||String(e),tone:'error'});
  }finally{
    report?.remove();brain112Busy=false;if(btn)btn.disabled=false;
  }
}
async function brain112ExportCanvasPng(btn){
  if(brain112Busy)return;brain112Busy=true;if(btn)btn.disabled=true;
  try{
    if(typeof meetingV1051EnsurePdfLibs==='function')await meetingV1051EnsurePdfLibs();
    const stage=document.getElementById('brain107Stage');if(!stage)throw new Error('Canvas not found');
    const old=stage.style.transform;stage.style.transform='none';
    const canvas=await html2canvas(stage,{scale:1,backgroundColor:'#f4f5f2',useCORS:true,logging:false,width:4000,height:3000});
    stage.style.transform=old;
    const a=document.createElement('a');a.href=canvas.toDataURL('image/png');
    a.download=`Tasky-Brainstorm-Canvas-${String(brain112Room().title||'room').replace(/[^\p{L}\p{N}\-_]+/gu,'-').slice(0,50)}.png`;a.click();
  }catch(e){
    showTaskyDialog({title:brain112L('تعذّر تصدير صورة اللوحة','Could not export canvas image'),message:e.message||String(e),tone:'error'});
  }finally{brain112Busy=false;if(btn)btn.disabled=false}
}

function brain112OpenTaskConversion(){
  const selected=[...brain112Selected].map(id=>brain107Objects.find(o=>o.id===id)).filter(Boolean);
  if(!selected.length)return;
  const allowed=projects.filter(p=>canCreateTaskInProject(p.id));
  if(!allowed.length)return showTaskyDialog({title:brain112L('لا يوجد مشروع متاح','No available project'),message:brain112L('أنشئ مشروعًا أو اطلب صلاحية إنشاء مهام في مشروع أولًا.','Create a project or request task-creation permission first.'),tone:'warning'});
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${brain112L('تحويل البطاقات إلى مهام','Convert cards to tasks')}</h3><div class="subtle">${brain112L('سيتم إنشاء مهمة مستقلة لكل بطاقة محددة مع حفظ رابط مرجعي للغرفة والبطاقة.','A separate task will be created for each selected card, with a reference back to the room and card.')}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
  <form class="brain112-task-form" onsubmit="brain112CreateTasks(event)">
    <div class="full"><label>${brain112L('المشروع','Project')}</label><select id="brain112Project" required>${allowed.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></div>
    <div><label>${brain112L('الأولوية','Priority')}</label><select id="brain112Priority"><option value="medium">${brain112L('متوسطة','Medium')}</option><option value="high">${brain112L('عالية','High')}</option><option value="low">${brain112L('منخفضة','Low')}</option></select></div>
    <div><label>${brain112L('تاريخ الاستحقاق — اختياري','Due date — optional')}</label><input id="brain112Due" type="date"></div>
    <div class="full"><label>${brain112L('البطاقات','Cards')}</label><div class="brain112-conversion-note">${selected.map(x=>escapeHtml(x.body)).join('<br>')}</div></div>
    <div class="full" style="display:flex;gap:7px;justify-content:flex-end"><button class="chip-btn" type="button" onclick="closeAddModal()">${brain112L('إلغاء','Cancel')}</button><button class="primary-btn" type="submit">${brain112L('إنشاء المهام','Create tasks')}</button></div>
  </form>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
}
async function brain112CreateTasks(e){
  e.preventDefault();
  if(brain112Busy)return;brain112Busy=true;
  const btn=e.submitter;if(btn)btn.disabled=true;
  const projectId=document.getElementById('brain112Project').value;
  const priority=document.getElementById('brain112Priority').value;
  const due=document.getElementById('brain112Due').value||null;
  const selected=[...brain112Selected].map(id=>brain107Objects.find(o=>o.id===id)).filter(Boolean);
  const created=[],failed=[];
  for(const card of selected){
    const title=String(card.body||'').replace(/\s+/g,' ').trim().slice(0,180);
    const {data,error}=await sb.rpc('tasky_work_create_task_v88',{
      p_workspace_id:currentWorkspaceId,p_project_id:projectId,p_title:title,
      p_tag:'Brainstorm',p_priority:priority,p_cost:0,p_start_date:null,p_due_date:due,p_assignee_ids:[]
    });
    if(error){failed.push({card,error:error.message});continue}
    created.push({card,taskId:data?.id});
    if(data?.id){
      const link=await sb.rpc('tasky_brainstorm_action_link_v112',{
        p_room_id:window.brain108RoomId,p_object_id:card.id,p_action_type:'task',p_target_id:data.id
      });
      if(link.error)console.warn('V112 action link',link.error);
    }
  }
  brain112Busy=false;if(btn)btn.disabled=false;
  if(created.length){await fetchTasks();brain112ClearSelection();closeAddModal();taskyToast(brain112L(`تم إنشاء ${created.length} مهمة`,`Created ${created.length} task(s)`),{tone:'success'})}
  if(failed.length)showTaskyDialog({title:brain112L('بعض المهام لم تُنشأ','Some tasks were not created'),message:failed.map(x=>x.error).join('\n'),tone:'warning'});
}
async function brain112CreateProjectFromRoom(){
  const room=brain112Room();
  const name=String(room.title||brain112L('مشروع من العصف الذهني','Brainstorm project')).slice(0,120);
  const ok=await taskyConfirm(brain112L(`إنشاء مشروع جديد باسم "${name}"؟`,`Create a new project named "${name}"?`),{title:brain112L('إنشاء مشروع من الغرفة','Create project from room'),confirmText:brain112L('إنشاء','Create')});
  if(!ok)return;
  const pos=projects.length?Math.max(...projects.map(p=>Number(p.position)||0))+1:0;
  const {data,error}=await sb.rpc('tasky_work_create_project_v88',{p_workspace_id:currentWorkspaceId,p_name:name,p_description:room.description||null,p_position:pos});
  if(error)return showTaskyDialog({title:brain112L('تعذّر إنشاء المشروع','Could not create project'),message:error.message,tone:'error'});
  if(data?.id)await sb.rpc('tasky_brainstorm_action_link_v112',{p_room_id:window.brain108RoomId,p_object_id:null,p_action_type:'project',p_target_id:data.id});
  await Promise.all([fetchProjects(),fetchProjectMemberships()]);renderNav();
  taskyToast(brain112L('تم إنشاء المشروع وربطه بالغرفة','Project created and linked to the room'),{tone:'success'});
}

/* Add toolbar action panel and selection layer after shell rendering. */
const brain108RenderCanvasShellBaseV112=brain108RenderCanvasShell;
brain108RenderCanvasShell=function(room){
  brain108RenderCanvasShellBaseV112(room);
  const actions=document.querySelector('#brain107CanvasShell .brain107-top-actions');
  if(actions&&!document.getElementById('brain112ActionsBtn')){
    const b=document.createElement('button');b.id='brain112ActionsBtn';b.type='button';
    b.textContent=brain112L('إجراءات','Actions');b.onclick=brain112TogglePanel;
    actions.insertBefore(b,actions.lastElementChild);
  }
  const shell=document.getElementById('brain107CanvasShell');
  if(shell&&!document.getElementById('brain112Actions')){
    const panel=document.createElement('div');panel.id='brain112Actions';panel.className='brain112-actions-panel';
    panel.innerHTML=`<h3>${brain112L('إجراءات الغرفة','Room actions')}</h3><p>${brain112L('صدّر محتوى الغرفة أو حوّل الأفكار المختارة إلى عمل تنفيذي داخل تاسكي.','Export the room or turn selected ideas into executable work in Tasky.')}</p>
      <div class="brain112-export-grid"><button type="button" onclick="brain112ExportPdf(this)">${brain112L('تقرير PDF','PDF report')}</button><button type="button" onclick="brain112ExportCanvasPng(this)">${brain112L('صورة اللوحة PNG','Canvas PNG')}</button><button type="button" onclick="brain112DownloadText()">${brain112L('تصدير نص','Text export')}</button><button type="button" onclick="brain112CreateProjectFromRoom()">${brain112L('إنشاء مشروع','Create project')}</button></div>
      <div class="brain112-divider"></div><p>${brain112L('لتكوين مهام: اضغط «تحديد» على البطاقات المطلوبة ثم اختر «تحويل إلى مهام».','To create tasks: select the desired cards, then choose Convert to tasks.')}</p>`;
    shell.appendChild(panel);
  }
  const wrap=document.getElementById('brain107StageWrap');
  if(wrap&&!document.getElementById('brain112Selection')){
    const bar=document.createElement('div');bar.id='brain112Selection';bar.className='brain112-selection-bar';wrap.appendChild(bar);
  }
  brain112RenderSelectionBar();
};

/* Keep selection scoped to the current room. */
const brain108OpenRoomBaseV112=brain108OpenRoom;
brain108OpenRoom=async function(roomId){brain112Selected.clear();return brain108OpenRoomBaseV112(roomId)};
const brain108CloseCanvasBaseV112=brain108CloseCanvas;
brain108CloseCanvas=function(){brain112Selected.clear();brain112ClosePanel();return brain108CloseCanvasBaseV112()};


/* --- source script: tasky-v120-brainstorm-powerpack-js --- */

window.TASKY_BUILD='V120';console.info('Tasky build',window.TASKY_BUILD);

let brain120Frames=[];
let brain120Selected=new Set();
let brain120Clipboard=[];
let brain120Undo=[];
let brain120Redo=[];
let brain120Snap=true;
let brain120SelectBox=null;
let brain120TimerState=null;
let brain120Facilitator=false;
let brain120Filter='';
let brain120FilterKind='';
let brain120LastMutation=0;
let brain120FrameDrag=null;

function brain120L(ar,en){return lang==='ar'?ar:en}
function brain120Panel(id){
  for(const el of document.querySelectorAll('.brain120-panel'))if(el.id!==id)el.classList.remove('show');
  document.getElementById(id)?.classList.toggle('show');
}
function brain120ClosePanels(){document.querySelectorAll('.brain120-panel').forEach(x=>x.classList.remove('show'))}
function brain120PushUndo(action){
  brain120Undo.push(action);if(brain120Undo.length>80)brain120Undo.shift();brain120Redo=[];
}
function brain120CurrentRoomId(){return window.brain108RoomId}
function brain120CanEdit(){return brain111CanEdit?brain111CanEdit():brain109Editable()}

function brain120TemplatePanelHtml(){
  const t=[
    ['blank',brain120L('لوحة فارغة','Blank canvas')],
    ['swot','SWOT'],
    ['mindmap',brain120L('خريطة ذهنية','Mind map')],
    ['retro',brain120L('مراجعة الفريق','Retrospective')],
    ['fivewhy','5 Whys'],
    ['impact','Impact / Effort'],
    ['journey','Customer Journey'],
    ['design','Design Thinking']
  ];
  return `<h3>${brain120L('قوالب الغرفة','Room templates')}</h3><p>${brain120L('يضيف القالب إطارات وعناوين قابلة للتعديل داخل اللوحة الحالية.','Templates add editable frames and headings to the current canvas.')}</p><div class="brain120-grid">${t.map(x=>`<button type="button" onclick="brain120ApplyTemplate('${x[0]}')">${escapeHtml(x[1])}</button>`).join('')}</div>`;
}
async function brain120ApplyTemplate(type){
  if(!brain120CanEdit())return;
  brain120ClosePanels();
  const {error}=await sb.rpc('tasky_brainstorm_template_apply_v120',{p_room_id:brain120CurrentRoomId(),p_template:type});
  if(error)return showTaskyDialog({title:brain120L('تعذّر تطبيق القالب','Could not apply template'),message:error.message,tone:'error'});
  brain120PushUndo({kind:'snapshot_hint'});
  await brain109FetchCanvas();brain107Fit();
}

function brain120RenderFrames(){
  const host=document.getElementById('brain120Frames');if(!host)return;
  host.innerHTML=brain120Frames.map(f=>`<div class="brain120-frame ${brain120Selected.has(f.id)?'brain120-selected':''}" data-frame-id="${f.id}" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px"><span class="brain120-frame-title">${escapeHtml(f.title)}</span></div>`).join('');
}
function brain120RenderMiniMap(){
  const el=document.getElementById('brain120MiniMap');if(!el)return;
  const wrap=document.getElementById('brain107StageWrap');if(!wrap)return;
  const r=wrap.getBoundingClientRect();
  const viewX=Math.max(0,-brain107Tx/brain107Scale),viewY=Math.max(0,-brain107Ty/brain107Scale);
  const viewW=r.width/brain107Scale,viewH=r.height/brain107Scale;
  el.innerHTML=`<svg viewBox="0 0 4000 3000" preserveAspectRatio="none">
    ${brain120Frames.map(f=>`<rect class="brain120-mini-frame" x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}"/>`).join('')}
    ${brain107Objects.map(o=>`<rect class="brain120-mini-node" x="${o.x}" y="${o.y}" width="230" height="140" rx="12"/>`).join('')}
    ${brain109Shapes.map(s=>`<rect class="brain120-mini-node" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="10"/>`).join('')}
    <rect class="brain120-mini-view" x="${viewX}" y="${viewY}" width="${viewW}" height="${viewH}"/>
  </svg>`;
}
function brain120RenderSelection(){
  document.querySelectorAll('#brain107Cards .brain107-card').forEach(el=>el.classList.toggle('brain120-selected',brain120Selected.has(el.dataset.id)));
  document.querySelectorAll('#brain109Shapes .brain109-shape').forEach(el=>el.classList.toggle('brain120-selected',brain120Selected.has(el.dataset.shapeId)));
  document.querySelectorAll('#brain120Frames .brain120-frame').forEach(el=>el.classList.toggle('brain120-selected',brain120Selected.has(el.dataset.frameId)));
}
function brain120ApplyFilter(){
  const q=(brain120Filter||'').trim().toLowerCase();
  document.querySelectorAll('#brain107Cards .brain107-card').forEach(el=>{
    const o=brain107Objects.find(x=>x.id===el.dataset.id);
    const ok=!o?true:(!q||String(o.body||'').toLowerCase().includes(q)||String(o.author_name||'').toLowerCase().includes(q))&&(!brain120FilterKind||o.kind===brain120FilterKind);
    el.classList.toggle('brain120-hidden',!ok);
  });
}
const brain109RenderDataBaseV120=brain109RenderData;
brain109RenderData=function(){
  brain109RenderDataBaseV120();
  brain120RenderFrames();brain120RenderSelection();brain120RenderMiniMap();brain120ApplyFilter();
};

function brain120SnapValue(v){return brain120Snap?Math.round(v/24)*24:v}
function brain120ToggleSnap(){brain120Snap=!brain120Snap;taskyToast(brain120Snap?brain120L('تم تفعيل المحاذاة للشبكة','Snap enabled'):brain120L('تم إيقاف المحاذاة للشبكة','Snap disabled'),{tone:'success'})}

function brain120ClearSelection(){brain120Selected.clear();brain120RenderSelection()}
function brain120ToggleSelect(id,append=false){
  if(!append)brain120Selected.clear();
  if(brain120Selected.has(id))brain120Selected.delete(id);else brain120Selected.add(id);
  brain120RenderSelection();
}
function brain120Copy(){
  const items=[];
  for(const id of brain120Selected){
    const o=brain107Objects.find(x=>x.id===id);if(o)items.push({type:'card',data:{kind:o.kind,body:o.body,x:o.x,y:o.y}});
    const s=brain109Shapes.find(x=>x.id===id);if(s)items.push({type:'shape',data:{shape_type:s.shape_type,x:s.x,y:s.y,w:s.w,h:s.h}});
  }
  brain120Clipboard=items;taskyToast(brain120L(`تم نسخ ${items.length} عنصر`,`Copied ${items.length} item(s)`),{tone:'success'});
}
async function brain120Paste(){
  if(!brain120CanEdit()||!brain120Clipboard.length)return;
  const {error}=await sb.rpc('tasky_brainstorm_clipboard_paste_v120',{p_room_id:brain120CurrentRoomId(),p_items:brain120Clipboard});
  if(error)return taskyToast(error.message,{tone:'warning'});
  await brain109FetchCanvas();
}
async function brain120DuplicateSelection(){brain120Copy();await brain120Paste()}

async function brain120AddFrame(){
  if(!brain120CanEdit())return;
  const title=await taskyPrompt(brain120L('اسم الإطار','Frame title'),{title:brain120L('إطار جديد','New frame'),placeholder:brain120L('مثال: الحلول المقترحة','Example: Proposed solutions')});
  if(!title)return;
  const wrap=document.getElementById('brain107StageWrap'),r=wrap.getBoundingClientRect(),c=brain107ScreenToCanvas(r.left+r.width/2,r.top+r.height/2);
  const {error}=await sb.rpc('tasky_brainstorm_frame_add_v120',{p_room_id:brain120CurrentRoomId(),p_title:title,p_x:Math.round(c.x-350),p_y:Math.round(c.y-220),p_w:700,p_h:440});
  if(error)return taskyToast(error.message,{tone:'warning'});
  await brain109FetchCanvas();
}

async function brain120MindChild(parentId){
  if(!brain120CanEdit())return;
  const text=await taskyPrompt(brain120L('الفكرة الفرعية','Child idea'),{title:brain120L('فرع جديد','New branch')});if(!text)return;
  const p=brain107Objects.find(x=>x.id===parentId);if(!p)return;
  const {error}=await sb.rpc('tasky_brainstorm_mind_child_v120',{p_room_id:brain120CurrentRoomId(),p_parent_id:parentId,p_body:text});
  if(error)return taskyToast(error.message,{tone:'warning'});
  await brain109FetchCanvas();
}

/* Comments */
async function brain120OpenComments(objectId){
  const {data,error}=await sb.rpc('tasky_brainstorm_comment_list_v120',{p_room_id:brain120CurrentRoomId(),p_object_id:objectId});
  if(error)return taskyToast(error.message,{tone:'warning'});
  const rows=Array.isArray(data)?data:[];
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${brain120L('مناقشة الفكرة','Idea discussion')}</h3></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
  <div class="brain120-comment-list">${rows.length?rows.map(c=>`<div class="brain120-comment"><b>${escapeHtml(c.author_name||'')}</b><p>${escapeHtml(c.body)}</p><small>${escapeHtml(new Date(c.created_at).toLocaleString(lang==='ar'?'ar-SA':'en-US'))}</small></div>`).join(''):`<div class="meet101-empty">${brain120L('لا توجد تعليقات بعد','No comments yet')}</div>`}</div>
  <div style="margin-top:9px"><textarea id="brain120CommentBody" maxlength="1200" style="width:100%;min-height:85px;border:1px solid var(--border);border-radius:9px;padding:9px" placeholder="${brain120L('اكتب تعليقًا… ويمكنك استخدام @ للاسم','Write a comment… you can use @name')}"></textarea></div>
  <div style="display:flex;justify-content:flex-end;margin-top:7px"><button class="primary-btn" onclick="brain120AddComment('${objectId}')">${brain120L('إضافة تعليق','Add comment')}</button></div>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
}
async function brain120AddComment(objectId){
  const body=document.getElementById('brain120CommentBody')?.value.trim()||'';if(!body)return;
  const {error}=await sb.rpc('tasky_brainstorm_comment_add_v120',{p_room_id:brain120CurrentRoomId(),p_object_id:objectId,p_body:body});
  if(error)return taskyToast(error.message,{tone:'warning'});
  await brain120OpenComments(objectId);
}

/* Voting session */
async function brain120StartVote(){
  if(!brain111CanManage())return;
  const raw=await taskyPrompt(brain120L('عدد الأصوات لكل مشارك','Votes per participant'),{title:brain120L('بدء جولة تصويت','Start voting session'),placeholder:'5'});if(!raw)return;
  const n=Math.max(1,Math.min(20,parseInt(raw,10)||5));
  const {error}=await sb.rpc('tasky_brainstorm_vote_session_start_v120',{p_room_id:brain120CurrentRoomId(),p_votes_per_user:n,p_hide_results:true});
  if(error)return taskyToast(error.message,{tone:'warning'});
  await brain109FetchCanvas();
}
async function brain120EndVote(){
  if(!brain111CanManage())return;
  const {error}=await sb.rpc('tasky_brainstorm_vote_session_end_v120',{p_room_id:brain120CurrentRoomId()});
  if(error)return taskyToast(error.message,{tone:'warning'});
  await brain109FetchCanvas();
}

/* Timer */
function brain120StartTimer(minutes=5){
  if(!brain111CanManage())return;
  brain120TimerState={ends:Date.now()+minutes*60000,label:brain120L('جلسة عصف ذهني','Brainstorm session')};
  brain120RenderTimer();
  if(brain110Channel)brain110Channel.send({type:'broadcast',event:'timer',payload:brain120TimerState}).catch?.(()=>{});
}
function brain120RenderTimer(){
  const el=document.getElementById('brain120Timer');if(!el)return;
  if(!brain120TimerState){el.classList.remove('show');return}
  const left=Math.max(0,brain120TimerState.ends-Date.now()),m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);
  el.textContent=`${brain120TimerState.label} · ${m}:${String(s).padStart(2,'0')}`;el.classList.add('show');
  if(left<=0){brain120TimerState=null;el.textContent=brain120L('انتهى الوقت','Time is up');setTimeout(()=>el.classList.remove('show'),4000)}
}
setInterval(brain120RenderTimer,1000);

/* Facilitator / Follow-me */
function brain120BroadcastView(){
  if(!brain110Channel||!brain111CanManage())return;
  brain110Channel.send({type:'broadcast',event:'viewport',payload:{tx:brain107Tx,ty:brain107Ty,scale:brain107Scale}}).catch?.(()=>{});
  taskyToast(brain120L('تم إرسال موضع اللوحة للجميع','Canvas view sent to everyone'),{tone:'success'});
}
function brain120ToggleFacilitator(){brain120Facilitator=!brain120Facilitator;taskyToast(brain120Facilitator?brain120L('وضع الميسّر مفعل','Facilitator mode enabled'):brain120L('وضع الميسّر متوقف','Facilitator mode disabled'),{tone:'success'})}

/* Search / Insights */
function brain120Search(v){brain120Filter=v;brain120ApplyFilter()}
function brain120SetFilterKind(v){brain120FilterKind=v;brain120ApplyFilter()}
function brain120Insights(){
  const rows=[...brain107Objects];
  const top=[...rows].sort((a,b)=>Number(b.vote_count||0)-Number(a.vote_count||0)).slice(0,5);
  const words={};
  rows.forEach(o=>String(o.body||'').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(w=>w.length>3).forEach(w=>words[w]=(words[w]||0)+1));
  const common=Object.entries(words).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const decisions=rows.filter(x=>x.kind==='decision'),questions=rows.filter(x=>x.kind==='question');
  const html=`<h3>${brain120L('ملخص وتحليلات الجلسة','Session insights')}</h3>
    <div class="brain120-insight"><b>${brain120L('أعلى الأفكار تصويتًا','Top voted ideas')}</b><p>${top.length?top.map(x=>`${escapeHtml(x.body)} (${x.vote_count||0})`).join('<br>'):brain120L('لا يوجد تصويت بعد','No votes yet')}</p></div>
    <div class="brain120-insight"><b>${brain120L('المواضيع المتكررة','Repeated themes')}</b><p>${common.length?common.map(x=>`${escapeHtml(x[0])} · ${x[1]}`).join(' — '):brain120L('لا توجد بيانات كافية','Not enough data')}</p></div>
    <div class="brain120-insight"><b>${brain120L('القرارات','Decisions')}</b><p>${decisions.length?decisions.map(x=>escapeHtml(x.body)).join('<br>'):brain120L('لا توجد قرارات مسجلة','No decisions recorded')}</p></div>
    <div class="brain120-insight"><b>${brain120L('الأسئلة المفتوحة','Open questions')}</b><p>${questions.length?questions.map(x=>escapeHtml(x.body)).join('<br>'):brain120L('لا توجد أسئلة مفتوحة','No open questions')}</p></div>`;
  const p=document.getElementById('brain120InsightsPanel');p.innerHTML=html;p.classList.add('show');
}

/* Cross-link status from V112 */
async function brain120FetchActionLinks(){
  if(!brain120CurrentRoomId())return;
  const {data}=await sb.rpc('tasky_brainstorm_action_list_v112',{p_room_id:brain120CurrentRoomId()});
  window.brain120ActionLinks=Array.isArray(data)?data:[];
}

/* Performance: only render visible cards/shapes after threshold. */
function brain120ViewportVisible(x,y,w=230,h=140){
  if((brain107Objects.length+brain109Shapes.length)<180)return true;
  const wrap=document.getElementById('brain107StageWrap');if(!wrap)return true;
  const r=wrap.getBoundingClientRect(),vx=-brain107Tx/brain107Scale-300,vy=-brain107Ty/brain107Scale-300;
  const vw=r.width/brain107Scale+600,vh=r.height/brain107Scale+600;
  return x+w>=vx&&x<=vx+vw&&y+h>=vy&&y<=vy+vh;
}
const brain109RenderCardsBaseV120=brain109RenderCards;
brain109RenderCards=function(){
  brain109RenderCardsBaseV120();
  for(const el of document.querySelectorAll('#brain107Cards .brain107-card')){
    const o=brain107Objects.find(x=>x.id===el.dataset.id);if(!o)continue;
    if(!brain120ViewportVisible(Number(o.x),Number(o.y),230,150))el.style.display='none';
    if(!el.querySelector('[data-brain120-comment]')){
      const actions=el.querySelector('.brain107-card-foot .actions');
      if(actions){
        const c=document.createElement('button');c.type='button';c.dataset.brain120Comment='1';c.textContent=brain120L('تعليقات','Comments');c.onclick=e=>{e.stopPropagation();brain120OpenComments(o.id)};actions.insertBefore(c,actions.firstChild);
        if(o.kind==='idea'||o.kind==='question'){
          const m=document.createElement('button');m.type='button';m.textContent=brain120L('فرع','Branch');m.onclick=e=>{e.stopPropagation();brain120MindChild(o.id)};actions.insertBefore(m,actions.firstChild);
        }
      }
    }
  }
  brain120RenderSelection();brain120ApplyFilter();
};
const brain109RenderShapesBaseV120=brain109RenderShapes;
brain109RenderShapes=function(){
  brain109RenderShapesBaseV120();
  for(const el of document.querySelectorAll('#brain109Shapes .brain109-shape')){
    const s=brain109Shapes.find(x=>x.id===el.dataset.shapeId);if(s&&!brain120ViewportVisible(Number(s.x),Number(s.y),Number(s.w),Number(s.h)))el.style.display='none';
  }
  brain120RenderSelection();
};

/* State enrich */
const brain109FetchCanvasBaseV120=brain109FetchCanvas;
brain109FetchCanvas=async function(){
  if(!window.brain108RoomId)return;
  const {data,error}=await sb.rpc('tasky_brainstorm_canvas_state_v120',{p_room_id:window.brain108RoomId});
  if(error){console.warn('V120 canvas state',error);return}
  brain107Objects=Array.isArray(data?.objects)?data.objects:[];
  brain107Strokes=Array.isArray(data?.strokes)?data.strokes:[];
  brain107Presence=Array.isArray(data?.presence)?data.presence:[];
  brain109Shapes=Array.isArray(data?.shapes)?data.shapes:[];
  brain109Connectors=Array.isArray(data?.connectors)?data.connectors:[];
  brain120Frames=Array.isArray(data?.frames)?data.frames:[];
  window.brain108RoomMeta=data?.room||window.brain108RoomMeta||{};
  window.brain120VoteSession=data?.vote_session||null;
  brain109RenderData();
};

/* Toolbar + panels + minimap */
const brain108RenderCanvasShellBaseV120=brain108RenderCanvasShell;
brain108RenderCanvasShell=function(room){
  brain108RenderCanvasShellBaseV120(room);
  const wrap=document.getElementById('brain107StageWrap'),stage=document.getElementById('brain107Stage');
  if(stage&&!document.getElementById('brain120Frames')){
    const f=document.createElement('div');f.id='brain120Frames';f.style.cssText='position:absolute;inset:0;pointer-events:none';stage.insertBefore(f,document.getElementById('brain109Shapes'));
  }
  if(wrap&&!document.getElementById('brain120Hud')){
    const hud=document.createElement('div');hud.id='brain120Hud';
    hud.innerHTML=`<button class="brain120-hud-btn" onclick="brain120Panel('brain120Templates')">${brain120L('قوالب','Templates')}</button><button class="brain120-hud-btn" onclick="brain120AddFrame()">${brain120L('إطار','Frame')}</button><button class="brain120-hud-btn" onclick="brain120ToggleSnap()">${brain120L('محاذاة','Snap')}</button><button class="brain120-hud-btn" onclick="brain120Panel('brain120Tools')">${brain120L('أدوات','Tools')}</button><button class="brain120-hud-btn" onclick="brain120Insights()">${brain120L('تحليلات','Insights')}</button><input class="brain120-search" placeholder="${brain120L('بحث في اللوحة','Search canvas')}" oninput="brain120Search(this.value)">`;
    wrap.appendChild(hud);
    const timer=document.createElement('div');timer.id='brain120Timer';timer.className='brain120-timer';wrap.appendChild(timer);
    const mini=document.createElement('div');mini.id='brain120MiniMap';mini.className='brain120-minimap';mini.onclick=e=>{
      const r=mini.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*4000,y=(e.clientY-r.top)/r.height*3000,wr=wrap.getBoundingClientRect();
      brain107Tx=wr.width/2-x*brain107Scale;brain107Ty=wr.height/2-y*brain107Scale;brain107ApplyTransform();brain120RenderMiniMap();
    };wrap.appendChild(mini);
  }
  const shell=document.getElementById('brain107CanvasShell');
  if(shell&&!document.getElementById('brain120Templates')){
    const t=document.createElement('div');t.id='brain120Templates';t.className='brain120-panel';t.innerHTML=brain120TemplatePanelHtml();shell.appendChild(t);
    const tools=document.createElement('div');tools.id='brain120Tools';tools.className='brain120-panel';
    tools.innerHTML=`<h3>${brain120L('أدوات متقدمة','Advanced tools')}</h3><div class="brain120-grid">
      <button onclick="brain120Copy()">${brain120L('نسخ المحدد','Copy selected')}</button>
      <button onclick="brain120Paste()">${brain120L('لصق','Paste')}</button>
      <button onclick="brain120DuplicateSelection()">${brain120L('تكرار المحدد','Duplicate selected')}</button>
      <button onclick="brain120ClearSelection()">${brain120L('مسح التحديد','Clear selection')}</button>
      ${brain111CanManage()?`<button onclick="brain120StartVote()">${brain120L('بدء تصويت','Start vote')}</button><button onclick="brain120EndVote()">${brain120L('إنهاء التصويت','End vote')}</button><button onclick="brain120StartTimer(5)">${brain120L('مؤقت 5 دقائق','5 min timer')}</button><button onclick="brain120StartTimer(10)">${brain120L('مؤقت 10 دقائق','10 min timer')}</button><button onclick="brain120BroadcastView()">${brain120L('اجلب الجميع هنا','Bring everyone here')}</button><button onclick="brain120ToggleFacilitator()">${brain120L('وضع الميسّر','Facilitator mode')}</button>`:''}
      <button onclick="brain120SetFilterKind('decision')">${brain120L('عرض القرارات','Show decisions')}</button>
      <button onclick="brain120SetFilterKind('')">${brain120L('عرض الكل','Show all')}</button>
    </div>`;shell.appendChild(tools);
    const ins=document.createElement('div');ins.id='brain120InsightsPanel';ins.className='brain120-panel';shell.appendChild(ins);
  }
  brain120RenderFrames();brain120RenderMiniMap();brain120RenderSelection();
};

/* Input improvements: multi-select and frame dragging. */
const brain109PointerDownBaseV120=brain109PointerDown;
brain109PointerDown=function(e){
  const frame=e.target.closest?.('.brain120-frame');
  if(frame&&brain107Tool==='select'&&brain120CanEdit()){
    const f=brain120Frames.find(x=>x.id===frame.dataset.frameId);if(!f)return;
    if(e.shiftKey||e.ctrlKey||e.metaKey){brain120ToggleSelect(f.id,true);return}
    const p=brain107ScreenToCanvas(e.clientX,e.clientY);brain120FrameDrag={id:f.id,dx:p.x-f.x,dy:p.y-f.y,lastX:f.x,lastY:f.y};frame.classList.add('dragging');return;
  }
  const card=e.target.closest?.('.brain107-card'),shape=e.target.closest?.('.brain109-shape');
  if(brain107Tool==='select'&&(e.shiftKey||e.ctrlKey||e.metaKey)&&(card||shape)){
    brain120ToggleSelect(card?.dataset.id||shape?.dataset.shapeId,true);e.preventDefault();return;
  }
  if(brain107Tool==='select'&&!card&&!shape&&!frame&&brain120CanEdit()){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY);brain120SelectBox={sx:p.x,sy:p.y,x:p.x,y:p.y};
    const box=document.createElement('div');box.id='brain120SelectBox';box.className='brain120-selection-box';document.getElementById('brain107Stage').appendChild(box);return;
  }
  return brain109PointerDownBaseV120(e);
}
const brain109PointerMoveBaseV120=brain109PointerMove;
brain109PointerMove=function(e){
  if(brain120FrameDrag){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY),f=brain120Frames.find(x=>x.id===brain120FrameDrag.id);
    if(f){f.x=brain120SnapValue(Math.max(0,Math.min(4000-f.w,p.x-brain120FrameDrag.dx)));f.y=brain120SnapValue(Math.max(0,Math.min(3000-f.h,p.y-brain120FrameDrag.dy)));brain120FrameDrag.lastX=f.x;brain120FrameDrag.lastY=f.y;brain120RenderFrames()}
    return;
  }
  if(brain120SelectBox){
    const p=brain107ScreenToCanvas(e.clientX,e.clientY);brain120SelectBox.x=p.x;brain120SelectBox.y=p.y;
    const x=Math.min(brain120SelectBox.sx,p.x),y=Math.min(brain120SelectBox.sy,p.y),w=Math.abs(p.x-brain120SelectBox.sx),h=Math.abs(p.y-brain120SelectBox.sy);
    const box=document.getElementById('brain120SelectBox');if(box)box.style.cssText=`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    return;
  }
  const r=brain109PointerMoveBaseV120(e);
  if(brain107Drag){
    const o=brain107Objects.find(x=>x.id===brain107Drag.id);
    if(o){o.x=brain120SnapValue(o.x);o.y=brain120SnapValue(o.y)}
  }
  if(brain109ShapeDrag){
    const s=brain109Shapes.find(x=>x.id===brain109ShapeDrag.id);
    if(s){s.x=brain120SnapValue(s.x);s.y=brain120SnapValue(s.y)}
  }
  brain120RenderMiniMap();return r;
}
const brain109PointerUpBaseV120=brain109PointerUp;
brain109PointerUp=async function(e){
  if(brain120FrameDrag){
    const d=brain120FrameDrag;brain120FrameDrag=null;document.querySelector(`.brain120-frame[data-frame-id="${CSS.escape(d.id)}"]`)?.classList.remove('dragging');
    await sb.rpc('tasky_brainstorm_frame_move_v120',{p_room_id:brain120CurrentRoomId(),p_frame_id:d.id,p_x:Math.round(d.lastX),p_y:Math.round(d.lastY)});brain120RenderMiniMap();return;
  }
  if(brain120SelectBox){
    const b=brain120SelectBox;brain120SelectBox=null;document.getElementById('brain120SelectBox')?.remove();
    const x1=Math.min(b.sx,b.x),y1=Math.min(b.sy,b.y),x2=Math.max(b.sx,b.x),y2=Math.max(b.sy,b.y);brain120Selected.clear();
    brain107Objects.forEach(o=>{if(o.x>=x1&&o.y>=y1&&o.x+230<=x2&&o.y+150<=y2)brain120Selected.add(o.id)});
    brain109Shapes.forEach(s=>{if(s.x>=x1&&s.y>=y1&&s.x+s.w<=x2&&s.y+s.h<=y2)brain120Selected.add(s.id)});
    brain120Frames.forEach(f=>{if(f.x>=x1&&f.y>=y1&&f.x+f.w<=x2&&f.y+f.h<=y2)brain120Selected.add(f.id)});
    brain120RenderSelection();return;
  }
  const beforeCard=brain107Drag?{...brain107Objects.find(x=>x.id===brain107Drag.id)}:null;
  const beforeShape=brain109ShapeDrag?{...brain109Shapes.find(x=>x.id===brain109ShapeDrag.id)}:null;
  const r=await brain109PointerUpBaseV120(e);
  if(beforeCard)brain120PushUndo({kind:'move_card',id:beforeCard.id,x:beforeCard.x,y:beforeCard.y});
  if(beforeShape)brain120PushUndo({kind:'move_shape',id:beforeShape.id,x:beforeShape.x,y:beforeShape.y});
  return r;
}

/* Realtime extra events */
const brain110ConnectBaseV120=brain110Connect;
brain110Connect=async function(roomId){
  await brain110ConnectBaseV120(roomId);
  if(!brain110Channel)return;
  brain110Channel.on('broadcast',{event:'viewport'},payload=>{
    if(!brain120Facilitator)return;
    const p=payload?.payload||payload;if(!p)return;
    brain107Tx=Number(p.tx)||0;brain107Ty=Number(p.ty)||0;brain107Scale=Number(p.scale)||1;brain107ApplyTransform();brain120RenderMiniMap();
  });
  brain110Channel.on('broadcast',{event:'timer'},payload=>{brain120TimerState=payload?.payload||payload;brain120RenderTimer()});
};

/* Open/close */
const brain108OpenRoomBaseV120=brain108OpenRoom;
brain108OpenRoom=async function(roomId){
  brain120Selected.clear();brain120Frames=[];brain120Filter='';brain120FilterKind='';
  await brain108OpenRoomBaseV120(roomId);
  await brain120FetchActionLinks();
};
const brain108CloseCanvasBaseV120=brain108CloseCanvas;
brain108CloseCanvas=function(){
  brain120Selected.clear();brain120Frames=[];brain120ClosePanels();brain120TimerState=null;
  return brain108CloseCanvasBaseV120();
};

/* keyboard */
window.addEventListener('keydown',e=>{
  if(!window.brain108RoomId)return;
  const tag=e.target?.tagName?.toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select')return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'){e.preventDefault();brain120Copy()}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='v'){e.preventDefault();brain120Paste()}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();brain120DuplicateSelection()}
  if(e.key==='Escape'){brain120ClearSelection();brain120ClosePanels()}
});


/* --- source script: tasky-v130-brainstorm-advanced-js --- */

window.TASKY_BUILD='V130';console.info('Tasky build',window.TASKY_BUILD);

let brain130Stage='ideas';
let brain130Anonymous=false;
let brain130PrivateDraft=false;
let brain130Layers={cards:true,drawings:true,shapes:true,frames:true,connectors:true,comments:true};
let brain130Breakouts=[];
let brain130Assets=[];
let brain130Timeline=[];
let brain130Images=[];
let brain130PresentIndex=0;
let brain130Perf={maxRendered:220,cursorThrottle:100,strokeSample:3};
let brain130ImageDrag=null;

const brain130Stages=[
  ['ideas','جمع الأفكار','Ideas'],
  ['cluster','تجميع','Cluster'],
  ['discuss','مناقشة','Discuss'],
  ['vote','تصويت','Vote'],
  ['decide','قرارات','Decide'],
  ['actions','إجراءات','Actions']
];

function brain130L(ar,en){return lang==='ar'?ar:en}
function brain130CanManage(){return !!window.brain108RoomMeta?.can_manage}
function brain130CanEdit(){return brain111CanEdit?brain111CanEdit():brain109Editable()}
function brain130RoomId(){return window.brain108RoomId}
function brain130Panel(id){
  document.querySelectorAll('.brain130-side-panel,.brain130-layer-panel').forEach(x=>{if(x.id!==id)x.classList.remove('show')});
  document.getElementById(id)?.classList.toggle('show');
}
function brain130RefreshStagebar(){
  document.querySelectorAll('#brain130Stagebar button').forEach(b=>b.classList.toggle('active',b.dataset.stage===brain130Stage));
}
async function brain130SetStage(stage){
  if(!brain130CanManage())return;
  const {error}=await sb.rpc('tasky_brainstorm_stage_set_v130',{p_room_id:brain130RoomId(),p_stage:stage});
  if(error)return taskyToast(error.message,{tone:'warning'});
  brain130Stage=stage;brain130RefreshStagebar();brain130UpdateProgress();
}
function brain130UpdateProgress(){
  const el=document.getElementById('brain130Progress');if(!el)return;
  const idx=Math.max(0,brain130Stages.findIndex(x=>x[0]===brain130Stage)),pct=(idx+1)/brain130Stages.length*100;
  el.classList.add('show');
  el.querySelector('i').style.width=pct+'%';
  el.querySelector('small').textContent=`${idx+1}/${brain130Stages.length} · ${brain130Stages[idx]?.[lang==='ar'?1:2]||''}`;
}

/* Anonymous and private drafting */
async function brain130ToggleAnonymous(){
  if(!brain130CanManage())return;
  const {data,error}=await sb.rpc('tasky_brainstorm_anonymous_set_v130',{p_room_id:brain130RoomId(),p_enabled:!brain130Anonymous});
  if(error)return taskyToast(error.message,{tone:'warning'});
  brain130Anonymous=!!data?.enabled;await brain109FetchCanvas();
}
function brain130TogglePrivateDraft(){
  brain130PrivateDraft=!brain130PrivateDraft;
  taskyToast(brain130PrivateDraft?brain130L('وضع المسودة الخاصة مفعل','Private draft mode enabled'):brain130L('وضع المسودة الخاصة متوقف','Private draft mode disabled'),{tone:'success'});
}
async function brain130PublishPrivate(objectId){
  const {error}=await sb.rpc('tasky_brainstorm_private_publish_v130',{p_room_id:brain130RoomId(),p_object_id:objectId});
  if(error)return taskyToast(error.message,{tone:'warning'});
  await brain109FetchCanvas();
}

/* Breakout boards */
async function brain130OpenBreakouts(){
  const {data,error}=await sb.rpc('tasky_brainstorm_breakout_list_v130',{p_room_id:brain130RoomId()});
  if(error)return taskyToast(error.message,{tone:'warning'});
  brain130Breakouts=Array.isArray(data)?data:[];
  const p=document.getElementById('brain130Breakouts');
  p.innerHTML=`<h3>${brain130L('لوحات المجموعات','Breakout boards')}</h3><p>${brain130L('قسّم الجلسة إلى مجموعات مستقلة ثم ادمج النتائج في اللوحة الرئيسية.','Split the session into independent boards, then merge results into the main board.')}</p>
  ${brain130CanManage()?`<button class="primary-btn" onclick="brain130CreateBreakout()">${brain130L('مجموعة جديدة','New breakout')}</button>`:''}
  ${brain130Breakouts.map(b=>`<div class="brain130-breakout-card"><b>${escapeHtml(b.title)}</b><small>${Number(b.member_count||0)} ${brain130L('مشارك','members')}</small><div style="display:flex;gap:5px;margin-top:6px"><button class="chip-btn" onclick="brain130OpenBreakout('${b.id}')">${brain130L('فتح','Open')}</button>${brain130CanManage()?`<button class="chip-btn" onclick="brain130MergeBreakout('${b.id}')">${brain130L('دمج النتائج','Merge')}</button>`:''}</div></div>`).join('')}`;
  p.classList.add('show');
}
async function brain130CreateBreakout(){
  const title=await taskyPrompt(brain130L('اسم المجموعة','Breakout name'),{title:brain130L('مجموعة جديدة','New breakout')});if(!title)return;
  const {error}=await sb.rpc('tasky_brainstorm_breakout_create_v130',{p_room_id:brain130RoomId(),p_title:title});
  if(error)return taskyToast(error.message,{tone:'warning'});await brain130OpenBreakouts();
}
async function brain130OpenBreakout(id){
  const b=brain130Breakouts.find(x=>x.id===id);if(!b?.child_room_id)return;
  brain108CloseCanvas();setTimeout(()=>brain108OpenRoom(b.child_room_id),80);
}
async function brain130MergeBreakout(id){
  const ok=await taskyConfirm(brain130L('دمج البطاقات الجديدة من هذه المجموعة في اللوحة الرئيسية؟','Merge new cards from this breakout into the main board?'),{title:brain130L('دمج النتائج','Merge results'),confirmText:brain130L('دمج','Merge')});if(!ok)return;
  const {error}=await sb.rpc('tasky_brainstorm_breakout_merge_v130',{p_breakout_id:id});
  if(error)return taskyToast(error.message,{tone:'warning'});taskyToast(brain130L('تم دمج النتائج','Results merged'),{tone:'success'});
}

/* Affinity clustering */
async function brain130Cluster(){
  if(!brain130CanEdit())return;
  const {data,error}=await sb.rpc('tasky_brainstorm_cluster_suggest_v130',{p_room_id:brain130RoomId()});
  if(error)return taskyToast(error.message,{tone:'warning'});
  const groups=Array.isArray(data)?data:[];
  const p=document.getElementById('brain130InsightsPanel');
  p.innerHTML=`<h3>${brain130L('اقتراح التجميع','Clustering suggestion')}</h3><p>${brain130L('اقتراح محلي مبني على الكلمات المشتركة. لا يتم نقل العناصر إلا بعد موافقتك.','Local keyword-based suggestion. Nothing moves until you approve.')}</p>${groups.map((g,i)=>`<div class="brain120-insight"><b>${brain130L('مجموعة','Group')} ${i+1}</b><p>${g.labels.map(escapeHtml).join('<br>')}</p><button class="chip-btn" onclick='brain130ApplyCluster(${JSON.stringify(g.ids)})'>${brain130L('تجميع داخل إطار','Group in frame')}</button></div>`).join('')}`;
  p.classList.add('show');
}
async function brain130ApplyCluster(ids){
  const {error}=await sb.rpc('tasky_brainstorm_cluster_apply_v130',{p_room_id:brain130RoomId(),p_object_ids:ids});
  if(error)return taskyToast(error.message,{tone:'warning'});await brain109FetchCanvas();
}

/* Merge duplicate ideas */
async function brain130MergeSelectedIdeas(){
  const ids=[...brain120Selected].filter(id=>brain107Objects.some(o=>o.id===id));
  if(ids.length<2)return taskyToast(brain130L('حدد فكرتين على الأقل','Select at least two ideas'),{tone:'warning'});
  const {error}=await sb.rpc('tasky_brainstorm_ideas_merge_v130',{p_room_id:brain130RoomId(),p_object_ids:ids});
  if(error)return taskyToast(error.message,{tone:'warning'});brain120Selected.clear();await brain109FetchCanvas();
}

/* Scorecard + matrix */
async function brain130OpenScore(objectId){
  const o=brain107Objects.find(x=>x.id===objectId);if(!o)return;
  const {data}=await sb.rpc('tasky_brainstorm_score_get_v130',{p_room_id:brain130RoomId(),p_object_id:objectId});
  const s=data||{};
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${brain130L('بطاقة تقييم الفكرة','Idea scorecard')}</h3><div class="subtle">${escapeHtml(o.body)}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
  <form class="brain130-score-grid" onsubmit="brain130SaveScore(event,'${objectId}')">
    ${[['impact','الأثر','Impact'],['cost','التكلفة','Cost'],['ease','سهولة التنفيذ','Ease'],['risk','المخاطر','Risk'],['time','الوقت','Time'],['customer_value','قيمة العميل','Customer value']].map(x=>`<label>${brain130L(x[1],x[2])}<input type="number" min="1" max="5" id="brain130_${x[0]}" value="${Number(s[x[0]]||3)}"></label>`).join('')}
    <div style="grid-column:1/-1;display:flex;justify-content:flex-end"><button class="primary-btn" type="submit">${brain130L('حفظ التقييم','Save score')}</button></div>
  </form>`;document.getElementById('addModalOverlay').classList.remove('hidden');
}
async function brain130SaveScore(e,id){
  e.preventDefault();const v=n=>Number(document.getElementById('brain130_'+n).value||3);
  const {error}=await sb.rpc('tasky_brainstorm_score_set_v130',{p_room_id:brain130RoomId(),p_object_id:id,p_impact:v('impact'),p_cost:v('cost'),p_ease:v('ease'),p_risk:v('risk'),p_time:v('time'),p_customer_value:v('customer_value')});
  if(error)return taskyToast(error.message,{tone:'warning'});closeAddModal();await brain109FetchCanvas();
}
async function brain130DecisionMatrix(){
  const {data,error}=await sb.rpc('tasky_brainstorm_matrix_v130',{p_room_id:brain130RoomId()});if(error)return taskyToast(error.message,{tone:'warning'});
  const rows=Array.isArray(data)?data:[];
  const p=document.getElementById('brain130Matrix');
  p.innerHTML=`<h3>${brain130L('مصفوفة القرار','Decision matrix')}</h3><table class="brain130-matrix"><thead><tr><th>${brain130L('الفكرة','Idea')}</th><th>${brain130L('النتيجة','Score')}</th><th>${brain130L('التصويت','Votes')}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.body)}</td><td>${Number(r.score||0).toFixed(2)}</td><td>${Number(r.votes||0)}</td></tr>`).join('')}</tbody></table>`;p.classList.add('show');
}

/* Dependencies */
async function brain130SetDependency(){
  const ids=[...brain120Selected].filter(id=>brain107Objects.some(o=>o.id===id)||brain109Shapes.some(s=>s.id===id));
  if(ids.length!==2)return taskyToast(brain130L('حدد عنصرين بالضبط','Select exactly two elements'),{tone:'warning'});
  const type=await taskyPrompt(brain130L('نوع العلاقة: depends / blocks / requires / causes / related','Relationship: depends / blocks / requires / causes / related'),{title:brain130L('نوع العلاقة','Relationship type'),placeholder:'depends'});if(!type)return;
  const {error}=await sb.rpc('tasky_brainstorm_dependency_set_v130',{p_room_id:brain130RoomId(),p_from_id:ids[0],p_to_id:ids[1],p_relation:type});
  if(error)return taskyToast(error.message,{tone:'warning'});await brain109FetchCanvas();
}

/* Layers */
function brain130ToggleLayer(k){
  brain130Layers[k]=!brain130Layers[k];
  const map={cards:'#brain107Cards',drawings:'#brain107Svg',shapes:'#brain109Shapes',frames:'#brain120Frames',comments:'.brain120-comment-dot'};
  if(map[k])document.querySelectorAll(map[k]).forEach(el=>el.style.display=brain130Layers[k]?'':'none');
}
function brain130OpenLayers(){
  const p=document.getElementById('brain130Layers');
  p.innerHTML=`<h3>${brain130L('طبقات اللوحة','Canvas layers')}</h3>${Object.keys(brain130Layers).map(k=>`<div class="brain130-layer-row"><span>${escapeHtml(k)}</span><button class="chip-btn" onclick="brain130ToggleLayer('${k}');brain130OpenLayers()">${brain130Layers[k]?brain130L('إخفاء','Hide'):brain130L('إظهار','Show')}</button></div>`).join('')}`;p.classList.add('show');
}

/* Element lock, ownership, status */
async function brain130LockSelected(){
  const ids=[...brain120Selected];if(!ids.length)return;
  const {error}=await sb.rpc('tasky_brainstorm_elements_lock_v130',{p_room_id:brain130RoomId(),p_element_ids:ids,p_locked:true});
  if(error)return taskyToast(error.message,{tone:'warning'});await brain109FetchCanvas();
}
async function brain130UnlockSelected(){
  const ids=[...brain120Selected];if(!ids.length)return;
  const {error}=await sb.rpc('tasky_brainstorm_elements_lock_v130',{p_room_id:brain130RoomId(),p_element_ids:ids,p_locked:false});
  if(error)return taskyToast(error.message,{tone:'warning'});await brain109FetchCanvas();
}
async function brain130AssignOwner(objectId){
  const name=await taskyPrompt(brain130L('اسم المسؤول أو بريده','Owner name or email'),{title:brain130L('تعيين مسؤول','Assign owner')});if(!name)return;
  const {error}=await sb.rpc('tasky_brainstorm_owner_set_v130',{p_room_id:brain130RoomId(),p_object_id:objectId,p_owner_query:name});
  if(error)return taskyToast(error.message,{tone:'warning'});await brain109FetchCanvas();
}
async function brain130SetStatus(objectId,status){
  const {error}=await sb.rpc('tasky_brainstorm_status_set_v130',{p_room_id:brain130RoomId(),p_object_id:objectId,p_status:status});
  if(error)return taskyToast(error.message,{tone:'warning'});await brain109FetchCanvas();
}

/* Action plan */
async function brain130ActionPlan(objectId){
  const o=brain107Objects.find(x=>x.id===objectId);if(!o)return;
  const allowed=projects.filter(p=>canCreateTaskInProject(p.id));
  if(!allowed.length)return taskyToast(brain130L('لا يوجد مشروع متاح','No available project'),{tone:'warning'});
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${brain130L('خطة إجراءات من القرار','Action plan from decision')}</h3><div class="subtle">${escapeHtml(o.body)}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
  <label class="field">${brain130L('المشروع','Project')}<select id="brain130PlanProject">${allowed.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></label>
  <label class="field">${brain130L('الإجراءات — كل سطر مهمة','Actions — one task per line')}<textarea id="brain130PlanLines" style="width:100%;min-height:120px" placeholder="${brain130L('الإجراء الأول\nالإجراء الثاني','First action\nSecond action')}"></textarea></label>
  <div style="display:flex;justify-content:flex-end;margin-top:7px"><button class="primary-btn" onclick="brain130CreateActionPlan('${objectId}')">${brain130L('إنشاء المهام','Create tasks')}</button></div>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
}
async function brain130CreateActionPlan(objectId){
  const projectId=document.getElementById('brain130PlanProject').value,lines=(document.getElementById('brain130PlanLines').value||'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,20);
  if(!lines.length)return;
  for(const line of lines){
    const {data,error}=await sb.rpc('tasky_work_create_task_v88',{p_workspace_id:currentWorkspaceId,p_project_id:projectId,p_title:line.slice(0,180),p_tag:'Brainstorm Action Plan',p_priority:'medium',p_cost:0,p_start_date:null,p_due_date:null,p_assignee_ids:[]});
    if(!error&&data?.id)await sb.rpc('tasky_brainstorm_action_link_v112',{p_room_id:brain130RoomId(),p_object_id:objectId,p_action_type:'task',p_target_id:data.id});
  }
  closeAddModal();await fetchTasks();taskyToast(brain130L('تم إنشاء خطة الإجراءات','Action plan created'),{tone:'success'});
}

/* References / attachments */
async function brain130OpenReferences(objectId){
  const {data}=await sb.rpc('tasky_brainstorm_reference_list_v130',{p_room_id:brain130RoomId(),p_object_id:objectId});
  const refs=Array.isArray(data)?data:[];
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${brain130L('المراجع والمرفقات','References & attachments')}</h3></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
  ${refs.map(r=>`<div class="brain120-comment"><b>${escapeHtml(r.label||r.url)}</b><p>${escapeHtml(r.url)}</p></div>`).join('')}
  <label class="field">${brain130L('الرابط','URL')}<input id="brain130RefUrl" placeholder="https://"></label><label class="field">${brain130L('اسم المرجع','Label')}<input id="brain130RefLabel"></label>
  <div style="display:flex;justify-content:flex-end"><button class="primary-btn" onclick="brain130AddReference('${objectId}')">${brain130L('إضافة','Add')}</button></div>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
}
async function brain130AddReference(objectId){
  const url=document.getElementById('brain130RefUrl').value.trim(),label=document.getElementById('brain130RefLabel').value.trim();if(!url)return;
  const {error}=await sb.rpc('tasky_brainstorm_reference_add_v130',{p_room_id:brain130RoomId(),p_object_id:objectId,p_url:url,p_label:label||null});
  if(error)return taskyToast(error.message,{tone:'warning'});await brain130OpenReferences(objectId);
}

/* Image paste/upload to private Supabase Storage */
async function brain130HandlePaste(e){
  if(!brain130CanEdit())return;
  const item=[...(e.clipboardData?.items||[])].find(i=>i.type.startsWith('image/'));if(!item)return;
  e.preventDefault();const file=item.getAsFile();if(!file)return;
  if(file.size>8*1024*1024)return taskyToast(brain130L('الصورة أكبر من 8MB','Image exceeds 8MB'),{tone:'warning'});
  const ext=(file.type.split('/')[1]||'png').replace('jpeg','jpg'),path=`${currentWorkspaceId}/${brain130RoomId()}/${crypto.randomUUID()}.${ext}`;
  const {error:upErr}=await sb.storage.from('tasky-brainstorm-assets').upload(path,file,{contentType:file.type,upsert:false});
  if(upErr)return taskyToast(upErr.message,{tone:'warning'});
  const {data:signed,error:sErr}=await sb.storage.from('tasky-brainstorm-assets').createSignedUrl(path,60*60);
  if(sErr)return taskyToast(sErr.message,{tone:'warning'});
  const wrap=document.getElementById('brain107StageWrap'),r=wrap.getBoundingClientRect(),c=brain107ScreenToCanvas(r.left+r.width/2,r.top+r.height/2);
  const {error}=await sb.rpc('tasky_brainstorm_image_add_v130',{p_room_id:brain130RoomId(),p_storage_path:path,p_x:Math.round(c.x-160),p_y:Math.round(c.y-100),p_w:320,p_h:200});
  if(error)return taskyToast(error.message,{tone:'warning'});await brain109FetchCanvas();
}
window.addEventListener('paste',brain130HandlePaste);

async function brain130ResolveImages(){
  const out=[];
  for(const im of brain130Images){
    const {data}=await sb.storage.from('tasky-brainstorm-assets').createSignedUrl(im.storage_path,3600);
    out.push({...im,url:data?.signedUrl||''});
  }
  brain130Images=out;brain130RenderImages();
}
function brain130RenderImages(){
  const host=document.getElementById('brain130Images');if(!host)return;
  host.innerHTML=brain130Images.map(im=>`<div class="brain130-image ${brain120Selected.has(im.id)?'brain120-selected':''}" data-image-id="${im.id}" style="left:${im.x}px;top:${im.y}px;width:${im.w}px;height:${im.h}px">${im.url?`<img src="${escapeHtml(im.url)}" alt="">`:`<div class="brain130-private">${brain130L('جارٍ تحميل الصورة','Loading image')}</div>`}</div>`).join('');
}

/* Presentation from Frames */
function brain130Presentation(){
  if(!brain120Frames.length)return taskyToast(brain130L('أضف Frames أولًا','Add Frames first'),{tone:'warning'});
  brain130PresentIndex=0;brain130RenderPresentation();document.getElementById('brain130Present').classList.add('show');
}
function brain130RenderPresentation(){
  const f=brain120Frames[brain130PresentIndex];if(!f)return;
  const body=document.getElementById('brain130PresentFrame');
  const cards=brain107Objects.filter(o=>o.x>=f.x&&o.y>=f.y&&o.x<=f.x+f.w&&o.y<=f.y+f.h);
  body.innerHTML=`<div class="brain130-present-title">${escapeHtml(f.title)}</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;padding:14px">${cards.map(o=>`<div class="brain107-card" style="position:relative;left:auto;top:auto;width:auto"><div class="brain107-card-kind">${escapeHtml(brain107KindLabel(o.kind))}</div><div class="brain107-card-body">${escapeHtml(o.body)}</div></div>`).join('')}</div>`;
  document.getElementById('brain130PresentCount').textContent=`${brain130PresentIndex+1}/${brain120Frames.length}`;
}
function brain130PresentMove(d){brain130PresentIndex=Math.max(0,Math.min(brain120Frames.length-1,brain130PresentIndex+d));brain130RenderPresentation()}
function brain130PresentClose(){document.getElementById('brain130Present').classList.remove('show')}

/* Timeline */
async function brain130OpenTimeline(){
  const {data,error}=await sb.rpc('tasky_brainstorm_timeline_v130',{p_room_id:brain130RoomId()});if(error)return taskyToast(error.message,{tone:'warning'});
  brain130Timeline=Array.isArray(data)?data:[];
  const p=document.getElementById('brain130Timeline');
  p.innerHTML=`<h3>${brain130L('سجل النشاط','Activity timeline')}</h3>${brain130Timeline.map(x=>`<div class="brain130-timeline-item"><b>${escapeHtml(x.actor_name||'')}</b><p>${escapeHtml(x.event_label||x.event_type)}</p><small>${escapeHtml(new Date(x.created_at).toLocaleString(lang==='ar'?'ar-SA':'en-US'))}</small></div>`).join('')}`;p.classList.add('show');
}

/* Card enrichment */
const brain109RenderCardsBaseV130=brain109RenderCards;
brain109RenderCards=function(){
  brain109RenderCardsBaseV130();
  for(const el of document.querySelectorAll('#brain107Cards .brain107-card')){
    const o=brain107Objects.find(x=>x.id===el.dataset.id);if(!o)continue;
    const head=el.querySelector('.brain107-card-head');
    if(head&&!el.querySelector('.brain130-card-meta')){
      const meta=document.createElement('div');meta.className='brain130-card-meta';
      if(o.owner_name)meta.innerHTML+=`<span class="brain130-badge owner">${escapeHtml(o.owner_name)}</span>`;
      if(o.workflow_status&&o.workflow_status!=='new')meta.innerHTML+=`<span class="brain130-badge status-${escapeHtml(o.workflow_status)}">${escapeHtml(o.workflow_status)}</span>`;
      if(o.element_locked)meta.innerHTML+=`<span class="brain130-badge lock">${brain130L('مقفل','Locked')}</span>`;
      if(Number(o.score||0)>0)meta.innerHTML+=`<span class="brain130-badge">${brain130L('تقييم','Score')}: ${Number(o.score).toFixed(1)}</span>`;
      head.insertAdjacentElement('afterend',meta);
    }
    const actions=el.querySelector('.brain107-card-foot .actions');
    if(actions&&!actions.querySelector('[data-v130]')){
      const menu=document.createElement('button');menu.type='button';menu.dataset.v130='1';menu.textContent=brain130L('المزيد','More');
      menu.onclick=e=>{e.stopPropagation();brain130CardMenu(o.id)};actions.appendChild(menu);
    }
    if(o.private_draft&&!o.is_mine){
      const mask=document.createElement('div');mask.className='brain130-private';mask.textContent=brain130L('مسودة خاصة — غير منشورة','Private draft — not published');el.appendChild(mask);
    }
  }
}
function brain130CardMenu(id){
  const o=brain107Objects.find(x=>x.id===id);if(!o)return;
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${brain130L('إجراءات الفكرة','Idea actions')}</h3><div class="subtle">${escapeHtml(o.body)}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
  <div class="brain120-grid">
    <button onclick="closeAddModal();brain130OpenScore('${id}')">${brain130L('بطاقة تقييم','Scorecard')}</button>
    <button onclick="closeAddModal();brain130AssignOwner('${id}')">${brain130L('تعيين مسؤول','Assign owner')}</button>
    <button onclick="brain130SetStatus('${id}','approved');closeAddModal()">${brain130L('اعتماد','Approve')}</button>
    <button onclick="brain130SetStatus('${id}','rejected');closeAddModal()">${brain130L('رفض','Reject')}</button>
    <button onclick="closeAddModal();brain130OpenReferences('${id}')">${brain130L('مراجع','References')}</button>
    <button onclick="closeAddModal();brain130ActionPlan('${id}')">${brain130L('خطة إجراءات','Action plan')}</button>
    ${o.private_draft&&o.is_mine?`<button onclick="brain130PublishPrivate('${id}');closeAddModal()">${brain130L('نشر للجميع','Publish')}</button>`:''}
  </div>`;document.getElementById('addModalOverlay').classList.remove('hidden');
}

/* State */
brain109FetchCanvas=async function(){
  if(!window.brain108RoomId)return;
  const {data,error}=await sb.rpc('tasky_brainstorm_canvas_state_v130',{p_room_id:window.brain108RoomId});
  if(error){console.warn('V130 canvas state',error);return}
  brain107Objects=Array.isArray(data?.objects)?data.objects:[];
  brain107Strokes=Array.isArray(data?.strokes)?data.strokes:[];
  brain107Presence=Array.isArray(data?.presence)?data.presence:[];
  brain109Shapes=Array.isArray(data?.shapes)?data.shapes:[];
  brain109Connectors=Array.isArray(data?.connectors)?data.connectors:[];
  brain120Frames=Array.isArray(data?.frames)?data.frames:[];
  brain130Images=Array.isArray(data?.images)?data.images:[];
  window.brain108RoomMeta=data?.room||window.brain108RoomMeta||{};
  brain130Stage=data?.session_stage||'ideas';
  brain130Anonymous=!!data?.anonymous_mode;
  window.brain120VoteSession=data?.vote_session||null;
  brain109RenderData();brain130RenderImages();brain130RefreshStagebar();brain130UpdateProgress();
  if(brain130Images.some(x=>!x.url))brain130ResolveImages();
};

/* Full shell enhancements */
const brain108RenderCanvasShellBaseV130=brain108RenderCanvasShell;
brain108RenderCanvasShell=function(room){
  brain108RenderCanvasShellBaseV130(room);
  const wrap=document.getElementById('brain107StageWrap'),stage=document.getElementById('brain107Stage'),shell=document.getElementById('brain107CanvasShell');
  if(stage&&!document.getElementById('brain130Images')){
    const h=document.createElement('div');h.id='brain130Images';h.style.cssText='position:absolute;inset:0;pointer-events:none';stage.insertBefore(h,document.getElementById('brain107Cards'));
  }
  if(wrap&&!document.getElementById('brain130Toolbar')){
    const t=document.createElement('div');t.id='brain130Toolbar';t.className='brain130-toolbar';
    t.innerHTML=`<button onclick="brain130OpenBreakouts()">${brain130L('مجموعات','Breakouts')}</button><button onclick="brain130Cluster()">${brain130L('تجميع ذكي','Cluster')}</button><button onclick="brain130MergeSelectedIdeas()">${brain130L('دمج أفكار','Merge ideas')}</button><button onclick="brain130DecisionMatrix()">${brain130L('مصفوفة قرار','Matrix')}</button><button onclick="brain130SetDependency()">${brain130L('علاقة','Dependency')}</button><button onclick="brain130OpenLayers()">${brain130L('طبقات','Layers')}</button><button onclick="brain130LockSelected()">${brain130L('قفل عنصر','Lock')}</button><button onclick="brain130UnlockSelected()">${brain130L('فتح عنصر','Unlock')}</button><button onclick="brain130Presentation()">${brain130L('عرض','Present')}</button><button onclick="brain130OpenTimeline()">${brain130L('النشاط','Activity')}</button>${brain130CanManage()?`<button onclick="brain130ToggleAnonymous()">${brain130L('مجهول','Anonymous')}</button>`:''}<button onclick="brain130TogglePrivateDraft()">${brain130L('مسودة خاصة','Private draft')}</button>`;
    wrap.appendChild(t);
    const sb=document.createElement('div');sb.id='brain130Stagebar';sb.className='brain130-stagebar';sb.innerHTML=brain130Stages.map(s=>`<button data-stage="${s[0]}" onclick="brain130SetStage('${s[0]}')">${brain130L(s[1],s[2])}</button>`).join('');wrap.appendChild(sb);
    const pr=document.createElement('div');pr.id='brain130Progress';pr.className='brain130-progress';pr.innerHTML='<div class="brain130-progress-track"><i></i></div><small></small>';wrap.appendChild(pr);
  }
  if(shell&&!document.getElementById('brain130Layers')){
    for(const id of ['brain130Layers','brain130Breakouts','brain130Matrix','brain130Timeline']){
      const p=document.createElement('div');p.id=id;p.className=id==='brain130Layers'?'brain130-layer-panel':'brain130-side-panel';shell.appendChild(p);
    }
    const present=document.createElement('div');present.id='brain130Present';present.className='brain130-present';present.innerHTML=`<div class="brain130-present-head"><b>${brain130L('عرض غرفة العصف الذهني','Brainstorm presentation')}</b><div class="brain130-present-controls"><button onclick="brain130PresentMove(-1)">‹</button><span id="brain130PresentCount"></span><button onclick="brain130PresentMove(1)">›</button><button onclick="brain130PresentClose()">×</button></div></div><div class="brain130-present-body"><div class="brain130-present-frame" id="brain130PresentFrame"></div></div>`;document.body.appendChild(present);
  }
  brain130RenderImages();brain130RefreshStagebar();brain130UpdateProgress();
};

/* Private draft is enforced at create time. */
const brain108CreateCardBaseV130=brain108CreateCard;
brain108CreateCard=async function(){
  if(!brain130PrivateDraft)return brain108CreateCardBaseV130();
  const body=document.getElementById('brain107Body')?.value.trim()||'',kind=document.getElementById('brain107Kind')?.value||'idea';if(!body)return;
  const wrap=document.getElementById('brain107StageWrap'),r=wrap.getBoundingClientRect(),c=brain107ScreenToCanvas(r.left+r.width/2,r.top+r.height/2);
  const {error}=await sb.rpc('tasky_brainstorm_private_add_v130',{p_room_id:brain130RoomId(),p_kind:kind,p_body:body,p_x:Math.round(c.x-115),p_y:Math.round(c.y-60)});
  if(error)return taskyToast(error.message,{tone:'warning'});brain107ToggleCompose(false);await brain109FetchCanvas();
};

/* Realtime new tables */
const brain110ConnectBaseV130=brain110Connect;
brain110Connect=async function(roomId){
  await brain110ConnectBaseV130(roomId);
  if(!brain110Channel)return;
  ['tasky_brainstorm_breakouts_v130','tasky_brainstorm_scores_v130','tasky_brainstorm_references_v130','tasky_brainstorm_images_v130','tasky_brainstorm_activity_v130'].forEach(table=>{
    brain110Channel.on('postgres_changes',{event:'*',schema:'public',table,filter:`room_id=eq.${roomId}`},()=>brain110ScheduleRefresh(120));
  });
};

/* Performance tuning: adaptive culling and stroke sampling hint */
brain120ViewportVisible=function(x,y,w=230,h=140){
  if((brain107Objects.length+brain109Shapes.length+brain130Images.length)<brain130Perf.maxRendered)return true;
  const wrap=document.getElementById('brain107StageWrap');if(!wrap)return true;
  const r=wrap.getBoundingClientRect(),vx=-brain107Tx/brain107Scale-350,vy=-brain107Ty/brain107Scale-350;
  const vw=r.width/brain107Scale+700,vh=r.height/brain107Scale+700;
  return x+w>=vx&&x<=vx+vw&&y+h>=vy&&y<=vy+vh;
};

/* Open/close */
const brain108OpenRoomBaseV130=brain108OpenRoom;
brain108OpenRoom=async function(roomId){brain130Images=[];brain130Timeline=[];await brain108OpenRoomBaseV130(roomId)};
const brain108CloseCanvasBaseV130=brain108CloseCanvas;
brain108CloseCanvas=function(){brain130Images=[];brain130Timeline=[];document.getElementById('brain130Present')?.classList.remove('show');return brain108CloseCanvasBaseV130()};


/* --- source script: tasky-v1301-brainstorm-ui-fix-js --- */

window.TASKY_BUILD='V130.1';console.info('Tasky build',window.TASKY_BUILD);

const brain1301ClosableSelectors=[
  '.brain130-side-panel.show',
  '.brain130-layer-panel.show',
  '.brain120-panel.show',
  '.brain112-actions-panel.show',
  '.brain109-shape-menu.show',
  '.brain109-line-menu.show'
];

function brain1301EnsureDismissLayer(){
  let layer=document.getElementById('brain1301DismissLayer');
  if(!layer){
    layer=document.createElement('div');
    layer.id='brain1301DismissLayer';
    document.body.appendChild(layer);
    layer.addEventListener('pointerdown',e=>{
      e.preventDefault();
      e.stopPropagation();
      brain1301CloseTransientUi();
    });
  }
  return layer;
}

function brain1301AnyTransientOpen(){
  return brain1301ClosableSelectors.some(sel=>document.querySelector(sel));
}

function brain1301SyncDismissLayer(){
  const layer=brain1301EnsureDismissLayer();
  layer.classList.toggle('show',brain1301AnyTransientOpen());
}

function brain1301CloseTransientUi(except=null){
  for(const sel of brain1301ClosableSelectors){
    document.querySelectorAll(sel).forEach(el=>{
      if(el!==except)el.classList.remove('show');
    });
  }
  brain1301SyncDismissLayer();
}

/* One-panel-at-a-time wrappers */
const brain130PanelBaseV1301=brain130Panel;
brain130Panel=function(id){
  const target=document.getElementById(id);
  const willOpen=target&&!target.classList.contains('show');
  brain1301CloseTransientUi(target);
  if(target)target.classList.toggle('show',willOpen);
  brain1301SyncDismissLayer();
};

const brain120PanelBaseV1301=brain120Panel;
brain120Panel=function(id){
  const target=document.getElementById(id);
  const willOpen=target&&!target.classList.contains('show');
  brain1301CloseTransientUi(target);
  if(target)target.classList.toggle('show',willOpen);
  brain1301SyncDismissLayer();
};

const brain112TogglePanelBaseV1301=brain112TogglePanel;
brain112TogglePanel=function(){
  const target=document.getElementById('brain112Actions');
  const willOpen=target&&!target.classList.contains('show');
  brain1301CloseTransientUi(target);
  if(target)target.classList.toggle('show',willOpen);
  brain1301SyncDismissLayer();
};

const brain109ToggleShapeMenuBaseV1301=brain109ToggleShapeMenu;
brain109ToggleShapeMenu=function(){
  const target=document.getElementById('brain109ShapeMenu');
  const willOpen=target&&!target.classList.contains('show');
  brain1301CloseTransientUi(target);
  if(target)target.classList.toggle('show',willOpen);
  brain1301SyncDismissLayer();
};

const brain109ToggleLineMenuBaseV1301=brain109ToggleLineMenu;
brain109ToggleLineMenu=function(){
  const target=document.getElementById('brain109LineMenu');
  const willOpen=target&&!target.classList.contains('show');
  brain1301CloseTransientUi(target);
  if(target)target.classList.toggle('show',willOpen);
  brain1301SyncDismissLayer();
};

/* Functions that directly .show a panel now respect the same behavior. */
const brain130OpenBreakoutsBaseV1301=brain130OpenBreakouts;
brain130OpenBreakouts=async function(){
  brain1301CloseTransientUi(document.getElementById('brain130Breakouts'));
  await brain130OpenBreakoutsBaseV1301();
  brain1301SyncDismissLayer();
};

const brain130DecisionMatrixBaseV1301=brain130DecisionMatrix;
brain130DecisionMatrix=async function(){
  brain1301CloseTransientUi(document.getElementById('brain130Matrix'));
  await brain130DecisionMatrixBaseV1301();
  brain1301SyncDismissLayer();
};

const brain130OpenLayersBaseV1301=brain130OpenLayers;
brain130OpenLayers=function(){
  const target=document.getElementById('brain130Layers');
  brain1301CloseTransientUi(target);
  brain130OpenLayersBaseV1301();
  brain1301SyncDismissLayer();
};

const brain130OpenTimelineBaseV1301=brain130OpenTimeline;
brain130OpenTimeline=async function(){
  brain1301CloseTransientUi(document.getElementById('brain130Timeline'));
  await brain130OpenTimelineBaseV1301();
  brain1301SyncDismissLayer();
};

const brain120InsightsBaseV1301=brain120Insights;
brain120Insights=function(){
  brain1301CloseTransientUi(document.getElementById('brain120InsightsPanel'));
  brain120InsightsBaseV1301();
  brain1301SyncDismissLayer();
};

const brain130ClusterBaseV1301=brain130Cluster;
brain130Cluster=async function(){
  brain1301CloseTransientUi(document.getElementById('brain120InsightsPanel'));
  await brain130ClusterBaseV1301();
  brain1301SyncDismissLayer();
};

/* Clicking directly in the canvas should always dismiss transient menus/panels.
   This matches the requested behavior: press a button, then tap anywhere else
   to cancel/close it. */
document.addEventListener('pointerdown',e=>{
  if(!window.brain108RoomId)return;
  const insidePanel=e.target.closest?.(
    '.brain130-side-panel,.brain130-layer-panel,.brain120-panel,.brain112-actions-panel,.brain109-shape-menu,.brain109-line-menu'
  );
  const trigger=e.target.closest?.(
    '#brain130Toolbar button,#brain120Hud button,#brain112ActionsBtn,.brain107-tool,#brain130Stagebar button'
  );
  if(!insidePanel&&!trigger&&brain1301AnyTransientOpen()){
    brain1301CloseTransientUi();
  }
},true);

/* Escape closes any transient UI before changing canvas tool state. */
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&brain1301AnyTransientOpen()){
    e.preventDefault();
    e.stopImmediatePropagation();
    brain1301CloseTransientUi();
  }
},true);

/* Keep the layer in sync after room renders/open/close. */
const brain108RenderCanvasShellBaseV1301=brain108RenderCanvasShell;
brain108RenderCanvasShell=function(room){
  brain108RenderCanvasShellBaseV1301(room);
  brain1301EnsureDismissLayer();
  brain1301SyncDismissLayer();
};

const brain108CloseCanvasBaseV1301=brain108CloseCanvas;
brain108CloseCanvas=function(){
  brain1301CloseTransientUi();
  document.getElementById('brain1301DismissLayer')?.classList.remove('show');
  return brain108CloseCanvasBaseV1301();
};

