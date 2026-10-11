const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    ['.git', 'node_modules'].includes(e.name) ? [] : e.isDirectory()
      ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
const pages = walk(root).filter(f => f.endsWith('.html'));
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const sourceFixtures = JSON.parse(fs.readFileSync(path.join(root, 'tests/advanced-source-metadata.json'), 'utf8'));
let exams = 0;
for (const file of pages) {
  const h = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file).split(path.sep).join('/');
  assert(!/https:\/\/fonts\.(googleapis|gstatic)\.com/.test(h), `${relative}: remote fonts`);
  for (const script of h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/gi)) new vm.Script(script[1], { filename: relative });
  for (const m of h.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const ref = m[1];
    if (!/^(https?:|data:|#|mailto:)/.test(ref) && !ref.includes('${')) {
      assert(fs.existsSync(path.resolve(path.dirname(file), ref.split('#')[0])), `${relative}: missing ${ref}`);
    }
  }
  if (relative !== 'index.html') {
    assert(index.includes(relative), `${relative}: absent from catalogue`);
    assert(readme.includes(relative), `${relative}: absent from README`);
  }
  const match = h.match(/const questions\s*=\s*(\[[\s\S]*?\n\s*\]);/);
  if (!match) continue;
  exams++;
  const questions = JSON.parse(JSON.stringify(vm.runInNewContext(match[1])));
  const fixture = sourceFixtures.find(f => f.path === relative);
  if (fixture) {
    assert.equal(questions.length, fixture.count, `${relative}: source question count`);
    assert.equal(questions.reduce((n, q) => n + q.pts, 0), fixture.points, `${relative}: source point total`);
    assert.deepEqual(questions.map(({ id, answer, lo, k, pts }) => ({ id, answer, lo, k, pts })), fixture.keys, `${relative}: source key/metadata mismatch`);
  }
  const ids = new Set();
  for (const q of questions) {
    assert(!ids.has(q.id), `${relative}: duplicate question ${q.id}`); ids.add(q.id);
    assert(Number.isFinite(q.pts) && q.pts > 0, `${relative}: invalid points Q${q.id}`);
    assert(q.answer.length, `${relative}: empty key Q${q.id}`);
    if (q.type === 'K') {
      assert.equal(q.answer.length, q.statements.length, `${relative}: statement/key mismatch Q${q.id}`);
      assert(q.answer.every(a => typeof a === 'boolean'), `${relative}: invalid K key Q${q.id}`);
    } else if (q.type === 'matching') {
      assert.equal(q.answer.length, q.items.length, `${relative}: assignment/key mismatch Q${q.id}`);
      assert(q.answer.every(a => Number.isInteger(a) && a >= 0 && a < q.options.length), `${relative}: invalid assignment Q${q.id}`);
    } else {
      assert.equal(new Set(q.answer).size, q.answer.length, `${relative}: repeated answers Q${q.id}`);
      assert(q.answer.every(a => Number.isInteger(a) && a >= 0 && a < q.options.length), `${relative}: out-of-range key Q${q.id}`);
    }
    for (const figure of q.figures || []) assert(fs.existsSync(path.resolve(path.dirname(file), figure.src)), `${relative}: missing source figure Q${q.id}`);
  }
  if (relative.includes('ct-pt/DE/')) {
    const expected = { 6:3, 9:2, 14:3, 18:1, 21:0, 27:2, 28:1, 32:2, 36:2, 40:2 };
    for (const [id, key] of Object.entries(expected)) assert.deepEqual(questions.find(q => q.id === Number(id)).answer, [key]);
  }
  if (relative.includes('ct-al-tm/EN/ISTQB_CTAL-TM_Sample-Exam-Questions_v30_1.1.1')) {
    assert.deepEqual(questions.find(q => q.id === 50).answer, [3]);
    assert(questions.find(q => q.id === 50).sourceNote);
  }
}
for (const file of walk(path.join(root, 'assets')).filter(f => f.endsWith('.js'))) new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
for (const file of walk(path.join(root, 'assets')).filter(f => f.endsWith('.css'))) {
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/url\(([^)]+)\)/g)) {
    assert(fs.existsSync(path.resolve(path.dirname(file), m[1].replace(/["']/g, ''))), `Missing CSS asset ${m[1]}`);
  }
}
console.log(`PASS: ${pages.length} HTML pages, ${exams} exam datasets; syntax, keys, links, catalogue and local fonts.`);
