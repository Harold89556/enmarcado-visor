/* v1.15 – Calidad de impresión (DPI) de la foto de la obra */
(function(G){
const $=id=>document.getElementById(id);
const isPrint=()=>localStorage.getItem('enm_print')==='1';
function calc(){const st=G.state,img=st.rectifiedImage||st.rawImage;if(!img)return null;const pw=img.width,ph=img.height,cw=st.artWidthCm,ch=st.artHeightCm;if(!(cw>0&&ch>0))return null;
  const dx=pw/(cw/2.54),dy=ph/(ch/2.54),dpi=Math.round(Math.min(dx,dy));
  const lv=dpi>=300?['Excelente','#2e9d4f']:dpi>=200?['Buena','#7cb342']:dpi>=150?['Aceptable','#e0a020']:['Baja','#d64545'];
  const mx=d=>[pw/d*2.54,ph/d*2.54].map(v=>Math.floor(v));return{pw,ph,dpi,level:lv[0],color:lv[1],m150:mx(150),m300:mx(300)};}
const tip='Para imprimir a esta medida conviene una foto de mayor resolución o reducir el tamaño.';
function badge(){let b=$('dpiBadge');if(!b){const host=$('viewportContainer');if(!host)return;b=document.createElement('button');b.id='dpiBadge';b.className='absolute top-2 right-2 z-20 text-[10.5px] px-2.5 py-1 rounded-full font-semibold';host.appendChild(b);b.onclick=openInfo;}
  const r=calc();if(!r||G.state.mode==='room'){b.classList.add('hidden');return;}b.classList.remove('hidden');
  if(isPrint()){b.style.cssText=`background:${r.color};color:#fff;border:1px solid rgba(255,255,255,.35)`;b.textContent=`🖨 ${r.dpi} DPI · ${r.level}`;}
  else{b.style.cssText='background:rgba(14,13,11,.7);color:#bdb39c;border:1px solid rgba(201,164,92,.3)';b.textContent=`ⓘ ${r.dpi} DPI`;}}
function html(r,full){return `<div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded-full text-[11px] font-bold" style="background:${r.color};color:#fff">${r.dpi} DPI · ${r.level}</span><span class="text-[10.5px]" style="color:var(--muted)">${r.pw}×${r.ph} px para ${G.state.artWidthCm}×${G.state.artHeightCm} cm</span></div>
  <p class="text-[11px]">Medida máxima recomendada: <b>${r.m300[0]}×${r.m300[1]} cm</b> a 300 DPI (excelente) · <b>${r.m150[0]}×${r.m150[1]} cm</b> a 150 DPI (aceptable).</p>${r.dpi<200?`<p class="text-[11px]" style="color:#ffb4a8">${tip}</p>`:''}`;}
function openInfo(){const r=calc();if(!r)return;let m=$('dpiSheet');if(m)m.remove();
  m=document.createElement('div');m.id='dpiSheet';m.className='fixed inset-0 z-50 flex flex-col justify-end';m.style.background='rgba(8,7,5,.75)';
  m.innerHTML=`<div class="m-3 mb-[calc(env(safe-area-inset-bottom)+12px)] p-4 rounded-2xl flex flex-col gap-2.5" style="background:#17150f;border:1px solid rgba(201,164,92,.4)"><div class="flex items-center justify-between"><h2 class="serif text-[22px] font-semibold">Calidad de impresión</h2><button class="btn btn-gold px-4 py-1.5 xclose">Cerrar</button></div>
   <label class="flex items-center gap-2 text-[13px] font-semibold"><input id="dpiTgl" type="checkbox" class="w-5 h-5" style="accent-color:#c9a45c" ${isPrint()?'checked':''}> Es impresión / reproducción</label>
   <p class="text-[10.5px]" style="color:var(--muted)">Solo importa cuando se imprime una foto o reproducción de la obra. Para enmarcar una obra original, esto es solo informativo (resolución de la foto).</p>
   ${html(r)}<p class="text-[10px]" style="color:var(--muted)">Escala: Excelente ≥300 · Buena 200–299 · Aceptable 150–199 · Baja &lt;150 DPI. Se calcula con la foto recortada/enderezada.</p></div>`;
  document.body.appendChild(m);m.querySelector('.xclose').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove();};$('dpiTgl').onchange=e=>{localStorage.setItem('enm_print',e.target.checked?'1':'0');badge();};}
function hook(){const P=G.Pricing;if(!P||P._dpi)return;P._dpi=1;const u=P.update;P.update=function(){try{u.apply(this,arguments);}finally{try{badge();}catch(e){}}};
  const o=P.openSheet;P.openSheet=function(){o.apply(this,arguments);try{const r=calc(),L=$('psItems');if(!r||!L)return;const d=document.createElement('div');d.className='card px-3 py-2 flex flex-col gap-1';
    d.innerHTML=`<p class="text-[12px] font-semibold">Calidad de imagen ${isPrint()?'(impresión/reproducción)':'(informativo)'} · interno, no va en la ficha</p>`+html(r);L.appendChild(d);}catch(e){}};}
hook();addEventListener('load',()=>{hook();badge();});
G.Dpi={calc,badge,openInfo};
})(window);
