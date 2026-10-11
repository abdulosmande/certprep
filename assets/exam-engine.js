/* Shared engine for the Advanced Agile and Technical Test Analyst exams. */
const de = examConfig.language === 'de';
const say = (en, german) => de ? german : en;
let userAnswers = [], examSubmitted = false, examDeadline = null, timerInterval = null;
let secondsLeft = 0, confirmAction = null;
const el = id => document.getElementById(id);
const escapeText = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmtTime(sec) { return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
function startExam() {
  examSubmitted = false;
  userAnswers = questions.map(q => q.type === 'matching' ? q.items.map(() => null) : []);
  secondsLeft = Math.round(examConfig.minutes * 60 * (el('extended-time').checked ? 1.25 : 1));
  examDeadline = Date.now() + secondsLeft * 1000;
  el('start-screen').hidden = true; el('exam-screen').hidden = false; el('results').hidden = true;
  renderQuestions(); updateProgress(); tickTimer();
  clearInterval(timerInterval); timerInterval = setInterval(tickTimer, 250);
}
function tickTimer() {
  if (examSubmitted || examDeadline === null) return;
  secondsLeft = Math.max(0, Math.ceil((examDeadline - Date.now()) / 1000));
  el('timer').textContent = fmtTime(secondsLeft);
  el('timer').className = secondsLeft <= 300 ? 'danger' : secondsLeft <= 900 ? 'warning' : '';
  if (secondsLeft === 0) doSubmit(true);
}
document.addEventListener('visibilitychange', tickTimer);
function renderQuestionText(text) {
  // Fenced blocks (```) hold code, tables and listings and keep their indentation.
  return String(text).split(/```\n?/).map((part, i) => i % 2
    ? `<pre class="code-block" tabindex="0"><code>${escapeText(part.replace(/\n$/, ''))}</code></pre>`
    : (part.trim() ? `<p class="question-text">${escapeText(part.trim())}</p>` : '')).join('');
}
function renderQuestions() {
  el('questions-container').innerHTML = questions.map((q, qi) => {
    const inputs = q.type === 'matching'
      ? q.items.map((item, i) => `<label class="matching-row">${i + 1}. ${escapeText(item)}<select data-question="${qi}" data-item="${i}" aria-label="${say('Assignment', 'Zuordnung')} ${q.id}.${i + 1}"><option value="">${say('Choose a category', 'Kategorie wählen')}</option>${q.options.map((o, j) => `<option value="${j}">${String.fromCharCode(65 + j)}: ${escapeText(o)}</option>`).join('')}</select></label>`).join('')
      : q.options.map((option, i) => `<label class="option-row"><input type="${q.multi ? 'checkbox' : 'radio'}" name="q${q.id}" value="${i}" data-question="${qi}"><span>${String.fromCharCode(97 + i)}) ${escapeText(option)}</span></label>`).join('');
    const images = q.figures.map(f => `<img src="${escapeText(f.src)}" alt="${escapeText(f.alt)}">`).join('');
    return `<article class="question-card" id="question-${q.id}"><h2>${say('Question', 'Frage')} ${q.id} <small>${q.lo} · ${q.k} · ${q.pts} ${say('points', 'Punkte')}</small></h2>${renderQuestionText(q.text)}${q.showFigure ? `<div class="source-figure">${images}</div>` : `<details class="source-excerpt"><summary>${say('Original source question', 'Originalfrage aus der Quelle')}</summary>${images}</details>`}<fieldset><legend>${q.type === 'matching' ? say('Assign every item to a category.', 'Ordnen Sie jeden Eintrag einer Kategorie zu.') : say(`Select ${q.answer.length} answer${q.multi ? 's' : ''}.`, `Wählen Sie ${q.answer.length} Antwort${q.multi ? 'en' : ''}.`)}</legend>${inputs}</fieldset><section class="explanation" hidden></section></article>`;
  }).join('');
  el('questions-container').querySelectorAll('input,select').forEach(input => input.addEventListener('change', () => {
    if (examSubmitted) return;
    if (Date.now() >= examDeadline) { doSubmit(true); return; }
    const qi = Number(input.dataset.question), q = questions[qi];
    if (q.type === 'matching') userAnswers[qi][Number(input.dataset.item)] = input.value === '' ? null : Number(input.value);
    else userAnswers[qi] = [...el(`question-${q.id}`).querySelectorAll('input:checked')].map(i => Number(i.value));
    updateProgress();
  }));
}
function updateProgress() {
  const answered = questions.filter((q, i) => q.type === 'matching' ? userAnswers[i].every(a => a !== null) : userAnswers[i].length > 0).length;
  el('progress').textContent = `${answered}/${questions.length} ${say('answered', 'beantwortet')}`;
}
function confirmSubmit() { openConfirm('submit'); }
function confirmReset() { openConfirm('reset'); }
function openConfirm(action) {
  confirmAction = action;
  el('confirm-title').textContent = action === 'submit' ? say('Submit exam?', 'Prüfung abgeben?') : say('Restart exam?', 'Prüfung neu starten?');
  el('confirm-text').textContent = action === 'submit' ? say('Your answers will be scored and locked.', 'Ihre Antworten werden bewertet und gesperrt.') : say('Your answers and result will be cleared.', 'Ihre Antworten und das Ergebnis werden gelöscht.');
  el('confirm-overlay').classList.add('open');
}
function closeConfirm() { el('confirm-overlay').classList.remove('open'); }
function doConfirm() { const action = confirmAction; closeConfirm(); if (action === 'submit') doSubmit(false); else doReset(); }
function doSubmit(timedOut) {
  if (examSubmitted) return;
  examSubmitted = true; clearInterval(timerInterval); closeConfirm();
  let score = 0;
  questions.forEach((q, qi) => {
    const given = userAnswers[qi];
    const correct = q.type === 'matching'
      ? given.length === q.answer.length && given.every((a, i) => a === q.answer[i])
      : given.length === q.answer.length && given.every(a => q.answer.includes(a));
    if (correct) score += q.pts;
    const card = el(`question-${q.id}`); card.classList.add(correct ? 'correct' : 'incorrect');
    card.querySelectorAll('input,select').forEach(i => i.disabled = true);
    if (q.type !== 'matching') card.querySelectorAll('.option-row').forEach((row, i) => {
      if (q.answer.includes(i)) row.classList.add('correct-answer');
      else if (given.includes(i)) row.classList.add('wrong-answer');
    });
    const key = q.type === 'matching' ? q.answer.map((a, i) => `${i + 1} → ${String.fromCharCode(65 + a)}`).join(', ') : q.answer.map(a => String.fromCharCode(97 + a)).join(', ');
    const explanation = card.querySelector('.explanation'); explanation.hidden = false;
    explanation.innerHTML = `<h3>${say('Correct answer', 'Richtige Antwort')}: ${key}</h3><p>${escapeText(q.explanation)}</p>`;
  });
  const total = questions.reduce((n, q) => n + q.pts, 0);
  el('final-score-raw').textContent = `${score}/${total}`;
  el('final-score-pct').textContent = `${Math.round(score / total * 100)}%`;
  el('grade-badge').textContent = `${score >= examConfig.pass ? say('Passed', 'Bestanden') : say('Not passed', 'Nicht bestanden')} (≥ ${examConfig.pass} ${say('points', 'Punkte')})${timedOut ? say(' · Time expired', ' · Zeit abgelaufen') : ''}`;
  el('results').hidden = false; el('results').scrollIntoView({behavior: 'smooth', block: 'start'});
}
function doReset() {
  clearInterval(timerInterval); examDeadline = null; examSubmitted = false; userAnswers = [];
  el('questions-container').replaceChildren(); el('exam-screen').hidden = true; el('results').hidden = true; el('start-screen').hidden = false;
  el('start-screen').querySelector('button').focus();
}
