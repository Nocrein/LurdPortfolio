/* ═══════════════════════════════════════════════════════════
   Portfolio — main.js
   ═══════════════════════════════════════════════════════════ */

const API = '/api';
let postsPage = 1;
let totalPostPages = 1;
let profileData = null;
let skillsAnimated = false;

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  window.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 20);
    if (!skillsAnimated) animateSkillsOnScroll();
  });

  document.getElementById('navBurger').addEventListener('click', () => {
    document.getElementById('mobileNav').classList.toggle('open');
    document.getElementById('mobileOverlay').classList.toggle('open');
  });

  loadProfile();
  loadPosts();
  loadProjects();
});

function closeMobileNav() {
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('mobileOverlay').classList.remove('open');
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function smoothScroll(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return false;
}

// ── PROFILE ───────────────────────────────────────────────
async function loadProfile() {
  try {
    const res  = await fetch(`${API}/profile.php`);
    const data = await res.json();
    profileData = data;

    const p = data.profile || {};
    const skills = data.skills || [];

    // Name
    const name = p.name || 'Your Name';
    document.getElementById('heroName').textContent    = name;
    document.getElementById('navName').textContent     = name;
    document.getElementById('footerName').textContent  = name;
    document.title = `${name} — Portfolio`;

    // Tagline & bio
    if (p.tagline) document.getElementById('heroTagline').textContent = p.tagline;
    if (p.bio)     document.getElementById('heroBio').textContent     = p.bio;

    // Location
    if (p.location) {
      document.getElementById('heroLocationText').textContent = p.location;
      document.getElementById('heroLocation').style.display  = 'inline-flex';
    }

    // Avatar
    if (p.avatar) {
      const img = document.getElementById('heroAvatar');
      img.src = `/uploads/avatar/${p.avatar}`;
      img.style.display = 'block';
      document.getElementById('heroAvatarPH').style.display = 'none';
    }

    // Social links
    const socials = [];
    if (p.github)   socials.push({ label: 'GitHub',   href: p.github,   icon: svgGithub() });
    if (p.linkedin) socials.push({ label: 'LinkedIn',  href: p.linkedin, icon: svgLinkedin() });
    if (p.twitter)  socials.push({ label: 'Twitter',   href: p.twitter,  icon: svgTwitter() });
    if (p.website)  socials.push({ label: 'Website',   href: p.website,  icon: svgGlobe() });

    document.getElementById('heroSocials').innerHTML = socials.map(s =>
      `<a href="${s.href}" target="_blank" rel="noopener" class="social-link">${s.icon} ${s.label}</a>`
    ).join('');

    // Resume button
    if (p.resume_url) {
      document.getElementById('heroActions').insertAdjacentHTML('beforeend',
        `<a href="${p.resume_url}" target="_blank" class="btn-ghost">Resume ↗</a>`);
    }

    // Contact socials
    document.getElementById('contactSocials').innerHTML = socials.map(s =>
      `<a href="${s.href}" target="_blank" rel="noopener" class="contact-social-item">${s.icon} ${s.label}</a>`
    ).join('');

    // Skills
    renderSkills(skills);

  } catch (e) { console.error('Profile error:', e); }
}

// ── SKILLS ────────────────────────────────────────────────
function renderSkills(skills) {
  const wrap = document.getElementById('skillsWrap');
  if (!skills.length) {
    wrap.innerHTML = '<p style="color:var(--text3);font-size:.88rem">No skills added yet.</p>';
    return;
  }

  const grouped = {};
  skills.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  wrap.innerHTML = Object.entries(grouped).map(([cat, items]) => `
    <div class="skill-category">
      <div class="skill-cat-label">${escHtml(cat)}</div>
      <div class="skill-list">
        ${items.map(s => `
          <div class="skill-item">
            <span class="skill-name">${escHtml(s.name)}</span>
            <div class="skill-bar-track">
              <div class="skill-bar-fill" data-level="${s.level}" style="width:0%"></div>
            </div>
            <span class="skill-pct">${s.level}%</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

function animateSkillsOnScroll() {
  const section = document.getElementById('info');
  if (!section) return;
  const rect = section.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.85) {
    document.querySelectorAll('.skill-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.level + '%';
    });
    skillsAnimated = true;
  }
}

// ── POSTS ─────────────────────────────────────────────────
async function loadPosts(append = false) {
  if (!append) document.getElementById('feedList').innerHTML = '<div class="feed-loading"><div class="spinner"></div></div>';

  try {
    const res  = await fetch(`${API}/posts.php?page=${postsPage}`);
    const data = await res.json();
    totalPostPages = data.pages || 1;

    const list   = document.getElementById('feedList');
    const more   = document.getElementById('feedMore');
    const pName  = profileData?.profile?.name || 'Portfolio';
    const pAvatar = profileData?.profile?.avatar
      ? `<img src="/uploads/avatar/${profileData.profile.avatar}" alt="${escHtml(pName)}">`
      : `<span>${pName[0]?.toUpperCase() || 'P'}</span>`;

    if (!data.posts?.length && !append) {
      list.innerHTML = `<div class="empty-feed">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <p>No posts yet — check back soon.</p>
      </div>`;
      more.style.display = 'none';
      return;
    }

    const html = (data.posts || []).map(post => postCard(post, pAvatar, pName)).join('');
    if (append) {
      list.insertAdjacentHTML('beforeend', html);
    } else {
      list.innerHTML = html;
    }

    more.style.display = postsPage < totalPostPages ? 'block' : 'none';
  } catch (e) {
    document.getElementById('feedList').innerHTML = '<p style="color:var(--text3);padding:40px 0;">Failed to load posts.</p>';
  }
}

function loadMorePosts() {
  postsPage++;
  loadPosts(true);
}

function postCard(post, avatarHtml, authorName) {
  const date = timeAgo(post.created_at);
  const isEdited = post.updated_at && post.updated_at !== post.created_at;
  return `
    <div class="post-card" id="post-${post.id}">
      <div class="post-header">
        <div class="post-avatar">${avatarHtml}</div>
        <div class="post-meta">
          <div class="post-author">${escHtml(authorName)}</div>
          <div class="post-time">${date}${isEdited ? ' · edited' : ''}</div>
        </div>
      </div>
      <div class="post-content">${escHtml(post.content)}</div>
      ${post.image ? `<img class="post-image" src="/uploads/posts/${post.image}" alt="Post image" onclick="openLightbox('/uploads/posts/${post.image}')">` : ''}
      <div class="post-footer">
        <span>${new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
      </div>
    </div>`;
}

// ── PROJECTS ──────────────────────────────────────────────
async function loadProjects() {
  try {
    const res      = await fetch(`${API}/projects.php`);
    const projects = await res.json();
    const grid     = document.getElementById('projectsGrid');

    if (!projects.length) {
      grid.innerHTML = '<p style="color:var(--text3);font-size:.88rem">No projects added yet.</p>';
      return;
    }

    grid.innerHTML = projects.map(p => projectCard(p)).join('');
  } catch (e) { console.error('Projects error:', e); }
}

function projectCard(p) {
  const tech = (p.tech || '').split(',').map(t => t.trim()).filter(Boolean);
  const isFeatured = parseInt(p.featured) === 1;
  return `
    <div class="project-card ${isFeatured ? 'featured' : ''}">
      ${p.image
        ? `<img class="project-img" src="/uploads/projects/${p.image}" alt="${escHtml(p.title)}">`
        : `<div class="project-img" style="display:flex;align-items:center;justify-content:center;">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
           </div>`
      }
      <div class="project-body">
        ${isFeatured ? '<span class="project-featured-tag">Featured</span>' : ''}
        <div class="project-title">${escHtml(p.title)}</div>
        ${p.description ? `<div class="project-desc">${escHtml(p.description)}</div>` : ''}
        ${tech.length ? `<div class="project-tech">${tech.map(t => `<span class="tech-tag">${escHtml(t)}</span>`).join('')}</div>` : ''}
        <div class="project-links">
          ${p.live_url   ? `<a href="${p.live_url}"   target="_blank" class="project-link live">Live ↗</a>`   : ''}
          ${p.github_url ? `<a href="${p.github_url}" target="_blank" class="project-link gh">${svgGithub(14)} Code</a>` : ''}
        </div>
      </div>
    </div>`;
}

// ── CONTACT ───────────────────────────────────────────────
async function submitContact(e) {
  e.preventDefault();
  const form  = e.target;
  const btn   = document.getElementById('contactBtn');
  const fb    = document.getElementById('contactFeedback');
  fb.textContent = '';
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Sending…';

  try {
    const res = await fetch(`${API}/messages.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.value, email: form.email.value, message: form.message.value })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fb.className = 'form-feedback feedback-ok';
    fb.textContent = '✓ Message sent! I\'ll get back to you.';
    form.reset();
    showToast('Message sent!', 'ok');
  } catch (err) {
    fb.className = 'form-feedback feedback-err';
    fb.textContent = err.message || 'Failed to send.';
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Send Message';
  }
}

// ── LIGHTBOX ──────────────────────────────────────────────
function openLightbox(src) {
  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lightbox-close" onclick="closeLightbox()">✕</button><img id="lbImg">';
    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    document.body.appendChild(lb);
  }
  document.getElementById('lbImg').src = src;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── SVG ICONS ─────────────────────────────────────────────
function svgGithub(size=16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`;
}
function svgLinkedin(size=16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
}
function svgTwitter(size=16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
}
function svgGlobe(size=16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
}

// ── UTILS ─────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
