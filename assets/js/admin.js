/* ═══════════════════════════════════════════════════════════
   Portfolio Admin — admin.js
   ═══════════════════════════════════════════════════════════ */

const API   = '/api';
const token = localStorage.getItem('pf_token');
if (!token) location.href = '/admin/login.html';

const email = localStorage.getItem('pf_email') || '';
document.getElementById('adminEmailDisp').textContent  = email;
document.getElementById('currentEmailDisp').textContent = email;
document.getElementById('credEmail').placeholder = email;

function auth() { return { 'Authorization': 'Bearer ' + token }; }
function logout() { localStorage.clear(); location.href = '/admin/login.html'; }

let delTarget = null;
let delType   = null;

// ── VIEW SWITCHING ────────────────────────────────────────
function sw(name, el) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.getElementById('viewTitle').textContent =
    { feed:'Feed', projects:'Projects', skills:'Skills', profile:'Profile', messages:'Messages', settings:'Settings' }[name];
  document.querySelector(`[data-view="${name}"]`)?.classList.add('active');
  document.getElementById('sidebar').classList.remove('open');

  if (name === 'feed')     loadAdminFeed();
  if (name === 'projects') loadAdminProjects();
  if (name === 'skills')   loadAdminSkills();
  if (name === 'profile')  loadAdminProfile();
  if (name === 'messages') loadAdminMessages();
}

// ── TOAST ─────────────────────────────────────────────────
function toast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── DELETE MODAL ──────────────────────────────────────────
function openDel(id, type) { delTarget = id; delType = type; document.getElementById('delModal').classList.add('open'); }
function closeDelModal()    { delTarget = null; delType = null; document.getElementById('delModal').classList.remove('open'); }
async function confirmDel() {
  if (!delTarget || !delType) return;
  const btn = document.getElementById('delConfirmBtn');
  btn.disabled = true;
  try {
    const endpoints = { post:'/api/posts.php', project:'/api/projects.php', skill:'/api/skills.php', message:'/api/messages.php' };
    const res = await fetch(`${endpoints[delType]}?id=${delTarget}`, { method:'DELETE', headers:auth() });
    if (!res.ok) throw new Error('Delete failed');
    closeDelModal();
    toast('Deleted', 'ok');
    if (delType === 'post')    { loadAdminFeed(); }
    if (delType === 'project') { loadAdminProjects(); }
    if (delType === 'skill')   { loadAdminSkills(); }
    if (delType === 'message') { loadAdminMessages(); }
  } catch (e) { toast('Failed to delete', 'err'); }
  finally { btn.disabled = false; }
}

// ── FEED ──────────────────────────────────────────────────
async function loadAdminFeed() {
  const el = document.getElementById('adminFeed');
  el.innerHTML = '<div class="loading"><div class="spin"></div></div>';
  try {
    const res  = await fetch('/api/posts.php?page=1');
    const data = await res.json();
    if (!data.posts?.length) {
      el.innerHTML = '<p style="color:var(--text3);padding:20px 0;font-size:.88rem">No posts yet. Write something above!</p>';
      return;
    }
    el.innerHTML = data.posts.map(p => `
      <div class="admin-post" id="apost-${p.id}">
        <div class="apost-body">${escHtml(p.content)}</div>
        ${p.image ? `<img class="apost-img" src="/uploads/posts/${p.image}" alt="">` : ''}
        <div class="apost-footer">
          <span class="apost-date">${timeAgo(p.created_at)}</span>
          <div class="apost-actions">
            <button class="apost-btn edit" onclick="openEditPost(${p.id}, ${JSON.stringify(escHtml(p.content))})">Edit</button>
            <button class="apost-btn del"  onclick="openDel(${p.id}, 'post')">Delete</button>
          </div>
        </div>
      </div>`).join('');
  } catch (e) { el.innerHTML = '<p style="color:var(--text3)">Failed to load.</p>'; }
}

async function submitPost() {
  const content = document.getElementById('composerText').value.trim();
  if (!content) { toast('Write something first!', 'err'); return; }
  const btn = document.querySelector('.btn-post');
  btn.disabled = true; btn.textContent = 'Posting…';

  const fd = new FormData();
  fd.append('content', content);
  const imgFile = document.getElementById('composerImg').files[0];
  if (imgFile) fd.append('image', imgFile);

  try {
    const res = await fetch('/api/posts.php', { method:'POST', headers:auth(), body:fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    document.getElementById('composerText').value = '';
    document.getElementById('composerImg').value  = '';
    document.getElementById('composerPreview').style.display = 'none';
    toast('Posted!', 'ok');
    loadAdminFeed();
  } catch (e) { toast(e.message || 'Failed to post', 'err'); }
  finally { btn.disabled = false; btn.textContent = 'Post'; }
}

function previewComposer(input) {
  if (input.files[0]) {
    const r = new FileReader();
    r.onload = e => {
      const img = document.getElementById('composerPreview');
      img.src = e.target.result; img.style.display = 'block';
    };
    r.readAsDataURL(input.files[0]);
  }
}

// EDIT POST
function openEditPost(id, content) {
  document.getElementById('editPostId').value = id;
  document.getElementById('editPostContent').value = content;
  document.getElementById('editPostFb').textContent = '';
  document.getElementById('editPostModal').classList.add('open');
}
function closeEditPost() { document.getElementById('editPostModal').classList.remove('open'); }
async function saveEditPost() {
  const id      = document.getElementById('editPostId').value;
  const content = document.getElementById('editPostContent').value.trim();
  const fb      = document.getElementById('editPostFb');
  if (!content) { fb.className='form-feedback fb-err'; fb.textContent='Content cannot be empty'; return; }
  const fd = new FormData(); fd.append('content', content);
  try {
    const res = await fetch(`/api/posts.php?id=${id}`, { method:'PUT', headers:auth(), body:fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    closeEditPost();
    toast('Post updated!', 'ok');
    loadAdminFeed();
  } catch(e) { fb.className='form-feedback fb-err'; fb.textContent=e.message; }
}

// ── PROJECTS ──────────────────────────────────────────────
async function loadAdminProjects() {
  const el = document.getElementById('adminProjGrid');
  el.innerHTML = '<div class="loading"><div class="spin"></div></div>';
  try {
    const res = await fetch('/api/projects.php');
    const projs = await res.json();
    if (!projs.length) { el.innerHTML = '<p style="color:var(--text3);font-size:.88rem">No projects yet.</p>'; return; }
    el.innerHTML = projs.map(p => `
      <div class="admin-proj-card">
        ${p.image ? `<img class="apj-img" src="/uploads/projects/${p.image}" alt="">` : `<div class="apj-img" style="display:flex;align-items:center;justify-content:center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>`}
        <div class="apj-body">
          <div class="apj-title">${escHtml(p.title)}${p.featured=='1'?' ⭐':''}</div>
          <div class="apj-tech">${escHtml(p.tech || '—')}</div>
          <div class="apj-actions">
            <button class="btn-edit"   onclick="openEditProj(${p.id})">Edit</button>
            <button class="btn-del-sm" onclick="openDel(${p.id},'project')">Delete</button>
          </div>
        </div>
      </div>`).join('');
  } catch(e) { el.innerHTML = '<p style="color:var(--text3)">Failed.</p>'; }
}

function openProjModal() {
  document.getElementById('projId').value       = '';
  document.getElementById('projModalTitle').textContent = 'Add Project';
  document.getElementById('projSubmitBtn').textContent  = 'Save';
  document.getElementById('projForm').reset();
  document.getElementById('projImgPreview').style.display = 'none';
  document.getElementById('projImgPrompt').style.display  = 'flex';
  document.getElementById('projFb').textContent = '';
  document.getElementById('projModal').classList.add('open');
}
function closeProjModal() { document.getElementById('projModal').classList.remove('open'); }

async function openEditProj(id) {
  try {
    const res = await fetch(`/api/projects.php?id=${id}`);
    const p   = await res.json();
    document.getElementById('projId').value           = p.id;
    document.getElementById('projModalTitle').textContent = 'Edit Project';
    document.getElementById('projSubmitBtn').textContent  = 'Save Changes';
    document.getElementById('pjTitle').value          = p.title;
    document.getElementById('pjDesc').value           = p.description;
    document.getElementById('pjTech').value           = p.tech;
    document.getElementById('pjLive').value           = p.live_url;
    document.getElementById('pjGh').value             = p.github_url;
    document.getElementById('pjFeatured').value       = p.featured;
    document.getElementById('projFb').textContent     = '';
    if (p.image) {
      document.getElementById('projImgPreview').src           = `/uploads/projects/${p.image}`;
      document.getElementById('projImgPreview').style.display = 'block';
      document.getElementById('projImgPrompt').style.display  = 'none';
    } else {
      document.getElementById('projImgPreview').style.display = 'none';
      document.getElementById('projImgPrompt').style.display  = 'flex';
    }
    document.getElementById('projModal').classList.add('open');
  } catch(e) { toast('Failed to load project', 'err'); }
}

function previewProjImg(input) {
  if (input.files[0]) {
    const r = new FileReader();
    r.onload = e => {
      document.getElementById('projImgPreview').src           = e.target.result;
      document.getElementById('projImgPreview').style.display = 'block';
      document.getElementById('projImgPrompt').style.display  = 'none';
    };
    r.readAsDataURL(input.files[0]);
  }
}

async function submitProject(e) {
  e.preventDefault();
  const id  = document.getElementById('projId').value;
  const btn = document.getElementById('projSubmitBtn');
  const fb  = document.getElementById('projFb');
  btn.disabled = true; btn.textContent = 'Saving…'; fb.textContent = '';

  const fd = new FormData(e.target);
  const imgFile = document.getElementById('projImgFile').files[0];
  if (imgFile) fd.set('image', imgFile);

  try {
    const url    = id ? `/api/projects.php?id=${id}` : '/api/projects.php';
    const method = id ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers:auth(), body:fd });
    const data   = await res.json();
    if (!res.ok) throw new Error(data.error);
    closeProjModal();
    toast(id ? 'Project updated!' : 'Project added!', 'ok');
    loadAdminProjects();
  } catch(ex) { fb.className='form-feedback fb-err'; fb.textContent=ex.message; }
  finally { btn.disabled=false; btn.textContent = id ? 'Save Changes' : 'Save'; }
}

// ── SKILLS ────────────────────────────────────────────────
async function loadAdminSkills() {
  const el = document.getElementById('skillsAdminList');
  el.innerHTML = '<div class="loading"><div class="spin"></div></div>';
  try {
    const res    = await fetch('/api/skills.php');
    const skills = await res.json();
    if (!skills.length) { el.innerHTML = '<p style="color:var(--text3);font-size:.88rem">No skills yet. Add one above.</p>'; return; }
    el.innerHTML = skills.map(s => `
      <div class="skill-admin-row">
        <span class="skill-admin-name">${escHtml(s.name)}</span>
        <span class="skill-admin-cat">${escHtml(s.category)}</span>
        <span class="skill-admin-lvl">${s.level}%</span>
        <button class="skill-del-btn" onclick="openDel(${s.id},'skill')">✕</button>
      </div>`).join('');
  } catch(e) { el.innerHTML = '<p style="color:var(--text3)">Failed.</p>'; }
}

async function addSkill(e) {
  e.preventDefault();
  const name  = document.getElementById('skillName').value.trim();
  const cat   = document.getElementById('skillCat').value.trim()  || 'General';
  const level = parseInt(document.getElementById('skillLevel').value) || 80;
  try {
    const res = await fetch('/api/skills.php', {
      method:'POST', headers:{...auth(),'Content-Type':'application/json'},
      body: JSON.stringify({ name, category:cat, level })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    e.target.reset();
    toast('Skill added!', 'ok');
    loadAdminSkills();
  } catch(ex) { toast(ex.message, 'err'); }
}

// ── PROFILE ───────────────────────────────────────────────
async function loadAdminProfile() {
  try {
    const res  = await fetch('/api/profile.php');
    const data = await res.json();
    const p    = data.profile || {};
    document.getElementById('pName').value     = p.name     || '';
    document.getElementById('pTagline').value  = p.tagline  || '';
    document.getElementById('pBio').value      = p.bio      || '';
    document.getElementById('pLocation').value = p.location || '';
    document.getElementById('pResume').value   = p.resume_url || '';
    document.getElementById('pGithub').value   = p.github   || '';
    document.getElementById('pLinkedin').value = p.linkedin || '';
    document.getElementById('pTwitter').value  = p.twitter  || '';
    document.getElementById('pWebsite').value  = p.website  || '';
    if (p.avatar) {
      document.getElementById('avatarPreviewImg').src           = `/uploads/avatar/${p.avatar}`;
      document.getElementById('avatarPreviewImg').style.display = 'block';
      document.getElementById('avatarPh').style.display         = 'none';
    }
  } catch(e) { toast('Failed to load profile', 'err'); }
}

function previewAvatar(input) {
  if (input.files[0]) {
    const r = new FileReader();
    r.onload = e => {
      document.getElementById('avatarPreviewImg').src           = e.target.result;
      document.getElementById('avatarPreviewImg').style.display = 'block';
      document.getElementById('avatarPh').style.display         = 'none';
    };
    r.readAsDataURL(input.files[0]);
  }
}

async function saveProfile(e) {
  e.preventDefault();
  const btn = document.getElementById('profileSaveBtn');
  const fb  = document.getElementById('profileFb');
  btn.disabled = true; btn.textContent = 'Saving…'; fb.textContent = '';

  const fd = new FormData();
  ['name','tagline','bio','location','resume_url','github','linkedin','twitter','website']
    .forEach(f => fd.append(f, document.getElementById(`p${f.charAt(0).toUpperCase()+f.slice(1).replace('_url','Url').replace('_','')}`  ) ? document.getElementById(`p${f.charAt(0).toUpperCase()+f.slice(1).replace('_url','Url').replace('_','')}`)?.value || '' : ''));

  // Easier field map
  fd.set('name',        document.getElementById('pName').value);
  fd.set('tagline',     document.getElementById('pTagline').value);
  fd.set('bio',         document.getElementById('pBio').value);
  fd.set('location',    document.getElementById('pLocation').value);
  fd.set('resume_url',  document.getElementById('pResume').value);
  fd.set('github',      document.getElementById('pGithub').value);
  fd.set('linkedin',    document.getElementById('pLinkedin').value);
  fd.set('twitter',     document.getElementById('pTwitter').value);
  fd.set('website',     document.getElementById('pWebsite').value);

  const avatarFile = document.getElementById('avatarFile').files[0];
  if (avatarFile) fd.append('avatar', avatarFile);

  try {
    const res = await fetch('/api/profile.php', { method:'POST', headers:auth(), body:fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fb.className = 'form-feedback fb-ok';
    fb.textContent = '✓ Profile saved!';
    toast('Profile updated!', 'ok');
  } catch(ex) { fb.className='form-feedback fb-err'; fb.textContent=ex.message; }
  finally { btn.disabled=false; btn.textContent='Save Profile'; }
}

// ── MESSAGES ──────────────────────────────────────────────
async function loadAdminMessages() {
  const el = document.getElementById('msgList');
  el.innerHTML = '<div class="loading"><div class="spin"></div></div>';
  try {
    const res  = await fetch('/api/messages.php', { headers:auth() });
    const data = await res.json();

    const badge = document.getElementById('msgBadge');
    badge.style.display = data.unread > 0 ? 'inline' : 'none';
    if (data.unread > 0) badge.textContent = data.unread;

    if (!data.messages?.length) { el.innerHTML = '<p style="color:var(--text3);font-size:.88rem">No messages yet.</p>'; return; }

    el.innerHTML = data.messages.map(m => `
      <div class="msg-row ${m.is_read ? '' : 'unread'}" onclick="openMsg(${m.id})">
        <div>
          <div class="msg-row-name">${escHtml(m.name)} <span style="color:var(--text3);font-weight:400">· ${escHtml(m.email)}</span></div>
          <div class="msg-row-preview">${escHtml(m.message)}</div>
        </div>
        <span class="msg-row-date">${timeAgo(m.created_at)}</span>
        <button class="msg-del" onclick="event.stopPropagation();openDel(${m.id},'message')">✕</button>
      </div>`).join('');
  } catch(e) { el.innerHTML = '<p style="color:var(--text3)">Failed.</p>'; }
}

async function openMsg(id) {
  // Mark read
  await fetch(`/api/messages.php?id=${id}`, { method:'PATCH', headers:auth() }).catch(()=>{});
  document.querySelector(`.msg-row[onclick*="openMsg(${id})"]`)?.classList.remove('unread');

  const res  = await fetch('/api/messages.php', { headers:auth() });
  const data = await res.json();
  const m    = data.messages?.find(x => x.id === id);
  if (!m) return;

  // Remove existing panel
  document.getElementById('msgDetailPanel')?.remove();

  const panel = document.createElement('div');
  panel.id = 'msgDetailPanel';
  panel.className = 'msg-detail-panel';
  panel.innerHTML = `
    <div class="msg-detail-from">${escHtml(m.name)}</div>
    <div class="msg-detail-meta">${escHtml(m.email)} · ${new Date(m.created_at).toLocaleString()}</div>
    <div class="msg-detail-body">${escHtml(m.message)}</div>
    <div style="margin-top:14px">
      <a href="mailto:${m.email}?subject=Re: Your message" class="btn-save" style="text-decoration:none;display:inline-block;">Reply via Email</a>
    </div>`;

  const row = document.querySelector(`.msg-row[onclick*="openMsg(${id})"]`);
  row?.insertAdjacentElement('afterend', panel);

  // Update badge
  const badge = document.getElementById('msgBadge');
  const unread = document.querySelectorAll('.msg-row.unread').length;
  badge.style.display = unread > 0 ? 'inline' : 'none';
  if (unread > 0) badge.textContent = unread;
}

// ── SETTINGS ──────────────────────────────────────────────
async function saveCredentials(e) {
  e.preventDefault();
  const btn  = document.getElementById('credBtn');
  const fb   = document.getElementById('credFb');
  const form = e.target;
  btn.disabled = true; btn.textContent = 'Saving…'; fb.textContent = '';

  try {
    const res = await fetch('/api/auth.php', {
      method: 'PUT',
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: form.current_password.value,
        email:            form.email.value,
        new_password:     form.new_password.value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fb.className = 'form-feedback fb-ok';
    fb.textContent = '✓ Credentials updated! Please log in again.';
    toast('Updated! Logging out…', 'ok');
    setTimeout(() => { localStorage.clear(); location.href = '/admin/login.html'; }, 2000);
  } catch(ex) { fb.className='form-feedback fb-err'; fb.textContent=ex.message; }
  finally { btn.disabled=false; btn.textContent='Update Credentials'; }
}

// ── UTILS ─────────────────────────────────────────────────
function escHtml(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff/60000);
  if (m<1)  return 'just now';
  if (m<60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

// ── INIT ──────────────────────────────────────────────────
loadAdminFeed();
