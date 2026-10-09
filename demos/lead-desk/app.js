/* Browser-only demonstration. Never sends records to a CRM or external service. */
(() => {
  'use strict';
  const M = window.LeadDesk, $ = id => document.getElementById(id);
  let storage;
  try { storage = window.localStorage; } catch { /* Private mode can deny storage. */ }
  const loaded = M.loadRecords(storage);
  let records = loaded.records, needsReview = loaded.needsReview, shown = [];
  let toastTimer;
  function show(message) {
    $('toast').textContent = message; $('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5500);
  }
  function storageWarning(message) {
    $('storage-warning').textContent = message; $('storage-warning').hidden = !message;
  }
  storageWarning(loaded.warning);
  function persist(next, message) {
    if (needsReview && !confirm('Часть сохранения повреждена или недоступна. Заменить его текущими исправными записями? Неисправные записи восстановить здесь нельзя.')) return false;
    const saved = M.saveRecords(storage, next);
    records = next;
    if (saved) {needsReview = false; storageWarning('');}
    else storageWarning('Хранилище недоступно. Изменения есть только в открытой странице. Скачайте CSV перед закрытием.');
    render();
    show(saved ? message : message + '. Только до закрытия страницы: скачайте CSV.');
    return true;
  }
  function render() {
    const today = M.dateKey(), summary = M.stats(records, today);
    for (const key of ['all','active','closed','overdue']) $(key).textContent = summary[key];
    shown = M.listRecords(records, $('search').value, $('filter').value);
    $('selection-count').textContent = 'Показано: ' + shown.length + ' из ' + records.length;
    $('export').disabled = shown.length === 0;
    const list = $('list'); list.replaceChildren();
    if (!shown.length) {
      const empty = document.createElement('div'); empty.className = 'empty';
      empty.textContent = 'Подходящих обращений нет. Измените поиск или статус.'; list.append(empty); return;
    }
    for (const r of shown) {
      const row = document.createElement('article'); row.className = 'row';
      const first = document.createElement('div'), name = document.createElement('div'), sub = document.createElement('div');
      const task = document.createElement('div'), due = document.createElement('div'), status = document.createElement('div');
      const pill = document.createElement('span'), edit = document.createElement('button');
      name.className = 'company'; name.textContent = r.company;
      sub.className = 'sub'; sub.textContent = r.channel + ' · ' + (r.owner || 'Не назначен'); first.append(name, sub);
      task.className = 'task'; task.textContent = r.task;
      const overdue = r.status !== 'Закрыта' && r.due < today;
      due.className = 'due' + (overdue ? ' over' : '');
      due.textContent = r.status === 'Закрыта' ? 'Закрыта · ' + r.due : (overdue ? 'Просрочено · ' : 'До ') + r.due;
      status.className = 'status'; pill.className = 'pill'; pill.dataset.status = r.status; pill.textContent = r.status; status.append(pill);
      edit.className = 'secondary edit'; edit.type = 'button'; edit.textContent = 'Открыть';
      edit.setAttribute('aria-label', 'Открыть обращение: ' + r.company);
      edit.addEventListener('click', () => open(r.id)); row.append(first, task, due, status, edit); list.append(row);
    }
  }
  function open(id) {
    const r = records.find(x => x.id === id);
    $('dialogTitle').textContent = r ? 'Обращение' : 'Новое обращение';
    $('recordId').value = r?.id || '';
    for (const field of ['company','owner','task']) {$(field).value = r?.[field] || ''; $(field).setCustomValidity('');}
    $('channel').value = r?.channel || 'Телефон'; $('due').value = r?.due || M.dateKey(1);
    $('due').setCustomValidity(''); $('status').value = r?.status || 'Новая';
    $('remove').hidden = !r; $('editor').showModal(); $('company').focus();
  }
  for (const field of ['company','owner','task','due']) {
    $(field).addEventListener('input', () => $(field).setCustomValidity(''));
  }
  $('form').addEventListener('submit', e => {
    e.preventDefault();
    for (const field of ['company','owner','task']) {
      if (!$(field).value.trim()) {
        $(field).setCustomValidity('Введите текст, а не только пробелы.');
        $(field).reportValidity(); $(field).focus(); return;
      }
    }
    if (!M.validDate($('due').value)) {
      $('due').setCustomValidity('Укажите существующую дату начиная с 1900 года.'); $('due').reportValidity(); return;
    }
    const raw = {id:$('recordId').value || ('item-' + Date.now() + '-' + Math.random().toString(36).slice(2,8)),
      company:$('company').value, owner:$('owner').value, task:$('task').value,
      channel:$('channel').value, due:$('due').value, status:$('status').value};
    const item = M.normalizeRecord(raw);
    if (!item) {show('Проверьте поля: канал, статус и длину текста. Обращение не сохранено.'); return;}
    const next = records.slice(), index = next.findIndex(r => r.id === item.id);
    if (index < 0) next.push(item); else next[index] = item;
    if (persist(next, index < 0 ? 'Обращение добавлено' : 'Изменения сохранены')) $('editor').close();
  });
  $('remove').addEventListener('click', () => {
    if (!confirm('Удалить это обращение из локального списка?')) return;
    const id = $('recordId').value;
    if (persist(records.filter(r => r.id !== id), 'Обращение удалено')) $('editor').close();
  });
  $('close').onclick = $('cancel').onclick = () => $('editor').close();
  $('add').onclick = () => open();
  $('search').addEventListener('input', render); $('filter').addEventListener('change', render);
  $('reset').onclick = () => {
    if (!confirm('Вернуть четыре учебных обращения? Текущие записи в этом браузере будут заменены.')) return;
    if (persist(M.sample(), 'Учебные данные восстановлены')) {
      $('search').value = ''; $('filter').value = ''; render();
    }
  };
  $('export').onclick = () => {
    if (!shown.length) return;
    const url = URL.createObjectURL(new Blob([M.toCsv(shown)], {type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = 'obrashcheniya-demo.csv';
    document.body.append(a);
    try {a.click(); show('Выгружены показанные обращения: ' + shown.length);}
    finally {a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);}
  };
  render();
})();
