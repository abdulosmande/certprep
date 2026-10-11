const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require('playwright');
const root=path.resolve(__dirname,'..');
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>['.git','node_modules'].includes(e.name)?[]:e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);}
(async()=>{const b=await pw.chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});let count=0;const failures=[];
for(const f of walk(root).filter(f=>f.endsWith('.html')&&fs.readFileSync(f,'utf8').includes('const questions = ['))){
 console.log('Checking',path.relative(root,f));const p=await b.newPage({viewport:{width:375,height:850}});const errors=[];p.on('pageerror',e=>errors.push(e.message));let remote=0;await p.route('https://**/*',r=>{remote++;return r.abort();});
 try{await p.goto('file:///'+f.replaceAll('\\','/'));if(await p.locator('.btn-start').count())await p.locator('.btn-start').first().click();else await p.evaluate(()=>startExam());await p.evaluate(()=>document.fonts.ready);await p.evaluate(()=>Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});})));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'mobile overflow');
 assert.equal(await p.locator('.catalogue-nav a').count()>0,true,'catalogue navigation');
 const broken=await p.evaluate(()=>[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));assert.deepEqual(broken,[],'missing image');
 const modal=await p.evaluate(()=>{if(typeof confirmSubmit!=='function')return false;confirmSubmit();return true;});
 if(modal){await p.waitForTimeout(30);assert(await p.evaluate(()=>document.querySelector('#confirm-overlay').contains(document.activeElement)),'dialog focus');await p.keyboard.press('Tab');assert(await p.evaluate(()=>document.querySelector('#confirm-overlay').contains(document.activeElement)),'dialog tab trap');await p.keyboard.press('Escape');assert(await p.evaluate(()=>!document.querySelector('#confirm-overlay').classList.contains('show')&&!document.querySelector('#confirm-overlay').classList.contains('open')),'dialog escape');}
 if(f.includes('ct-genai')&&f.includes('DE')){const checkbox=p.locator('input[type=checkbox]').first();await checkbox.focus();await p.keyboard.press('Space');assert(await checkbox.isChecked(),'keyboard checkbox selected');await p.keyboard.press('Space');assert(!(await checkbox.isChecked()),'keyboard checkbox cleared');}
 const result=await p.evaluate(()=>{userAnswers=questions.map(q=>q.type==='K'?q.answer.map(v=>v?'richtig':'falsch'):[...q.answer]);doSubmit(false);return {pct:document.getElementById('final-score-pct')?.textContent,total:questions.reduce((t,q)=>t+q.pts,0),raw:document.getElementById('final-score-raw')?.textContent||document.getElementById('score-detail')?.textContent};});
 assert(parseFloat(result.pct)===100 || result.raw.includes('100%'),'perfect score: '+JSON.stringify(result));
 if(f.includes('ct-al-at')){await p.evaluate(()=>{doReset();startExam();userAnswers=questions.map(q=>[...q.answer]);const i=questions.findIndex(q=>q.id===4);userAnswers[i]=[1,0,0,1];doSubmit(false);});assert.equal((await p.locator('#final-score-raw').textContent()).trim(),'51/52','matching order matters');}
 if(f.includes('ct-al-at')||f.includes('ct-al-tta')){const deadline=await p.evaluate(()=>{doReset();document.getElementById('extended-time').checked=true;startExam();const initial=secondsLeft;examDeadline=Date.now()-1000;tickTimer();return {initial,expected:examConfig.minutes*75,submitted:examSubmitted,raw:document.getElementById('final-score-raw').textContent};});assert.equal(deadline.initial,deadline.expected);assert(deadline.submitted,'expired deadline submits');assert(deadline.raw.startsWith('0/'),'empty answers score zero');}
 assert.deepEqual(errors,[],'page errors');assert.equal(remote,0,'offline network requests');count++;
 }catch(e){failures.push(path.relative(root,f)+': '+e.message);}finally{await p.close();}
}
await b.close();if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}console.log(`${failures.length?'FAIL':'PASS'}: ${count} exams; scoring, keyboard/dialog controls, assets, offline requests and mobile layout.`);
})().catch(e=>{console.error(e);process.exitCode=1;});





