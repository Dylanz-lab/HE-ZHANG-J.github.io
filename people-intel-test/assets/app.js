'use strict';
(() => {
  const t = JSON.parse(document.getElementById('pageData').textContent);
  const $ = id => document.getElementById(id);
  const root = new URL(document.body.dataset.root || './', document.baseURI);
  const typeTune = document.createElement('link');
  typeTune.rel = 'stylesheet'; typeTune.href = new URL('assets/type-tune.css?v=0.3.3', root).href; document.head.appendChild(typeTune);
  const params = new URLSearchParams(location.search);
  const qa = params.get('qa') === '1';
  const isFile = document.body.dataset.offline === '1' || ['file:', 'about:'].includes(location.protocol);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let config = { mode: 'preview', waitlistEnabled: false, analyticsEnabled: false, apiBase: '', contactEmail: '' };
  let selected = 'profile';
  let session = null;
  let submitting = false;
  let formIsLive = false;
  const consentKey = 'veriscope-v3-usage-consent';
  let consent = readStorage('localStorage', consentKey) || 'unset';
  const privacySignal = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const seen = new Set();
  const diagnostic = { version: '0.3', mode: 'preview', collection: 'not-connected', qa, events: [] };
  window.veriscope = diagnostic;
  function readStorage(store, key) { try { return window[store].getItem(key); } catch (_) { return null; } }
  function writeStorage(store, key, value) { try { window[store].setItem(key, value); } catch (_) {} }
  const allowedUtm = ['utm_source','utm_medium','utm_campaign','utm_content'];
  const attribution = {};
  allowedUtm.forEach(k => { const v = params.get(k); if (v && /^[a-zA-Z0-9_-]{1,60}$/.test(v)) attribution[k] = v; });
  // Preserve only safe campaign labels, not arbitrary query strings or personal data.
  document.querySelectorAll('[data-language]').forEach(link => {
    const u = new URL(link.getAttribute('href'), document.baseURI);
    Object.entries(attribution).forEach(([k,v]) => u.searchParams.set(k,v));
    if (qa) u.searchParams.set('qa','1');
    link.href = u.href;
  });
  if (params.get('market') === 'jp' && t.locale !== 'ja' && !isFile) {
    const url = new URL('ja/', root); Object.entries(attribution).forEach(([k,v]) => url.searchParams.set(k,v));
    if (qa) url.searchParams.set('qa','1'); location.replace(url.href); return;
  }
  function getSession() {
    if (session) return session;
    let previous = null;
    try { previous = JSON.parse(readStorage('sessionStorage', 'veriscope-v3-session')); } catch (_) {}
    if (previous && Date.now() - previous.time < 30 * 60 * 1000 && /^[a-f0-9-]{36}$/.test(previous.id)) session = previous.id;
    else session = crypto.randomUUID();
    writeStorage('sessionStorage', 'veriscope-v3-session', JSON.stringify({id:session,time:Date.now()}));
    return session;
  }
  function endpoint(path) { return new URL(path, config.apiBase ? new URL(config.apiBase, location.href) : root); }
  function track(name, properties = {}, once = false) {
    const key = name + ':' + JSON.stringify(properties);
    if (once && seen.has(key)) return; seen.add(key);
    const event = { event: name, properties, locale: t.locale, version: '0.3', attribution };
    // This diagnostic log contains no input values and lives only in this tab.
    diagnostic.events.push({ ...event, sent:false });
    if (diagnostic.events.length > 250) diagnostic.events.shift();
    if (!config.analyticsEnabled || consent !== 'granted' || privacySignal || qa || isFile) return;
    const log = diagnostic.events[diagnostic.events.length-1];
    fetch(endpoint('api/events'), {
      method:'POST', credentials:'omit', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...event,session_id:getSession()}), keepalive:true
    }).then(async r => { if (!r.ok) throw Error('rejected'); const j=await r.json(); if (!j.ok) throw Error('rejected'); log.sent=true; diagnostic.collection='connected'; })
      .catch(() => { diagnostic.collection='collection-error'; });
  }
  function show(id) { const d=$(id); if (!d.open) d.showModal(); }
  function close(id) { $(id).close(); }
  function activateDemo(position) {
    track('demo_start',{position},true);
    const app=$('demoApp'); app.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
    app.classList.remove('start-glow'); requestAnimationFrame(()=>app.classList.add('start-glow'));
    app.focus({preventScroll:true});
  }
  function selectSource(id, userAction = true) {
    const source=t.sources.find(x=>x.id===id); if (!source) return;
    selected=id;
    document.querySelectorAll('[data-source]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.source===id)));
    const map={detailLabel:'label',detailTitle:'heading',detailBody:'body',detailImageUse:'imageUse',detailName:'displayName',detailNext:'next'};
    Object.entries(map).forEach(([el,key])=>$(el).textContent=source[key]);
    if (userAction) track('source_select',{source:id},true);
  }
  document.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>activateDemo(b.dataset.start)));
  document.querySelectorAll('[data-source]').forEach(b=>b.addEventListener('click',()=>{track('demo_start',{position:'source-list'},true);selectSource(b.dataset.source);}));
  document.querySelectorAll('[data-jump-source]').forEach(b=>b.addEventListener('click',()=>{selectSource(b.dataset.jumpSource);activateDemo('source-card');}));
  $('openSource').addEventListener('click',()=>{
    const s=t.sources.find(x=>x.id===selected);
    $('sourceAddress').textContent=s.domain;
    $('sourcePageTitle').textContent=s.pageTitle;
    $('sourcePageHeading').textContent=s.pageHeading;
    $('sourcePageBody').textContent=s.pageBody;
    track('source_open',{source:selected},true); show('sourceDialog');
  });
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>close(b.dataset.close)));
  document.querySelectorAll('dialog').forEach(d=>{
    d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});
    d.addEventListener('close',()=>{if(d.id==='joinDialog'){ $('joinForm').reset(); $('formStatus').hidden=true; }});
  });
  function configureForm() {
    if ($('joinDialog').open) return formIsLive;
    const live=config.mode==='live' && config.waitlistEnabled && !!config.contactEmail;
    document.body.classList.toggle('live-ready',live);
    $('formNotice').textContent=live?t.livebanner:t.previewbanner;
    $('consentText').textContent=live?t.consent:t.previewconsent;
    $('joinSubmit').textContent=live?t.livesubmit:t.joinbtn;
    $('email').placeholder=live?t.emailexample:'demo@example.com';
    $('email').autocomplete=live?'email':'off';
    diagnostic.mode=live?'live':'preview';
    if(config.contactEmail){
      $('contactNotice').hidden=false;
      const lead=t.locale==='ja'?'登録の削除・お問い合わせ: ':'Signup removal and questions: ';
      $('contactNotice').textContent=lead+config.contactEmail;
    }
    return live;
  }
  $('joinOpen').addEventListener('click',()=>{
    formIsLive=configureForm(); $('joinFields').hidden=false; $('joinSuccess').hidden=true; $('formStatus').hidden=true;
    track(diagnostic.mode==='live'?'signup_open':'form_preview_open',{plan:t.locale==='ja'?'jpy_980':'usd_7_99'},true);
    $('joinDialog').setAttribute('aria-labelledby','joinTitle'); show('joinDialog');
  });
  $('joinForm').addEventListener('submit',async e=>{
    e.preventDefault(); if(submitting || !$('joinForm').reportValidity())return;
    if($('website').value)return;
    const live=formIsLive;
    if(!live){
      $('email').value=''; $('joinFields').hidden=true; $('joinSuccess').hidden=false;
      $('successTitle').textContent=t.previewdone; $('successBody').textContent=t.previewdonebody;
      $('joinDialog').setAttribute('aria-labelledby','successTitle'); $('successTitle').tabIndex=-1; $('successTitle').focus();
      track('form_preview_complete',{},true); return;
    }
    submitting=true; $('joinSubmit').disabled=true; $('joinSubmit').textContent=t.loading;
    $('formStatus').hidden=true;
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),12000);
    try {
      const response=await fetch(endpoint('api/waitlist'),{
        method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},signal:controller.signal,
        body:JSON.stringify({email:$('email').value.trim(),purpose:$('purpose').value,locale:t.locale,consent:$('emailConsent').checked,consent_version:'v0.3-launch-only',plan:t.locale==='ja'?'jpy_980':'usd_7_99',website:''})
      });
      const result=await response.json();
      if(!response.ok||result.ok!==true||result.saved!==true)throw Error('not-saved');
      $('email').value=''; $('joinFields').hidden=true; $('joinSuccess').hidden=false;
      $('successTitle').textContent=t.success; $('successBody').textContent=t.successbody;
      $('joinDialog').setAttribute('aria-labelledby','successTitle'); $('successTitle').tabIndex=-1; $('successTitle').focus();
      track('signup_complete',{plan:t.locale==='ja'?'jpy_980':'usd_7_99'},true);
    } catch(_) {
      $('formStatus').hidden=false; $('formStatus').className='form-status error'; $('formStatus').textContent=t.error;
      track('signup_error',{},false);
    } finally {clearTimeout(timer);submitting=false; $('joinSubmit').disabled=false;$('joinSubmit').textContent=formIsLive?t.livesubmit:t.joinbtn;}
  });
  $('privacyOpen').addEventListener('click',()=>show('privacyDialog'));
  function openMeasurement() {
    $('consentPanel').hidden=false;
    $('measureText').textContent=config.analyticsEnabled&&!privacySignal?t.measurebody:t.off;
    $('analyticsAllow').hidden=!config.analyticsEnabled||privacySignal;
  }
  $('measurementOpen').addEventListener('click',openMeasurement);
  $('analyticsDeny').addEventListener('click',()=>{
    consent='denied';writeStorage('localStorage',consentKey,consent);session=null;
    try{sessionStorage.removeItem('veriscope-v3-session');}catch(_){}
    $('consentPanel').hidden=true;
  });
  $('analyticsAllow').addEventListener('click',()=>{
    consent='granted';writeStorage('localStorage',consentKey,consent);$('consentPanel').hidden=true;
    // Start only from consent onwards. Earlier demo events are NOT backfilled.
    track('page_view',{entry:'consent'},false);
  });
  if('IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){track(e.target.id==='launch'?'pricing_view':'demo_view',{},true);observer.unobserve(e.target);}});},{threshold:0.35});
    observer.observe($('launch'));observer.observe($('demoApp'));
  }
  async function init(){
    if(!isFile){
      try{const r=await fetch(new URL('config.json',root),{cache:'no-store',credentials:'omit'});if(r.ok){const c=await r.json();if(c.version==='0.3')config={...config,...c};}}catch(_){}
    }
    if(qa){config.analyticsEnabled=false;config.waitlistEnabled=false;config.mode='preview';}
    configureForm();diagnostic.collection=config.analyticsEnabled?'awaiting-consent':'not-connected';
    track('page_view',{},false);
    if(config.analyticsEnabled&&consent==='unset'&&!privacySignal)openMeasurement();
  }
  init();
})();
