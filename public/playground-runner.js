(() => {
  let activeChannel = '';
  let activeScriptUrl = '';

  const send = (level, message, line, source) => {
    globalThis.parent.postMessage({
      type: 'console',
      channel: activeChannel,
      level,
      message: String(message),
      line,
      source,
    }, '*');
  };

  for (const level of ['log', 'info', 'warn', 'error']) {
    globalThis.console[level] = (...values) => send(level, values.map((value) => {
      if (typeof value === 'string') return value;
      try { return JSON.stringify(value); } catch { return String(value); }
    }).join(' '));
  }

  globalThis.addEventListener('error', (event) => {
    send('error', event.message, event.lineno, event.filename);
  });

  globalThis.addEventListener('unhandledrejection', (event) => {
    send('error', event.reason instanceof Error ? event.reason.message : String(event.reason));
  });

  globalThis.addEventListener('message', (event) => {
    if (event.source !== globalThis.parent || event.data?.type !== 'run') return;
    const { channel, source } = event.data;
    if (typeof channel !== 'string' || !source || typeof source.html !== 'string'
      || typeof source.css !== 'string' || typeof source.javascript !== 'string') return;

    activeChannel = channel;
    globalThis.document.getElementById('playground-root').innerHTML = source.html;
    globalThis.document.getElementById('playground-style').textContent = source.css;

    if (activeScriptUrl) globalThis.URL.revokeObjectURL(activeScriptUrl);
    activeScriptUrl = globalThis.URL.createObjectURL(new globalThis.Blob(
      [`${source.javascript}\n//# sourceURL=zealrn-playground.js`],
      { type: 'text/javascript' },
    ));
    const script = globalThis.document.createElement('script');
    script.src = activeScriptUrl;
    globalThis.document.body.append(script);
  });

  globalThis.parent.postMessage({ type: 'ready' }, '*');
})();
