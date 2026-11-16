(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;

  /* ---------- 明暗模式 ---------- */
  var themeToggle = document.getElementById('theme-toggle');
  function syncThemeMeta() {
    var color = root.getAttribute('data-theme') === 'light' ? '#f4efe6' : '#0a0d12';
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach(function (m) { m.setAttribute('content', color); });
  }
  function setTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (persist) {
      try { localStorage.setItem('theme', theme); } catch (e) {}
    }
    syncThemeMeta();
    var iframe = document.querySelector('iframe.giscus-frame');
    if (iframe) {
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: theme === 'light' ? 'light' : 'dark_dimmed' } } },
        'https://giscus.app'
      );
    }
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
    });
  }
  syncThemeMeta();

  /* ---------- 头部滚动状态 ---------- */
  var header = document.getElementById('site-header');
  var toTop = document.getElementById('to-top');
  var progressBar = document.getElementById('read-progress-bar');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (toTop) toTop.classList.toggle('is-visible', y > 760);
    if (progressBar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 手机菜单 ---------- */
  var menuToggle = document.getElementById('menu-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  var backdrop = document.getElementById('nav-backdrop');

  function closeNav() {
    body.classList.remove('nav-open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    if (mobileNav) mobileNav.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.hidden = true;
  }
  function openNav() {
    body.classList.add('nav-open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    if (mobileNav) mobileNav.setAttribute('aria-hidden', 'false');
    if (backdrop) backdrop.hidden = false;
  }
  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      body.classList.contains('nav-open') ? closeNav() : openNav();
    });
  }
  if (mobileNav) {
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
  }
  if (backdrop) backdrop.addEventListener('click', closeNav);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) closeNav();
  });

  /* ---------- 首屏加载动画：每个会话只出现一次 ---------- */
  var intro = document.getElementById('intro');
  if (intro) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var seen = false;
    try { seen = sessionStorage.getItem('intro-seen') === '1'; } catch (e) {}
    if (reduce || seen) {
      intro.remove();
    } else {
      try { sessionStorage.setItem('intro-seen', '1'); } catch (e) {}
      var hideIntro = function () {
        setTimeout(function () {
          intro.classList.add('is-done');
          setTimeout(function () { intro.remove(); }, 650);
        }, 420);
      };
      if (document.readyState === 'complete') hideIntro();
      else window.addEventListener('load', hideIntro);
      setTimeout(hideIntro, 2600);
    }
  }

  /* ---------- 文章图片与外链 ---------- */
  var prose = document.querySelector('.prose');
  if (prose) {
    prose.querySelectorAll('img').forEach(function (img, i) {
      img.loading = 'lazy';
      img.decoding = 'async';
      if (i === 0) img.loading = 'eager';
    });
    prose.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (a.hostname !== window.location.hostname) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    });
  }

  /* ---------- 代码复制 ---------- */
  document.querySelectorAll('.prose pre').forEach(function (pre) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.textContent = '复制';
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      var text = code ? code.innerText : pre.innerText;
      var done = function () {
        btn.textContent = '已复制';
        setTimeout(function () { btn.textContent = '复制'; }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done).catch(function () {});
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
    pre.appendChild(btn);
  });

  /* ---------- 目录 ---------- */
  var content = document.getElementById('post-content');
  var tocNav = document.getElementById('toc-nav');
  var toc = document.getElementById('toc');
  if (content && tocNav) {
    var headings = Array.prototype.slice.call(content.querySelectorAll('h2, h3'));
    if (headings.length < 2) {
      if (toc) toc.style.display = 'none';
    } else {
      headings.forEach(function (h, i) {
        if (!h.id) h.id = 'sec-' + (i + 1);
        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        if (h.tagName === 'H3') a.className = 'toc-h3';
        tocNav.appendChild(a);
      });

      var links = tocNav.querySelectorAll('a');
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (l) {
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id);
          });
        });
      }, { rootMargin: '-100px 0px -68% 0px', threshold: 0 });
      headings.forEach(function (h) { observer.observe(h); });
    }
  }

  /* ---------- Giscus ---------- */
  var giscusConfig = window.GISCUS_CONFIG;
  var giscusContainer = document.getElementById('giscus-container');
  if (giscusConfig && giscusContainer) {
    var s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-repo', giscusConfig.repo);
    s.setAttribute('data-repo-id', giscusConfig.repoId);
    s.setAttribute('data-category', giscusConfig.category);
    s.setAttribute('data-category-id', giscusConfig.categoryId);
    s.setAttribute('data-mapping', giscusConfig.mapping);
    s.setAttribute('data-strict', '0');
    s.setAttribute('data-reactions-enabled', giscusConfig.reactionsEnabled);
    s.setAttribute('data-emit-metadata', '0');
    s.setAttribute('data-input-position', giscusConfig.inputPosition);
    s.setAttribute('data-theme', root.getAttribute('data-theme') === 'light' ? 'light' : 'dark_dimmed');
    s.setAttribute('data-lang', giscusConfig.lang);
    s.setAttribute('data-loading', 'lazy');
    giscusContainer.appendChild(s);
  }

  /* ---------- 作品筛选 ---------- */
  var filterBar = document.getElementById('works-filters');
  if (filterBar) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('#work-grid .work-card'));
    var countEl = document.getElementById('works-count');
    var filterEmpty = document.getElementById('works-filter-empty');
    var filterState = { medium: 'all', origin: 'all' };

    var applyFilters = function () {
      var shown = 0;
      cards.forEach(function (card) {
        var ok = (filterState.medium === 'all' || card.getAttribute('data-medium') === filterState.medium)
          && (filterState.origin === 'all' || card.getAttribute('data-origin') === filterState.origin);
        card.hidden = !ok;
        if (ok) shown += 1;
      });
      if (countEl) countEl.textContent = '共 ' + shown + ' 件';
      if (filterEmpty) filterEmpty.classList.toggle('is-visible', cards.length > 0 && shown === 0);
    };

    filterBar.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.getAttribute('data-group');
        var value = btn.getAttribute('data-value');
        filterState[group] = value;
        filterBar.querySelectorAll('.filter-btn[data-group="' + group + '"]').forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        applyFilters();
      });
    });

    applyFilters();
  }

  /* ---------- 角色面板 ---------- */
  var characterDialog = document.getElementById('character-dialog');
  if (characterDialog) {
    var characterCards = document.querySelectorAll('.character-card');
    var charName = document.getElementById('character-dialog-name');
    var charEn = document.getElementById('character-dialog-en');
    var charRole = document.getElementById('character-dialog-role');
    var charQuote = document.getElementById('character-dialog-quote');
    var charDesc = document.getElementById('character-dialog-desc');
    var charTags = document.getElementById('character-dialog-tags');
    var charAvatar = document.getElementById('character-dialog-avatar');
    var charInitial = document.getElementById('character-dialog-initial');
    var charClose = document.getElementById('character-dialog-close');

    var openCharacter = function (card) {
      var name = card.getAttribute('data-name') || '';
      var en = card.getAttribute('data-en') || '';
      var role = card.getAttribute('data-role') || '';
      var quote = card.getAttribute('data-quote') || '';
      var desc = card.getAttribute('data-desc') || '';
      var avatar = card.getAttribute('data-avatar') || '';
      var tags = (card.getAttribute('data-tags') || '').split('|').filter(Boolean);

      charName.textContent = name;
      charEn.textContent = en;
      charEn.hidden = !en;
      charRole.textContent = role;
      charRole.hidden = !role;
      charQuote.textContent = quote ? '「' + quote + '」' : '';
      charQuote.hidden = !quote;
      charDesc.textContent = desc;
      charDesc.hidden = !desc;

      charTags.innerHTML = '';
      tags.forEach(function (tag) {
        var span = document.createElement('span');
        span.className = 'chip chip--small';
        span.textContent = tag.trim();
        charTags.appendChild(span);
      });

      if (avatar) {
        charAvatar.src = avatar;
        charAvatar.alt = name;
        charAvatar.hidden = false;
        charInitial.hidden = true;
      } else {
        charAvatar.removeAttribute('src');
        charAvatar.hidden = true;
        charInitial.textContent = name.slice(0, 1) || '?';
        charInitial.hidden = false;
      }

      if (typeof characterDialog.showModal === 'function') {
        characterDialog.showModal();
      } else {
        characterDialog.setAttribute('open', '');
      }
    };

    characterCards.forEach(function (card) {
      card.addEventListener('click', function () { openCharacter(card); });
    });

    if (charClose) {
      charClose.addEventListener('click', function () { characterDialog.close(); });
    }
    characterDialog.addEventListener('click', function (e) {
      if (e.target === characterDialog) characterDialog.close();
    });
  }
})();
