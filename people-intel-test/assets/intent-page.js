'use strict';
(() => {
  const body = document.body;
  const root = new URL(body.dataset.root || '../', document.baseURI);
  const theme = body.dataset.intentTheme || 'intent';
  const consentKey = 'veriscope-v3-usage-consent';
  const privacySignal = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const params = new URLSearchParams(location.search);
  const allowedUtm = ['utm_source','utm_medium','utm_campaign','utm_content'];
  const attribution = {};
  allowedUtm.forEach(k => {
    const v = params.get(k);
    if (v && /^[a-zA-Z0-9_-]{1,60}$/.test(v)) attribution[k] = v;
  });
  const read = (s,k) => { try { return window[s].getItem(k); } catch (_) { return null; } };
  const write = (s,k,v) => { try { window[s].setItem(k,v); } catch (_) {} };
  let consent = read('localStorage', consentKey) || 'unset';
  let config = null;
  let loadPromise = null;
  function id() {
    const v = String(config && config.analyticsMeasurementId || '').trim().toUpperCase();
    return /^G-[A-Z0-9]+$/.test(v) ? v : '';
  }
  function safeLocation() {
    const u = new URL(location.href); u.hash=''; u.search='';
    Object.entries(attribution).forEach(([k,v]) => u.searchParams.set(k,v));
    return u.href;
  }
  function ensureGa() {
    if (!config || !config.analyticsEnabled || consent !== 'granted' || privacySignal || !id()) return Promise.resolve(false);
    const mid=id(); window['ga-disable-'+mid]=false;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    if(loadPromise) return loadPromise;
    window.gtag('js',new Date());
    window.gtag('config',mid,{send_page_view:false,page_location:safeLocation(),allow_google_signals:false,allow_ad_personalization_signals:false});
    loadPromise=new Promise(resolve=>{
      const s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(mid);
      s.onload=()=>resolve(true); s.onerror=()=>{loadPromise=null;resolve(false)}; document.head.appendChild(s);
    });
    return loadPromise;
  }
  function track(name, props={}) {
    ensureGa().then(ok=>{
      if(!ok||!window.gtag)return;
      const payload={...props,landing_theme:theme,locale:document.documentElement.lang||'en'};
      Object.entries(attribution).forEach(([k,v])=>payload[k]=v);
      window.gtag('event',name,payload);
    });
  }
  function forwardLinks(){
    document.querySelectorAll('[data-forward]').forEach(a=>{
      const u=new URL(a.getAttribute('href'),document.baseURI);
      Object.entries(attribution).forEach(([k,v])=>u.searchParams.set(k,v));
      a.href=u.href;
      a.addEventListener('click',()=>track('landing_cta_click',{target:a.dataset.track||'demo'}));
    });
  }
  function panel(show){ const p=document.getElementById('intentConsent'); if(p) p.classList.toggle('show',!!show); }
  document.getElementById('intentAllow')?.addEventListener('click',()=>{consent='granted';write('localStorage',consentKey,consent);panel(false);track('page_view',{entry:'intent_consent'});});
  document.getElementById('intentDeny')?.addEventListener('click',()=>{consent='denied';write('localStorage',consentKey,consent);if(id())window['ga-disable-'+id()]=true;panel(false);});
  document.getElementById('intentMeasure')?.addEventListener('click',()=>panel(true));
  async function init(){
    try{const r=await fetch(new URL('config.json',root),{cache:'no-store',credentials:'omit'});if(r.ok)config=await r.json();}catch(_){}
    forwardLinks();
    if(config&&config.analyticsEnabled&&!privacySignal){
      if(consent==='granted')track('page_view',{entry:'intent'});
      else if(consent==='unset')panel(true);
    }
  }
  init();
})();
