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
  let config = { mode: 'preview', waitlistEnabled: false, waitlistEndpoint: '', analyticsEnabled: false, analyticsMeasurementId: '', apiBase: '', contactEmail: '' };
  let selected = 'profile';
  let submitting = false;
  let formIsLive = false;
  let ga4LoadPromise = null;
  const consentKey = 'veriscope-v3-usage-consent';
  let consent = readStorage('localStorage', consentKey) || 'unset';
  const privacySignal = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const seen = new Set();
  const diagnostic = { version: '0.3.5', mode: 'preview', collection: 'not-connected', qa, events: [] };
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
  function measurementId() {
    const id = String(config.analyticsMeasurementId || '').trim().toUpperCase();
    return /^G-[A-Z0-9]+$/.test(id) ? id : '';
  }
  function sanitizedPageLocation() {
    const u = new URL(location.href);
    u.search = '';
    u.hash = '';
    Object.entries(attribution).forEach(([k,v]) => u.searchParams.set(k,v));
    return u.href;
  }
  function setGaDisabled(disabled) {
    const id = measurementId();
    if (id) window['ga-disable-' + id] = !!disabled;
  }
  function ensureGa4() {
    const id = measurementId();
    if (!config.analyticsEnabled || !id || consent !== 'granted' || privacySignal || qa || isFile) return Promise.resolve(false);
    setGaDisabled(false);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    if (ga4LoadPromise) return ga4LoadPromise;
    window.gtag('js', new Date());
    window.gtag('config', id, {
      send_page_view: false,
      page_location: sanitizedPageLocation(),
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    ga4LoadPromise = new Promise(resolve => {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
      script.onload = () => resolve(true);
      script.onerror = () => { ga4LoadPromise = null; resolve(false); };
      document.head.appendChild(script);
    });
    return ga4LoadPromise;
  }
  function ga4Params(properties) {
    const out = { ...properties, locale: t.locale, app_version: '0.3.5' };
    Object.entries(attribution).forEach(([k,v]) => { out[k] = v; });
    return out;
  }
  function track(name, properties = {}, once = false) {
    const key = name + ':' + JSON.stringify(properties);
    if (once && seen.has(key)) return; seen.add(key);
    const event = { event: name, properties, locale: t.locale, version: '0.3.5', attribution };
    // This diagnostic log contains no form input values and lives only in this tab.
    diagnostic.events.push({ ...event, sent:false });
    if (diagnostic.events.length > 250) diagnostic.events.shift();
    if (!config.analyticsEnabled || consent !== 'granted' || privacySignal || qa || isFile || !measurementId()) return;
    const log = diagnostic.events[diagnostic.events.length-1];
    ensureGa4().then(ok => {
      if (!ok || !window.gtag) { diagnostic.collection='collection-error'; return; }
      window.gtag('event', name, ga4Params(properties));
      log.sent = true;
      diagnostic.collection = 'ga4';
    }).catch(() => { diagnostic.collection='collection-error'; });
  }
  function updateMeasurementCopy() {
    if (!config.analyticsEnabled || !measurementId()) return;
    const privacyLead = document.querySelector('#privacyDialog .modal-body .lead');
    const faqDetails = Array.from(document.querySelectorAll('#faq details'));
    const measurementFaq = faqDetails.find(d => {
      const s = d.querySelector('summary');
      if (!s) return false;
      return t.locale === 'ja' ? s.textContent.includes('計測') || s.textContent.includes('情報') : s.textContent.includes('measure');
    });
    if (t.locale === 'ja') {
      if (privacyLead) privacyLead.textContent = 'この公開デモでは写真のアップロード、アカウント、決済は行いません。早期アクセス登録では、メールアドレス、選択した用途、言語、同意バージョン、提示プラン、キャンペーン情報のみを保存します。Google Analytics による任意の利用計測は「計測を許可」を選んだ後にだけ開始され、ページ操作、国レベルの地域、端末、流入元などを計測します。メールアドレス、写真、ファイル名、顔データは Analytics に送信しません。';
      if (measurementFaq) measurementFaq.querySelector('p').textContent = '別途同意した場合のみ、Google Analytics でページやデモの操作、国レベルの地域、端末、流入元を計測します。メールアドレス、写真、ファイル名、顔データは Analytics に送信しません。同意しない場合、これらの利用イベントは送信されません。';
    } else {
      if (privacyLead) privacyLead.textContent = 'This public demo does not accept photo uploads, accounts, or payments. Early-access signup stores only the email, selected purpose, language, consent version, offered plan, and safe campaign labels. Optional Google Analytics measurement starts only after you choose “Allow measurement”; it measures page interactions, coarse country, device, and traffic-source data. Email addresses, photos, filenames, and face data are never sent to Analytics.';
      if (measurementFaq) measurementFaq.querySelector('p').textContent = 'Only after your separate opt-in, Google Analytics measures page and demo interactions plus coarse country, device, and traffic source. It does not receive email addresses, photos, filenames, or face data. Without opt-in, these usage events are not sent.';
    }
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
    const live=config.mode==='live' && config.waitlistEnabled && !!config.contactEmail && !!window.VeriScopeWaitlistTransport && window.VeriScopeWaitlistTransport.isExecEndpoint(config.waitlistEndpoint);
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
    try {
      const result=await window.VeriScopeWaitlistTransport.submit(config.waitlistEndpoint,{
        email:$('email').value,
        interest:$('purpose').value,
        locale:t.locale,
        utm_source:attribution.utm_source||'',
        utm_medium:attribution.utm_medium||'',
        utm_campaign:attribution.utm_campaign||'',
        utm_content:attribution.utm_content||'',
        plan:t.locale==='ja'?'jpy_980':'usd_7_99',
        consent_version:'v0.3-waitlist',
        website:$('website').value
      });
      if(result.status!=='saved'&&result.status!=='duplicate')throw Error('not-saved');
      $('email').value=''; $('joinFields').hidden=true; $('joinSuccess').hidden=false;
      const duplicate=result.status==='duplicate';
      $('successTitle').textContent=duplicate?(t.locale==='ja'?'すでに公開案内に登録されています。':'You’re already on the early-access list.'):t.success;
      $('successBody').textContent=duplicate?(t.locale==='ja'?'このメールアドレスはすでに保存されています。重複した登録は追加されていません。':'This email is already saved. We did not add a duplicate signup.'):t.successbody;
      $('joinDialog').setAttribute('aria-labelledby','successTitle'); $('successTitle').tabIndex=-1; $('successTitle').focus();
      track(duplicate?'signup_duplicate':'signup_complete',{plan:t.locale==='ja'?'jpy_980':'usd_7_99'},true);
    } catch(_) {
      $('formStatus').hidden=false; $('formStatus').className='form-status error'; $('formStatus').textContent=t.error;
      track('signup_error',{},false);
    } finally {submitting=false; $('joinSubmit').disabled=false;$('joinSubmit').textContent=formIsLive?t.livesubmit:t.joinbtn;}
  });
  $('privacyOpen').addEventListener('click',()=>show('privacyDialog'));
  function openMeasurement() {
    $('consentPanel').hidden=false;
    const connected = config.analyticsEnabled && !!measurementId() && !privacySignal;
    $('measureText').textContent=connected?t.measurebody:t.off;
    $('analyticsAllow').hidden=!connected;
  }
  $('measurementOpen').addEventListener('click',openMeasurement);
  $('analyticsDeny').addEventListener('click',()=>{
    consent='denied';writeStorage('localStorage',consentKey,consent);setGaDisabled(true);
    diagnostic.collection='disabled-by-user';
    $('consentPanel').hidden=true;
  });
  $('analyticsAllow').addEventListener('click',()=>{
    consent='granted';writeStorage('localStorage',consentKey,consent);setGaDisabled(false);$('consentPanel').hidden=true;
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
    configureForm();updateMeasurementCopy();
    diagnostic.collection=config.analyticsEnabled&&measurementId()?(consent==='granted'?'starting-ga4':'awaiting-consent'):'not-connected';
    track('page_view',{},false);
    if(config.analyticsEnabled&&measurementId()&&consent==='unset'&&!privacySignal)openMeasurement();
    if(consent==='denied')setGaDisabled(true);
  }
  init();
})();
