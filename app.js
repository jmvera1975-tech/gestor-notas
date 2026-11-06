const WEIGHTS=[
  {label:'Parcial 1',w:15},
  {label:'Parcial 2',w:20},
  {label:'Parcial 3',w:25},
  {label:'Examen final',w:40}
];
const MAX_STUDENTS=50, PASS=3, KEY='gestor-notas-v1';

// <logic>
function parseGrade(s){
  s=String(s==null?'':s).trim().replace(',','.');
  if(s==='') return {v:null,bad:false};
  if(!/^\d+(\.\d{0,2})?$/.test(s)) return {v:null,bad:true};
  const v=parseFloat(s);
  if(!(v>=0&&v<=5)) return {v:null,bad:true};
  return {v,bad:false};
}
function roundTo(x,d){const f=Math.pow(10,d);return Math.round(x*f+1e-9)/f;}
function fmt(n,d){return n.toFixed(d).replace('.',',');}
function compute(st,dec){
  let earned=0,filled=0;
  const vals=[],bad=[];
  WEIGHTS.forEach((c,i)=>{
    const r=parseGrade(st.g[i]);
    vals.push(r.v);bad.push(r.bad);
    if(r.v!==null){earned+=r.v*c.w/100;filled++;}
  });
  const out={vals,bad,earned,filled,def:null,status:'pendiente',label:'Pendiente',tone:filled===0?'muted':'warn',hint:'',hintBad:false};
  if(bad.some(Boolean)){out.status='invalido';out.label='Revisar notas';out.tone='bad';return out;}
  if(filled===4){
    out.def=roundTo(earned,dec);
    if(out.def>=PASS){out.status='aprueba';out.label='Aprueba';out.tone='ok';}
    else{out.status='reprueba';out.label='Reprueba';out.tone='bad';}
    return out;
  }
  if(vals[3]===null&&vals[0]!==null&&vals[1]!==null&&vals[2]!==null){
    const thr=PASS-0.5/Math.pow(10,dec);
    const need=(thr-earned)/(WEIGHTS[3].w/100);
    if(need<=0) out.hint='Aprueba con cualquier nota en el final';
    else if(need>5){out.hint='No alcanza el mínimo, ni con 5,0';out.hintBad=true;}
    else out.hint='Necesita '+fmt(Math.ceil(need*100-1e-9)/100,2)+' en el final';
  }
  return out;
}
// </logic>

const $=s=>document.querySelector(s);
const tbody=$('#rows');
let state=load();

function demo(){
  return {demo:true,
    meta:{course:'Álgebra lineal (ejemplo)',teacher:'',group:'A',period:'2026-2',decimals:1},
    students:[
      {id:'20261001',name:'Valentina Ríos Herrera',g:['4,2','3,8','4,5','4,0']},
      {id:'20261002',name:'Santiago Mejía Ortiz',g:['2,5','3,0','2,8','2,6']},
      {id:'20261003',name:'Camila Andrade Pérez',g:['3,5','4,0','3,2','3,8']},
      {id:'20261004',name:'Daniel Cárdenas Silva',g:['1,8','2,5','3,0','3,4']},
      {id:'20261005',name:'Laura Sofía Quintero',g:['4,8','4,5','5,0','4,7']},
      {id:'20261006',name:'Mateo Giraldo Ruiz',g:['3,0','3,2','2,9','']},
      {id:'20261007',name:'Isabela Torres León',g:['4,0','3,6','','']},
      {id:'20261008',name:'Juan Esteban Cano Vélez',g:['2,0','2,2','1,5','']}
    ]};
}
function load(){
  try{
    const r=localStorage.getItem(KEY);
    if(r){
      const s=JSON.parse(r);
      if(s&&Array.isArray(s.students)){
        s.meta=Object.assign({course:'',teacher:'',group:'',period:'',decimals:1},s.meta||{});
        s.students=s.students.slice(0,MAX_STUDENTS).map(x=>({id:String(x.id||''),name:String(x.name||''),g:[0,1,2,3].map(i=>String((x.g||[])[i]||''))}));
        return s;
      }
    }
  }catch(e){}
  return demo();
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
const dec=()=>state.meta.decimals===2?2:1;

function chip(text,tone){const s=document.createElement('span');s.className='chip '+tone;s.textContent=text;return s;}

function buildHead(){
  $('#wbar').innerHTML=WEIGHTS.map((c,i)=>'<span class="s'+i+'" style="flex:'+c.w+'"><em style="font-style:normal">'+c.label+'</em><i>'+c.w+'%</i></span>').join('');
  $('#thead').innerHTML='<th></th><th>Código</th><th>Nombre del estudiante</th>'+
    WEIGHTS.map(c=>'<th class="c">'+c.label+'<span class="w">'+c.w+'%</span></th>').join('')+
    '<th class="c">Definitiva</th><th>Estado</th><th class="no-print"></th>';
  $('#tfoot').innerHTML='<td class="lbl" colspan="3">Promedio del grupo</td>'+WEIGHTS.map(()=>'<td class="avg"></td>').join('')+'<td class="avg"></td><td></td><td class="no-print"></td>';
}

function makeRow(st,i){
  const tr=document.createElement('tr');
  tr.dataset.i=i;
  tr.innerHTML='<td class="idx"></td>'+
    '<td><input class="cod" data-f="id" maxlength="20" aria-label="Código" autocomplete="off"></td>'+
    '<td><input class="nom" data-f="name" maxlength="80" aria-label="Nombre del estudiante" autocomplete="off"></td>'+
    WEIGHTS.map((c,k)=>'<td class="gc"><input class="g" data-f="'+k+'" inputmode="decimal" maxlength="4" aria-label="'+c.label+'" autocomplete="off"></td>').join('')+
    '<td class="def"></td><td class="est"></td>'+
    '<td class="act no-print"><button type="button" class="del" aria-label="Eliminar estudiante" title="Eliminar">×</button></td>';
  tr.querySelector('[data-f="id"]').value=st.id;
  tr.querySelector('[data-f="name"]').value=st.name;
  tr.querySelectorAll('.g').forEach((el,k)=>{el.value=st.g[k];});
  return tr;
}
function updateRow(tr){
  const i=+tr.dataset.i, c=compute(state.students[i],dec());
  tr.querySelector('.idx').textContent=i+1;
  tr.querySelectorAll('.g').forEach((el,k)=>el.classList.toggle('bad',c.bad[k]));
  const def=tr.querySelector('.def');
  def.textContent=c.def===null?'—':fmt(c.def,dec());
  def.className='def '+c.status;
  const est=tr.querySelector('.est');
  est.replaceChildren(chip(c.label,c.tone));
  if(c.hint){const h=document.createElement('span');h.className='hint'+(c.hintBad?' badtxt':'');h.textContent=c.hint;est.appendChild(h);}
}
function buildRows(){
  tbody.replaceChildren();
  state.students.forEach((st,i)=>tbody.appendChild(makeRow(st,i)));
  updateAll();
}
function updateAll(){
  tbody.querySelectorAll('tr').forEach(updateRow);
  updateStats();
}
function updateStats(){
  const d=dec();
  const cs=state.students.map(s=>compute(s,d));
  const done=cs.filter(c=>c.def!==null);
  const ap=done.filter(c=>c.status==='aprueba').length;
  const rp=done.length-ap;
  const pen=cs.filter(c=>c.status==='pendiente').length;
  const inv=cs.filter(c=>c.status==='invalido').length;
  const defs=done.map(c=>c.def);
  $('#s-avg').textContent=defs.length?fmt(defs.reduce((a,b)=>a+b,0)/defs.length,2):'—';
  $('#s-ok').textContent=ap;$('#s-bad').textContent=rp;$('#s-pen').textContent=pen;
  $('#s-max').textContent=defs.length?fmt(Math.max(...defs),d):'—';
  $('#s-min').textContent=defs.length?fmt(Math.min(...defs),d):'—';
  $('#s-pct').textContent=defs.length?Math.round(ap/defs.length*100)+'%':'—';
  const avgs=document.querySelectorAll('#tfoot .avg');
  WEIGHTS.forEach((c,k)=>{
    const v=cs.map(x=>x.vals[k]).filter(x=>x!==null);
    avgs[k].textContent=v.length?fmt(v.reduce((a,b)=>a+b,0)/v.length,2):'—';
  });
  avgs[WEIGHTS.length].textContent=defs.length?fmt(defs.reduce((a,b)=>a+b,0)/defs.length,2):'—';
  const n=state.students.length;
  $('#count').textContent=n+' / '+MAX_STUDENTS;
  $('#btnAdd').disabled=n>=MAX_STUDENTS;
  $('#empty').hidden=n>0;
  $('#btnCsv').disabled=n===0;
  const nt=$('#notice');
  nt.classList.toggle('badtxt',inv>0);
  if(inv>0) nt.textContent=inv+(inv===1?' estudiante tiene':' estudiantes tienen')+' notas fuera del rango 0,0 a 5,0. Corríjalas antes de entregar.';
  else if(pen>0) nt.textContent=pen+(pen===1?' estudiante tiene':' estudiantes tienen')+' notas incompletas y saldrán como Pendiente en la lista para Registro.';
  else nt.textContent='';
  $('#demo').hidden=!state.demo;
}

tbody.addEventListener('input',e=>{
  const el=e.target, f=el.dataset.f; if(f===undefined) return;
  const tr=el.closest('tr'), st=state.students[+tr.dataset.i];
  if(f==='id'||f==='name') st[f]=el.value;
  else{
    const v=el.value.replace(/[^\d.,]/g,'');
    if(v!==el.value) el.value=v;
    st.g[+f]=v;
  }
  updateRow(tr);updateStats();save();
});
tbody.addEventListener('focusout',e=>{
  const el=e.target;
  if(!el.classList||!el.classList.contains('g')) return;
  const r=parseGrade(el.value);
  if(r.v!==null){
    const t=el.value.trim().replace('.',',');
    const tr=el.closest('tr');
    el.value=t; state.students[+tr.dataset.i].g[+el.dataset.f]=t; save();
  }
});
tbody.addEventListener('keydown',e=>{
  const el=e.target, f=el.dataset&&el.dataset.f; if(f===undefined) return;
  let dir=0;
  if(e.key==='Enter'||e.key==='ArrowDown') dir=1; else if(e.key==='ArrowUp') dir=-1; else return;
  e.preventDefault();
  const tr=el.closest('tr'), next=dir>0?tr.nextElementSibling:tr.previousElementSibling;
  if(next){const t=next.querySelector('[data-f="'+f+'"]');if(t){t.focus();t.select();}}
});
const armTimers=new WeakMap();
function armed(btn,labelArmed,fn){
  if(btn.classList.contains('armed')){
    clearTimeout(armTimers.get(btn));
    btn.classList.remove('armed');
    if(btn.dataset.orig) btn.textContent=btn.dataset.orig;
    fn();return;
  }
  btn.dataset.orig=btn.textContent;
  btn.textContent=labelArmed;btn.classList.add('armed');
  armTimers.set(btn,setTimeout(()=>{btn.classList.remove('armed');btn.textContent=btn.dataset.orig;},3000));
}
tbody.addEventListener('click',e=>{
  const b=e.target.closest('button.del'); if(!b) return;
  const i=+b.closest('tr').dataset.i;
  armed(b,'¿Quitar?',()=>{state.students.splice(i,1);save();buildRows();});
});
$('#btnAdd').addEventListener('click',()=>{
  if(state.students.length>=MAX_STUDENTS) return;
  state.students.push({id:'',name:'',g:['','','','']});
  save();buildRows();
  const last=tbody.lastElementChild.querySelector('[data-f="name"]');
  last.focus();last.scrollIntoView({block:'center'});
});
$('#btnClear').addEventListener('click',e=>{
  armed(e.currentTarget,'¿Confirmar?',()=>{state.students=[];state.demo=false;save();buildRows();});
});
$('#btnDemoClear').addEventListener('click',()=>{
  state.students=[];state.demo=false;
  state.meta=Object.assign(state.meta,{course:'',teacher:'',group:'',period:''});
  fillMeta();save();buildRows();
});
$('#btnPaste').addEventListener('click',()=>{
  const lines=$('#pasteBox').value.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  let added=0,skipped=0;
  for(const l of lines){
    if(state.students.length>=MAX_STUDENTS){skipped++;continue;}
    const parts=l.split(/\t|;/).map(p=>p.trim());
    const id=parts.length>1?parts[0]:'', name=parts.length>1?parts.slice(1).join(' '):parts[0];
    state.students.push({id:id.slice(0,20),name:name.slice(0,80),g:['','','','']});added++;
  }
  if(added){$('#pasteBox').value='';save();buildRows();}
  const nt=$('#notice');
  if(skipped){nt.classList.add('badtxt');nt.textContent='Se agregaron '+added+' estudiantes. '+skipped+' no cupieron: el máximo es '+MAX_STUDENTS+'.';}
});

function fillMeta(){
  $('#m-course').value=state.meta.course;$('#m-teacher').value=state.meta.teacher;
  $('#m-group').value=state.meta.group;$('#m-period').value=state.meta.period;
  $('#m-dec').value=String(dec());
}
[['#m-course','course'],['#m-teacher','teacher'],['#m-group','group'],['#m-period','period']].forEach(([sel,k])=>{
  $(sel).addEventListener('input',e=>{state.meta[k]=e.target.value;save();});
});
$('#m-dec').addEventListener('change',e=>{state.meta.decimals=+e.target.value;save();updateAll();});

function csvCell(x){x=String(x==null?'':x);return /[;"\r\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x;}
$('#btnCsv').addEventListener('click',()=>{
  const d=dec();
  const rows=[['Código','Nombre',...WEIGHTS.map(c=>c.label+' ('+c.w+'%)'),'Definitiva','Estado']];
  state.students.forEach(st=>{
    const c=compute(st,d);
    rows.push([st.id,st.name,...st.g.map(g=>String(g).trim().replace('.',',')),c.def===null?'':fmt(c.def,d),c.label]);
  });
  const csv='﻿'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n');
  const slug=(state.meta.course||'curso').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'curso';
  const name='notas-'+slug+(state.meta.group?'-g'+state.meta.group.toLowerCase().replace(/[^a-z0-9]+/g,''):'')+'.csv';
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('#btnPrint').addEventListener('click',()=>window.print());
window.addEventListener('beforeprint',()=>{$('#printDate').textContent='Generada el '+new Date().toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'});});

buildHead();fillMeta();buildRows();
