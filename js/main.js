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
})();
