(() => {
  'use strict';
  const workshop = document.getElementById('workshop');
  const caption = document.getElementById('scene-caption');
  const buttons = [...document.querySelectorAll('[data-show-scene]')];
  if (!workshop || !caption || buttons.length !== 3) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const captions = [
    'Разрозненные заявки. Сначала выясняем, что должно работать.',
    'Форма, очередь, статусы. Соединяем нужные части в один процесс.',
    'Рабочая панель вместо разбросанных сообщений. Это собственное демо.'
  ];
  let framePending = false;
  let manualScroll = null;
  let current = 0;
  function showScene(index) {
    current = index;
    workshop.dataset.scene = String(index);
    caption.textContent = captions[index];
    buttons.forEach((button, n) => button.setAttribute('aria-pressed', String(n === index)));
  }
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      manualScroll = window.scrollY;
      showScene(Number(button.dataset.showScene));
    });
  });
  function update() {
    framePending = false;
    if (reduced.matches) return;
    // A clicked scene remains stable until an intentional scroll. No timer or scroll capture.
    if (manualScroll !== null && Math.abs(window.scrollY - manualScroll) < 75) return;
    manualScroll = null;
    const rect = workshop.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const travel = Math.max(180, Math.min(340, innerHeight * .36));
    const documentTop = rect.top + window.scrollY;
    const start = Math.max(0, documentTop - innerHeight * .35);
    const progress = Math.max(0, Math.min(1, (window.scrollY - start) / travel));
    const next = progress < .28 ? 0 : progress < .68 ? 1 : 2;
    if (next !== current) showScene(next);
  }
  function requestUpdate() {
    if (!framePending) { framePending = true; requestAnimationFrame(update); }
  }
  addEventListener('scroll', requestUpdate, {passive: true});
  addEventListener('resize', requestUpdate, {passive: true});
  reduced.addEventListener('change', () => {
    if (reduced.matches) { manualScroll = window.scrollY; showScene(0); }
    else requestUpdate();
  });
  // Always begin with the task scene. With JS disabled it is also the visible fallback.
  showScene(0);
})();
