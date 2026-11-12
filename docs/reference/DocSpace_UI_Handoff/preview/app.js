/* DocSpace UI preview. Mock data only; no backend. See UI_SPEC.md for the real integration points.
   URL flags for reviewing states:  ?state=loading|empty|error  (dashboard lists)
                                    ?save=error                 (editor save fails) */
const Q = new URLSearchParams(location.search);
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- icons (Lucide paths) ---------- */
const P = {
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  fileUp: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 12v6"/><path d="m15 15-3-3-3 3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"/>',
  bold: '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>',
  italic: '<line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/>',
  underline: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/>',
  ul: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  ol: '<path d="M10 12h11"/><path d="M10 18h11"/><path d="M10 6h11"/><path d="M4 10h2"/><path d="M4 6h1v4"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  chevUD: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  tri: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
  open: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  swap: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  menu: '<path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  retry: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
};
const I = (n, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
const LOGO = `<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><rect width="22" height="22" rx="6" fill="#18181b"/><path d="M7 5.5h5.2a4.8 4.8 0 0 1 0 9.6H7z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 16.5h8" stroke="#3451d1" stroke-width="1.8" stroke-linecap="round"/></svg>`;

/* ---------- mock data ---------- */
const USERS = {
  maya: { id: 'maya', name: 'Maya Chen', email: 'maya@docspace.dev', color: '#3451d1' },
  daniel: { id: 'daniel', name: 'Daniel Okafor', email: 'daniel@docspace.dev', color: '#0f766e' },
  priya: { id: 'priya', name: 'Priya Raman', email: 'priya@docspace.dev', color: '#9a3412' }
};
const byEmail = e => Object.values(USERS).find(u => u.email === e.trim().toLowerCase());
const initials = u => u.name.split(' ').map(s => s[0]).join('');
const av = (u, c = '') => `<span class="av ${c}" style="background:${u.color}" title="${esc(u.name)}">${initials(u)}</span>`;
const now = Date.now(), M = 60e3, H = 60 * M, Dd = 24 * H;
let DOCS = [
  { id: 'd1', title: 'Q4 Product Roadmap', owner: 'maya', shared: ['daniel'], at: now - 12 * M, html:
`<h1>Q4 Product Roadmap</h1><p>This quarter we focus on three outcomes: faster onboarding, reliable sharing, and a better writing experience. Everything below ties back to one of them.</p><h2>Goals</h2><ol><li>Cut time-to-first-document from 4 minutes to under 1 minute.</li><li>Reach 99.9% successful saves across all documents.</li><li>Ship text import so teams can bring existing notes.</li></ol><h2>Milestones</h2><ul><li><b>October:</b> new editor toolbar and keyboard shortcuts.</li><li><b>November:</b> sharing by email with owner and editor roles.</li><li><b>December:</b> .txt import and a refreshed dashboard.</li></ul><h3>Open questions</h3><p>Do we need <i>view-only</i> access this quarter, or can it wait until Q1? <u>Decision needed by October 20.</u></p>` },
  { id: 'd2', title: 'Engineering Team Meeting Notes', owner: 'daniel', shared: ['maya'], at: now - 2 * H, html:
`<h1>Engineering Team Meeting Notes</h1><p><b>Date:</b> Tuesday, November 10 · <b>Attendees:</b> Daniel, Maya, Priya</p><h2>Updates</h2><ul><li>Autosave now debounces at 800 ms; error rate is down to 0.2%.</li><li>Import handles files up to 1 MB; larger files show a clear error.</li></ul><h2>Action items</h2><ol><li>Daniel: add retry with backoff for failed saves.</li><li>Maya: review the sharing dialog copy.</li><li>Priya: write tests for the import parser.</li></ol>` },
  { id: 'd3', title: 'Customer Research Summary', owner: 'maya', shared: [], at: now - 26 * H, html:
`<h1>Customer Research Summary</h1><p>We interviewed 14 teams between September and October. Most write first drafts alone and share once the structure is clear.</p><h2>Key findings</h2><ul><li>Teams want sharing to be <b>one step</b>: type an email, done.</li><li>Formatting needs are modest: headings, lists, bold and italic cover 90% of use.</li><li>Lost work is the top fear. A visible save status builds trust.</li></ul>` },
  { id: 'd4', title: 'Project Launch Checklist', owner: 'priya', shared: ['maya', 'daniel'], at: now - 3 * Dd, html:
`<h1>Project Launch Checklist</h1><h2>Before launch</h2><ol><li>Confirm the demo accounts work end to end.</li><li>Run the import flow with a 900 KB file.</li><li>Check keyboard navigation on every screen.</li></ol><h2>Launch day</h2><ul><li>Post the announcement in #general.</li><li>Watch save error rates for the first two hours.</li></ul>` },
  { id: 'd5', title: 'Design System Guidelines', owner: 'maya', shared: ['priya'], at: now - 6 * Dd, html:
`<h1>Design System Guidelines</h1><p>One accent color, neutral surfaces, and 1px borders. Shadows are reserved for floating layers such as menus and dialogs.</p><h2>Typography</h2><ul><li>Interface text: Inter 14px.</li><li>Document body: Inter 16px with a 1.7 line height.</li><li>Headings: Inter Tight, semibold, tight tracking.</li></ul>` },
  { id: 'd6', title: 'Hiring Plan: Platform Team', owner: 'daniel', shared: [], at: now - 9 * Dd, html: `<h1>Hiring Plan: Platform Team</h1><p>Two senior engineers in Q1.</p>` }
];
const ago = t => { const d = Date.now() - t; if (d < M) return 'Just now'; if (d < H) return `${Math.round(d / M)} min ago`; if (d < Dd) return `${Math.round(d / H)} h ago`; if (d < 2 * Dd) return 'Yesterday'; return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };

/* ---------- state ---------- */
let me = null, view = 'docs', search = '', docId = null;
const app = $('#app');

/* ---------- toast ---------- */
function toast(msg, kind = 'ok', action) {
  const t = document.createElement('div'); t.className = 'toast' + (kind === 'err' ? ' err' : ''); t.setAttribute('role', 'status');
  t.innerHTML = `<span class="ti">${I(kind === 'err' ? 'alert' : 'checkCircle')}</span><span>${msg}</span>${action ? `<button>${action[0]}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { action[1](); t.remove() };
  $('#toasts').append(t); setTimeout(() => t.remove(), 4000);
}

/* ---------- menus & tooltips ---------- */
let openMenuEl = null;
function closeMenu() { openMenuEl?.remove(); openMenuEl = null }
function menu(anchor, html, onPick, align = 'left') {
  closeMenu(); tipEl?.remove(); tipEl = null; const m = document.createElement('div'); m.className = 'menu'; m.setAttribute('role', 'menu'); m.innerHTML = html; document.body.append(m);
  const r = anchor.getBoundingClientRect(); let x = align === 'right' ? r.right - m.offsetWidth : r.left; let y = r.bottom + 4;
  if (y + m.offsetHeight > innerHeight - 8) y = r.top - m.offsetHeight - 4;
  m.style.left = Math.max(8, Math.min(x, innerWidth - m.offsetWidth - 8)) + 'px'; m.style.top = y + 'px';
  m.onclick = e => { const b = e.target.closest('[data-a]'); if (b) { closeMenu(); onPick(b.dataset.a) } };
  m.querySelector('button')?.focus(); openMenuEl = m;
  m.onkeydown = e => { const bs = [...m.querySelectorAll('button')], i = bs.indexOf(document.activeElement); if (e.key === 'ArrowDown') { bs[(i + 1) % bs.length].focus(); e.preventDefault() } if (e.key === 'ArrowUp') { bs[(i - 1 + bs.length) % bs.length].focus(); e.preventDefault() } if (e.key === 'Escape') { closeMenu(); anchor.focus() } };
}
document.addEventListener('mousedown', e => { if (openMenuEl && !openMenuEl.contains(e.target) && !e.target.closest('[data-menu]')) closeMenu() });
let tipEl;
document.addEventListener('mousedown', () => { tipEl?.remove(); tipEl = null });
document.addEventListener('mouseover', e => { const t = e.target.closest('[data-tip]'); if (openMenuEl) return; tipEl?.remove(); tipEl = null; if (!t) return; tipEl = document.createElement('div'); tipEl.className = 'tip'; tipEl.innerHTML = esc(t.dataset.tip) + (t.dataset.kbd ? `<kbd>${t.dataset.kbd}</kbd>` : ''); document.body.append(tipEl); const r = t.getBoundingClientRect(); tipEl.style.left = Math.max(8, r.left + r.width / 2 - tipEl.offsetWidth / 2) + 'px'; tipEl.style.top = r.bottom + 6 + 'px' });

/* ---------- routing ---------- */
function go(h) { location.hash = h }
addEventListener('hashchange', route);
function route() {
  closeMenu(); tipEl?.remove();
  const h = location.hash.slice(1) || '/login';
  if (!me && h !== '/login') return go('/login');
  if (h === '/login') return renderLogin();
  if (h.startsWith('/doc/')) { docId = h.split('/')[2]; return renderEditor() }
  view = h === '/shared' ? 'shared' : 'docs'; renderShell();
}

/* ---------- login ---------- */
function renderLogin(state = {}) {
  app.innerHTML = `<main class="login"><div class="login-card">
  <div class="brand">${LOGO}DocSpace</div>
  <h1>Sign in to DocSpace</h1><p class="sub">Write, share and import documents.</p>
  ${state.err ? `<div class="alert danger" role="alert" style="margin-bottom:14px">${I('alert')}<span>That email and password don't match. Try again or use a demo account below.</span></div>` : ''}
  <form id="lf" novalidate>
    <div class="field"><label class="label" for="em">Email</label><input class="input${state.err ? ' err' : ''}" id="em" type="email" autocomplete="email" placeholder="you@company.com" value="${esc(state.email || '')}"></div>
    <div class="field"><label class="label" for="pw">Password</label><input class="input${state.err ? ' err' : ''}" id="pw" type="password" autocomplete="current-password" placeholder="••••••••"></div>
    <button class="btn btn-primary btn-lg btn-block" id="sb" type="submit">Sign in</button>
  </form>
  <div class="divider">Demo accounts for reviewers</div>
  <div class="demo-accts">${['maya', 'daniel'].map(k => `<button class="demo-acct" data-u="${k}">${av(USERS[k], 'md')}<div><b>${USERS[k].name}</b><span>${USERS[k].email} · demo1234</span></div><span class="go">${I('open', 'sm')}</span></button>`).join('')}</div>
  <p class="foot">Mock sign-in for the assessment preview.</p></div></main>`;
  $('#lf').onsubmit = e => { e.preventDefault(); signIn($('#em').value, $('#pw').value) };
  app.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { $('#em').value = USERS[b.dataset.u].email; $('#pw').value = 'demo1234'; signIn(USERS[b.dataset.u].email, 'demo1234') });
  if (!state.email) $('#em').focus();
}
function signIn(email, pw) {
  const b = $('#sb'); b.disabled = true; b.innerHTML = `${I('loader', 'spin')}Signing in…`;
  setTimeout(() => { const u = byEmail(email); if (!u || pw !== 'demo1234' || u.id === 'priya') return renderLogin({ err: 1, email }); me = u; go('/docs') }, 700);
}

/* ---------- shell + dashboard ---------- */
const mine = () => DOCS.filter(d => d.owner === me.id).sort((a, b) => b.at - a.at);
const sharedWithMe = () => DOCS.filter(d => d.shared.includes(me.id)).sort((a, b) => b.at - a.at);
function renderShell() {
  app.innerHTML = `<div class="app" id="shell">
  <aside class="sidebar" aria-label="Main navigation">
    <div class="brand">${LOGO}DocSpace</div>
    <button class="btn btn-primary btn-block new" id="newDoc">${I('plus')}New document</button>
    <nav class="nav">
      <a href="#/docs" class="${view === 'docs' ? 'on' : ''}" aria-current="${view === 'docs' ? 'page' : 'false'}">${I('file')}My documents<span class="count">${mine().length}</span></a>
      <a href="#/shared" class="${view === 'shared' ? 'on' : ''}" aria-current="${view === 'shared' ? 'page' : 'false'}">${I('users')}Shared with me<span class="count">${sharedWithMe().length}</span></a>
      <button id="navImport">${I('upload')}Import file</button>
    </nav>
    <div class="spacer"></div>
    <button class="me" id="meBtn" data-menu aria-haspopup="menu">${av(me, 'md')}<div><b>${me.name}</b><span>${me.email}</span></div><span class="chev">${I('chevUD', 'sm')}</span></button>
  </aside><div class="scrim" id="scrim"></div>
  <main class="main" id="main"><div class="mobile-bar"><button class="icon-btn" id="hamb" aria-label="Open navigation">${I('menu')}</button><div class="brand">${LOGO}DocSpace</div></div><div class="page" id="page"></div></main></div>`;
  $('#newDoc').onclick = newDoc; $('#navImport').onclick = openImport;
  $('#hamb').onclick = () => $('#shell').classList.add('nav-open'); $('#scrim').onclick = () => $('#shell').classList.remove('nav-open');
  $('#meBtn').onclick = e => menu(e.currentTarget, `<div class="hd">Switch demo account</div>${['maya', 'daniel'].map(k => `<button data-a="u:${k}">${av(USERS[k])}${USERS[k].name}${me.id === k ? `<span class="chk">${I('check', 'sm')}</span>` : ''}</button>`).join('')}<div class="sep"></div><button data-a="out">${I('logout')}Sign out</button>`,
    a => { if (a === 'out') { me = null; go('/login'); return } const u = USERS[a.slice(2)]; if (u.id !== me.id) { me = u; renderShell(); toast(`Switched to ${u.name}`) } });
  renderList();
}
function renderList(forceState) {
  const shared = view === 'shared', list = (shared ? sharedWithMe() : mine()).filter(d => d.title.toLowerCase().includes(search.toLowerCase()));
  const st = forceState || Q.get('state');
  $('#page').innerHTML = `<div class="page-head"><div><h1>${shared ? 'Shared with me' : 'My documents'}</h1><p>${shared ? 'Documents other people have shared with you. You can open and edit them.' : 'Documents you own. Share any of them by email.'}</p></div>
  <div class="actions"><button class="btn btn-secondary" id="impBtn">${I('upload')}Import</button><button class="btn btn-primary" id="newBtn">${I('plus')}New document</button></div></div>
  <div class="toolbar-row"><label class="search">${I('search')}<span class="sr">Search documents</span><input class="input" id="q" placeholder="Search documents" value="${esc(search)}"><kbd>/</kbd></label><span class="meta">${st ? '' : `${list.length} document${list.length === 1 ? '' : 's'}`}</span></div>
  <div class="table" role="table" aria-label="Documents">${listBody(list, st, shared)}</div>`;
  $('#newBtn').onclick = newDoc; $('#impBtn').onclick = openImport;
  const q = $('#q'); q.oninput = () => { search = q.value; const p = q.selectionStart; renderList(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p) };
  $('#page').querySelectorAll('.tr.row').forEach(r => {
    r.onclick = e => { if (!e.target.closest('[data-menu],input')) go('/doc/' + r.dataset.id) };
    r.onkeydown = e => { if (e.key === 'Enter' && e.target === r) go('/doc/' + r.dataset.id) };
  });
  $('#page').querySelectorAll('[data-rowmenu]').forEach(b => b.onclick = e => { e.stopPropagation(); rowMenu(b) });
  $('#page').querySelectorAll('[data-retry]').forEach(b => b.onclick = () => { renderList('loading'); setTimeout(() => renderList('none'), 700) });
  $('#page').querySelectorAll('[data-go-new]').forEach(b => b.onclick = newDoc);
  $('#page').querySelectorAll('[data-go-imp]').forEach(b => b.onclick = openImport);
}
function listBody(list, st, shared) {
  const head = `<div class="tr th" role="row"><span>Name</span><span class="col-owner">Owner</span><span class="col-when">Last modified</span><span></span></div>`;
  if (st === 'loading') return head + Array.from({ length: 5 }, (_, i) => `<div class="tr" aria-hidden="true"><div class="doc-name"><span class="fi"></span><span class="skel" style="width:${[52, 38, 60, 44, 30][i]}%"></span></div><span class="col-owner skel" style="width:60%"></span><span class="col-when skel" style="width:50%"></span><span></span></div>`).join('') + '<span class="sr" role="status">Loading documents</span>';
  if (st === 'error') return `<div class="empty err" role="alert"><div class="ei">${I('tri', 'lg')}</div><h3>Couldn't load your documents</h3><p>Check your connection and try again. Nothing you wrote is lost.</p><div class="actions"><button class="btn btn-secondary" data-retry>${I('retry')}Try again</button></div></div>`;
  if (st === 'empty' || !list.length) {
    if (search) return `<div class="empty"><div class="ei">${I('search', 'lg')}</div><h3>No documents match "${esc(search)}"</h3><p>Try a different word, or clear the search.</p></div>`;
    return shared
      ? `<div class="empty"><div class="ei">${I('users', 'lg')}</div><h3>Nothing shared with you yet</h3><p>When a teammate shares a document with ${esc(me.email)}, it shows up here.</p></div>`
      : `<div class="empty"><div class="ei">${I('file', 'lg')}</div><h3>No documents yet</h3><p>Create a blank document or import a .txt file to get started.</p><div class="actions"><button class="btn btn-secondary" data-go-imp>${I('upload')}Import .txt</button><button class="btn btn-primary" data-go-new>${I('plus')}New document</button></div></div>`;
  }
  return head + list.map(d => {
    const o = USERS[d.owner], isMine = d.owner === me.id, others = d.shared.map(k => USERS[k]);
    return `<div class="tr row" role="row" tabindex="0" data-id="${d.id}">
      <div class="doc-name"><span class="fi ${isMine ? '' : 'shared'}">${I(isMine ? 'file' : 'users', 'sm')}</span><div style="min-width:0"><b>${esc(d.title)}</b><span class="sub2">${isMine ? 'You' : o.name} · ${ago(d.at)}</span></div>
      ${isMine && others.length ? `<span class="sh" title="Shared with ${others.map(u => u.name).join(', ')}">${I('users', 'sm')}${others.length}</span>` : ''}</div>
      <div class="owner col-owner">${av(o)}<span>${isMine ? 'You' : esc(o.name)}</span></div>
      <span class="when col-when">${ago(d.at)}</span>
      <button class="icon-btn" data-menu data-rowmenu="${d.id}" aria-label="Actions for ${esc(d.title)}">${I('more')}</button></div>`;
  }).join('');
}
function rowMenu(btn) {
  const d = DOCS.find(x => x.id === btn.dataset.rowmenu), isMine = d.owner === me.id;
  menu(btn, `<button data-a="open">${I('open')}Open</button><button data-a="rename">${I('pencil')}Rename</button>${isMine ? `<button data-a="share">${I('userPlus')}Share</button>` : ''}`, a => {
    if (a === 'open') go('/doc/' + d.id);
    if (a === 'share') openShare(d);
    if (a === 'rename') inlineRename(d);
  }, 'right');
}
function inlineRename(d) {
  const b = $(`.tr.row[data-id="${d.id}"] .doc-name b`); const inp = document.createElement('input'); inp.className = 'input rename'; inp.value = d.title; inp.setAttribute('aria-label', 'Document name'); b.replaceWith(inp); inp.focus(); inp.select();
  const done = save => { if (save && inp.value.trim() && inp.value.trim() !== d.title) { d.title = inp.value.trim(); d.at = Date.now(); toast('Document renamed') } renderList() };
  inp.onkeydown = e => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false) }; inp.onblur = () => done(true);
}
function newDoc() {
  const d = { id: 'n' + Date.now(), title: 'Untitled document', owner: me.id, shared: [], at: Date.now(), html: '' }; DOCS.unshift(d);
  go('/doc/' + d.id); setTimeout(() => { const t = $('#title'); t?.focus(); t?.select() }, 50);
}
document.addEventListener('keydown', e => { if (e.key === '/' && $('#q') && document.activeElement.tagName !== 'INPUT' && !document.activeElement.isContentEditable) { e.preventDefault(); $('#q').focus() } });

/* ---------- editor ---------- */
let saveTimer, saveState = 'saved';
function renderEditor() {
  const d = DOCS.find(x => x.id === docId); if (!d) return go('/docs');
  const isMine = d.owner === me.id, o = USERS[d.owner];
  app.innerHTML = `<div class="editor">
  <header class="topbar">
    <button class="icon-btn" id="back" data-tip="Back to documents" aria-label="Back to documents">${I('back')}</button>
    <input class="title-in" id="title" value="${esc(d.title)}" aria-label="Document title" spellcheck="false">
    <span class="save" id="save" aria-live="polite"></span>
    <span class="grow"></span>
    ${isMine ? '' : `<span class="shared-pill">${av(o)}Owned by ${esc(o.name)}</span>`}
    <button class="btn btn-accent" id="shareBtn">${I('userPlus')}Share</button>
    <button class="icon-btn" id="edMe" data-menu aria-label="Account">${av(me)}</button>
  </header>
  <div class="fmt" role="toolbar" aria-label="Formatting">
    <button class="tb" data-cmd="undo" data-tip="Undo" data-kbd="⌘Z" aria-label="Undo">${I('undo')}</button>
    <button class="tb" data-cmd="redo" data-tip="Redo" data-kbd="⌘⇧Z" aria-label="Redo">${I('redo')}</button>
    <span class="tsep"></span>
    <button class="tb blk" id="blk" data-menu data-tip="Text style" aria-haspopup="menu"><span id="blkL">Paragraph</span>${I('chev', 'sm')}</button>
    <span class="tsep"></span>
    <button class="tb" data-cmd="bold" data-tip="Bold" data-kbd="⌘B" aria-label="Bold" aria-pressed="false">${I('bold')}</button>
    <button class="tb" data-cmd="italic" data-tip="Italic" data-kbd="⌘I" aria-label="Italic" aria-pressed="false">${I('italic')}</button>
    <button class="tb" data-cmd="underline" data-tip="Underline" data-kbd="⌘U" aria-label="Underline" aria-pressed="false">${I('underline')}</button>
    <span class="tsep"></span>
    <button class="tb" data-cmd="insertUnorderedList" data-tip="Bulleted list" data-kbd="⌘⇧8" aria-label="Bulleted list" aria-pressed="false">${I('ul')}</button>
    <button class="tb" data-cmd="insertOrderedList" data-tip="Numbered list" data-kbd="⌘⇧7" aria-label="Numbered list" aria-pressed="false">${I('ol')}</button>
  </div>
  <div class="canvas" id="canvas"><article class="paper"><div class="doc" id="doc" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Document body" data-ph="Start writing…" spellcheck="true">${d.html}</div></article></div></div>`;
  saveState = 'saved'; paintSave(d);
  $('#back').onclick = () => go(d.owner === me.id ? '/docs' : '/shared');
  const t = $('#title');
  t.oninput = () => { d.title = t.value; dirty(d) };
  t.onblur = () => { if (!t.value.trim()) { t.value = d.title = 'Untitled document' } };
  t.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('#doc').focus() } };
  const doc = $('#doc');
  doc.oninput = () => { d.html = doc.innerHTML; dirty(d) };
  document.onselectionchange = syncToolbar;
  app.querySelectorAll('[data-cmd]').forEach(b => { b.onmousedown = e => e.preventDefault(); b.onclick = () => { document.execCommand(b.dataset.cmd); doc.focus(); d.html = doc.innerHTML; dirty(d); syncToolbar() } });
  $('#blk').onmousedown = e => e.preventDefault();
  $('#blk').onclick = e => { const cur = $('#blkL').textContent; menu(e.currentTarget, [['p', 'Paragraph', '⌘⌥0'], ['h1', 'Heading 1', '⌘⌥1'], ['h2', 'Heading 2', '⌘⌥2'], ['h3', 'Heading 3', '⌘⌥3']].map(([k, l, kb]) => `<button class="tall" data-a="${k}"><span class="blk-${k}">${l}</span>${cur === l ? `<span class="chk">${I('check', 'sm')}</span>` : `<kbd>${kb}</kbd>`}</button>`).join(''), k => { doc.focus(); document.execCommand('formatBlock', false, k); d.html = doc.innerHTML; dirty(d); syncToolbar() }) };
  $('#shareBtn').onclick = () => openShare(d);
  $('#edMe').onclick = e => menu(e.currentTarget, `<div class="hd">${esc(me.email)}</div><button data-a="docs">${I('file')}My documents</button><div class="sep"></div><button data-a="out">${I('logout')}Sign out</button>`, a => { if (a === 'out') { me = null; go('/login') } else go('/docs') }, 'right');
  doc.onkeydown = e => { if ((e.metaKey || e.ctrlKey) && e.altKey && /^[0-3]$/.test(e.key)) { e.preventDefault(); document.execCommand('formatBlock', false, e.key === '0' ? 'p' : 'h' + e.key); d.html = doc.innerHTML; dirty(d); syncToolbar() } };
  syncToolbar();
}
function syncToolbar() {
  const doc = $('#doc'); if (!doc) return; const sel = getSelection(); const inDoc = sel.rangeCount && doc.contains(sel.anchorNode);
  app.querySelectorAll('.tb[data-cmd]').forEach(b => { const c = b.dataset.cmd; if (c === 'undo' || c === 'redo') return; const on = inDoc && document.queryCommandState(c); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on) });
  if (inDoc) { const v = (document.queryCommandValue('formatBlock') || 'p').toLowerCase(); $('#blkL').textContent = { h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3' }[v] || 'Paragraph' }
}
function dirty(d) {
  d.at = Date.now(); saveState = 'unsaved'; paintSave(d); clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveState = 'saving'; paintSave(d); setTimeout(() => { saveState = Q.get('save') === 'error' ? 'error' : 'saved'; paintSave(d) }, 650) }, 800);
}
function paintSave(d) {
  const s = $('#save'); if (!s) return; s.className = 'save';
  if (saveState === 'saved') s.innerHTML = `${I('cloud', 'sm')}<span class="lbl">Saved</span>`;
  if (saveState === 'unsaved') { s.classList.add('unsaved'); s.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:currentColor"></span><span class="lbl">Unsaved changes</span>` }
  if (saveState === 'saving') s.innerHTML = `${I('loader', 'sm spin')}<span class="lbl">Saving…</span>`;
  if (saveState === 'error') { s.classList.add('err'); s.innerHTML = `${I('alert', 'sm')}<span class="lbl">Couldn't save.</span><button id="retry">Retry</button>`; $('#retry').onclick = () => { saveState = 'saving'; paintSave(d); setTimeout(() => { saveState = 'saved'; paintSave(d); toast('All changes saved') }, 700) } }
}

/* ---------- dialogs ---------- */
function dialog(html, onClose) {
  const o = document.createElement('div'); o.className = 'overlay'; o.innerHTML = `<div class="dialog" role="dialog" aria-modal="true">${html}</div>`; document.body.append(o);
  const prev = document.activeElement; const close = () => { o.remove(); document.removeEventListener('keydown', onKey); prev?.isConnected && prev.focus(); onClose?.() };
  o.onmousedown = e => { if (e.target === o) close() };
  const onKey = e => { if (!o.contains(document.activeElement)) o.querySelector('.dialog').setAttribute('tabindex', '-1'); if (e.key === 'Escape') { e.preventDefault(); close() } if (e.key === 'Tab') { if (!o.contains(document.activeElement)) { o.querySelector('input,button')?.focus(); e.preventDefault(); return } const f = [...o.querySelectorAll('button:not([disabled]),input,[tabindex="0"]')]; if (e.shiftKey && document.activeElement === f[0]) { f.at(-1).focus(); e.preventDefault() } else if (!e.shiftKey && document.activeElement === f.at(-1)) { f[0].focus(); e.preventDefault() } } };
  document.addEventListener('keydown', onKey);
  o.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
  setTimeout(() => (o.querySelector('[autofocus]') || o.querySelector('input,button'))?.focus(), 30);
  return { o, close };
}
function openShare(d) {
  const isMine = d.owner === me.id;
  const { o } = dialog(`<div class="dlg-h"><div><h2 id="sh-t">Share "${esc(d.title)}"</h2><p>People you add can open and edit this document.</p></div><button class="icon-btn" data-close aria-label="Close">${I('x')}</button></div>
  <div class="dlg-b">${isMine ? `<form class="invite" id="inv" novalidate><label class="sr" for="inEm">Email address</label><input class="input" id="inEm" type="email" placeholder="Add people by email" autocomplete="off" autofocus><button class="btn btn-primary" id="grant" type="submit">Share</button></form><div id="invMsg"></div>`
      : `<div class="alert" style="background:var(--subtle);color:var(--text-2)">${I('lock')}<span>Only ${esc(USERS[d.owner].name)} can add people to this document.</span></div>`}
  <div class="people-h">People with access</div><div id="people"></div></div>
  <div class="dlg-f"><button class="btn btn-secondary" data-close>Done</button></div>`);
  const people = (fresh) => { o.querySelector('#people').innerHTML = [d.owner, ...d.shared].map((k, i) => { const u = USERS[k]; return `<div class="person${k === fresh ? ' new' : ''}">${av(u, 'lg')}<div><b>${esc(u.name)}${k === me.id ? ' <span style="display:inline;color:var(--text-3);font-weight:400">(you)</span>' : ''}</b><span>${u.email}</span></div><span class="role ${i ? '' : 'owner'}">${i ? 'Editor' : 'Owner'}</span></div>` }).join('') };
  people();
  if (!isMine) return;
  const msg = (kind, text) => { o.querySelector('#invMsg').innerHTML = text ? `<p class="help ${kind === 'err' ? 'err' : ''}" style="margin:8px 0 0;${kind === 'ok' ? 'color:var(--success);display:flex;gap:6px;align-items:center' : ''}" role="${kind === 'err' ? 'alert' : 'status'}">${I(kind === 'err' ? 'alert' : 'checkCircle', 'sm')}${text}</p>` : ''; o.querySelector('#inEm').classList.toggle('err', kind === 'err') };
  o.querySelector('#inEm').oninput = () => msg();
  o.querySelector('#inv').onsubmit = e => {
    e.preventDefault(); const v = o.querySelector('#inEm').value.trim(), b = o.querySelector('#grant');
    if (!/^\S+@\S+\.\S+$/.test(v)) return msg('err', 'Enter a valid email address.');
    b.disabled = true; b.innerHTML = I('loader', 'spin');
    setTimeout(() => {
      b.disabled = false; b.textContent = 'Share'; o.querySelector('#inEm').focus(); const u = byEmail(v);
      if (!u) return msg('err', `No DocSpace account uses ${esc(v)}. Ask them to sign up first.`);
      if (u.id === d.owner) return msg('err', 'You already own this document.');
      if (d.shared.includes(u.id)) return msg('err', `${esc(u.name)} already has access.`);
      d.shared.push(u.id); o.querySelector('#inEm').value = ''; o.querySelector('#inEm').focus(); people(u.id); msg('ok', `${esc(u.name)} can now edit this document.`); toast(`Shared with ${u.name}`);
    }, 600);
  };
}
function openImport() {
  let file = null;
  const { o, close } = dialog(`<div class="dlg-h"><div><h2>Import a file</h2><p>The file becomes a new document you can edit.</p></div><button class="icon-btn" data-close aria-label="Close">${I('x')}</button></div>
  <div class="dlg-b"><div id="impBody"></div></div>
  <div class="dlg-f"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" id="doImp" disabled>Import</button></div>`);
  const body = o.querySelector('#impBody'), btn = o.querySelector('#doImp');
  const pick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.txt,text/plain'; i.onchange = () => i.files[0] && take(i.files[0]); i.click() };
  const empty = (err) => {
    file = null; btn.disabled = true;
    body.innerHTML = `<div class="drop${err ? ' err' : ''}" id="drop" tabindex="0" role="button" aria-label="Choose a .txt file to import"><div class="ei">${I('fileUp', 'lg')}</div><b>Drag a .txt file here</b> or <span class="link">browse</span><p>Plain text (.txt) only, up to 1 MB</p></div>
    ${err ? `<p class="help err" role="alert" style="margin-top:10px">${I('alert', 'sm')}${err}</p>` : `<p class="note">${I('info', 'sm')}Each line break becomes a new paragraph. The file name becomes the document title.</p>`}`;
    const dz = body.querySelector('#drop'); dz.onclick = pick; dz.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick() } };
    dz.ondragover = e => { e.preventDefault(); dz.classList.add('over') }; dz.ondragleave = () => dz.classList.remove('over');
    dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); e.dataTransfer.files[0] && take(e.dataTransfer.files[0]) };
  };
  const take = f => {
    if (!/\.txt$/i.test(f.name)) return empty(`"${esc(f.name)}" isn't a .txt file. Only plain text files can be imported.`);
    if (f.size > 1048576) return empty(`"${esc(f.name)}" is ${(f.size / 1048576).toFixed(1)} MB. The limit is 1 MB.`);
    file = f; btn.disabled = false;
    body.innerHTML = `<div class="file"><span class="fi">${I('file')}</span><div><b>${esc(f.name)}</b><span>${f.size < 1024 ? f.size + ' B' : (f.size / 1024).toFixed(1) + ' KB'} · Plain text</span></div><button class="icon-btn" id="rm" aria-label="Remove file">${I('x')}</button></div><p class="note">${I('info', 'sm')}Creates a new document named "${esc(f.name.replace(/\.txt$/i, ''))}".</p>`;
    body.querySelector('#rm').onclick = () => empty();
  };
  o.__take = take; empty();
  btn.onclick = async () => {
    btn.disabled = true; btn.innerHTML = `${I('loader', 'spin')}Importing…`; o.querySelector('[data-close].btn').disabled = true;
    body.insertAdjacentHTML('beforeend', '<div class="bar"><i></i></div>'); requestAnimationFrame(() => body.querySelector('.bar i').style.width = '100%');
    const text = file.text ? await file.text() : file.content;
    setTimeout(() => {
      const d = { id: 'i' + Date.now(), title: file.name.replace(/\.txt$/i, ''), owner: me.id, shared: [], at: Date.now(), html: text.split(/\r?\n/).filter(Boolean).map(l => `<p>${esc(l)}</p>`).join('') };
      DOCS.unshift(d); close(); go('/doc/' + d.id); toast(`Imported "${d.title}"`);
    }, 800);
  };
}
window.__ds = { openImport, openShare, DOCS, USERS, renderList, go, signInAs: k => { me = USERS[k] } };
route();
