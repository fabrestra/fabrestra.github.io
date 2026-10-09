(() => {
  const form = document.querySelector('.journal-search');
  if (!form) return;
  const input = form.querySelector('input');
  const cards = [...document.querySelectorAll('.journal-card')];
  const filters = [...document.querySelectorAll('.journal-filters button')];
  const status = document.querySelector('#journal-results');
  const empty = document.querySelector('.journal-empty');
  let topic = 'all';
  const normalize = value => value.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim();
  const update = () => {
    const words = normalize(input.value).split(/\s+/).filter(Boolean);
    let found = 0;
    cards.forEach(card => {
      const text = normalize(card.textContent);
      const matches = (topic === 'all' || card.dataset.topic === topic) && words.every(word => text.includes(word));
      card.hidden = !matches;
      if (matches) found++;
    });
    status.textContent = `Найдено: ${found}`;
    empty.hidden = found !== 0;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === topic)));
  };
  form.addEventListener('submit', event => event.preventDefault());
  input.addEventListener('input', update);
  filters.forEach(button => button.addEventListener('click', () => { topic = button.dataset.topic; update(); }));
  form.addEventListener('reset', () => { topic = 'all'; input.value = ''; update(); });
})();
