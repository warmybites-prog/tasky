/* Tasky V168 lazy chunk: meetings */

/* --- source script: taskyV101MeetingsScript --- */

/* ================= V101 — NATIVE MEETINGS BETA ================= */
window.TASKY_BUILD='V101';console.info('Tasky build',window.TASKY_BUILD);
STR.ar.nav_meetings='الاجتماعات';STR.en.nav_meetings='Meetings';
if(!NAV_ITEMS.some(x=>x.id==='meetings')){const idx=NAV_ITEMS.findIndex(x=>x.id==='events');NAV_ITEMS.splice(idx>=0?idx+1:NAV_ITEMS.length,0,{id:'meetings',key:'nav_meetings',icon:'i-camera',group:'grp_ops'});}
// V101 pilot: meetings are temporarily available on all plans while the native call stack is tested.
if(Array.isArray(PLANS.free.modules)&&!PLANS.free.modules.includes('meetings'))PLANS.free.modules.push('meetings');
if(Array.isArray(PLANS.pro.modules)&&!PLANS.pro.modules.includes('meetings'))PLANS.pro.modules.push('meetings');

const meet101L=(ar,en)=>lang==='ar'?ar:en;
let meetingsV101=[];
let meetingsLoadingV101=false;
let meetingsErrorV101='';
let meetingDeepLinkHandledV101=false;
let meetingRoomV101=null;
let meetingLocalStreamV101=null;
let meetingCameraTrackV101=null;
let meetingScreenTrackV101=null;
let meetingChannelV101=null;
let meetingPeerIdV101=null;
let meetingSubscribedV101=false;
let meetingSessionTimerV101=null;
const meetingPeersV101=new Map();
const meetingRemoteStreamsV101=new Map();
const meetingRemoteMetaV101=new Map();
const meetingPendingIceV101=new Map();
let meetingLocalStateV101={mic:true,camera:true,screen:false};
window.TASKY_MEETING_ICE_SERVERS_V101=window.TASKY_MEETING_ICE_SERVERS_V101||[{urls:['stun:stun.l.google.com:19302']}];

function meetingMemberV101(userId){return teamMembers.find(m=>String(m.userId||'')===String(userId||''))||null}
function meetingMemberNameV101(userId){const m=meetingMemberV101(userId);return m?.fullName||m?.email||meet101L('عضو الفريق','Team member')}
function meetingMeV101(){return meetingMemberV101(currentUserId)||{fullName:currentUserEmail||meet101L('أنا','Me'),initials:initialsFromName('',currentUserEmail||'ME'),color:'var(--green)',avatarUrl:null}}
function meetingStatusLabelV101(s){return({scheduled:meet101L('مجدول','Scheduled'),live:meet101L('مباشر الآن','Live now'),ended:meet101L('منتهي','Ended'),cancelled:meet101L('ملغي','Cancelled')})[s]||s}
function meetingDateV101(v){if(!v)return'—';try{return new Intl.DateTimeFormat(lang==='ar'?'ar-SA':'en-GB',{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}).format(new Date(v))}catch{return String(v)}}
function meetingTimeOnlyV101(v){if(!v)return'—';try{return new Intl.DateTimeFormat(lang==='ar'?'ar-SA':'en-GB',{hour:'numeric',minute:'2-digit'}).format(new Date(v))}catch{return String(v)}}
function meetingInitialsV101(name,email=''){return initialsFromName(name,email)}
function meetingInviteIdsV101(m){return Array.isArray(m?.invitee_ids)?m.invitee_ids.filter(Boolean):[]}
function meetingAudienceLabelV101(m){const ids=meetingInviteIdsV101(m);return ids.length?meet101L(`${ids.length} مدعوين`,` ${ids.length} invited`):meet101L('كل أعضاء مساحة العمل','All workspace members')}
function meetingLinkV101(roomCode){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('meeting',roomCode);return u.toString()}
async function meetingCopyTextV101(text){try{await navigator.clipboard.writeText(text);return true}catch(_){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch{}ta.remove();return ok}}
async function meetingCopyLinkV101(roomCode){const ok=await meetingCopyTextV101(meetingLinkV101(roomCode));taskyToast(ok?meet101L('تم نسخ رابط الاجتماع','Meeting link copied'):meet101L('تعذّر نسخ الرابط','Could not copy link'),{tone:ok?'success':'warning'})}
function meetingByIdV101(id){return meetingsV101.find(x=>String(x.id)===String(id))||null}
function meetingByCodeV101(code){return meetingsV101.find(x=>String(x.room_code||'').toUpperCase()===String(code||'').trim().toUpperCase())||null}

async function fetchMeetingsV101(){
  if(!currentWorkspaceId)return[];meetingsLoadingV101=true;meetingsErrorV101='';
  try{const {data,error}=await sb.rpc('tasky_meeting_list_v101',{p_workspace_id:currentWorkspaceId});if(error)throw error;meetingsV101=Array.isArray(data)?data:[];return meetingsV101}
  catch(err){meetingsErrorV101=err?.message||String(err);console.warn('Tasky V101 meetings',err);meetingsV101=[];return[]}
  finally{meetingsLoadingV101=false}
}

function meetingAvatarStackV101(m){const ids=meetingInviteIdsV101(m);const members=ids.length?ids.map(meetingMemberV101).filter(Boolean):teamMembers.filter(x=>x.status==='active'&&x.userId).slice(0,5);const creator=meetingMemberV101(m.created_by);const arr=[];if(creator)arr.push(creator);members.forEach(x=>{if(!arr.some(y=>y.userId===x.userId))arr.push(x)});return `<div class="meet101-avatars">${arr.slice(0,5).map(x=>`<span class="meet101-avatar" style="background:${x.color||'var(--green)'}">${x.avatarUrl?`<img src="${escapeHtml(x.avatarUrl)}" alt="">`:escapeHtml(x.initials||meetingInitialsV101(x.fullName,x.email))}</span>`).join('')}</div>`}
function meetingCardV101(m,past=false){const canJoin=!['ended','cancelled'].includes(m.status);const canManage=!!m.can_manage;return `<article class="meet101-card ${escapeHtml(m.status)} ${past?'past':''}"><div class="meet101-card-head"><div><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.description||meet101L('اجتماع داخلي عبر تاسكي','Internal Tasky meeting'))}</p></div><span class="meet101-status ${escapeHtml(m.status)}">${escapeHtml(meetingStatusLabelV101(m.status))}</span></div><div class="meet101-meta"><div><span>${meet101L('الموعد','When')}</span><b>${escapeHtml(meetingDateV101(m.scheduled_at))}</b></div><div><span>${meet101L('المدة','Duration')}</span><b>${Number(m.duration_minutes||30)} ${meet101L('دقيقة','min')}</b></div><div><span>${meet101L('المنظّم','Organizer')}</span><b>${escapeHtml(meetingMemberNameV101(m.created_by))}</b></div><div><span>${meet101L('رمز الاجتماع','Meeting code')}</span><b class="meet101-code">${escapeHtml(m.room_code)}</b></div></div><div class="meet101-participants">${meetingAvatarStackV101(m)}<span class="meet101-audience">${escapeHtml(meetingAudienceLabelV101(m))}${Number(m.attendance_count||0)?` · ${Number(m.attendance_count)} ${meet101L('حضر','attended')}`:''}</span></div><div class="meet101-card-actions">${canJoin?`<button class="primary-btn" onclick="openMeetingJoinConfirmV101('${m.room_code}')"><svg><use href="#i-camera"/></svg>${m.status==='live'?meet101L('انضم الآن','Join now'):meet101L('دخول الاجتماع','Join meeting')}</button>`:''}<button class="chip-btn" onclick="meetingCopyLinkV101('${m.room_code}')">${meet101L('نسخ الرابط','Copy link')}</button>${canManage&&m.status==='scheduled'?`<button class="chip-btn" onclick="openMeetingEditorV101('${m.id}')">${meet101L('تعديل','Edit')}</button><button class="chip-btn" style="color:var(--danger)" onclick="cancelMeetingV101('${m.id}')">${meet101L('إلغاء','Cancel')}</button>`:''}</div></article>`}
function meetingsTemplateV101(){
  if(meetingsLoadingV101&&!meetingsV101.length)return`<div class="meet101-section"><div class="meet101-empty">${meet101L('جارٍ تحميل الاجتماعات…','Loading meetings…')}</div></div>`;
  if(meetingsErrorV101)return`<div class="meet101-section"><div class="meet101-empty"><b>${meet101L('تعذّر تحميل قسم الاجتماعات','Could not load Meetings')}</b><br>${escapeHtml(meetingsErrorV101)}<br><br>${meet101L('شغّل Migration V101 ثم أعد المحاولة.','Run the V101 migration, then retry.')}</div><button class="primary-btn" style="display:block;margin:auto" onclick="taskyRetryModuleV83('meetings')">${meet101L('إعادة المحاولة','Retry')}</button></div>`;
  const current=meetingsV101.filter(m=>m.status==='live'||m.status==='scheduled');const past=meetingsV101.filter(m=>m.status==='ended'||m.status==='cancelled');
  return `<div class="meet101-shell"><div class="meet101-hero"><div><div class="meet101-beta"><i></i> ${meet101L('V101 — Beta للاختبار','V101 — Test Beta')}</div><h2 style="margin-top:9px">${meet101L('اجتماعات تاسكي','Tasky Meetings')}</h2><p>${meet101L('نظّم اجتماعك داخل مساحة العمل وابدأ مكالمة فيديو مباشرة بالكاميرا والمايك ومشاركة الشاشة. رابط الاجتماع يعمل لأعضاء مساحة العمل المصرّح لهم فقط.','Schedule an internal meeting and start a native video call with camera, microphone and screen sharing. Meeting links work only for authorized workspace members.')}</p></div><div class="meet101-actions"><button class="chip-btn" onclick="runMeetingDeviceTestV101()">${meet101L('فحص الجهاز','Device check')}</button><button class="chip-btn" onclick="openJoinMeetingCodeV101()">${meet101L('انضم برمز','Join by code')}</button><button class="primary-btn" onclick="openMeetingEditorV101()"><svg><use href="#i-plus"/></svg>${meet101L('اجتماع جديد','New meeting')}</button></div></div><div class="meet101-note"><b>${meet101L('حدود النسخة التجريبية:','Beta boundary:')}</b> ${meet101L('المكالمة الحالية WebRTC مباشرة بين المشاركين (P2P) مع STUN وإشارات عبر Supabase Realtime. مناسبة لاختبارك الأول ومجموعات صغيرة. قبل الاعتماد العام سنضيف TURN/SFU لتحسين الاتصال على الشبكات المقيدة والاجتماعات الأكبر.','The current call is direct peer-to-peer WebRTC using STUN with Supabase Realtime signaling. It is suitable for the first pilot and small groups. TURN/SFU should be added before broad production use for restrictive networks and larger calls.')}</div><section class="meet101-section"><div class="meet101-section-head"><div><h3>${meet101L('القادمة والمباشرة','Upcoming & live')}</h3><p>${meet101L('الاجتماعات التي يمكنك الوصول إليها في مساحة العمل الحالية.','Meetings you can access in the current workspace.')}</p></div><span class="meet101-beta">${current.length}</span></div>${current.length?`<div class="meet101-grid">${current.map(m=>meetingCardV101(m)).join('')}</div>`:`<div class="meet101-empty">${meet101L('لا توجد اجتماعات قادمة. أنشئ أول اجتماع لتجربة الكاميرا والمايك ومشاركة الشاشة.','No upcoming meetings. Create the first meeting to test camera, microphone and screen sharing.')}</div>`}</section>${past.length?`<section class="meet101-section"><div class="meet101-section-head"><div><h3>${meet101L('السجل','History')}</h3><p>${meet101L('الاجتماعات المنتهية والملغاة تبقى كسجل تنظيمي.','Ended and cancelled meetings remain as organizational history.')}</p></div></div><div class="meet101-grid">${past.slice(0,18).map(m=>meetingCardV101(m,true)).join('')}</div></section>`:''}</div>`
}

const taskyModuleDescriptorBaseV101=taskyModuleDescriptorV83;
taskyModuleDescriptorV83=function(id){if(id==='meetings')return{key:'meetings',load:()=>fetchMeetingsV101()};return taskyModuleDescriptorBaseV101(id)};
const renderModuleBaseV101=renderModule;
renderModule=function(){if(activeNav==='meetings'){const area=document.getElementById('moduleArea');if(area)area.innerHTML=meetingsTemplateV101();return}return renderModuleBaseV101()};

function meetingDefaultLocalDateV101(){const d=new Date(Date.now()+5*60000);d.setSeconds(0,0);const off=d.getTimezoneOffset();return new Date(d.getTime()-off*60000).toISOString().slice(0,16)}
function meetingLocalDateValueV101(v){if(!v)return meetingDefaultLocalDateV101();const d=new Date(v),off=d.getTimezoneOffset();return new Date(d.getTime()-off*60000).toISOString().slice(0,16)}
function meetingAudienceToggleV101(){const all=!!document.getElementById('meet101All')?.checked,wrap=document.getElementById('meet101Members');if(wrap)wrap.style.display=all?'none':'grid'}
function openMeetingEditorV101(id=null){const m=id?meetingByIdV101(id):null;if(m&&!m.can_manage)return;const selected=new Set(meetingInviteIdsV101(m));const all=!m||selected.size===0;const members=teamMembers.filter(x=>x.status==='active'&&x.userId&&x.userId!==currentUserId);document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${m?meet101L('تعديل الاجتماع','Edit meeting'):meet101L('اجتماع جديد','New meeting')}</h3><div class="subtle">${meet101L('الاجتماع داخلي لأعضاء مساحة العمل.','Internal workspace meeting.')}</div></div><button class="modal-close" onclick="closeAddModal()"><svg><use href="#i-x"/></svg></button></div><form onsubmit="submitMeetingV101(event,'${m?.id||''}')"><div class="meet101-form-grid"><div class="field full"><label>${meet101L('عنوان الاجتماع','Meeting title')}</label><input id="meet101Title" maxlength="160" required value="${escapeHtml(m?.title||'')}"></div><div class="field"><label>${meet101L('التاريخ والوقت','Date & time')}</label><input id="meet101When" type="datetime-local" required value="${meetingLocalDateValueV101(m?.scheduled_at)}"></div><div class="field"><label>${meet101L('المدة','Duration')}</label><select id="meet101Duration">${[15,30,45,60,90,120].map(n=>`<option value="${n}" ${Number(m?.duration_minutes||30)===n?'selected':''}>${n} ${meet101L('دقيقة','min')}</option>`).join('')}</select></div><div class="field full"><label>${meet101L('الهدف / الأجندة','Purpose / agenda')}</label><textarea id="meet101Desc" maxlength="5000" rows="4" placeholder="${meet101L('اكتب نقاط الاجتماع أو الهدف منه…','Add the meeting purpose or agenda…')}">${escapeHtml(m?.description||'')}</textarea></div><div class="field full"><label class="form-check"><input id="meet101All" type="checkbox" ${all?'checked':''} onchange="meetingAudienceToggleV101()"><span>${meet101L('دعوة جميع أعضاء مساحة العمل','Invite all workspace members')}</span></label></div><div class="meet101-member-grid full" id="meet101Members" style="${all?'display:none':'display:grid'}">${members.map(x=>`<label class="meet101-member"><input type="checkbox" data-meet101-user value="${x.userId}" ${selected.has(x.userId)?'checked':''}><span>${x.avatarUrl?`<span class="meet101-avatar" style="display:inline-grid;margin:0;background:${x.color}"><img src="${escapeHtml(x.avatarUrl)}" alt=""></span>`:''}<b>${escapeHtml(x.fullName)}</b><small style="display:block;color:var(--muted)">${escapeHtml(x.email||'')}</small></span></label>`).join('')||`<div class="meet101-empty">${meet101L('لا يوجد أعضاء آخرون نشطون.','No other active members.')}</div>`}</div></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap"><button type="button" class="chip-btn" onclick="closeAddModal()">${meet101L('إلغاء','Cancel')}</button>${!m?`<button type="submit" class="chip-btn" data-start-now="1">${meet101L('حفظ وابدأ الآن','Save & start now')}</button>`:''}<button type="submit" class="primary-btn">${m?meet101L('حفظ التعديلات','Save changes'):meet101L('حفظ الاجتماع','Save meeting')}</button></div></form>`;document.getElementById('addModalOverlay').classList.remove('hidden');setTimeout(()=>{if(typeof taskyEnhanceSelects==='function')taskyEnhanceSelects()},0)}
async function submitMeetingV101(e,id){e.preventDefault();const btn=e.submitter;if(btn)btn.disabled=true;const all=!!document.getElementById('meet101All').checked;const inviteeIds=all?[]:[...document.querySelectorAll('[data-meet101-user]:checked')].map(x=>x.value);const startNow=btn?.dataset?.startNow==='1';const when=startNow?new Date().toISOString():new Date(document.getElementById('meet101When').value).toISOString();const args={p_title:document.getElementById('meet101Title').value.trim(),p_description:document.getElementById('meet101Desc').value.trim()||null,p_scheduled_at:when,p_duration_minutes:Number(document.getElementById('meet101Duration').value||30),p_invitee_ids:inviteeIds};try{let res;if(id)res=await sb.rpc('tasky_meeting_update_v101',{p_meeting_id:id,...args});else res=await sb.rpc('tasky_meeting_create_v101',{p_workspace_id:currentWorkspaceId,...args});if(res.error)throw res.error;closeAddModal();await fetchMeetingsV101();renderModule();const roomCode=id?meetingByIdV101(id)?.room_code:res.data?.room_code;taskyToast(id?meet101L('تم تحديث الاجتماع','Meeting updated'):meet101L('تم إنشاء الاجتماع','Meeting created'),{tone:'success'});if(startNow&&roomCode)setTimeout(()=>openMeetingJoinConfirmV101(roomCode),50)}catch(err){showTaskyDialog({title:meet101L('تعذّر حفظ الاجتماع','Could not save meeting'),message:err?.message||String(err),tone:'error'})}finally{if(btn)btn.disabled=false}}
async function cancelMeetingV101(id){const m=meetingByIdV101(id);if(!m?.can_manage)return;const ok=await taskyConfirm(meet101L(`إلغاء اجتماع «${m.title}»؟ سيبقى ظاهرًا في السجل.`,`Cancel “${m.title}”? It will remain in history.`),{title:meet101L('إلغاء الاجتماع','Cancel meeting'),tone:'danger',confirmText:meet101L('إلغاء الاجتماع','Cancel meeting')});if(!ok)return;const {error}=await sb.rpc('tasky_meeting_cancel_v101',{p_meeting_id:id});if(error)return showTaskyDialog({title:meet101L('تعذّر إلغاء الاجتماع','Could not cancel meeting'),message:error.message,tone:'error'});await fetchMeetingsV101();renderModule();taskyToast(meet101L('تم إلغاء الاجتماع','Meeting cancelled'),{tone:'success'})}

function openJoinMeetingCodeV101(prefill=''){document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${meet101L('الانضمام إلى اجتماع','Join a meeting')}</h3><div class="subtle">${meet101L('أدخل رمز الاجتماع المكوّن من 12 حرفًا.','Enter the 12-character meeting code.')}</div></div><button class="modal-close" onclick="closeAddModal()"><svg><use href="#i-x"/></svg></button></div><form onsubmit="joinMeetingCodeSubmitV101(event)"><div class="field"><label>${meet101L('رمز الاجتماع','Meeting code')}</label><input id="meet101Code" class="meet101-code" dir="ltr" maxlength="12" autocomplete="off" value="${escapeHtml(String(prefill||'').toUpperCase())}" required></div><button class="submit-btn" type="submit">${meet101L('متابعة','Continue')}</button></form>`;document.getElementById('addModalOverlay').classList.remove('hidden');setTimeout(()=>document.getElementById('meet101Code')?.focus(),50)}
function joinMeetingCodeSubmitV101(e){e.preventDefault();const code=document.getElementById('meet101Code').value.trim().toUpperCase();closeAddModal();openMeetingJoinConfirmV101(code)}
function openMeetingJoinConfirmV101(roomCode){const m=meetingByCodeV101(roomCode);document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${escapeHtml(m?.title||meet101L('اجتماع تاسكي','Tasky meeting'))}</h3><div class="subtle">${m?escapeHtml(meetingDateV101(m.scheduled_at))+' · ':''}<span class="meet101-code">${escapeHtml(String(roomCode||'').toUpperCase())}</span></div></div><button class="modal-close" onclick="closeAddModal()"><svg><use href="#i-x"/></svg></button></div><div class="meet101-note" style="margin-bottom:12px">${meet101L('عند الضغط على «انضم الآن» سيطلب المتصفح إذن الكاميرا والمايك. يمكنك إيقاف أي منهما بعد الدخول، ومشاركة الشاشة من شريط الاجتماع.','When you click “Join now”, the browser will request camera and microphone access. You can turn either off after joining and share your screen from the meeting controls.')}</div><button class="submit-btn" onclick="closeAddModal();joinMeetingRoomV101('${escapeHtml(String(roomCode||'').toUpperCase())}')">${meet101L('انضم الآن','Join now')}</button>`;document.getElementById('addModalOverlay').classList.remove('hidden')}

async function runMeetingDeviceTestV101(){const secure=window.isSecureContext,rtc=typeof RTCPeerConnection!=='undefined',media=!!navigator.mediaDevices?.getUserMedia,screen=!!navigator.mediaDevices?.getDisplayMedia;let permission='not_tested';let detail='';if(secure&&media){try{const s=await navigator.mediaDevices.getUserMedia({audio:true,video:true});permission='ok';const a=s.getAudioTracks().length,v=s.getVideoTracks().length;detail=meet101L(`تم اكتشاف ${v} كاميرا و${a} مايك ضمن المسار المصرّح.`,`Authorized media stream: ${v} video and ${a} audio track(s).`);s.getTracks().forEach(t=>t.stop())}catch(err){permission='bad';detail=err?.message||String(err)}}document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${meet101L('فحص جهاز الاجتماع','Meeting device check')}</h3><div class="subtle">${meet101L('يتم الفحص محليًا في متصفحك ولا يتم تسجيل الوسائط.','Checks run locally in your browser; media is not recorded.')}</div></div><button class="modal-close" onclick="closeAddModal()"><svg><use href="#i-x"/></svg></button></div><div class="meet101-device-grid">${[[meet101L('اتصال HTTPS','Secure context'),secure],[meet101L('WebRTC','WebRTC'),rtc],[meet101L('كاميرا ومايك','Camera & mic'),media&&permission==='ok'],[meet101L('مشاركة الشاشة','Screen share'),screen]].map(([label,ok])=>`<div class="meet101-device ${ok?'ok':'bad'}"><span>${label}</span><b>${ok?'✓ '+meet101L('جاهز','Ready'):'× '+meet101L('غير جاهز','Unavailable')}</b></div>`).join('')}</div><div class="meet101-note">${escapeHtml(detail||meet101L('إذا فشل إذن الكاميرا أو المايك، فعّل الصلاحية من إعدادات الموقع في المتصفح ثم أعد الفحص.','If camera or microphone permission fails, enable the site permission in your browser settings and run the check again.'))}</div>`;document.getElementById('addModalOverlay').classList.remove('hidden')}

function ensureMeetingRoomDomV101(){let root=document.getElementById('taskyMeetingRoomV101');if(root)return root;root=document.createElement('div');root.id='taskyMeetingRoomV101';root.className='meet101-room hidden';root.innerHTML=`<div class="meet101-room-top"><div class="meet101-room-title"><h2 id="meet101RoomTitle">Tasky Meeting</h2><p><span class="meet101-room-badge"><i></i><span id="meet101RoomMeta">P2P Beta</span></span></p></div><div style="display:flex;gap:7px;align-items:center"><button id="meet101EndBtn" class="meet101-room-end hidden" onclick="endMeetingV101()">${meet101L('إنهاء للجميع','End for all')}</button><button class="meet101-room-end" onclick="leaveMeetingRoomV101()">${meet101L('مغادرة','Leave')}</button></div></div><div class="meet101-room-main"><div class="meet101-video-area"><div id="meet101VideoGrid" class="meet101-video-grid"></div></div><aside class="meet101-side"><h3>${meet101L('المشاركون','Participants')} · <span id="meet101PeerCount">1</span></h3><div id="meet101PeerList"></div><div class="meet101-note" style="margin-top:14px;background:#13231f;border-color:#25473e;color:#aac0ba">${meet101L('نسخة الاختبار لا تسجّل الصوت أو الفيديو ولا تحفظ محتوى مشاركة الشاشة.','The pilot does not record audio/video or store screen-share content.')}</div></aside></div><div class="meet101-room-bottom"><button id="meet101MicBtn" class="meet101-control" onclick="toggleMeetingMicV101()"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg><span>${meet101L('المايك','Mic')}</span></button><button id="meet101CamBtn" class="meet101-control" onclick="toggleMeetingCameraV101()"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3Z"/></svg><span>${meet101L('الكاميرا','Camera')}</span></button><button id="meet101ScreenBtn" class="meet101-control" onclick="toggleMeetingScreenV101()"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M12 13V7m0 0-3 3m3-3 3 3"/></svg><span>${meet101L('مشاركة الشاشة','Share screen')}</span></button><button class="meet101-control danger" onclick="leaveMeetingRoomV101()"><svg viewBox="0 0 24 24"><path d="M5 15c4.8-4 9.2-4 14 0"/><path d="m4 16 3 3M20 16l-3 3"/></svg><span>${meet101L('مغادرة','Leave')}</span></button></div>`;document.body.appendChild(root);return root}
function meetingPeerDomIdV101(peerId){return 'meet101Video_'+String(peerId||'').replace(/[^a-zA-Z0-9_-]/g,'_')}
function meetingRemoteParticipantsV101(){const out=[];for(const [peerId,meta] of meetingRemoteMetaV101.entries())out.push({peerId,...meta});return out}
function meetingFitVideoTileV1025(v){if(!v)return;const apply=()=>{const tile=v.closest('.meet101-video-tile');if(!tile)return;const portrait=Number(v.videoHeight||0)>Number(v.videoWidth||0)*1.08;tile.classList.toggle('portrait',portrait&&!tile.classList.contains('screen'))};if(v.readyState>=1)apply();else v.addEventListener('loadedmetadata',apply,{once:true})}
function meetingRenderRoomV101(){const root=ensureMeetingRoomDomV101();if(!meetingRoomV101){root.classList.add('hidden');return}root.classList.remove('hidden');document.getElementById('meet101RoomTitle').textContent=meetingRoomV101.title||'Tasky Meeting';const rem=meetingRemoteParticipantsV101();document.getElementById('meet101RoomMeta').textContent=`${meetingRoomV101.room_code} · ${rem.length+1} ${meet101L('مشارك','participants')}`;document.getElementById('meet101PeerCount').textContent=String(rem.length+1);document.getElementById('meet101EndBtn')?.classList.toggle('hidden',!meetingRoomV101.can_manage);const me=meetingMeV101();const localVideo=!!meetingScreenTrackV101||!!meetingCameraTrackV101?.enabled;const tiles=[`<div class="meet101-video-tile local ${localVideo?'has-video':''} ${meetingScreenTrackV101?'screen':''}" data-peer="local"><video id="meet101LocalVideo" autoplay muted playsinline></video><div class="meet101-video-avatar">${escapeHtml(me.initials||meetingInitialsV101(me.fullName,me.email))}</div><div class="meet101-video-label"><span>${escapeHtml(me.fullName||me.email||meet101L('أنا','Me'))} (${meet101L('أنت','You')})</span><i>${meetingLocalStateV101.mic?'🎙':'🔇'} ${meetingLocalStateV101.screen?'🖥':''}</i></div></div>`];for(const p of rem){const m=meetingRemoteMetaV101.get(p.peerId)||{},stream=meetingRemoteStreamsV101.get(p.peerId),hasVideo=!!stream?.getVideoTracks?.().length&&(m.camera!==false||m.screen===true);tiles.push(`<div class="meet101-video-tile ${hasVideo?'has-video':''} ${m.screen?'screen':''}" data-peer="${escapeHtml(p.peerId)}"><video id="${meetingPeerDomIdV101(p.peerId)}" autoplay playsinline></video><div class="meet101-video-avatar">${escapeHtml(meetingInitialsV101(m.name||'',m.email||''))}</div><div class="meet101-video-label"><span>${escapeHtml(m.name||meet101L('مشارك','Participant'))}</span><i>${m.mic===false?'🔇':'🎙'} ${m.screen?'🖥':''}</i></div></div>`)}document.getElementById('meet101VideoGrid').innerHTML=tiles.join('');const lv=document.getElementById('meet101LocalVideo');if(lv){lv.srcObject=meetingScreenTrackV101?new MediaStream([meetingScreenTrackV101]):meetingLocalStreamV101;meetingFitVideoTileV1025(lv);lv.play().catch(()=>{})}for(const [peerId,stream] of meetingRemoteStreamsV101.entries()){const v=document.getElementById(meetingPeerDomIdV101(peerId));if(v){v.srcObject=stream;meetingFitVideoTileV1025(v);v.play().catch(()=>{})}}const peerRows=[{name:me.fullName||me.email||meet101L('أنا','Me'),peerId:'local',mic:meetingLocalStateV101.mic,camera:meetingLocalStateV101.camera,screen:meetingLocalStateV101.screen},...rem];document.getElementById('meet101PeerList').innerHTML=peerRows.map((p,i)=>`<div class="meet101-peer-row"><div class="meet101-peer-avatar">${escapeHtml(meetingInitialsV101(p.name||''))}</div><div class="meet101-peer-copy"><b>${escapeHtml(p.name||meet101L('مشارك','Participant'))}${i===0?' · '+meet101L('أنت','You'):''}</b><span>${p.screen?meet101L('يشارك الشاشة','Sharing screen'):p.camera===false?meet101L('الكاميرا متوقفة','Camera off'):meet101L('متصل','Connected')} · ${p.mic===false?meet101L('صامت','Muted'):meet101L('المايك يعمل','Mic on')}</span></div></div>`).join('');document.getElementById('meet101MicBtn')?.classList.toggle('off',!meetingLocalStateV101.mic);document.getElementById('meet101CamBtn')?.classList.toggle('off',!meetingLocalStateV101.camera);document.getElementById('meet101ScreenBtn')?.classList.toggle('active',!!meetingLocalStateV101.screen)}

async function meetingGetLocalMediaV101(){meetingLocalStreamV101=new MediaStream();meetingCameraTrackV101=null;meetingLocalStateV101={mic:false,camera:false,screen:false};if(!navigator.mediaDevices?.getUserMedia)return;try{const portrait=window.matchMedia?.('(orientation: portrait)')?.matches||innerHeight>innerWidth;const video=portrait?{width:{ideal:720},height:{ideal:1280},aspectRatio:{ideal:0.5625},facingMode:{ideal:'user'}}:{width:{ideal:1280},height:{ideal:720},aspectRatio:{ideal:1.7777778},facingMode:{ideal:'user'}};const s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video});s.getTracks().forEach(t=>meetingLocalStreamV101.addTrack(t));meetingCameraTrackV101=s.getVideoTracks()[0]||null;meetingLocalStateV101.mic=s.getAudioTracks().length>0;meetingLocalStateV101.camera=!!meetingCameraTrackV101;return}catch(err){console.warn('V101 camera+mic permission',err)}try{const s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});s.getTracks().forEach(t=>meetingLocalStreamV101.addTrack(t));meetingLocalStateV101.mic=s.getAudioTracks().length>0;meetingLocalStateV101.camera=false;taskyToast(meet101L('تم الدخول بالصوت فقط؛ الكاميرا غير متاحة أو لم تُمنح صلاحيتها.','Joined with audio only; camera is unavailable or permission was not granted.'),{tone:'warning'})}catch(err){console.warn('V101 audio permission',err);taskyToast(meet101L('تم الدخول بدون كاميرا أو مايك. يمكنك مراجعة صلاحيات المتصفح.','Joined without camera or microphone. Check browser permissions.'),{tone:'warning'})}}
function meetingPcConfigV101(){return{iceServers:window.TASKY_MEETING_ICE_SERVERS_V101,iceCandidatePoolSize:4}}
function meetingEnsurePeerV101(remotePeerId){if(meetingPeersV101.has(remotePeerId))return meetingPeersV101.get(remotePeerId);const pc=new RTCPeerConnection(meetingPcConfigV101());meetingPeersV101.set(remotePeerId,pc);meetingPendingIceV101.set(remotePeerId,[]);if(meetingLocalStreamV101)meetingLocalStreamV101.getTracks().forEach(track=>pc.addTrack(track,meetingLocalStreamV101));if(!meetingLocalStreamV101?.getVideoTracks?.().length)pc.addTransceiver('video',{direction:'sendrecv'});pc.onicecandidate=e=>{if(e.candidate)meetingBroadcastSignalV101('ice',{candidate:e.candidate.toJSON?e.candidate.toJSON():e.candidate},remotePeerId)};pc.ontrack=e=>{let stream=meetingRemoteStreamsV101.get(remotePeerId);if(!stream){stream=new MediaStream();meetingRemoteStreamsV101.set(remotePeerId,stream)}if(!stream.getTracks().some(t=>t.id===e.track.id))stream.addTrack(e.track);e.track.onended=()=>meetingRenderRoomV101();meetingRenderRoomV101()};pc.onconnectionstatechange=()=>{const st=pc.connectionState;if(['failed','closed'].includes(st)){if(st==='failed')console.warn('V101 peer connection failed',remotePeerId);if(st==='closed')meetingRemovePeerV101(remotePeerId)}meetingRenderRoomV101()};return pc}
async function meetingCreateOfferV101(remotePeerId){if(!meetingRoomV101||!meetingSubscribedV101)return;const pc=meetingEnsurePeerV101(remotePeerId);if(pc.signalingState!=='stable')return;try{const offer=await pc.createOffer();await pc.setLocalDescription(offer);await meetingBroadcastSignalV101('offer',{sdp:pc.localDescription},remotePeerId)}catch(err){console.warn('V101 create offer',err)}}
async function meetingFlushIceV101(remotePeerId){const pc=meetingPeersV101.get(remotePeerId),q=meetingPendingIceV101.get(remotePeerId)||[];if(!pc?.remoteDescription)return;while(q.length){const c=q.shift();try{await pc.addIceCandidate(c)}catch(err){console.warn('V101 add ICE',err)}}}
async function meetingHandleSignalV101(payload){if(!payload||payload.from===meetingPeerIdV101)return;if(payload.to&&payload.to!=='*'&&payload.to!==meetingPeerIdV101)return;const remote=payload.from;const kind=payload.kind;if(kind==='media-state'){const prev=meetingRemoteMetaV101.get(remote)||{};meetingRemoteMetaV101.set(remote,{...prev,...payload.state});meetingRenderRoomV101();return}if(kind==='meeting-ended'){setTimeout(async()=>{await fetchMeetingsV101();const m=meetingByIdV101(meetingRoomV101?.id);if(m?.status==='ended'){taskyToast(meet101L('أنهى المنظّم الاجتماع','The organizer ended the meeting'),{tone:'warning'});await leaveMeetingRoomV101({silent:true})}},120);return}if(kind==='offer'){const pc=meetingEnsurePeerV101(remote);try{await pc.setRemoteDescription(payload.sdp);await meetingFlushIceV101(remote);const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await meetingBroadcastSignalV101('answer',{sdp:pc.localDescription},remote)}catch(err){console.warn('V101 handle offer',err)}return}if(kind==='answer'){const pc=meetingPeersV101.get(remote);if(!pc)return;try{await pc.setRemoteDescription(payload.sdp);await meetingFlushIceV101(remote)}catch(err){console.warn('V101 handle answer',err)}return}if(kind==='ice'){const pc=meetingEnsurePeerV101(remote);const c=new RTCIceCandidate(payload.candidate);if(pc.remoteDescription){try{await pc.addIceCandidate(c)}catch(err){console.warn('V101 ICE candidate',err)}}else{const q=meetingPendingIceV101.get(remote)||[];q.push(c);meetingPendingIceV101.set(remote,q)}}}
async function meetingBroadcastSignalV101(kind,extra={},to='*'){if(!meetingChannelV101||!meetingSubscribedV101)return;try{await meetingChannelV101.send({type:'broadcast',event:'signal',payload:{kind,from:meetingPeerIdV101,to,...extra}})}catch(err){console.warn('V101 signal send',err)}}
function meetingPresenceSnapshotV101(){const out=new Map();if(!meetingChannelV101)return out;const state=meetingChannelV101.presenceState?.()||{};for(const [key,list] of Object.entries(state)){const p=Array.isArray(list)?list[list.length-1]:list;if(!p)continue;const pid=p.peer_id||key;if(pid===meetingPeerIdV101)continue;out.set(pid,{name:p.name||meet101L('مشارك','Participant'),user_id:p.user_id||null,mic:p.mic!==false,camera:p.camera!==false,screen:!!p.screen})}return out}
function meetingRemovePeerV101(peerId){const pc=meetingPeersV101.get(peerId);if(pc){try{pc.close()}catch{}meetingPeersV101.delete(peerId)}meetingPendingIceV101.delete(peerId);const st=meetingRemoteStreamsV101.get(peerId);if(st)st.getTracks().forEach(t=>{try{t.stop()}catch{}});meetingRemoteStreamsV101.delete(peerId);meetingRemoteMetaV101.delete(peerId);meetingRenderRoomV101()}
async function meetingSyncPresenceV101(){const snap=meetingPresenceSnapshotV101();for(const peerId of [...meetingRemoteMetaV101.keys()])if(!snap.has(peerId))meetingRemovePeerV101(peerId);for(const [peerId,meta] of snap.entries()){meetingRemoteMetaV101.set(peerId,{...(meetingRemoteMetaV101.get(peerId)||{}),...meta});if(String(meetingPeerIdV101)<String(peerId)&&!meetingPeersV101.has(peerId))setTimeout(()=>meetingCreateOfferV101(peerId),80)}meetingRenderRoomV101();await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*')}

async function meetingSessionCheckV101(){if(!meetingRoomV101)return;try{const {data,error}=await sb.rpc('tasky_meeting_session_check_v101',{p_meeting_id:meetingRoomV101.id});if(error)throw error;if(!data?.authorized||['ended','cancelled','missing'].includes(data?.status)){const msg=data?.status==='ended'?meet101L('تم إنهاء الاجتماع','The meeting has ended'):data?.status==='cancelled'?meet101L('تم إلغاء الاجتماع','The meeting was cancelled'):meet101L('لم يعد لديك وصول إلى هذا الاجتماع','You no longer have access to this meeting');await leaveMeetingRoomV101({silent:true});taskyToast(msg,{tone:'warning'})}}catch(err){console.warn('V101 meeting session check',err)}}
function meetingStartSessionWatchV101(){if(meetingSessionTimerV101)clearInterval(meetingSessionTimerV101);meetingSessionTimerV101=setInterval(()=>meetingSessionCheckV101(),30000)}
async function joinMeetingRoomV101(roomCode){if(meetingRoomV101){taskyToast(meet101L('أنت داخل اجتماع بالفعل','You are already in a meeting'),{tone:'warning'});return}if(!window.isSecureContext||typeof RTCPeerConnection==='undefined'){showTaskyDialog({title:meet101L('المتصفح غير جاهز للاجتماعات','Browser not ready for meetings'),message:meet101L('استخدم رابط HTTPS ومتصفحًا حديثًا يدعم WebRTC.','Use HTTPS and a modern browser with WebRTC support.'),tone:'error'});return}const {data,error}=await sb.rpc('tasky_meeting_join_v101',{p_workspace_id:currentWorkspaceId,p_room_code:String(roomCode||'').trim().toUpperCase()});if(error)return showTaskyDialog({title:meet101L('تعذّر الانضمام','Could not join meeting'),message:error.message,tone:'error'});meetingRoomV101=data;meetingPeerIdV101=`${currentUserId}:${crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}`;meetingPeersV101.clear();meetingRemoteStreamsV101.clear();meetingRemoteMetaV101.clear();meetingPendingIceV101.clear();await meetingGetLocalMediaV101();ensureMeetingRoomDomV101();meetingRenderRoomV101();const me=meetingMeV101(),topic=`tasky-meeting-signal:${data.signal_token}`;meetingChannelV101=sb.channel(topic,{config:{broadcast:{self:false},presence:{key:meetingPeerIdV101}}}).on('broadcast',{event:'signal'},({payload})=>meetingHandleSignalV101(payload)).on('presence',{event:'sync'},()=>meetingSyncPresenceV101()).subscribe(async status=>{if(status==='SUBSCRIBED'){meetingSubscribedV101=true;try{await meetingChannelV101.track({peer_id:meetingPeerIdV101,user_id:currentUserId,name:me.fullName||me.email||'Tasky user',mic:meetingLocalStateV101.mic,camera:meetingLocalStateV101.camera,screen:false,joined_at:new Date().toISOString()})}catch(err){console.warn('V101 presence track',err)}meetingRenderRoomV101()}else if(['CHANNEL_ERROR','TIMED_OUT'].includes(status)){taskyToast(meet101L('تعذّر فتح قناة الاجتماع. تحقق من الاتصال ثم حاول مجددًا.','Meeting signaling channel failed. Check your connection and retry.'),{tone:'error'})}});meetingStartSessionWatchV101();await fetchMeetingsV101();if(activeNav==='meetings')renderModule()}

async function toggleMeetingMicV101(){if(!meetingLocalStreamV101)return;const tracks=meetingLocalStreamV101.getAudioTracks();if(!tracks.length){taskyToast(meet101L('لا يوجد مسار مايك مصرح به','No authorized microphone track'),{tone:'warning'});return}const on=!tracks[0].enabled;tracks.forEach(t=>t.enabled=on);meetingLocalStateV101.mic=on;meetingRenderRoomV101();await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*')}
async function toggleMeetingCameraV101(){if(!meetingCameraTrackV101){taskyToast(meet101L('الكاميرا غير متاحة. راجع صلاحيات المتصفح ثم أعد الدخول للاجتماع.','Camera unavailable. Check browser permissions and rejoin the meeting.'),{tone:'warning'});return}meetingCameraTrackV101.enabled=!meetingCameraTrackV101.enabled;meetingLocalStateV101.camera=meetingCameraTrackV101.enabled;meetingRenderRoomV101();await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*')}
async function toggleMeetingScreenV101(){if(meetingScreenTrackV101){await stopMeetingScreenV101();return}if(!navigator.mediaDevices?.getDisplayMedia){taskyToast(meet101L('مشاركة الشاشة غير مدعومة في هذا المتصفح','Screen sharing is not supported in this browser'),{tone:'warning'});return}try{const s=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});const track=s.getVideoTracks()[0];if(!track)return;meetingScreenTrackV101=track;for(const pc of meetingPeersV101.values()){const sender=pc.getSenders().find(x=>x.track?.kind==='video');if(sender)await sender.replaceTrack(track)}meetingLocalStateV101.screen=true;meetingRenderRoomV101();await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*');track.onended=()=>stopMeetingScreenV101().catch(()=>{})}catch(err){if(err?.name!=='NotAllowedError')showTaskyDialog({title:meet101L('تعذرت مشاركة الشاشة','Could not share screen'),message:err?.message||String(err),tone:'error'})}}
async function stopMeetingScreenV101(){const old=meetingScreenTrackV101;meetingScreenTrackV101=null;if(old){try{old.onended=null;old.stop()}catch{}}for(const pc of meetingPeersV101.values()){const sender=pc.getSenders().find(x=>x.track?.kind==='video');if(sender)await sender.replaceTrack(meetingCameraTrackV101||null)}meetingLocalStateV101.screen=false;meetingRenderRoomV101();await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*')}
async function endMeetingV101(){if(!meetingRoomV101?.can_manage)return;const ok=await taskyConfirm(meet101L('إنهاء الاجتماع لجميع المشاركين؟','End the meeting for all participants?'),{title:meet101L('إنهاء الاجتماع','End meeting'),tone:'danger',confirmText:meet101L('إنهاء','End')});if(!ok)return;const {error}=await sb.rpc('tasky_meeting_end_v101',{p_meeting_id:meetingRoomV101.id});if(error)return showTaskyDialog({title:meet101L('تعذّر إنهاء الاجتماع','Could not end meeting'),message:error.message,tone:'error'});await meetingBroadcastSignalV101('meeting-ended',{},'*');await leaveMeetingRoomV101({silent:true});taskyToast(meet101L('تم إنهاء الاجتماع','Meeting ended'),{tone:'success'})}
async function leaveMeetingRoomV101({silent=false,skipFetch=false}={}){const room=meetingRoomV101;if(!room)return;meetingRoomV101=null;meetingSubscribedV101=false;if(meetingSessionTimerV101){clearInterval(meetingSessionTimerV101);meetingSessionTimerV101=null}if(meetingScreenTrackV101){try{meetingScreenTrackV101.stop()}catch{}meetingScreenTrackV101=null}if(meetingLocalStreamV101){meetingLocalStreamV101.getTracks().forEach(t=>{try{t.stop()}catch{}});meetingLocalStreamV101=null}meetingCameraTrackV101=null;for(const id of [...meetingPeersV101.keys()])meetingRemovePeerV101(id);meetingRemoteMetaV101.clear();meetingRemoteStreamsV101.clear();meetingPendingIceV101.clear();if(meetingChannelV101){try{await meetingChannelV101.untrack()}catch{}try{await sb.removeChannel(meetingChannelV101)}catch{}meetingChannelV101=null}meetingPeerIdV101=null;ensureMeetingRoomDomV101().classList.add('hidden');try{await sb.rpc('tasky_meeting_leave_v101',{p_meeting_id:room.id})}catch{}if(!skipFetch){await fetchMeetingsV101();if(activeNav==='meetings')renderModule()}if(!silent)taskyToast(meet101L('غادرت الاجتماع','You left the meeting'),{tone:'success'})}

function taskyMeetingHandleDeepLinkV101(){if(meetingDeepLinkHandledV101||!currentWorkspaceId)return;const code=new URL(location.href).searchParams.get('meeting');if(!code)return;meetingDeepLinkHandledV101=true;setActiveNav('meetings');taskyEnsureModuleLoadedV83('meetings',{force:true}).then(()=>setTimeout(()=>openMeetingJoinConfirmV101(code),100))}
const loadWorkspaceAndDataBaseV101=loadWorkspaceAndData;
loadWorkspaceAndData=async function(...args){const ok=await loadWorkspaceAndDataBaseV101(...args);if(ok)setTimeout(taskyMeetingHandleDeepLinkV101,80);return ok};
const signOutUserBaseV101=signOutUser;
signOutUser=async function(){if(meetingRoomV101)await leaveMeetingRoomV101({silent:true,skipFetch:true});return signOutUserBaseV101()};
window.addEventListener('beforeunload',()=>{try{meetingLocalStreamV101?.getTracks().forEach(t=>t.stop());meetingScreenTrackV101?.stop();for(const pc of meetingPeersV101.values())pc.close()}catch{}});
setTimeout(()=>{try{renderNav();if(currentWorkspaceId)taskyMeetingHandleDeepLinkV101()}catch(err){console.warn('V101 meetings init',err)}},0);


/* --- source script: taskyV102GuestMeetingsScript --- */

/* ================= V102 — EXTERNAL GUEST MEETINGS BETA ================= */
window.TASKY_BUILD='V102.5';console.info('Tasky build',window.TASKY_BUILD);
const meet102L=(ar,en)=>lang==='ar'?ar:en;
let meetingGuestSessionV102=null;
let meetingGuestPublicV102=null;

function meetingGuestLinkUrlV102(roomCode,guestToken){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('meeting',String(roomCode||'').toUpperCase());u.searchParams.set('guest',guestToken);return u.toString()}
async function meetingCopyGuestLinkV102(meetingId){const {data,error}=await sb.rpc('tasky_meeting_guest_link_v102',{p_meeting_id:meetingId});if(error)return showTaskyDialog({title:meet102L('تعذّر إنشاء رابط الضيف','Could not get guest link'),message:error.message,tone:'error'});const ok=await meetingCopyTextV101(meetingGuestLinkUrlV102(data.room_code,data.guest_token));taskyToast(ok?meet102L('تم نسخ رابط الدخول الخارجي بدون تسجيل','External no-login guest link copied'):meet102L('تعذّر نسخ الرابط','Could not copy link'),{tone:ok?'success':'warning'})}
async function meetingRegenerateGuestLinkV102(meetingId){const m=meetingByIdV101(meetingId);if(!m?.can_manage)return;const ok=await taskyConfirm(meet102L('إلغاء رابط الضيوف الحالي وإنشاء رابط جديد؟ الرابط القديم سيتوقف فورًا، وسيتم إخراج الضيوف الذين دخلوا به خلال فحص الجلسة الدوري.','Revoke the current guest link and create a new one? The old link will stop working, and guests who joined with it will be removed by the periodic session check.'),{title:meet102L('تغيير رابط الضيوف','Rotate guest link'),tone:'danger',confirmText:meet102L('إنشاء رابط جديد','Create new link')});if(!ok)return;const {data,error}=await sb.rpc('tasky_meeting_regenerate_guest_link_v102',{p_meeting_id:meetingId});if(error)return showTaskyDialog({title:meet102L('تعذّر تغيير الرابط','Could not rotate guest link'),message:error.message,tone:'error'});await meetingCopyTextV101(meetingGuestLinkUrlV102(data.room_code,data.guest_token));await fetchMeetingsV101();renderModule();taskyToast(meet102L('تم إلغاء الرابط القديم ونسخ الرابط الجديد','Old link revoked and new guest link copied'),{tone:'success'})}
async function meetingDisableGuestAccessV102(meetingId){const m=meetingByIdV101(meetingId);if(!m?.can_manage||!m.allow_guests)return;const ok=await taskyConfirm(meet102L('إيقاف دخول الضيوف الخارجيين لهذا الاجتماع؟ سيتم إلغاء رابط الضيف الحالي، وسيتم إخراج أي ضيف دخل به خلال فحص الجلسة الدوري.','Disable external guest access for this meeting? The current guest link will be revoked, and guests who joined with it will be removed by the periodic session check.'),{title:meet102L('إيقاف دخول الضيوف','Disable guest access'),tone:'danger',confirmText:meet102L('إيقاف','Disable')});if(!ok)return;const {error}=await sb.rpc('tasky_meeting_update_v102',{p_meeting_id:m.id,p_title:m.title,p_description:m.description||null,p_scheduled_at:m.scheduled_at,p_duration_minutes:Number(m.duration_minutes||30),p_invitee_ids:meetingInviteIdsV101(m),p_allow_guests:false});if(error)return showTaskyDialog({title:meet102L('تعذّر إيقاف دخول الضيوف','Could not disable guest access'),message:error.message,tone:'error'});await fetchMeetingsV101();renderModule();taskyToast(meet102L('تم إلغاء رابط الضيف وإيقاف الدخول الخارجي','Guest link revoked and external access disabled'),{tone:'success'})}


const fetchMeetingsBaseV102=fetchMeetingsV101;
fetchMeetingsV101=async function(){if(!currentWorkspaceId)return[];meetingsLoadingV101=true;meetingsErrorV101='';try{const {data,error}=await sb.rpc('tasky_meeting_list_v102',{p_workspace_id:currentWorkspaceId});if(error)throw error;meetingsV101=Array.isArray(data)?data:[];return meetingsV101}catch(err){meetingsErrorV101=err?.message||String(err);console.warn('Tasky V102 meetings',err);meetingsV101=[];return[]}finally{meetingsLoadingV101=false}};

meetingCardV101=function(m,past=false){const canJoin=!['ended','cancelled'].includes(m.status);const canManage=!!m.can_manage;const guests=Number(m.guest_attendance_count||0);return `<article class="meet101-card ${escapeHtml(m.status)} ${past?'past':''}"><div class="meet101-card-head"><div><div class="meet102-title-row"><h3>${escapeHtml(m.title)}</h3>${m.allow_guests?`<span class="meet102-guest-badge">${meet102L('دخول خارجي','External guests')}</span>`:''}</div><p>${escapeHtml(m.description||meet102L('اجتماع عبر تاسكي','Tasky meeting'))}</p></div><span class="meet101-status ${escapeHtml(m.status)}">${escapeHtml(meetingStatusLabelV101(m.status))}</span></div><div class="meet101-meta"><div><span>${meet102L('الموعد','When')}</span><b>${escapeHtml(meetingDateV101(m.scheduled_at))}</b></div><div><span>${meet102L('المدة','Duration')}</span><b>${Number(m.duration_minutes||30)} ${meet102L('دقيقة','min')}</b></div><div><span>${meet102L('المنظّم','Organizer')}</span><b>${escapeHtml(meetingMemberNameV101(m.created_by))}</b></div><div><span>${meet102L('رمز الاجتماع','Meeting code')}</span><b class="meet101-code">${escapeHtml(m.room_code)}</b></div></div><div class="meet101-participants">${meetingAvatarStackV101(m)}<span class="meet101-audience">${escapeHtml(meetingAudienceLabelV101(m))}${Number(m.attendance_count||0)?` · ${Number(m.attendance_count)} ${meet102L('حضر','attended')}`:''}${guests?` · ${guests} ${meet102L('ضيف خارجي','external guest(s)')}`:''}</span></div><div class="meet101-card-actions">${canJoin?`<button class="primary-btn" onclick="openMeetingJoinConfirmV101('${m.room_code}')"><svg><use href="#i-camera"/></svg>${m.status==='live'?meet102L('انضم الآن','Join now'):meet102L('دخول الاجتماع','Join meeting')}</button>`:''}<button class="chip-btn" onclick="meetingCopyLinkV101('${m.room_code}')">${meet102L('رابط الأعضاء','Member link')}</button>${canManage&&m.allow_guests&&!past&&!['ended','cancelled'].includes(m.status)?`<button class="chip-btn meet102-guest-link-btn" onclick="meetingCopyGuestLinkV102('${m.id}')">${meet102L('رابط ضيف بدون تسجيل','No-login guest link')}</button><button class="chip-btn" onclick="meetingRegenerateGuestLinkV102('${m.id}')">${meet102L('تغيير رابط الضيوف','Rotate guest link')}</button><button class="chip-btn" style="color:var(--danger)" onclick="meetingDisableGuestAccessV102('${m.id}')">${meet102L('إيقاف دخول الضيوف','Disable guests')}</button>`:''}${canManage&&m.status==='scheduled'?`<button class="chip-btn" onclick="openMeetingEditorV101('${m.id}')">${meet102L('تعديل','Edit')}</button><button class="chip-btn" style="color:var(--danger)" onclick="cancelMeetingV101('${m.id}')">${meet102L('إلغاء','Cancel')}</button>`:''}</div></article>`};

meetingsTemplateV101=function(){if(meetingsLoadingV101&&!meetingsV101.length)return`<div class="meet101-section"><div class="meet101-empty">${meet102L('جارٍ تحميل الاجتماعات…','Loading meetings…')}</div></div>`;if(meetingsErrorV101)return`<div class="meet101-section"><div class="meet101-empty"><b>${meet102L('تعذّر تحميل قسم الاجتماعات','Could not load Meetings')}</b><br>${escapeHtml(meetingsErrorV101)}<br><br>${meet102L('شغّل Migration V102 بعد V101 ثم أعد المحاولة.','Run the V102 migration after V101, then retry.')}</div><button class="primary-btn" style="display:block;margin:auto" onclick="taskyRetryModuleV83('meetings')">${meet102L('إعادة المحاولة','Retry')}</button></div>`;const current=meetingsV101.filter(m=>m.status==='live'||m.status==='scheduled'),past=meetingsV101.filter(m=>m.status==='ended'||m.status==='cancelled');return `<div class="meet101-shell"><div class="meet101-hero"><div><div class="meet101-beta"><i></i> ${meet102L('V102 — Beta للاختبار الخارجي','V102 — External Guest Beta')}</div><h2 style="margin-top:9px">${meet102L('اجتماعات تاسكي','Tasky Meetings')}</h2><p>${meet102L('اجتماعات فيديو أصلية داخل تاسكي. لكل اجتماع يمكنك إبقاؤه داخليًا فقط، أو تفعيل رابط ضيف خارجي يسمح بالدخول بدون إنشاء حساب تاسكي.','Native video meetings inside Tasky. Keep each meeting internal-only, or explicitly enable a guest link that allows external participants to join without a Tasky account.')}</p></div><div class="meet101-actions"><button class="chip-btn" onclick="runMeetingDeviceTestV101()">${meet102L('فحص الجهاز','Device check')}</button><button class="chip-btn" onclick="openJoinMeetingCodeV101()">${meet102L('انضم برمز','Join by code')}</button><button class="primary-btn" onclick="openMeetingEditorV101()"><svg><use href="#i-plus"/></svg>${meet102L('اجتماع جديد','New meeting')}</button></div></div><div class="meet102-security-note"><b>${meet102L('الدخول الخارجي اختياري لكل اجتماع:','External access is per-meeting and opt-in:')}</b> ${meet102L('رابط الأعضاء ما زال يحتاج تسجيل الدخول. رابط الضيف بدون تسجيل يحتوي رمزًا سريًا عالي العشوائية؛ أي شخص يحصل على الرابط يستطيع طلب الدخول بعد أن يبدأ المنظّم الاجتماع. يمكنك إلغاء الرابط وإنشاء رابط جديد في أي وقت.','The member link still requires sign-in. The no-login guest link contains a high-entropy secret; anyone who receives it can request entry after the organizer starts the meeting. You can revoke and rotate the guest link at any time.')}</div><div class="meet101-note"><b>${meet102L('حدود النسخة التجريبية:','Beta boundary:')}</b> ${meet102L('الاتصال WebRTC P2P مع STUN وإشارات Supabase Realtime. لا يتم تسجيل الصوت أو الفيديو. قبل الاعتماد العام للاجتماعات سنضيف TURN/SFU لاختبار الشبكات المقيدة والاجتماعات الأكبر.','Calls use P2P WebRTC with STUN and Supabase Realtime signaling. Audio/video is not recorded. TURN/SFU remains required before broad meeting production rollout for restrictive networks and larger calls.')}</div><section class="meet101-section"><div class="meet101-section-head"><div><h3>${meet102L('القادمة والمباشرة','Upcoming & live')}</h3><p>${meet102L('الاجتماعات التي يمكنك الوصول إليها في مساحة العمل الحالية.','Meetings you can access in the current workspace.')}</p></div><span class="meet101-beta">${current.length}</span></div>${current.length?`<div class="meet101-grid">${current.map(m=>meetingCardV101(m)).join('')}</div>`:`<div class="meet101-empty">${meet102L('لا توجد اجتماعات قادمة.','No upcoming meetings.')}</div>`}</section>${past.length?`<section class="meet101-section"><div class="meet101-section-head"><div><h3>${meet102L('السجل','History')}</h3><p>${meet102L('الاجتماعات المنتهية والملغاة وسجل الحضور الأساسي.','Ended/cancelled meetings and basic attendance history.')}</p></div></div><div class="meet101-grid">${past.slice(0,18).map(m=>meetingCardV101(m,true)).join('')}</div></section>`:''}</div>`};

openMeetingEditorV101=function(id=null){const m=id?meetingByIdV101(id):null;if(m&&!m.can_manage)return;const selected=new Set(meetingInviteIdsV101(m)),all=!m||selected.size===0,members=teamMembers.filter(x=>x.status==='active'&&x.userId&&x.userId!==currentUserId);document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${m?meet102L('تعديل الاجتماع','Edit meeting'):meet102L('اجتماع جديد','New meeting')}</h3><div class="subtle">${meet102L('حدد من يمكنه الدخول: أعضاء تاسكي، وضيوف خارجيون اختياريًا عبر رابط منفصل.','Choose who can join: Tasky members, plus optional external guests through a separate link.')}</div></div><button class="modal-close" onclick="closeAddModal()"><svg><use href="#i-x"/></svg></button></div><form onsubmit="submitMeetingV101(event,'${m?.id||''}')"><div class="meet101-form-grid"><div class="field full"><label>${meet102L('عنوان الاجتماع','Meeting title')}</label><input id="meet101Title" maxlength="160" required value="${escapeHtml(m?.title||'')}"></div><div class="field"><label>${meet102L('التاريخ والوقت','Date & time')}</label><input id="meet101When" type="datetime-local" required value="${meetingLocalDateValueV101(m?.scheduled_at)}"></div><div class="field"><label>${meet102L('المدة','Duration')}</label><select id="meet101Duration">${[15,30,45,60,90,120].map(n=>`<option value="${n}" ${Number(m?.duration_minutes||30)===n?'selected':''}>${n} ${meet102L('دقيقة','min')}</option>`).join('')}</select></div><div class="field full"><label>${meet102L('الهدف / الأجندة','Purpose / agenda')}</label><textarea id="meet101Desc" maxlength="5000" rows="4" placeholder="${meet102L('اكتب نقاط الاجتماع أو الهدف منه…','Add the meeting purpose or agenda…')}">${escapeHtml(m?.description||'')}</textarea></div><div class="field full"><label class="form-check"><input id="meet101All" type="checkbox" ${all?'checked':''} onchange="meetingAudienceToggleV101()"><span>${meet102L('دعوة جميع أعضاء مساحة العمل','Invite all workspace members')}</span></label></div><div class="meet101-member-grid full" id="meet101Members" style="${all?'display:none':'display:grid'}">${members.map(x=>`<label class="meet101-member"><input type="checkbox" data-meet101-user value="${x.userId}" ${selected.has(x.userId)?'checked':''}><span>${x.avatarUrl?`<span class="meet101-avatar" style="display:inline-grid;margin:0;background:${x.color}"><img src="${escapeHtml(x.avatarUrl)}" alt=""></span>`:''}<b>${escapeHtml(x.fullName)}</b><small style="display:block;color:var(--muted)">${escapeHtml(x.email||'')}</small></span></label>`).join('')||`<div class="meet101-empty">${meet102L('لا يوجد أعضاء آخرون نشطون.','No other active members.')}</div>`}</div><div class="field full meet102-guest-setting"><label class="form-check"><input id="meet102AllowGuests" type="checkbox" ${m?.allow_guests?'checked':''}><span><b>${meet102L('السماح لضيوف خارجيين بالدخول بدون حساب تاسكي','Allow external guests to join without a Tasky account')}</b><small>${meet102L('ينشئ تاسكي رابط ضيف منفصلًا. لا تشارك هذا الرابط إلا مع الأشخاص المقصودين. الضيف لا يستطيع بدء الاجتماع؛ يجب أن يبدأه المنظّم أولًا.','Tasky creates a separate guest link. Share it only with intended participants. A guest cannot start the meeting; the organizer must start it first.')}</small></span></label></div></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap"><button type="button" class="chip-btn" onclick="closeAddModal()">${meet102L('إلغاء','Cancel')}</button>${!m?`<button type="submit" class="chip-btn" data-start-now="1">${meet102L('حفظ وابدأ الآن','Save & start now')}</button>`:''}<button type="submit" class="primary-btn">${m?meet102L('حفظ التعديلات','Save changes'):meet102L('حفظ الاجتماع','Save meeting')}</button></div></form>`;document.getElementById('addModalOverlay').classList.remove('hidden');setTimeout(()=>{if(typeof taskyEnhanceSelects==='function')taskyEnhanceSelects()},0)};

submitMeetingV101=async function(e,id){e.preventDefault();const btn=e.submitter;if(btn)btn.disabled=true;const all=!!document.getElementById('meet101All').checked,inviteeIds=all?[]:[...document.querySelectorAll('[data-meet101-user]:checked')].map(x=>x.value),startNow=btn?.dataset?.startNow==='1',when=startNow?new Date().toISOString():new Date(document.getElementById('meet101When').value).toISOString(),args={p_title:document.getElementById('meet101Title').value.trim(),p_description:document.getElementById('meet101Desc').value.trim()||null,p_scheduled_at:when,p_duration_minutes:Number(document.getElementById('meet101Duration').value||30),p_invitee_ids:inviteeIds,p_allow_guests:!!document.getElementById('meet102AllowGuests')?.checked};try{let res;if(id)res=await sb.rpc('tasky_meeting_update_v102',{p_meeting_id:id,...args});else res=await sb.rpc('tasky_meeting_create_v102',{p_workspace_id:currentWorkspaceId,...args});if(res.error)throw res.error;closeAddModal();await fetchMeetingsV101();renderModule();const roomCode=id?meetingByIdV101(id)?.room_code:res.data?.room_code;taskyToast(id?meet102L('تم تحديث الاجتماع','Meeting updated'):meet102L('تم إنشاء الاجتماع','Meeting created'),{tone:'success'});if(startNow&&roomCode)setTimeout(()=>openMeetingJoinConfirmV101(roomCode),50)}catch(err){showTaskyDialog({title:meet102L('تعذّر حفظ الاجتماع','Could not save meeting'),message:err?.message||String(err),tone:'error'})}finally{if(btn)btn.disabled=false}};

const meetingMeBaseV102=meetingMeV101;
meetingMeV101=function(){if(meetingGuestSessionV102){const n=meetingGuestSessionV102.name||meet102L('ضيف','Guest');return{fullName:n,email:meetingGuestSessionV102.email||'',initials:meetingInitialsV101(n,meetingGuestSessionV102.email||''),color:'var(--green)',avatarUrl:null}}return meetingMeBaseV102()};

function meet102GuestScreen(){let s=document.getElementById('taskyPublicMeetingGuestV102');if(!s){s=document.createElement('div');s.id='taskyPublicMeetingGuestV102';s.className='meet102-guest-screen';document.body.appendChild(s)}return s}
function meet102GuestFrameV102(body){const s=meet102GuestScreen();s.innerHTML=`<div class="meet102-guest-shell"><div class="meet102-guest-brand">${getTaskyWordmarkMarkup(lang)}</div>${body}</div>`;s.classList.remove('hidden')}
function meet102GuestStatusTextV102(status){return status==='live'?meet102L('الاجتماع مباشر الآن','Meeting is live'):status==='scheduled'?meet102L('بانتظار أن يبدأ المنظّم الاجتماع','Waiting for the organizer to start'):status==='ended'?meet102L('انتهى الاجتماع','Meeting ended'):status==='cancelled'?meet102L('تم إلغاء الاجتماع','Meeting cancelled'):status}
async function showPublicMeetingGuestPortalV102(roomCode,guestToken){taskyBootHideV83?.();meetingGuestPublicV102={roomCode:String(roomCode||'').trim().toUpperCase(),guestToken:String(guestToken||'').trim(),info:null};meet102GuestFrameV102(`<div class="meet102-guest-card"><div class="meet102-guest-loading">${meet102L('جارٍ التحقق من رابط الاجتماع…','Checking meeting link…')}</div></div>`);const {data,error}=await sb.rpc('tasky_public_meeting_guest_info_v102',{p_room_code:meetingGuestPublicV102.roomCode,p_guest_token:meetingGuestPublicV102.guestToken});if(error||!data?.available){meet102GuestFrameV102(`<div class="meet102-guest-card"><h1>${meet102L('رابط الاجتماع غير متاح','Meeting link unavailable')}</h1><p>${escapeHtml(error?.message||meet102L('الرابط غير صحيح، تم إلغاؤه، أو تم إنشاء رابط ضيوف جديد.','The link is invalid, revoked, or a newer guest link was generated.'))}</p></div>`);return}meetingGuestPublicV102.info=data;renderPublicMeetingGuestPortalV102()}
function renderPublicMeetingGuestPortalV102(){const p=meetingGuestPublicV102,i=p?.info;if(!p||!i)return;const terminal=['ended','cancelled'].includes(i.status);const live=i.status==='live';meet102GuestFrameV102(`<div class="meet102-guest-card"><div class="meet102-guest-org">${escapeHtml(i.workspace_name||'Tasky')}</div><div class="meet102-guest-status ${escapeHtml(i.status)}">${escapeHtml(meet102GuestStatusTextV102(i.status))}</div><h1>${escapeHtml(i.title||meet102L('اجتماع تاسكي','Tasky meeting'))}</h1>${i.description?`<p class="meet102-guest-desc">${escapeHtml(i.description)}</p>`:''}<div class="meet102-guest-meta"><div><span>${meet102L('الموعد','When')}</span><b>${escapeHtml(meetingDateV101(i.scheduled_at))}</b></div><div><span>${meet102L('المدة','Duration')}</span><b>${Number(i.duration_minutes||30)} ${meet102L('دقيقة','min')}</b></div><div><span>${meet102L('رمز الاجتماع','Meeting code')}</span><b class="meet101-code">${escapeHtml(i.room_code)}</b></div></div>${terminal?`<div class="meet102-public-note danger">${i.status==='ended'?meet102L('هذا الاجتماع انتهى ولم يعد يقبل دخولًا جديدًا.','This meeting has ended and no longer accepts new joins.'):meet102L('تم إلغاء هذا الاجتماع.','This meeting was cancelled.')}</div>`:`<form onsubmit="joinPublicMeetingGuestV102(event)" class="meet102-guest-form"><div class="field full"><label>${meet102L('اسمك الذي سيظهر للمشاركين','Your display name')}</label><input id="meet102GuestName" maxlength="120" autocomplete="name" required placeholder="${meet102L('الاسم الكامل','Full name')}"></div><div class="field"><label>${meet102L('الجهة / الشركة — اختياري','Company / organization — optional')}</label><input id="meet102GuestCompany" maxlength="200" autocomplete="organization"></div><div class="field"><label>${meet102L('البريد الإلكتروني — اختياري','Email — optional')}</label><input id="meet102GuestEmail" type="email" maxlength="320" autocomplete="email"></div><div class="meet102-public-note full"><b>${meet102L('الخصوصية:','Privacy:')}</b> ${meet102L('سيظهر اسمك للمشاركين، ويُحفظ اسمك والبيانات الاختيارية التي تدخلها في سجل حضور الاجتماع. لا يقوم V102 بتسجيل الصوت أو الفيديو أو محتوى مشاركة الشاشة.','Your name is visible to meeting participants, and your name plus any optional details you enter are stored in the meeting attendance log. V102 does not record audio, video, or screen-share content.')}</div>${live?`<button class="submit-btn full" type="submit">${meet102L('الدخول للاجتماع بدون تسجيل','Join meeting without signing in')}</button>`:`<button class="submit-btn full" type="button" disabled>${meet102L('بانتظار بدء المنظّم','Waiting for organizer')}</button><button class="chip-btn full" type="button" onclick="showPublicMeetingGuestPortalV102('${escapeHtml(p.roomCode)}','${escapeHtml(p.guestToken)}')">${meet102L('تحديث حالة الاجتماع','Refresh meeting status')}</button>`}</form>`}<div class="meet102-public-foot">${meet102L('رابط الضيف يمنح الوصول لهذا الاجتماع فقط، ولا ينشئ حسابًا ولا يمنح وصولًا إلى مساحة عمل تاسكي.','The guest link grants access only to this meeting. It does not create an account or grant access to the Tasky workspace.')}</div></div>`)}

async function joinPublicMeetingGuestV102(e){e.preventDefault();if(meetingRoomV101)return;if(!window.isSecureContext||typeof RTCPeerConnection==='undefined'){return showTaskyDialog({title:meet102L('المتصفح غير جاهز للاجتماعات','Browser not ready for meetings'),message:meet102L('استخدم HTTPS ومتصفحًا حديثًا يدعم WebRTC.','Use HTTPS and a modern browser with WebRTC support.'),tone:'error'})}const p=meetingGuestPublicV102,name=document.getElementById('meet102GuestName')?.value.trim()||'',email=document.getElementById('meet102GuestEmail')?.value.trim()||'',company=document.getElementById('meet102GuestCompany')?.value.trim()||'',btn=e.submitter;if(!name){return showTaskyDialog({title:meet102L('أدخل اسم الضيف','Enter a guest name'),message:meet102L('يمكن أن يكون الاسم حرفًا أو رقمًا أو رمزًا واحدًا فقط؛ المطلوب فقط ألا يكون الحقل فارغًا.','The name may be a single letter, number, or symbol; it only needs to be non-empty.'),tone:'error'})}if(btn)btn.disabled=true;try{const {data,error}=await sb.rpc('tasky_public_meeting_guest_join_v102',{p_room_code:p.roomCode,p_guest_token:p.guestToken,p_guest_name:name,p_guest_email:email||null,p_guest_company:company||null});if(error)throw error;meetingGuestSessionV102={id:data.guest_session_id,token:data.guest_session_token,name:data.guest_name||name,email:data.guest_email||email,company:data.guest_company||company,roomCode:p.roomCode,guestToken:p.guestToken};meetingRoomV101=data;meetingPeerIdV101=`guest:${data.guest_session_id}:${crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}`;meetingPeersV101.clear();meetingRemoteStreamsV101.clear();meetingRemoteMetaV101.clear();meetingPendingIceV101.clear();await meetingGetLocalMediaV101();meet102GuestScreen().classList.add('hidden');ensureMeetingRoomDomV101();meetingRenderRoomV101();const topic=`tasky-meeting-signal:${data.signal_token}`,presenceName=`${meet102L('ضيف','Guest')} · ${meetingGuestSessionV102.name}`;meetingChannelV101=sb.channel(topic,{config:{broadcast:{self:false},presence:{key:meetingPeerIdV101}}}).on('broadcast',{event:'signal'},({payload})=>meetingHandleSignalV101(payload)).on('presence',{event:'sync'},()=>meetingSyncPresenceV101()).subscribe(async status=>{if(status==='SUBSCRIBED'){meetingSubscribedV101=true;try{await meetingChannelV101.track({peer_id:meetingPeerIdV101,user_id:null,guest:true,name:presenceName,mic:meetingLocalStateV101.mic,camera:meetingLocalStateV101.camera,screen:false,joined_at:new Date().toISOString()})}catch(err){console.warn('V102 guest presence',err)}meetingRenderRoomV101()}else if(['CHANNEL_ERROR','TIMED_OUT'].includes(status)){taskyToast(meet102L('تعذّر فتح قناة الاجتماع. تحقق من الاتصال ثم حاول مجددًا.','Meeting signaling channel failed. Check your connection and retry.'),{tone:'error'})}});meetingStartSessionWatchV101()}catch(err){showTaskyDialog({title:meet102L('تعذّر الدخول للاجتماع','Could not join meeting'),message:err?.message||String(err),tone:'error'});if(btn)btn.disabled=false}}

const meetingSessionCheckBaseV102=meetingSessionCheckV101;
meetingSessionCheckV101=async function(){if(!meetingGuestSessionV102)return meetingSessionCheckBaseV102();if(!meetingRoomV101)return;try{const {data,error}=await sb.rpc('tasky_public_meeting_guest_session_check_v102',{p_guest_session_id:meetingGuestSessionV102.id,p_guest_session_token:meetingGuestSessionV102.token});if(error)throw error;if(!data?.authorized){const msg=data?.status==='ended'?meet102L('أنهى المنظّم الاجتماع','The organizer ended the meeting'):data?.status==='cancelled'?meet102L('تم إلغاء الاجتماع','The meeting was cancelled'):!data?.guest_access_enabled?meet102L('أوقف المنظّم دخول الضيوف','The organizer disabled guest access'):!data?.link_current?meet102L('تم إلغاء رابط الضيف وإنشاء رابط جديد','This guest link was revoked and rotated'):meet102L('انتهت صلاحية جلسة الضيف','Your guest session is no longer valid');await leaveMeetingRoomV101({silent:true,skipFetch:true});renderPublicMeetingGuestExitV102(msg)}}catch(err){console.warn('V102 guest session check',err)}};

const meetingHandleSignalBaseV102=meetingHandleSignalV101;
meetingHandleSignalV101=async function(payload){if(meetingGuestSessionV102&&payload?.kind==='meeting-ended'){const msg=meet102L('أنهى المنظّم الاجتماع','The organizer ended the meeting');await leaveMeetingRoomV101({silent:true,skipFetch:true});renderPublicMeetingGuestExitV102(msg);return}return meetingHandleSignalBaseV102(payload)};

const leaveMeetingRoomBaseV102=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){if(!meetingGuestSessionV102)return leaveMeetingRoomBaseV102(opts);const sess={...meetingGuestSessionV102};await leaveMeetingRoomBaseV102({silent:true,skipFetch:true});try{await sb.rpc('tasky_public_meeting_guest_leave_v102',{p_guest_session_id:sess.id,p_guest_session_token:sess.token})}catch{}meetingGuestSessionV102=null;if(!opts.silent)renderPublicMeetingGuestExitV102(meet102L('غادرت الاجتماع','You left the meeting'))};

function renderPublicMeetingGuestExitV102(message){const p=meetingGuestPublicV102;if(!p)return;meet102GuestFrameV102(`<div class="meet102-guest-card meet102-exit"><div class="meet102-exit-check">✓</div><h1>${escapeHtml(message||meet102L('تمت مغادرة الاجتماع','You left the meeting'))}</h1><p>${meet102L('يمكنك تحديث حالة رابط الاجتماع إذا احتجت للعودة وكان الاجتماع ما زال مباشرًا.','You can refresh the meeting link status if you need to rejoin while the meeting is still live.')}</p><button class="submit-btn" onclick="showPublicMeetingGuestPortalV102('${escapeHtml(p.roomCode)}','${escapeHtml(p.guestToken)}')">${meet102L('العودة إلى صفحة الاجتماع','Back to meeting page')}</button></div>`)}

if(window.__taskyV102PublicMeeting){setTimeout(()=>showPublicMeetingGuestPortalV102(window.__taskyV102PublicMeeting.roomCode,window.__taskyV102PublicMeeting.guestToken),0)}
/* ================= /V102 — EXTERNAL GUEST MEETINGS BETA ================= */



/* --- source script: tasky-v103-meeting-collab-js --- */

/* Tasky V103 — Meeting Collaboration Suite */
window.TASKY_BUILD='V103';
let meetingV103DrawerTab='chat',meetingV103Chat=[],meetingV103Waiting=[],meetingV103ChatTimer=null,meetingV103WaitingTimer=null,meetingV103Recording=null,meetingV103RecordingChunks=[],meetingV103WaitingRequest=null;
function meet103L(ar,en){return lang==='ar'?ar:en}
function meetingV103IsGuest(){return typeof meetingGuestSessionV102!=='undefined'&&!!meetingGuestSessionV102}
function meetingV103MeetingId(){return meetingRoomV101?.id||null}
function meetingV103GuestArgs(){return meetingV103IsGuest()?{p_guest_session_id:meetingGuestSessionV102.id,p_guest_session_token:meetingGuestSessionV102.token}:{p_guest_session_id:null,p_guest_session_token:null}}
function meetingV103EscapeMentions(s){return escapeHtml(String(s||'')).replace(/(^|\s)@([\p{L}\p{N}_.-]+)/gu,'$1<span class="meet103-mention">@$2</span>')}

function meetingEnhanceRoomV103(){const root=document.getElementById('taskyMeetingRoomV101');if(!root||!meetingRoomV101)return;const top=root.querySelector('.meet101-room-top>div:last-child');if(top&&!document.getElementById('meet103Tools')){const tools=document.createElement('div');tools.id='meet103Tools';tools.className='meet103-tools';tools.innerHTML=`<button class="meet103-pill" onclick="meetingOpenDrawerV103('chat')">💬 <span>${meet103L('الدردشة','Chat')}</span></button><button class="meet103-pill" onclick="meetingOpenDrawerV103('people')">👥 <span>${meet103L('الحضور','People')}</span></button>${meetingRoomV101.can_manage?`<button class="meet103-pill" onclick="meetingOpenDrawerV103('waiting')">⏳ <span>${meet103L('الانتظار','Waiting')}</span><b id="meet103WaitingBadge" style="display:none">0</b></button>`:''}<button class="meet103-pill" onclick="meetingToggleReactionsV103()">😊</button>${meetingRoomV101.can_manage?`<button id="meet103RecordBtn" class="meet103-pill" onclick="meetingToggleRecordingV103()">⏺ <span>${meet103L('تسجيل محلي','Local record')}</span></button>`:''}`;top.prepend(tools)}if(!document.getElementById('meet103Drawer')){const d=document.createElement('aside');d.id='meet103Drawer';d.className='meet103-drawer';d.innerHTML=`<div class="meet103-drawer-head"><h3 id="meet103DrawerTitle"></h3><button class="meet103-mini" onclick="meetingCloseDrawerV103()">✕</button></div><div class="meet103-tabs"><button data-v103-tab="chat" onclick="meetingSetDrawerTabV103('chat')">${meet103L('الدردشة','Chat')}</button><button data-v103-tab="people" onclick="meetingSetDrawerTabV103('people')">${meet103L('الحضور','People')}</button>${meetingRoomV101.can_manage?`<button data-v103-tab="waiting" onclick="meetingSetDrawerTabV103('waiting')">${meet103L('الانتظار','Waiting')}</button>`:''}</div><div id="meet103DrawerBody" class="meet103-drawer-body"></div><div id="meet103ChatCompose"></div>`;document.body.appendChild(d)}meetingV103RenderDrawer();meetingV103StartPolling()}
function meetingOpenDrawerV103(tab='chat'){meetingV103DrawerTab=tab;meetingEnhanceRoomV103();document.getElementById('meet103Drawer')?.classList.add('open');meetingV103RenderDrawer()}
function meetingCloseDrawerV103(){document.getElementById('meet103Drawer')?.classList.remove('open')}
function meetingSetDrawerTabV103(tab){meetingV103DrawerTab=tab;meetingV103RenderDrawer()}
function meetingV103StartPolling(){if(!meetingV103ChatTimer)meetingV103ChatTimer=setInterval(()=>meetingV103FetchChat(false),2500);if(meetingRoomV101?.can_manage&&!meetingV103WaitingTimer)meetingV103WaitingTimer=setInterval(()=>meetingV103FetchWaiting(false),2000);meetingV103FetchChat(false);if(meetingRoomV101?.can_manage)meetingV103FetchWaiting(false)}
function meetingV103StopPolling(){clearInterval(meetingV103ChatTimer);clearInterval(meetingV103WaitingTimer);meetingV103ChatTimer=meetingV103WaitingTimer=null;meetingV103Chat=[];meetingV103Waiting=[]}

function meetingV103RenderDrawer(){const d=document.getElementById('meet103Drawer');if(!d)return;d.querySelectorAll('[data-v103-tab]').forEach(x=>x.classList.toggle('active',x.dataset.v103Tab===meetingV103DrawerTab));const title=document.getElementById('meet103DrawerTitle'),body=document.getElementById('meet103DrawerBody'),compose=document.getElementById('meet103ChatCompose');if(!body||!compose)return;if(meetingV103DrawerTab==='chat'){title.textContent=meet103L('دردشة الاجتماع','Meeting chat');body.innerHTML=`<div class="meet103-chat-list">${meetingV103Chat.length?meetingV103Chat.map(m=>`<div class="meet103-chat-msg ${m.mine?'mine':''}"><b>${escapeHtml(m.sender_name||meet103L('مشارك','Participant'))}</b><p>${meetingV103EscapeMentions(m.body||'')}</p>${m.attachment_id?`<div class="meet103-inline"><button class="meet103-mini" onclick="meetingV103OpenAttachment('${m.attachment_id}')">📎 ${escapeHtml(m.file_name||meet103L('مرفق','Attachment'))}</button></div>`:''}<small>${typeof platformDate==='function'?platformDate(m.created_at,true):new Date(m.created_at).toLocaleTimeString()}</small></div>`).join(''):`<div class="meet101-empty">${meet103L('ابدأ المحادثة مع الحضور.','Start the conversation.')}</div>`}</div>`;const peerNames=meetingRemoteParticipantsV101().map(p=>(meetingRemoteMetaV101.get(p.peerId)||{}).name).filter(Boolean);compose.innerHTML=`<div class="meet103-filebar"><label for="meet103File">📎 ${meet103L('إرفاق ملف','Attach file')}</label><input id="meet103File" type="file" accept="image/png,image/jpeg,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation" onchange="meetingV103FilePicked(this)"><button type="button" onclick="meetingV103InsertMention()">@ ${meet103L('منشن','Mention')}</button><span class="subtle" style="color:#78908a">${meetingV103IsGuest()?meet103L('رفع الملفات للأعضاء المسجلين فقط','File upload is for signed-in members only'):meet103L('ملفات خاصة حتى 10MB','Private files up to 10MB')}</span></div><div class="meet103-chat-compose"><textarea id="meet103ChatInput" maxlength="2000" placeholder="${meet103L('اكتب رسالة… استخدم @ للمنشن','Write a message… use @ to mention')}"></textarea><button onclick="meetingV103SendChat()">${meet103L('إرسال','Send')}</button></div>`;return}compose.innerHTML='';if(meetingV103DrawerTab==='waiting'){title.textContent=meet103L('غرفة الانتظار','Waiting room');body.innerHTML=meetingV103Waiting.length?meetingV103Waiting.map(w=>`<div class="meet103-wait-card"><h4>${escapeHtml(w.display_name||meet103L('ضيف','Guest'))}</h4><p>${escapeHtml(w.guest_company||'')} ${w.guest_email?'· '+escapeHtml(w.guest_email):''}</p><div class="meet103-inline"><button class="meet103-mini good" onclick="meetingV103DecideWaiting('${w.id}','admitted')">${meet103L('قبول','Admit')}</button><button class="meet103-mini bad" onclick="meetingV103DecideWaiting('${w.id}','denied')">${meet103L('رفض','Deny')}</button></div></div>`).join(''):`<div class="meet101-empty">${meet103L('لا يوجد أحد في غرفة الانتظار.','Nobody is waiting.')}</div>`;return}title.textContent=meet103L('الحضور والتحكم','Participants & controls');const me=meetingMeV101(),rows=[{peerId:'local',name:me.fullName||me.email||meet103L('أنا','Me'),local:true,...meetingLocalStateV101},...meetingRemoteParticipantsV101().map(p=>({peerId:p.peerId,...(meetingRemoteMetaV101.get(p.peerId)||{})}))];body.innerHTML=rows.map(r=>`<div class="meet103-person"><h4>${escapeHtml(r.name||meet103L('مشارك','Participant'))}${r.local?' · '+meet103L('أنت','You'):''}</h4><p>${r.mic===false?'🔇':'🎙'} ${r.camera===false?'📷✕':'📷'} ${r.guest?'· '+meet103L('ضيف','Guest'):''}</p>${meetingRoomV101.can_manage&&!r.local?`<div class="meet103-inline"><button class="meet103-mini" onclick="meetingV103SendControl('${escapeHtml(r.peerId)}','mute')">${meet103L('كتم','Mute')}</button><button class="meet103-mini" onclick="meetingV103SendControl('${escapeHtml(r.peerId)}','request_unmute')">${meet103L('طلب فتح المايك','Ask to unmute')}</button><button class="meet103-mini good" onclick="meetingV103SendControl('${escapeHtml(r.peerId)}','invite_speak')">${meet103L('طلب المشاركة','Invite to speak')}</button></div>`:''}</div>`).join('')}

async function meetingV103FetchChat(render=true){if(!meetingRoomV101)return;try{const {data,error}=await sb.rpc('tasky_meeting_chat_list_v103',{p_meeting_id:meetingRoomV101.id,...meetingV103GuestArgs()});if(error)throw error;meetingV103Chat=data||[];if(render||document.getElementById('meet103Drawer')?.classList.contains('open'))meetingV103RenderDrawer()}catch(e){console.warn('V103 chat fetch',e)}}
async function meetingV103SendChat(){const el=document.getElementById('meet103ChatInput');const body=el?.value.trim()||'';if(!body&&!meetingV103PendingAttachment)return;try{const mentions=(body.match(/@[\p{L}\p{N}_.-]+/gu)||[]).map(x=>x.slice(1));const {error}=await sb.rpc('tasky_meeting_chat_send_v103',{p_meeting_id:meetingRoomV101.id,p_body:body||null,p_mentions:mentions,p_attachment_id:meetingV103PendingAttachment?.id||null,...meetingV103GuestArgs()});if(error)throw error;if(el)el.value='';meetingV103PendingAttachment=null;await meetingV103FetchChat(true);await meetingBroadcastSignalV101('v103-chat-poke',{},'*')}catch(e){showTaskyDialog({title:meet103L('تعذّر إرسال الرسالة','Could not send message'),message:e.message||String(e),tone:'error'})}}
function meetingV103InsertMention(){const input=document.getElementById('meet103ChatInput');if(!input)return;const names=meetingRemoteParticipantsV101().map(p=>(meetingRemoteMetaV101.get(p.peerId)||{}).name).filter(Boolean);if(!names.length)return taskyToast(meet103L('لا يوجد مشاركون آخرون للمنشن','No other participants to mention'),{tone:'warning'});const choice=prompt(meet103L('اكتب اسم المشارك للمنشن:\n','Enter participant name to mention:\n')+names.join('\n'),names[0]);if(choice)input.value+=(input.value?' ':'')+'@'+String(choice).trim().replace(/\s+/g,'_')+' '}
let meetingV103PendingAttachment=null;
async function meetingV103FilePicked(input){const f=input.files?.[0];if(!f)return;if(meetingV103IsGuest()){input.value='';return showTaskyDialog({title:meet103L('رفع الملفات للأعضاء المسجلين','Signed-in members only'),message:meet103L('لأسباب أمنية، رفع الملفات من رابط الضيف غير مفعّل. يمكن للضيوف استخدام الدردشة، بينما يرفع الملفات أعضاء مساحة العمل المسجلون فقط.','For security, file upload from anonymous guest links is disabled. Guests can chat, while only signed-in workspace members can upload files.'),tone:'warning'})}if(f.size>10*1024*1024){input.value='';return taskyToast(meet103L('الحد الأقصى 10MB','Maximum file size is 10MB'),{tone:'error'})}const ok=['image/png','image/jpeg','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation'];if(!ok.includes(f.type)){input.value='';return taskyToast(meet103L('نوع الملف غير مسموح لأسباب أمنية','File type is not allowed for security reasons'),{tone:'error'})}try{const safe=(f.name||'file').replace(/[^a-zA-Z0-9._-]+/g,'_');const path=`${meetingRoomV101.id}/${crypto.randomUUID?crypto.randomUUID():Date.now()}_${safe}`;const up=await sb.storage.from('meeting-chat-files').upload(path,f,{upsert:false,contentType:f.type,cacheControl:'3600'});if(up.error)throw up.error;const reg=await sb.rpc('tasky_meeting_attachment_register_v103',{p_meeting_id:meetingRoomV101.id,p_storage_path:path,p_file_name:f.name,p_mime_type:f.type,p_size_bytes:f.size});if(reg.error)throw reg.error;meetingV103PendingAttachment=reg.data;taskyToast(meet103L('تم تجهيز المرفق للإرسال','Attachment ready to send'));meetingV103RenderDrawer()}catch(e){showTaskyDialog({title:meet103L('تعذّر إرفاق الملف','Could not attach file'),message:e.message||String(e),tone:'error'})}}
async function meetingV103OpenAttachment(id){if(meetingV103IsGuest())return showTaskyDialog({title:meet103L('المرفقات للأعضاء المسجلين','Attachments for signed-in members'),message:meet103L('رابط الضيف لا يمنح وصولًا مباشرًا إلى ملفات مساحة العمل. هذا القيد مقصود للأمان.','Guest links do not grant direct access to workspace files. This restriction is intentional for security.'),tone:'warning'});try{const {data,error}=await sb.rpc('tasky_meeting_attachment_get_v103',{p_attachment_id:id});if(error)throw error;const s=await sb.storage.from('meeting-chat-files').createSignedUrl(data.storage_path,60);if(s.error)throw s.error;window.open(s.data.signedUrl,'_blank','noopener')}catch(e){showTaskyDialog({title:meet103L('تعذّر فتح المرفق','Could not open attachment'),message:e.message||String(e),tone:'error'})}}

async function meetingV103FetchWaiting(render=true){if(!meetingRoomV101?.can_manage)return;try{const {data,error}=await sb.rpc('tasky_meeting_waiting_list_v103',{p_meeting_id:meetingRoomV101.id});if(error)throw error;meetingV103Waiting=data||[];const b=document.getElementById('meet103WaitingBadge');if(b){b.textContent=String(meetingV103Waiting.length);b.style.display=meetingV103Waiting.length?'grid':'none'}if(render||meetingV103DrawerTab==='waiting')meetingV103RenderDrawer()}catch(e){console.warn('V103 waiting fetch',e)}}
async function meetingV103DecideWaiting(id,status){const {error}=await sb.rpc('tasky_meeting_waiting_decide_v103',{p_request_id:id,p_decision:status});if(error)return showTaskyDialog({title:meet103L('تعذّر تحديث غرفة الانتظار','Could not update waiting room'),message:error.message,tone:'error'});await meetingV103FetchWaiting(true)}

async function meetingV103SendControl(peerId,action){await meetingBroadcastSignalV101('v103-control',{action},peerId);taskyToast(action==='mute'?meet103L('تم إرسال أمر الكتم','Mute command sent'):action==='request_unmute'?meet103L('تم طلب فتح المايك','Unmute request sent'):meet103L('تم طلب المشاركة','Participation request sent'))}
async function meetingV103HandleControl(payload){const a=payload.action;if(a==='mute'){const tracks=meetingLocalStreamV101?.getAudioTracks?.()||[];tracks.forEach(t=>t.enabled=false);meetingLocalStateV101.mic=false;meetingRenderRoomV101();await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*');return taskyToast(meet103L('قام منظم الاجتماع بكتم المايك','The organizer muted your microphone'),{tone:'warning'})}if(a==='request_unmute'||a==='invite_speak'){const msg=a==='request_unmute'?meet103L('يطلب منظم الاجتماع منك فتح المايك. هل توافق؟','The organizer is asking you to unmute. Allow?'):meet103L('يدعوك منظم الاجتماع للمشاركة. هل تريد فتح المايك؟','The organizer invites you to speak. Turn on your microphone?');if(await taskyConfirm(msg)){const tracks=meetingLocalStreamV101?.getAudioTracks?.()||[];if(tracks.length){tracks.forEach(t=>t.enabled=true);meetingLocalStateV101.mic=true;meetingRenderRoomV101();await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*')}else taskyToast(meet103L('لا يوجد مسار مايك مصرح به','No authorized microphone track'),{tone:'warning'})}}}

let meetingV103ReactionsOpen=false;
function meetingToggleReactionsV103(){const old=document.getElementById('meet103Reactions');if(old){old.remove();meetingV103ReactionsOpen=false;return}const d=document.createElement('div');d.id='meet103Reactions';d.className='meet103-reactions';d.innerHTML=['👍','👏','❤️','😂','🎉','🤔','🙋'].map(x=>`<button onclick="meetingV103React('${x}')">${x}</button>`).join('');document.body.appendChild(d);meetingV103ReactionsOpen=true}
async function meetingV103React(emoji){meetingV103ShowReaction(emoji,meetingMeV101()?.fullName||meetingGuestSessionV102?.name||'');await meetingBroadcastSignalV101('v103-reaction',{emoji,name:meetingMeV101()?.fullName||meetingGuestSessionV102?.name||''},'*')}
function meetingV103ShowReaction(emoji,name){const d=document.createElement('div');d.className='meet103-float-reaction';d.style.setProperty('--drift',`${Math.round((Math.random()-.5)*150)}px`);d.textContent=emoji;d.title=name||'';document.body.appendChild(d);setTimeout(()=>d.remove(),2500)}

async function meetingToggleRecordingV103(){if(!meetingRoomV101?.can_manage)return;if(meetingV103Recording){meetingV103Recording.stop();return}if(!navigator.mediaDevices?.getDisplayMedia||typeof MediaRecorder==='undefined')return showTaskyDialog({title:meet103L('التسجيل غير مدعوم هنا','Recording is not supported here'),message:meet103L('التسجيل المحلي التجريبي يحتاج متصفح سطح مكتب يدعم مشاركة الشاشة وMediaRecorder. لا يتم رفع التسجيل إلى تاسكي.','Local beta recording requires a desktop browser with screen capture and MediaRecorder. Recordings are not uploaded to Tasky.'),tone:'warning'});if(!(await taskyConfirm(meet103L('سيطلب المتصفح اختيار تبويب/نافذة للتسجيل. أبلغ جميع المشاركين قبل البدء. التسجيل سيُحفظ محليًا على جهازك فقط. هل تبدأ؟','Your browser will ask you to choose a tab/window to record. Inform all participants before starting. The recording is saved only on your device. Start?'))))return;try{const s=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});const rec=new MediaRecorder(s,{mimeType:MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm'});meetingV103RecordingChunks=[];rec.ondataavailable=e=>{if(e.data?.size)meetingV103RecordingChunks.push(e.data)};rec.onstop=async()=>{meetingV103Recording=null;s.getTracks().forEach(t=>t.stop());const blob=new Blob(meetingV103RecordingChunks,{type:'video/webm'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Tasky-Meeting-${meetingRoomV101?.room_code||Date.now()}.webm`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);document.getElementById('meet103RecordBtn')?.classList.remove('active');document.getElementById('meet103RecordingBadge')?.remove();await meetingBroadcastSignalV101('v103-recording-state',{active:false},'*')};rec.start(1000);meetingV103Recording=rec;document.getElementById('meet103RecordBtn')?.classList.add('active');const meta=document.getElementById('meet101RoomMeta')?.parentElement;if(meta&&!document.getElementById('meet103RecordingBadge'))meta.insertAdjacentHTML('beforeend',` <span id="meet103RecordingBadge" class="meet103-recording"><i></i>${meet103L('تسجيل','REC')}</span>`);await meetingBroadcastSignalV101('v103-recording-state',{active:true},'*')}catch(e){showTaskyDialog({title:meet103L('تعذّر بدء التسجيل','Could not start recording'),message:e.message||String(e),tone:'error'})}}
function meetingV103RecordingNotice(active){const meta=document.getElementById('meet101RoomMeta')?.parentElement;if(active){if(meta&&!document.getElementById('meet103RecordingBadge'))meta.insertAdjacentHTML('beforeend',` <span id="meet103RecordingBadge" class="meet103-recording"><i></i>${meet103L('تسجيل','REC')}</span>`);taskyToast(meet103L('بدأ منظم الاجتماع تسجيلًا محليًا','The organizer started a local recording'),{tone:'warning'})}else document.getElementById('meet103RecordingBadge')?.remove()}

function meetingV103PrettyInvite(roomCode,guestUrl=null){const m=meetingsV101.find(x=>x.room_code===roomCode)||meetingRoomV101||{};const memberUrl=meetingLinkV101(roomCode);return `${meet103L('دعوة اجتماع تاسكي','Tasky meeting invitation')}\n${m.title||''}\n${meet103L('الموعد','When')}: ${m.scheduled_at?meetingDateV101(m.scheduled_at):''}\n${meet103L('الرابط','Link')}: ${guestUrl||memberUrl}\n${meet103L('رمز الاجتماع','Meeting code')}: ${roomCode}`}
async function meetingShareInviteV103(roomCode){try{const m=meetingsV101.find(x=>x.room_code===roomCode);let guestUrl=null;if(m?.allow_guests&&m?.can_manage){const r=await sb.rpc('tasky_meeting_guest_link_v102',{p_meeting_id:m.id});if(!r.error&&r.data?.guest_url)guestUrl=r.data.guest_url}const url=guestUrl||meetingLinkV101(roomCode),text=meetingV103PrettyInvite(roomCode,guestUrl);if(navigator.share)await navigator.share({title:m?.title||'Tasky Meeting',text,url});else{await navigator.clipboard.writeText(text);taskyToast(meet103L('تم نسخ دعوة الاجتماع','Meeting invitation copied'))}}catch(e){if(e?.name!=='AbortError')taskyToast(meet103L('تعذّر مشاركة الدعوة','Could not share invitation'),{tone:'error'})}}

const meetingCardBaseV103=meetingCardV101;meetingCardV101=function(m,past=false){let h=meetingCardBaseV103(m,past);if(!past&&!['ended','cancelled'].includes(m.status))h=h.replace('</div></article>',`<button class="chip-btn" onclick="meetingShareInviteV103('${m.room_code}')">✨ ${meet103L('دعوة','Invite')}</button></div></article>`);return h};
const meetingRenderRoomBaseV103=meetingRenderRoomV101;meetingRenderRoomV101=function(){meetingRenderRoomBaseV103();if(!meetingRoomV101)return;const g=document.getElementById('meet101VideoGrid');if(g){const n=g.children.length;g.classList.remove('meet103-count-1','meet103-count-2','meet103-count-3','meet103-count-4','meet103-count-many','meet103-has-screen');g.classList.add(n<=1?'meet103-count-1':n===2?'meet103-count-2':n===3?'meet103-count-3':n===4?'meet103-count-4':'meet103-count-many');if(g.querySelector('.screen'))g.classList.add('meet103-has-screen')}meetingEnhanceRoomV103();if(meetingV103DrawerTab==='people'&&document.getElementById('meet103Drawer')?.classList.contains('open'))meetingV103RenderDrawer()};
const meetingHandleSignalBaseV103=meetingHandleSignalV101;meetingHandleSignalV101=async function(payload){if(payload?.kind==='v103-control'){if(payload.to&&payload.to!=='*'&&payload.to!==meetingPeerIdV101)return;return meetingV103HandleControl(payload)}if(payload?.kind==='v103-reaction'){meetingV103ShowReaction(payload.emoji||'👍',payload.name||'');return}if(payload?.kind==='v103-chat-poke'){meetingV103FetchChat(true);return}if(payload?.kind==='v103-recording-state'){meetingV103RecordingNotice(!!payload.active);return}return meetingHandleSignalBaseV103(payload)};
const leaveMeetingRoomBaseV103=leaveMeetingRoomV101;leaveMeetingRoomV101=async function(opts={}){meetingV103StopPolling();document.getElementById('meet103Drawer')?.remove();document.getElementById('meet103Reactions')?.remove();if(meetingV103Recording){try{meetingV103Recording.stop()}catch{}}return leaveMeetingRoomBaseV103(opts)};

/* V103 guest waiting room: external guests request admission first. */
const joinPublicMeetingGuestBaseV103=joinPublicMeetingGuestV102;joinPublicMeetingGuestV102=async function(e){e.preventDefault();if(meetingRoomV101)return;const p=meetingGuestPublicV102,name=document.getElementById('meet102GuestName')?.value.trim()||'',email=document.getElementById('meet102GuestEmail')?.value.trim()||'',company=document.getElementById('meet102GuestCompany')?.value.trim()||'',btn=e.submitter;if(!name)return showTaskyDialog({title:meet103L('أدخل اسم الضيف','Enter a guest name'),message:meet103L('يكفي أي حرف أو رقم أو رمز واحد؛ الحقل فقط يجب ألا يكون فارغًا.','Any single letter, number, or symbol is enough; the field only needs to be non-empty.'),tone:'error'});if(btn)btn.disabled=true;try{const r=await sb.rpc('tasky_public_meeting_waiting_request_v103',{p_room_code:p.roomCode,p_guest_token:p.guestToken,p_guest_name:name,p_guest_email:email||null,p_guest_company:company||null});if(r.error)throw r.error;if(r.data?.waiting_required===false){if(btn)btn.disabled=false;return joinPublicMeetingGuestBaseV103(e)}meetingV103WaitingRequest={...r.data,roomCode:p.roomCode,guestToken:p.guestToken,name,email,company};meetingV103ShowGuestWaiting();meetingV103PollGuestWaiting()}catch(err){showTaskyDialog({title:meet103L('تعذّر طلب الدخول','Could not request admission'),message:err.message||String(err),tone:'error'});if(btn)btn.disabled=false}};
function meetingV103ShowGuestWaiting(){let d=document.getElementById('meet103GuestWaiting');if(!d){d=document.createElement('div');d.id='meet103GuestWaiting';d.className='meet103-wait-screen';document.body.appendChild(d)}d.innerHTML=`<div class="meet103-wait-box"><h2>${meet103L('أنت في غرفة الانتظار','You are in the waiting room')}</h2><div class="meet103-wait-spinner"></div><p>${meet103L('تم إرسال طلبك إلى منظم الاجتماع. ستدخل تلقائيًا بعد الموافقة.','Your request was sent to the organizer. You will enter automatically after approval.')}</p><button class="chip-btn" onclick="meetingV103CancelGuestWait()">${meet103L('إلغاء','Cancel')}</button></div>`}
let meetingV103GuestWaitTimer=null;async function meetingV103PollGuestWaiting(){clearInterval(meetingV103GuestWaitTimer);const run=async()=>{const w=meetingV103WaitingRequest;if(!w)return;try{const r=await sb.rpc('tasky_public_meeting_waiting_status_v103',{p_request_id:w.request_id,p_request_token:w.request_token});if(r.error)throw r.error;if(r.data?.status==='denied'){clearInterval(meetingV103GuestWaitTimer);meetingV103WaitingRequest=null;document.getElementById('meet103GuestWaiting')?.remove();return showTaskyDialog({title:meet103L('لم تتم الموافقة على الدخول','Admission was not approved'),message:meet103L('رفض منظم الاجتماع طلب الدخول.','The organizer denied the admission request.'),tone:'warning'})}if(r.data?.status==='admitted'){clearInterval(meetingV103GuestWaitTimer);const j=await sb.rpc('tasky_public_meeting_waiting_join_v103',{p_request_id:w.request_id,p_request_token:w.request_token,p_room_code:w.roomCode,p_guest_token:w.guestToken});if(j.error)throw j.error;document.getElementById('meet103GuestWaiting')?.remove();meetingV103WaitingRequest=null;await meetingV103EnterGuestAfterAdmission(j.data,w)}}catch(e){console.warn('V103 guest wait',e)}};await run();meetingV103GuestWaitTimer=setInterval(run,1800)}
function meetingV103CancelGuestWait(){clearInterval(meetingV103GuestWaitTimer);meetingV103WaitingRequest=null;document.getElementById('meet103GuestWaiting')?.remove()}
async function meetingV103EnterGuestAfterAdmission(data,w){meetingGuestSessionV102={id:data.guest_session_id,token:data.guest_session_token,name:data.guest_name||w.name,email:data.guest_email||w.email,company:data.guest_company||w.company,roomCode:w.roomCode,guestToken:w.guestToken};meetingRoomV101=data;meetingPeerIdV101=`guest:${data.guest_session_id}:${crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}`;meetingPeersV101.clear();meetingRemoteStreamsV101.clear();meetingRemoteMetaV101.clear();meetingPendingIceV101.clear();await meetingGetLocalMediaV101();meet102GuestScreen().classList.add('hidden');ensureMeetingRoomDomV101();meetingRenderRoomV101();const topic=`tasky-meeting-signal:${data.signal_token}`,presenceName=`${meet103L('ضيف','Guest')} · ${meetingGuestSessionV102.name}`;meetingChannelV101=sb.channel(topic,{config:{broadcast:{self:false},presence:{key:meetingPeerIdV101}}}).on('broadcast',{event:'signal'},({payload})=>meetingHandleSignalV101(payload)).on('presence',{event:'sync'},()=>meetingSyncPresenceV101()).subscribe(async status=>{if(status==='SUBSCRIBED'){meetingSubscribedV101=true;await meetingChannelV101.track({peer_id:meetingPeerIdV101,user_id:null,guest:true,name:presenceName,mic:meetingLocalStateV101.mic,camera:meetingLocalStateV101.camera,screen:false,joined_at:new Date().toISOString()}).catch(()=>{});meetingRenderRoomV101()}});meetingStartSessionWatchV101()}


/* --- source script: tasky-v104-meetings-readiness-js --- */

window.TASKY_BUILD='V104';console.info('Tasky build',window.TASKY_BUILD);
let meeting104LaunchOpen=false;
let meeting104Audit={data:null,error:'',loading:false,key:null};
function meet104L(ar,en){return lang==='ar'?ar:en}
function meet104Status(s){const m={ready_for_controlled_beta:[ 'جاهز للبيتا المحدودة','Ready for controlled beta'],needs_signoff:['يحتاج اعتماد','Needs sign-off'],ready_with_warnings:['جاهز مع تحذيرات','Ready with warnings'],blocked:['محظور','Blocked']};const x=m[s]||[s,s];return meet104L(x[0],x[1])}
function meet104SignLabel(k){const m={
 member_access:['عزل الأعضاء والوصول','Member access & isolation'],
 guest_waiting:['رابط الضيف وغرفة الانتظار','Guest link & waiting room'],
 host_controls:['تحكم المنظم وطلبات المايك/المشاركة','Host controls & media requests'],
 chat_mentions:['الدردشة والمنشن والرياكسنز','Chat, mentions & reactions'],
 private_files:['المرفقات الخاصة والأنواع المسموحة','Private attachments & allow-list'],
 mobile_media:['الكاميرا والجوال ومشاركة الشاشة','Mobile camera & screen sharing'],
 network_boundary:['حدود الشبكة والاجتماعات الكبيرة','Network & large-meeting boundary']
};const x=m[k]||[k,k];return meet104L(x[0],x[1])}
function meet104SignHelp(k){const m={
 member_access:['اختبر عضوًا مصرحًا وآخر غير مصرح في شركتين مختلفتين.','Test an authorized member and an unauthorized user across two workspaces.'],
 guest_waiting:['اختبر رابط ضيف Incognito ثم قبول/رفض من المنظم وإلغاء الرابط.','Test an Incognito guest link, organizer admit/deny, and guest-link revocation.'],
 host_controls:['اختبر كتم المنظم، طلب فتح المايك، وطلب المشاركة بدون تشغيل المايك قسرًا.','Test host mute, ask-to-unmute, and invite-to-speak without forced remote unmute.'],
 chat_mentions:['اختبر عضوًا وضيفًا، @mention، الرسائل والرياكسنز.','Test member/guest chat, @mention, messages, and reactions.'],
 private_files:['ارفع PDF/صورة كعضو، امنع الضيف، وتحقق أن Bucket خاص.','Upload PDF/image as a member, block guest upload, and verify the bucket is private.'],
 mobile_media:['اختبر iPhone/Android/desktop والكاميرا الأمامية ومشاركة الشاشة حيث يدعمها المتصفح.','Test iPhone/Android/desktop, front camera, and screen sharing where the browser supports it.'],
 network_boundary:['اعتمد هذه النسخة لمجموعة صغيرة فقط؛ TURN/SFU مطلوبان قبل التوسع العام.','Approve this build for small groups only; TURN/SFU are required before broad scale.']
};const x=m[k]||['',''];return meet104L(x[0],x[1])}
async function fetchMeeting104Audit(force=false){
 if(!currentWorkspaceId||currentUserRole!=='admin')return null;
 const key=`${currentWorkspaceId}:v104`;if(!force&&meeting104Audit.data&&meeting104Audit.key===key)return meeting104Audit.data;
 if(meeting104Audit.loading)return meeting104Audit.data;meeting104Audit.loading=true;meeting104Audit.error='';
 if(meeting104LaunchOpen)renderModule();
 try{const {data,error}=await sb.rpc('tasky_meeting_launch_readiness_v104',{p_workspace_id:currentWorkspaceId});if(error)throw error;meeting104Audit.data=data||{};meeting104Audit.key=key;return data}
 catch(e){meeting104Audit.error=e?.message||String(e);meeting104Audit.data=null;return null}
 finally{meeting104Audit.loading=false;if(meeting104LaunchOpen)renderModule()}
}
async function meeting104SetSignoff(k,status){
 const {error}=await sb.rpc('tasky_meeting_set_launch_signoff_v104',{p_workspace_id:currentWorkspaceId,p_check_key:k,p_status:status,p_notes:null});
 if(error)return showTaskyDialog({title:meet104L('تعذّر حفظ الاعتماد','Could not save sign-off'),message:error.message,tone:'error'});
 meeting104Audit.data=null;await fetchMeeting104Audit(true)
}
function openMeeting104Launch(){if(currentUserRole!=='admin')return;meeting104LaunchOpen=true;renderModule();fetchMeeting104Audit()}
function closeMeeting104Launch(){meeting104LaunchOpen=false;renderModule()}
function meeting104LaunchHtml(){
 const d=meeting104Audit.data||{},sum=d.summary||{},issues=Array.isArray(d.issues)?d.issues:[],sign=Array.isArray(d.signoffs)?d.signoffs:[],status=d.status||(meeting104Audit.error?'blocked':'needs_signoff');
 if(meeting104Audit.loading&&!meeting104Audit.data)return `<div class="meet104-audit"><div class="meet101-empty">${meet104L('جارٍ تشغيل تدقيق الاجتماعات…','Running meeting audit…')}</div></div>`;
 if(meeting104Audit.error&&!meeting104Audit.data)return `<div class="meet104-audit"><div class="meet101-empty"><b>${meet104L('تعذّر تشغيل تدقيق الاجتماعات','Could not run Meetings audit')}</b><br>${escapeHtml(meeting104Audit.error)}<br><br><button class="chip-btn" onclick="fetchMeeting104Audit(true)">${meet104L('إعادة المحاولة','Retry')}</button></div></div>`;
 return `<div class="meet104-audit">
  <div class="meet104-hero"><div><div class="meet101-actions" style="margin-bottom:8px"><button class="chip-btn" onclick="closeMeeting104Launch()">← ${meet104L('الاجتماعات','Meetings')}</button><button class="chip-btn" onclick="fetchMeeting104Audit(true)">${meet104L('إعادة الفحص','Re-run audit')}</button></div><h3>${meet104L('جاهزية اجتماعات تاسكي — V104','Tasky Meetings Readiness — V104')}</h3><p>${meet104L('تدقيق إطلاق للاجتماعات، الضيوف، غرفة الانتظار، الدردشة، الملفات، تحكم المنظم وحدود WebRTC الحالية.','Launch audit for meetings, external guests, waiting room, chat, files, host controls, and the current WebRTC boundary.')}</p></div><span class="meet104-status ${escapeHtml(status)}">● ${escapeHtml(meet104Status(status))}</span></div>
  <div class="meet104-kpis"><div class="meet104-kpi critical"><span>${meet104L('حرج','Critical')}</span><b>${Number(d.critical_count||0)}</b></div><div class="meet104-kpi warning"><span>${meet104L('تحذيرات','Warnings')}</span><b>${Number(d.warning_count||0)}</b></div><div class="meet104-kpi"><span>${meet104L('اجتماعات','Meetings')}</span><b>${Number(sum.meetings||0)}</b></div><div class="meet104-kpi"><span>${meet104L('جلسات ضيوف نشطة','Active guest sessions')}</span><b>${Number(sum.active_guest_sessions||0)}</b></div><div class="meet104-kpi"><span>${meet104L('الاعتمادات','Sign-offs')}</span><b>${Number(sum.passed_signoffs||0)} / 7</b></div></div>
  <div class="meet104-panel"><h4>${meet104L('التدقيق الآلي','Automated audit')}</h4><p>${meet104L('يفحص RLS والصلاحيات والعلاقات والـBucket الخاص وسلامة الجلسات. الكاميرا والشبكات تحتاج اختبارًا فعليًا.','Checks RLS, grants, relationships, private storage, and session integrity. Camera/network behavior requires live testing.')}</p>${issues.length?issues.map(i=>`<div class="meet104-issue ${escapeHtml(i.severity||'warning')}"><div><b>${escapeHtml(lang==='ar'?(i.title_ar||i.title_en):(i.title_en||i.title_ar))}</b><p>${escapeHtml(lang==='ar'?(i.detail_ar||i.detail_en):(i.detail_en||i.detail_ar))}</p></div><span class="meet104-count">${Number(i.count||0)}</span></div>`).join(''):`<div class="meet101-empty">✓ ${meet104L('لا توجد مشاكل آلية في طبقة الاجتماعات.','No automated meeting-layer issues detected.')}</div>`}</div>
  <div class="meet104-panel"><h4>${meet104L('اختبارات الاعتماد السبعة','Seven mandatory sign-offs')}</h4><p>${meet104L('مرّر الاختبارات على بيئة النشر الحقيقية قبل اعتماد البيتا.','Run these tests on the deployed environment before approving the beta.')}</p>${sign.map(x=>`<div class="meet104-sign"><div><b>${escapeHtml(meet104SignLabel(x.check_key))}</b><small>${escapeHtml(meet104SignHelp(x.check_key))}</small></div><div class="meet104-sign-actions"><button class="pass ${x.status==='passed'?'active':''}" onclick="meeting104SetSignoff('${x.check_key}','passed')">✓ ${meet104L('نجح','Pass')}</button><button class="fail ${x.status==='failed'?'active':''}" onclick="meeting104SetSignoff('${x.check_key}','failed')">× ${meet104L('فشل','Fail')}</button><button onclick="meeting104SetSignoff('${x.check_key}','pending')">↺</button></div></div>`).join('')}</div>
  <div class="meet104-boundary"><b>${meet104L('حدود V104:','V104 boundary:')}</b> ${meet104L('الاجتماعات الحالية Mesh P2P عبر WebRTC/STUN. يمكن اعتمادها لبيتا محدودة ومجموعات صغيرة بعد نجاح الاختبارات، لكن TURN + SFU تبقيان شرطًا قبل تسويق اجتماعات كبيرة أو الاعتماد العام على شبكات الشركات المقيدة. التسجيل الحالي محلي على جهاز المنظم وليس تسجيلًا سحابيًا.','Meetings currently use WebRTC/STUN mesh P2P. They can be approved for a controlled small-group beta after sign-off, but TURN + SFU remain required before large-meeting marketing or broad use on restrictive corporate networks. Recording remains organizer-local, not cloud recording.')}</div>
  <div class="meet104-rule"><b>${meet104L('قاعدة الاعتماد:','Approval rule:')}</b> ${meet104L('Critical = 0 + نجاح 7/7 = جاهز للبيتا المحدودة. لا تعني هذه الحالة جاهزية Public large-scale meetings.','Critical = 0 + 7/7 sign-offs = ready for controlled beta. This does not mean public large-scale meeting readiness.')}</div>
 </div>`
}
const meetingsTemplateBaseV104=meetingsTemplateV101;
meetingsTemplateV101=function(){
 if(meeting104LaunchOpen)return meeting104LaunchHtml();
 let h=meetingsTemplateBaseV104();
 if(currentUserRole==='admin'){
   const btn=`<button class="meet104-ready-btn" onclick="openMeeting104Launch()">✓ ${meet104L('جاهزية الاجتماعات','Meeting readiness')}</button>`;
   h=h.replace('<div class="meet101-actions">','<div class="meet101-actions">'+btn);
 }
 h=h.replace(/V101 — Beta للاختبار/g,'V104 — Controlled Beta').replace(/V101 — Test Beta/g,'V104 — Controlled Beta');
 return h
};


/* --- source script: tasky-v1041-meeting-ux-hotfix-js --- */

window.TASKY_BUILD='V104.1';console.info('Tasky build',window.TASKY_BUILD);

/* Preserve chat drafts while the 2.5s poll updates the drawer. */
const meetingV103RenderDrawerBaseV1041=meetingV103RenderDrawer;
meetingV103RenderDrawer=function(){
  const input=document.getElementById('meet103ChatInput');
  const draft=input?.value??'';
  const hadFocus=document.activeElement===input;
  const start=input?.selectionStart??draft.length;
  const end=input?.selectionEnd??draft.length;
  meetingV103RenderDrawerBaseV1041();
  if(meetingV103DrawerTab==='chat'){
    const next=document.getElementById('meet103ChatInput');
    if(next){
      next.value=draft;
      if(hadFocus){
        next.focus({preventScroll:true});
        try{next.setSelectionRange(Math.min(start,draft.length),Math.min(end,draft.length))}catch(_){}
      }
    }
  }
};

/* Build a proper external invitation from the actual V102 guest_token payload. */
function meetingV1041InviteText(m,url,isGuest){
  const title=m?.title||meet103L('اجتماع تاسكي','Tasky Meeting');
  const organizer=m?.created_by?meetingMemberNameV101(m.created_by):'';
  const desc=(m?.description||'').trim();
  return [
    meet103L('📅 دعوة اجتماع عبر تاسكي','📅 Tasky meeting invitation'),
    '',
    `📌 ${meet103L('الاجتماع','Meeting')}: ${title}`,
    m?.scheduled_at?`🗓 ${meet103L('الموعد','When')}: ${meetingDateV101(m.scheduled_at)}`:'',
    m?.duration_minutes?`⏱ ${meet103L('المدة','Duration')}: ${Number(m.duration_minutes)} ${meet103L('دقيقة','min')}`:'',
    organizer?`👤 ${meet103L('المنظّم','Organizer')}: ${organizer}`:'',
    desc?`📝 ${meet103L('التفاصيل','Details')}: ${desc}`:'',
    '',
    `🔗 ${isGuest?meet103L('الدخول كضيف بدون حساب','Join as a guest — no account required'):meet103L('رابط الدخول','Join link')}:`,
    url,
    '',
    `🔑 ${meet103L('رمز الاجتماع','Meeting code')}: ${m?.room_code||''}`,
    isGuest?meet103L('ℹ️ لا تحتاج إلى إنشاء حساب تاسكي. سيطلب منك المنظم الدخول من غرفة الانتظار إذا كانت مفعّلة.','ℹ️ No Tasky account is required. If the waiting room is enabled, the organizer will admit you.'): ''
  ].filter(Boolean).join('\n');
}
async function meetingShareInviteV103(roomCode){
  try{
    const m=meetingsV101.find(x=>x.room_code===roomCode)||meetingRoomV101;
    let url=meetingLinkV101(roomCode),isGuest=false;
    if(m?.allow_guests&&m?.can_manage){
      const r=await sb.rpc('tasky_meeting_guest_link_v102',{p_meeting_id:m.id});
      if(!r.error&&r.data?.guest_token){
        url=meetingGuestLinkUrlV102(r.data.room_code||roomCode,r.data.guest_token);
        isGuest=true;
      }
    }
    const text=meetingV1041InviteText(m||{room_code:roomCode},url,isGuest);
    /* Do not pass a separate URL to iOS Web Share; WhatsApp may otherwise discard the message body. */
    if(navigator.share) await navigator.share({title:m?.title||'Tasky Meeting',text});
    else{
      await navigator.clipboard.writeText(text);
      taskyToast(meet103L('تم نسخ دعوة الاجتماع بالتفاصيل','Detailed meeting invitation copied'),{tone:'success'});
    }
  }catch(e){
    if(e?.name!=='AbortError')taskyToast(meet103L('تعذّر مشاركة الدعوة','Could not share invitation'),{tone:'error'});
  }
}

/* Show waiting state inside the guest page as well as the full-screen waiting room. */
const meetingV103ShowGuestWaitingBaseV1041=meetingV103ShowGuestWaiting;
meetingV103ShowGuestWaiting=function(){
  meetingV103ShowGuestWaitingBaseV1041();
  const screen=document.getElementById('taskyMeetingGuestV102')||document.getElementById('meet102GuestScreen')||document.querySelector('.meet102-public-card');
  const form=document.getElementById('meet102GuestName')?.closest('form');
  if(form){
    form.querySelectorAll('input,button').forEach(el=>el.disabled=true);
    let box=document.getElementById('meet1041GuestWaitInline');
    if(!box){
      box=document.createElement('div');
      box.id='meet1041GuestWaitInline';
      box.className='meet1041-wait-inline';
      form.appendChild(box);
    }
    box.innerHTML=`<h3>⏳ ${meet103L('أنت الآن في غرفة الانتظار','You are now in the waiting room')}</h3><div class="spinner"></div><p>${meet103L('تم إرسال طلبك إلى منظم الاجتماع. لا تغلق هذه الصفحة؛ ستدخل تلقائيًا فور الموافقة.','Your request was sent to the organizer. Keep this page open; you will enter automatically when admitted.')}</p>`;
    try{box.scrollIntoView({behavior:'smooth',block:'center'})}catch(_){}
  }
}
const meetingV103CancelGuestWaitBaseV1041=meetingV103CancelGuestWait;
meetingV103CancelGuestWait=function(){
  meetingV103CancelGuestWaitBaseV1041();
  const form=document.getElementById('meet102GuestName')?.closest('form');
  form?.querySelectorAll('input,button').forEach(el=>el.disabled=false);
  document.getElementById('meet1041GuestWaitInline')?.remove();
}


/* --- source script: tasky-v1042-meeting-live-ux-js --- */

window.TASKY_BUILD='V104.2';console.info('Tasky build',window.TASKY_BUILD);

let meetingV1042Unread=0;
let meetingV1042KnownChatIds=new Set();
let meetingV1042ChatInitialized=false;
let meetingV1042SpeakTimer=null;
let meetingV1042AudioCtx=null;
const meetingV1042Analysers=new Map();
let meetingV1042ParticipationRequests=0;
let meetingV1042HandRaised=false;

function meetingV1042UpdateChatBadge(){
  const b=document.getElementById('meet1042ChatBadge');
  if(!b)return;
  b.textContent=meetingV1042Unread>99?'99+':String(meetingV1042Unread);
  b.classList.toggle('show',meetingV1042Unread>0);
}
function meetingV1042UpdateRequestBadge(){
  const b=document.getElementById('meet1042RequestBadge');
  if(!b)return;
  b.textContent=meetingV1042ParticipationRequests>9?'9+':String(meetingV1042ParticipationRequests);
  b.classList.toggle('show',meetingV1042ParticipationRequests>0);
}
function meetingV1042ResetUnread(){
  meetingV1042Unread=0;meetingV1042UpdateChatBadge();
}
function meetingV1042PatchTools(){
  const tools=document.getElementById('meet103Tools');
  if(!tools)return;
  const buttons=[...tools.querySelectorAll('button')];
  const chat=buttons.find(b=>b.getAttribute('onclick')?.includes("'chat'"));
  if(chat&&!document.getElementById('meet1042ChatBadge')){
    chat.insertAdjacentHTML('beforeend','<b id="meet1042ChatBadge" class="meet1042-chat-badge">0</b>');
    meetingV1042UpdateChatBadge();
  }
  const people=buttons.find(b=>b.getAttribute('onclick')?.includes("'people'"));
  if(people){
    /* Remove the decorative people emoji requested by product review. */
    for(const n of [...people.childNodes]){
      if(n.nodeType===Node.TEXT_NODE&&n.textContent.includes('👥'))n.textContent=n.textContent.replace('👥','');
    }
    if(meetingRoomV101?.can_manage&&!document.getElementById('meet1042RequestBadge')){
      people.insertAdjacentHTML('beforeend','<b id="meet1042RequestBadge" class="meet1042-request-badge">0</b>');
      meetingV1042UpdateRequestBadge();
    }
  }
  const reaction=buttons.find(b=>b.getAttribute('onclick')?.includes('meetingToggleReactionsV103'));
  if(reaction)reaction.innerHTML='😀';

  /* A guest/member can ask the organizer to participate. */
  if(!meetingRoomV101?.can_manage&&!document.getElementById('meet1042HandBtn')){
    const hand=document.createElement('button');
    hand.id='meet1042HandBtn';
    hand.className='meet103-pill meet1042-hand';
    hand.type='button';
    hand.onclick=meetingV1042RequestParticipation;
    hand.innerHTML=`🙋 <span>${meet103L('طلب المشاركة','Ask to speak')}</span>`;
    tools.appendChild(hand);
  }
}
async function meetingV1042RequestParticipation(){
  if(!meetingRoomV101||meetingRoomV101.can_manage)return;
  meetingV1042HandRaised=!meetingV1042HandRaised;
  document.getElementById('meet1042HandBtn')?.classList.toggle('active',meetingV1042HandRaised);
  await meetingBroadcastSignalV101('v1042-participation-request',{
    active:meetingV1042HandRaised,
    name:meetingMeV101()?.fullName||meetingGuestSessionV102?.name||meet103L('مشارك','Participant')
  },'*');
  meetingV103ShowReaction(meetingV1042HandRaised?'🙋':'👍',meetingMeV101()?.fullName||meetingGuestSessionV102?.name||'');
  taskyToast(meetingV1042HandRaised?meet103L('تم إرسال طلب المشاركة للمنظم','Participation request sent to the organizer'):meet103L('تم سحب طلب المشاركة','Participation request withdrawn'),{tone:'success'});
}

/* Count only messages that arrive after the first chat snapshot. */
const meetingV103FetchChatBaseV1042=meetingV103FetchChat;
meetingV103FetchChat=async function(render=true){
  const before=new Set(meetingV1042KnownChatIds);
  const wasInitialized=meetingV1042ChatInitialized;
  await meetingV103FetchChatBaseV1042(render);
  const current=Array.isArray(meetingV103Chat)?meetingV103Chat:[];
  if(!wasInitialized){
    current.forEach(m=>meetingV1042KnownChatIds.add(String(m.id||m.created_at||'')));
    meetingV1042ChatInitialized=true;
    return;
  }
  let incoming=0;
  current.forEach(m=>{
    const id=String(m.id||m.created_at||'');
    if(id&&!before.has(id)&&!m.mine)incoming++;
    if(id)meetingV1042KnownChatIds.add(id);
  });
  const drawer=document.getElementById('meet103Drawer');
  const reading=drawer?.classList.contains('open')&&meetingV103DrawerTab==='chat';
  if(incoming&&!reading){meetingV1042Unread+=incoming;meetingV1042UpdateChatBadge()}
  else if(reading)meetingV1042ResetUnread();
};

const meetingOpenDrawerBaseV1042=meetingOpenDrawerV103;
meetingOpenDrawerV103=function(tab='chat'){
  meetingOpenDrawerBaseV1042(tab);
  if(tab==='chat')meetingV1042ResetUnread();
  if(tab==='people'&&meetingRoomV101?.can_manage){
    meetingV1042ParticipationRequests=0;meetingV1042UpdateRequestBadge();
  }
};
const meetingSetDrawerTabBaseV1042=meetingSetDrawerTabV103;
meetingSetDrawerTabV103=function(tab){
  meetingSetDrawerTabBaseV1042(tab);
  if(tab==='chat')meetingV1042ResetUnread();
  if(tab==='people'&&meetingRoomV101?.can_manage){
    meetingV1042ParticipationRequests=0;meetingV1042UpdateRequestBadge();
  }
};

/* Active-speaker detection. This remains local to the client; audio is not uploaded or stored. */
function meetingV1042EnsureAudio(){
  if(meetingV1042AudioCtx)return meetingV1042AudioCtx;
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    meetingV1042AudioCtx=new C();
    if(meetingV1042AudioCtx.state==='suspended')meetingV1042AudioCtx.resume().catch(()=>{});
    return meetingV1042AudioCtx;
  }catch(_){return null}
}
function meetingV1042Analyser(peerId,stream){
  const ctx=meetingV1042EnsureAudio();
  const audio=stream?.getAudioTracks?.().filter(t=>t.readyState==='live');
  if(!ctx||!audio?.length)return null;
  const key=String(peerId);
  const existing=meetingV1042Analysers.get(key);
  if(existing?.trackId===audio[0].id)return existing.analyser;
  try{
    existing?.source?.disconnect?.();
    const source=ctx.createMediaStreamSource(new MediaStream([audio[0]]));
    const analyser=ctx.createAnalyser();analyser.fftSize=256;analyser.smoothingTimeConstant=.75;
    source.connect(analyser);
    meetingV1042Analysers.set(key,{source,analyser,trackId:audio[0].id});
    return analyser;
  }catch(_){return null}
}
function meetingV1042Level(analyser){
  if(!analyser)return 0;
  const a=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(a);
  let sum=0;for(const x of a){const n=(x-128)/128;sum+=n*n}
  return Math.sqrt(sum/a.length);
}
function meetingV1042UpdateSpeakers(){
  if(!meetingRoomV101)return;
  const sources=[['local',meetingLocalStreamV101,meetingLocalStateV101.mic],...meetingRemoteParticipantsV101().map(p=>[p.peerId,meetingRemoteStreamsV101.get(p.peerId),(meetingRemoteMetaV101.get(p.peerId)||{}).mic!==false])];
  for(const [peerId,stream,micOn] of sources){
    const tile=document.querySelector(`.meet101-video-tile[data-peer="${CSS.escape(String(peerId))}"]`);
    if(!tile)continue;
    const level=micOn?meetingV1042Level(meetingV1042Analyser(peerId,stream)):0;
    tile.classList.toggle('meet1042-speaking',level>.035);
  }
}
function meetingV1042StartSpeaking(){
  meetingV1042StopSpeaking();
  meetingV1042SpeakTimer=setInterval(meetingV1042UpdateSpeakers,260);
}
function meetingV1042StopSpeaking(){
  if(meetingV1042SpeakTimer){clearInterval(meetingV1042SpeakTimer);meetingV1042SpeakTimer=null}
  meetingV1042Analysers.forEach(x=>{try{x.source?.disconnect()}catch(_){}});meetingV1042Analysers.clear();
  if(meetingV1042AudioCtx){try{meetingV1042AudioCtx.close()}catch(_){}meetingV1042AudioCtx=null}
}

/* Retry Safari media playback and keep the browser's native play glyph out of the meeting UI. */
function meetingV1042EnsureVideoPlayback(){
  document.querySelectorAll('.meet101-video-tile video').forEach(v=>{
    v.playsInline=true;v.setAttribute('playsinline','');v.controls=false;
    try{v.disablePictureInPicture=true}catch(_){}
    if(v.paused&&v.srcObject?.active)v.play().catch(()=>{});
  });
}

/* Add tool changes, equal split and playback retries after every room render. */
const meetingRenderRoomBaseV1042=meetingRenderRoomV101;
meetingRenderRoomV101=function(){
  meetingRenderRoomBaseV1042();
  if(!meetingRoomV101)return;
  meetingV1042PatchTools();
  meetingV1042EnsureVideoPlayback();
  if(!meetingV1042SpeakTimer)meetingV1042StartSpeaking();
};

/* Organizer receives participation requests. Reactions continue to work for guests and members. */
const meetingHandleSignalBaseV1042=meetingHandleSignalV101;
meetingHandleSignalV101=async function(payload){
  if(payload?.kind==='v1042-participation-request'){
    if(!meetingRoomV101?.can_manage)return;
    const active=payload.active!==false;
    if(active){
      meetingV1042ParticipationRequests++;
      meetingV1042UpdateRequestBadge();
      meetingV103ShowReaction('🙋',payload.name||'');
      taskyToast(`${payload.name||meet103L('مشارك','Participant')} — ${meet103L('يطلب المشاركة','requests to speak')}`,{tone:'info'});
    }
    return;
  }
  return meetingHandleSignalBaseV1042(payload);
};

/* Any touch/click inside the room is also a user gesture for Safari autoplay recovery. */
document.addEventListener('pointerdown',e=>{
  if(e.target?.closest?.('#taskyMeetingRoomV101'))meetingV1042EnsureVideoPlayback();
},{passive:true});

const leaveMeetingRoomBaseV1042=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){
  meetingV1042StopSpeaking();
  meetingV1042Unread=0;meetingV1042KnownChatIds.clear();meetingV1042ChatInitialized=false;
  meetingV1042ParticipationRequests=0;meetingV1042HandRaised=false;
  return leaveMeetingRoomBaseV1042(opts);
};


/* --- source script: tasky-v1043-meeting-focus-js --- */

window.TASKY_BUILD='V104.3';console.info('Tasky build',window.TASKY_BUILD);

let meetingV1043PinnedPeer=null;
let meetingV1043AutoSpeakerPeer=null;
let meetingV1043SelfHidden=false;
let meetingV1043SoundEnabled=localStorage.getItem('tasky_meeting_sound_v1043')==='1';
let meetingV1043TimerHandle=null;
let meetingV1043RaisedLocal=false;
let meetingV1043KnownWaitingIds=new Set();
let meetingV1043WaitingInitialized=false;
let meetingV1043LastChatCount=0;

function meetingV1043FormatElapsed(ms){
  const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}
function meetingV1043UpdateTimer(){
  const el=document.getElementById('meet1043Timer');if(!el||!meetingRoomV101)return;
  const start=meetingRoomV101.started_at?new Date(meetingRoomV101.started_at).getTime():Date.now();
  el.textContent=meetingV1043FormatElapsed(Date.now()-start);
}
function meetingV1043StartTimer(){
  if(meetingV1043TimerHandle)return;
  meetingV1043UpdateTimer();
  meetingV1043TimerHandle=setInterval(meetingV1043UpdateTimer,1000);
}
function meetingV1043StopTimer(){
  clearInterval(meetingV1043TimerHandle);meetingV1043TimerHandle=null;
}
function meetingV1043Beep(kind='message'){
  if(!meetingV1043SoundEnabled)return;
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    const c=new C(),o=c.createOscillator(),g=c.createGain();
    o.type='sine';o.frequency.value=kind==='waiting'?720:520;
    g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.08,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.18);
    o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.2);setTimeout(()=>c.close().catch(()=>{}),350);
  }catch(_){}
}
function meetingV1043ToggleSound(){
  meetingV1043SoundEnabled=!meetingV1043SoundEnabled;
  localStorage.setItem('tasky_meeting_sound_v1043',meetingV1043SoundEnabled?'1':'0');
  meetingV1043PatchToolbar();
  taskyToast(meetingV1043SoundEnabled?meet103L('تم تشغيل تنبيهات الاجتماع','Meeting sounds enabled'):meet103L('تم كتم تنبيهات الاجتماع','Meeting sounds muted'),{tone:'success'});
}
function meetingV1043ToggleSelf(){
  meetingV1043SelfHidden=!meetingV1043SelfHidden;
  meetingV1043ApplyLayout();
  meetingV1043PatchToolbar();
  taskyToast(meetingV1043SelfHidden?meet103L('تم إخفاء صورتك لديك فقط','Your self-view is hidden locally'):meet103L('تم إظهار صورتك','Your self-view is visible'),{tone:'success'});
}
function meetingV1043TogglePin(peerId){
  meetingV1043PinnedPeer=meetingV1043PinnedPeer===peerId?null:peerId;
  meetingV1043ApplyLayout();
}
function meetingV1043PatchTimer(){
  const meta=document.getElementById('meet101RoomMeta');
  if(meta&&!document.getElementById('meet1043Timer'))meta.insertAdjacentHTML('afterend','<span id="meet1043Timer" class="meet1043-timer">00:00</span>');
  meetingV1043StartTimer();
}
function meetingV1043PatchToolbar(){
  const tools=document.getElementById('meet103Tools');if(!tools)return;
  let sound=document.getElementById('meet1043SoundBtn');
  if(!sound){
    sound=document.createElement('button');sound.id='meet1043SoundBtn';sound.type='button';sound.className='meet103-pill meet1043-sound';sound.onclick=meetingV1043ToggleSound;tools.appendChild(sound);
  }
  sound.classList.toggle('active',meetingV1043SoundEnabled);
  sound.innerHTML=`${meetingV1043SoundEnabled?'🔔':'🔕'} <span>${meet103L('التنبيهات','Alerts')}</span>`;
  let self=document.getElementById('meet1043SelfBtn');
  if(!self){
    self=document.createElement('button');self.id='meet1043SelfBtn';self.type='button';self.className='meet103-pill meet1043-self';self.onclick=meetingV1043ToggleSelf;tools.appendChild(self);
  }
  self.classList.toggle('active',meetingV1043SelfHidden);
  self.innerHTML=`${meetingV1043SelfHidden?'👁️':'🙈'} <span>${meetingV1043SelfHidden?meet103L('إظهار صورتي','Show self'):meet103L('إخفاء صورتي','Hide self')}</span>`;
}
function meetingV1043PatchPins(){
  document.querySelectorAll('.meet101-video-tile').forEach(tile=>{
    const peer=tile.dataset.peer;if(!peer)return;
    let b=tile.querySelector('.meet1043-pin');
    if(!b){b=document.createElement('button');b.type='button';b.className='meet1043-pin';b.title=meet103L('تثبيت المشارك','Pin participant');b.onclick=e=>{e.stopPropagation();meetingV1043TogglePin(peer)};tile.appendChild(b)}
    b.classList.toggle('active',meetingV1043PinnedPeer===peer);b.textContent=meetingV1043PinnedPeer===peer?'📌':'📍';
  });
}
function meetingV1043RaisedFor(peerId){
  if(peerId==='local')return meetingV1043RaisedLocal;
  return !!meetingRemoteMetaV101.get(peerId)?.raised_hand;
}
function meetingV1043ApplyLayout(){
  const g=document.getElementById('meet101VideoGrid');if(!g)return;
  const tiles=[...g.querySelectorAll('.meet101-video-tile')];
  const local=g.querySelector('[data-peer="local"]');
  local?.classList.toggle('meet1043-self-hidden',meetingV1043SelfHidden);
  tiles.forEach(t=>t.classList.remove('meet1043-focus-main'));
  g.classList.remove('meet1043-focus-mode');
  const visible=tiles.filter(t=>!t.classList.contains('meet1043-self-hidden'));
  if(g.querySelector('.screen'))return;
  if(visible.length<3)return;
  let peer=meetingV1043PinnedPeer;
  if(peer&&!g.querySelector(`[data-peer="${CSS.escape(String(peer))}"]`))meetingV1043PinnedPeer=peer=null;
  if(!peer)peer=meetingV1043AutoSpeakerPeer;
  if(!peer||!g.querySelector(`[data-peer="${CSS.escape(String(peer))}"]`))peer=visible[0]?.dataset.peer;
  const focus=peer?g.querySelector(`[data-peer="${CSS.escape(String(peer))}"]`):null;
  if(focus&&!focus.classList.contains('meet1043-self-hidden')){g.classList.add('meet1043-focus-mode');focus.classList.add('meet1043-focus-main')}
}
function meetingV1043DecoratePeople(){
  const body=document.getElementById('meet103DrawerBody');
  if(!body||meetingV103DrawerTab!=='people')return;
  const rows=[...body.querySelectorAll('.meet103-person')];
  const data=[{peerId:'local'},...meetingRemoteParticipantsV101().map(p=>({peerId:p.peerId}))];
  rows.forEach((row,i)=>{
    const peer=data[i]?.peerId;if(!peer)return;
    const h=row.querySelector('h4');if(!h)return;
    if(meetingV1043RaisedFor(peer)&&!h.querySelector('.meet1043-hand-chip'))h.insertAdjacentHTML('beforeend',`<span class="meet1043-hand-chip">🙋 ${meet103L('رافع اليد','Hand raised')}</span>`);
    const tile=document.querySelector(`.meet101-video-tile[data-peer="${CSS.escape(String(peer))}"]`);
    if(tile?.classList.contains('meet1042-speaking')&&!h.querySelector('.meet1043-speaker-chip'))h.insertAdjacentHTML('beforeend',`<span class="meet1043-speaker-chip">● ${meet103L('يتحدث','Speaking')}</span>`);
    const actions=row.querySelector('.meet103-inline');
    if(actions&&!actions.querySelector('[data-meet1043-pin]')){
      const b=document.createElement('button');b.className='meet103-mini';b.dataset.meet1043Pin='1';b.textContent=meetingV1043PinnedPeer===peer?meet103L('إلغاء التثبيت','Unpin'):meet103L('تثبيت','Pin');b.onclick=()=>{meetingV1043TogglePin(peer);meetingV103RenderDrawer()};actions.appendChild(b)
    }
  });
}
async function meetingV1043UpdatePresenceRaised(active){
  meetingV1043RaisedLocal=!!active;
  if(!meetingChannelV101||!meetingSubscribedV101)return;
  const me=meetingMeV101();
  try{
    await meetingChannelV101.track({
      peer_id:meetingPeerIdV101,user_id:meetingV103IsGuest()?null:currentUserId||null,guest:meetingV103IsGuest(),
      name:meetingV103IsGuest()?`${meet103L('ضيف','Guest')} · ${me.fullName||''}`:(me.fullName||me.email||meet103L('مشارك','Participant')),
      mic:meetingLocalStateV101.mic,camera:meetingLocalStateV101.camera,screen:meetingLocalStateV101.screen,
      raised_hand:meetingV1043RaisedLocal,joined_at:new Date().toISOString()
    });
  }catch(e){console.warn('V104.3 presence hand',e)}
}
/* Upgrade the existing Ask to speak into a persistent raised-hand state. */
async function meetingV1042RequestParticipation(){
  if(!meetingRoomV101||meetingRoomV101.can_manage)return;
  meetingV1042HandRaised=!meetingV1042HandRaised;
  await meetingV1043UpdatePresenceRaised(meetingV1042HandRaised);
  document.getElementById('meet1042HandBtn')?.classList.toggle('active',meetingV1042HandRaised);
  await meetingBroadcastSignalV101('v1042-participation-request',{
    active:meetingV1042HandRaised,
    name:meetingMeV101()?.fullName||meetingGuestSessionV102?.name||meet103L('مشارك','Participant')
  },'*');
  meetingV103ShowReaction(meetingV1042HandRaised?'🙋':'👍',meetingMeV101()?.fullName||meetingGuestSessionV102?.name||'');
  if(document.getElementById('meet103Drawer')?.classList.contains('open')&&meetingV103DrawerTab==='people')meetingV103RenderDrawer();
  taskyToast(meetingV1042HandRaised?meet103L('تم رفع يدك وإرسال الطلب للمنظم','Your hand is raised and the organizer was notified'):meet103L('تم خفض يدك','Your hand is lowered'),{tone:'success'});
}

/* Sound for genuinely new chat messages. */
const meetingV103FetchChatBaseV1043=meetingV103FetchChat;
meetingV103FetchChat=async function(render=true){
  const previousUnread=meetingV1042Unread;
  await meetingV103FetchChatBaseV1043(render);
  if(meetingV1042Unread>previousUnread)meetingV1043Beep('message');
};

/* Sound for newly arriving waiting-room requests. */
const meetingV103FetchWaitingBaseV1043=meetingV103FetchWaiting;
meetingV103FetchWaiting=async function(render=true){
  const before=new Set(meetingV1043KnownWaitingIds);
  const init=meetingV1043WaitingInitialized;
  await meetingV103FetchWaitingBaseV1043(render);
  const now=Array.isArray(meetingV103Waiting)?meetingV103Waiting:[];
  if(!init){
    now.forEach(w=>meetingV1043KnownWaitingIds.add(String(w.id)));
    meetingV1043WaitingInitialized=true;
    return;
  }
  const added=now.filter(w=>!before.has(String(w.id))).length;
  now.forEach(w=>meetingV1043KnownWaitingIds.add(String(w.id)));
  if(added)meetingV1043Beep('waiting');
};

/* Add raised-hand state to incoming signal immediately, while presence remains the durable room state. */
const meetingHandleSignalBaseV1043=meetingHandleSignalV101;
meetingHandleSignalV101=async function(payload){
  if(payload?.kind==='v1042-participation-request'){
    const meta=meetingRemoteMetaV101.get(payload.from)||{};
    meetingRemoteMetaV101.set(payload.from,{...meta,raised_hand:payload.active!==false});
    if(document.getElementById('meet103Drawer')?.classList.contains('open')&&meetingV103DrawerTab==='people')meetingV103RenderDrawer();
  }
  return meetingHandleSignalBaseV1043(payload);
};

/* Auto-focus the loudest current speaker at 3+ participants unless someone is pinned. */
const meetingV1042UpdateSpeakersBaseV1043=meetingV1042UpdateSpeakers;
meetingV1042UpdateSpeakers=function(){
  meetingV1042UpdateSpeakersBaseV1043();
  const g=document.getElementById('meet101VideoGrid');
  if(!g||meetingV1043PinnedPeer||g.querySelector('.screen')){meetingV1043ApplyLayout();return}
  const speaking=[...g.querySelectorAll('.meet101-video-tile.meet1042-speaking:not(.meet1043-self-hidden)')];
  const next=speaking[0]?.dataset.peer||meetingV1043AutoSpeakerPeer;
  if(next!==meetingV1043AutoSpeakerPeer){meetingV1043AutoSpeakerPeer=next;meetingV1043ApplyLayout()}
};

/* Preserve V103 drawer and add persistent hand / speaking / pin information. */
const meetingV103RenderDrawerBaseV1043=meetingV103RenderDrawer;
meetingV103RenderDrawer=function(){
  meetingV103RenderDrawerBaseV1043();
  meetingV1043DecoratePeople();
};

/* Enhance every room render. */
const meetingRenderRoomBaseV1043=meetingRenderRoomV101;
meetingRenderRoomV101=function(){
  meetingRenderRoomBaseV1043();
  if(!meetingRoomV101)return;
  meetingV1043PatchTimer();
  meetingV1043PatchToolbar();
  meetingV1043PatchPins();
  meetingV1043ApplyLayout();
  if(document.getElementById('meet103Drawer')?.classList.contains('open')&&meetingV103DrawerTab==='people')meetingV1043DecoratePeople();
};

const leaveMeetingRoomBaseV1043=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){
  meetingV1043StopTimer();
  meetingV1043PinnedPeer=null;meetingV1043AutoSpeakerPeer=null;meetingV1043SelfHidden=false;
  meetingV1043RaisedLocal=false;meetingV1043KnownWaitingIds.clear();meetingV1043WaitingInitialized=false;
  return leaveMeetingRoomBaseV1043(opts);
};


/* --- source script: tasky-v1044-meeting-lifecycle-js --- */

window.TASKY_BUILD='V104.4';console.info('Tasky build',window.TASKY_BUILD);

let meetingV1044LastGuestRating=null;
let meetingV1044LastMemberMeeting=null;
let meetingV1044RatingValue=0;

function meetingV1044Total(m){return Number(m?.participant_count ?? (Number(m?.attendance_count||0)+Number(m?.guest_attendance_count||0)))}
function meetingV1044StatsHtml(m){
  const internal=Number(m?.attendance_count||0),guest=Number(m?.guest_attendance_count||0),total=meetingV1044Total(m);
  const rCount=Number(m?.rating_count||0),avg=Number(m?.average_rating||0);
  return `<div class="meet1044-stats">
    <span class="meet1044-stat">👤 ${total} ${meet101L('مشارك فريد','unique participant(s)')}</span>
    ${internal?`<span class="meet1044-stat">${internal} ${meet101L('داخلي','internal')}</span>`:''}
    ${guest?`<span class="meet1044-stat">${guest} ${meet101L('خارجي','external')}</span>`:''}
    ${rCount?`<span class="meet1044-stat">★ ${avg.toFixed(1)} · ${rCount}</span>`:''}
  </div>`
}
function meetingV1044StatusNote(m){
  if(m.status==='live')return `<span class="meet1044-live-note">● ${meet101L('مباشر الآن','Live now')}</span>`;
  if(m.status==='ended')return `<span class="meet1044-ended-note">${m.ended_at?meet101L('انتهى ','Ended ')+meetingDateV101(m.ended_at):meet101L('منتهي','Ended')}</span>`;
  if(m.status==='cancelled')return `<span class="meet1044-ended-note">${meet101L('تم إلغاء الاجتماع','Meeting cancelled')}</span>`;
  return '';
}
function meetingV1044SetStars(n){
  meetingV1044RatingValue=n;
  document.querySelectorAll('[data-meet1044-star]').forEach(b=>b.classList.toggle('active',Number(b.dataset.meet1044Star)<=n));
}
function meetingV1044RatingModal(meetingId,guestCtx=null){
  meetingV1044RatingValue=0;
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${meet101L('قيّم الاجتماع','Rate this meeting')}</h3><div class="subtle">${meet101L('يساعدنا تقييمك على تحسين تجربة اجتماعات تاسكي.','Your rating helps us improve Tasky Meetings.')}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
    <div class="meet1044-rating"><div class="meet1044-stars">${[1,2,3,4,5].map(n=>`<button type="button" data-meet1044-star="${n}" onclick="meetingV1044SetStars(${n})">★</button>`).join('')}</div>
    <textarea id="meet1044RatingNote" maxlength="1000" placeholder="${meet101L('ملاحظة اختيارية…','Optional note…')}"></textarea></div>
    <button class="submit-btn" onclick="meetingV1044SubmitRating('${meetingId}',${guestCtx?`true`:'false'})">${meet101L('إرسال التقييم','Submit rating')}</button>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
}
async function meetingV1044SubmitRating(meetingId,isGuest){
  if(!meetingV1044RatingValue)return taskyToast(meet101L('اختر تقييمًا من 1 إلى 5','Choose a rating from 1 to 5'),{tone:'warning'});
  const note=document.getElementById('meet1044RatingNote')?.value.trim()||null;
  let res;
  if(isGuest){
    const g=meetingV1044LastGuestRating;
    if(!g||g.meetingId!==meetingId)return;
    res=await sb.rpc('tasky_public_meeting_rate_v1044',{p_meeting_id:meetingId,p_guest_session_id:g.id,p_guest_session_token:g.token,p_rating:meetingV1044RatingValue,p_comment:note});
  }else{
    res=await sb.rpc('tasky_meeting_rate_v1044',{p_meeting_id:meetingId,p_rating:meetingV1044RatingValue,p_comment:note});
  }
  if(res.error)return showTaskyDialog({title:meet101L('تعذّر إرسال التقييم','Could not submit rating'),message:res.error.message,tone:'error'});
  closeAddModal();taskyToast(meet101L('شكرًا، تم حفظ تقييمك','Thanks — your rating was saved'),{tone:'success'});
  if(!isGuest){await fetchMeetingsV101();if(activeNav==='meetings')renderModule()}
}

/* Use the corrected V104.4 list with unique participant statistics. */
fetchMeetingsV101=async function(){
  if(!currentWorkspaceId)return[];
  meetingsLoadingV101=true;meetingsErrorV101='';
  try{
    const {data,error}=await sb.rpc('tasky_meeting_list_v1044',{p_workspace_id:currentWorkspaceId});
    if(error)throw error;meetingsV101=Array.isArray(data)?data:[];return meetingsV101;
  }catch(err){meetingsErrorV101=err?.message||String(err);console.warn('Tasky V104.4 meetings',err);meetingsV101=[];return[]}
  finally{meetingsLoadingV101=false}
};

/* Correct and simplify meeting cards. Never infer "live" from schedule time. */
meetingCardV101=function(m,past=false){
  const canJoin=!['ended','cancelled'].includes(m.status),canManage=!!m.can_manage;
  return `<article class="meet101-card ${escapeHtml(m.status)} ${past?'past':''}">
    <div class="meet101-card-head"><div><div class="meet102-title-row"><h3>${escapeHtml(m.title)}</h3>${m.allow_guests?`<span class="meet102-guest-badge">${meet102L('دخول خارجي','External guests')}</span>`:''}</div><p>${escapeHtml(m.description||meet102L('اجتماع عبر تاسكي','Tasky meeting'))}</p></div><span class="meet101-status ${escapeHtml(m.status)}">${escapeHtml(meetingStatusLabelV101(m.status))}</span></div>
    ${meetingV1044StatusNote(m)}
    <div class="meet101-meta"><div><span>${meet102L('الموعد','When')}</span><b>${escapeHtml(meetingDateV101(m.scheduled_at))}</b></div><div><span>${meet102L('المدة','Duration')}</span><b>${Number(m.duration_minutes||30)} ${meet102L('دقيقة','min')}</b></div><div><span>${meet102L('المنظّم','Organizer')}</span><b>${escapeHtml(meetingMemberNameV101(m.created_by))}</b></div></div>
    ${meetingV1044StatsHtml(m)}
    <div class="meet101-card-actions">
      ${canJoin?`<button class="primary-btn" onclick="openMeetingJoinConfirmV101('${m.room_code}')"><svg><use href="#i-camera"/></svg>${m.status==='live'?meet102L('انضم الآن','Join now'):meet102L('دخول الاجتماع','Join meeting')}</button>`:''}
      <button class="chip-btn" onclick="meetingCopyLinkV101('${m.room_code}')">${meet102L('رابط الأعضاء','Member link')}</button>
      ${canManage&&m.allow_guests&&!past&&!['ended','cancelled'].includes(m.status)?`<button class="chip-btn meet102-guest-link-btn" onclick="meetingCopyGuestLinkV102('${m.id}')">${meet102L('رابط ضيف بدون تسجيل','No-login guest link')}</button>`:''}
      ${canManage&&m.status==='scheduled'?`<button class="chip-btn" onclick="openMeetingEditorV101('${m.id}')">${meet102L('تعديل','Edit')}</button><button class="chip-btn" style="color:var(--danger)" onclick="cancelMeetingV1044('${m.id}')">${meet102L('إلغاء','Cancel')}</button>`:''}
      ${canManage&&m.status==='live'?`<button class="chip-btn" style="color:var(--danger)" onclick="cancelMeetingV1044('${m.id}')">${meet102L('إلغاء الاجتماع','Cancel meeting')}</button>`:''}
      ${m.status==='ended'?`<button class="chip-btn" onclick="meetingV1044RatingModal('${m.id}')">★ ${meet102L('تقييم الاجتماع','Rate meeting')}</button>`:''}
    </div>
  </article>`
};

async function cancelMeetingV1044(id){
  const m=meetingByIdV101(id);if(!m?.can_manage)return;
  const ok=await taskyConfirm(meet101L(`إلغاء اجتماع «${m.title}»؟ سيتم إخراج المشاركين وإغلاق جلسات الضيوف.`,`Cancel “${m.title}”? Participants will be removed and guest sessions closed.`),{title:meet101L('إلغاء الاجتماع','Cancel meeting'),tone:'danger',confirmText:meet101L('إلغاء الاجتماع','Cancel meeting')});
  if(!ok)return;
  const {error}=await sb.rpc('tasky_meeting_cancel_v1044',{p_meeting_id:id});
  if(error)return showTaskyDialog({title:meet101L('تعذّر إلغاء الاجتماع','Could not cancel meeting'),message:error.message,tone:'error'});
  if(meetingRoomV101?.id===id){await meetingBroadcastSignalV101('meeting-cancelled',{},'*');await leaveMeetingRoomV101({silent:true})}
  else{await fetchMeetingsV101();renderModule()}
  taskyToast(meet101L('تم إلغاء الاجتماع','Meeting cancelled'),{tone:'success'});
}

/* End lifecycle: refresh state and offer rating after the room closes. */
const endMeetingBaseV1044=endMeetingV101;
endMeetingV101=async function(){
  if(!meetingRoomV101?.can_manage)return;
  const endedId=meetingRoomV101.id;
  const ok=await taskyConfirm(meet101L('إنهاء الاجتماع لجميع المشاركين؟','End the meeting for all participants?'),{title:meet101L('إنهاء الاجتماع','End meeting'),tone:'danger',confirmText:meet101L('إنهاء','End')});
  if(!ok)return;
  const {error}=await sb.rpc('tasky_meeting_end_v1044',{p_meeting_id:endedId});
  if(error)return showTaskyDialog({title:meet101L('تعذّر إنهاء الاجتماع','Could not end meeting'),message:error.message,tone:'error'});
  await meetingBroadcastSignalV101('meeting-ended',{},'*');
  meetingV1044LastMemberMeeting=endedId;
  await leaveMeetingRoomV101({silent:true});
  await fetchMeetingsV101();if(activeNav==='meetings')renderModule();
  taskyToast(meet101L('تم إنهاء الاجتماع','Meeting ended'),{tone:'success'});
  setTimeout(()=>meetingV1044RatingModal(endedId),250);
};

/* Guest cancellation/end signals show the correct exit state and keep a rating token. */
const meetingHandleSignalBaseV1044=meetingHandleSignalV101;
meetingHandleSignalV101=async function(payload){
  if(meetingGuestSessionV102&&['meeting-ended','meeting-cancelled'].includes(payload?.kind)){
    const sess={...meetingGuestSessionV102},mid=meetingRoomV101?.id;
    meetingV1044LastGuestRating={id:sess.id,token:sess.token,meetingId:mid};
    await leaveMeetingRoomV101({silent:true,skipFetch:true});
    renderPublicMeetingGuestExitV1044(payload.kind==='meeting-cancelled'?meet102L('تم إلغاء الاجتماع','The meeting was cancelled'):meet102L('أنهى المنظّم الاجتماع','The organizer ended the meeting'),mid);
    return;
  }
  return meetingHandleSignalBaseV1044(payload);
};
function renderPublicMeetingGuestExitV1044(message,meetingId){
  const p=meetingGuestPublicV102;if(!p)return;
  meet102GuestFrameV102(`<div class="meet102-guest-card meet102-exit"><div class="meet102-exit-check">✓</div><h1>${escapeHtml(message||meet102L('تمت مغادرة الاجتماع','You left the meeting'))}</h1><p>${meet102L('شكرًا لمشاركتك. يمكنك تقييم تجربة الاجتماع قبل المغادرة.','Thanks for joining. You can rate the meeting experience before leaving.')}</p>${meetingId?`<button class="submit-btn" onclick="meetingV1044RatingModal('${meetingId}',true)">★ ${meet102L('تقييم الاجتماع','Rate meeting')}</button>`:''}<button class="chip-btn" style="margin-top:8px" onclick="showPublicMeetingGuestPortalV102('${escapeHtml(p.roomCode)}','${escapeHtml(p.guestToken)}')">${meet102L('العودة إلى صفحة الاجتماع','Back to meeting page')}</button></div>`);
}

/* Member session check uses immediate lifecycle state from V104.4. */
meetingSessionCheckV101=async function(){
  if(meetingGuestSessionV102){
    try{
      const {data,error}=await sb.rpc('tasky_public_meeting_guest_session_check_v102',{p_guest_session_id:meetingGuestSessionV102.id,p_guest_session_token:meetingGuestSessionV102.token});
      if(error)throw error;
      if(!data?.authorized){
        const sess={...meetingGuestSessionV102},mid=meetingRoomV101?.id;
        meetingV1044LastGuestRating={id:sess.id,token:sess.token,meetingId:mid};
        const msg=data?.status==='ended'?meet102L('أنهى المنظّم الاجتماع','The organizer ended the meeting'):data?.status==='cancelled'?meet102L('تم إلغاء الاجتماع','The meeting was cancelled'):meet102L('انتهت صلاحية جلسة الضيف','Your guest session is no longer valid');
        await leaveMeetingRoomV101({silent:true,skipFetch:true});renderPublicMeetingGuestExitV1044(msg,mid);
      }
    }catch(err){console.warn('V104.4 guest session check',err)}
    return;
  }
  if(!meetingRoomV101)return;
  try{
    const {data,error}=await sb.rpc('tasky_meeting_session_check_v101',{p_meeting_id:meetingRoomV101.id});
    if(error)throw error;
    if(!data?.authorized||['ended','cancelled','missing'].includes(data?.status)){
      const mid=meetingRoomV101.id;
      const msg=data?.status==='ended'?meet101L('تم إنهاء الاجتماع','The meeting has ended'):data?.status==='cancelled'?meet101L('تم إلغاء الاجتماع','The meeting was cancelled'):meet101L('لم يعد لديك وصول إلى هذا الاجتماع','You no longer have access to this meeting');
      await leaveMeetingRoomV101({silent:true});taskyToast(msg,{tone:'warning'});
      if(data?.status==='ended')setTimeout(()=>meetingV1044RatingModal(mid),200);
    }
  }catch(err){console.warn('V104.4 meeting session check',err)}
};

/* Header should show participant count only, never the room code. */
const meetingRenderRoomBaseV1044=meetingRenderRoomV101;
meetingRenderRoomV101=function(){
  meetingRenderRoomBaseV1044();
  if(!meetingRoomV101)return;
  const rem=meetingRemoteParticipantsV101();
  const meta=document.getElementById('meet101RoomMeta');
  if(meta)meta.textContent=`${rem.length+1} ${meet101L('مشارك','participants')}`;
};

/* Click-away behavior for reaction palette and meeting drawers/popovers. */
document.addEventListener('pointerdown',e=>{
  const react=document.getElementById('meet103Reactions');
  if(react&&!react.contains(e.target)&&!e.target.closest?.('[onclick*="meetingToggleReactionsV103"]')){react.remove();meetingV103ReactionsOpen=false}
  const drawer=document.getElementById('meet103Drawer');
  if(drawer?.classList.contains('open')&&!drawer.contains(e.target)&&!e.target.closest?.('#meet103Tools'))meetingCloseDrawerV103();
},true);

/* Close reaction palette immediately after choosing an emoji. */
const meetingV103ReactBaseV1044=meetingV103React;
meetingV103React=async function(emoji){
  document.getElementById('meet103Reactions')?.remove();meetingV103ReactionsOpen=false;
  return meetingV103ReactBaseV1044(emoji);
};


/* --- source script: tasky-v1045-meeting-privacy-ux-js --- */

window.TASKY_BUILD='V104.5';console.info('Tasky build',window.TASKY_BUILD);

let meetingV1045HostMuted=false;
const meetingV1045StartedAt=new Map();

function meetingV1045NormalizeName(v){
  return String(v||'').trim().toLocaleLowerCase(lang==='ar'?'ar':'en');
}
function meetingV1045DisplayName(){
  const me=meetingMeV101?.()||{};
  const raw=String(me.fullName||'').trim();
  if(raw && !raw.includes('@')) return raw;
  const member=meetingMemberV101?.(currentUserId);
  const candidate=String(member?.fullName||member?.invitedName||'').trim();
  if(candidate && !candidate.includes('@')) return candidate;
  return meet103L('عضو تاسكي','Tasky member');
}
function meetingV1045GuestOrMemberInvite(){
  if(!meetingRoomV101)return;
  return meetingShareInviteV103(meetingRoomV101.room_code);
}
function meetingV1045PatchToolbar(){
  const tools=document.getElementById('meet103Tools');if(!tools)return;
  /* Hide-self was redundant with the camera control and could confuse camera state. */
  document.getElementById('meet1043SelfBtn')?.remove();
  meetingV1043SelfHidden=false;
  document.querySelector('[data-peer="local"]')?.classList.remove('meet1043-self-hidden');

  let invite=document.getElementById('meet1045InviteBtn');
  if(!invite){
    invite=document.createElement('button');
    invite.id='meet1045InviteBtn';invite.type='button';invite.className='meet103-pill';
    invite.onclick=meetingV1045GuestOrMemberInvite;
    invite.innerHTML=`✉️ <span>${meet103L('دعوة','Invite')}</span>`;
    tools.appendChild(invite);
  }
}
/* Keep external guest links available to the organizer after leaving the room,
   as long as the meeting itself is still scheduled/live. */
const meetingCardBaseV1045=meetingCardV101;
meetingCardV101=function(m,past=false){
  let h=meetingCardBaseV1045(m,past);
  if(m?.can_manage&&m?.allow_guests&&['scheduled','live'].includes(m.status)&&!h.includes('meetingCopyGuestLinkV102')){
    h=h.replace('</div></article>',`<button class="chip-btn meet102-guest-link-btn" onclick="meetingCopyGuestLinkV102('${m.id}')">${meet102L('رابط ضيف بدون تسجيل','No-login guest link')}</button></div></article>`);
  }
  return h;
};

/* Reaction palette: replace 😂 with 🙂 and keep click-away behavior from V104.4. */
meetingToggleReactionsV103=function(){
  const old=document.getElementById('meet103Reactions');
  if(old){old.remove();meetingV103ReactionsOpen=false;return}
  const d=document.createElement('div');d.id='meet103Reactions';d.className='meet103-reactions';
  d.innerHTML=['👍','👏','❤️','🙂','🎉','🤔','🙋'].map(x=>`<button onclick="meetingV103React('${x}')">${x}</button>`).join('');
  document.body.appendChild(d);meetingV103ReactionsOpen=true;
};

/* Privacy: a host can force mute, but never force unmute.
   After a host mute, the participant cannot locally reopen the mic until the host sends
   an explicit request and the participant accepts it. */
const toggleMeetingMicBaseV1045=toggleMeetingMicV101;
toggleMeetingMicV101=async function(){
  const tracks=meetingLocalStreamV101?.getAudioTracks?.()||[];
  const wantsOn=!!tracks.length&&!tracks[0].enabled;
  if(wantsOn&&meetingV1045HostMuted){
    taskyToast(meet103L('المنظّم كتم مايكك. انتظر طلب فتح المايك ثم وافق عليه بنفسك.','The organizer muted you. Wait for an unmute request and approve it yourself.'),{tone:'warning'});
    return;
  }
  return toggleMeetingMicBaseV1045();
};
meetingV103HandleControl=async function(payload){
  const a=payload?.action;
  if(a==='mute'){
    const tracks=meetingLocalStreamV101?.getAudioTracks?.()||[];
    tracks.forEach(t=>t.enabled=false);
    meetingLocalStateV101.mic=false;
    meetingV1045HostMuted=true;
    meetingRenderRoomV101();
    await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*');
    return taskyToast(meet103L('قام المنظّم بكتم مايكك. لا يمكن إعادة فتحه إلا بعد طلب من المنظّم وموافقتك.','The organizer muted your microphone. It can only be reopened after an organizer request and your approval.'),{tone:'warning'});
  }
  if(a==='request_unmute'||a==='invite_speak'){
    const msg=a==='request_unmute'
      ?meet103L('يطلب المنظّم منك فتح المايك. لن يتم تشغيله إلا إذا وافقت.','The organizer is asking you to unmute. Your microphone will turn on only if you approve.')
      :meet103L('يدعوك المنظّم للمشاركة. هل توافق على تشغيل المايك؟','The organizer invites you to speak. Do you approve turning on your microphone?');
    if(await taskyConfirm(msg,{title:meet103L('إذن المايك','Microphone permission')})){
      const tracks=meetingLocalStreamV101?.getAudioTracks?.()||[];
      if(!tracks.length)return taskyToast(meet103L('لا يوجد مسار مايك مصرح به','No authorized microphone track'),{tone:'warning'});
      meetingV1045HostMuted=false;
      tracks.forEach(t=>t.enabled=true);meetingLocalStateV101.mic=true;
      meetingRenderRoomV101();await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*');
    }
  }
};

/* Robust timer: use canonical started_at if present; otherwise keep one stable client
   timestamp per meeting instead of resetting it on every room render. */
function meetingV1045StartTime(){
  if(!meetingRoomV101)return Date.now();
  const id=String(meetingRoomV101.id||meetingRoomV101.room_code||'room');
  const canonical=meetingRoomV101.started_at||meetingByIdV101?.(meetingRoomV101.id)?.started_at;
  if(canonical){
    const t=new Date(canonical).getTime();
    if(Number.isFinite(t)){meetingV1045StartedAt.set(id,t);return t}
  }
  if(!meetingV1045StartedAt.has(id))meetingV1045StartedAt.set(id,Date.now());
  return meetingV1045StartedAt.get(id);
}
meetingV1043UpdateTimer=function(){
  const el=document.getElementById('meet1043Timer');if(!el||!meetingRoomV101)return;
  el.textContent=meetingV1043FormatElapsed(Date.now()-meetingV1045StartTime());
};

/* Chat should show names, not emails. Also show "speaking now" beside the sender name. */
function meetingV1045SpeakingNames(){
  const out=new Set();
  const local=document.querySelector('.meet101-video-tile[data-peer="local"].meet1042-speaking');
  if(local)out.add(meetingV1045NormalizeName(meetingV1045DisplayName()));
  for(const p of meetingRemoteParticipantsV101()){
    const tile=document.querySelector(`.meet101-video-tile[data-peer="${CSS.escape(String(p.peerId))}"].meet1042-speaking`);
    if(tile)out.add(meetingV1045NormalizeName(p.name||''));
  }
  return out;
}
function meetingV1045PatchChatSpeaking(){
  if(meetingV103DrawerTab!=='chat')return;
  const speaking=meetingV1045SpeakingNames();
  document.querySelectorAll('#meet103DrawerBody .meet103-chat-msg').forEach(row=>{
    const b=row.querySelector('b');if(!b)return;
    b.querySelector('.meet1045-speaking-chip')?.remove();
    const raw=[...b.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();
    if(speaking.has(meetingV1045NormalizeName(raw))){
      b.insertAdjacentHTML('beforeend',`<span class="meet1045-speaking-chip">● ${meet103L('يتحدث الآن','Speaking now')}</span>`);
    }
  });
}
function meetingV1045PatchChatParticipation(){
  if(meetingV103DrawerTab!=='chat'||meetingRoomV101?.can_manage)return;
  const compose=document.getElementById('meet103ChatCompose');if(!compose)return;
  let b=document.getElementById('meet1045ChatHandBtn');
  if(!b){
    b=document.createElement('button');b.id='meet1045ChatHandBtn';b.type='button';b.className='meet1045-chat-hand';
    b.onclick=meetingV1042RequestParticipation;compose.appendChild(b);
  }
  b.classList.toggle('active',!!meetingV1042HandRaised);
  b.textContent=meetingV1042HandRaised?`🙋 ${meet103L('إلغاء طلب المشاركة','Cancel participation request')}`:`🙋 ${meet103L('طلب المشاركة','Ask to speak')}`;
}
const meetingV103RenderDrawerBaseV1045=meetingV103RenderDrawer;
meetingV103RenderDrawer=function(){
  meetingV103RenderDrawerBaseV1045();
  meetingV1045PatchChatParticipation();
  meetingV1045PatchChatSpeaking();
};

/* Keep the speaking state next to chat names updated without rebuilding the chat. */
const meetingV1042UpdateSpeakersBaseV1045=meetingV1042UpdateSpeakers;
meetingV1042UpdateSpeakers=function(){
  meetingV1042UpdateSpeakersBaseV1045();
  meetingV1045PatchChatSpeaking();
};

/* Camera-off must remove the remote video image immediately; only avatar/name remains. */
const meetingRenderRoomBaseV1045=meetingRenderRoomV101;
meetingRenderRoomV101=function(){
  meetingRenderRoomBaseV1045();
  if(!meetingRoomV101)return;
  meetingV1045PatchToolbar();
  const meta=document.getElementById('meet101RoomMeta');
  if(meta&&meetingV1045HostMuted&&!meetingLocalStateV101.mic&&!meetingRoomV101.can_manage){
    meta.insertAdjacentHTML('afterend',`<span class="meet1045-host-muted">🔒 ${meet103L('مكتوم بواسطة المنظّم','Muted by organizer')}</span>`);
  }
  /* Ensure stale video frames are hidden whenever presence reports camera off. */
  for(const p of meetingRemoteParticipantsV101()){
    const tile=document.querySelector(`.meet101-video-tile[data-peer="${CSS.escape(String(p.peerId))}"]`);
    const metaP=meetingRemoteMetaV101.get(p.peerId)||{};
    tile?.classList.toggle('has-video',metaP.camera!==false||metaP.screen===true);
  }
};

/* When leaving/rejoining, do not carry a host-mute lock into a different session. */
const leaveMeetingRoomBaseV1045=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){
  meetingV1045HostMuted=false;
  return leaveMeetingRoomBaseV1045(opts);
};


/* --- source script: tasky-v1046-meeting-minutes-js --- */

window.TASKY_BUILD='V104.6';console.info('Tasky build',window.TASKY_BUILD);

let meetingV1046MinutesCtx=null;
let meetingV1046MinutesMeetingId=null;
let meetingV1046MinutesSaveTimer=null;
let meetingV1046MinutesSaving=false;

function meet1046L(ar,en){return lang==='ar'?ar:en}
function meetingV1046MemberTerminal(m){return !!m&&['ended','cancelled'].includes(m.status)}
function meetingV1046RatingStars(meetingId,myRating=0,guest=false){
  return `<div class="${guest?'meet1046-rating-guest':'meet1046-stars'}">${[1,2,3,4,5].map(n=>`<button type="button" class="${Number(myRating)>=n?'active':''}" title="${n}/5" onclick="${guest?`meetingV1046RateGuest('${meetingId}',${n})`:`meetingV1046RateMember('${meetingId}',${n})`}">★</button>`).join('')}</div>`;
}
async function meetingV1046RateMember(meetingId,n){
  const {error}=await sb.rpc('tasky_meeting_rate_v1044',{p_meeting_id:meetingId,p_rating:n,p_comment:null});
  if(error)return showTaskyDialog({title:meet1046L('تعذّر حفظ التقييم','Could not save rating'),message:error.message,tone:'error'});
  taskyToast(meet1046L('تم حفظ تقييم الجودة التقنية','Technical-quality rating saved'),{tone:'success'});
  await fetchMeetingsV101();if(activeNav==='meetings')renderModule();
}
async function meetingV1046RateGuest(meetingId,n){
  const g=meetingV1044LastGuestRating;
  if(!g||g.meetingId!==meetingId)return taskyToast(meet1046L('انتهت جلسة التقييم','Rating session expired'),{tone:'warning'});
  const {error}=await sb.rpc('tasky_public_meeting_rate_v1044',{p_meeting_id:meetingId,p_guest_session_id:g.id,p_guest_session_token:g.token,p_rating:n,p_comment:null});
  if(error)return showTaskyDialog({title:meet1046L('تعذّر حفظ التقييم','Could not save rating'),message:error.message,tone:'error'});
  taskyToast(meet1046L('شكرًا، تم تقييم الجودة التقنية','Thanks — technical quality rated'),{tone:'success'});
  document.querySelectorAll('.meet1046-rating-guest button').forEach((b,i)=>b.classList.toggle('active',i<n));
}

/* Use V104.6 list so cards know the current user's rating and minute status. */
fetchMeetingsV101=async function(){
  if(!currentWorkspaceId)return[];
  meetingsLoadingV101=true;meetingsErrorV101='';
  try{
    const {data,error}=await sb.rpc('tasky_meeting_list_v1046',{p_workspace_id:currentWorkspaceId});
    if(error)throw error;meetingsV101=Array.isArray(data)?data:[];return meetingsV101;
  }catch(err){meetingsErrorV101=err?.message||String(err);console.warn('Tasky V104.6 meetings',err);meetingsV101=[];return[]}
  finally{meetingsLoadingV101=false}
};

/* Terminal meetings no longer expose/copy a member join link. */
const meetingCopyLinkBaseV1046=meetingCopyLinkV101;
meetingCopyLinkV101=async function(roomCode){
  const m=meetingsV101.find(x=>x.room_code===String(roomCode||'').toUpperCase());
  if(meetingV1046MemberTerminal(m)){
    return taskyToast(m.status==='ended'?meet1046L('انتهى الاجتماع وأُغلق رابط دخول الأعضاء','The meeting ended and the member join link is closed'):meet1046L('تم إلغاء الاجتماع وأُغلق رابط دخول الأعضاء','The meeting was cancelled and the member join link is closed'),{tone:'warning'});
  }
  return meetingCopyLinkBaseV1046(roomCode);
};

/* Deep member links resolve against canonical status before opening the join dialog. */
taskyMeetingHandleDeepLinkV101=function(){
  if(meetingDeepLinkHandledV101||!currentWorkspaceId)return;
  const code=String(new URL(location.href).searchParams.get('meeting')||'').trim().toUpperCase();
  const guest=new URL(location.href).searchParams.get('guest');
  if(!code||guest)return;
  meetingDeepLinkHandledV101=true;
  setActiveNav('meetings');
  taskyEnsureModuleLoadedV83('meetings',{force:true}).then(async()=>{
    await fetchMeetingsV101();
    const m=meetingsV101.find(x=>x.room_code===code);
    if(m&&meetingV1046MemberTerminal(m)){
      const u=new URL(location.href);u.searchParams.delete('meeting');history.replaceState({},'',u.toString());
      return showTaskyDialog({title:m.status==='ended'?meet1046L('الاجتماع منتهي','Meeting ended'):meet1046L('الاجتماع ملغي','Meeting cancelled'),message:meet1046L('رابط دخول الأعضاء لم يعد صالحًا لهذا الاجتماع.','The member join link is no longer valid for this meeting.'),tone:'warning'});
    }
    setTimeout(()=>openMeetingJoinConfirmV101(code),80);
  });
};

/* Rebuild cards: direct technical-quality stars + minutes + no terminal member links. */
meetingCardV101=function(m,past=false){
  const canJoin=!meetingV1046MemberTerminal(m),canManage=!!m.can_manage;
  const canMinutes=!!m.can_edit_minutes||!!m.has_minutes||canManage;
  const rating=m.status==='ended'?`<div class="meet1046-rating-inline"><span class="meet1046-rating-label">${meet1046L('قيّم الجودة التقنية للاجتماع','Rate the meeting technical quality')}</span>${meetingV1046RatingStars(m.id,m.my_rating||0,false)}</div>`:'';
  return `<article class="meet101-card ${escapeHtml(m.status)} ${past?'past':''}">
    <div class="meet101-card-head"><div><div class="meet102-title-row"><h3>${escapeHtml(m.title)}</h3>${m.allow_guests?`<span class="meet102-guest-badge">${meet102L('دخول خارجي','External guests')}</span>`:''}</div><p>${escapeHtml(m.description||meet102L('اجتماع عبر تاسكي','Tasky meeting'))}</p></div><span class="meet101-status ${escapeHtml(m.status)}">${escapeHtml(meetingStatusLabelV101(m.status))}</span></div>
    ${meetingV1044StatusNote(m)}
    <div class="meet101-meta"><div><span>${meet102L('الموعد','When')}</span><b>${escapeHtml(meetingDateV101(m.scheduled_at))}</b></div><div><span>${meet102L('المدة','Duration')}</span><b>${Number(m.duration_minutes||30)} ${meet102L('دقيقة','min')}</b></div><div><span>${meet102L('المنظّم','Organizer')}</span><b>${escapeHtml(meetingMemberNameV101(m.created_by))}</b></div></div>
    ${meetingV1044StatsHtml(m)}${rating}
    <div class="meet101-card-actions">
      ${canJoin?`<button class="primary-btn" onclick="openMeetingJoinConfirmV101('${m.room_code}')"><svg><use href="#i-camera"/></svg>${m.status==='live'?meet102L('انضم الآن','Join now'):meet102L('دخول الاجتماع','Join meeting')}</button><button class="chip-btn" onclick="meetingCopyLinkV101('${m.room_code}')">${meet102L('رابط الأعضاء','Member link')}</button>`:''}
      ${canManage&&m.allow_guests&&canJoin?`<button class="chip-btn meet102-guest-link-btn" onclick="meetingCopyGuestLinkV102('${m.id}')">${meet102L('رابط ضيف بدون تسجيل','No-login guest link')}</button>`:''}
      ${canManage&&m.status==='scheduled'?`<button class="chip-btn" onclick="openMeetingEditorV101('${m.id}')">${meet102L('تعديل','Edit')}</button><button class="chip-btn" style="color:var(--danger)" onclick="cancelMeetingV1044('${m.id}')">${meet102L('إلغاء','Cancel')}</button>`:''}
      ${canManage&&m.status==='live'?`<button class="chip-btn" style="color:var(--danger)" onclick="cancelMeetingV1044('${m.id}')">${meet102L('إلغاء الاجتماع','Cancel meeting')}</button>`:''}
      ${canMinutes?`<button class="chip-btn" onclick="meetingV1046OpenMinutesReference('${m.id}')">📝 ${meet1046L('محضر الاجتماع','Meeting minutes')}</button>`:''}
      ${canManage?`<button class="chip-btn" onclick="meetingV1046ManageEditors('${m.id}')">🔐 ${meet1046L('صلاحيات المحضر','Minutes access')}</button>`:''}
    </div>
  </article>`;
};

/* Direct technical-quality stars on the guest exit page. */
renderPublicMeetingGuestExitV1044=function(message,meetingId){
  const p=meetingGuestPublicV102;if(!p)return;
  meet102GuestFrameV102(`<div class="meet102-guest-card meet102-exit"><div class="meet102-exit-check">✓</div><h1>${escapeHtml(message||meet102L('تمت مغادرة الاجتماع','You left the meeting'))}</h1><p>${meet1046L('قيّم الجودة التقنية للصوت والفيديو والاتصال.','Rate the technical quality of audio, video, and connection.')}</p>${meetingId?meetingV1046RatingStars(meetingId,0,true):''}<button class="chip-btn" style="margin-top:8px" onclick="showPublicMeetingGuestPortalV102('${escapeHtml(p.roomCode)}','${escapeHtml(p.guestToken)}')">${meet102L('العودة إلى صفحة الاجتماع','Back to meeting page')}</button></div>`);
};

/* ---------- Minutes permissions ---------- */
async function meetingV1046ManageEditors(meetingId){
  const {data,error}=await sb.rpc('tasky_meeting_minutes_editors_v1046',{p_meeting_id:meetingId});
  if(error)return showTaskyDialog({title:meet1046L('تعذّر تحميل الصلاحيات','Could not load permissions'),message:error.message,tone:'error'});
  const enabled=new Set((data?.editor_user_ids||[]).map(String));
  const members=teamMembers.filter(x=>x.status==='active'&&x.userId);
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${meet1046L('صلاحيات كتابة محضر الاجتماع','Meeting minutes editors')}</h3><div class="subtle">${meet1046L('المنظم ومديرو مساحة العمل لديهم الصلاحية تلقائيًا. يمكنك منح أي عضو مدعو للاجتماع — مثل السكرتير — صلاحية التوثيق.','Organizer and workspace admins have access automatically. You can grant any invited member — such as a secretary — permission to document the meeting.')}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
    <div class="meet1046-permissions">${members.map(m=>`<label class="meet1046-perm-row"><span><b>${escapeHtml(m.fullName||m.email)}</b><small style="display:block;color:var(--muted)">${escapeHtml(m.jobTitle||'')}</small></span><input type="checkbox" ${enabled.has(String(m.userId))?'checked':''} onchange="meetingV1046SetEditor('${meetingId}','${m.userId}',this.checked)"></label>`).join('')}</div>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
}
async function meetingV1046SetEditor(meetingId,userId,enabled){
  const {error}=await sb.rpc('tasky_meeting_minutes_set_editor_v1046',{p_meeting_id:meetingId,p_user_id:userId,p_enabled:enabled});
  if(error)return showTaskyDialog({title:meet1046L('تعذّر تحديث الصلاحية','Could not update permission'),message:error.message,tone:'error'});
  if(meetingRoomV101?.id===meetingId){meetingV1046MinutesCtx=null;meetingV1046EnsureContext(true)}
  taskyToast(meet1046L('تم تحديث صلاحية المحضر','Minutes permission updated'),{tone:'success'});
}

/* ---------- Live side-panel minutes ---------- */
async function meetingV1046EnsureContext(force=false){
  if(!meetingRoomV101||meetingV103IsGuest())return null;
  if(!force&&meetingV1046MinutesCtx&&meetingV1046MinutesMeetingId===meetingRoomV101.id)return meetingV1046MinutesCtx;
  const {data,error}=await sb.rpc('tasky_meeting_minutes_get_v1046',{p_meeting_id:meetingRoomV101.id});
  if(error){console.warn('V104.6 minutes context',error);return null}
  meetingV1046MinutesCtx=data||{};meetingV1046MinutesMeetingId=meetingRoomV101.id;
  meetingV1046PatchMinutesButton();
  return meetingV1046MinutesCtx;
}
function meetingV1046PatchMinutesButton(){
  const tools=document.getElementById('meet103Tools');if(!tools||!meetingV1046MinutesCtx?.can_edit)return;
  if(document.getElementById('meet1046MinutesBtn'))return;
  const b=document.createElement('button');b.id='meet1046MinutesBtn';b.type='button';b.className='meet103-pill';
  b.onclick=meetingV1046OpenLiveMinutes;b.innerHTML=`📝 <span>${meet1046L('المحضر','Minutes')}</span>`;tools.appendChild(b);
}
function meetingV1046ParticipantNames(){
  const names=[meetingV1045DisplayName(),...meetingRemoteParticipantsV101().map(p=>p.name)].map(x=>String(x||'').trim()).filter(Boolean);
  return [...new Set(names)];
}
function meetingV1046Insert(text){
  const ta=document.getElementById('meet1046MinutesText');if(!ta)return;
  const start=ta.selectionStart??ta.value.length,end=ta.selectionEnd??ta.value.length;
  const prefix=start&&ta.value[start-1]!=='\n'?' ':'';
  ta.setRangeText(prefix+text,start,end,'end');ta.focus();meetingV1046ScheduleSave();
}
function meetingV1046ShortcutHtml(){
  const labels=[meet1046L('قرار: ','Decision: '),meet1046L('إجراء: ','Action: '),meet1046L('مسؤول: ','Owner: '),meet1046L('موعد: ','Due: '),meet1046L('متابعة: ','Follow-up: '),meet1046L('ملاحظة: ','Note: ')];
  const people=meetingV1046ParticipantNames().map(n=>`@${n} `);
  return [...labels,...people].map(x=>`<button type="button" onclick='meetingV1046Insert(${JSON.stringify(x)})'>${escapeHtml(x)}</button>`).join('');
}
async function meetingV1046OpenLiveMinutes(){
  const ctx=await meetingV1046EnsureContext(true);if(!ctx?.can_edit)return;
  document.getElementById('meet1046MinutesBackdrop')?.remove();document.getElementById('meet1046MinutesPanel')?.remove();
  const back=document.createElement('div');back.id='meet1046MinutesBackdrop';back.className='meet1046-minutes-backdrop';back.onclick=meetingV1046CloseMinutes;
  const panel=document.createElement('aside');panel.id='meet1046MinutesPanel';panel.className='meet1046-minutes-panel';
  panel.innerHTML=`<div class="meet1046-minutes-head"><div><h3>📝 ${meet1046L('محضر الاجتماع','Meeting minutes')}</h3><p>${meet1046L('توثيق داخلي سريع. استخدم الاختصارات لإدراج القرارات والإجراءات وأسماء الحضور.','Fast internal documentation. Use shortcuts for decisions, actions, and participant names.')}</p></div><button class="modal-close" onclick="meetingV1046CloseMinutes()">×</button></div>
    <div class="meet1046-minutes-body"><div class="meet1046-shortcuts">${meetingV1046ShortcutHtml()}</div>
    <textarea id="meet1046MinutesText" class="meet1046-minutes-text" placeholder="${meet1046L('ابدأ توثيق الاجتماع هنا…','Start documenting the meeting here…')}" oninput="meetingV1046ScheduleSave()">${escapeHtml(ctx.content||'')}</textarea>
    <span id="meet1046SaveState" class="meet1046-save-state">${ctx.updated_at?meet1046L('آخر حفظ: ','Last saved: ')+meetingDateV101(ctx.updated_at):meet1046L('لم يُحفظ بعد','Not saved yet')}</span></div>
    <div class="meet1046-minutes-actions"><button class="primary-btn" onclick="meetingV1046SaveMinutes(true)">${meet1046L('حفظ الآن','Save now')}</button>${ctx.can_manage_editors?`<button class="chip-btn" onclick="meetingV1046ManageEditors('${meetingRoomV101.id}')">🔐 ${meet1046L('الصلاحيات','Permissions')}</button>`:''}</div>`;
  document.body.append(back,panel);setTimeout(()=>document.getElementById('meet1046MinutesText')?.focus(),50);
}
function meetingV1046CloseMinutes(){clearTimeout(meetingV1046MinutesSaveTimer);meetingV1046SaveMinutes(false);document.getElementById('meet1046MinutesBackdrop')?.remove();document.getElementById('meet1046MinutesPanel')?.remove()}
function meetingV1046ScheduleSave(){clearTimeout(meetingV1046MinutesSaveTimer);const s=document.getElementById('meet1046SaveState');if(s)s.textContent=meet1046L('تغييرات غير محفوظة…','Unsaved changes…');meetingV1046MinutesSaveTimer=setTimeout(()=>meetingV1046SaveMinutes(false),1800)}
async function meetingV1046SaveMinutes(showToast=false){
  const ta=document.getElementById('meet1046MinutesText');if(!ta||!meetingRoomV101||meetingV1046MinutesSaving)return;
  meetingV1046MinutesSaving=true;
  const {data,error}=await sb.rpc('tasky_meeting_minutes_save_v1046',{p_meeting_id:meetingRoomV101.id,p_content:ta.value});
  meetingV1046MinutesSaving=false;
  if(error){const s=document.getElementById('meet1046SaveState');if(s)s.textContent=meet1046L('تعذّر الحفظ','Save failed');if(showToast)showTaskyDialog({title:meet1046L('تعذّر حفظ المحضر','Could not save minutes'),message:error.message,tone:'error'});return}
  meetingV1046MinutesCtx={...(meetingV1046MinutesCtx||{}),content:ta.value,updated_at:data?.updated_at||new Date().toISOString()};
  const s=document.getElementById('meet1046SaveState');if(s)s.textContent=meet1046L('تم الحفظ','Saved')+' · '+new Date().toLocaleTimeString(lang==='ar'?'ar-SA':'en-US',{hour:'2-digit',minute:'2-digit'});
  if(showToast)taskyToast(meet1046L('تم حفظ محضر الاجتماع','Meeting minutes saved'),{tone:'success'});
}

/* ---------- Post-meeting minutes reference / export ---------- */
async function meetingV1046OpenMinutesReference(meetingId){
  const {data,error}=await sb.rpc('tasky_meeting_minutes_get_v1046',{p_meeting_id:meetingId});
  if(error)return showTaskyDialog({title:meet1046L('تعذّر تحميل المحضر','Could not load minutes'),message:error.message,tone:'error'});
  const m=meetingsV101.find(x=>x.id===meetingId)||{};
  const content=String(data?.content||'').trim();
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${meet1046L('محضر الاجتماع','Meeting minutes')} — ${escapeHtml(m.title||'')}</h3><div class="subtle">${data?.status==='final'?meet1046L('محضر معتمد','Final minutes'):meet1046L('مسودة محضر','Draft minutes')}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
    <div class="meet1046-report">${content?`<pre>${escapeHtml(content)}</pre>`:`<div class="meet101-empty">${meet1046L('لا يوجد محتوى موثق في المحضر حتى الآن.','No minutes have been documented yet.')}</div>`}</div>
    <div class="meet101-actions">${data?.can_edit?`<button class="primary-btn" onclick="closeAddModal();meetingV1046OpenMinutesForPast('${meetingId}')">${meet1046L('تعديل المحضر','Edit minutes')}</button>`:''}${content?`<button class="chip-btn" onclick="meetingV1046PrintReport('${meetingId}')">${meet1046L('استخراج تقرير','Export report')}</button><button class="chip-btn" onclick="meetingV1046CopyEmail('${meetingId}')">${meet1046L('نسخ نص بريد','Copy email text')}</button>`:''}${data?.can_edit&&m.status==='ended'&&data?.status!=='final'?`<button class="chip-btn" onclick="meetingV1046Finalize('${meetingId}')">${meet1046L('اعتماد المحضر','Finalize')}</button>`:''}</div>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
}
async function meetingV1046OpenMinutesForPast(meetingId){
  const {data,error}=await sb.rpc('tasky_meeting_minutes_get_v1046',{p_meeting_id:meetingId});if(error||!data?.can_edit)return;
  const fakeRoom=meetingRoomV101;meetingRoomV101=meetingsV101.find(x=>x.id===meetingId)||{id:meetingId,room_code:''};
  meetingV1046MinutesCtx=data;meetingV1046MinutesMeetingId=meetingId;meetingV1046OpenLiveMinutes();
  meetingRoomV101=fakeRoom;
}
async function meetingV1046Finalize(meetingId){
  const ok=await taskyConfirm(meet1046L('اعتماد المحضر؟ سيظل محفوظًا كمرجع ويمكن لمدير الاجتماع فتحه لاحقًا.','Finalize the minutes as the meeting reference?'),{title:meet1046L('اعتماد المحضر','Finalize minutes')});if(!ok)return;
  const {error}=await sb.rpc('tasky_meeting_minutes_finalize_v1046',{p_meeting_id:meetingId});if(error)return showTaskyDialog({title:meet1046L('تعذّر الاعتماد','Could not finalize'),message:error.message,tone:'error'});
  closeAddModal();await fetchMeetingsV101();renderModule();taskyToast(meet1046L('تم اعتماد محضر الاجتماع','Meeting minutes finalized'),{tone:'success'});
}
async function meetingV1046GetExportData(meetingId){
  const {data,error}=await sb.rpc('tasky_meeting_minutes_get_v1046',{p_meeting_id:meetingId});if(error)throw error;
  const m=meetingsV101.find(x=>x.id===meetingId)||{};
  return {m,d:data||{}};
}
async function meetingV1046PrintReport(meetingId){
  try{
    const {m,d}=await meetingV1046GetExportData(meetingId);
    const w=window.open('','_blank','noopener,noreferrer');if(!w)return;
    const attendees=(d.attendee_names||[]).join('، ');
    w.document.write(`<!doctype html><html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}"><head><meta charset="utf-8"><title>${escapeHtml(m.title||'Meeting minutes')}</title><style>body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;line-height:1.8;color:#17211f}h1{color:#0b4d40}.meta{color:#66736f;border-bottom:1px solid #ddd;padding-bottom:12px;margin-bottom:20px}pre{white-space:pre-wrap;font:inherit}</style></head><body><h1>${meet1046L('محضر اجتماع','Meeting Minutes')}: ${escapeHtml(m.title||'')}</h1><div class="meta">${meet1046L('الموعد','When')}: ${escapeHtml(meetingDateV101(m.scheduled_at))}<br>${meet1046L('المنظّم','Organizer')}: ${escapeHtml(meetingMemberNameV101(m.created_by))}<br>${meet1046L('الحضور','Attendees')}: ${escapeHtml(attendees||'—')}<br>${meet1046L('الحالة','Status')}: ${escapeHtml(d.status||'draft')}</div><pre>${escapeHtml(d.content||'')}</pre></body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),500);
  }catch(e){showTaskyDialog({title:meet1046L('تعذّر إنشاء التقرير','Could not create report'),message:e.message,tone:'error'})}
}
async function meetingV1046CopyEmail(meetingId){
  try{
    const {m,d}=await meetingV1046GetExportData(meetingId);
    const attendees=(d.attendee_names||[]).join('، ');
    const subject=meet1046L(`محضر اجتماع: ${m.title||''}`,`Meeting Minutes: ${m.title||''}`);
    const text=`${meet1046L('الموضوع','Subject')}: ${subject}\n\n${meet1046L('الزملاء الأعزاء،','Dear colleagues,')}\n\n${meet1046L('فيما يلي محضر الاجتماع:','Below are the meeting minutes:')}\n\n${meet1046L('الاجتماع','Meeting')}: ${m.title||''}\n${meet1046L('الموعد','When')}: ${meetingDateV101(m.scheduled_at)}\n${meet1046L('الحضور','Attendees')}: ${attendees||'—'}\n\n${d.content||''}\n\n${meet1046L('مع التحية،','Regards,')}\nTasky`;
    await navigator.clipboard.writeText(text);taskyToast(meet1046L('تم نسخ نص البريد','Email text copied'),{tone:'success'});
  }catch(e){showTaskyDialog({title:meet1046L('تعذّر نسخ البريد','Could not copy email text'),message:e.message,tone:'error'})}
}

/* Load permission context whenever an authenticated room renders. */
const meetingRenderRoomBaseV1046=meetingRenderRoomV101;
meetingRenderRoomV101=function(){
  meetingRenderRoomBaseV1046();
  if(!meetingRoomV101)return;
  meetingV1046PatchMinutesButton();
  meetingV1046EnsureContext();
};

/* Clear minutes state between rooms. */
const leaveMeetingRoomBaseV1046=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){
  clearTimeout(meetingV1046MinutesSaveTimer);
  document.getElementById('meet1046MinutesBackdrop')?.remove();document.getElementById('meet1046MinutesPanel')?.remove();
  meetingV1046MinutesCtx=null;meetingV1046MinutesMeetingId=null;
  return leaveMeetingRoomBaseV1046(opts);
};


/* --- source script: tasky-v1047-meeting-duration-report-rating-js --- */

window.TASKY_BUILD='V104.7';console.info('Tasky build',window.TASKY_BUILD);
function meet1047L(ar,en){return lang==='ar'?ar:en}
function meetingV1047DurationInfo(m){
  if(m?.status==='ended'&&m?.started_at&&m?.ended_at){
    const mins=Math.max(1,Math.round((new Date(m.ended_at)-new Date(m.started_at))/60000));
    return {label:`${mins} ${meet1047L('دقيقة','min')}`,kind:'actual',title:meet1047L('المدة الفعلية','Actual duration')};
  }
  if(m?.duration_minutes==null)return {label:meet1047L('غير محددة','No fixed duration'),kind:'open',title:meet1047L('المدة','Duration')};
  return {label:`${Number(m.duration_minutes)} ${meet1047L('دقيقة','min')}`,kind:'planned',title:meet1047L('المدة المخططة','Planned duration')};
}
function meetingV1047RatingWidget(meetingId,value=0,guest=false){
  const v=Math.max(0,Math.min(5,Number(value||0)));
  return `<div class="meet1047-stars" data-meet1047-rating="${meetingId}" data-value="${v}">${[1,2,3,4,5].map(n=>`<button type="button" data-star="${n}" class="${n<=v?'filled':''}" aria-label="${n} من 5" onclick="${guest?`meetingV1047RateGuest('${meetingId}',${n})`:`meetingV1047RateMember('${meetingId}',${n})`}" onpointerenter="meetingV1047PreviewStars(this,${n})" onpointerleave="meetingV1047RestoreStars(this)">${n<=v?'★':'☆'}</button>`).join('')}</div>`;
}
function meetingV1047PaintStars(root,n){root?.querySelectorAll('button[data-star]').forEach(b=>{const f=Number(b.dataset.star)<=Number(n||0);b.classList.toggle('filled',f);b.textContent=f?'★':'☆'})}
function meetingV1047PreviewStars(btn,n){meetingV1047PaintStars(btn.closest('[data-meet1047-rating]'),n)}
function meetingV1047RestoreStars(btn){const r=btn.closest('[data-meet1047-rating]');meetingV1047PaintStars(r,Number(r?.dataset.value||0))}
async function meetingV1047RateMember(id,n){
  const r=document.querySelector(`[data-meet1047-rating="${CSS.escape(id)}"]`);
  const {error}=await sb.rpc('tasky_meeting_rate_v1044',{p_meeting_id:id,p_rating:n,p_comment:null});
  if(error){meetingV1047RestoreStars(r?.querySelector('button'));return showTaskyDialog({title:meet1047L('تعذّر حفظ التقييم','Could not save rating'),message:error.message,tone:'error'})}
  if(r){r.dataset.value=String(n);meetingV1047PaintStars(r,n)};const m=meetingsV101.find(x=>x.id===id);if(m)m.my_rating=n;
  taskyToast(meet1047L('تم حفظ تقييم الجودة التقنية','Technical-quality rating saved'),{tone:'success'});
}
async function meetingV1047RateGuest(id,n){
  const g=meetingV1044LastGuestRating;if(!g||g.meetingId!==id)return taskyToast(meet1047L('انتهت جلسة التقييم','Rating session expired'),{tone:'warning'});
  const r=document.querySelector(`[data-meet1047-rating="${CSS.escape(id)}"]`);
  const {error}=await sb.rpc('tasky_public_meeting_rate_v1044',{p_meeting_id:id,p_guest_session_id:g.id,p_guest_session_token:g.token,p_rating:n,p_comment:null});
  if(error){meetingV1047RestoreStars(r?.querySelector('button'));return showTaskyDialog({title:meet1047L('تعذّر حفظ التقييم','Could not save rating'),message:error.message,tone:'error'})}
  if(r){r.dataset.value=String(n);meetingV1047PaintStars(r,n)}
  taskyToast(meet1047L('شكرًا، تم تقييم الجودة التقنية','Thanks — technical quality rated'),{tone:'success'});
}
openMeetingEditorV101=function(id=null){
  const m=id?meetingByIdV101(id):null;if(m&&!m.can_manage)return;
  const selected=new Set(meetingInviteIdsV101(m)),all=!m||selected.size===0;
  const members=teamMembers.filter(x=>x.status==='active'&&x.userId&&x.userId!==currentUserId);
  const durationOptions=[['',meet1047L('غير محدد المدة','No fixed duration')],['15',`15 ${meet1047L('دقيقة','min')}`],['30',`30 ${meet1047L('دقيقة','min')}`],['45',`45 ${meet1047L('دقيقة','min')}`],['60',`60 ${meet1047L('دقيقة','min')}`],['90',`90 ${meet1047L('دقيقة','min')}`],['120',`120 ${meet1047L('دقيقة','min')}`],['180',`180 ${meet1047L('دقيقة','min')}`],['240',`240 ${meet1047L('دقيقة','min')}`]];
  const currentDuration=m?(m.duration_minutes==null?'':String(m.duration_minutes)):'30';
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${m?meet102L('تعديل الاجتماع','Edit meeting'):meet102L('اجتماع جديد','New meeting')}</h3><div class="subtle">${meet102L('حدد المشاركين والوقت والمدة. يمكنك اختيار اجتماع غير محدد المدة.','Choose participants, date/time and duration. You can also create a meeting with no fixed duration.')}</div></div><button class="modal-close" type="button" onclick="closeAddModal()">×</button></div><form onsubmit="submitMeetingV101(event,'${m?.id||''}')"><div class="meet101-form-grid"><div class="field full"><label>${meet102L('عنوان الاجتماع','Meeting title')}</label><input id="meet101Title" maxlength="160" required value="${escapeHtml(m?.title||'')}"></div><div class="field"><label>${meet102L('التاريخ والوقت','Date & time')}</label><input id="meet101When" type="datetime-local" required value="${meetingLocalDateValueV101(m?.scheduled_at)}"></div><div class="field"><label>${meet102L('المدة','Duration')}</label><select id="meet101Duration">${durationOptions.map(([v,l])=>`<option value="${v}" ${currentDuration===v?'selected':''}>${escapeHtml(l)}</option>`).join('')}</select><small>${meet1047L('غير محدد المدة لا يوقف الاجتماع تلقائيًا.','No fixed duration does not auto-end the meeting.')}</small></div><div class="field full"><label>${meet102L('الهدف / الأجندة','Purpose / agenda')}</label><textarea id="meet101Desc" maxlength="5000" rows="4" placeholder="${meet102L('اكتب نقاط الاجتماع أو الهدف منه…','Add the meeting purpose or agenda…')}">${escapeHtml(m?.description||'')}</textarea></div><div class="field full"><label class="form-check"><input id="meet101All" type="checkbox" ${all?'checked':''} onchange="meetingAudienceToggleV101()"><span>${meet102L('دعوة جميع أعضاء مساحة العمل','Invite all workspace members')}</span></label></div><div class="meet101-member-grid full" id="meet101Members" style="${all?'display:none':'display:grid'}">${members.map(x=>`<label class="meet101-member"><input type="checkbox" data-meet101-user value="${x.userId}" ${selected.has(x.userId)?'checked':''}><span>${x.avatarUrl?`<span class="meet101-avatar" style="display:inline-grid;margin:0;background:${x.color}"><img src="${escapeHtml(x.avatarUrl)}" alt=""></span>`:''}<b>${escapeHtml(x.fullName||x.email)}</b><small style="display:block;color:var(--muted)">${escapeHtml(x.jobTitle||'')}</small></span></label>`).join('')||`<div class="meet101-empty">${meet102L('لا يوجد أعضاء آخرون نشطون.','No other active members.')}</div>`}</div><div class="field full meet102-guest-setting"><label class="form-check"><input id="meet102AllowGuests" type="checkbox" ${m?.allow_guests?'checked':''}><span><b>${meet102L('السماح لضيوف خارجيين بالدخول بدون حساب تاسكي','Allow external guests to join without a Tasky account')}</b><small>${meet102L('ينشئ تاسكي رابط ضيف منفصلًا.','Tasky creates a separate guest link.')}</small></span></label></div></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap"><button type="button" class="chip-btn" onclick="closeAddModal()">${meet102L('إلغاء','Cancel')}</button>${!m?`<button type="submit" class="chip-btn" data-start-now="1">${meet102L('حفظ وابدأ الآن','Save & start now')}</button>`:''}<button type="submit" class="primary-btn">${m?meet102L('حفظ التعديلات','Save changes'):meet102L('حفظ الاجتماع','Save meeting')}</button></div></form>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');setTimeout(()=>{if(typeof taskyEnhanceSelects==='function')taskyEnhanceSelects()},0);
};
submitMeetingV101=async function(e,id){
  e.preventDefault();const btn=e.submitter;if(btn)btn.disabled=true;
  const all=!!document.getElementById('meet101All').checked,inviteeIds=all?[]:[...document.querySelectorAll('[data-meet101-user]:checked')].map(x=>x.value),startNow=btn?.dataset?.startNow==='1';
  const when=startNow?new Date().toISOString():new Date(document.getElementById('meet101When').value).toISOString();
  const rawDuration=document.getElementById('meet101Duration').value,duration=rawDuration===''?null:Number(rawDuration);
  const args={p_title:document.getElementById('meet101Title').value.trim(),p_description:document.getElementById('meet101Desc').value.trim()||null,p_scheduled_at:when,p_duration_minutes:duration,p_invitee_ids:inviteeIds,p_allow_guests:!!document.getElementById('meet102AllowGuests')?.checked};
  try{let res;if(id)res=await sb.rpc('tasky_meeting_update_v102',{p_meeting_id:id,...args});else res=await sb.rpc('tasky_meeting_create_v102',{p_workspace_id:currentWorkspaceId,...args});if(res.error)throw res.error;closeAddModal();await fetchMeetingsV101();renderModule();const roomCode=id?meetingByIdV101(id)?.room_code:res.data?.room_code;taskyToast(id?meet102L('تم تحديث الاجتماع','Meeting updated'):meet102L('تم إنشاء الاجتماع','Meeting created'),{tone:'success'});if(startNow&&roomCode)setTimeout(()=>openMeetingJoinConfirmV101(roomCode),50)}catch(err){showTaskyDialog({title:meet102L('تعذّر حفظ الاجتماع','Could not save meeting'),message:err?.message||String(err),tone:'error'})}finally{if(btn)btn.disabled=false}
};
meetingCardV101=function(m,past=false){
  const canJoin=!meetingV1046MemberTerminal(m),canManage=!!m.can_manage,d=meetingV1047DurationInfo(m),canMinutes=!!m.can_edit_minutes||!!m.has_minutes||canManage;
  const rating=m.status==='ended'?`<div class="meet1047-rating-inline"><span class="label">${meet1047L('تقييم الجودة التقنية — الصوت، الفيديو، الاتصال','Technical quality — audio, video, connection')}</span>${meetingV1047RatingWidget(m.id,m.my_rating||0,false)}<span class="meet1047-rating-hint">${m.my_rating?`${m.my_rating}/5`:meet1047L('اضغط على عدد النجوم المناسب','Tap the desired number of stars')}</span></div>`:'';
  return `<article class="meet101-card meet1047-card ${escapeHtml(m.status)} ${past?'past':''}"><div class="meet101-card-head"><div><div class="meet102-title-row"><h3>${escapeHtml(m.title)}</h3>${m.allow_guests?`<span class="meet102-guest-badge">${meet102L('دخول خارجي','External guests')}</span>`:''}</div><p>${escapeHtml(m.description||meet1047L('بدون أجندة مضافة','No agenda added'))}</p></div><span class="meet101-status ${escapeHtml(m.status)}">${escapeHtml(meetingStatusLabelV101(m.status))}</span></div>${meetingV1044StatusNote(m)}<div class="meet1047-summary"><div><span>${meet102L('الموعد','When')}</span><b>${escapeHtml(meetingDateV101(m.scheduled_at))}</b></div><div><span>${escapeHtml(d.title)}</span><b class="${d.kind==='open'?'meet1047-duration-open':''}">${escapeHtml(d.label)}</b></div><div><span>${meet102L('المنظّم','Organizer')}</span><b>${escapeHtml(meetingMemberNameV101(m.created_by))}</b></div></div>${m.description?`<div class="meet1047-agenda"><b>${meet1047L('الأجندة / الهدف:','Agenda / purpose:')}</b> ${escapeHtml(m.description)}</div>`:''}${meetingV1044StatsHtml(m)}${rating}<div class="meet101-card-actions">${canJoin?`<button class="primary-btn" onclick="openMeetingJoinConfirmV101('${m.room_code}')"><svg><use href="#i-camera"/></svg>${m.status==='live'?meet102L('انضم الآن','Join now'):meet102L('دخول الاجتماع','Join meeting')}</button><button class="chip-btn" onclick="meetingCopyLinkV101('${m.room_code}')">${meet102L('رابط الأعضاء','Member link')}</button>`:''}${canManage&&m.allow_guests&&canJoin?`<button class="chip-btn meet102-guest-link-btn" onclick="meetingCopyGuestLinkV102('${m.id}')">${meet102L('رابط ضيف بدون تسجيل','No-login guest link')}</button>`:''}${canManage&&m.status==='scheduled'?`<button class="chip-btn" onclick="openMeetingEditorV101('${m.id}')">${meet102L('تعديل','Edit')}</button><button class="chip-btn" style="color:var(--danger)" onclick="cancelMeetingV1044('${m.id}')">${meet102L('إلغاء','Cancel')}</button>`:''}${canManage&&m.status==='live'?`<button class="chip-btn" style="color:var(--danger)" onclick="cancelMeetingV1044('${m.id}')">${meet102L('إلغاء الاجتماع','Cancel meeting')}</button>`:''}${canMinutes?`<button class="chip-btn" onclick="meetingV1046OpenMinutesReference('${m.id}')">📝 ${meet1047L('محضر الاجتماع','Meeting minutes')}${m.minutes_status==='final'?` · ${meet1047L('معتمد','Final')}`:''}</button>`:''}${canManage?`<button class="chip-btn" onclick="meetingV1046ManageEditors('${m.id}')">🔐 ${meet1047L('صلاحيات المحضر','Minutes access')}</button>`:''}</div></article>`;
};
renderPublicMeetingGuestPortalV102=function(){
  const p=meetingGuestPublicV102,i=p?.info;if(!p||!i)return;const terminal=['ended','cancelled'].includes(i.status),live=i.status==='live',d=meetingV1047DurationInfo(i);
  meet102GuestFrameV102(`<div class="meet102-guest-card"><div class="meet102-guest-org">${escapeHtml(i.workspace_name||'Tasky')}</div><div class="meet102-guest-status ${escapeHtml(i.status)}">${escapeHtml(meet102GuestStatusTextV102(i.status))}</div><h1>${escapeHtml(i.title||meet102L('اجتماع تاسكي','Tasky meeting'))}</h1>${i.description?`<p class="meet102-guest-desc">${escapeHtml(i.description)}</p>`:''}<div class="meet102-guest-meta"><div><span>${meet102L('الموعد','When')}</span><b>${escapeHtml(meetingDateV101(i.scheduled_at))}</b></div><div><span>${escapeHtml(d.title)}</span><b>${escapeHtml(d.label)}</b></div></div>${terminal?`<div class="meet102-public-note danger">${i.status==='ended'?meet102L('هذا الاجتماع انتهى ولم يعد يقبل دخولًا جديدًا.','This meeting has ended and no longer accepts new joins.'):meet102L('تم إلغاء هذا الاجتماع.','This meeting was cancelled.')}</div>`:`<form onsubmit="joinPublicMeetingGuestV102(event)" class="meet102-guest-form"><div class="field full"><label>${meet102L('اسمك الذي سيظهر للمشاركين','Your display name')}</label><input id="meet102GuestName" maxlength="120" autocomplete="name" required placeholder="${meet102L('الاسم','Name')}"></div><div class="field"><label>${meet102L('الجهة / الشركة — اختياري','Company / organization — optional')}</label><input id="meet102GuestCompany" maxlength="200" autocomplete="organization"></div><div class="field"><label>${meet102L('البريد الإلكتروني — اختياري','Email — optional')}</label><input id="meet102GuestEmail" type="email" maxlength="320" autocomplete="email"></div><div class="meet102-public-note full"><b>${meet102L('الخصوصية:','Privacy:')}</b> ${meet102L('سيظهر اسمك للمشاركين ويُحفظ في سجل الحضور. لا يسجل تاسكي الصوت أو الفيديو أو مشاركة الشاشة تلقائيًا.','Your name is visible to participants and stored in attendance. Tasky does not automatically record audio, video, or screen share.')}</div>${live?`<button class="submit-btn full" type="submit">${meet102L('الدخول للاجتماع بدون تسجيل','Join meeting without signing in')}</button>`:`<button class="submit-btn full" type="button" disabled>${meet102L('بانتظار بدء المنظّم','Waiting for organizer')}</button><button class="chip-btn full" type="button" onclick="showPublicMeetingGuestPortalV102('${escapeHtml(p.roomCode)}','${escapeHtml(p.guestToken)}')">${meet102L('تحديث حالة الاجتماع','Refresh meeting status')}</button>`}</form>`}<div class="meet102-public-foot">${meet102L('رابط الضيف يمنح الوصول لهذا الاجتماع فقط ولا يمنح وصولًا إلى مساحة العمل.','The guest link grants access only to this meeting and not to the workspace.')}</div></div>`);
};
renderPublicMeetingGuestExitV1044=function(message,meetingId){const p=meetingGuestPublicV102;if(!p)return;meet102GuestFrameV102(`<div class="meet102-guest-card meet102-exit"><div class="meet102-exit-check">✓</div><h1>${escapeHtml(message||meet102L('تمت مغادرة الاجتماع','You left the meeting'))}</h1><p>${meet1047L('قيّم الجودة التقنية للصوت والفيديو والاتصال.','Rate technical quality: audio, video, and connection.')}</p>${meetingId?meetingV1047RatingWidget(meetingId,0,true):''}<button class="chip-btn" style="margin-top:12px" onclick="showPublicMeetingGuestPortalV102('${escapeHtml(p.roomCode)}','${escapeHtml(p.guestToken)}')">${meet102L('العودة إلى صفحة الاجتماع','Back to meeting page')}</button></div>`)};
async function meetingV1046PrintReport(meetingId){
  try{const {m,d}=await meetingV1046GetExportData(meetingId),attendees=(d.attendee_names||[]).join('، '),dur=meetingV1047DurationInfo(m);
    const report=`<!doctype html><html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(m.title||'Meeting minutes')}</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 24px;line-height:1.8;color:#17211f}h1{color:#0b4d40}.meta{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:20px 0}.meta div{border:1px solid #ddd;border-radius:10px;padding:10px}.label{color:#697772;font-size:12px}.minutes{white-space:pre-wrap;border-top:2px solid #0b4d40;padding-top:18px;margin-top:20px}</style>
<style id="tasky-v1633-connect-theme-harmony">
/* V163.3 — Connect typography + theme harmonization */
.com161-shell{
  gap:22px !important;
  min-height:72vh !important;
}
.com161-panel{
  border-radius:26px !important;
  box-shadow:0 14px 32px rgba(16,24,40,.06) !important;
  border:1px solid var(--line) !important;
}
.com161-panel,
.com161-panel *{
  font-family:"IBM Plex Sans Arabic",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif !important;
}
.com161-header{
  padding:22px 24px !important;
  background:#fff !important;
}
.com161-card,
.com161-sidebar{
  padding:18px !important;
}
.com161-title{
  font-size:20px !important;
  line-height:1.45 !important;
  font-weight:900 !important;
}
.com161-section-title{
  font-size:30px !important;
  line-height:1.3 !important;
  font-weight:900 !important;
}
.com161-sub,
.com161-item-meta,
.com161-meal-meta,
.com161-empty,
.com161-hint{
  font-size:14px !important;
  line-height:1.75 !important;
  color:var(--muted) !important;
}
.com161-item{
  padding:16px !important;
  border-radius:18px !important;
}
.com161-item-title{
  font-size:17px !important;
  line-height:1.45 !important;
  font-weight:800 !important;
}
.com161-pill,
.com161-tab{
  font-size:14px !important;
  padding:10px 14px !important;
}
.com161-search,
.com161-composer textarea{
  font-size:15px !important;
}
.com161-composer{
  padding:16px 18px !important;
}
.com161-composer textarea{
  min-height:58px !important;
  border-radius:16px !important;
}
.com161-body{
  grid-template-columns:minmax(0,1.4fr) 340px !important;
  min-height:62vh !important;
}
.com161-meal-box{
  background:#f8fbf8 !important;
}
.com161-meal-head{
  margin-bottom:18px !important;
}
.com161-meal-list,
.com161-meal-polls{
  gap:12px !important;
}
.com161-meal-item{
  padding:16px !important;
  border-radius:20px !important;
}
.com161-poll-grid{
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr)) !important;
}
.com161-chat-actions,
.com161-poll-actions,
.com161-toolbar{
  gap:10px !important;
}
.com161-panel .btn,
.com161-panel .btn-light,
.com161-panel .btn-ghost,
.com161-panel .icon-btn{
  min-height:44px !important;
}
.com161-panel .btn,
.com161-panel .btn-light,
.com161-panel .btn-ghost{
  border-radius:14px !important;
  font-size:14px !important;
  font-weight:800 !important;
}
.com161-panel .icon-btn{
  width:44px !important;
  height:44px !important;
  border-radius:14px !important;
}
.com161-panel .stat-card,
.com161-panel .mini-stat,
.com161-panel .soft-card{
  border-radius:18px !important;
}
.com161-panel .kpi-value,
.com161-panel .amount{
  font-size:24px !important;
  font-weight:900 !important;
}
.com161-panel .muted,
.com161-panel .tiny{
  font-size:13px !important;
  color:var(--muted) !important;
}
@media (max-width:1100px){
  .com161-body{
    grid-template-columns:1fr !important;
  }
}
@media (max-width:720px){
  .com161-header{
    padding:18px !important;
  }
  .com161-card,
  .com161-sidebar{
    padding:16px !important;
  }
  .com161-section-title{
    font-size:24px !important;
  }
  .com161-item-title{
    font-size:16px !important;
  }
  .com161-pill,
  .com161-tab,
  .com161-panel .btn,
  .com161-panel .btn-light,
  .com161-panel .btn-ghost{
    font-size:13px !important;
  }
}
</style>


<style id="tasky-v1634-connect-theme-mobile">
/* ============================================================
   V163.4 — Tasky Connect exact theme alignment + mobile-first UX
   ============================================================ */

/* Core visual alignment */
.com161,
.com161 *{
  font-family:"IBM Plex Sans Arabic","Tajawal",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif !important;
}
.com161{
  --c1634-surface:#ffffff;
  --c1634-soft:#f6f8f6;
  --c1634-soft2:#eef5ea;
  --c1634-line:#e2e7e3;
  --c1634-green:var(--green);
  --c1634-ink:var(--ink);
  --c1634-muted:var(--muted);
  color:var(--ink);
}
.com161-head{
  border:1px solid var(--border) !important;
  background:var(--card) !important;
  border-radius:22px !important;
  padding:22px 24px !important;
  box-shadow:none !important;
  align-items:center !important;
}
.com161-head h2{
  font-size:28px !important;
  line-height:1.25 !important;
  font-weight:900 !important;
  letter-spacing:-.02em !important;
}
.com161-head p{
  font-size:14px !important;
  line-height:1.7 !important;
  color:var(--muted) !important;
  margin-top:5px !important;
}
.com161-actions{
  gap:9px !important;
}
.com161-btn{
  min-height:44px !important;
  padding:10px 15px !important;
  border-radius:13px !important;
  border:1px solid var(--border) !important;
  background:var(--paper) !important;
  color:var(--ink) !important;
  font-size:14px !important;
  font-weight:800 !important;
  box-shadow:none !important;
}
.com161-btn.primary{
  background:var(--green) !important;
  border-color:var(--green) !important;
  color:#fff !important;
}
.com161-btn:hover{
  filter:none !important;
  transform:none !important;
  background:var(--green-tint) !important;
}
.com161-btn.primary:hover{
  background:var(--green) !important;
}

/* Main shell: closer to Tasky cards */
.com162-shell{
  grid-template-columns:320px minmax(0,1fr) !important;
  gap:18px !important;
  min-height:690px !important;
}
.com161-side,
.com161-main{
  border:1px solid var(--border) !important;
  background:var(--card) !important;
  border-radius:22px !important;
  box-shadow:none !important;
  overflow:hidden !important;
}
.com161-side{
  padding:16px !important;
}
.com161-side-head{
  margin-bottom:10px !important;
  padding:2px 2px 6px !important;
}
.com161-side-head b{
  font-size:16px !important;
  font-weight:900 !important;
}

/* Conversation search + room list */
.com162-room-search{
  min-height:44px !important;
  border-radius:12px !important;
  padding:10px 12px !important;
  font-size:14px !important;
  margin-bottom:12px !important;
  border:1px solid var(--border) !important;
}
.com161-room{
  min-height:64px !important;
  padding:10px 11px !important;
  border-radius:14px !important;
  gap:10px !important;
  margin-bottom:4px !important;
}
.com161-room:hover{
  background:var(--paper) !important;
}
.com161-room.active{
  background:var(--green-tint) !important;
  color:var(--green) !important;
}
.com161-room-dot{
  width:9px !important;
  height:9px !important;
}
.com161-room-main b{
  font-size:15px !important;
  font-weight:850 !important;
  line-height:1.35 !important;
}
.com161-room-main small{
  font-size:12px !important;
  line-height:1.45 !important;
  margin-top:3px !important;
}
.com162-unread{
  min-width:22px !important;
  height:22px !important;
  font-size:11px !important;
}
.com162-fav{
  font-size:13px !important;
}

/* Chat header */
.com161-chat-head{
  min-height:76px !important;
  padding:14px 18px !important;
  border-bottom:1px solid var(--border) !important;
  background:var(--card) !important;
}
.com161-chat-head h3{
  font-size:18px !important;
  font-weight:900 !important;
  line-height:1.35 !important;
}
.com161-chat-head p{
  font-size:12px !important;
  line-height:1.5 !important;
  margin-top:4px !important;
}

/* Meal summary card - same neutral Tasky language */
.com162-meal-summary{
  margin:14px 16px 0 !important;
  border:1px solid #d9e4d5 !important;
  background:#f4f8f1 !important;
  border-radius:18px !important;
  padding:15px !important;
}
.com162-meal-summary h4{
  font-size:16px !important;
  font-weight:900 !important;
}
.com162-meal-summary p{
  font-size:12px !important;
  line-height:1.55 !important;
}
.com162-steps{
  gap:6px !important;
  margin-top:10px !important;
}
.com162-step{
  padding:6px 9px !important;
  font-size:11px !important;
  border-radius:999px !important;
}
.com162-meal-grid{
  gap:9px !important;
  margin-top:11px !important;
}
.com162-meal-box{
  border:1px solid var(--border) !important;
  background:var(--card) !important;
  border-radius:12px !important;
  padding:10px !important;
}
.com162-meal-box span{
  font-size:11px !important;
}
.com162-meal-box b{
  font-size:15px !important;
  margin-top:3px !important;
  display:block !important;
}
.com161-progress{
  height:8px !important;
  margin-top:10px !important;
}

/* Messages */
.com161-messages{
  padding:18px !important;
  gap:10px !important;
}
.com162-msg-row{
  max-width:82% !important;
  gap:9px !important;
}
.com162-avatar{
  width:34px !important;
  height:34px !important;
  font-size:12px !important;
  border-radius:50% !important;
}
.com162-bubble{
  border-radius:16px !important;
  padding:10px 12px !important;
  min-width:120px !important;
  box-shadow:none !important;
}
.com162-bubble .who{
  font-size:12px !important;
  margin-bottom:4px !important;
}
.com162-bubble .body{
  font-size:14px !important;
  line-height:1.65 !important;
}
.com162-bubble .time{
  font-size:10px !important;
  margin-top:6px !important;
}
.com162-reply-preview{
  font-size:11px !important;
  line-height:1.5 !important;
  padding:7px 8px !important;
  border-radius:9px !important;
}
.com162-msg-actions{
  gap:8px !important;
  margin-top:7px !important;
}
.com162-msg-actions button{
  font-size:11px !important;
}
.com162-react{
  font-size:11px !important;
  padding:4px 7px !important;
}
.com162-system{
  font-size:11px !important;
  padding:7px 10px !important;
}
.com162-system.meal{
  background:#f4f8f1 !important;
  color:var(--green) !important;
}

/* Composer */
.com162-compose-wrap{
  padding:12px 14px !important;
  background:var(--card) !important;
}
.com162-compose-tools{
  margin-bottom:8px !important;
}
.com162-compose-main{
  gap:8px !important;
}
.com162-compose-main textarea{
  min-height:54px !important;
  max-height:140px !important;
  border-radius:14px !important;
  padding:11px 13px !important;
  font-size:14px !important;
  line-height:1.55 !important;
}
.com162-typing{
  font-size:11px !important;
  height:22px !important;
  padding-inline:16px !important;
}
.com162-menu{
  gap:7px !important;
}
.com162-attach-pill{
  font-size:11px !important;
  padding:6px 8px !important;
}

/* Drawer */
.com162-drawer{
  width:min(420px,92vw) !important;
  padding:18px !important;
  background:var(--card) !important;
}
.com162-drawer h3{
  font-size:15px !important;
  margin:14px 0 8px !important;
}
.com161-member{
  padding:8px !important;
  border-radius:11px !important;
}
.com161-member b{
  font-size:13px !important;
}
.com161-member small{
  font-size:10px !important;
}
.com162-item-row{
  padding:10px 0 !important;
}
.com162-item-row b{
  font-size:13px !important;
}
.com162-item-row small{
  font-size:10px !important;
}
.com162-pay-row{
  padding:9px 0 !important;
}
.com162-pay-row b{
  font-size:13px !important;
}
.com162-pay-row small{
  font-size:10px !important;
}

/* Tablet */
@media(max-width:1050px){
  .com162-shell{
    grid-template-columns:270px minmax(0,1fr) !important;
    gap:12px !important;
  }
  .com161-head{
    padding:18px 20px !important;
  }
  .com161-head h2{
    font-size:25px !important;
  }
}

/* ============================================================
   Mobile-first Connect
   ============================================================ */
@media(max-width:720px){
  .com161{
    gap:10px !important;
  }
  .com161-head{
    padding:14px !important;
    border-radius:16px !important;
    align-items:flex-start !important;
  }
  .com161-head h2{
    font-size:22px !important;
  }
  .com161-head p{
    font-size:12px !important;
    line-height:1.55 !important;
  }
  .com161-actions{
    width:100% !important;
    display:grid !important;
    grid-template-columns:1fr 1fr !important;
  }
  .com161-actions .com161-btn{
    width:100% !important;
    min-width:0 !important;
    font-size:12px !important;
    padding:9px 8px !important;
  }

  /* Mobile becomes a true conversation app:
     rooms OR chat, not both stacked forever. */
  .com162-shell{
    display:block !important;
    min-height:0 !important;
  }
  .com161-side,
  .com161-main{
    border-radius:16px !important;
  }
  .com161-side{
    max-height:none !important;
    padding:12px !important;
  }
  .com161-main{
    min-height:72dvh !important;
  }

  /* When a room is selected, minimize room list to compact picker */
  .com161:has(.com161-main .com161-chat-head) .com161-side{
    max-height:94px !important;
    overflow:auto !important;
  }
  .com161:has(.com161-main .com161-chat-head) .com161-side .com161-room:not(.active),
  .com161:has(.com161-main .com161-chat-head) .com161-side > div:not(.com161-side-head):not(:has(.com161-room.active)){
    display:none !important;
  }
  .com161:has(.com161-main .com161-chat-head) .com162-room-search{
    display:none !important;
  }
  .com161-side-head{
    margin-bottom:4px !important;
  }
  .com161-side-head b{
    font-size:13px !important;
  }
  .com161-room{
    min-height:54px !important;
    padding:8px 9px !important;
  }
  .com161-room-main b{
    font-size:13px !important;
  }
  .com161-room-main small{
    font-size:10px !important;
  }

  .com161-chat-head{
    min-height:68px !important;
    padding:10px 12px !important;
    flex-wrap:wrap !important;
  }
  .com161-chat-head h3{
    font-size:16px !important;
  }
  .com161-chat-head p{
    font-size:10px !important;
  }
  .com161-chat-head .com161-actions{
    display:flex !important;
    width:auto !important;
    margin-inline-start:auto !important;
  }
  .com161-chat-head .com161-actions .com161-btn{
    width:auto !important;
    min-height:36px !important;
    padding:7px 9px !important;
    font-size:11px !important;
  }

  .com162-meal-summary{
    margin:10px 10px 0 !important;
    padding:11px !important;
    border-radius:14px !important;
  }
  .com162-meal-summary h4{
    font-size:14px !important;
  }
  .com162-meal-summary p{
    font-size:10px !important;
  }
  .com162-steps{
    padding-bottom:2px !important;
  }
  .com162-step{
    font-size:9px !important;
    padding:5px 7px !important;
  }
  .com162-meal-grid{
    grid-template-columns:1fr 1fr !important;
    gap:6px !important;
  }
  .com162-meal-box{
    padding:8px !important;
  }
  .com162-meal-box span{
    font-size:9px !important;
  }
  .com162-meal-box b{
    font-size:12px !important;
  }

  .com161-messages{
    padding:12px 10px !important;
    gap:8px !important;
  }
  .com162-msg-row{
    max-width:92% !important;
    gap:6px !important;
  }
  .com162-avatar{
    width:28px !important;
    height:28px !important;
    font-size:10px !important;
  }
  .com162-bubble{
    padding:8px 10px !important;
    min-width:90px !important;
    border-radius:14px !important;
  }
  .com162-bubble .who{
    font-size:10px !important;
  }
  .com162-bubble .body{
    font-size:13px !important;
  }
  .com162-bubble .time{
    font-size:9px !important;
  }
  .com162-msg-actions button{
    font-size:10px !important;
  }
  .com162-react{
    font-size:10px !important;
  }
  .com162-system{
    max-width:88% !important;
    font-size:10px !important;
    text-align:center !important;
  }

  /* Sticky composer on phones */
  .com162-compose-wrap{
    position:sticky !important;
    bottom:0 !important;
    z-index:12 !important;
    padding:9px 10px calc(9px + env(safe-area-inset-bottom)) !important;
    border-top:1px solid var(--border) !important;
  }
  .com162-compose-main textarea{
    min-height:46px !important;
    font-size:13px !important;
    padding:9px 10px !important;
  }
  .com162-compose-main .com161-btn.primary{
    min-width:62px !important;
    padding-inline:10px !important;
  }
  .com162-compose-tools{
    margin-bottom:5px !important;
  }
  .com162-compose-tools span{
    display:none !important;
  }
  .com162-menu{
    overflow-x:auto !important;
    flex-wrap:nowrap !important;
    padding-bottom:3px !important;
  }
  .com162-menu .com161-btn{
    flex:none !important;
    white-space:nowrap !important;
  }

  /* Full-height bottom-sheet feel for details drawer */
  .com162-drawer{
    top:auto !important;
    bottom:0 !important;
    inset-inline:0 !important;
    width:100% !important;
    height:min(78dvh,760px) !important;
    border-inline-start:0 !important;
    border-top:1px solid var(--border) !important;
    border-radius:22px 22px 0 0 !important;
    transform:translateY(105%) !important;
    padding:14px !important;
  }
  [dir="rtl"] .com162-drawer{
    transform:translateY(105%) !important;
  }
  .com162-drawer.show{
    transform:translateY(0) !important;
  }

  .com162-item-row{
    grid-template-columns:minmax(0,1fr) auto !important;
    gap:5px !important;
  }
  .com162-item-row .com161-btn{
    grid-column:1/-1 !important;
    width:100% !important;
    min-height:36px !important;
  }

  .com162-pay-row{
    grid-template-columns:1fr !important;
  }
}

/* Very small phones */
@media(max-width:390px){
  .com161-head h2{
    font-size:20px !important;
  }
  .com161-actions{
    grid-template-columns:1fr !important;
  }
  .com162-meal-grid{
    grid-template-columns:1fr !important;
  }
  .com161-chat-head .com161-actions{
    width:100% !important;
    display:grid !important;
    grid-template-columns:repeat(3,1fr) !important;
  }
  .com161-chat-head .com161-actions .com161-btn{
    width:100% !important;
  }
}
</style>

</head><body><h1>${meet1047L('محضر اجتماع','Meeting Minutes')}: ${escapeHtml(m.title||'')}</h1><div class="meta"><div><span class="label">${meet1047L('الموعد','When')}</span><br><b>${escapeHtml(meetingDateV101(m.scheduled_at))}</b></div><div><span class="label">${escapeHtml(dur.title)}</span><br><b>${escapeHtml(dur.label)}</b></div><div><span class="label">${meet1047L('المنظّم','Organizer')}</span><br><b>${escapeHtml(meetingMemberNameV101(m.created_by))}</b></div><div><span class="label">${meet1047L('الحضور','Attendees')}</span><br><b>${escapeHtml(attendees||'—')}</b></div></div><div class="minutes"><h2>${meet1047L('المحضر','Minutes')}</h2>${escapeHtml(d.content||'').replace(/\n/g,'<br>')}</div></body></html>`;
    const blob=new Blob([report],{type:'text/html;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Tasky-Meeting-Minutes-${String(m.title||meetingId).replace(/[^\p{L}\p{N}\-_]+/gu,'-').slice(0,70)}.html`;document.body.appendChild(a);a.click();const u=a.href;a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200);taskyToast(meet1047L('تم تنزيل تقرير المحضر','Minutes report downloaded'),{tone:'success'});
  }catch(e){showTaskyDialog({title:meet1047L('تعذّر إنشاء التقرير','Could not create report'),message:e.message,tone:'error'})}
}
meetingV1043PatchToolbar=function(){const tools=document.getElementById('meet103Tools');if(!tools)return;document.getElementById('meet1043SelfBtn')?.remove();meetingV1043SelfHidden=false;document.querySelector('[data-peer="local"]')?.classList.remove('meet1043-self-hidden');let sound=document.getElementById('meet1043SoundBtn');if(!sound){sound=document.createElement('button');sound.id='meet1043SoundBtn';sound.type='button';sound.className='meet103-pill meet1043-sound';sound.onclick=meetingV1043ToggleSound;tools.appendChild(sound)}sound.classList.toggle('active',meetingV1043SoundEnabled);sound.innerHTML=`${meetingV1043SoundEnabled?'🔔':'🔕'} <span>${meet103L('التنبيهات','Alerts')}</span>`};


/* --- source script: tasky-v105-meeting-infra-js --- */

window.TASKY_BUILD='V105';console.info('Tasky build',window.TASKY_BUILD);

let meetingV105Transport='probing'; // probing | sfu | mesh
let meetingV105SfuRoom=null;
let meetingV105SfuToken=null;
let meetingV105StatsTimer=null;
let meetingV105Net={quality:'unknown',rtt:null,loss:null,bitrate:null,reconnecting:false};
let meetingV105LastBytes=new Map();
let meetingV105IceRetries=new Map();
let meetingV105JoinProbe=false;
let meetingV105LiveKitPromise=null;

function meet105L(ar,en){return lang==='ar'?ar:en}
function meetingV105LoadLiveKit(){
  if(window.LivekitClient)return Promise.resolve(window.LivekitClient);
  if(meetingV105LiveKitPromise)return meetingV105LiveKitPromise;
  meetingV105LiveKitPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/livekit-client@2.21.0/dist/livekit-client.umd.min.js';
    s.async=true;s.crossOrigin='anonymous';
    s.onload=()=>window.LivekitClient?resolve(window.LivekitClient):reject(new Error('LiveKit SDK did not initialize'));
    s.onerror=()=>reject(new Error('Could not load LiveKit client SDK'));
    document.head.appendChild(s);
  });
  return meetingV105LiveKitPromise;
}
function meetingV105PatchNetBadge(){
  if(!meetingRoomV101)return;
  const meta=document.getElementById('meet101RoomMeta')?.parentElement;if(!meta)return;
  let el=document.getElementById('meet105Net');
  if(!el){el=document.createElement('span');el.id='meet105Net';el.className='meet105-net';meta.appendChild(el)}
  const q=meetingV105Net.reconnecting?'reconnecting':(!navigator.onLine?'offline':meetingV105Net.quality);
  const label=q==='good'?meet105L('اتصال جيد','Good'):q==='fair'?meet105L('اتصال متوسط','Fair'):q==='poor'?meet105L('اتصال ضعيف','Poor'):q==='offline'?meet105L('غير متصل','Offline'):q==='reconnecting'?meet105L('إعادة اتصال…','Reconnecting…'):meet105L('فحص الاتصال','Checking');
  el.className=`meet105-net ${q}`;el.innerHTML=`<i></i><span>${label}</span><span class="meet105-transport">${meetingV105Transport==='sfu'?'SFU':meetingV105Transport==='mesh'?'P2P':'AUTO'}</span>`;
}
function meetingV105QualityFrom(rtt,loss){
  if(!navigator.onLine)return'offline';
  if(loss==null&&rtt==null)return'unknown';
  if((loss??0)<=2&&(rtt??0)<=180)return'good';
  if((loss??0)<=6&&(rtt??0)<=400)return'fair';
  return'poor';
}
async function meetingV105MeshStats(){
  let rtts=[],lost=0,recv=0,bytes=0;
  for(const [peer,pc] of meetingPeersV101){
    if(!pc||pc.connectionState==='closed')continue;
    try{
      const stats=await pc.getStats();
      stats.forEach(s=>{
        if(s.type==='candidate-pair'&&s.state==='succeeded'&&s.nominated&&Number.isFinite(s.currentRoundTripTime))rtts.push(s.currentRoundTripTime*1000);
        if(s.type==='inbound-rtp'&&!s.isRemote){
          lost+=Number(s.packetsLost||0);recv+=Number(s.packetsReceived||0);bytes+=Number(s.bytesReceived||0);
        }
      });
    }catch(_){}
  }
  const rtt=rtts.length?Math.round(rtts.reduce((a,b)=>a+b,0)/rtts.length):null;
  const loss=(lost+recv)>0?Math.max(0,Math.round((lost/(lost+recv))*1000)/10):null;
  meetingV105Net={...meetingV105Net,rtt,loss,quality:meetingV105QualityFrom(rtt,loss)};
}
function meetingV105StartStats(){
  meetingV105StopStats();
  const tick=async()=>{
    if(!meetingRoomV101)return;
    if(meetingV105Transport==='mesh')await meetingV105MeshStats();
    meetingV105PatchNetBadge();
  };
  tick();meetingV105StatsTimer=setInterval(tick,4000);
}
function meetingV105StopStats(){if(meetingV105StatsTimer){clearInterval(meetingV105StatsTimer);meetingV105StatsTimer=null}}

async function meetingV105TokenRequest(){
  if(!meetingRoomV101)throw new Error('No active meeting');
  const body={meeting_id:meetingRoomV101.id,peer_id:meetingPeerIdV101,display_name:meetingV103IsGuest()?meetingGuestSessionV102?.name:meetingV1045DisplayName()};
  if(meetingV103IsGuest()){
    body.guest_session_id=meetingGuestSessionV102?.id;
    body.guest_session_token=meetingGuestSessionV102?.token;
  }
  const {data,error}=await sb.functions.invoke('meeting-livekit-token-v105',{body});
  if(error)throw error;
  if(!data?.enabled||!data?.server_url||!data?.token)throw new Error(data?.message||'SFU unavailable');
  return data;
}
function meetingV105RemoteStream(identity){
  let s=meetingRemoteStreamsV101.get(identity);
  if(!s){s=new MediaStream();meetingRemoteStreamsV101.set(identity,s)}
  return s;
}
async function meetingV105ConnectSfu(){
  const LK=await meetingV105LoadLiveKit();
  const auth=await meetingV105TokenRequest();
  const room=new LK.Room({adaptiveStream:true,dynacast:true,disconnectOnPageLeave:false});
  meetingV105SfuToken=auth;meetingV105SfuRoom=room;

  room.on(LK.RoomEvent.TrackSubscribed,(track,pub,participant)=>{
    const id=participant.identity,s=meetingV105RemoteStream(id),mst=track.mediaStreamTrack;
    if(mst&&!s.getTracks().some(t=>t.id===mst.id))s.addTrack(mst);
    const prev=meetingRemoteMetaV101.get(id)||{};
    meetingRemoteMetaV101.set(id,{...prev,name:participant.name||prev.name||id,camera:pub.source===LK.Track.Source.Camera?true:prev.camera,mic:pub.source===LK.Track.Source.Microphone?true:prev.mic,screen:pub.source===LK.Track.Source.ScreenShare?true:prev.screen});
    track.on?.('ended',()=>meetingRenderRoomV101());meetingRenderRoomV101();
  });
  room.on(LK.RoomEvent.TrackUnsubscribed,(track,pub,participant)=>{
    const s=meetingRemoteStreamsV101.get(participant.identity),mst=track.mediaStreamTrack;
    if(s&&mst){try{s.removeTrack(mst)}catch{}}
    const prev=meetingRemoteMetaV101.get(participant.identity)||{};
    meetingRemoteMetaV101.set(participant.identity,{...prev,camera:pub.source===LK.Track.Source.Camera?false:prev.camera,mic:pub.source===LK.Track.Source.Microphone?false:prev.mic,screen:pub.source===LK.Track.Source.ScreenShare?false:prev.screen});
    meetingRenderRoomV101();
  });
  room.on(LK.RoomEvent.ParticipantConnected,p=>{
    const prev=meetingRemoteMetaV101.get(p.identity)||{};meetingRemoteMetaV101.set(p.identity,{...prev,name:p.name||prev.name||p.identity});meetingRenderRoomV101();
  });
  room.on(LK.RoomEvent.ParticipantDisconnected,p=>{meetingRemoteStreamsV101.delete(p.identity);meetingRemoteMetaV101.delete(p.identity);meetingRenderRoomV101()});
  room.on(LK.RoomEvent.ActiveSpeakersChanged,speakers=>{
    document.querySelectorAll('.meet101-video-tile.meet1042-speaking').forEach(x=>x.classList.remove('meet1042-speaking'));
    for(const p of speakers){
      const id=p.isLocal?'local':p.identity;
      document.querySelector(`.meet101-video-tile[data-peer="${CSS.escape(String(id))}"]`)?.classList.add('meet1042-speaking');
    }
  });
  room.on(LK.RoomEvent.ConnectionQualityChanged,(q,p)=>{
    if(p?.isLocal){
      const map={excellent:'good',good:'good',poor:'poor',lost:'poor',unknown:'unknown'};
      meetingV105Net.quality=map[String(q).toLowerCase()]||'fair';meetingV105PatchNetBadge();
    }
  });
  room.on(LK.RoomEvent.Reconnecting,()=>{meetingV105Net.reconnecting=true;meetingV105PatchNetBadge();taskyToast(meet105L('ضعف الاتصال — تاسكي يعيد الاتصال تلقائيًا','Connection interrupted — Tasky is reconnecting automatically'),{tone:'warning'})});
  room.on(LK.RoomEvent.Reconnected,()=>{meetingV105Net.reconnecting=false;meetingV105PatchNetBadge();taskyToast(meet105L('تمت استعادة الاتصال','Connection restored'),{tone:'success'})});
  room.on(LK.RoomEvent.Disconnected,()=>{meetingV105Net.reconnecting=false;meetingV105PatchNetBadge()});

  await room.connect(auth.server_url,auth.token,{autoSubscribe:true});
  // Publish the already-authorized Tasky media tracks.
  for(const t of meetingLocalStreamV101?.getTracks?.()||[]){
    const source=t.kind==='audio'?LK.Track.Source.Microphone:LK.Track.Source.Camera;
    await room.localParticipant.publishTrack(t,{source,simulcast:t.kind==='video'}).catch(e=>console.warn('V105 publish',e));
  }
  meetingV105Transport='sfu';meetingV105Net.reconnecting=false;meetingV105PatchNetBadge();meetingRenderRoomV101();
}
async function meetingV105FallbackMesh(reason){
  console.warn('V105 SFU fallback to P2P',reason);
  if(meetingV105SfuRoom){try{await meetingV105SfuRoom.disconnect()}catch{}meetingV105SfuRoom=null}
  meetingV105Transport='mesh';meetingV105Net.reconnecting=false;meetingV105PatchNetBadge();
  await meetingSyncPresenceV101();meetingV105StartStats();
}
async function meetingV105ActivateTransport(){
  meetingV105Transport='probing';meetingV105JoinProbe=true;meetingV105PatchNetBadge();
  try{await meetingV105ConnectSfu();meetingV105StartStats()}
  catch(e){await meetingV105FallbackMesh(e)}
  finally{meetingV105JoinProbe=false}
}
/* When SFU is active/probing, Supabase presence remains for Tasky collaboration
   metadata but does not create mesh media peer connections. */
const meetingSyncPresenceBaseV105=meetingSyncPresenceV101;
meetingSyncPresenceV101=async function(){
  if(meetingV105Transport==='mesh')return meetingSyncPresenceBaseV105();
  const snap=meetingPresenceSnapshotV101();
  for(const [peerId,meta] of snap.entries())meetingRemoteMetaV101.set(peerId,{...(meetingRemoteMetaV101.get(peerId)||{}),...meta});
  meetingRenderRoomV101();
  await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*');
};

/* P2P fallback: ICE restart on failure and network recovery. */
function meetingV105RestartPeer(peerId){
  if(meetingV105Transport!=='mesh')return;
  const pc=meetingPeersV101.get(peerId);if(!pc||pc.connectionState==='closed')return;
  const tries=Number(meetingV105IceRetries.get(peerId)||0);
  if(tries>=3)return;
  meetingV105IceRetries.set(peerId,tries+1);
  meetingV105Net.reconnecting=true;meetingV105PatchNetBadge();
  setTimeout(async()=>{
    try{
      pc.restartIce?.();
      if(pc.signalingState==='stable'){
        const offer=await pc.createOffer({iceRestart:true});await pc.setLocalDescription(offer);
        await meetingBroadcastSignalV101('offer',{sdp:pc.localDescription},peerId);
      }
    }catch(e){console.warn('V105 ICE restart',e)}
  },Math.min(6000,700*(tries+1)));
}
const meetingEnsurePeerBaseV105=meetingEnsurePeerV101;
meetingEnsurePeerV101=function(remotePeerId){
  const pc=meetingEnsurePeerBaseV105(remotePeerId);
  if(!pc.__taskyV105){
    pc.__taskyV105=true;
    const old=pc.onconnectionstatechange;
    pc.onconnectionstatechange=()=>{old?.();if(pc.connectionState==='connected'){meetingV105IceRetries.set(remotePeerId,0);meetingV105Net.reconnecting=false}else if(['failed','disconnected'].includes(pc.connectionState))meetingV105RestartPeer(remotePeerId);meetingV105PatchNetBadge()};
  }
  return pc;
};

async function meetingV105SetSfuMic(on){
  if(meetingV105Transport!=='sfu'||!meetingV105SfuRoom)return;
  const LK=window.LivekitClient,pub=meetingV105SfuRoom.localParticipant.getTrackPublication(LK.Track.Source.Microphone);
  if(pub?.track){if(on)await pub.track.unmute?.();else await pub.track.mute?.()}
}
async function meetingV105SetSfuCamera(on){
  if(meetingV105Transport!=='sfu'||!meetingV105SfuRoom)return;
  const LK=window.LivekitClient,pub=meetingV105SfuRoom.localParticipant.getTrackPublication(LK.Track.Source.Camera);
  if(pub?.track){if(on)await pub.track.unmute?.();else await pub.track.mute?.()}
}
const toggleMeetingMicBaseV105=toggleMeetingMicV101;
toggleMeetingMicV101=async function(){const before=meetingLocalStateV101.mic;await toggleMeetingMicBaseV105();if(before!==meetingLocalStateV101.mic)await meetingV105SetSfuMic(meetingLocalStateV101.mic).catch(()=>{})};
const toggleMeetingCameraBaseV105=toggleMeetingCameraV101;
toggleMeetingCameraV101=async function(){const before=meetingLocalStateV101.camera;await toggleMeetingCameraBaseV105();if(before!==meetingLocalStateV101.camera)await meetingV105SetSfuCamera(meetingLocalStateV101.camera).catch(()=>{})};

const toggleMeetingScreenBaseV105=toggleMeetingScreenV101;
toggleMeetingScreenV101=async function(){
  if(meetingV105Transport!=='sfu')return toggleMeetingScreenBaseV105();
  if(!meetingV105SfuRoom)return;
  try{
    const on=!meetingLocalStateV101.screen;
    await meetingV105SfuRoom.localParticipant.setScreenShareEnabled(on,{audio:false});
    meetingLocalStateV101.screen=on;
    const LK=window.LivekitClient,pub=meetingV105SfuRoom.localParticipant.getTrackPublication(LK.Track.Source.ScreenShare);
    meetingScreenTrackV101=on?(pub?.track?.mediaStreamTrack||null):null;
    meetingRenderRoomV101();await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*');
  }catch(e){if(e?.name!=='NotAllowedError')showTaskyDialog({title:meet105L('تعذرت مشاركة الشاشة','Could not share screen'),message:e.message||String(e),tone:'error'})}
};
stopMeetingScreenV101=async function(){
  if(meetingV105Transport==='sfu'&&meetingV105SfuRoom){
    try{await meetingV105SfuRoom.localParticipant.setScreenShareEnabled(false)}catch{}
    meetingScreenTrackV101=null;meetingLocalStateV101.screen=false;meetingRenderRoomV101();await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*');return;
  }
  const old=meetingScreenTrackV101;meetingScreenTrackV101=null;if(old){try{old.onended=null;old.stop()}catch{}}
  for(const pc of meetingPeersV101.values()){const sender=pc.getSenders().find(x=>x.track?.kind==='video');if(sender)await sender.replaceTrack(meetingCameraTrackV101||null)}
  meetingLocalStateV101.screen=false;meetingRenderRoomV101();await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*');
};

/* Activate hybrid transport after the existing secure join/session setup. */
const joinMeetingRoomBaseV105=joinMeetingRoomV101;
joinMeetingRoomV101=async function(roomCode){
  meetingV105Transport='probing';
  await joinMeetingRoomBaseV105(roomCode);
  if(meetingRoomV101)await meetingV105ActivateTransport();
};
const joinPublicMeetingGuestBaseV105=joinPublicMeetingGuestV102;
joinPublicMeetingGuestV102=async function(e){
  meetingV105Transport='probing';
  await joinPublicMeetingGuestBaseV105(e);
  if(meetingRoomV101)await meetingV105ActivateTransport();
};

/* Diagnostics button inside the live room. */
function meetingV105Diagnostics(){
  const n=meetingV105Net;
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${meet105L('تشخيص اتصال الاجتماع','Meeting connection diagnostics')}</h3><div class="subtle">${meet105L('قيم لحظية من المتصفح. لا يتم تسجيل محتوى الصوت أو الفيديو.','Live browser metrics. Audio/video content is not recorded.')}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div><div class="meet105-diag"><div><span>${meet105L('النقل','Transport')}</span><b>${meetingV105Transport==='sfu'?'SFU + TURN':meetingV105Transport==='mesh'?'P2P fallback':'Auto'}</b></div><div><span>RTT</span><b>${n.rtt==null?'—':Math.round(n.rtt)+' ms'}</b></div><div><span>${meet105L('فقد الحزم','Packet loss')}</span><b>${n.loss==null?'—':n.loss+'%'}</b></div><div><span>${meet105L('الحالة','Status')}</span><b>${n.reconnecting?meet105L('إعادة اتصال','Reconnecting'):meet105L('متصل','Connected')}</b></div></div><div class="meet101-note" style="margin-top:10px">${meetingV105Transport==='sfu'?meet105L('الوسائط تمر عبر LiveKit SFU، مع TURN عند الحاجة حسب إعداد البنية.','Media is routed by the LiveKit SFU, with TURN fallback when required by your deployment.'):meet105L('تاسكي يعمل حاليًا على P2P كمسار احتياطي لأن SFU غير متاح أو لم يتم تفعيله.','Tasky is currently using P2P fallback because SFU is unavailable or not enabled.')}</div>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
}
const meetingV1045PatchToolbarBaseV105=meetingV1045PatchToolbar;
meetingV1045PatchToolbar=function(){
  meetingV1045PatchToolbarBaseV105();
  const tools=document.getElementById('meet103Tools');if(!tools)return;
  if(!document.getElementById('meet105DiagBtn')){
    const b=document.createElement('button');b.id='meet105DiagBtn';b.type='button';b.className='meet103-pill';b.onclick=meetingV105Diagnostics;b.innerHTML=`📶 <span>${meet105L('الاتصال','Connection')}</span>`;tools.appendChild(b)
  }
  meetingV105PatchNetBadge();
};
const meetingRenderRoomBaseV105=meetingRenderRoomV101;
meetingRenderRoomV101=function(){meetingRenderRoomBaseV105();if(meetingRoomV101){meetingV1045PatchToolbar();meetingV105PatchNetBadge()}};

window.addEventListener('offline',()=>{meetingV105Net.quality='offline';meetingV105PatchNetBadge()});
window.addEventListener('online',()=>{meetingV105Net.reconnecting=true;meetingV105PatchNetBadge();if(meetingV105Transport==='mesh')for(const id of meetingPeersV101.keys())meetingV105RestartPeer(id)});
try{navigator.connection?.addEventListener?.('change',()=>{if(meetingRoomV101&&meetingV105Transport==='mesh')for(const id of meetingPeersV101.keys())meetingV105RestartPeer(id)})}catch(_){}

const leaveMeetingRoomBaseV105=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){
  meetingV105StopStats();
  if(meetingV105SfuRoom){try{await meetingV105SfuRoom.disconnect()}catch{}meetingV105SfuRoom=null}
  meetingV105Transport='probing';meetingV105Net={quality:'unknown',rtt:null,loss:null,bitrate:null,reconnecting:false};meetingV105IceRetries.clear();
  return leaveMeetingRoomBaseV105(opts);
};


/* --- source script: tasky-v1051-meeting-rich-lifecycle-js --- */

window.TASKY_BUILD='V105.1';console.info('Tasky build',window.TASKY_BUILD);

let meetingV1051HostBeatTimer=null;
let meetingV1051PdfPromise=null;
let meetingV1051CurrentMinutesId=null;
let meetingV1051CurrentMinutesCtx=null;

function meet1051L(ar,en){return lang==='ar'?ar:en}

/* ---------- Safe rich text ---------- */
function meetingV1051SanitizeRich(input){
  const raw=String(input||'');
  const doc=new DOMParser().parseFromString(`<div id="r">${raw}</div>`,'text/html');
  const root=doc.getElementById('r');
  const allowed=new Set(['DIV','P','BR','B','STRONG','I','EM','U','S','STRIKE','UL','OL','LI','H2','H3','H4','BLOCKQUOTE','SPAN']);
  const blocked=new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT','BUTTON','TEXTAREA','SELECT','OPTION','LINK','META']);
  const walk=[...root.querySelectorAll('*')];
  for(const el of walk){
    if(blocked.has(el.tagName)){el.remove();continue}
    if(!allowed.has(el.tagName)){el.replaceWith(...el.childNodes);continue}
    const style=el.getAttribute('style')||'';
    [...el.attributes].forEach(a=>el.removeAttribute(a.name));
    if(style){
      const safe=style.split(';').map(x=>x.trim()).filter(Boolean).filter(rule=>{
        const p=rule.split(':')[0]?.trim().toLowerCase();
        return ['text-align','color','background-color','font-size','font-weight','font-style','text-decoration','margin-left','margin-right'].includes(p);
      }).join(';');
      if(safe)el.setAttribute('style',safe);
    }
  }
  return root.innerHTML;
}
function meetingV1051PlainFromRich(html){
  const d=document.createElement('div');d.innerHTML=meetingV1051SanitizeRich(html);
  return (d.innerText||d.textContent||'').replace(/\n{3,}/g,'\n\n').trim();
}
function meetingV1051RichHtml(value){
  const v=String(value||'');
  if(!v)return'';
  if(!/[<>]/.test(v))return escapeHtml(v).replace(/\n/g,'<br>');
  return meetingV1051SanitizeRich(v);
}
function meetingV1051EditorHtml(id,value,placeholder){
  return `<div class="meet1051-rich">
    ${meetingV1051ToolbarHtml(id)}
    <div id="${id}" class="meet1051-editor" contenteditable="true" spellcheck="true" data-placeholder="${escapeHtml(placeholder)}">${meetingV1051RichHtml(value)}</div>
  </div>`;
}
function meetingV1051ToolbarHtml(id){
  const q=JSON.stringify(id);
  return `<div class="meet1051-richbar" onmousedown="if(event.target.closest('button,label'))event.preventDefault()">
    <button type="button" title="${meet1051L('تراجع','Undo')}" onclick='meetingV1051Cmd(${q},"undo")'>↶</button>
    <button type="button" title="${meet1051L('إعادة','Redo')}" onclick='meetingV1051Cmd(${q},"redo")'>↷</button><span class="sep"></span>
    <button type="button" onclick='meetingV1051Cmd(${q},"bold")'><b>B</b></button>
    <button type="button" onclick='meetingV1051Cmd(${q},"italic")'><i>I</i></button>
    <button type="button" onclick='meetingV1051Cmd(${q},"underline")'><u>U</u></button>
    <button type="button" onclick='meetingV1051Cmd(${q},"strikeThrough")'><s>S</s></button><span class="sep"></span>
    <button type="button" title="${meet1051L('عنوان','Heading')}" onclick='meetingV1051Cmd(${q},"formatBlock","H3")'>H</button>
    <button type="button" title="${meet1051L('نص عادي','Normal text')}" onclick='meetingV1051Cmd(${q},"formatBlock","DIV")'>¶</button>
    <button type="button" title="${meet1051L('تكبير','Larger')}" onclick='meetingV1051Cmd(${q},"fontSize","5")'>A+</button>
    <button type="button" title="${meet1051L('تصغير','Smaller')}" onclick='meetingV1051Cmd(${q},"fontSize","2")'>A−</button><span class="sep"></span>
    <button type="button" title="${meet1051L('قائمة نقطية','Bullets')}" onclick='meetingV1051Cmd(${q},"insertUnorderedList")'>•≡</button>
    <button type="button" title="${meet1051L('قائمة مرقمة','Numbered list')}" onclick='meetingV1051Cmd(${q},"insertOrderedList")'>1≡</button>
    <button type="button" title="${meet1051L('محاذاة يمين','Right')}" onclick='meetingV1051Cmd(${q},"justifyRight")'>⇥</button>
    <button type="button" title="${meet1051L('توسيط','Center')}" onclick='meetingV1051Cmd(${q},"justifyCenter")'>≡</button>
    <button type="button" title="${meet1051L('محاذاة يسار','Left')}" onclick='meetingV1051Cmd(${q},"justifyLeft")'>⇤</button>
    <button type="button" title="${meet1051L('زيادة المسافة البادئة','Indent')}" onclick='meetingV1051Cmd(${q},"indent")'>→|</button>
    <button type="button" title="${meet1051L('تقليل المسافة البادئة','Outdent')}" onclick='meetingV1051Cmd(${q},"outdent")'>|←</button><span class="sep"></span>
    <label title="${meet1051L('لون النص','Text color')}">A<input type="color" value="#17211f" onchange='meetingV1051Cmd(${q},"foreColor",this.value)'></label>
    <label title="${meet1051L('تمييز','Highlight')}">▰<input type="color" value="#fff1a8" onchange='meetingV1051Cmd(${q},"hiliteColor",this.value)'></label>
    <button type="button" title="${meet1051L('مسح التنسيق','Clear formatting')}" onclick='meetingV1051Cmd(${q},"removeFormat")'>Tx</button>
  </div>`;
}
function meetingV1051Cmd(id,cmd,val=null){
  const el=document.getElementById(id);if(!el)return;
  el.focus();
  try{document.execCommand(cmd,false,val)}catch(e){console.warn('V105.1 rich cmd',cmd,e)}
  el.dispatchEvent(new Event('input',{bubbles:true}));
}
function meetingV1051GetEditor(id){return meetingV1051SanitizeRich(document.getElementById(id)?.innerHTML||'')}

/* ---------- Meeting form / rich agenda ---------- */
openMeetingEditorV101=function(id=null){
  const m=id?meetingByIdV101(id):null;if(m&&!m.can_manage)return;
  const selected=new Set(meetingInviteIdsV101(m)),all=!m||selected.size===0;
  const members=teamMembers.filter(x=>x.status==='active'&&x.userId&&x.userId!==currentUserId);
  const durations=[
    ['',meet1051L('غير محدد المدة','No fixed duration')],
    ['30',meet1051L('30 دقيقة','30 minutes')],['60',meet1051L('ساعة','1 hour')],
    ['90',meet1051L('ساعة ونصف','1 hour 30 minutes')],['120',meet1051L('ساعتان','2 hours')],
    ['180',meet1051L('3 ساعات','3 hours')],['240',meet1051L('4 ساعات','4 hours')]
  ];
  const current=m?(m.duration_minutes==null?'':String(m.duration_minutes)):'30';
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${m?meet102L('تعديل الاجتماع','Edit meeting'):meet102L('اجتماع جديد','New meeting')}</h3><div class="subtle">${meet1051L('حدد المشاركين والوقت والمدة، ويمكنك جعل الاجتماع غير محدد المدة.','Choose participants, time and duration, or make the meeting open-ended.')}</div></div><button class="modal-close" type="button" onclick="closeAddModal()">×</button></div>
  <form onsubmit="submitMeetingV101(event,'${m?.id||''}')"><div class="meet101-form-grid">
    <div class="field full"><label>${meet102L('عنوان الاجتماع','Meeting title')}</label><input id="meet101Title" maxlength="160" required value="${escapeHtml(m?.title||'')}"></div>
    <div class="field"><label>${meet102L('التاريخ والوقت','Date & time')}</label><input id="meet101When" type="datetime-local" required value="${meetingLocalDateValueV101(m?.scheduled_at)}"></div>
    <div class="field"><label>${meet102L('المدة','Duration')}</label><select id="meet101Duration">${durations.map(([v,l])=>`<option value="${v}" ${current===v?'selected':''}>${escapeHtml(l)}</option>`).join('')}</select><small>${meet1051L('غير محدد المدة لا ينهي الاجتماع تلقائيًا.','Open-ended meetings do not auto-end.')}</small></div>
    <div class="field full"><label>${meet102L('الهدف / الأجندة','Purpose / agenda')}</label>${meetingV1051EditorHtml('meet1051AgendaEditor',m?.agenda_html||m?.description||'',meet1051L('اكتب أجندة الاجتماع ونقاط النقاش…','Write the meeting agenda and discussion points…'))}</div>
    <div class="field full"><label class="form-check"><input id="meet101All" type="checkbox" ${all?'checked':''} onchange="meetingAudienceToggleV101()"><span>${meet102L('دعوة جميع أعضاء مساحة العمل','Invite all workspace members')}</span></label></div>
    <div class="meet101-member-grid full" id="meet101Members" style="${all?'display:none':'display:grid'}">${members.map(x=>`<label class="meet101-member"><input type="checkbox" data-meet101-user value="${x.userId}" ${selected.has(x.userId)?'checked':''}><span><b>${escapeHtml(x.fullName||x.email)}</b><small style="display:block;color:var(--muted)">${escapeHtml(x.jobTitle||'')}</small></span></label>`).join('')||`<div class="meet101-empty">${meet102L('لا يوجد أعضاء آخرون نشطون.','No other active members.')}</div>`}</div>
    <div class="field full meet102-guest-setting"><label class="form-check"><input id="meet102AllowGuests" type="checkbox" ${m?.allow_guests?'checked':''}><span><b>${meet102L('السماح لضيوف خارجيين بالدخول بدون حساب تاسكي','Allow external guests to join without a Tasky account')}</b><small>${meet1051L('ينشئ تاسكي رابط ضيف منفصلًا ويمكن استخدام غرفة الانتظار.','Tasky creates a separate guest link and can use the waiting room.')}</small></span></label></div>
  </div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap"><button type="button" class="chip-btn" onclick="closeAddModal()">${meet102L('إلغاء','Cancel')}</button>${!m?`<button type="submit" class="chip-btn" data-start-now="1">${meet102L('حفظ وابدأ الآن','Save & start now')}</button>`:''}<button type="submit" class="primary-btn">${m?meet102L('حفظ التعديلات','Save changes'):meet102L('حفظ الاجتماع','Save meeting')}</button></div></form>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
  setTimeout(()=>{if(typeof taskyEnhanceSelects==='function')taskyEnhanceSelects()},0);
};
submitMeetingV101=async function(e,id){
  e.preventDefault();const btn=e.submitter;if(btn)btn.disabled=true;
  const all=!!document.getElementById('meet101All').checked;
  const inviteeIds=all?[]:[...document.querySelectorAll('[data-meet101-user]:checked')].map(x=>x.value);
  const startNow=btn?.dataset?.startNow==='1';
  const when=startNow?new Date().toISOString():new Date(document.getElementById('meet101When').value).toISOString();
  const rawDuration=document.getElementById('meet101Duration').value;
  const agendaHtml=meetingV1051GetEditor('meet1051AgendaEditor'),desc=meetingV1051PlainFromRich(agendaHtml).slice(0,5000)||null;
  const args={p_title:document.getElementById('meet101Title').value.trim(),p_description:desc,p_agenda_html:agendaHtml||null,p_scheduled_at:when,p_duration_minutes:rawDuration===''?null:Number(rawDuration),p_invitee_ids:inviteeIds,p_allow_guests:!!document.getElementById('meet102AllowGuests')?.checked};
  try{
    const res=id?await sb.rpc('tasky_meeting_update_v1051',{p_meeting_id:id,...args}):await sb.rpc('tasky_meeting_create_v1051',{p_workspace_id:currentWorkspaceId,...args});
    if(res.error)throw res.error;closeAddModal();await fetchMeetingsV101();renderModule();
    const roomCode=id?meetingByIdV101(id)?.room_code:res.data?.room_code;
    taskyToast(id?meet102L('تم تحديث الاجتماع','Meeting updated'):meet102L('تم إنشاء الاجتماع','Meeting created'),{tone:'success'});
    if(startNow&&roomCode)setTimeout(()=>openMeetingJoinConfirmV101(roomCode),50);
  }catch(err){showTaskyDialog({title:meet102L('تعذّر حفظ الاجتماع','Could not save meeting'),message:err?.message||String(err),tone:'error'})}
  finally{if(btn)btn.disabled=false}
};

/* Use V105.1 list with rich agenda */
fetchMeetingsV101=async function(){
  if(!currentWorkspaceId)return[];
  meetingsLoadingV101=true;meetingsErrorV101='';
  try{const {data,error}=await sb.rpc('tasky_meeting_list_v1051',{p_workspace_id:currentWorkspaceId});if(error)throw error;meetingsV101=Array.isArray(data)?data:[];return meetingsV101}
  catch(err){meetingsErrorV101=err?.message||String(err);console.warn('Tasky V105.1 meetings',err);meetingsV101=[];return[]}
  finally{meetingsLoadingV101=false}
};

/* Rich agenda preview on cards */
const meetingCardBaseV1051=meetingCardV101;
meetingCardV101=function(m,past=false){
  let h=meetingCardBaseV1051(m,past);
  if(m?.agenda_html){
    const rich=`<div class="meet1047-agenda meet1051-rich-preview"><b>${meet1051L('الأجندة / الهدف:','Agenda / purpose:')}</b>${meetingV1051RichHtml(m.agenda_html)}</div>`;
    h=h.replace(/<div class="meet1047-agenda">[\s\S]*?<\/div>/,rich);
  }
  return h;
};

/* ---------- Rich minutes, including creation after meeting end ---------- */
async function meetingV1051OpenMinutesEditor(meetingId){
  const {data,error}=await sb.rpc('tasky_meeting_minutes_get_v1046',{p_meeting_id:meetingId});
  if(error)return showTaskyDialog({title:meet1051L('تعذّر تحميل المحضر','Could not load minutes'),message:error.message,tone:'error'});
  if(!data?.can_edit)return taskyToast(meet1051L('لا تملك صلاحية تعديل هذا المحضر','You do not have permission to edit these minutes'),{tone:'warning'});
  meetingV1051CurrentMinutesId=meetingId;meetingV1051CurrentMinutesCtx=data;
  document.getElementById('meet1046MinutesBackdrop')?.remove();document.getElementById('meet1046MinutesPanel')?.remove();
  const back=document.createElement('div');back.id='meet1046MinutesBackdrop';back.className='meet1046-minutes-backdrop';back.onclick=meetingV1051CloseMinutes;
  const panel=document.createElement('aside');panel.id='meet1046MinutesPanel';panel.className='meet1046-minutes-panel';
  const m=meetingsV101.find(x=>x.id===meetingId)||meetingRoomV101||{};
  const names=[...(data.attendee_names||[]),...meetingV1046ParticipantNames?.()||[]].filter(Boolean);
  panel.innerHTML=`<div class="meet1046-minutes-head"><div><h3>📝 ${meet1051L('محضر الاجتماع','Meeting minutes')}</h3><p>${escapeHtml(m.title||'')}</p></div><button class="modal-close" onclick="meetingV1051CloseMinutes()">×</button></div>
  <div class="meet1046-minutes-body"><div class="meet1046-shortcuts">${[
    meet1051L('قرار: ','Decision: '),meet1051L('إجراء: ','Action: '),meet1051L('مسؤول: ','Owner: '),meet1051L('موعد: ','Due: '),meet1051L('متابعة: ','Follow-up: '),meet1051L('ملاحظة: ','Note: '),
    ...[...new Set(names)].map(n=>`@${n} `)
  ].map(x=>`<button type="button" onclick='meetingV1051InsertMinutes(${JSON.stringify(x)})'>${escapeHtml(x)}</button>`).join('')}</div>
  ${meetingV1051EditorHtml('meet1051MinutesEditor',data.content||'',meet1051L('ابدأ توثيق الاجتماع هنا…','Start documenting the meeting here…'))}
  <span id="meet1046SaveState" class="meet1046-save-state">${data.updated_at?meet1051L('آخر حفظ: ','Last saved: ')+meetingDateV101(data.updated_at):meet1051L('محضر جديد — لم يُحفظ بعد','New minutes — not saved yet')}</span></div>
  <div class="meet1046-minutes-actions"><button class="primary-btn" onclick="meetingV1051SaveMinutes(true)">${meet1051L('حفظ الآن','Save now')}</button>${data.can_manage_editors?`<button class="chip-btn" onclick="meetingV1046ManageEditors('${meetingId}')">🔐 ${meet1051L('الصلاحيات','Permissions')}</button>`:''}</div>`;
  document.body.append(back,panel);
  document.getElementById('meet1051MinutesEditor')?.addEventListener('input',meetingV1051ScheduleSave);
  setTimeout(()=>document.getElementById('meet1051MinutesEditor')?.focus(),50);
}
function meetingV1051InsertMinutes(text){
  const el=document.getElementById('meet1051MinutesEditor');if(!el)return;el.focus();
  document.execCommand('insertText',false,String(text||''));meetingV1051ScheduleSave();
}
function meetingV1051ScheduleSave(){
  clearTimeout(meetingV1046MinutesSaveTimer);
  const s=document.getElementById('meet1046SaveState');if(s)s.textContent=meet1051L('تغييرات غير محفوظة…','Unsaved changes…');
  meetingV1046MinutesSaveTimer=setTimeout(()=>meetingV1051SaveMinutes(false),1800);
}
async function meetingV1051SaveMinutes(showToast=false){
  if(!meetingV1051CurrentMinutesId||meetingV1046MinutesSaving)return;
  const content=meetingV1051GetEditor('meet1051MinutesEditor');
  meetingV1046MinutesSaving=true;
  const {data,error}=await sb.rpc('tasky_meeting_minutes_save_v1051',{p_meeting_id:meetingV1051CurrentMinutesId,p_content_html:content});
  meetingV1046MinutesSaving=false;
  if(error){const s=document.getElementById('meet1046SaveState');if(s)s.textContent=meet1051L('تعذّر الحفظ','Save failed');if(showToast)showTaskyDialog({title:meet1051L('تعذّر حفظ المحضر','Could not save minutes'),message:error.message,tone:'error'});return}
  const s=document.getElementById('meet1046SaveState');if(s)s.textContent=meet1051L('تم الحفظ','Saved')+' · '+new Date().toLocaleTimeString(lang==='ar'?'ar-SA':'en-US',{hour:'2-digit',minute:'2-digit'});
  if(showToast)taskyToast(meet1051L('تم حفظ محضر الاجتماع','Meeting minutes saved'),{tone:'success'});
}
function meetingV1051CloseMinutes(){
  clearTimeout(meetingV1046MinutesSaveTimer);
  if(document.getElementById('meet1051MinutesEditor'))meetingV1051SaveMinutes(false);
  document.getElementById('meet1046MinutesBackdrop')?.remove();document.getElementById('meet1046MinutesPanel')?.remove();
  meetingV1051CurrentMinutesId=null;meetingV1051CurrentMinutesCtx=null;
}
meetingV1046OpenLiveMinutes=async function(){if(meetingRoomV101)return meetingV1051OpenMinutesEditor(meetingRoomV101.id)};
meetingV1046OpenMinutesForPast=async function(meetingId){return meetingV1051OpenMinutesEditor(meetingId)};

/* Reference modal always offers Add/Edit when authorized, even if minutes do not exist yet. */
meetingV1046OpenMinutesReference=async function(meetingId){
  const {data,error}=await sb.rpc('tasky_meeting_minutes_get_v1046',{p_meeting_id:meetingId});
  if(error)return showTaskyDialog({title:meet1051L('تعذّر تحميل المحضر','Could not load minutes'),message:error.message,tone:'error'});
  const m=meetingsV101.find(x=>x.id===meetingId)||{},content=String(data?.content||'').trim();
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${meet1051L('محضر الاجتماع','Meeting minutes')} — ${escapeHtml(m.title||'')}</h3><div class="subtle">${data?.status==='final'?meet1051L('محضر معتمد','Final minutes'):content?meet1051L('مسودة محضر','Draft minutes'):meet1051L('لا يوجد محضر بعد','No minutes yet')}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
  <div class="meet1046-report meet1051-rich-preview">${content?meetingV1051RichHtml(content):`<div class="meet101-empty">${meet1051L('لم يتم إنشاء محضر لهذا الاجتماع حتى الآن.','No minutes have been created for this meeting yet.')}</div>`}</div>
  <div class="meet101-actions">${data?.can_edit?`<button class="primary-btn" onclick="closeAddModal();meetingV1051OpenMinutesEditor('${meetingId}')">${content?meet1051L('تعديل المحضر','Edit minutes'):meet1051L('إضافة محضر','Add minutes')}</button>`:''}${content?`<button class="chip-btn meet1047-report-download" onclick="meetingV1051ExportPdf('${meetingId}',this)">PDF ${meet1051L('استخراج','Export')}</button><button class="chip-btn" onclick="meetingV1046CopyEmail('${meetingId}')">${meet1051L('نسخ نص بريد','Copy email text')}</button>`:''}${data?.can_edit&&m.status==='ended'&&data?.status!=='final'&&content?`<button class="chip-btn" onclick="meetingV1046Finalize('${meetingId}')">${meet1051L('اعتماد المحضر','Finalize')}</button>`:''}</div>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
};

/* ---------- Direct PDF export preserving Arabic through browser rasterization ---------- */
function meetingV1051LoadPdfDeps(){
  if(window.html2canvas&&window.jspdf?.jsPDF)return Promise.resolve();
  if(meetingV1051PdfPromise)return meetingV1051PdfPromise;
  const load=src=>new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=res;s.onerror=()=>rej(new Error(`Could not load ${src}`));document.head.appendChild(s)});
  meetingV1051PdfPromise=(async()=>{
    if(!window.html2canvas)await load('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
    if(!window.jspdf?.jsPDF)await load('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js');
  })();
  return meetingV1051PdfPromise;
}
async function meetingV1051ExportPdf(meetingId,btn){
  try{
    btn?.classList.add('meet1051-pdf-loading');if(btn)btn.disabled=true;
    await meetingV1051LoadPdfDeps();
    const {m,d}=await meetingV1046GetExportData(meetingId),dur=meetingV1047DurationInfo(m),att=(d.attendee_names||[]).join('، ');
    const box=document.createElement('div');box.style.cssText='position:fixed;left:-10000px;top:0;width:760px;background:#fff;color:#17211f;padding:34px;font-family:Arial,sans-serif;line-height:1.75;direction:'+(lang==='ar'?'rtl':'ltr');
    box.innerHTML=`<div style="border-bottom:3px solid #0b4d40;padding-bottom:14px;margin-bottom:18px"><h1 style="margin:0;color:#0b4d40;font-size:26px">${meet1051L('محضر اجتماع','Meeting Minutes')}: ${escapeHtml(m.title||'')}</h1><div style="color:#6a7773;margin-top:4px">Tasky</div></div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px"><tr><td style="border:1px solid #ddd;padding:8px"><b>${meet1051L('الموعد','When')}</b><br>${escapeHtml(meetingDateV101(m.scheduled_at))}</td><td style="border:1px solid #ddd;padding:8px"><b>${escapeHtml(dur.title)}</b><br>${escapeHtml(dur.label)}</td></tr><tr><td style="border:1px solid #ddd;padding:8px"><b>${meet1051L('المنظّم','Organizer')}</b><br>${escapeHtml(meetingMemberNameV101(m.created_by))}</td><td style="border:1px solid #ddd;padding:8px"><b>${meet1051L('الحضور','Attendees')}</b><br>${escapeHtml(att||'—')}</td></tr></table>
    ${m.agenda_html?`<h2 style="color:#0b4d40">${meet1051L('الأجندة','Agenda')}</h2><div>${meetingV1051RichHtml(m.agenda_html)}</div>`:''}
    <h2 style="color:#0b4d40;margin-top:22px">${meet1051L('المحضر','Minutes')}</h2><div>${meetingV1051RichHtml(d.content||'')}</div>`;
    document.body.appendChild(box);
    const canvas=await html2canvas(box,{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false});
    box.remove();
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'p',unit:'mm',format:'a4'});
    const pageW=210,pageH=297,margin=10,usableW=pageW-margin*2,usableH=pageH-margin*2;
    const imgW=canvas.width,imgH=canvas.height,pxPerMm=imgW/usableW,pagePx=Math.floor(usableH*pxPerMm);
    let y=0,page=0;
    while(y<imgH){
      const slice=document.createElement('canvas');slice.width=imgW;slice.height=Math.min(pagePx,imgH-y);
      slice.getContext('2d').drawImage(canvas,0,y,imgW,slice.height,0,0,imgW,slice.height);
      const hMm=slice.height/pxPerMm;if(page++)pdf.addPage();
      pdf.addImage(slice.toDataURL('image/jpeg',.94),'JPEG',margin,margin,usableW,hMm);
      y+=slice.height;
    }
    pdf.save(`Tasky-Meeting-Minutes-${String(m.title||meetingId).replace(/[^\p{L}\p{N}\-_]+/gu,'-').slice(0,60)}.pdf`);
    taskyToast(meet1051L('تم استخراج المحضر PDF','Minutes PDF exported'),{tone:'success'});
  }catch(e){showTaskyDialog({title:meet1051L('تعذّر إنشاء PDF','Could not create PDF'),message:e?.message||String(e),tone:'error'})}
  finally{btn?.classList.remove('meet1051-pdf-loading');if(btn)btn.disabled=false}
}

/* ---------- Host lifecycle: explicit leave ends for all + heartbeat handles abrupt host loss ---------- */
async function meetingV1051Heartbeat(){
  if(!meetingRoomV101||meetingGuestSessionV102||String(meetingRoomV101.created_by)!==String(currentUserId)||meetingRoomV101.status!=='live')return;
  try{await sb.rpc('tasky_meeting_host_heartbeat_v1051',{p_meeting_id:meetingRoomV101.id})}catch(e){console.warn('V105.1 host heartbeat',e)}
}
function meetingV1051StartHeartbeat(){
  clearInterval(meetingV1051HostBeatTimer);meetingV1051HostBeatTimer=null;
  meetingV1051Heartbeat();
  meetingV1051HostBeatTimer=setInterval(meetingV1051Heartbeat,5000);
}
function meetingV1051StopHeartbeat(){if(meetingV1051HostBeatTimer){clearInterval(meetingV1051HostBeatTimer);meetingV1051HostBeatTimer=null}}

/* Faster lifecycle watch for guests/members */
meetingSessionCheckV101=async function(){
  if(!meetingRoomV101)return;
  try{
    let data,error;
    if(meetingGuestSessionV102){
      ({data,error}=await sb.rpc('tasky_public_meeting_guest_session_check_v1051',{p_guest_session_id:meetingGuestSessionV102.id,p_guest_session_token:meetingGuestSessionV102.token}));
    }else{
      ({data,error}=await sb.rpc('tasky_meeting_session_check_v1051',{p_meeting_id:meetingRoomV101.id}));
    }
    if(error)throw error;
    if(!data?.authorized){
      const st=data?.status;
      const msg=st==='cancelled'?meet1051L('تم إلغاء الاجتماع','The meeting was cancelled'):st==='host_left'?meet1051L('غادر المنظّم وانتهى الاجتماع','The organizer left and the meeting ended'):st==='ended'?meet1051L('انتهى الاجتماع','The meeting ended'):meet1051L('انتهت جلسة الاجتماع','The meeting session ended');
      const mid=meetingRoomV101.id;
      if(meetingGuestSessionV102){
        const sess={...meetingGuestSessionV102};meetingV1044LastGuestRating={id:sess.id,token:sess.token,meetingId:mid};
        await leaveMeetingRoomV101({silent:true,skipFetch:true});renderPublicMeetingGuestExitV1044(msg,mid);
      }else{
        await leaveMeetingRoomV101({silent:true});taskyToast(msg,{tone:'warning'});
      }
    }
  }catch(err){console.warn('V105.1 session check',err)}
};
meetingStartSessionWatchV101=function(){
  if(meetingSessionTimerV101)clearInterval(meetingSessionTimerV101);
  meetingSessionTimerV101=setInterval(()=>meetingSessionCheckV101(),5000);
};

/* Explicit organizer Leave = end the live meeting for everyone. */
const leaveMeetingRoomBaseV1051=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){
  const room=meetingRoomV101?{...meetingRoomV101}:null;
  const explicit=!opts?.silent;
  const isOrganizer=room&&!meetingGuestSessionV102&&String(room.created_by)===String(currentUserId);
  if(explicit&&isOrganizer&&room.status==='live'){
    try{
      const {error}=await sb.rpc('tasky_meeting_end_v1044',{p_meeting_id:room.id});
      if(!error)await meetingBroadcastSignalV101('meeting-ended',{reason:'host_left'},'*');
    }catch(e){console.warn('V105.1 host leave end',e)}
  }
  meetingV1051StopHeartbeat();
  return leaveMeetingRoomBaseV1051(opts);
};

/* Start host heartbeat after room render/join. */
const meetingRenderRoomBaseV1051=meetingRenderRoomV101;
meetingRenderRoomV101=function(){
  meetingRenderRoomBaseV1051();
  if(meetingRoomV101&&String(meetingRoomV101.created_by)===String(currentUserId)&&meetingRoomV101.status==='live'&&!meetingGuestSessionV102&&!meetingV1051HostBeatTimer)meetingV1051StartHeartbeat();
};

/* Keep no-minutes card actionable for authorized users after end. */
const meetingCardBaseV1051b=meetingCardV101;
meetingCardV101=function(m,past=false){
  let h=meetingCardBaseV1051b(m,past);
  if(['ended','cancelled'].includes(m.status)&&m.can_edit_minutes&&!h.includes(`meetingV1046OpenMinutesReference('${m.id}')`)){
    h=h.replace('</div></article>',`<button class="chip-btn" onclick="meetingV1046OpenMinutesReference('${m.id}')">📝 ${m.has_minutes?meet1051L('محضر الاجتماع','Meeting minutes'):meet1051L('إضافة محضر','Add minutes')}</button></div></article>`);
  }
  return h;
};


/* --- source script: tasky-v10512-meeting-card-ui-js --- */

window.TASKY_BUILD='V105.1.2';console.info('Tasky build',window.TASKY_BUILD);

function meet10512L(ar,en){return lang==='ar'?ar:en}

meetingCardV101=function(m,past=false){
  const terminal=meetingV1046MemberTerminal(m);
  const canJoin=!terminal;
  const canManage=!!m.can_manage;
  const d=meetingV1047DurationInfo(m);
  const canMinutes=!!m.can_edit_minutes||!!m.has_minutes||canManage;
  const rating=m.status==='ended'
    ?`<div class="meet1047-rating-inline"><span class="label">${meet1047L('تقييم الجودة التقنية — الصوت، الفيديو، الاتصال','Technical quality — audio, video, connection')}</span>${meetingV1047RatingWidget(m.id,m.my_rating||0,false)}<span class="meet1047-rating-hint">${m.my_rating?`${m.my_rating}/5`:meet1047L('اضغط على عدد النجوم المناسب','Tap the desired number of stars')}</span></div>`
    :'';

  const agenda=m.agenda_html
    ?`<div class="meet1047-agenda meet1051-rich-preview"><b>${meet10512L('الأجندة / الهدف:','Agenda / purpose:')}</b>${meetingV1051RichHtml(m.agenda_html)}</div>`
    :(m.description?`<div class="meet1047-agenda"><b>${meet10512L('الأجندة / الهدف:','Agenda / purpose:')}</b> ${escapeHtml(m.description)}</div>`:'');

  const statusBadges=`<div class="meet10512-badges">
    ${m.allow_guests?`<span class="meet10512-badge external">↗ ${meet10512L('دخول خارجي','External guests')}</span>`:''}
    ${m.status==='live'?`<span class="meet10512-badge live">● ${meet10512L('مباشر الآن','Live now')}</span>`:''}
  </div>`;

  const actions=[];
  if(canJoin){
    actions.push(`<button class="primary-btn primary" onclick="openMeetingJoinConfirmV101('${m.room_code}')"><svg><use href="#i-camera"/></svg>${m.status==='live'?meet102L('دخول الاجتماع','Join meeting'):meet102L('دخول الاجتماع','Join meeting')}</button>`);
    /* Restore the invitation action that was accidentally dropped by later full card overrides. */
    actions.push(`<button class="chip-btn invite" onclick="meetingShareInviteV103('${m.room_code}')">✉️ ${meet10512L('إرسال دعوة الاجتماع','Send meeting invitation')}</button>`);
    actions.push(`<button class="chip-btn" onclick="meetingCopyLinkV101('${m.room_code}')">🔗 ${meet102L('رابط الأعضاء','Member link')}</button>`);
    if(canManage&&m.allow_guests){
      actions.push(`<button class="chip-btn guest" onclick="meetingCopyGuestLinkV102('${m.id}')">↗ ${meet102L('رابط ضيف بدون تسجيل','No-login guest link')}</button>`);
    }
  }
  if(canManage&&m.status==='scheduled'){
    actions.push(`<button class="chip-btn" onclick="openMeetingEditorV101('${m.id}')">✎ ${meet102L('تعديل','Edit')}</button>`);
    actions.push(`<button class="chip-btn danger" onclick="cancelMeetingV1044('${m.id}')">× ${meet102L('إلغاء','Cancel')}</button>`);
  }else if(canManage&&m.status==='live'){
    actions.push(`<button class="chip-btn danger" onclick="cancelMeetingV1044('${m.id}')">× ${meet102L('إلغاء الاجتماع','Cancel meeting')}</button>`);
  }
  if(canMinutes){
    actions.push(`<button class="chip-btn minutes" onclick="meetingV1046OpenMinutesReference('${m.id}')">📝 ${m.has_minutes?meet10512L('محضر الاجتماع','Meeting minutes'):meet10512L('إضافة محضر','Add minutes')}${m.minutes_status==='final'?` · ${meet10512L('معتمد','Final')}`:''}</button>`);
  }
  if(canManage){
    actions.push(`<button class="chip-btn permissions" onclick="meetingV1046ManageEditors('${m.id}')">🔐 ${meet10512L('صلاحيات المحضر','Minutes access')}</button>`);
  }

  return `<article class="meet101-card meet1047-card meet10512-card ${escapeHtml(m.status)} ${past?'past':''}">
    <div class="meet101-card-head">
      <div>
        <h3>${escapeHtml(m.title)}</h3>
        <p>${escapeHtml(m.description||meet10512L('بدون أجندة مضافة','No agenda added'))}</p>
        ${statusBadges}
      </div>
      <span class="meet101-status ${escapeHtml(m.status)}">${escapeHtml(meetingStatusLabelV101(m.status))}</span>
    </div>
    ${meetingV1044StatusNote(m)}
    <div class="meet1047-summary">
      <div><span>${meet102L('الموعد','When')}</span><b>${escapeHtml(meetingDateV101(m.scheduled_at))}</b></div>
      <div><span>${escapeHtml(d.title)}</span><b class="${d.kind==='open'?'meet1047-duration-open':''}">${escapeHtml(d.label)}</b></div>
      <div><span>${meet102L('المنظّم','Organizer')}</span><b>${escapeHtml(meetingMemberNameV101(m.created_by))}</b></div>
    </div>
    ${agenda}
    ${meetingV1044StatsHtml(m)}
    ${rating}
    <div class="meet10512-actions">${actions.join('')}</div>
  </article>`;
};


/* --- source script: tasky-v10513-meeting-audio-hotfix-js --- */

window.TASKY_BUILD='V105.1.3';console.info('Tasky build',window.TASKY_BUILD);

const meetingV10513AudioEls=new Map();
let meetingV10513AudioBlocked=false;

function meet10513L(ar,en){return lang==='ar'?ar:en}

function meetingV10513UnlockButton(){
  let b=document.getElementById('meet10513AudioUnlock');
  if(!b){
    b=document.createElement('button');
    b.id='meet10513AudioUnlock';
    b.type='button';
    b.innerHTML=`🔊 <span>${meet10513L('اضغط لتشغيل صوت الاجتماع','Tap to enable meeting audio')}</span>`;
    b.onclick=meetingV10513UnlockAudio;
    document.body.appendChild(b);
  }
  b.classList.toggle('show',meetingV10513AudioBlocked&&!!meetingRoomV101);
  return b;
}
async function meetingV10513TryPlay(el){
  if(!el)return true;
  el.autoplay=true;el.muted=false;el.volume=1;
  el.setAttribute('playsinline','');
  try{
    await el.play();
    return true;
  }catch(e){
    if(e?.name==='NotAllowedError'||e?.name==='AbortError'){
      meetingV10513AudioBlocked=true;
      meetingV10513UnlockButton();
    }
    return false;
  }
}
function meetingV10513AudioEl(peerId){
  const key=String(peerId);
  let el=meetingV10513AudioEls.get(key);
  if(el&&document.body.contains(el))return el;
  el=document.createElement('audio');
  el.id='meet10513Audio_'+key.replace(/[^a-zA-Z0-9_-]/g,'_');
  el.className='meet10513-audio-sink';
  el.autoplay=true;el.playsInline=true;el.muted=false;el.volume=1;
  document.body.appendChild(el);
  meetingV10513AudioEls.set(key,el);
  return el;
}
function meetingV10513SyncPeerAudio(peerId,stream){
  if(!stream)return;
  const tracks=stream.getAudioTracks?.().filter(t=>t.readyState==='live')||[];
  const el=meetingV10513AudioEl(peerId);
  if(!tracks.length){
    if(el.srcObject)el.srcObject=null;
    return;
  }
  const current=el.srcObject;
  const currentIds=current?.getAudioTracks?.().map(t=>t.id).join(',')||'';
  const nextIds=tracks.map(t=>t.id).join(',');
  if(currentIds!==nextIds)el.srcObject=new MediaStream(tracks);
  meetingV10513TryPlay(el);
}
function meetingV10513SyncAllAudio(){
  if(!meetingRoomV101)return;
  for(const [peerId,stream] of meetingRemoteStreamsV101.entries()){
    meetingV10513SyncPeerAudio(peerId,stream);
  }
  for(const [peerId,el] of [...meetingV10513AudioEls.entries()]){
    if(!meetingRemoteStreamsV101.has(peerId)){
      try{el.pause();el.srcObject=null;el.remove()}catch(_){}
      meetingV10513AudioEls.delete(peerId);
    }
  }
}
async function meetingV10513UnlockAudio(){
  meetingV10513AudioBlocked=false;
  /* Resume any AudioContext used by active-speaker detection as well. */
  try{
    if(meetingV1042AudioCtx?.state==='suspended')await meetingV1042AudioCtx.resume();
  }catch(_){}
  let ok=true;
  for(const el of meetingV10513AudioEls.values()){
    const played=await meetingV10513TryPlay(el);
    ok=ok&&played;
  }
  meetingV10513AudioBlocked=!ok;
  meetingV10513UnlockButton();
  if(ok)taskyToast(meet10513L('تم تشغيل صوت الاجتماع','Meeting audio enabled'),{tone:'success'});
}

/* Safari/iOS may reject audible autoplay even though the user clicked Join earlier
   because media setup completes asynchronously. Any user gesture in the room retries audio. */
document.addEventListener('pointerdown',()=>{
  if(meetingRoomV101&&meetingV10513AudioBlocked)meetingV10513UnlockAudio();
},{passive:true});

/* P2P: create a dedicated audio sink immediately when an audio track arrives.
   This avoids depending on the participant's <video> element for sound. */
const meetingEnsurePeerBaseV10513=meetingEnsurePeerV101;
meetingEnsurePeerV101=function(remotePeerId){
  const pc=meetingEnsurePeerBaseV10513(remotePeerId);
  if(!pc.__taskyV10513Audio){
    pc.__taskyV10513Audio=true;
    const oldTrack=pc.ontrack;
    pc.ontrack=e=>{
      oldTrack?.(e);
      setTimeout(()=>{
        const s=meetingRemoteStreamsV101.get(remotePeerId);
        if(s)meetingV10513SyncPeerAudio(remotePeerId,s);
      },0);
    };
  }
  return pc;
};

/* SFU: LiveKit remote audio track is explicitly attached to a dedicated audio sink.
   LiveKit's track.attach() is preferred when available; MediaStream fallback remains. */
function meetingV10513AttachLiveKitAudio(track,participant){
  if(!track||track.kind!=='audio')return;
  const id=participant?.identity||track.sid||crypto.randomUUID?.()||String(Date.now());
  const el=meetingV10513AudioEl(id);
  try{
    if(typeof track.attach==='function'){
      track.attach(el);
    }else if(track.mediaStreamTrack){
      el.srcObject=new MediaStream([track.mediaStreamTrack]);
    }
  }catch(e){
    if(track.mediaStreamTrack)el.srcObject=new MediaStream([track.mediaStreamTrack]);
  }
  meetingV10513TryPlay(el);
}
function meetingV10513DetachLiveKitAudio(track,participant){
  const id=participant?.identity;
  if(!id)return;
  const el=meetingV10513AudioEls.get(String(id));
  if(!el)return;
  try{track?.detach?.(el)}catch(_){}
  try{el.pause();el.srcObject=null;el.remove()}catch(_){}
  meetingV10513AudioEls.delete(String(id));
}

/* Patch SFU listeners after the room exists without changing transport selection. */
const meetingV105ConnectSfuBaseV10513=meetingV105ConnectSfu;
meetingV105ConnectSfu=async function(){
  await meetingV105ConnectSfuBaseV10513();
  const room=meetingV105SfuRoom,LK=window.LivekitClient;
  if(!room||room.__taskyV10513Audio)return;
  room.__taskyV10513Audio=true;

  /* Attach tracks that were already subscribed during connect. */
  for(const p of room.remoteParticipants?.values?.()||[]){
    for(const pub of p.trackPublications?.values?.()||[]){
      const t=pub.track;
      if(t?.kind==='audio')meetingV10513AttachLiveKitAudio(t,p);
    }
  }

  room.on(LK.RoomEvent.TrackSubscribed,(track,pub,participant)=>{
    if(track?.kind==='audio'||pub?.source===LK.Track.Source.Microphone){
      meetingV10513AttachLiveKitAudio(track,participant);
    }
  });
  room.on(LK.RoomEvent.TrackUnsubscribed,(track,pub,participant)=>{
    if(track?.kind==='audio'||pub?.source===LK.Track.Source.Microphone){
      meetingV10513DetachLiveKitAudio(track,participant);
    }
  });
};

/* Re-rendering the meeting room must never drop remote sound. */
const meetingRenderRoomBaseV10513=meetingRenderRoomV101;
meetingRenderRoomV101=function(){
  meetingRenderRoomBaseV10513();
  if(meetingRoomV101){
    meetingV10513SyncAllAudio();
    meetingV10513UnlockButton();
  }
};

/* Keep host mute privacy semantics while ensuring local audio track really is enabled/disabled. */
const toggleMeetingMicBaseV10513=toggleMeetingMicV101;
toggleMeetingMicV101=async function(){
  await toggleMeetingMicBaseV10513();
  const tracks=meetingLocalStreamV101?.getAudioTracks?.()||[];
  tracks.forEach(t=>{t.enabled=!!meetingLocalStateV101.mic});
};

/* Audio diagnostics: make the existing Connection panel reveal actual local/remote tracks. */
const meetingV105DiagnosticsBaseV10513=meetingV105Diagnostics;
meetingV105Diagnostics=function(){
  meetingV105DiagnosticsBaseV10513();
  const body=document.getElementById('addModalBody');
  if(!body)return;
  const local=meetingLocalStreamV101?.getAudioTracks?.()||[];
  const remote=[...meetingRemoteStreamsV101.values()].flatMap(s=>s.getAudioTracks?.()||[]).filter(t=>t.readyState==='live');
  const block=document.createElement('div');
  block.className='meet105-diag';
  block.innerHTML=`<div><span>${meet10513L('مايك محلي','Local mic')}</span><b>${local.length?`${local.filter(t=>t.enabled).length}/${local.length} ${meet10513L('مفعّل','enabled')}`:meet10513L('لا يوجد','None')}</b></div>
    <div><span>${meet10513L('مسارات صوت واردة','Remote audio tracks')}</span><b>${remote.length}</b></div>
    <div><span>${meet10513L('تشغيل الصوت','Audio playback')}</span><b>${meetingV10513AudioBlocked?meet10513L('يحتاج نقرة','Tap required'):meet10513L('مفعّل','Enabled')}</b></div>
    <div><span>${meet10513L('مخارج الصوت','Audio sinks')}</span><b>${meetingV10513AudioEls.size}</b></div>`;
  body.appendChild(block);
};

/* Cleanup. */
const leaveMeetingRoomBaseV10513=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){
  for(const el of meetingV10513AudioEls.values()){
    try{el.pause();el.srcObject=null;el.remove()}catch(_){}
  }
  meetingV10513AudioEls.clear();
  meetingV10513AudioBlocked=false;
  document.getElementById('meet10513AudioUnlock')?.classList.remove('show');
  return leaveMeetingRoomBaseV10513(opts);
};


/* --- source script: tasky-v10514-media-prejoin-js --- */

window.TASKY_BUILD='V105.1.4';console.info('Tasky build',window.TASKY_BUILD);

let meetingV10514Prefs={mic:true,camera:true};
let meetingV10514PreviewStream=null;
let meetingV10514Pending={kind:null,roomCode:null};
let meetingV10514GuestConfirmed=false;

function meet10514L(ar,en){return lang==='ar'?ar:en}
function meetingV10514VideoConstraints(){
  const portrait=window.matchMedia?.('(orientation: portrait)')?.matches||innerHeight>innerWidth;
  return portrait
    ?{width:{ideal:720},height:{ideal:1280},aspectRatio:{ideal:.5625},facingMode:{ideal:'user'}}
    :{width:{ideal:1280},height:{ideal:720},aspectRatio:{ideal:1.7777778},facingMode:{ideal:'user'}};
}
function meetingV10514StopPreview(){
  if(meetingV10514PreviewStream){for(const t of meetingV10514PreviewStream.getTracks())try{t.stop()}catch(_){}}
  meetingV10514PreviewStream=null;
}
async function meetingV10514AcquirePreview(){
  meetingV10514StopPreview();
  if(!navigator.mediaDevices?.getUserMedia)return;
  if(!meetingV10514Prefs.mic&&!meetingV10514Prefs.camera){meetingV10514RenderPreview();return}
  try{
    meetingV10514PreviewStream=await navigator.mediaDevices.getUserMedia({
      audio:meetingV10514Prefs.mic?{echoCancellation:true,noiseSuppression:true,autoGainControl:true}:false,
      video:meetingV10514Prefs.camera?meetingV10514VideoConstraints():false
    });
  }catch(err){
    console.warn('V105.1.4 prejoin media',err);
    const tracks=[];
    if(meetingV10514Prefs.mic){try{const a=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});tracks.push(...a.getAudioTracks())}catch(_){meetingV10514Prefs.mic=false}}
    if(meetingV10514Prefs.camera){try{const v=await navigator.mediaDevices.getUserMedia({audio:false,video:meetingV10514VideoConstraints()});tracks.push(...v.getVideoTracks())}catch(_){meetingV10514Prefs.camera=false}}
    meetingV10514PreviewStream=new MediaStream(tracks);
  }
  meetingV10514RenderPreview();
}
function meetingV10514RenderPreview(){
  const v=document.getElementById('meet10514PreviewVideo'),off=document.getElementById('meet10514PreviewOff');
  if(v){v.srcObject=meetingV10514PreviewStream||null;v.muted=true;v.playsInline=true;if(meetingV10514Prefs.camera&&meetingV10514PreviewStream?.getVideoTracks().length)v.play().catch(()=>{})}
  if(off)off.style.display=meetingV10514Prefs.camera&&meetingV10514PreviewStream?.getVideoTracks().length?'none':'grid';
  const mic=document.getElementById('meet10514MicBtn'),cam=document.getElementById('meet10514CamBtn');
  if(mic){mic.className=meetingV10514Prefs.mic?'on':'off';mic.innerHTML=`${meetingV10514Prefs.mic?'🎙️':'🔇'} ${meetingV10514Prefs.mic?meet10514L('المايك يعمل','Microphone on'):meet10514L('المايك مغلق','Microphone off')}`}
  if(cam){cam.className=meetingV10514Prefs.camera?'on':'off';cam.innerHTML=`${meetingV10514Prefs.camera?'📷':'🚫'} ${meetingV10514Prefs.camera?meet10514L('الكاميرا تعمل','Camera on'):meet10514L('الكاميرا مغلقة','Camera off')}`}
}
async function meetingV10514TogglePrejoin(kind){
  meetingV10514Prefs[kind]=!meetingV10514Prefs[kind];
  await meetingV10514AcquirePreview();
}
async function meetingV10514OpenPrejoin(kind,roomCode=null){
  meetingV10514Pending={kind,roomCode};
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${meet10514L('قبل دخول الاجتماع','Before joining')}</h3><div class="subtle">${meet10514L('اختر الكاميرا والمايك قبل دخول غرفة الاجتماع. يمكنك تغييرهما لاحقًا من شريط التحكم.','Choose camera and microphone before entering the meeting. You can change them later from the meeting controls.')}</div></div><button class="modal-close" onclick="meetingV10514CancelPrejoin()">×</button></div>
  <div class="meet10514-prejoin"><div class="meet10514-preview"><video id="meet10514PreviewVideo" autoplay muted playsinline></video><div id="meet10514PreviewOff" class="off">${meet10514L('الكاميرا مغلقة','Camera is off')}</div></div>
  <div class="meet10514-device-actions"><button id="meet10514MicBtn" type="button" onclick="meetingV10514TogglePrejoin('mic')"></button><button id="meet10514CamBtn" type="button" onclick="meetingV10514TogglePrejoin('camera')"></button></div>
  <div class="meet10514-prejoin-note">${meet10514L('لا يتم إرسال الصوت أو الصورة لأي مشارك أثناء هذه المعاينة. تبدأ المشاركة فقط بعد دخول الاجتماع.','Audio and video are not sent to any participant during this preview. Publishing begins only after you enter the meeting.')}</div>
  <div class="meet10514-enter"><button class="chip-btn" type="button" onclick="meetingV10514CancelPrejoin()">${meet10514L('إلغاء','Cancel')}</button><button class="primary-btn" type="button" onclick="meetingV10514ConfirmPrejoin()">${meet10514L('دخول الاجتماع','Join meeting')}</button></div></div>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
  await meetingV10514AcquirePreview();
}
function meetingV10514CancelPrejoin(){meetingV10514StopPreview();meetingV10514Pending={kind:null,roomCode:null};closeAddModal()}
async function meetingV10514ConfirmPrejoin(){
  const p={...meetingV10514Pending};meetingV10514StopPreview();closeAddModal();
  if(p.kind==='member')return meetingV10514JoinMemberNow(p.roomCode);
  if(p.kind==='guest'){meetingV10514GuestConfirmed=true;return joinPublicMeetingGuestV102({preventDefault(){},submitter:null})}
}

/* Restore stable P2P as the active transport. V105 probing was suppressing peer creation,
   especially when a guest completed admission asynchronously from the waiting room. */
meetingV105Transport='mesh';
async function meetingV10514JoinMemberNow(roomCode){
  meetingV105Transport='mesh';
  return joinMeetingRoomBaseV105(String(roomCode||'').trim().toUpperCase());
}
joinMeetingRoomV101=async function(roomCode){return meetingV10514OpenPrejoin('member',String(roomCode||'').trim().toUpperCase())};

/* Guest gets the same device choice before the waiting-room request is submitted. */
const meetingV10514GuestJoinBase=joinPublicMeetingGuestBaseV105;
joinPublicMeetingGuestV102=async function(e){
  e?.preventDefault?.();
  if(!meetingV10514GuestConfirmed)return meetingV10514OpenPrejoin('guest',meetingGuestPublicV102?.roomCode||null);
  meetingV10514GuestConfirmed=false;
  meetingV105Transport='mesh';
  return meetingV10514GuestJoinBase({preventDefault(){},submitter:e?.submitter||null});
};

/* Selected device state controls the actual room media request. */
meetingGetLocalMediaV101=async function(){
  meetingLocalStreamV101=new MediaStream();meetingCameraTrackV101=null;meetingLocalStateV101={mic:false,camera:false,screen:false};
  if(!navigator.mediaDevices?.getUserMedia)return;
  if(!meetingV10514Prefs.mic&&!meetingV10514Prefs.camera)return;
  try{
    const s=await navigator.mediaDevices.getUserMedia({
      audio:meetingV10514Prefs.mic?{echoCancellation:true,noiseSuppression:true,autoGainControl:true}:false,
      video:meetingV10514Prefs.camera?meetingV10514VideoConstraints():false
    });
    s.getTracks().forEach(t=>meetingLocalStreamV101.addTrack(t));
  }catch(err){
    console.warn('V105.1.4 selected media',err);
    if(meetingV10514Prefs.mic){try{const a=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});a.getTracks().forEach(t=>meetingLocalStreamV101.addTrack(t))}catch(_){}}
    if(meetingV10514Prefs.camera){try{const v=await navigator.mediaDevices.getUserMedia({audio:false,video:meetingV10514VideoConstraints()});v.getTracks().forEach(t=>meetingLocalStreamV101.addTrack(t))}catch(_){}}
  }
  meetingCameraTrackV101=meetingLocalStreamV101.getVideoTracks()[0]||null;
  meetingLocalStateV101.mic=meetingLocalStreamV101.getAudioTracks().length>0;
  meetingLocalStateV101.camera=!!meetingCameraTrackV101;
  if(meetingV10514Prefs.mic&&!meetingLocalStateV101.mic)taskyToast(meet10514L('تعذر تشغيل المايك. راجع صلاحية الموقع.','Microphone could not start. Check site permissions.'),{tone:'warning'});
  if(meetingV10514Prefs.camera&&!meetingLocalStateV101.camera)taskyToast(meet10514L('تعذر تشغيل الكاميرا. راجع صلاحية الموقع.','Camera could not start. Check site permissions.'),{tone:'warning'});
};

/* Always allow the original Presence implementation to create WebRTC peers. */
meetingSyncPresenceV101=meetingSyncPresenceBaseV105;

const meetingV105DiagnosticsBaseV10514=meetingV105Diagnostics;
meetingV105Diagnostics=function(){meetingV105Transport='mesh';meetingV105DiagnosticsBaseV10514()};

const leaveMeetingRoomBaseV10514=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){
  meetingV10514StopPreview();meetingV10514GuestConfirmed=false;meetingV105Transport='mesh';
  return leaveMeetingRoomBaseV10514(opts);
};


/* --- source script: tasky-v10515-guest-entry-js --- */

window.TASKY_BUILD='V105.1.5';console.info('Tasky build',window.TASKY_BUILD);

let meetingV10515GuestDraft=null;
let meetingV10515GuestBusy=false;

function meet10515L(ar,en){return lang==='ar'?ar:en}

function meetingV10515CaptureGuestDraft(){
  const p=meetingGuestPublicV102;
  const name=document.getElementById('meet102GuestName')?.value.trim()||'';
  const email=document.getElementById('meet102GuestEmail')?.value.trim()||'';
  const company=document.getElementById('meet102GuestCompany')?.value.trim()||'';
  if(!p?.roomCode||!p?.guestToken)throw new Error(meet10515L('رابط الضيف غير مكتمل. افتح رابط الدعوة من جديد.','Guest link is incomplete. Open the invitation link again.'));
  if(!name)throw new Error(meet10515L('أدخل اسمًا للضيف. يكفي حرف أو رقم أو رمز واحد.','Enter a guest name. A single letter, number, or symbol is enough.'));
  return {roomCode:p.roomCode,guestToken:p.guestToken,name,email,company};
}

function meetingV10515GuestError(message){
  document.getElementById('meet10515GuestError')?.remove();
  const form=document.querySelector('.meet102-guest-form');
  if(form){
    const d=document.createElement('div');d.id='meet10515GuestError';d.className='meet10515-join-error full';
    d.textContent=message;form.appendChild(d);
  }
  showTaskyDialog({title:meet10515L('تعذّر دخول الضيف','Guest could not join'),message,tone:'error'});
}

async function meetingV10515GuestJoinSubmit(){
  if(meetingV10515GuestBusy||meetingRoomV101)return;
  const g=meetingV10515GuestDraft;
  if(!g)return meetingV10515GuestError(meet10515L('بيانات الضيف غير متوفرة. حاول الدخول مرة أخرى.','Guest details are missing. Try joining again.'));
  meetingV10515GuestBusy=true;
  try{
    /* Request waiting-room admission directly from the captured guest data.
       This avoids re-reading form elements after the prejoin modal is closed. */
    const r=await sb.rpc('tasky_public_meeting_waiting_request_v103',{
      p_room_code:g.roomCode,
      p_guest_token:g.guestToken,
      p_guest_name:g.name,
      p_guest_email:g.email||null,
      p_guest_company:g.company||null
    });
    if(r.error)throw r.error;

    if(r.data?.waiting_required===false){
      const j=await sb.rpc('tasky_public_meeting_guest_join_v102',{
        p_room_code:g.roomCode,
        p_guest_token:g.guestToken,
        p_guest_name:g.name,
        p_guest_email:g.email||null,
        p_guest_company:g.company||null
      });
      if(j.error)throw j.error;
      meetingV105Transport='mesh';
      await meetingV103EnterGuestAfterAdmission(j.data,g);
      meetingV10515GuestDraft=null;
      return;
    }

    if(!r.data?.request_id||!r.data?.request_token){
      throw new Error(meet10515L('لم يرجع خادم غرفة الانتظار بيانات طلب صالحة.','Waiting room did not return a valid admission request.'));
    }

    meetingV103WaitingRequest={
      ...r.data,
      roomCode:g.roomCode,
      guestToken:g.guestToken,
      name:g.name,
      email:g.email,
      company:g.company
    };
    meetingV103ShowGuestWaiting();
    meetingV103PollGuestWaiting();
  }catch(err){
    meetingV10515GuestError(err?.message||String(err));
  }finally{
    meetingV10515GuestBusy=false;
  }
}

/* Replace the V105.1.4 guest wrapper with a deterministic flow:
   1) capture guest form before opening prejoin
   2) preview camera/mic
   3) submit waiting-room request from stored values
   4) enter via the already-hardened V103 admission function. */
joinPublicMeetingGuestV102=async function(e){
  e?.preventDefault?.();
  if(meetingRoomV101||meetingV10515GuestBusy)return;
  if(!meetingV10514GuestConfirmed){
    try{
      meetingV10515GuestDraft=meetingV10515CaptureGuestDraft();
      meetingV10514Pending={kind:'guest',roomCode:meetingV10515GuestDraft.roomCode};
      return meetingV10514OpenPrejoin('guest',meetingV10515GuestDraft.roomCode);
    }catch(err){
      return meetingV10515GuestError(err?.message||String(err));
    }
  }
  meetingV10514GuestConfirmed=false;
  return meetingV10515GuestJoinSubmit();
};

meetingV10514ConfirmPrejoin=async function(){
  const p={...meetingV10514Pending};
  meetingV10514StopPreview();
  closeAddModal();
  if(p.kind==='member')return meetingV10514JoinMemberNow(p.roomCode);
  if(p.kind==='guest'){
    meetingV10514GuestConfirmed=true;
    return meetingV10515GuestJoinSubmit();
  }
};

meetingV10514CancelPrejoin=function(){
  meetingV10514StopPreview();
  meetingV10514Pending={kind:null,roomCode:null};
  meetingV10514GuestConfirmed=false;
  /* Keep form values visible, but discard the captured submission. */
  meetingV10515GuestDraft=null;
  closeAddModal();
};

/* Admission must always enter using restored P2P transport. */
const meetingV103EnterGuestAfterAdmissionBaseV10515=meetingV103EnterGuestAfterAdmission;
meetingV103EnterGuestAfterAdmission=async function(data,w){
  meetingV105Transport='mesh';
  await meetingV103EnterGuestAfterAdmissionBaseV10515(data,w);
  meetingV105Transport='mesh';
  /* Force one presence sync after subscription settles, covering mobile timing races. */
  setTimeout(()=>{if(meetingRoomV101&&meetingSubscribedV101)meetingSyncPresenceV101().catch?.(()=>{})},350);
};

/* If the waiting request is cancelled or denied, allow a fresh prejoin attempt. */
const meetingV103CancelGuestWaitBaseV10515=meetingV103CancelGuestWait;
meetingV103CancelGuestWait=function(){
  meetingV103CancelGuestWaitBaseV10515();
  meetingV10515GuestDraft=null;
  meetingV10514GuestConfirmed=false;
};

/* Reset guest submission state when leaving. */
const leaveMeetingRoomBaseV10515=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){
  meetingV10515GuestDraft=null;
  meetingV10515GuestBusy=false;
  meetingV10514GuestConfirmed=false;
  return leaveMeetingRoomBaseV10515(opts);
};


/* --- source script: tasky-v10516-guest-prejoin-layer-js --- */

window.TASKY_BUILD='V105.1.6';console.info('Tasky build',window.TASKY_BUILD);

function meet10516L(ar,en){return lang==='ar'?ar:en}

function meetingV10516SetGuestProgress(text=''){
  let el=document.getElementById('meet10516GuestProgress');
  const form=document.querySelector('.meet102-guest-form');
  if(!el&&form){
    el=document.createElement('div');
    el.id='meet10516GuestProgress';
    el.className='meet10516-guest-progress';
    form.appendChild(el);
  }
  if(el){
    el.textContent=text;
    el.classList.toggle('show',!!text);
  }
}

/* Keep the existing deterministic V105.1.5 guest flow, but make the transition
   visible before opening the prejoin modal. */
const joinPublicMeetingGuestBaseV10516=joinPublicMeetingGuestV102;
joinPublicMeetingGuestV102=async function(e){
  e?.preventDefault?.();

  if(!meetingV10514GuestConfirmed){
    meetingV10516SetGuestProgress(
      meet10516L(
        'جاري فتح إعدادات الكاميرا والمايك…',
        'Opening camera and microphone settings…'
      )
    );
  }

  try{
    return await joinPublicMeetingGuestBaseV10516(e);
  }finally{
    /* If the prejoin modal is now visible, remove the inline transition note.
       If an error occurred, the error dialog is above the guest portal now. */
    setTimeout(()=>meetingV10516SetGuestProgress(''),250);
  }
};

/* When opening the prejoin screen from the guest portal, explicitly mark it as
   a guest modal for predictable full-screen layering on iOS Safari. */
const meetingV10514OpenPrejoinBaseV10516=meetingV10514OpenPrejoin;
meetingV10514OpenPrejoin=async function(kind,roomCode=null){
  const overlay=document.getElementById('addModalOverlay');
  overlay?.classList.toggle('meet10516-guest-prejoin-overlay',kind==='guest');

  try{
    return await meetingV10514OpenPrejoinBaseV10516(kind,roomCode);
  }catch(err){
    overlay?.classList.remove('meet10516-guest-prejoin-overlay');
    throw err;
  }
};

const closeAddModalBaseV10516=closeAddModal;
closeAddModal=function(){
  document.getElementById('addModalOverlay')?.classList.remove('meet10516-guest-prejoin-overlay');
  return closeAddModalBaseV10516();
};


/* --- source script: tasky-v10517-host-leave-lifecycle-js --- */

window.TASKY_BUILD='V105.1.7';console.info('Tasky build',window.TASKY_BUILD);
function meet10517L(ar,en){return lang==='ar'?ar:en}

const leaveMeetingRoomBaseV10517=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){
  const room=meetingRoomV101;
  const organizerLeaving=!!room && !opts?.silent && !meetingGuestSessionV102
    && String(room.created_by)===String(currentUserId) && room.status==='live';

  let originalCreator=null;
  if(organizerLeaving){
    originalCreator=room.created_by;
    room.created_by='__tasky_host_left_without_ending__';
  }

  try{
    const result=await leaveMeetingRoomBaseV10517(opts);
    if(organizerLeaving){
      taskyToast(
        meet10517L(
          'غادرت الاجتماع فقط. سيبقى مباشرًا حتى يتم إنهاؤه أو إلغاؤه صراحةً.',
          'You left the meeting only. It remains live until explicitly ended or cancelled.'
        ),
        {tone:'success'}
      );
    }
    return result;
  }finally{
    if(organizerLeaving && meetingRoomV101===room)room.created_by=originalCreator;
  }
};

meetingV1051Heartbeat=async function(){
  if(!meetingRoomV101||meetingGuestSessionV102||String(meetingRoomV101.created_by)!==String(currentUserId)||meetingRoomV101.status!=='live')return;
  try{await sb.rpc('tasky_meeting_host_heartbeat_v1051',{p_meeting_id:meetingRoomV101.id})}
  catch(e){console.warn('V105.1.7 host heartbeat',e)}
};

meetingSessionCheckV101=async function(){
  if(!meetingRoomV101)return;
  try{
    let data,error;
    if(meetingGuestSessionV102){
      ({data,error}=await sb.rpc('tasky_public_meeting_guest_session_check_v1051',{
        p_guest_session_id:meetingGuestSessionV102.id,
        p_guest_session_token:meetingGuestSessionV102.token
      }));
    }else{
      ({data,error}=await sb.rpc('tasky_meeting_session_check_v1051',{p_meeting_id:meetingRoomV101.id}));
    }
    if(error)throw error;
    if(!data?.authorized){
      const st=data?.status;
      const msg=st==='cancelled'
        ?meet10517L('تم إلغاء الاجتماع','The meeting was cancelled')
        :st==='ended'
          ?meet10517L('انتهى الاجتماع','The meeting ended')
          :meet10517L('انتهت جلسة الاجتماع','The meeting session ended');
      const mid=meetingRoomV101.id;
      if(meetingGuestSessionV102){
        const sess={...meetingGuestSessionV102};
        meetingV1044LastGuestRating={id:sess.id,token:sess.token,meetingId:mid};
        await leaveMeetingRoomV101({silent:true,skipFetch:true});
        renderPublicMeetingGuestExitV1044(msg,mid);
      }else{
        await leaveMeetingRoomV101({silent:true});
        taskyToast(msg,{tone:'warning'});
      }
    }
  }catch(err){console.warn('V105.1.7 session check',err)}
};


/* --- source script: tasky-v10518-waiting-room-ux-js --- */

window.TASKY_BUILD='V105.1.8';console.info('Tasky build',window.TASKY_BUILD);

let meetingV10518WaitStartedAt=0;
let meetingV10518WaitClock=null;
let meetingV10518KnownWait=new Set();
let meetingV10518AlertQueue=[];
let meetingV10518AlertCurrent=null;

function meet10518L(ar,en){return lang==='ar'?ar:en}
function meetingV10518Initials(name){
  const s=String(name||'').trim();if(!s)return'G';
  const parts=s.split(/\s+/).filter(Boolean);
  return (parts.slice(0,2).map(x=>x[0]).join('')||s[0]).toUpperCase();
}
function meetingV10518FormatWait(ms){
  const total=Math.max(0,Math.floor(ms/1000));
  const m=Math.floor(total/60),s=total%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function meetingV10518StartWaitClock(){
  clearInterval(meetingV10518WaitClock);
  meetingV10518WaitStartedAt=Date.now();
  const tick=()=>{
    const el=document.getElementById('meet10518Elapsed');
    if(el)el.textContent=meetingV10518FormatWait(Date.now()-meetingV10518WaitStartedAt);
  };
  tick();meetingV10518WaitClock=setInterval(tick,1000);
}
function meetingV10518StopWaitClock(){
  clearInterval(meetingV10518WaitClock);meetingV10518WaitClock=null;meetingV10518WaitStartedAt=0;
}

/* Premium guest lobby. */
meetingV103ShowGuestWaiting=function(){
  let d=document.getElementById('meet103GuestWaiting');
  if(!d){
    d=document.createElement('div');
    d.id='meet103GuestWaiting';
    d.className='meet103-wait-screen';
    document.body.appendChild(d);
  }
  const p=meetingGuestPublicV102,info=p?.info||{},w=meetingV103WaitingRequest||meetingV10515GuestDraft||{};
  const name=w.name||meet10518L('ضيف','Guest');
  const title=info.title||meet10518L('اجتماع تاسكي','Tasky meeting');
  d.innerHTML=`<div class="meet10518-lobby">
    <div class="meet10518-lobby-head">
      <div class="meet10518-brand"><div class="meet10518-mark">✓</div><div><h2>${escapeHtml(title)}</h2><p>${meet10518L('تاسكي — غرفة انتظار آمنة','Tasky — secure waiting room')}</p></div></div>
      <span class="meet10518-status"><i></i>${meet10518L('بانتظار اعتماد المنظم','Awaiting organizer approval')}</span>
    </div>
    <div class="meet10518-lobby-body">
      <div class="meet10518-lobby-main">
        <div class="meet10518-spinner"></div>
        <h3>${meet10518L(`أهلًا ${name}` ,`Welcome, ${name}`)}</h3>
        <p>${meet10518L('تم إرسال طلب دخولك إلى منظّم الاجتماع. لا تحتاج لتحديث الصفحة؛ سينقلك تاسكي تلقائيًا إلى الاجتماع فور الموافقة.','Your admission request has been sent to the organizer. No refresh is needed; Tasky will enter the meeting automatically as soon as you are admitted.')}</p>
      </div>
      <div class="meet10518-wait-details">
        <div><span>${meet10518L('حالة الطلب','Request status')}</span><b>${meet10518L('بانتظار الاعتماد','Waiting for approval')}</b></div>
        <div><span>${meet10518L('وقت الانتظار','Waiting time')}</span><b id="meet10518Elapsed" class="meet10518-elapsed">00:00</b></div>
        <div><span>${meet10518L('الاسم الظاهر','Display name')}</span><b>${escapeHtml(name)}</b></div>
        <div><span>${meet10518L('الدخول','Access')}</span><b>${meet10518L('ضيف بدون حساب','No-account guest')}</b></div>
      </div>
      <div class="meet10518-wait-note"><span>ℹ️</span><span>${meet10518L('يمكنك إبقاء هذه الصفحة مفتوحة. إذا رفض المنظم الطلب أو انتهى الاجتماع سيظهر لك ذلك هنا مباشرة.','Keep this page open. If the organizer declines the request or the meeting ends, Tasky will show that here immediately.')}</span></div>
      <div class="meet10518-lobby-actions"><button class="chip-btn" onclick="meetingV103CancelGuestWait()">${meet10518L('إلغاء طلب الدخول','Cancel request')}</button></div>
    </div>
  </div>`;
  meetingV10518StartWaitClock();
};

/* Stop clock on cancel/entry. */
const meetingV103CancelGuestWaitBaseV10518=meetingV103CancelGuestWait;
meetingV103CancelGuestWait=function(){
  meetingV10518StopWaitClock();
  return meetingV103CancelGuestWaitBaseV10518();
};
const meetingV103EnterGuestAfterAdmissionBaseV10518=meetingV103EnterGuestAfterAdmission;
meetingV103EnterGuestAfterAdmission=async function(data,w){
  meetingV10518StopWaitClock();
  return meetingV103EnterGuestAfterAdmissionBaseV10518(data,w);
};

/* Faster guest status polling: admission feels immediate but still bounded. */
meetingV103PollGuestWaiting=async function(){
  clearInterval(meetingV103GuestWaitTimer);
  const run=async()=>{
    const w=meetingV103WaitingRequest;if(!w)return;
    try{
      const r=await sb.rpc('tasky_public_meeting_waiting_status_v103',{
        p_request_id:w.request_id,p_request_token:w.request_token
      });
      if(r.error)throw r.error;
      if(r.data?.status==='denied'){
        clearInterval(meetingV103GuestWaitTimer);meetingV10518StopWaitClock();
        meetingV103WaitingRequest=null;document.getElementById('meet103GuestWaiting')?.remove();
        return showTaskyDialog({
          title:meet10518L('لم تتم الموافقة على الدخول','Admission was not approved'),
          message:meet10518L('رفض منظّم الاجتماع طلب الدخول. يمكنك العودة إلى صفحة الاجتماع والمحاولة لاحقًا إذا كان الرابط ما زال صالحًا.','The organizer declined your request. You can return to the meeting page and try again later if the link is still valid.'),
          tone:'warning'
        });
      }
      if(r.data?.status==='admitted'){
        clearInterval(meetingV103GuestWaitTimer);meetingV10518StopWaitClock();
        const j=await sb.rpc('tasky_public_meeting_waiting_join_v103',{
          p_request_id:w.request_id,p_request_token:w.request_token,
          p_room_code:w.roomCode,p_guest_token:w.guestToken
        });
        if(j.error)throw j.error;
        document.getElementById('meet103GuestWaiting')?.remove();
        meetingV103WaitingRequest=null;
        await meetingV103EnterGuestAfterAdmission(j.data,w);
      }
    }catch(e){console.warn('V105.1.8 guest wait',e)}
  };
  await run();
  meetingV103GuestWaitTimer=setInterval(run,1000);
};

/* Give the organizer waiting button a stable id for visual urgency. */
const meetingEnhanceRoomBaseV10518=meetingEnhanceRoomV103;
meetingEnhanceRoomV103=function(){
  meetingEnhanceRoomBaseV10518();
  const tools=document.getElementById('meet103Tools');if(!tools)return;
  const badge=document.getElementById('meet103WaitingBadge');
  const btn=badge?.closest('button');
  if(btn&&!btn.id)btn.id='meet103WaitingBtn';
};

/* ---------- Organizer quick alert ---------- */
function meetingV10518EnsureAlert(){
  let a=document.getElementById('meet10518WaitingAlert');
  if(!a){
    a=document.createElement('div');a.id='meet10518WaitingAlert';
    document.body.appendChild(a);
  }
  return a;
}
function meetingV10518RenderAlert(){
  const a=meetingV10518EnsureAlert();
  if(!meetingV10518AlertCurrent){
    meetingV10518AlertCurrent=meetingV10518AlertQueue.shift()||null;
  }
  const w=meetingV10518AlertCurrent;
  if(!w){a.classList.remove('show');a.innerHTML='';return}
  const all=Array.isArray(meetingV103Waiting)?meetingV103Waiting:[];
  const suffix=all.length>1?` · +${all.length-1}`:'';
  a.innerHTML=`<div class="meet10518-alert-head"><b>⏳ ${meet10518L('طلب دخول جديد','New admission request')}</b><span>${all.length}</span></div>
  <div class="meet10518-alert-body">
    <div class="meet10518-alert-person">
      <div class="meet10518-alert-avatar">${escapeHtml(meetingV10518Initials(w.display_name))}</div>
      <div><h4>${escapeHtml(w.display_name||meet10518L('ضيف','Guest'))}${escapeHtml(suffix)}</h4><p>${escapeHtml(w.guest_company||'')}${w.guest_email?`${w.guest_company?' · ':''}${escapeHtml(w.guest_email)}`:''}</p></div>
    </div>
    <div class="meet10518-alert-actions">
      <button class="meet10518-admit" onclick="meetingV10518QuickDecision('${w.id}','admitted')">${meet10518L('قبول ودخول','Admit')}</button>
      <button class="meet10518-deny" onclick="meetingV10518QuickDecision('${w.id}','denied')">${meet10518L('رفض','Deny')}</button>
    </div>
  </div>
  <button class="meet10518-openwaiting" onclick="meetingV10518OpenWaitingDrawer()">${meet10518L('فتح غرفة الانتظار وإدارة جميع الطلبات','Open waiting room and manage all requests')}</button>`;
  a.classList.add('show');
}
function meetingV10518OpenWaitingDrawer(){
  meetingV10518AlertCurrent=null;meetingV10518AlertQueue=[];
  document.getElementById('meet10518WaitingAlert')?.classList.remove('show');
  meetingOpenDrawerV103('waiting');
}
async function meetingV10518QuickDecision(id,status){
  const a=document.getElementById('meet10518WaitingAlert');
  a?.classList.remove('show');
  const {error}=await sb.rpc('tasky_meeting_waiting_decide_v103',{p_request_id:id,p_decision:status});
  if(error){
    showTaskyDialog({title:meet10518L('تعذّر تحديث غرفة الانتظار','Could not update waiting room'),message:error.message,tone:'error'});
  }else{
    taskyToast(status==='admitted'?meet10518L('تم قبول الضيف','Guest admitted'):meet10518L('تم رفض طلب الدخول','Admission declined'),{tone:status==='admitted'?'success':'warning'});
  }
  meetingV10518AlertCurrent=null;
  await meetingV103FetchWaiting(true);
  meetingV10518RenderAlert();
}

/* Near-immediate organizer polling + alert only for genuinely new request IDs. */
const meetingV103FetchWaitingBaseV10518=meetingV103FetchWaiting;
meetingV103FetchWaiting=async function(render=true){
  const before=new Set(meetingV10518KnownWait);
  await meetingV103FetchWaitingBaseV10518(render);
  const now=Array.isArray(meetingV103Waiting)?meetingV103Waiting:[];
  const currentIds=new Set(now.map(w=>String(w.id)));
  const added=now.filter(w=>!before.has(String(w.id)));

  meetingV10518KnownWait=currentIds;

  const btn=document.getElementById('meet103WaitingBtn');
  btn?.classList.toggle('has-waiting',now.length>0);

  if(added.length){
    for(const w of added){
      if(!meetingV10518AlertQueue.some(x=>String(x.id)===String(w.id)) &&
         String(meetingV10518AlertCurrent?.id||'')!==String(w.id)){
        meetingV10518AlertQueue.push(w);
      }
    }
    meetingV10518RenderAlert();
  }

  if(!now.length){
    meetingV10518AlertQueue=[];
    meetingV10518AlertCurrent=null;
    document.getElementById('meet10518WaitingAlert')?.classList.remove('show');
  }
};

/* Increase organizer waiting-room responsiveness from 2s to 1s. */
const meetingV103StartPollingBaseV10518=meetingV103StartPolling;
meetingV103StartPolling=function(){
  if(!meetingV103ChatTimer)meetingV103ChatTimer=setInterval(()=>meetingV103FetchChat(false),2500);
  if(meetingRoomV101?.can_manage&&!meetingV103WaitingTimer){
    meetingV103WaitingTimer=setInterval(()=>meetingV103FetchWaiting(false),1000);
  }
  meetingV103FetchChat(false);
  if(meetingRoomV101?.can_manage)meetingV103FetchWaiting(false);
};

/* Clean alert state between meetings. */
const meetingV103StopPollingBaseV10518=meetingV103StopPolling;
meetingV103StopPolling=function(){
  meetingV103StopPollingBaseV10518();
  meetingV10518KnownWait.clear();
  meetingV10518AlertQueue=[];
  meetingV10518AlertCurrent=null;
  document.getElementById('meet10518WaitingAlert')?.remove();
  meetingV10518StopWaitClock();
};


/* --- source script: tasky-v106-productivity-js --- */

window.TASKY_BUILD='V106';console.info('Tasky build',window.TASKY_BUILD);

function tasky106L(ar,en){return lang==='ar'?ar:en}

/* ============================================================
   1) Remember me / password-manager integration
   Password is NEVER stored in localStorage. We let the browser/OS password
   manager store it through the Credential Management API when available.
   Supabase session persistence remains the signed-in session layer.
   ============================================================ */
const TASKY_REMEMBER_KEY_V106='tasky_remember_login_v106';
const TASKY_REMEMBER_EMAIL_V106='tasky_remember_email_v106';

function tasky106InstallRememberUi(){
  const pwd=document.getElementById('authPassword');
  const email=document.getElementById('authEmail');
  if(!pwd||!email||document.getElementById('taskyRememberV106'))return;

  email.setAttribute('autocomplete','username email');
  pwd.setAttribute('autocomplete','current-password');

  const wrap=document.createElement('label');
  wrap.id='taskyRememberV106';wrap.className='tasky-v106-remember';
  wrap.innerHTML=`<input id="taskyRememberCheckV106" type="checkbox"><span><b>${tasky106L('تذكرني','Remember me')}</b><small>${tasky106L('يحفظ المتصفح بيانات الدخول في مدير كلمات المرور الآمن عند دعمه. تاسكي لا يخزن كلمة المرور كنص داخل المتصفح.','Your browser can securely save credentials in its password manager when supported. Tasky never stores the password as plain text.')}</small></span>`;
  pwd.insertAdjacentElement('afterend',wrap);

  const remembered=localStorage.getItem(TASKY_REMEMBER_KEY_V106)==='1';
  document.getElementById('taskyRememberCheckV106').checked=remembered;
  if(remembered){
    const savedEmail=localStorage.getItem(TASKY_REMEMBER_EMAIL_V106)||'';
    if(savedEmail&&!email.value)email.value=savedEmail;
    tasky106TryPasswordManagerFill();
  }
}
async function tasky106TryPasswordManagerFill(){
  if(!('credentials' in navigator)||typeof window.PasswordCredential==='undefined')return;
  try{
    const c=await navigator.credentials.get({password:true,mediation:'optional'});
    if(c?.type==='password'){
      const email=document.getElementById('authEmail'),pwd=document.getElementById('authPassword');
      if(email&&!email.value)email.value=c.id||'';
      if(pwd&&!pwd.value)pwd.value=c.password||'';
    }
  }catch(_){}
}
async function tasky106RememberAfterLogin(email,password){
  const checked=!!document.getElementById('taskyRememberCheckV106')?.checked;
  if(!checked){
    localStorage.removeItem(TASKY_REMEMBER_KEY_V106);
    localStorage.removeItem(TASKY_REMEMBER_EMAIL_V106);
    return;
  }
  localStorage.setItem(TASKY_REMEMBER_KEY_V106,'1');
  localStorage.setItem(TASKY_REMEMBER_EMAIL_V106,email||'');
  if('credentials' in navigator&&typeof window.PasswordCredential!=='undefined'){
    try{
      const cred=new PasswordCredential({id:email,password,name:email});
      await navigator.credentials.store(cred);
    }catch(e){console.warn('Tasky V106 password manager',e)}
  }
}
setTimeout(tasky106InstallRememberUi,0);

/* Wrap the latest auth flow so successful sign-in can hand credentials to the
   browser's password manager without changing the Supabase auth contract. */
const handleAuthSubmitBaseV106=handleAuthSubmit;
handleAuthSubmit=async function(){
  const email=document.getElementById('authEmail')?.value.trim()||'';
  const password=document.getElementById('authPassword')?.value||'';
  const mode=authMode;
  await handleAuthSubmitBaseV106();
  if(mode==='signin'){
    try{
      const {data}=await sb.auth.getSession();
      if(data?.session?.user)await tasky106RememberAfterLogin(email,password);
    }catch(_){}
  }
};

/* ============================================================
   2) Onboarding celebration only for a company that completes setup
   during its first onboarding flow — not every login to an old workspace.
   ============================================================ */
const fetchOnboardingStateBaseV106=fetchOnboardingStateV68;
fetchOnboardingStateV68=async function(opts={}){
  const hadState=!!onboardingStateV68;
  const wasComplete=!!onboardingStateV68?.complete;
  const result=await fetchOnboardingStateBaseV106(opts);

  /* The base V68 may show the old toast. Its guard is neutralized below for
     subsequent fetches; first fetch of an already-complete workspace should
     never be celebrated. */
  if(!hadState&&result?.complete){
    onboardingCompletedCelebratedV68=true;
  }else if(hadState&&!wasComplete&&result?.complete){
    const k=`tasky_company_ready_celebrated_v106_${currentWorkspaceId}`;
    if(localStorage.getItem(k)!=='1'){
      localStorage.setItem(k,'1');
      taskyToast(tasky106L('🎉 شركتك أو فريقك جاهز للعمل على تاسكي','🎉 Your company or team is ready to work in Tasky'),{tone:'success'});
    }
    onboardingCompletedCelebratedV68=true;
  }
  return result;
};
/* Prevent old V68 from celebrating on first load by pre-marking only during
   the first authoritative onboarding fetch. */
const loadWorkspaceAndDataBaseV106=loadWorkspaceAndData;
loadWorkspaceAndData=async function(...args){
  const first=!currentWorkspaceId;
  if(first)onboardingCompletedCelebratedV68=true;
  const ok=await loadWorkspaceAndDataBaseV106(...args);
  if(ok&&onboardingStateV68&&!onboardingStateV68.complete)onboardingCompletedCelebratedV68=false;
  return ok;
};

/* ============================================================
   3) Project close / reopen / delete
   ============================================================ */
let taskyClosedProjectsV106=[];

async function tasky106FetchClosedProjects(){
  if(!currentWorkspaceId)return[];
  const {data,error}=await sb.rpc('tasky_project_closed_list_v106',{p_workspace_id:currentWorkspaceId});
  if(error)throw error;
  taskyClosedProjectsV106=Array.isArray(data)?data:[];
  return taskyClosedProjectsV106;
}
async function tasky106CloseProject(projectId){
  const p=projects.find(x=>x.id===projectId);if(!p)return;
  const ok=await taskyConfirm(
    tasky106L(`إغلاق مشروع "${p.name}"؟ سيختفي من قائمة المشاريع النشطة وتبقى بياناته محفوظة.`,`Close project "${p.name}"? It will leave the active list while its history remains preserved.`),
    {title:tasky106L('إغلاق المشروع','Close project'),confirmText:tasky106L('إغلاق','Close')}
  );
  if(!ok)return;
  const {error}=await sb.rpc('tasky_project_close_v106',{p_project_id:projectId});
  if(error)return showTaskyDialog({title:tasky106L('تعذّر إغلاق المشروع','Could not close project'),message:error.message,tone:'error'});
  closeAddModal();await Promise.all([fetchProjects(),fetchTasks(),fetchProjectMemberships()]);
  renderNav();renderAll();taskyToast(tasky106L('تم إغلاق المشروع','Project closed'),{tone:'success'});
}
async function tasky106DeleteProject(projectId){
  const p=projects.find(x=>x.id===projectId)||taskyClosedProjectsV106.find(x=>x.id===projectId);
  const ok=await taskyConfirm(
    tasky106L(`حذف مشروع "${p?.name||''}" نهائيًا؟ الحذف مسموح فقط للمشروع بدون مهام أو سجلات مرتبطة. للمشاريع المستخدمة استخدم الإغلاق.`,`Permanently delete "${p?.name||''}"? Deletion is allowed only when the project has no tasks or linked history. Close used projects instead.`),
    {title:tasky106L('حذف المشروع نهائيًا','Permanently delete project'),tone:'danger',confirmText:tasky106L('حذف نهائي','Delete')}
  );
  if(!ok)return;
  const {error}=await sb.rpc('tasky_project_delete_v106',{p_project_id:projectId});
  if(error)return showTaskyDialog({title:tasky106L('تعذّر حذف المشروع','Could not delete project'),message:error.message,tone:'error'});
  closeAddModal();await Promise.all([fetchProjects(),fetchTasks(),fetchProjectMemberships()]);
  renderNav();renderAll();taskyToast(tasky106L('تم حذف المشروع','Project deleted'),{tone:'success'});
}
async function tasky106ReopenProject(projectId){
  const {error}=await sb.rpc('tasky_project_reopen_v106',{p_project_id:projectId});
  if(error)return showTaskyDialog({title:tasky106L('تعذّر إعادة فتح المشروع','Could not reopen project'),message:error.message,tone:'error'});
  await fetchProjects();await tasky106FetchClosedProjects();renderNav();tasky106OpenClosedProjects();
  taskyToast(tasky106L('تمت إعادة فتح المشروع','Project reopened'),{tone:'success'});
}
async function tasky106OpenClosedProjects(){
  try{await tasky106FetchClosedProjects()}catch(e){return showTaskyDialog({title:tasky106L('تعذّر تحميل المشاريع المغلقة','Could not load closed projects'),message:e.message,tone:'error'})}
  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${tasky106L('المشاريع المغلقة','Closed projects')}</h3><div class="subtle">${tasky106L('المشاريع المغلقة لا تظهر في الشريط الجانبي ويمكن إعادتها متى احتجت.','Closed projects stay out of the sidebar and can be reopened when needed.')}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
  <div class="tasky-v106-closed-list">${taskyClosedProjectsV106.length?taskyClosedProjectsV106.map(p=>`<div class="tasky-v106-closed-row"><div><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.description||tasky106L('بدون وصف','No description'))}</small></div><div class="tasky-v106-row-actions"><button class="chip-btn" onclick="tasky106ReopenProject('${p.id}')">${tasky106L('إعادة فتح','Reopen')}</button>${currentUserRole==='admin'?`<button class="chip-btn" style="color:var(--danger)" onclick="tasky106DeleteProject('${p.id}')">${tasky106L('حذف','Delete')}</button>`:''}</div></div>`).join(''):`<div class="meet101-empty">${tasky106L('لا توجد مشاريع مغلقة.','No closed projects.')}</div>`}</div>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
}
const renderNavBaseV106=renderNav;
renderNav=function(){
  renderNavBaseV106();
  const head=document.querySelector('.projects-inline-head');
  if(head&&!document.getElementById('taskyClosedProjectsBtnV106')){
    const b=document.createElement('button');b.id='taskyClosedProjectsBtnV106';b.type='button';b.className='tasky-v106-closed-btn';
    b.textContent=tasky106L('المغلقة','Closed');b.onclick=tasky106OpenClosedProjects;
    head.insertBefore(b,head.querySelector('.projects-inline-plus'));
  }
};
const projectAccessModalHtmlBaseV106=projectAccessModalHtml;
projectAccessModalHtml=function(projectId){
  let h=projectAccessModalHtmlBaseV106(projectId);
  const p=projects.find(x=>x.id===projectId);
  if(!p||!canManageProjectClient(projectId))return h;
  const lifecycle=`<div class="tasky-v106-project-actions"><button class="chip-btn" onclick="tasky106CloseProject('${projectId}')">${tasky106L('إغلاق المشروع','Close project')}</button>${currentUserRole==='admin'?`<button class="chip-btn" style="color:var(--danger)" onclick="tasky106DeleteProject('${projectId}')">${tasky106L('حذف نهائي','Delete permanently')}</button>`:''}</div>`;
  return h.replace(/<\/div>\s*$/i,lifecycle+'</div>');
};

/* ============================================================
   4) Brainstorm room for Meetings
   ============================================================ */
let brain106MeetingId=null;
let brain106Rows=[];
let brain106Timer=null;

function brain106EnsureDom(){
  let el=document.getElementById('taskyV106Brainstorm');
  if(!el){el=document.createElement('div');el.id='taskyV106Brainstorm';document.body.appendChild(el)}
  return el;
}
function brain106Args(){
  return {
    p_meeting_id:brain106MeetingId,
    p_guest_session_id:meetingGuestSessionV102?.id||null,
    p_guest_session_token:meetingGuestSessionV102?.token||null
  };
}
async function brain106Fetch(render=true){
  if(!brain106MeetingId)return;
  const {data,error}=await sb.rpc('tasky_meeting_brainstorm_list_v106',brain106Args());
  if(error){console.warn('V106 brainstorm',error);return}
  brain106Rows=Array.isArray(data)?data:[];
  if(render)brain106Render();
}
function brain106CategoryLabel(c){
  return ({idea:tasky106L('أفكار','Ideas'),opportunity:tasky106L('فرص','Opportunities'),challenge:tasky106L('تحديات','Challenges'),decision:tasky106L('قرارات','Decisions')})[c]||c;
}
function brain106Render(){
  const el=brain106EnsureDom();
  if(!brain106MeetingId){el.classList.remove('show');return}
  const m=meetingsV101.find(x=>x.id===brain106MeetingId)||meetingRoomV101||{};
  const active=['live','scheduled'].includes(m.status||meetingRoomV101?.status);
  const cats=['idea','opportunity','challenge','decision'];
  el.innerHTML=`<div class="brain106-head"><div><h2>💡 ${tasky106L('غرفة العصف الذهني','Brainstorm Room')} — ${escapeHtml(m.title||'')}</h2><p>${tasky106L('اجمع الأفكار والفرص والتحديات والقرارات في لوحة واحدة مرتبطة بالاجتماع.','Capture ideas, opportunities, challenges and decisions on one board linked to the meeting.')}</p></div><div class="brain106-head-actions"><button onclick="brain106Close()">× ${tasky106L('إغلاق','Close')}</button></div></div>
  ${active?`<div class="brain106-compose"><select id="brain106Category">${cats.map(c=>`<option value="${c}">${brain106CategoryLabel(c)}</option>`).join('')}</select><input id="brain106Text" maxlength="1000" placeholder="${tasky106L('اكتب فكرة قصيرة…','Write a short idea…')}" onkeydown="if(event.key==='Enter')brain106Add()"><button onclick="brain106Add()">+ ${tasky106L('إضافة','Add')}</button></div>`:''}
  <div class="brain106-board">${cats.map(c=>{const rows=brain106Rows.filter(x=>x.category===c);return`<section class="brain106-col"><div class="brain106-col-head"><h3>${brain106CategoryLabel(c)}</h3><span>${rows.length}</span></div>${rows.length?rows.map(n=>`<article class="brain106-note ${c}"><p>${escapeHtml(n.body)}</p><div class="brain106-note-meta"><span>${escapeHtml(n.author_name||tasky106L('مشارك','Participant'))}</span><div class="brain106-note-actions"><button onclick="brain106Vote('${n.id}')">${n.my_vote?'♥':'♡'} ${Number(n.vote_count||0)}</button>${n.can_delete?`<button onclick="brain106Delete('${n.id}')">×</button>`:''}</div></div></article>`).join(''):`<div class="brain106-empty">${tasky106L('لا توجد بطاقات بعد','No cards yet')}</div>`}</section>`}).join('')}</div>`;
  el.classList.add('show');
}
async function brain106Open(meetingId){
  brain106MeetingId=meetingId||meetingRoomV101?.id;if(!brain106MeetingId)return;
  await brain106Fetch(false);brain106Render();
  clearInterval(brain106Timer);brain106Timer=setInterval(()=>brain106Fetch(true),2000);
}
function brain106Close(){clearInterval(brain106Timer);brain106Timer=null;brain106MeetingId=null;brain106Rows=[];brain106EnsureDom().classList.remove('show')}
async function brain106Add(){
  const body=document.getElementById('brain106Text')?.value.trim()||'',category=document.getElementById('brain106Category')?.value||'idea';
  if(!body)return;
  const {error}=await sb.rpc('tasky_meeting_brainstorm_add_v106',{...brain106Args(),p_category:category,p_body:body});
  if(error)return showTaskyDialog({title:tasky106L('تعذّرت إضافة الفكرة','Could not add idea'),message:error.message,tone:'error'});
  document.getElementById('brain106Text').value='';await brain106Fetch();
}
async function brain106Vote(id){
  const {error}=await sb.rpc('tasky_meeting_brainstorm_vote_v106',{...brain106Args(),p_note_id:id});
  if(error)return taskyToast(error.message,{tone:'warning'});await brain106Fetch();
}
async function brain106Delete(id){
  const ok=await taskyConfirm(tasky106L('حذف هذه البطاقة؟','Delete this card?'),{title:tasky106L('حذف بطاقة','Delete card'),tone:'danger',confirmText:tasky106L('حذف','Delete')});if(!ok)return;
  const {error}=await sb.rpc('tasky_meeting_brainstorm_delete_v106',{...brain106Args(),p_note_id:id});
  if(error)return showTaskyDialog({title:tasky106L('تعذّر الحذف','Could not delete'),message:error.message,tone:'error'});await brain106Fetch();
}

/* Add Brainstorm entry to every meeting card. */
const meetingCardBaseV106=meetingCardV101;
meetingCardV101=function(m,past=false){
  let h=meetingCardBaseV106(m,past);
  const b=`<button class="chip-btn" onclick="brain106Open('${m.id}')">💡 ${tasky106L('عصف ذهني','Brainstorm')}</button>`;
  return h.replace(/<\/div><\/article>\s*$/i,b+'</div></article>');
};

/* Add Brainstorm to live room toolbar for members and guests. */
const meetingV1045PatchToolbarBaseV106=meetingV1045PatchToolbar;
meetingV1045PatchToolbar=function(){
  meetingV1045PatchToolbarBaseV106();
  const tools=document.getElementById('meet103Tools');if(!tools||!meetingRoomV101)return;
  if(!document.getElementById('brain106ToolbarBtn')){
    const b=document.createElement('button');b.id='brain106ToolbarBtn';b.type='button';b.className='meet103-pill';
    b.onclick=()=>brain106Open(meetingRoomV101.id);b.innerHTML=`💡 <span>${tasky106L('عصف ذهني','Brainstorm')}</span>`;
    tools.appendChild(b);
  }
};
const leaveMeetingRoomBaseV106=leaveMeetingRoomV101;
leaveMeetingRoomV101=async function(opts={}){if(brain106MeetingId)brain106Close();return leaveMeetingRoomBaseV106(opts)};

setTimeout(()=>{tasky106InstallRememberUi();try{renderNav()}catch(_){}},80);


/* --- source script: tasky-v1061-camera-reenable-js --- */

window.TASKY_BUILD='V106.1';console.info('Tasky build',window.TASKY_BUILD);

function tasky1061L(ar,en){return lang==='ar'?ar:en}

/* Re-acquire a camera track on demand when the participant entered with camera
   disabled. The earlier toggle logic could only enable/disable an existing
   track, so a participant who joined without creating a camera track had
   nothing to re-enable later. */
async function tasky1061AcquireCameraTrack(){
  if(!navigator.mediaDevices?.getUserMedia){
    throw new Error(tasky1061L('المتصفح لا يدعم تشغيل الكاميرا.','This browser does not support camera access.'));
  }

  const stream=await navigator.mediaDevices.getUserMedia({
    audio:false,
    video:typeof meetingV10514VideoConstraints==='function'
      ?meetingV10514VideoConstraints()
      :{facingMode:{ideal:'user'},width:{ideal:1280},height:{ideal:720}}
  });

  const track=stream.getVideoTracks()[0];
  if(!track)throw new Error(tasky1061L('لم يتم العثور على كاميرا متاحة.','No available camera was found.'));

  /* Keep only the track we are adopting. */
  for(const t of stream.getTracks()){
    if(t!==track){try{t.stop()}catch(_){}}
  }

  track.enabled=true;
  track.onended=()=>{
    if(meetingCameraTrackV101===track){
      meetingCameraTrackV101=null;
      meetingLocalStateV101.camera=false;
      try{meetingRenderRoomV101()}catch(_){}
      try{meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*')}catch(_){}
    }
  };

  meetingCameraTrackV101=track;

  if(!meetingLocalStreamV101)meetingLocalStreamV101=new MediaStream();
  /* Remove any stale ended video tracks before adding the new camera. */
  for(const old of meetingLocalStreamV101.getVideoTracks()){
    if(old!==track){
      try{meetingLocalStreamV101.removeTrack(old)}catch(_){}
      try{old.stop()}catch(_){}
    }
  }
  meetingLocalStreamV101.addTrack(track);

  return track;
}

async function tasky1061PublishCameraTrack(track){
  if(!track)return;

  if(meetingV105Transport==='sfu'&&meetingV105SfuRoom&&window.LivekitClient){
    try{
      await meetingV105SfuRoom.localParticipant.publishTrack(track,{
        source:window.LivekitClient.Track.Source.Camera,
        simulcast:true
      });
      return;
    }catch(e){
      console.warn('V106.1 SFU camera publish fallback',e);
    }
  }

  /* P2P: replace video sender track when one exists. If a peer connection was
     created while camera was off, addTrack creates a sender and renegotiate. */
  for(const [peerId,pc] of meetingPeersV101.entries()){
    if(!pc||pc.connectionState==='closed')continue;
    try{
      let sender=pc.getSenders().find(s=>s.track?.kind==='video');
      if(sender){
        await sender.replaceTrack(track);
      }else{
        pc.addTrack(track,meetingLocalStreamV101);
        if(pc.signalingState==='stable'){
          const offer=await pc.createOffer();
          await pc.setLocalDescription(offer);
          await meetingBroadcastSignalV101('offer',{sdp:pc.localDescription},peerId);
        }
      }
    }catch(e){
      console.warn('V106.1 camera publish peer',peerId,e);
    }
  }
}

async function tasky1061UnpublishCameraTrack(track){
  if(!track)return;

  if(meetingV105Transport==='sfu'&&meetingV105SfuRoom&&window.LivekitClient){
    try{
      const pub=meetingV105SfuRoom.localParticipant.getTrackPublication(window.LivekitClient.Track.Source.Camera);
      if(pub?.track){
        await meetingV105SfuRoom.localParticipant.unpublishTrack(pub.track);
      }
    }catch(e){console.warn('V106.1 SFU camera unpublish',e)}
  }

  for(const pc of meetingPeersV101.values()){
    try{
      const sender=pc.getSenders().find(s=>s.track===track||s.track?.kind==='video');
      if(sender)await sender.replaceTrack(null);
    }catch(_){}
  }
}

/* Full replacement of camera toggle:
   - camera ON with existing live track -> disable/remove as before
   - camera OFF because no track ever existed -> request permission now, add a
     new track, and publish it to all existing peers
   - if permission was previously denied, the browser will ask again only when
     platform policy allows; otherwise Tasky gives a clear permission message. */
toggleMeetingCameraV101=async function(){
  if(!meetingRoomV101)return;

  const current=meetingCameraTrackV101;
  const liveCurrent=current&&current.readyState==='live';

  if(meetingLocalStateV101.camera&&liveCurrent){
    meetingLocalStateV101.camera=false;
    current.enabled=false;
    await tasky1061UnpublishCameraTrack(current);

    try{meetingLocalStreamV101?.removeTrack(current)}catch(_){}
    try{current.stop()}catch(_){}
    if(meetingCameraTrackV101===current)meetingCameraTrackV101=null;

    meetingRenderRoomV101();
    await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*');
    return;
  }

  try{
    const track=await tasky1061AcquireCameraTrack();
    meetingLocalStateV101.camera=true;
    await tasky1061PublishCameraTrack(track);
    meetingRenderRoomV101();
    await meetingBroadcastSignalV101('media-state',{state:meetingLocalStateV101},'*');
    taskyToast(tasky1061L('تم تشغيل الكاميرا','Camera enabled'),{tone:'success'});
  }catch(err){
    meetingLocalStateV101.camera=false;
    meetingRenderRoomV101();

    const denied=err?.name==='NotAllowedError'||err?.name==='PermissionDeniedError';
    showTaskyDialog({
      title:tasky1061L('تعذّر تشغيل الكاميرا','Could not enable camera'),
      message:denied
        ?tasky1061L(
          'إذن الكاميرا مرفوض لهذا الموقع. اسمح لتاسكي باستخدام الكاميرا من إعدادات المتصفح/الموقع ثم اضغط زر الكاميرا مرة أخرى.',
          'Camera permission is blocked for this site. Allow camera access in the browser/site settings, then press the camera button again.'
        )
        :(err?.message||String(err)),
      tone:'warning'
    });
  }
};

/* Make local toolbar state accurately reflect that no camera track exists. */
const meetingRenderRoomBaseV1061=meetingRenderRoomV101;
meetingRenderRoomV101=function(){
  if(meetingCameraTrackV101?.readyState==='ended'){
    meetingCameraTrackV101=null;
    meetingLocalStateV101.camera=false;
  }
  return meetingRenderRoomBaseV1061();
};


/* --- source script: tasky-v1062-productivity-visibility-js --- */

window.TASKY_BUILD='V106.2';console.info('Tasky build',window.TASKY_BUILD);

function tasky1062L(ar,en){return lang==='ar'?ar:en}

/* ---------- Project controls: no more hidden lifecycle action ---------- */
function tasky1062OpenProjectMenu(projectId){
  const p=projects.find(x=>x.id===projectId);if(!p)return;
  const canManage=canManageProjectClient(projectId);
  if(!canManage)return taskyToast(tasky1062L('لا تملك صلاحية إدارة هذا المشروع','You do not have permission to manage this project'),{tone:'warning'});

  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${tasky1062L('إدارة المشروع','Project management')}</h3><div class="subtle">${tasky1062L('أغلق المشروع لإزالته من القائمة مع الاحتفاظ بالتاريخ، أو احذفه نهائيًا إذا كان فارغًا ولا توجد سجلات مرتبطة.','Close the project to remove it from the active list while preserving history, or permanently delete it only if it is empty and has no linked records.')}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
  <div class="tasky1062-project-menu-sheet">
    <div class="tasky1062-project-summary"><b>${escapeHtml(p.name)}</b><span>${escapeHtml(p.description||tasky1062L('بدون وصف','No description'))}</span></div>
    <div class="tasky1062-project-menu-actions">
      <button class="chip-btn close-project" onclick="tasky106CloseProject('${p.id}')">📁 ${tasky1062L('إغلاق المشروع','Close project')}</button>
      ${currentUserRole==='admin'?`<button class="chip-btn delete-project" onclick="tasky106DeleteProject('${p.id}')">🗑 ${tasky1062L('حذف نهائي','Delete permanently')}</button>`:''}
    </div>
    <button class="chip-btn" onclick="closeAddModal();openProjectAccessModal('${p.id}')">🔐 ${tasky1062L('صلاحيات المشروع','Project permissions')}</button>
  </div>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
}

function tasky1062EnhanceProjectNav(){
  const list=document.querySelector('.projects-inline-list');
  if(!list)return;
  const rows=[...list.querySelectorAll('.project-item:not(.create-project-item)')];

  rows.forEach((row,i)=>{
    const p=projects[i];if(!p)return;
    row.dataset.projectId=p.id;

    const name=row.querySelector('span:not(.dot)');
    if(name)name.classList.add('tasky1062-project-name');

    if(canManageProjectClient(p.id)&&!row.querySelector('.tasky1062-project-menu')){
      const b=document.createElement('button');
      b.type='button';b.className='tasky1062-project-menu';
      b.title=tasky1062L('إدارة المشروع','Manage project');b.setAttribute('aria-label',b.title);
      b.textContent='⋯';
      b.onclick=e=>{e.preventDefault();e.stopPropagation();tasky1062OpenProjectMenu(p.id)};
      row.appendChild(b);
    }
  });

  const head=document.querySelector('.projects-inline-head');
  if(head){
    let closed=document.getElementById('taskyClosedProjectsBtnV106');
    if(!closed){
      closed=document.createElement('button');
      closed.id='taskyClosedProjectsBtnV106';closed.type='button';
      closed.onclick=e=>{e.preventDefault();e.stopPropagation();tasky106OpenClosedProjects()};
      const plus=head.querySelector('.projects-inline-plus');
      head.insertBefore(closed,plus||null);
    }
    closed.className='tasky1062-closed-btn';
    closed.textContent=tasky1062L('المغلقة','Closed');
  }
}

const renderNavBaseV1062=renderNav;
renderNav=function(){
  renderNavBaseV1062();
  requestAnimationFrame(tasky1062EnhanceProjectNav);
};

/* ---------- Brainstorm: robust injection, independent of old brittle regex ---------- */
const meetingCardBaseV1062=meetingCardV101;
meetingCardV101=function(m,past=false){
  let h=meetingCardBaseV1062(m,past);
  if(h.includes(`brain106Open('${m.id}')`))return h;

  const btn=`<button class="chip-btn tasky1062-brain-btn" onclick="brain106Open('${m.id}')">💡 ${tasky1062L('غرفة العصف الذهني','Brainstorm room')}</button>`;

  /* Latest card ends with actions div + article, with whitespace/newlines between. */
  if(/<\/div>\s*<\/article>\s*$/i.test(h)){
    return h.replace(/<\/div>\s*<\/article>\s*$/i,btn+'</div></article>');
  }
  return h.replace(/<\/article>\s*$/i,`<div class="meet10512-actions">${btn}</div></article>`);
};

function tasky1062EnsureBrainstormToolbar(){
  const tools=document.getElementById('meet103Tools');
  if(!tools||!meetingRoomV101)return;
  if(!document.getElementById('brain106ToolbarBtn')){
    const b=document.createElement('button');
    b.id='brain106ToolbarBtn';b.type='button';b.className='meet103-pill';
    b.onclick=()=>brain106Open(meetingRoomV101.id);
    b.innerHTML=`💡 <span>${tasky1062L('عصف ذهني','Brainstorm')}</span>`;
    tools.appendChild(b);
  }
}
const meetingRenderRoomBaseV1062=meetingRenderRoomV101;
meetingRenderRoomV101=function(){
  const r=meetingRenderRoomBaseV1062();
  if(meetingRoomV101){
    requestAnimationFrame(tasky1062EnsureBrainstormToolbar);
  }
  return r;
};

/* Better error feedback if the V106 SQL was not installed. */
const brain106OpenBaseV1062=brain106Open;
brain106Open=async function(meetingId){
  brain106MeetingId=meetingId||meetingRoomV101?.id;
  if(!brain106MeetingId)return;

  const {data,error}=await sb.rpc('tasky_meeting_brainstorm_list_v106',brain106Args());
  if(error){
    brain106MeetingId=null;
    return showTaskyDialog({
      title:tasky1062L('تعذّر فتح غرفة العصف الذهني','Could not open Brainstorm Room'),
      message:error.message?.includes('function')
        ?tasky1062L('ميزة العصف الذهني تحتاج تشغيل ملف SQL الخاص بـ V106.2 في Supabase أولًا.','Brainstorm Room requires the V106.2 SQL migration to be run in Supabase first.')
        :error.message,
      tone:'error'
    });
  }
  brain106Rows=Array.isArray(data)?data:[];
  brain106Render();
  clearInterval(brain106Timer);
  brain106Timer=setInterval(()=>brain106Fetch(true),2000);
};

/* Re-run enhancements after initial application boot. */
setTimeout(()=>{try{tasky1062EnhanceProjectNav()}catch(_){};try{tasky1062EnsureBrainstormToolbar()}catch(_){}},250);


/* --- source script: tasky-v10621-design-consistency-js --- */

window.TASKY_BUILD='V106.2.1';console.info('Tasky build',window.TASKY_BUILD);

function tasky10621L(ar,en){return lang==='ar'?ar:en}

function tasky10621ProjectMenuButton(label,action,extra=''){
  return `<button class="chip-btn ${extra}" onclick="${action}">${escapeHtml(label)}</button>`;
}

/* Rebuild project management sheet without emoji/decorative icons. */
tasky1062OpenProjectMenu=function(projectId){
  const p=projects.find(x=>x.id===projectId);if(!p)return;
  const canManage=canManageProjectClient(projectId);
  if(!canManage)return taskyToast(tasky10621L('لا تملك صلاحية إدارة هذا المشروع','You do not have permission to manage this project'),{tone:'warning'});

  document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${tasky10621L('إدارة المشروع','Project management')}</h3><div class="subtle">${tasky10621L('أغلق المشروع لإزالته من القائمة مع الاحتفاظ بالتاريخ، أو احذفه نهائيًا إذا كان فارغًا ولا توجد سجلات مرتبطة.','Close the project to remove it from the active list while preserving history, or permanently delete it only if it is empty and has no linked records.')}</div></div><button class="modal-close" onclick="closeAddModal()">×</button></div>
  <div class="tasky1062-project-menu-sheet">
    <div class="tasky1062-project-summary"><b>${escapeHtml(p.name)}</b><span>${escapeHtml(p.description||tasky10621L('بدون وصف','No description'))}</span></div>
    <div class="tasky1062-project-menu-actions">
      ${tasky10621ProjectMenuButton(tasky10621L('إغلاق المشروع','Close project'),`tasky106CloseProject('${p.id}')`,'close-project')}
      ${currentUserRole==='admin'?tasky10621ProjectMenuButton(tasky10621L('حذف نهائي','Delete permanently'),`tasky106DeleteProject('${p.id}')`,'delete-project'):''}
    </div>
    ${tasky10621ProjectMenuButton(tasky10621L('صلاحيات المشروع','Project permissions'),`closeAddModal();openProjectAccessModal('${p.id}')`)}
  </div>`;
  document.getElementById('addModalOverlay').classList.remove('hidden');
};

/* Meeting card brainstorm button: text only, same chip language as the rest of Tasky. */
const meetingCardBaseV10621=meetingCardV101;
meetingCardV101=function(m,past=false){
  let h=meetingCardBaseV10621(m,past);

  h=h.replace(
    /<button class="chip-btn tasky1062-brain-btn" onclick="brain106Open\('([^']+)'\)">[\s\S]*?<\/button>/,
    `<button class="chip-btn tasky1062-brain-btn" onclick="brain106Open('$1')">${tasky10621L('غرفة العصف الذهني','Brainstorm room')}</button>`
  );

  h=h.replace(/📝\s*/g,'').replace(/🔐\s*/g,'').replace(/✉️\s*/g,'').replace(/🔗\s*/g,'').replace(/↗\s*/g,'').replace(/✎\s*/g,'');
  return h;
};

/* Live meeting toolbar: keep wording, remove emoji glyph. */
function tasky10621NormalizeMeetingToolbar(){
  const brain=document.getElementById('brain106ToolbarBtn');
  if(brain)brain.innerHTML=`<span>${tasky10621L('عصف ذهني','Brainstorm')}</span>`;

  const tools=document.getElementById('meet103Tools');
  if(!tools)return;
  tools.querySelectorAll('button').forEach(btn=>{
    if(btn.id==='brain106ToolbarBtn')return;
    const span=btn.querySelector('span');
    if(!span)return;
    for(const n of [...btn.childNodes]){
      if(n.nodeType===Node.TEXT_NODE && /[\p{Extended_Pictographic}]/u.test(n.textContent||'')){
        n.textContent='';
      }
    }
  });
}

const meetingRenderRoomBaseV10621=meetingRenderRoomV101;
meetingRenderRoomV101=function(){
  const r=meetingRenderRoomBaseV10621();
  if(meetingRoomV101)requestAnimationFrame(tasky10621NormalizeMeetingToolbar);
  return r;
};

/* Brainstorm heading/actions without emoji. */
const brain106RenderBaseV10621=brain106Render;
brain106Render=function(){
  brain106RenderBaseV10621();
  const el=document.getElementById('taskyV106Brainstorm');
  if(!el)return;
  const h=el.querySelector('.brain106-head h2');
  if(h)h.textContent=h.textContent.replace(/^[\s\p{Extended_Pictographic}]+/u,'');
};

setTimeout(()=>{
  try{tasky10621NormalizeMeetingToolbar()}catch(_){}
},200);


/* --- source script: tasky-v10622-meetings-sections-js --- */

window.TASKY_BUILD='V106.2.2';console.info('Tasky build',window.TASKY_BUILD);

let meetingsSectionV10622='meetings';

function meet10622L(ar,en){return lang==='ar'?ar:en}

function meetingsTabsV10622(){
  return `<div class="meet10622-tabs" role="tablist" aria-label="${meet10622L('أقسام الاجتماعات','Meeting sections')}">
    <button type="button" class="meet10622-tab ${meetingsSectionV10622==='meetings'?'active':''}" role="tab" aria-selected="${meetingsSectionV10622==='meetings'}" onclick="setMeetingsSectionV10622('meetings')">${meet10622L('الاجتماعات','Meetings')}</button>
    <button type="button" class="meet10622-tab ${meetingsSectionV10622==='brainstorm'?'active':''}" role="tab" aria-selected="${meetingsSectionV10622==='brainstorm'}" onclick="setMeetingsSectionV10622('brainstorm')">${meet10622L('غرفة العصف الذهني','Brainstorm Room')}</button>
  </div>`;
}

function setMeetingsSectionV10622(section){
  meetingsSectionV10622=section==='brainstorm'?'brainstorm':'meetings';
  if(activeNav==='meetings')renderModule();
}

function meetingBrainstormRoomCardV10622(m){
  const status=meetingStatusLabelV101(m.status);
  const readable=['scheduled','live','ended','cancelled'].includes(m.status);
  const canAdd=['scheduled','live'].includes(m.status);

  return `<article class="meet10622-room-card">
    <div class="meet10622-room-top">
      <div>
        <h3>${escapeHtml(m.title)}</h3>
        <p>${escapeHtml(m.description||meet10622L('بدون وصف للاجتماع','No meeting description'))}</p>
      </div>
      <span class="meet10622-room-status ${escapeHtml(m.status)}">${escapeHtml(status)}</span>
    </div>
    <div class="meet10622-room-meta">
      <div><span>${meet10622L('الموعد','When')}</span><b>${escapeHtml(meetingDateV101(m.scheduled_at))}</b></div>
      <div><span>${meet10622L('المنظّم','Organizer')}</span><b>${escapeHtml(meetingMemberNameV101(m.created_by))}</b></div>
    </div>
    <div class="meet10622-room-actions">
      ${readable?`<button type="button" class="primary-btn" onclick="brain106Open('${m.id}')">${canAdd?meet10622L('فتح الغرفة','Open room'):meet10622L('عرض الغرفة','View room')}</button>`:''}
      ${m.status==='live'?`<button type="button" class="chip-btn" onclick="openMeetingJoinConfirmV101('${m.room_code}')">${meet10622L('دخول الاجتماع','Join meeting')}</button>`:''}
    </div>
  </article>`;
}

function meetingsBrainstormTemplateV10622(){
  if(meetingsLoadingV101&&!meetingsV101.length){
    return `<div class="meet10622-brain-shell"><div class="meet10622-empty">${meet10622L('جارٍ تحميل غرف العصف الذهني…','Loading brainstorm rooms…')}</div></div>`;
  }
  if(meetingsErrorV101){
    return `<div class="meet10622-brain-shell"><div class="meet10622-empty"><b>${meet10622L('تعذّر تحميل الاجتماعات','Could not load meetings')}</b><br>${escapeHtml(meetingsErrorV101)}</div></div>`;
  }

  const active=meetingsV101.filter(m=>m.status==='live'||m.status==='scheduled');
  const history=meetingsV101.filter(m=>m.status==='ended'||m.status==='cancelled');

  return `<div class="meet10622-brain-shell">
    <div class="meet10622-brain-head">
      <div>
        <h2>${meet10622L('غرفة العصف الذهني','Brainstorm Room')}</h2>
        <p>${meet10622L('مساحة مرتبطة باجتماعات تاسكي لتجميع الأفكار والفرص والتحديات والقرارات. اختر اجتماعًا لفتح لوحته، وتبقى لوحات الاجتماعات السابقة متاحة كمرجع بعد انتهائها.','A workspace linked to Tasky meetings for capturing ideas, opportunities, challenges and decisions. Choose a meeting to open its board; completed meeting boards remain available as reference.')}</p>
      </div>
      ${active.length?`<button type="button" class="chip-btn" onclick="brain106Open('${active[0].id}')">${meet10622L('فتح أحدث غرفة','Open latest room')}</button>`:''}
    </div>

    <section>
      <div class="meet10622-group-title"><h3>${meet10622L('الغرف الحالية','Current rooms')}</h3><span>${active.length}</span></div>
      ${active.length?`<div class="meet10622-room-grid">${active.map(meetingBrainstormRoomCardV10622).join('')}</div>`:`<div class="meet10622-empty">${meet10622L('لا توجد اجتماعات مباشرة أو مجدولة حاليًا. أنشئ اجتماعًا جديدًا ليكون له لوح عصف ذهني خاص به.','There are no live or scheduled meetings. Create a meeting to get its own brainstorm board.')}</div>`}
    </section>

    ${history.length?`<section>
      <div class="meet10622-group-title"><h3>${meet10622L('غرف الاجتماعات السابقة','Previous meeting rooms')}</h3><span>${history.length}</span></div>
      <div class="meet10622-room-grid">${history.slice(0,18).map(meetingBrainstormRoomCardV10622).join('')}</div>
    </section>`:''}
  </div>`;
}

/* Wrap the final Meetings template so the section selector is always visible
   directly after clicking Meetings in the main navigation. */
const meetingsTemplateBaseV10622=meetingsTemplateV101;
meetingsTemplateV101=function(){
  const tabs=meetingsTabsV10622();
  if(meetingsSectionV10622==='brainstorm'){
    return `<div class="meet101-shell">${tabs}${meetingsBrainstormTemplateV10622()}</div>`;
  }
  const base=meetingsTemplateBaseV10622();
  if(/^<div class="meet101-shell">/.test(base)){
    return base.replace(/^<div class="meet101-shell">/,`<div class="meet101-shell">${tabs}`);
  }
  return `<div class="meet101-shell">${tabs}${base}</div>`;
};

/* When navigating away and back, default to Meetings only on a fresh app
   session; retain the user's selected sub-section while staying in Meetings. */
const setActiveNavBaseV10622=typeof setActiveNav==='function'?setActiveNav:null;
if(setActiveNavBaseV10622){
  setActiveNav=function(id,...args){
    const was=activeNav;
    const r=setActiveNavBaseV10622(id,...args);
    if(id!=='meetings'&&was==='meetings')meetingsSectionV10622='meetings';
    return r;
  };
}


/* --- source script: tasky-v1071-meeting-action-buttons-js --- */

window.TASKY_BUILD='V107.1';console.info('Tasky build',window.TASKY_BUILD);


/* Brainstorm remains a second-level lazy chunk. */
if(typeof setMeetingsSectionV10622==='function' && !window.__taskyBrainstormSectionLazyV168){
  window.__taskyBrainstormSectionLazyV168=true;
  const _setMeetingsSectionBeforeBrainV168=setMeetingsSectionV10622;
  const _brainLazyWrapperV168=async function(section){
    if(section==='brainstorm' && typeof taskyLazyLoadChunkV168==='function' && !taskyLazyChunkLoadedV168('brainstorm')){
      await taskyLazyLoadChunkV168('brainstorm');
      const latest=window.setMeetingsSectionV10622;
      if(latest && latest!==_brainLazyWrapperV168)return latest(section);
    }
    return _setMeetingsSectionBeforeBrainV168(section);
  };
  window.setMeetingsSectionV10622=_brainLazyWrapperV168;
}
