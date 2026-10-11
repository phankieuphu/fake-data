// Progressive enhancement for the server-rendered docs: copy buttons, JSON
// highlighting, snippet tabs, the request playground and the schema generator.
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  // API origin: same as the page, unless the docs are hosted separately (Vercel).
  const ORIGIN = (document.querySelector('meta[name="api-base"]')?.content || location.origin).replace(/\/+$/, '');

  const store = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
    },
  };

  const escapeHtml = (text) =>
    text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  // ---------- toast + clipboard ----------
  let toastTimer;
  function toast(message) {
    let el = $('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.append(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    toast('Copied to clipboard');
  }

  // ---------- JSON highlighting + copy buttons ----------
  function highlightJson(text) {
    return escapeHtml(text).replace(
      /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
      (match, str, colon, literal) => {
        if (str) return colon ? `<span class="tok-key">${str}</span>${colon}` : `<span class="tok-str">${str}</span>`;
        if (literal) return `<span class="tok-lit">${match}</span>`;
        return `<span class="tok-num">${match}</span>`;
      },
    );
  }

  function enhanceCode(root = document) {
    for (const pre of $$('pre[data-copy]', root)) {
      if (pre.dataset.enhanced) continue;
      pre.dataset.enhanced = '1';
      const code = $('code', pre) || pre;
      if (pre.classList.contains('json') && code.textContent.length < 300_000) {
        code.innerHTML = highlightJson(code.textContent);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-btn';
      button.textContent = pre.classList.contains('json') ? 'Copy JSON' : 'Copy';
      button.addEventListener('click', () => {
        copy(code.textContent);
        button.classList.add('done');
        button.textContent = 'Copied';
        setTimeout(() => {
          button.classList.remove('done');
          button.textContent = pre.classList.contains('json') ? 'Copy JSON' : 'Copy';
        }, 1400);
      });
      pre.append(button);
    }
  }

  function codeBlock(text, label, json = false) {
    const pre = document.createElement('pre');
    pre.className = json ? 'code json' : 'code';
    pre.dataset.copy = '';
    pre.dataset.label = label;
    const code = document.createElement('code');
    code.textContent = text;
    pre.append(code);
    return pre;
  }

  // ---------- snippet tabs ----------
  const SNIPPETS = [
    ['fetch', 'fetch', (u) => `const res = await fetch('${u}');\nconst data = await res.json();\nconsole.log(data);`],
    ['curl', 'curl', (u) => `curl '${u}'`],
    ['axios', 'axios', (u) => `import axios from 'axios';\n\nconst { data } = await axios.get('${u}');`],
    ['python', 'Python', (u) => `import requests\n\ndata = requests.get('${u}').json()\nprint(data)`],
  ];

  function selectTab(group, id) {
    for (const tab of $$('[data-tab]', group)) tab.setAttribute('aria-selected', String(tab.dataset.tab === id));
    for (const panel of $$('[data-panel]', group)) panel.hidden = panel.dataset.panel !== id;
  }

  function applyPreferredTab(root = document) {
    const preferred = store.get('snippet-tab');
    if (!preferred) return;
    for (const group of $$('[data-tabs]', root)) {
      if ($(`[data-tab="${preferred}"]`, group)) selectTab(group, preferred);
    }
  }

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-tab]');
    if (tab) {
      store.set('snippet-tab', tab.dataset.tab);
      for (const group of $$('[data-tabs]')) {
        if ($(`[data-tab="${tab.dataset.tab}"]`, group)) selectTab(group, tab.dataset.tab);
      }
      return;
    }
    const copyText = event.target.closest('[data-copy-text]');
    if (copyText) copy(copyText.dataset.copyText);
  });

  function renderSnippets(container, url) {
    const group = document.createElement('div');
    group.className = 'tabs';
    group.dataset.tabs = '';
    const list = document.createElement('div');
    list.className = 'tablist';
    list.setAttribute('role', 'tablist');
    group.append(list);
    SNIPPETS.forEach(([id, label, make], i) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.dataset.tab = id;
      tab.setAttribute('aria-selected', String(i === 0));
      tab.textContent = label;
      list.append(tab);
      const panel = document.createElement('div');
      panel.setAttribute('role', 'tabpanel');
      panel.dataset.panel = id;
      panel.hidden = i !== 0;
      panel.append(codeBlock(make(url), label));
      group.append(panel);
    });
    container.replaceChildren(group);
    enhanceCode(container);
    applyPreferredTab(container);
  }

  function fillLocales(select, locales) {
    for (const locale of locales) select.add(new Option(locale, locale, false, locale === 'en'));
  }

  function formatBytes(bytes) {
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  }

  // ---------- playground ----------
  function initPlayground(form) {
    const resources = JSON.parse(form.dataset.resources);
    const locales = JSON.parse(form.dataset.locales);
    const byName = Object.fromEntries(resources.map((r) => [r.name, r]));
    const f = form.elements;
    const section = form.closest('section');
    const output = $('[data-output]', section);
    const status = $('[data-status]', section);
    const timing = $('[data-timing]', section);
    const snippetBox = $('[data-playground-snippets]', section);
    let last = { text: '', type: 'application/json', name: 'response.json' };

    for (const r of resources) f.resource.add(new Option(r.name, r.name));
    fillLocales(f.locale, locales);

    const params = new URLSearchParams(location.search);
    if (byName[params.get('resource')]) f.resource.value = params.get('resource');
    else f.resource.value = 'users';
    if (!params.get('resource')) f.limit.value = '3';

    function syncChildren() {
      const children = byName[f.resource.value].children;
      f.child.replaceChildren(...children.map((c) => new Option(c, c)));
      const nestedOption = [...f.mode.options].find((o) => o.value === 'nested');
      nestedOption.disabled = children.length === 0;
      if (f.mode.value === 'nested' && !children.length) f.mode.value = 'list';
      f.id.max = byName[f.resource.value].total;
    }

    function syncVisibility() {
      for (const label of $$('[data-show]', form)) {
        label.hidden = !label.dataset.show.split(' ').includes(f.mode.value);
      }
    }

    function buildUrl() {
      const mode = f.mode.value;
      const r = f.resource.value;
      let path = `/api/${r}`;
      if (mode === 'item') path += `/${f.id.value || 1}`;
      if (mode === 'nested') path += `/${f.id.value || 1}/${f.child.value}`;
      if (mode === 'random') path += '/random';
      if (mode === 'export') path += '/export';
      const q = new URLSearchParams();
      const add = (name, show) => {
        if (show.includes(mode) && f[name].value.trim()) q.set(name, f[name].value.trim());
      };
      add('page', ['list', 'nested']);
      add('limit', ['list', 'nested']);
      add('count', ['random', 'export']);
      add('seed', ['list', 'item', 'nested', 'random', 'export']);
      if (f.locale.value !== 'en') q.set('locale', f.locale.value);
      if (['list', 'nested', 'export'].includes(mode) && f.format.value !== 'json') q.set('format', f.format.value);
      add('fields', ['list', 'item', 'nested', 'random', 'export']);
      const qs = q.toString().replace(/%2C/g, ',');
      return `${ORIGIN}${path}${qs ? `?${qs}` : ''}`;
    }

    function update() {
      f.url.value = buildUrl();
      renderSnippets(snippetBox, f.url.value);
    }

    async function send() {
      const url = buildUrl();
      status.className = '';
      status.textContent = 'Loading…';
      timing.textContent = '';
      const started = performance.now();
      try {
        const res = await fetch(url);
        const text = await res.text();
        const type = res.headers.get('content-type') || '';
        const ms = Math.round(performance.now() - started);
        status.className = res.ok ? 'ok' : 'err';
        status.textContent = `${res.status} ${res.statusText || (res.ok ? 'OK' : 'Error')}`;
        timing.textContent = `${ms} ms · ${formatBytes(new Blob([text]).size)}`;
        const isJson = type.includes('json');
        const pretty = isJson ? JSON.stringify(JSON.parse(text), null, 2) : text;
        const ext = isJson ? 'json' : type.includes('csv') ? 'csv' : 'sql';
        last = { text: pretty, type: type.split(';')[0] || 'text/plain', name: `${f.resource.value}.${ext}` };
        output.replaceChildren(codeBlock(pretty, isJson ? 'Response' : ext.toUpperCase(), isJson));
        enhanceCode(output);
      } catch (error) {
        status.className = 'err';
        status.textContent = `Request failed: ${error.message}`;
      }
    }

    form.addEventListener('input', (event) => {
      if (event.target === f.resource) syncChildren();
      if (event.target === f.mode) syncVisibility();
      update();
    });
    form.addEventListener('change', update);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      send();
    });
    $('[data-copy-url]', form).addEventListener('click', () => copy(f.url.value));
    $('[data-download]', section).addEventListener('click', () => {
      if (!last.text) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([last.text], { type: last.type }));
      link.download = last.name;
      link.click();
      URL.revokeObjectURL(link.href);
    });

    syncChildren();
    syncVisibility();
    update();
    if (params.get('resource')) send();
  }

  // ---------- generator ----------
  function initGenerator(form, locales) {
    const f = form.elements;
    const section = form.closest('section');
    const output = $('[data-output]', section);
    const snippet = $('[data-generator-snippet]', section);
    fillLocales(f.locale, locales);

    async function run() {
      let schema;
      try {
        schema = JSON.parse(f.schema.value);
      } catch (error) {
        output.replaceChildren(codeBlock(`Invalid JSON: ${error.message}`, 'Error'));
        enhanceCode(output);
        return;
      }
      const body = { count: Number(f.count.value) || 3, schema };
      if (f.seed.value.trim()) body.seed = f.seed.value.trim();
      if (f.locale.value !== 'en') body.locale = f.locale.value;

      const res = await fetch(`${ORIGIN}/api/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      output.replaceChildren(codeBlock(JSON.stringify(data, null, 2), res.ok ? 'Result' : 'Error', true));

      const curl = `curl -X POST '${ORIGIN}/api/generate' \\\n  -H 'content-type: application/json' \\\n  -d '${JSON.stringify(body)}'`;
      const blocks = [codeBlock(curl, 'curl')];
      const flat = Object.values(schema).every((v) => typeof v === 'string');
      if (flat) {
        const q = new URLSearchParams({ count: String(body.count), ...(body.seed ? { seed: body.seed } : {}), ...(body.locale ? { locale: body.locale } : {}), ...schema });
        blocks.unshift(codeBlock(`${ORIGIN}/api/generate?${q}`, 'GET URL'));
      }
      snippet.replaceChildren(...blocks);
      snippet.style.display = 'grid';
      snippet.style.gap = '10px';
      enhanceCode(section);
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      run();
    });
    run();
  }

  // ---------- boot ----------
  enhanceCode();
  applyPreferredTab();
  const playground = $('[data-playground]');
  if (playground) initPlayground(playground);
  const generator = $('[data-generator]');
  if (generator) initGenerator(generator, JSON.parse(playground?.dataset.locales || '["en"]'));
})();
