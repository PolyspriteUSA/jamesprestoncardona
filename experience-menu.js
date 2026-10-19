(function () {
  const modal = document.getElementById('experience-modal');
  const trigger = document.getElementById('experience-trigger');
  const close = document.getElementById('experience-close');
  if (!modal || !trigger || !close) return;
  let previousFocus = null;
  function open(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (modal.classList.contains('open')) return;
    previousFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('experience-open');
    close.focus({ preventScroll: true });
  }
  function dismiss(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('experience-open');
    if (previousFocus) previousFocus.focus({ preventScroll: true });
  }
  // Native click waits for a completed tap, allowing a swipe to scroll normally.
  trigger.addEventListener('click', open);
  trigger.addEventListener('keydown', event => { if (event.key === ' ') open(event); });
  close.addEventListener('click', dismiss);
  modal.querySelectorAll('[data-experience-close]').forEach(el => el.addEventListener('click', dismiss));
  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('open')) return;
    if (event.key === 'Escape') dismiss(event);
    if (event.key !== 'Tab') return;
    const links = [...modal.querySelectorAll('button, a[href]')];
    const first = links[0], last = links[links.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  modal.addEventListener('click', event => {
    if (event.target.closest('.experience-option')) document.body.classList.remove('experience-open');
  });
  window.__openExperiencePanel = open;
  window.__closeExperiencePanel = dismiss;
})();
