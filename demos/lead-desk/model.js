/* Local demo only: no network, shared database or native CRM connection. */
(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.LeadDesk = model;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';
  const KEY = 'fabrestra-lead-desk-v1';
  const STATUSES = ['Новая', 'В работе', 'Ожидаем', 'Закрыта'];
  const CHANNELS = ['Телефон', 'Сайт', 'Telegram', 'Почта', 'Другое'];
  function dateKey(offset = 0, now = new Date()) {
    const d = new Date(now); d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return false;
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
  }
  function cleanText(value, max) {
    return typeof value === 'string' && value.trim() && value.trim().length <= max ? value.trim() : null;
  }
  function normalizeRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const id = cleanText(value.id, 128), company = cleanText(value.company, 80), task = cleanText(value.task, 240);
    // Preserve legacy entries without an owner; they can be assigned in the editor.
    const owner = value.owner == null || value.owner === '' ? '' : cleanText(value.owner, 40);
    if (!id || !company || !task || owner === null || !validDate(value.due) ||
        !STATUSES.includes(value.status) || !CHANNELS.includes(value.channel)) return null;
    return {id, company, channel: value.channel, owner, task, due: value.due, status: value.status};
  }
  function sample(now = new Date()) {
    return [
      {id:'sample-1',company:'Мастерская «Север»',channel:'Сайт',owner:'Администратор',task:'Уточнить тип ремонта и согласовать время приёма',due:dateKey(-1, now),status:'Новая'},
      {id:'sample-2',company:'Студия «Линия»',channel:'Telegram',owner:'Менеджер',task:'Отправить смету на обновление страницы',due:dateKey(1, now),status:'В работе'},
      {id:'sample-3',company:'Сервис «Орбита»',channel:'Телефон',owner:'Мастер',task:'Дождаться подтверждения удобного времени',due:dateKey(3, now),status:'Ожидаем'},
      {id:'sample-4',company:'Магазин «Контур»',channel:'Почта',owner:'Менеджер',task:'Передать готовый макет и инструкцию',due:dateKey(-3, now),status:'Закрыта'}
    ];
  }
  function loadRecords(storage, now = new Date()) {
    try {
      const raw = storage.getItem(KEY);
      if (raw === null) return {records: sample(now), warning: '', needsReview: false};
      const values = JSON.parse(raw);
      if (!Array.isArray(values)) throw new Error('Invalid record collection');
      const seen = new Set(), records = [];
      for (const value of values) {
        const record = normalizeRecord(value);
        if (record && !seen.has(record.id)) {seen.add(record.id); records.push(record);}
      }
      const rejected = values.length - records.length;
      return {records, needsReview: rejected > 0, warning: rejected ?
        `Не удалось прочитать записей: ${rejected}. Показаны исправные записи. Исходное сохранение не изменено.` : ''};
    } catch {
      return {records: sample(now), needsReview: true,
        warning: 'Сохранение недоступно или повреждено. Показаны учебные примеры; исходное сохранение не изменено.'};
    }
  }
  function saveRecords(storage, records) {
    try {storage.setItem(KEY, JSON.stringify(records)); return true;} catch {return false;}
  }
  function listRecords(records, query = '', status = '') {
    const q = query.toLocaleLowerCase('ru').trim();
    return records.filter(r => (!status || r.status === status) && (!q ||
      `${r.company} ${r.task} ${r.channel} ${r.owner}`.toLocaleLowerCase('ru').includes(q)))
      .sort((a, b) => (a.status === 'Закрыта') - (b.status === 'Закрыта') || a.due.localeCompare(b.due));
  }
  function stats(records, today = dateKey()) {
    return {all: records.length, active: records.filter(r => r.status === 'В работе').length,
      closed: records.filter(r => r.status === 'Закрыта').length,
      overdue: records.filter(r => r.status !== 'Закрыта' && r.due < today).length};
  }
  function csvCell(value) {
    let text = String(value == null ? '' : value);
    // CSV quotes alone do not stop spreadsheet formula execution.
    if (/^[\s\uFEFF]*[=+@-]/u.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }
  function toCsv(records) {
    const headers = ['Компания или тема','Канал','Ответственный','Следующее действие','Срок','Статус'];
    return '\uFEFF' + [headers, ...records.map(r => [r.company,r.channel,r.owner,r.task,r.due,r.status])]
      .map(row => row.map(csvCell).join(';')).join('\r\n');
  }
  return {KEY, STATUSES, CHANNELS, dateKey, validDate, normalizeRecord, sample,
    loadRecords, saveRecords, listRecords, stats, csvCell, toCsv};
});
