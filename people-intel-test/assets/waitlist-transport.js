'use strict';

var VeriScopeWaitlistTransport = (function () {
  var core = typeof module !== 'undefined'
    ? require('./waitlist-core.js')
    : VeriScopeWaitlistCore;
  var FIELD_NAMES = [
    'email',
    'interest',
    'locale',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'plan',
    'consent_version',
    'website',
  ];

  function isExecEndpoint(value) {
    try {
      var url = new URL(value);
      return url.protocol === 'https:' &&
        url.hostname === 'script.google.com' &&
        /\/exec$/.test(url.pathname);
    } catch (_) {
      return false;
    }
  }

  function isAppsScriptReceiptOrigin(value) {
    try {
      var url = new URL(value);
      return url.protocol === 'https:' &&
        (url.hostname === 'script.google.com' || /-script\.googleusercontent\.com$/.test(url.hostname));
    } catch (_) {
      return false;
    }
  }

  function isExpectedReceipt(event, iframe, requestId) {
    return !!event &&
      !!iframe &&
      isAppsScriptReceiptOrigin(event.origin) &&
      !!event.data &&
      event.data.request_id === requestId &&
      core.isReceipt(event.data);
  }

  function appendInput(form, name, value) {
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value || '');
    form.appendChild(input);
  }

  function submit(endpoint, fields) {
    if (!isExecEndpoint(endpoint)) return Promise.reject(new Error('invalid-waitlist-endpoint'));

    return new Promise(function (resolve, reject) {
      var requestId = crypto.randomUUID();
      var iframe = document.createElement('iframe');
      var form = document.createElement('form');
      var settled = false;
      var timer;

      function cleanup() {
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        iframe.removeEventListener('error', onFrameError);
        form.remove();
        iframe.remove();
      }

      function finish(error, result) {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error);
        else resolve(result);
      }

      function onMessage(event) {
        if (!isExpectedReceipt(event, iframe, requestId)) return;
        if (event.data.status === 'error') finish(new Error('waitlist-server-error'));
        else finish(null, event.data);
      }

      function onFrameError() {
        finish(new Error('waitlist-frame-error'));
      }

      iframe.name = 'veriscope-waitlist-' + requestId;
      iframe.hidden = true;
      iframe.setAttribute('aria-hidden', 'true');
      form.method = 'POST';
      form.action = endpoint;
      form.target = iframe.name;
      form.hidden = true;

      FIELD_NAMES.forEach(function (name) {
        appendInput(form, name, fields && fields[name]);
      });
      appendInput(form, 'request_id', requestId);
      appendInput(form, 'return_origin', location.origin);

      document.body.append(iframe, form);
      window.addEventListener('message', onMessage);
      iframe.addEventListener('error', onFrameError, { once: true });
      timer = setTimeout(function () {
        finish(new Error('waitlist-timeout'));
      }, 12000);

      try {
        form.submit();
      } catch (error) {
        finish(error);
      }
    });
  }

  return {
    isExecEndpoint: isExecEndpoint,
    isExpectedReceipt: isExpectedReceipt,
    submit: submit,
  };
}());

if (typeof module !== 'undefined') module.exports = VeriScopeWaitlistTransport;
