(()=>{
 const $=s=>document.querySelector(s),load=$('#load'),outage=$('#outage'),pause=$('#pause');
 let queue=0,paused=false,clock=0,history=[],overloaded=false;
 function log(message,kind='info'){const li=document.createElement('li'),time=document.createElement('time');time.textContent='T+'+String(clock).padStart(3,'0');li.dataset.kind=kind;li.append(time,document.createTextNode(message));$('#log').prepend(li);while($('#log').children.length>30)$('#log').lastElementChild.remove();}
 function render(state){
   for(const key of ['capacity','queue','latency','errors'])$('#'+key).textContent=state[key];
   $('#load-value').textContent=state.load+' / с';$('#node-b').classList.toggle('failed',state.outage);$('#route-b').classList.toggle('inactive',state.outage);$('#node-b-status').textContent=state.outage?'OFFLINE':'100 REQ/S';
   const bad=state.queue>0||state.errors>0;$('#health').textContent=paused?'МОДЕЛЬ НА ПАУЗЕ':bad?'ПЕРЕГРУЗКА':state.outage?'РАБОТАЕТ БЕЗ РЕЗЕРВА':'РАБОТАЕТ ШТАТНО';$('#health').classList.toggle('bad',bad);
   $('#explanation').textContent=state.errors>0?'Очередь заполнена. Часть запросов отклоняется.':state.queue>0?'Не хватает ёмкости. Снизьте поток или верните узел B.':state.outage?'Поток обслуживает только узел A.':'Запас ёмкости достаточен.';
   const max=Math.max(500,...history),points=history.map((v,i)=>`${i*480/39},${127-Math.min(1,v/max)*119}`);$('#chart-line').setAttribute('points',points.join(' '));$('#chart-fill').setAttribute('d',points.length?'M0 135 L'+points.join(' L')+' L'+((points.length-1)*480/39)+' 135 Z':'');$('#chart-max').textContent='шкала: '+max+' мс';
 }
 function step(){const state=NervModel.tick(queue,load.value,outage.checked);queue=state.queue;clock++;history.push(state.latency);if(history.length>40)history.shift();const bad=queue>0;if(bad!==overloaded){log(bad?'Начала расти очередь.':'Очередь разгружена.',bad?'error':'info');overloaded=bad;}render(state);}
 function redraw(){render({...NervModel.tick(0,load.value,outage.checked),queue,latency:history.at(-1)||31});}
 load.addEventListener('input',redraw);load.addEventListener('change',()=>log('Поток: '+load.value+' запросов/с.'));
 outage.addEventListener('change',()=>{log(outage.checked?'Узел B отключён. Поток перенаправлен.':'Узел B восстановлен.',outage.checked?'error':'info');redraw();});
 pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'Продолжить модель':'Пауза модели';pause.setAttribute('aria-pressed',String(paused));document.body.classList.toggle('paused',paused);log(paused?'Модель на паузе.':'Модель продолжена.');redraw();});
 $('#reset').addEventListener('click',()=>{queue=0;clock=0;history=[];overloaded=false;paused=false;load.value='70';outage.checked=false;pause.textContent='Пауза модели';pause.setAttribute('aria-pressed','false');document.body.classList.remove('paused');$('#log').replaceChildren();log('Новый опыт: два узла, поток 70/с.');step();});
 log('Опыт запущен: два узла, поток 70/с.');step();setInterval(()=>{if(!paused&&!document.hidden)step();},1000);
})();
