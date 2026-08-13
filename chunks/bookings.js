/* Tasky V168.1 lazy chunk: bookings */

/* --- source script: tasky-v140-bookings-js --- */

window.TASKY_BUILD='V140';console.info('Tasky build',window.TASKY_BUILD);
STR.ar.nav_bookings='الحجوزات';STR.en.nav_bookings='Bookings';
if(!NAV_ITEMS.some(x=>x.id==='bookings')){const i=NAV_ITEMS.findIndex(x=>x.id==='meetings');NAV_ITEMS.splice(i>=0?i+1:NAV_ITEMS.length,0,{id:'bookings',key:'nav_bookings',icon:'i-calendar',group:'grp_ops',always:true});}
let book140Tab='overview',book140State=null,book140Loading=false,book140Error='',book140Realtime=null,book140PublicCatalog=null,book140PublicDraft={};
const book140Tabs=[['overview','نظرة عامة','Overview'],['calendar','التقويم','Calendar'],['reservations','الحجوزات','Reservations'],['services','الخدمات','Services'],['resources','الموارد','Resources'],['staff','الموظفون','Staff'],['locations','الفروع','Locations'],['customers','العملاء','Customers'],['waitlist','الانتظار والطابور','Waitlist & Queue'],['packages','الباقات والعضويات','Packages & Memberships'],['settings','الإعدادات','Settings'],['reports','التقارير','Reports']];
function book140L(ar,en){return lang==='ar'?ar:en}function book140Money(n){return `${Number(n||0).toLocaleString(lang==='ar'?'ar-SA':'en-US',{maximumFractionDigits:2})} ${book140L('ر.س','SAR')}`}function book140Date(v){if(!v)return'—';try{return new Date(v).toLocaleString(lang==='ar'?'ar-SA':'en-US',{dateStyle:'medium',timeStyle:'short'})}catch(_){return v}}function book140Rows(k){return Array.isArray(book140State?.[k])?book140State[k]:[]}function book140Status(s){const m={requested:['مطلوب','Requested'],confirmed:['مؤكد','Confirmed'],checked_in:['تم الوصول','Checked in'],in_progress:['قيد الخدمة','In progress'],completed:['مكتمل','Completed'],cancelled:['ملغي','Cancelled'],no_show:['لم يحضر','No-show'],waiting:['انتظار','Waiting']};return m[s]?book140L(...m[s]):s}
async function book140Fetch(){if(!currentWorkspaceId)return;book140Loading=true;book140Error='';if(activeNav==='bookings')renderModule();const {data,error}=await sb.rpc('tasky_booking_state_v140',{p_workspace_id:currentWorkspaceId});if(error){book140Error=error.message||String(error);book140State=null}else book140State=data||{};book140Loading=false;if(activeNav==='bookings')renderModule()}
function book140SetTab(id){book140Tab=id;if(activeNav==='bookings')renderModule()}function book140InitRealtime(){if(book140Realtime){try{sb.removeChannel(book140Realtime)}catch(_){}}if(!currentWorkspaceId)return;book140Realtime=sb.channel(`tasky-bookings-v140-${currentWorkspaceId}`);['tasky_booking_reservations_v140','tasky_booking_waitlist_v140','tasky_booking_queue_v140'].forEach(table=>book140Realtime.on('postgres_changes',{event:'*',schema:'public',table,filter:`workspace_id=eq.${currentWorkspaceId}`},()=>setTimeout(book140Fetch,150)));book140Realtime.subscribe()}
const renderModuleBaseV140=renderModule;renderModule=function(){if(activeNav==='bookings'){document.getElementById('moduleArea').innerHTML=book140Template();return}return renderModuleBaseV140()};const setActiveNavBaseV140=setActiveNav;setActiveNav=function(id,...a){const r=setActiveNavBaseV140(id,...a);if(id==='bookings'){if(!book140State&&!book140Loading)book140Fetch();if(!book140Realtime)book140InitRealtime()}return r};
function book140Template(){if(book140Loading&&!book140State)return `<div class="book140-loading">${book140L('جارٍ تحميل نظام الحجوزات…','Loading bookings…')}</div>`;if(book140Error)return `<div class="book140-empty">${escapeHtml(book140Error)}<br><button class="book140-btn" onclick="book140Fetch()">${book140L('إعادة المحاولة','Retry')}</button></div>`;return `<div class="book140"><div class="book140-head"><div><h2>${book140L('الحجوزات','Bookings')}</h2><p>${book140L('محرك حجوزات عام للفنادق والمطاعم والملاعب والنوادي الصحية والمواعيد والعيادات والخدمات والمساحات والموارد.','A universal booking engine for hotels, restaurants, courts, fitness, appointments, healthcare, services, spaces and resources.')}</p></div><div class="book140-actions"><button class="book140-btn" onclick="book140OpenPublicPreview()">${book140L('صفحة الحجز العامة','Public booking page')}</button><button class="book140-btn primary" onclick="book140OpenReservation()">${book140L('حجز جديد','New booking')}</button></div></div><div class="book140-tabs">${book140Tabs.map(t=>`<button class="book140-tab ${book140Tab===t[0]?'active':''}" onclick="book140SetTab('${t[0]}')">${book140L(t[1],t[2])}</button>`).join('')}</div>${book140TabTemplate()}</div>`}
function book140TabTemplate(){if(book140Tab==='overview')return book140Overview();if(book140Tab==='reservations')return book140Reservations();if(['services','resources','staff','locations'].includes(book140Tab))return book140Entities(book140Tab);if(book140Tab==='customers')return book140Customers();if(book140Tab==='waitlist')return book140Waitlist();if(book140Tab==='packages')return book140Packages();if(book140Tab==='settings')return book140Settings();if(book140Tab==='reports')return book140Reports();return book140Calendar()}
function book140Overview(){const m=book140State?.metrics||{},rows=book140Rows('reservations').filter(x=>['requested','confirmed','checked_in','in_progress'].includes(x.status)).slice(0,8);return `<div class="book140-grid"><div class="book140-stat"><span>${book140L('حجوزات اليوم','Today bookings')}</span><b>${Number(m.today_bookings||0)}</b></div><div class="book140-stat"><span>${book140L('نسبة الإشغال','Occupancy')}</span><b>${Number(m.occupancy_pct||0).toFixed(0)}%</b></div><div class="book140-stat"><span>${book140L('الإيراد المتوقع','Expected revenue')}</span><b>${book140Money(m.expected_revenue)}</b></div><div class="book140-stat"><span>${book140L('قائمة الانتظار','Waitlist')}</span><b>${Number(m.waitlist_count||0)}</b></div><div class="book140-panel" style="grid-column:1/-1"><div class="book140-panel-head"><div><h3>${book140L('الحجوزات القادمة','Upcoming bookings')}</h3></div><button class="book140-btn" onclick="book140SetTab('reservations')">${book140L('عرض الكل','View all')}</button></div>${rows.length?book140ReservationTable(rows):`<div class="book140-empty">${book140L('لا توجد حجوزات قادمة.','No upcoming bookings.')}</div>`}</div></div>`}
function book140ReservationTable(rows){return `<div class="book140-table-wrap"><table class="book140-table"><thead><tr><th>${book140L('المرجع','Ref')}</th><th>${book140L('العميل','Customer')}</th><th>${book140L('الخدمة','Service')}</th><th>${book140L('الوقت','Time')}</th><th>${book140L('الحالة','Status')}</th><th>${book140L('القيمة','Value')}</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.reference_no||'')}</td><td>${escapeHtml(r.customer_name||'')}</td><td>${escapeHtml(r.service_name||'')}</td><td>${escapeHtml(book140Date(r.start_at))}</td><td><span class="book140-badge ${r.status}">${escapeHtml(book140Status(r.status))}</span></td><td>${book140Money(r.total_amount)}</td><td><button class="book140-btn" onclick="book140OpenReservation('${r.id}')">${book140L('فتح','Open')}</button></td></tr>`).join('')}</tbody></table></div>`}
function book140Reservations(){const rows=book140Rows('reservations');return `<div class="book140-panel"><div class="book140-panel-head"><div><h3>${book140L('كل الحجوزات','All reservations')}</h3><p>${book140L('إنشاء، إعادة جدولة، وصول، إكمال، إلغاء وعدم حضور.','Create, reschedule, check-in, complete, cancel and no-show.')}</p></div><button class="book140-btn primary" onclick="book140OpenReservation()">${book140L('حجز جديد','New booking')}</button></div>${rows.length?book140ReservationTable(rows):`<div class="book140-empty">${book140L('لا توجد حجوزات بعد.','No reservations yet.')}</div>`}</div>`}
function book140Calendar(){const rows=book140Rows('reservations').slice(0,40);return `<div class="book140-panel"><div class="book140-panel-head"><div><h3>${book140L('التقويم التشغيلي','Operational calendar')}</h3><p>${book140L('الحجوزات مرتبة زمنيًا مع دعم الفلاتر حسب الفرع والمورد والموظف في المحرك.','Chronological bookings with engine support for location/resource/staff filters.')}</p></div></div>${rows.length?book140ReservationTable(rows):`<div class="book140-empty">${book140L('لا توجد حجوزات على التقويم.','No bookings on the calendar.')}</div>`}</div>`}
function book140Entities(kind){const labels={services:['الخدمات','Services'],resources:['الموارد','Resources'],staff:['الموظفون','Staff'],locations:['الفروع','Locations']},rows=book140Rows(kind),n=labels[kind];return `<div class="book140-panel"><div class="book140-panel-head"><div><h3>${book140L(n[0],n[1])}</h3><p>${book140L('السعة والتوفر والسياسات والتسعير والربط كلها مدعومة من المحرك العام.','Capacity, availability, policies, pricing and links are supported by the generic engine.')}</p></div><button class="book140-btn primary" onclick="book140OpenEntity('${kind}')">${book140L('إضافة','Add')}</button></div>${rows.length?`<div class="book140-cards">${rows.map(x=>`<div class="book140-card"><h4>${escapeHtml(x.name||x.display_name||'')}</h4><p>${escapeHtml(x.description||x.email||x.city||'')}</p><div class="book140-card-actions"><button class="book140-btn" onclick="book140OpenEntity('${kind}','${x.id}')">${book140L('تعديل','Edit')}</button></div></div>`).join('')}</div>`:`<div class="book140-empty">${book140L('لا توجد بيانات بعد.','No data yet.')}</div>`}</div>`}
function book140Customers(){const rows=book140Rows('customers');return `<div class="book140-panel"><div class="book140-panel-head"><div><h3>${book140L('العملاء','Customers')}</h3></div><button class="book140-btn primary" onclick="book140OpenEntity('customers')">${book140L('عميل جديد','New customer')}</button></div>${rows.length?`<div class="book140-cards">${rows.map(x=>`<div class="book140-card"><h4>${escapeHtml(x.name)}</h4><p>${escapeHtml(x.phone||x.email||'')}</p></div>`).join('')}</div>`:`<div class="book140-empty">${book140L('لا يوجد عملاء بعد.','No customers yet.')}</div>`}</div>`}
function book140Waitlist(){const w=book140Rows('waitlist'),q=book140Rows('queue');return `<div class="book140-grid"><div class="book140-panel" style="grid-column:span 2"><div class="book140-panel-head"><div><h3>${book140L('قائمة الانتظار','Waitlist')}</h3></div><button class="book140-btn" onclick="book140OpenWaitlist()">${book140L('إضافة','Add')}</button></div>${w.length?w.map(x=>`<div class="book140-card"><h4>${escapeHtml(x.customer_name)}</h4><p>${escapeHtml(x.service_name||'')}</p></div>`).join(''):`<div class="book140-empty">${book140L('القائمة فارغة.','Waitlist is empty.')}</div>`}</div><div class="book140-panel" style="grid-column:span 2"><div class="book140-panel-head"><div><h3>${book140L('الطابور الإلكتروني','Online queue')}</h3></div><button class="book140-btn" onclick="book140OpenQueue()">${book140L('دخول للطابور','Join queue')}</button></div>${q.length?q.map(x=>`<div class="book140-card"><h4>#${x.queue_no} · ${escapeHtml(x.customer_name)}</h4><p>${escapeHtml(x.service_name||'')}</p></div>`).join(''):`<div class="book140-empty">${book140L('الطابور فارغ.','Queue is empty.')}</div>`}</div></div>`}
function book140Packages(){return `<div class="book140-grid"><div class="book140-panel" style="grid-column:span 2"><div class="book140-panel-head"><h3>${book140L('الباقات','Packages')}</h3><button class="book140-btn" onclick="book140OpenSimple('package')">${book140L('إضافة','Add')}</button></div>${book140Rows('packages').map(x=>`<div class="book140-card"><h4>${escapeHtml(x.name)}</h4><p>${book140Money(x.value)}</p></div>`).join('')||`<div class="book140-empty">—</div>`}</div><div class="book140-panel" style="grid-column:span 2"><div class="book140-panel-head"><h3>${book140L('العضويات','Memberships')}</h3><button class="book140-btn" onclick="book140OpenSimple('membership')">${book140L('إضافة','Add')}</button></div>${book140Rows('memberships').map(x=>`<div class="book140-card"><h4>${escapeHtml(x.name)}</h4><p>${book140Money(x.value)}</p></div>`).join('')||`<div class="book140-empty">—</div>`}</div></div>`}
function book140Settings(){const s=book140State?.settings||{},f=book140State?.feature_flags||{};const groups=[['قواعد الحجز','Booking rules',['approval_mode','buffers','recurring','overbooking','capacity','multi_resource']],['الدفع والسياسات','Payments & policies',['deposits','full_payment','pay_on_arrival','cancellation_policy','reschedule']],['التشغيل','Operations',['check_in','check_out','no_show','waitlist','queue','walk_in','maintenance_blocks']],['الإشعارات','Notifications',['email','sms','whatsapp','reminders','customer_confirmation']],['التكاملات','Integrations',['crm','finance','inventory','api','webhooks']],['التجربة العامة','Public experience',['public_page','embed_widget','qr_code','bilingual','hijri','kiosk']]];return `<div class="book140-grid"><div class="book140-panel" style="grid-column:1/-1"><div class="book140-panel-head"><div><h3>${book140L('إعدادات الحجز العامة','Public booking settings')}</h3></div></div><div class="book140-form"><div class="book140-field"><label>${book140L('الرابط العام','Public slug')}</label><input id="book140Slug" value="${escapeHtml(s.public_slug||'')}"></div><div class="book140-field"><label>${book140L('المنطقة الزمنية','Timezone')}</label><input id="book140Timezone" value="${escapeHtml(s.timezone||'Asia/Riyadh')}"></div><div class="book140-field full"><label>${book140L('سياسة الإلغاء','Cancellation policy')}</label><textarea id="book140Cancellation">${escapeHtml(s.cancellation_policy||'')}</textarea></div><div class="book140-field full"><button class="book140-btn primary" onclick="book140SaveSettings()">${book140L('حفظ','Save')}</button></div></div></div><div class="book140-panel" style="grid-column:1/-1">${groups.map(g=>`<div style="margin-bottom:10px"><b>${book140L(g[0],g[1])}</b><div class="book140-feature-grid" style="margin-top:6px">${g[2].map(k=>`<div class="book140-feature"><b>${escapeHtml(k.replaceAll('_',' '))}</b>${f[k]===false?book140L('معطل','Disabled'):book140L('متاح','Available')}</div>`).join('')}</div></div>`).join('')}<p style="font-size:8px;color:var(--muted)">${book140L('الدفع الفعلي وWhatsApp/SMS ومزامنة تقويم خارجي تحتاج مفاتيح مزود خارجي؛ المحرك والحقول والتدفقات جاهزة بدون وضع أسرار في الواجهة.','Real payments, WhatsApp/SMS and external-calendar sync require provider credentials; the engine, fields and flows are ready without putting secrets in the frontend.')}</p></div></div>`}
function book140Reports(){const a=book140State?.analytics||{};return `<div class="book140-grid"><div class="book140-stat"><span>${book140L('العملاء العائدون','Returning customers')}</span><b>${Number(a.returning_customer_pct||0).toFixed(0)}%</b></div><div class="book140-stat"><span>${book140L('الإلغاء','Cancellation rate')}</span><b>${Number(a.cancellation_pct||0).toFixed(0)}%</b></div><div class="book140-stat"><span>${book140L('عدم الحضور','No-show rate')}</span><b>${Number(a.no_show_pct||0).toFixed(0)}%</b></div><div class="book140-stat"><span>${book140L('التقييم','Rating')}</span><b>${Number(a.avg_rating||0).toFixed(1)}</b></div></div>`}
function book140Modal(title,body){document.getElementById('addModalBody').innerHTML=`<div class="modal-head"><div><h3>${escapeHtml(title)}</h3></div><button class="modal-close" onclick="closeAddModal()">×</button></div>${body}`;document.getElementById('addModalOverlay').classList.remove('hidden')}
function book140OpenEntity(kind,id=''){const x=book140Rows(kind).find(a=>a.id===id)||{},label={services:['خدمة','Service'],resources:['مورد','Resource'],staff:['موظف','Staff'],locations:['فرع','Location'],customers:['عميل','Customer']}[kind];let extra='';if(kind==='services')extra=`<div class="book140-field"><label>${book140L('نوع الحجز','Booking type')}</label><select id="book140Type">${['appointment','resource','space','room','table','court','staff','service','event_slot','stay','class','custom'].map(v=>`<option value="${v}" ${x.booking_type===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="book140-field"><label>${book140L('المدة بالدقائق','Duration')}</label><input id="book140Duration" type="number" value="${Number(x.duration_minutes||60)}"></div><div class="book140-field"><label>${book140L('السعة','Capacity')}</label><input id="book140Capacity" type="number" value="${Number(x.capacity||1)}"></div><div class="book140-field"><label>${book140L('السعر','Price')}</label><input id="book140Price" type="number" step="0.01" value="${Number(x.base_price||0)}"></div>`;if(kind==='resources')extra=`<div class="book140-field"><label>${book140L('النوع','Type')}</label><input id="book140Type" value="${escapeHtml(x.resource_type||'custom')}"></div><div class="book140-field"><label>${book140L('السعة','Capacity')}</label><input id="book140Capacity" type="number" value="${Number(x.capacity||1)}"></div>`;if(kind==='staff')extra=`<div class="book140-field"><label>${book140L('البريد','Email')}</label><input id="book140Email" value="${escapeHtml(x.email||'')}"></div><div class="book140-field"><label>${book140L('المسمى','Role')}</label><input id="book140Role" value="${escapeHtml(x.role_label||'')}"></div>`;if(kind==='locations')extra=`<div class="book140-field"><label>${book140L('المدينة','City')}</label><input id="book140City" value="${escapeHtml(x.city||'')}"></div><div class="book140-field"><label>${book140L('العنوان','Address')}</label><input id="book140Address" value="${escapeHtml(x.address||'')}"></div>`;if(kind==='customers')extra=`<div class="book140-field"><label>${book140L('الجوال','Phone')}</label><input id="book140Phone" value="${escapeHtml(x.phone||'')}"></div><div class="book140-field"><label>${book140L('البريد','Email')}</label><input id="book140Email" value="${escapeHtml(x.email||'')}"></div>`;book140Modal(`${id?book140L('تعديل','Edit'):book140L('إضافة','Add')} ${book140L(label[0],label[1])}`,`<div class="book140-form"><div class="book140-field"><label>${book140L('الاسم','Name')}</label><input id="book140Name" value="${escapeHtml(x.name||x.display_name||'')}"></div>${extra}<div class="book140-field full"><label>${book140L('الوصف / الملاحظات','Description / Notes')}</label><textarea id="book140Desc">${escapeHtml(x.description||x.notes||'')}</textarea></div><div class="book140-field full"><button class="book140-btn primary" onclick="book140SaveEntity('${kind}','${id}')">${book140L('حفظ','Save')}</button></div></div>`)}
async function book140SaveEntity(kind,id){const p={id:id||null,name:document.getElementById('book140Name').value.trim(),description:document.getElementById('book140Desc').value.trim()||null};if(kind==='services')Object.assign(p,{booking_type:document.getElementById('book140Type').value,duration_minutes:Number(document.getElementById('book140Duration').value||60),capacity:Number(document.getElementById('book140Capacity').value||1),base_price:Number(document.getElementById('book140Price').value||0)});if(kind==='resources')Object.assign(p,{resource_type:document.getElementById('book140Type').value,capacity:Number(document.getElementById('book140Capacity').value||1)});if(kind==='staff')Object.assign(p,{display_name:p.name,email:document.getElementById('book140Email').value.trim()||null,role_label:document.getElementById('book140Role').value.trim()||null});if(kind==='locations')Object.assign(p,{city:document.getElementById('book140City').value.trim()||null,address:document.getElementById('book140Address').value.trim()||null});if(kind==='customers')Object.assign(p,{phone:document.getElementById('book140Phone').value.trim()||null,email:document.getElementById('book140Email').value.trim()||null,notes:p.description});const {error}=await sb.rpc('tasky_booking_entity_upsert_v140',{p_workspace_id:currentWorkspaceId,p_entity:kind,p_payload:p});if(error)return taskyToast(error.message,{tone:'warning'});closeAddModal();await book140Fetch()}
function book140OpenReservation(id=''){const r=book140Rows('reservations').find(x=>x.id===id)||{};book140Modal(id?book140L('تفاصيل الحجز','Booking details'):book140L('حجز جديد','New booking'),`<div class="book140-form"><div class="book140-field"><label>${book140L('اسم العميل','Customer')}</label><input id="book140CustName" value="${escapeHtml(r.customer_name||'')}"></div><div class="book140-field"><label>${book140L('الجوال','Phone')}</label><input id="book140CustPhone" value="${escapeHtml(r.customer_phone||'')}"></div><div class="book140-field"><label>${book140L('الخدمة','Service')}</label><select id="book140Service">${book140Rows('services').map(x=>`<option value="${x.id}" ${r.service_id===x.id?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select></div><div class="book140-field"><label>${book140L('البداية','Start')}</label><input type="datetime-local" id="book140Start" value="${r.start_at?new Date(new Date(r.start_at).getTime()-new Date(r.start_at).getTimezoneOffset()*60000).toISOString().slice(0,16):''}"></div><div class="book140-field"><label>${book140L('عدد الأشخاص','Party size')}</label><input type="number" min="1" id="book140Party" value="${Number(r.party_size||1)}"></div><div class="book140-field"><label>${book140L('المورد','Resource')}</label><select id="book140Resource"><option value="">${book140L('اختيار تلقائي','Auto')}</option>${book140Rows('resources').map(x=>`<option value="${x.id}" ${r.resource_id===x.id?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select></div><div class="book140-field"><label>${book140L('الموظف','Staff')}</label><select id="book140Staff"><option value="">${book140L('أي موظف متاح','Any')}</option>${book140Rows('staff').map(x=>`<option value="${x.id}" ${r.staff_id===x.id?'selected':''}>${escapeHtml(x.display_name)}</option>`).join('')}</select></div><div class="book140-field full"><label>${book140L('ملاحظات','Notes')}</label><textarea id="book140Notes">${escapeHtml(r.customer_notes||'')}</textarea></div><div class="book140-field full"><div class="book140-toolbar"><button class="book140-btn primary" onclick="book140SaveReservation('${id}')">${book140L('حفظ','Save')}</button>${id?`<button class="book140-btn" onclick="book140StatusChange('${id}','checked_in')">${book140L('وصول','Check in')}</button><button class="book140-btn" onclick="book140StatusChange('${id}','completed')">${book140L('إكمال','Complete')}</button><button class="book140-btn" onclick="book140StatusChange('${id}','no_show')">${book140L('عدم حضور','No-show')}</button><button class="book140-btn danger" onclick="book140StatusChange('${id}','cancelled')">${book140L('إلغاء','Cancel')}</button>`:''}</div></div></div>`)}
async function book140SaveReservation(id){const start=document.getElementById('book140Start').value;if(!start)return taskyToast(book140L('حدد وقت الحجز','Choose a booking time'),{tone:'warning'});const p={reservation_id:id||null,customer_name:document.getElementById('book140CustName').value.trim(),customer_phone:document.getElementById('book140CustPhone').value.trim()||null,service_id:document.getElementById('book140Service').value,resource_id:document.getElementById('book140Resource').value||null,staff_id:document.getElementById('book140Staff').value||null,start_at:new Date(start).toISOString(),party_size:Number(document.getElementById('book140Party').value||1),customer_notes:document.getElementById('book140Notes').value.trim()||null};const {data,error}=await sb.rpc('tasky_booking_reservation_save_v140',{p_workspace_id:currentWorkspaceId,p_payload:p});if(error)return showTaskyDialog({title:book140L('تعذّر حفظ الحجز','Could not save booking'),message:error.message,tone:'error'});closeAddModal();await book140Fetch();taskyToast(`${book140L('تم الحفظ','Saved')} ${data?.reference_no||''}`,{tone:'success'})}
async function book140StatusChange(id,status){const {error}=await sb.rpc('tasky_booking_status_v140',{p_reservation_id:id,p_status:status,p_note:null});if(error)return taskyToast(error.message,{tone:'warning'});closeAddModal();await book140Fetch()}
function book140OpenWaitlist(){book140Modal(book140L('إضافة لقائمة الانتظار','Add to waitlist'),`<div class="book140-form"><div class="book140-field"><label>${book140L('الاسم','Name')}</label><input id="book140WaitName"></div><div class="book140-field"><label>${book140L('الجوال','Phone')}</label><input id="book140WaitPhone"></div><div class="book140-field"><label>${book140L('الخدمة','Service')}</label><select id="book140WaitService">${book140Rows('services').map(x=>`<option value="${x.id}">${escapeHtml(x.name)}</option>`).join('')}</select></div><div class="book140-field full"><button class="book140-btn primary" onclick="book140SaveWaitlist()">${book140L('إضافة','Add')}</button></div></div>`)}async function book140SaveWaitlist(){const {error}=await sb.rpc('tasky_booking_waitlist_add_v140',{p_workspace_id:currentWorkspaceId,p_customer_name:document.getElementById('book140WaitName').value.trim(),p_customer_phone:document.getElementById('book140WaitPhone').value.trim()||null,p_service_id:document.getElementById('book140WaitService').value,p_preferred_window:null});if(error)return taskyToast(error.message,{tone:'warning'});closeAddModal();await book140Fetch()}
function book140OpenQueue(){book140Modal(book140L('دخول للطابور','Join queue'),`<div class="book140-form"><div class="book140-field"><label>${book140L('الاسم','Name')}</label><input id="book140QueueName"></div><div class="book140-field"><label>${book140L('الجوال','Phone')}</label><input id="book140QueuePhone"></div><div class="book140-field"><label>${book140L('الخدمة','Service')}</label><select id="book140QueueService">${book140Rows('services').map(x=>`<option value="${x.id}">${escapeHtml(x.name)}</option>`).join('')}</select></div><div class="book140-field full"><button class="book140-btn primary" onclick="book140SaveQueue()">${book140L('إضافة','Add')}</button></div></div>`)}async function book140SaveQueue(){const {error}=await sb.rpc('tasky_booking_queue_join_v140',{p_workspace_id:currentWorkspaceId,p_customer_name:document.getElementById('book140QueueName').value.trim(),p_customer_phone:document.getElementById('book140QueuePhone').value.trim()||null,p_service_id:document.getElementById('book140QueueService').value});if(error)return taskyToast(error.message,{tone:'warning'});closeAddModal();await book140Fetch()}
function book140OpenSimple(type){book140Modal(book140L('إضافة','Add'),`<div class="book140-form"><div class="book140-field"><label>${book140L('الاسم','Name')}</label><input id="book140SimpleName"></div><div class="book140-field"><label>${book140L('القيمة','Value')}</label><input type="number" id="book140SimpleValue" value="0"></div><div class="book140-field full"><button class="book140-btn primary" onclick="book140SaveSimple('${type}')">${book140L('حفظ','Save')}</button></div></div>`)}async function book140SaveSimple(type){const {error}=await sb.rpc('tasky_booking_entity_upsert_v140',{p_workspace_id:currentWorkspaceId,p_entity:type,p_payload:{name:document.getElementById('book140SimpleName').value.trim(),value:Number(document.getElementById('book140SimpleValue').value||0)}});if(error)return taskyToast(error.message,{tone:'warning'});closeAddModal();await book140Fetch()}
async function book140SaveSettings(){const {error}=await sb.rpc('tasky_booking_settings_save_v140',{p_workspace_id:currentWorkspaceId,p_payload:{public_slug:document.getElementById('book140Slug').value.trim(),timezone:document.getElementById('book140Timezone').value.trim()||'Asia/Riyadh',cancellation_policy:document.getElementById('book140Cancellation').value.trim()||null}});if(error)return taskyToast(error.message,{tone:'warning'});await book140Fetch();taskyToast(book140L('تم الحفظ','Saved'),{tone:'success'})}
async function book140OpenPublicPreview(){const slug=book140State?.settings?.public_slug;if(!slug)return showTaskyDialog({title:book140L('الرابط العام غير مفعّل','Public link is not configured'),message:book140L('حدد Public slug من الإعدادات أولًا.','Set a public slug in Settings first.'),tone:'warning'});const {data,error}=await sb.rpc('tasky_public_booking_catalog_v140',{p_public_slug:slug});if(error)return taskyToast(error.message,{tone:'warning'});book140PublicCatalog=data||{};book140PublicDraft={};book140RenderPublic()}
function book140RenderPublic(){let el=document.getElementById('book140Public');if(!el){el=document.createElement('div');el.id='book140Public';el.className='book140-public';document.body.appendChild(el)}const c=book140PublicCatalog||{};el.innerHTML=`<div class="book140-public-shell"><div class="book140-public-head"><div><h2>${escapeHtml(c.display_name||book140L('الحجز','Booking'))}</h2><p>${escapeHtml(c.public_intro||book140L('اختر الخدمة والموعد المناسب','Choose a service and suitable time'))}</p></div><button class="book140-btn" onclick="document.getElementById('book140Public').classList.remove('show')">×</button></div><div class="book140-cards">${(c.services||[]).map(s=>`<button class="book140-card" style="text-align:start" onclick="book140PublicForm('${s.id}')"><h4>${escapeHtml(s.name)}</h4><p>${Number(s.duration_minutes||0)} ${book140L('دقيقة','min')} · ${book140Money(s.base_price)}</p></button>`).join('')}</div></div>`;el.classList.add('show')}
function book140PublicForm(serviceId){const el=document.getElementById('book140Public');el.innerHTML=`<div class="book140-public-shell"><div class="book140-public-head"><h2>${book140L('إتمام الحجز','Complete booking')}</h2><button class="book140-btn" onclick="document.getElementById('book140Public').classList.remove('show')">×</button></div><div class="book140-form"><div class="book140-field"><label>${book140L('الاسم','Name')}</label><input id="book140PubName"></div><div class="book140-field"><label>${book140L('الجوال','Phone')}</label><input id="book140PubPhone"></div><div class="book140-field"><label>${book140L('التاريخ والوقت','Date & time')}</label><input type="datetime-local" id="book140PubStart"></div><div class="book140-field"><label>${book140L('عدد الأشخاص','Party size')}</label><input type="number" min="1" value="1" id="book140PubParty"></div><div class="book140-field full"><button class="book140-btn primary" onclick="book140PublicSubmit('${serviceId}')">${book140L('تأكيد الحجز','Confirm booking')}</button></div></div></div>`}
async function book140PublicSubmit(serviceId){const {data,error}=await sb.rpc('tasky_public_booking_create_v140',{p_public_slug:book140State.settings.public_slug,p_payload:{service_id:serviceId,customer_name:document.getElementById('book140PubName').value.trim(),customer_phone:document.getElementById('book140PubPhone').value.trim(),start_at:new Date(document.getElementById('book140PubStart').value).toISOString(),party_size:Number(document.getElementById('book140PubParty').value||1)}});if(error)return taskyToast(error.message,{tone:'warning'});document.getElementById('book140Public').innerHTML=`<div class="book140-public-shell"><div class="book140-empty"><b>${book140L('تم استلام الحجز','Booking received')}</b><br>${escapeHtml(data?.reference_no||'')}</div></div>`;book140Fetch()}


/* --- source script: tasky-v1401-bookings-hardening-js --- */

window.TASKY_BUILD='V140.1';console.info('Tasky build',window.TASKY_BUILD);

let book1401Search='';
let book1401Status='';
let book1401Location='';
let book1401SelectedSlot='';
let book1401SlotCache=[];
let book1401SlotLoading=false;
let book1401PublicLocation='';

function book1401Norm(s){return String(s||'').trim().toLowerCase()}
function book1401FilterReservations(rows){
  const q=book1401Norm(book1401Search);
  return rows.filter(r=>{
    if(book1401Status&&r.status!==book1401Status)return false;
    if(book1401Location&&r.location_id!==book1401Location)return false;
    if(!q)return true;
    return [r.reference_no,r.customer_name,r.customer_phone,r.service_name,r.location_name,r.resource_name,r.staff_name]
      .some(x=>book1401Norm(x).includes(q));
  });
}
function book1401SetFilter(kind,v){
  if(kind==='search')book1401Search=v;
  if(kind==='status')book1401Status=v;
  if(kind==='location')book1401Location=v;
  if(activeNav==='bookings')renderModule();
}
function book1401Filterbar(){
  return `<div class="book1401-filterbar">
    <input class="book1401-search" value="${escapeHtml(book1401Search)}" oninput="book1401SetFilter('search',this.value)" placeholder="${book140L('بحث بالمرجع أو العميل أو الخدمة','Search ref, customer or service')}">
    <select onchange="book1401SetFilter('status',this.value)">
      <option value="">${book140L('كل الحالات','All statuses')}</option>
      ${['requested','confirmed','checked_in','in_progress','completed','cancelled','no_show'].map(s=>`<option value="${s}" ${book1401Status===s?'selected':''}>${escapeHtml(book140Status(s))}</option>`).join('')}
    </select>
    <select onchange="book1401SetFilter('location',this.value)">
      <option value="">${book140L('كل الفروع','All locations')}</option>
      ${book140Rows('locations').map(x=>`<option value="${x.id}" ${book1401Location===x.id?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}
    </select>
    <button class="book140-btn" onclick="book1401Search='';book1401Status='';book1401Location='';renderModule()">${book140L('مسح','Clear')}</button>
  </div>`;
}

/* Richer reservation table with operational context. */
book140ReservationTable=function(rows){
  return `<div class="book140-table-wrap"><table class="book140-table"><thead><tr>
    <th>${book140L('المرجع','Ref')}</th><th>${book140L('العميل','Customer')}</th><th>${book140L('الخدمة','Service')}</th>
    <th>${book140L('الوقت','Time')}</th><th>${book140L('التخصيص','Assignment')}</th><th>${book140L('الحالة','Status')}</th>
    <th>${book140L('القيمة','Value')}</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr>
      <td><b>${escapeHtml(r.reference_no||'')}</b><div class="book1401-reservation-meta">${r.source?`<span class="book1401-chip">${escapeHtml(r.source)}</span>`:''}${Number(r.party_size||1)>1?`<span class="book1401-chip">${Number(r.party_size)} ${book140L('أشخاص','guests')}</span>`:''}</div></td>
      <td><b>${escapeHtml(r.customer_name||'')}</b><br><small>${escapeHtml(r.customer_phone||'')}</small></td>
      <td>${escapeHtml(r.service_name||'')}</td>
      <td>${escapeHtml(book140Date(r.start_at))}<br><small>${r.end_at?escapeHtml(book140Date(r.end_at)):''}</small></td>
      <td>${escapeHtml(r.location_name||'—')}<br><small>${escapeHtml([r.resource_name,r.staff_name].filter(Boolean).join(' · ')||'')}</small></td>
      <td><span class="book140-badge ${r.status}">${escapeHtml(book140Status(r.status))}</span></td>
      <td>${book140Money(r.total_amount)}</td>
      <td><button class="book140-btn" onclick="book140OpenReservation('${r.id}')">${book140L('فتح','Open')}</button></td>
    </tr>`).join('')}</tbody></table></div>`;
};

book140Reservations=function(){
  const rows=book1401FilterReservations(book140Rows('reservations'));
  return `<div class="book140-panel"><div class="book140-panel-head"><div><h3>${book140L('كل الحجوزات','All reservations')}</h3><p>${book140L('بحث، فلترة، إعادة جدولة، وصول، إكمال، إلغاء وعدم حضور.','Search, filter, reschedule, check-in, complete, cancel and no-show.')}</p></div><button class="book140-btn primary" onclick="book140OpenReservation()">${book140L('حجز جديد','New booking')}</button></div>${book1401Filterbar()}${rows.length?book140ReservationTable(rows):`<div class="book140-empty">${book140L('لا توجد حجوزات مطابقة.','No matching reservations.')}</div>`}</div>`;
};

/* Real weekly calendar instead of a chronological table. */
book140Calendar=function(){
  const rows=book1401FilterReservations(book140Rows('reservations'));
  const days=[0,1,2,3,4,5,6].map(i=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+i);return d});
  const hours=Array.from({length:15},(_,i)=>7+i);
  const ev=(d,h)=>rows.filter(r=>{const x=new Date(r.start_at);return x.toDateString()===d.toDateString()&&x.getHours()===h})
    .map(r=>`<div class="book1401-event ${r.status}" onclick="book140OpenReservation('${r.id}')"><b>${escapeHtml(r.service_name||'')}</b><br>${escapeHtml(r.customer_name||'')}<br><small>${escapeHtml(r.location_name||r.resource_name||'')}</small></div>`).join('');
  return `<div class="book140-panel"><div class="book140-panel-head"><div><h3>${book140L('التقويم التشغيلي','Operational calendar')}</h3><p>${book140L('أسبوع حي مع فلترة حسب الفرع والحالة والبحث.','Live weekly view with location, status and search filters.')}</p></div></div>${book1401Filterbar()}<div class="book140-table-wrap"><div class="book1401-calendar"><div class="book1401-calhead"></div>${days.map(d=>`<div class="book1401-calhead">${d.toLocaleDateString(lang==='ar'?'ar-SA':'en-US',{weekday:'short',day:'numeric',month:'short'})}</div>`).join('')}${hours.map(h=>`<div class="book1401-hour">${String(h).padStart(2,'0')}:00</div>${days.map(d=>`<div class="book1401-cell">${ev(d,h)}</div>`).join('')}`).join('')}</div></div></div>`;
};

/* Richer entity cards + maintenance block. */
book140Entities=function(kind){
  const labels={services:['الخدمات','Services'],resources:['الموارد','Resources'],staff:['الموظفون','Staff'],locations:['الفروع','Locations']},rows=book140Rows(kind),n=labels[kind];
  const card=x=>{
    let meta=[];
    if(kind==='services')meta=[[book140L('النوع','Type'),x.booking_type],[book140L('المدة','Duration'),`${Number(x.duration_minutes||0)} ${book140L('د','min')}`],[book140L('السعة','Capacity'),Number(x.capacity||1)],[book140L('السعر','Price'),book140Money(x.base_price)]];
    if(kind==='resources')meta=[[book140L('النوع','Type'),x.resource_type],[book140L('السعة','Capacity'),Number(x.capacity||1)],[book140L('الفرع','Location'),x.location_name||'—']];
    if(kind==='staff')meta=[[book140L('المسمى','Role'),x.role_label||'—'],[book140L('الفرع','Location'),x.location_name||'—'],[book140L('الحالة','Status'),x.active?book140L('نشط','Active'):book140L('غير نشط','Inactive')]];
    if(kind==='locations')meta=[[book140L('المدينة','City'),x.city||'—'],[book140L('المنطقة الزمنية','Timezone'),x.timezone||'Asia/Riyadh']];
    return `<div class="book140-card"><h4>${escapeHtml(x.name||x.display_name||'')}</h4><p>${escapeHtml(x.description||x.email||x.address||'')}</p><div class="book1401-entity-meta">${meta.map(m=>`<div><span>${escapeHtml(String(m[0]))}</span><b>${escapeHtml(String(m[1]??'—'))}</b></div>`).join('')}</div><div class="book140-card-actions"><button class="book140-btn" onclick="book140OpenEntity('${kind}','${x.id}')">${book140L('تعديل','Edit')}</button>${kind==='resources'?`<button class="book140-btn" onclick="book1401OpenBlock('${x.id}')">${book140L('صيانة / حظر وقت','Maintenance / block')}</button>`:''}</div></div>`;
  };
  return `<div class="book140-panel"><div class="book140-panel-head"><div><h3>${book140L(n[0],n[1])}</h3><p>${book140L('السعة والتوفر والسياسات والتسعير والربط ضمن محرك واحد.','Capacity, availability, policies, pricing and assignment in one engine.')}</p></div><button class="book140-btn primary" onclick="book140OpenEntity('${kind}')">${book140L('إضافة','Add')}</button></div>${rows.length?`<div class="book140-cards">${rows.map(card).join('')}</div>`:`<div class="book140-empty">${book140L('لا توجد بيانات بعد.','No data yet.')}</div>`}</div>`;
};

/* Add location selection and availability slot picker to booking form. */
book140OpenReservation=function(id=''){
  const r=book140Rows('reservations').find(x=>x.id===id)||{};
  book1401SelectedSlot=r.start_at||'';
  book1401SlotCache=[];
  const services=book140Rows('services'),locations=book140Rows('locations'),resources=book140Rows('resources'),staff=book140Rows('staff');
  book140Modal(id?book140L('تفاصيل الحجز','Booking details'):book140L('حجز جديد','New booking'),`<div class="book140-form">
    <div class="book140-field"><label>${book140L('اسم العميل','Customer')}</label><input id="book140CustName" value="${escapeHtml(r.customer_name||'')}"></div>
    <div class="book140-field"><label>${book140L('الجوال','Phone')}</label><input id="book140CustPhone" inputmode="tel" value="${escapeHtml(r.customer_phone||'')}" placeholder="+9665XXXXXXXX"></div>
    <div class="book140-field"><label>${book140L('الخدمة','Service')}</label><select id="book140Service" onchange="book1401LoadSlots()">${services.map(x=>`<option value="${x.id}" ${r.service_id===x.id?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select></div>
    <div class="book140-field"><label>${book140L('الفرع','Location')}</label><select id="book140Location" onchange="book1401LoadSlots()"><option value="">${book140L('أي فرع','Any location')}</option>${locations.map(x=>`<option value="${x.id}" ${r.location_id===x.id?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select></div>
    <div class="book140-field"><label>${book140L('المورد','Resource')}</label><select id="book140Resource" onchange="book1401LoadSlots()"><option value="">${book140L('اختيار تلقائي','Auto')}</option>${resources.map(x=>`<option value="${x.id}" ${r.resource_id===x.id?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select></div>
    <div class="book140-field"><label>${book140L('الموظف','Staff')}</label><select id="book140Staff" onchange="book1401LoadSlots()"><option value="">${book140L('أي موظف متاح','Any')}</option>${staff.map(x=>`<option value="${x.id}" ${r.staff_id===x.id?'selected':''}>${escapeHtml(x.display_name)}</option>`).join('')}</select></div>
    <div class="book140-field"><label>${book140L('التاريخ','Date')}</label><input type="date" id="book140DateOnly" onchange="book1401LoadSlots()" value="${r.start_at?new Date(r.start_at).toISOString().slice(0,10):new Date().toISOString().slice(0,10)}"></div>
    <div class="book140-field"><label>${book140L('عدد الأشخاص','Party size')}</label><input type="number" min="1" id="book140Party" value="${Number(r.party_size||1)}" onchange="book1401LoadSlots()"></div>
    <div class="book140-field full"><label>${book140L('الأوقات المتاحة','Available times')}</label><div id="book1401Slots" class="book1401-slots">${r.start_at?`<button type="button" class="book1401-slot selected">${new Date(r.start_at).toLocaleTimeString(lang==='ar'?'ar-SA':'en-US',{hour:'2-digit',minute:'2-digit'})}</button>`:`<div class="book1401-inline-note">${book140L('اختر الخدمة والتاريخ ليعرض تاسكي الأوقات المتاحة الفعلية.','Choose service and date to load actual available times.')}</div>`}</div></div>
    <div class="book140-field full"><label>${book140L('ملاحظات العميل','Customer notes')}</label><textarea id="book140Notes">${escapeHtml(r.customer_notes||'')}</textarea></div>
    <div class="book140-field full"><label>${book140L('ملاحظات داخلية','Internal notes')}</label><textarea id="book140InternalNotes">${escapeHtml(r.internal_notes||'')}</textarea></div>
    <div class="book140-field full"><div class="book140-toolbar"><button class="book140-btn primary" onclick="book140SaveReservation('${id}')">${book140L('حفظ','Save')}</button>${id?`<button class="book140-btn" onclick="book140StatusChange('${id}','checked_in')">${book140L('وصول','Check in')}</button><button class="book140-btn" onclick="book140StatusChange('${id}','completed')">${book140L('إكمال','Complete')}</button><button class="book140-btn" onclick="book140StatusChange('${id}','no_show')">${book140L('عدم حضور','No-show')}</button><button class="book140-btn danger" onclick="book140StatusChange('${id}','cancelled')">${book140L('إلغاء','Cancel')}</button>`:''}</div></div>
  </div>`);
  if(!id)setTimeout(book1401LoadSlots,60);
};

async function book1401LoadSlots(){
  const host=document.getElementById('book1401Slots');if(!host)return;
  const serviceId=document.getElementById('book140Service')?.value,date=document.getElementById('book140DateOnly')?.value;
  if(!serviceId||!date)return;
  host.innerHTML=`<div class="book1401-inline-note">${book140L('جارٍ حساب التوفر…','Checking availability…')}</div>`;
  book1401SlotLoading=true;
  const {data,error}=await sb.rpc('tasky_booking_available_slots_v1401',{
    p_workspace_id:currentWorkspaceId,
    p_service_id:serviceId,
    p_date:date,
    p_location_id:document.getElementById('book140Location')?.value||null,
    p_resource_id:document.getElementById('book140Resource')?.value||null,
    p_staff_id:document.getElementById('book140Staff')?.value||null,
    p_party_size:Number(document.getElementById('book140Party')?.value||1)
  });
  book1401SlotLoading=false;
  if(error){host.innerHTML=`<div class="book1401-warn">${escapeHtml(error.message)}</div>`;return}
  book1401SlotCache=Array.isArray(data)?data:[];
  host.innerHTML=book1401SlotCache.length?book1401SlotCache.map(x=>`<button type="button" class="book1401-slot ${book1401SelectedSlot===x.start_at?'selected':''}" onclick="book1401ChooseSlot('${x.start_at}')">${new Date(x.start_at).toLocaleTimeString(lang==='ar'?'ar-SA':'en-US',{hour:'2-digit',minute:'2-digit'})}</button>`).join(''):`<div class="book1401-warn">${book140L('لا توجد أوقات متاحة بهذا الاختيار.','No available times for this selection.')}</div>`;
}
function book1401ChooseSlot(v){book1401SelectedSlot=v;document.querySelectorAll('#book1401Slots .book1401-slot').forEach(b=>b.classList.remove('selected'));event?.currentTarget?.classList.add('selected')}

book140SaveReservation=async function(id){
  if(!book1401SelectedSlot)return taskyToast(book140L('اختر وقتًا متاحًا','Choose an available time'),{tone:'warning'});
  const name=document.getElementById('book140CustName')?.value.trim()||'';
  if(!name)return taskyToast(book140L('أدخل اسم العميل','Enter customer name'),{tone:'warning'});
  const p={
    reservation_id:id||null,customer_name:name,
    customer_phone:document.getElementById('book140CustPhone')?.value.trim()||null,
    service_id:document.getElementById('book140Service')?.value,
    location_id:document.getElementById('book140Location')?.value||null,
    resource_id:document.getElementById('book140Resource')?.value||null,
    staff_id:document.getElementById('book140Staff')?.value||null,
    start_at:book1401SelectedSlot,
    party_size:Number(document.getElementById('book140Party')?.value||1),
    customer_notes:document.getElementById('book140Notes')?.value.trim()||null,
    internal_notes:document.getElementById('book140InternalNotes')?.value.trim()||null
  };
  const {data,error}=await sb.rpc('tasky_booking_reservation_save_v140',{p_workspace_id:currentWorkspaceId,p_payload:p});
  if(error)return showTaskyDialog({title:book140L('تعذّر حفظ الحجز','Could not save booking'),message:error.message,tone:'error'});
  closeAddModal();await book140Fetch();taskyToast(`${book140L('تم الحفظ','Saved')} ${data?.reference_no||''}`,{tone:'success'});
};

/* Resource maintenance/block flow was missing in the V140 UI. */
function book1401OpenBlock(resourceId){
  book140Modal(book140L('صيانة / حظر مورد','Maintenance / resource block'),`<div class="book140-form">
    <div class="book140-field"><label>${book140L('من','From')}</label><input type="datetime-local" id="book1401BlockStart"></div>
    <div class="book140-field"><label>${book140L('إلى','To')}</label><input type="datetime-local" id="book1401BlockEnd"></div>
    <div class="book140-field full"><label>${book140L('السبب','Reason')}</label><input id="book1401BlockReason"></div>
    <div class="book140-field full"><button class="book140-btn primary" onclick="book1401SaveBlock('${resourceId}')">${book140L('حفظ الحظر','Save block')}</button></div>
  </div>`);
}
async function book1401SaveBlock(resourceId){
  const a=document.getElementById('book1401BlockStart').value,b=document.getElementById('book1401BlockEnd').value;
  if(!a||!b)return;
  const {error}=await sb.rpc('tasky_booking_block_v1401',{p_workspace_id:currentWorkspaceId,p_resource_id:resourceId,p_start_at:new Date(a).toISOString(),p_end_at:new Date(b).toISOString(),p_reason:document.getElementById('book1401BlockReason').value.trim()||null});
  if(error)return taskyToast(error.message,{tone:'warning'});closeAddModal();await book140Fetch();
}

/* Public booking now uses location + server-calculated availability slots. */
book140OpenPublicPreview=async function(){
  const slug=book140State?.settings?.public_slug;
  if(!slug)return showTaskyDialog({title:book140L('الرابط العام غير مفعّل','Public link is not configured'),message:book140L('حدد Public slug من الإعدادات أولًا.','Set a public slug in Settings first.'),tone:'warning'});
  const {data,error}=await sb.rpc('tasky_public_booking_catalog_v1401',{p_public_slug:slug});
  if(error)return taskyToast(error.message,{tone:'warning'});
  book140PublicCatalog=data||{};book140PublicDraft={};book1401PublicLocation='';book140RenderPublic();
};
book140RenderPublic=function(){
  let el=document.getElementById('book140Public');if(!el){el=document.createElement('div');el.id='book140Public';el.className='book140-public';document.body.appendChild(el)}
  const c=book140PublicCatalog||{};
  el.innerHTML=`<div class="book140-public-shell"><div class="book140-public-head"><div><h2>${escapeHtml(c.display_name||book140L('الحجز','Booking'))}</h2><p>${escapeHtml(c.public_intro||book140L('اختر الخدمة والموعد المناسب','Choose a service and suitable time'))}</p></div><button class="book140-btn" onclick="document.getElementById('book140Public').classList.remove('show')">×</button></div>
  ${(c.locations||[]).length?`<h3 style="font-size:11px">${book140L('اختر الفرع','Choose location')}</h3><div class="book1401-public-locations"><button class="book1401-public-option ${!book1401PublicLocation?'selected':''}" onclick="book1401PublicLocation='';book140RenderPublic()">${book140L('أي فرع','Any location')}</button>${c.locations.map(l=>`<button class="book1401-public-option ${book1401PublicLocation===l.id?'selected':''}" onclick="book1401PublicLocation='${l.id}';book140RenderPublic()"><b>${escapeHtml(l.name)}</b><br><small>${escapeHtml([l.city,l.address].filter(Boolean).join(' · '))}</small></button>`).join('')}</div>`:''}
  <h3 style="font-size:11px;margin-top:14px">${book140L('اختر الخدمة','Choose service')}</h3><div class="book140-cards">${(c.services||[]).map(s=>`<button class="book140-card" style="text-align:start" onclick="book140PublicForm('${s.id}')"><h4>${escapeHtml(s.name)}</h4><p>${escapeHtml(s.description||'')}<br>${Number(s.duration_minutes||0)} ${book140L('دقيقة','min')} · ${book140Money(s.base_price)}</p></button>`).join('')}</div></div>`;
  el.classList.add('show');
};
book140PublicForm=function(serviceId){
  const el=document.getElementById('book140Public');
  el.innerHTML=`<div class="book140-public-shell"><div class="book140-public-head"><h2>${book140L('اختر الموعد','Choose time')}</h2><button class="book140-btn" onclick="book140RenderPublic()">‹</button></div><div class="book140-form">
    <div class="book140-field"><label>${book140L('التاريخ','Date')}</label><input type="date" id="book140PubDate" value="${new Date().toISOString().slice(0,10)}" onchange="book1401LoadPublicSlots('${serviceId}')"></div>
    <div class="book140-field"><label>${book140L('عدد الأشخاص','Party size')}</label><input type="number" min="1" value="1" id="book140PubParty" onchange="book1401LoadPublicSlots('${serviceId}')"></div>
    <div class="book140-field full"><label>${book140L('الأوقات المتاحة','Available times')}</label><div id="book140PubSlots" class="book1401-slots"></div></div>
    <div class="book140-field"><label>${book140L('الاسم','Name')}</label><input id="book140PubName"></div>
    <div class="book140-field"><label>${book140L('الجوال','Phone')}</label><input id="book140PubPhone" inputmode="tel" placeholder="+9665XXXXXXXX"></div>
    <div class="book140-field full"><label>${book140L('ملاحظات — اختياري','Notes — optional')}</label><textarea id="book140PubNotes"></textarea></div>
    <div class="book140-field full"><button class="book140-btn primary" onclick="book140PublicSubmit('${serviceId}')">${book140L('تأكيد الحجز','Confirm booking')}</button></div>
  </div></div>`;
  book1401SelectedSlot='';setTimeout(()=>book1401LoadPublicSlots(serviceId),40);
};
async function book1401LoadPublicSlots(serviceId){
  const host=document.getElementById('book140PubSlots');if(!host)return;
  host.innerHTML=`<div class="book1401-inline-note">${book140L('جارٍ حساب التوفر…','Checking availability…')}</div>`;
  const {data,error}=await sb.rpc('tasky_public_booking_slots_v1401',{
    p_public_slug:book140State.settings.public_slug,p_service_id:serviceId,
    p_date:document.getElementById('book140PubDate').value,
    p_location_id:book1401PublicLocation||null,
    p_party_size:Number(document.getElementById('book140PubParty').value||1)
  });
  if(error){host.innerHTML=`<div class="book1401-warn">${escapeHtml(error.message)}</div>`;return}
  const rows=Array.isArray(data)?data:[];
  host.innerHTML=rows.length?rows.map(x=>`<button type="button" class="book1401-slot" onclick="book1401ChoosePublicSlot('${x.start_at}',this)">${new Date(x.start_at).toLocaleTimeString(lang==='ar'?'ar-SA':'en-US',{hour:'2-digit',minute:'2-digit'})}</button>`).join(''):`<div class="book1401-warn">${book140L('لا توجد أوقات متاحة في هذا اليوم.','No available times on this date.')}</div>`;
}
function book1401ChoosePublicSlot(v,btn){book1401SelectedSlot=v;document.querySelectorAll('#book140PubSlots .book1401-slot').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected')}
book140PublicSubmit=async function(serviceId){
  if(!book1401SelectedSlot)return taskyToast(book140L('اختر وقتًا متاحًا','Choose an available time'),{tone:'warning'});
  const name=document.getElementById('book140PubName').value.trim(),phone=document.getElementById('book140PubPhone').value.trim();
  if(!name||!phone)return taskyToast(book140L('أدخل الاسم والجوال','Enter name and phone'),{tone:'warning'});
  const {data,error}=await sb.rpc('tasky_public_booking_create_v1401',{p_public_slug:book140State.settings.public_slug,p_payload:{
    service_id:serviceId,location_id:book1401PublicLocation||null,customer_name:name,customer_phone:phone,
    start_at:book1401SelectedSlot,party_size:Number(document.getElementById('book140PubParty').value||1),
    customer_notes:document.getElementById('book140PubNotes').value.trim()||null
  }});
  if(error)return taskyToast(error.message,{tone:'warning'});
  document.getElementById('book140Public').innerHTML=`<div class="book140-public-shell"><div class="book140-empty"><b style="display:block;font-size:14px;margin-bottom:5px">${book140L('تم استلام الحجز','Booking received')}</b>${book140L('رقم الحجز','Reference')}: ${escapeHtml(data?.reference_no||'')}<br><small>${escapeHtml(book140Status(data?.status||'confirmed'))}</small></div></div>`;
  book140Fetch();
};

/* Realtime now refreshes catalog/config changes too. */
book140InitRealtime=function(){
  if(book140Realtime){try{sb.removeChannel(book140Realtime)}catch(_){}}
  if(!currentWorkspaceId)return;
  book140Realtime=sb.channel(`tasky-bookings-v1401-${currentWorkspaceId}`);
  ['tasky_booking_reservations_v140','tasky_booking_waitlist_v140','tasky_booking_queue_v140','tasky_booking_services_v140','tasky_booking_resources_v140','tasky_booking_staff_v140','tasky_booking_locations_v140','tasky_booking_blocks_v140']
    .forEach(table=>book140Realtime.on('postgres_changes',{event:'*',schema:'public',table,filter:`workspace_id=eq.${currentWorkspaceId}`},()=>setTimeout(book140Fetch,120)));
  book140Realtime.subscribe();
};

