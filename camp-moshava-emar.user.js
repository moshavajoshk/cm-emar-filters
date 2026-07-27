// ==UserScript==
// @name         Camp Moshava eMAR – Enhanced Toolbar
// @namespace    http://campmoshava.org/
// @version      2.2
// @description  Hide administered/unaccepted toggles, delivery time pills, Today date button
// @match        https://system.campminder.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/moshavajoshk/cm-emar-filters/main/camp-moshava-emar.user.js
// @downloadURL  https://raw.githubusercontent.com/moshavajoshk/cm-emar-filters/main/camp-moshava-emar.user.js
// ==/UserScript==

(function () {
  'use strict';

  // ── Selectors & constants ──────────────────────────────────────────────────
  const STORAGE_KEY         = 'moshavaEMar.hideAdministered';
  const STORAGE_KEY_UNACCEPTED = 'moshavaEMar.hideUnaccepted';

  const HIDE_EMPTY_PERSONS       = true;
  const HIDE_EMPTY_MEAL_SECTIONS = true;

  const TAG_ADMINISTERED = 'data-moshava-administered';
  const TAG_UNACCEPTED      = 'data-moshava-unaccepted';
  const TAG_PERSON_EMPTY = 'data-moshava-person-empty';
  const TAG_MEAL_EMPTY   = 'data-moshava-meal-empty';

  const SEL_RESULTS      = '#divEMARBodyResults';
  const SEL_MEAL_SECTION = '.eMarResultsSetContainer';
  const SEL_MEAL_HEADER  = '.divHealthCenterResultHeader';
  const SEL_PERSON_CARD  = '.divHealthCenterResultPerson';
  const SEL_MODULE       = '.eMARMedicationResult';

  const DELIVERY_TIMES = ['Breakfast', 'Lunch', 'Dinner', 'Bedtime', 'As Needed', 'Other'];

  // ── Styles ─────────────────────────────────────────────────────────────────
  const STYLE = `
    /* Individual medication hiding */
    body.moshava-hide-administered [data-moshava-administered="true"] { display: none !important; }
    body.moshava-hide-unaccepted   [data-moshava-unaccepted="true"]      { display: none !important; }

    /* Person/meal section collapse — fires when either toggle is active */
    body.moshava-hiding [data-moshava-person-empty="true"] { display: none !important; }
    body.moshava-hiding [data-moshava-meal-empty="true"],
    body.moshava-hiding [data-moshava-meal-empty="true"] + .eMarResultsSetContainer {
      display: none !important;
    }

    #moshava-toolbar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px 10px;
      padding: 7px 14px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 1px 6px rgba(15,23,42,.08);
      font-family: inherit;
    }

    /* Shared pill base — high specificity to beat CampMinder's button resets */
    #moshava-toolbar #moshava-hide-administered-toggle,
    #moshava-toolbar #moshava-hide-unaccepted-toggle,
    #moshava-toolbar .moshava-pill,
    #moshava-toolbar #moshava-today-btn {
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      padding: 5px 13px !important;
      border-radius: 999px !important;
      background: #fff !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      user-select: none !important;
      white-space: nowrap !important;
      line-height: 1 !important;
      font-family: inherit !important;
      transition: background .12s, color .12s, border-color .12s !important;
      box-shadow: none !important;
      text-decoration: none !important;
    }

    /* Blue pills: hide toggles + delivery time pills */
    #moshava-toolbar #moshava-hide-administered-toggle,
    #moshava-toolbar #moshava-hide-unaccepted-toggle,
    #moshava-toolbar .moshava-pill {
      border: 1.5px solid #2563eb !important;
      color: #2563eb !important;
    }
    #moshava-toolbar #moshava-hide-administered-toggle:hover,
    #moshava-toolbar #moshava-hide-unaccepted-toggle:hover,
    #moshava-toolbar .moshava-pill:hover:not(.moshava-pill-custom) {
      background: #eff6ff !important;
    }
    #moshava-toolbar #moshava-hide-administered-toggle.active,
    #moshava-toolbar #moshava-hide-unaccepted-toggle.active,
    #moshava-toolbar .moshava-pill.active {
      background: #2563eb !important;
      border-color: #2563eb !important;
      color: #fff !important;
    }
    #moshava-toolbar #moshava-hide-administered-toggle .moshava-count,
    #moshava-toolbar #moshava-hide-unaccepted-toggle .moshava-count {
      font-size: 11px !important;
      font-weight: 400 !important;
    }

    /* Green Today button */
    #moshava-toolbar #moshava-today-btn {
      border: 1.5px solid #059669 !important;
      color: #059669 !important;
    }
    #moshava-toolbar #moshava-today-btn:hover { background: #f0fdf4 !important; }
    #moshava-toolbar #moshava-today-btn.active {
      background: #059669 !important;
      border-color: #059669 !important;
      color: #fff !important;
    }

    /* Custom pill: amber dashed hollow / solid amber when active */
    #moshava-toolbar .moshava-pill-custom {
      border-style: dashed !important;
      border-color: #d97706 !important;
      color: #d97706 !important;
      cursor: default !important;
    }
    #moshava-toolbar .moshava-pill-custom:hover { background: #fff !important; }
    #moshava-toolbar .moshava-pill-custom.active {
      background: #d97706 !important;
      border-color: #d97706 !important;
      border-style: solid !important;
      color: #fff !important;
    }

    #moshava-toolbar .moshava-sep {
      width: 1px; height: 22px; background: #e2e8f0; flex-shrink: 0;
    }
    #moshava-toolbar .moshava-section-label {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .07em; color: #94a3b8; white-space: nowrap; user-select: none;
    }
    #moshava-toolbar .moshava-pills {
      display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap;
    }
  `;

  // ── Style injection ────────────────────────────────────────────────────────
  function injectStyle() {
    if (document.getElementById('moshava-style')) return;
    const el = document.createElement('style');
    el.id = 'moshava-style';
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  // ── Delivery time helpers ──────────────────────────────────────────────────
  function getLabelText(cb) {
    return (cb.closest('label') || cb.parentElement)?.textContent?.trim() || '';
  }

  function getDeliveryCheckboxes() {
    return [...document.querySelectorAll('input[type="checkbox"].cmCheckboxWidth')]
      .filter(cb => DELIVERY_TIMES.includes(getLabelText(cb)) && cb.offsetParent !== null);
  }

  function getActivePillName() {
    const checkboxes = getDeliveryCheckboxes();
    if (!checkboxes.length) return 'Custom';
    const checked = checkboxes.filter(cb => cb.checked);
    if (checked.length === checkboxes.length) return 'All';
    if (checked.length === 1) return getLabelText(checked[0]);
    return 'Custom';
  }

  function selectAll() {
    const checkboxes = getDeliveryCheckboxes();
    checkboxes.filter(cb => !cb.checked).forEach((cb, i) => setTimeout(() => cb.click(), 60 * i));
    setTimeout(syncPills, 400);
  }

  function selectDeliveryTime(targetLabel) {
    const checkboxes = getDeliveryCheckboxes();
    const target = checkboxes.find(cb => getLabelText(cb) === targetLabel);
    if (target && !target.checked) target.click();
    checkboxes
      .filter(cb => getLabelText(cb) !== targetLabel && cb.checked)
      .forEach((cb, i) => setTimeout(() => cb.click(), 60 * (i + 1)));
    setTimeout(syncPills, 400);
  }

  function syncPills() {
    const active = getActivePillName();
    document.querySelectorAll('.moshava-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.time === active);
    });
  }

  // ── Date helpers ───────────────────────────────────────────────────────────
  function formatToday() {
    const d  = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${d.getFullYear()}`;
  }

  function getDateInput() {
    return [...document.querySelectorAll('input.hasDatepicker')]
      .find(i => i.offsetParent !== null && i.id.startsWith('dtDate_'));
  }

  function isDateToday() {
    const input = getDateInput();
    return !!input && input.value === formatToday();
  }

  function setDateToToday() {
    const input = getDateInput();
    if (!input) return;
    const jq = (typeof unsafeWindow !== 'undefined' && unsafeWindow.jQuery)
      || (typeof unsafeWindow !== 'undefined' && unsafeWindow.$)
      || window.jQuery || window.$;

    input.value = formatToday();
    if (jq) {
      const inst = jq(input).data('datepicker');
      if (inst && typeof inst.settings.onSelect === 'function') {
        inst.settings.onSelect.call(input, formatToday(), inst);
      }
    }
    setTimeout(syncTodayBtn, 150);
  }

  function syncTodayBtn() {
    const btn = document.getElementById('moshava-today-btn');
    if (btn) btn.classList.toggle('active', isDateToday());
  }

  // ── Module state helpers ───────────────────────────────────────────────────
  function isModuleAdministered(module) {
    const div = module.querySelector('.eMARAdministered');
    return div ? window.getComputedStyle(div).display !== 'none' : false;
  }

  function isModuleUnaccepted(module) {
    // Pending medications have a <span>(pending)</span> inside .eMARMedicationLabel
    return [...module.querySelectorAll('.eMARMedicationLabel span')]
      .some(s => s.textContent.trim() === '(pending)');
  }

  // ── Hide logic ─────────────────────────────────────────────────────────────
  function syncHidingClass() {
    const either = document.body.classList.contains('moshava-hide-administered')
                || document.body.classList.contains('moshava-hide-unaccepted');
    document.body.classList.toggle('moshava-hiding', either);
  }

  function applyToggle(on) {
    document.body.classList.toggle('moshava-hide-administered', on);
    syncHidingClass();
    tagAll();
  }

  function applyUnacceptedToggle(on) {
    document.body.classList.toggle('moshava-hide-unaccepted', on);
    syncHidingClass();
    tagAll();
  }

  // ── Tag all modules and collapse empty containers ──────────────────────────
  function tagAll() {
    const results = document.querySelector(SEL_RESULTS);
    if (!results) return;

    const hideCompleted = document.body.classList.contains('moshava-hide-administered');
    const hideUnaccepted   = document.body.classList.contains('moshava-hide-unaccepted');
    let administered = 0, unaccepted = 0;

    results.querySelectorAll(SEL_MODULE).forEach(m => {
      const isAdmin = isModuleAdministered(m);
      const isUnaccepted  = isModuleUnaccepted(m);
      if (isAdmin) administered++;
      if (isUnaccepted)  unaccepted++;
      m.setAttribute(TAG_ADMINISTERED, isAdmin ? 'true' : 'false');
      m.setAttribute(TAG_UNACCEPTED,      isUnaccepted  ? 'true' : 'false');
    });

    if (HIDE_EMPTY_PERSONS) {
      results.querySelectorAll(SEL_PERSON_CARD).forEach(p => {
        const mods = [...p.querySelectorAll(SEL_MODULE)];
        if (!mods.length) { p.removeAttribute(TAG_PERSON_EMPTY); return; }
        const allHidden = mods.every(m =>
          (hideCompleted && isModuleAdministered(m)) ||
          (hideUnaccepted   && isModuleUnaccepted(m))
        );
        allHidden
          ? p.setAttribute(TAG_PERSON_EMPTY, 'true')
          : p.removeAttribute(TAG_PERSON_EMPTY);
      });
    }

    if (HIDE_EMPTY_MEAL_SECTIONS) {
      results.querySelectorAll(SEL_MEAL_SECTION).forEach(sec => {
        const anyVisible = [...sec.querySelectorAll(SEL_PERSON_CARD)]
          .some(p => p.getAttribute(TAG_PERSON_EMPTY) !== 'true');
        const prev = sec.previousElementSibling;
        const hdr  = prev?.matches(SEL_MEAL_HEADER) ? prev : null;
        if (!anyVisible) {
          sec.setAttribute(TAG_MEAL_EMPTY, 'true');
          hdr?.setAttribute(TAG_MEAL_EMPTY, 'true');
        } else {
          sec.removeAttribute(TAG_MEAL_EMPTY);
          hdr?.removeAttribute(TAG_MEAL_EMPTY);
        }
      });
    }

    updateCounts(administered, unaccepted);
  }

  function updateCounts(administered, unaccepted) {
    const hideBtn    = document.getElementById('moshava-hide-administered-toggle');
    const unacceptedBtn = document.getElementById('moshava-hide-unaccepted-toggle');

    const hideCount = hideBtn?.querySelector('.moshava-count');
    if (hideCount) {
      const on = hideBtn.classList.contains('active');
      hideCount.textContent = (on && administered > 0) ? `(${administered})` : '';
    }

    const unacceptedCount = unacceptedBtn?.querySelector('.moshava-count');
    if (unacceptedCount) {
      const on = unacceptedBtn.classList.contains('active');
      unacceptedCount.textContent = (on && pending > 0) ? `(${pending})` : '';
    }
  }

  // ── Toolbar mount ──────────────────────────────────────────────────────────
  function mountToolbar() {
    if (document.getElementById('moshava-toolbar')) return;
    const results = document.querySelector(SEL_RESULTS);
    if (!results) return;

    const savedCompleted = GM_getValue(STORAGE_KEY, false);
    const savedUnaccepted   = GM_getValue(STORAGE_KEY_UNACCEPTED, false);

    const toolbar = document.createElement('div');
    toolbar.id = 'moshava-toolbar';

    // Hide administered
    const hideBtn = document.createElement('button');
    hideBtn.id = 'moshava-hide-administered-toggle';
    if (savedCompleted) hideBtn.classList.add('active');
    const hideCount = document.createElement('span');
    hideCount.className = 'moshava-count';
    hideBtn.append(document.createTextNode('Hide administered '), hideCount);
    hideBtn.addEventListener('click', () => {
      const on = hideBtn.classList.toggle('active');
      GM_setValue(STORAGE_KEY, on);
      applyToggle(on);
    });

    // Hide unaccepted
    const unacceptedBtn = document.createElement('button');
    unacceptedBtn.id = 'moshava-hide-unaccepted-toggle';
    if (savedUnaccepted) unacceptedBtn.classList.add('active');
    const unacceptedCount = document.createElement('span');
    unacceptedCount.className = 'moshava-count';
    unacceptedBtn.append(document.createTextNode('Hide unaccepted '), unacceptedCount);
    unacceptedBtn.addEventListener('click', () => {
      const on = unacceptedBtn.classList.toggle('active');
      GM_setValue(STORAGE_KEY_UNACCEPTED, on);
      applyUnacceptedToggle(on);
    });

    // Today button
    const todayBtn = document.createElement('button');
    todayBtn.id = 'moshava-today-btn';
    todayBtn.textContent = 'Today';
    todayBtn.addEventListener('click', setDateToToday);

    // Separator
    const sep = document.createElement('div');
    sep.className = 'moshava-sep';

    // Time label
    const timeLabel = document.createElement('span');
    timeLabel.className = 'moshava-section-label';
    timeLabel.textContent = 'Time:';

    // Delivery time pills
    const pillsWrap = document.createElement('div');
    pillsWrap.className = 'moshava-pills';
    [...DELIVERY_TIMES, 'All', 'Custom'].forEach(t => {
      const pill = document.createElement('button');
      pill.className   = 'moshava-pill' + (t === 'Custom' ? ' moshava-pill-custom' : '');
      pill.dataset.time = t;
      pill.textContent  = t;
      if (t === 'All')         pill.addEventListener('click', selectAll);
      else if (t !== 'Custom') pill.addEventListener('click', () => selectDeliveryTime(t));
      pillsWrap.appendChild(pill);
    });

    toolbar.append(hideBtn, unacceptedBtn, todayBtn, sep, timeLabel, pillsWrap);
    results.parentNode.insertBefore(toolbar, results);

    // Initial state
    applyToggle(savedCompleted);
    applyUnacceptedToggle(savedUnaccepted);
    syncTodayBtn();

    setTimeout(() => {
      syncPills();
      getDeliveryCheckboxes().forEach(cb =>
        cb.addEventListener('change', () => setTimeout(syncPills, 80))
      );
    }, 600);

    setTimeout(() => { if (!isDateToday()) setDateToToday(); }, 1200);

    const dateInput = getDateInput();
    if (dateInput) {
      dateInput.addEventListener('change', () => setTimeout(syncTodayBtn, 80));
      const jq = window.jQuery || window.$;
      if (jq) jq(dateInput).on('change', () => setTimeout(syncTodayBtn, 80));
    }
  }

  // ── MutationObserver ───────────────────────────────────────────────────────
  let observer = null, debounceTimer = null;

  function bindObserver() {
    const results = document.querySelector(SEL_RESULTS);
    if (!results || observer) return;
    observer = new MutationObserver(() => {
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => { debounceTimer = null; tagAll(); }, 150);
    });
    observer.observe(results, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['style', 'class'],
    });
  }

  // Safety-net poll
  setInterval(() => {
    if (document.getElementById('moshava-toolbar')) { syncPills(); syncTodayBtn(); }
  }, 2000);

  // ── Boot ───────────────────────────────────────────────────────────────────
  function boot() {
    injectStyle();
    setInterval(() => {
      if (!document.querySelector(SEL_RESULTS)) return;
      if (!document.getElementById('moshava-toolbar')) {
        mountToolbar();
        bindObserver();
      }
      tagAll();
    }, 500);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tagAll(); });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();
})();
