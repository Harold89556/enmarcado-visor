/* Enmarcado Studio Pro v1.8 – Presupuesto en guaraníes, epígrafe metálico, ficha blanca + PDF */
(function(G){
const $=id=>document.getElementById(id);
/* ---------- formato ₲ con punto de miles ---------- */
const fmt=n=>{n=Math.round(+n||0);const s=Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');return(n<0?'-':'')+s;};
const gs=n=>'₲ '+fmt(n);
const parseMoney=v=>{const d=String(v==null?'':v).replace(/[^\d]/g,'');return d?parseInt(d,10):0;};
function bindMoney(inp){ // formato en vivo mientras se escribe
  if(!inp||inp._money)return;inp._money=true;inp.setAttribute('inputmode','numeric');inp.type='text';inp.autocomplete='off';
  inp.addEventListener('input',()=>{const pos=inp.selectionStart,digitsBefore=inp.value.slice(0,pos).replace(/\D/g,'').length,raw=inp.value.replace(/\D/g,'');
    inp.value=raw?fmt(parseInt(raw,10)):'';let k=0,p=0;while(p<inp.value.length&&k<digitsBefore){if(/\d/.test(inp.value[p]))k++;p++;}try{inp.setSelectionRange(p,p);}catch(e){}});
  if(inp.value)inp.value=fmt(parseMoney(inp.value));
}
/* ---------- configuración de precios ---------- */
const LS='enm_prices_v1';
const DEF={wastePct:10,defaultFramePerM:35000,passM2:120000,passPerCm:0,filetePerM:15000,glassBrilloM2:150000,glassMateM2:230000,ivaPct:10,fichaItems:false,
  backingOn:true,backingM2:40000,laborMode:'fixed',laborFixed:50000,laborPct:20,
  plaque:{gold:45000,silver:45000,chromeGold:65000,chromeSilver:65000},business:'',logo:'',rodMode:'m',rodDefaultCm:300,kerfCm:0.5};
let P=Object.assign({},DEF,JSON.parse(localStorage.getItem(LS)||'{}'));P.plaque=Object.assign({},DEF.plaque,P.plaque||{});
if(G.ENM_WP&&G.ENM_WP.prices){P=Object.assign({},DEF,G.ENM_WP.prices);P.plaque=Object.assign({},DEF.plaque,G.ENM_WP.prices.plaque||{});}
const saveP=()=>localStorage.setItem(LS,JSON.stringify(P));
const FINISH={gold:'Dorado metal',silver:'Plateado metal',chromeGold:'Cromado dorado',chromeSilver:'Cromado plateado'};
/* ---------- cálculo ---------- */
function compute(){
  const st=G.state,{W,H}=G.totals(),fw=st.frameWidthCm,fil=st.hasFilete?st.fileteWidthCm:0,pw=st.passWidthCm,dbl=st.glass==='double';
  const waste=1+(P.wastePct||0)/100,items=[];
  const fr=st.selectedFrame,ppm=fr.price||P.defaultFramePerM,rod=rodPlan(W,H,fw,fr),nm=`Moldura ${fr.name}${fr.sku?' ('+fr.sku+')':''}`;
  if(P.rodMode==='rod'){const rp=fr.rodPrice||Math.round(ppm*rod.rodCm/100);items.push({k:'moldura',label:nm,qty:`${rod.rods} varilla${rod.rods>1?'s':''} de ${fmtCm(rod.rodCm)} × ${gs(rp)}${fr.price||fr.rodPrice?'':' · precio genérico'}`,amount:rod.rods*rp,rod});}
  else{const mM=2*(W+H)/100*waste;items.push({k:'moldura',label:nm,qty:`${mM.toFixed(2).replace('.',',')} m${fr.price?'':' · precio genérico'}`,amount:mM*ppm,rod});}
  const ow=W-2*fw,oh=H-2*fw; // abertura = tamaño de vidrio/fondo/paspartú
  if(pw>0&&!dbl){const a=ow*oh/1e4;items.push({k:'pass',label:'Paspartú',qty:`${pw} cm por lado · ${a.toFixed(2).replace('.',',')} m²`,amount:a*P.passM2+pw*(P.passPerCm||0)});}
  if(fil>0){const iw=st.artWidthCm+2*fil,ih=st.artHeightCm+2*fil,m=2*(iw+ih)/100*waste;items.push({k:'filete',label:'Filete',qty:`${m.toFixed(2).replace('.',',')} m`,amount:m*P.filetePerM});}
  if(st.glass!=='none'){const a=ow*oh/1e4,n=dbl?2:1,pr=st.glassFinish==='mate'?P.glassMateM2:P.glassBrilloM2;
    items.push({k:'vidrio',label:`Vidrio ${st.glassFinish==='mate'?'mate (antirreflejo)':'brillante'}${dbl?' · doble':''}`,qty:`${n} × ${a.toFixed(2).replace('.',',')} m²`,amount:a*n*pr});}
  if(P.backingOn&&!dbl){const a=ow*oh/1e4;items.push({k:'fondo',label:'Fondo (MDF/cartón)',qty:`${a.toFixed(2).replace('.',',')} m²`,amount:a*P.backingM2});}
  const pl=st.plaque;if(pl&&pl.on)items.push({k:'epigrafe',label:`Epígrafe ${FINISH[pl.finish]}`,qty:`${pl.w}×${pl.h} cm`,amount:P.plaque[pl.finish]||0});
  const mat=items.reduce((a,i)=>a+Math.round(i.amount),0);
  const labor=P.laborMode==='pct'?mat*(P.laborPct||0)/100:(P.laborFixed||0);
  if(labor>0)items.push({k:'mano',label:'Mano de obra',qty:P.laborMode==='pct'?`${P.laborPct}% de materiales`:'monto fijo',amount:labor});
  items.forEach(i=>i.amount=Math.round(i.amount));
  const sub=items.reduce((a,i)=>a+i.amount,0),iva=Math.round(sub*(P.ivaPct||0)/100);
  return{items,subtotal:sub,iva,ivaPct:P.ivaPct||0,total:sub+iva,materials:mat};
}
const fmtCm=v=>(Math.round(v*10)/10).toString().replace('.',',')+' cm';
/* ---------- estimación de varillas (corte a inglete + sierra) ---------- */
function rodPlan(W,H,fw,fr){
  const rodCm=(fr&&fr.rodCm)||P.rodDefaultCm||300,kerf=P.kerfCm==null?.5:P.kerfCm;
  const pieces=[W,W,H,H].map(x=>Math.round(x*10)/10); // W,H = medida exterior = luz + 2×ancho de moldura (largo en punta de inglete)
  const need=pieces.map(x=>x+kerf); // cada pieza consume su largo + 1 corte de sierra
  if(need.some(x=>x>rodCm))return{rodCm,kerf,pieces,rods:need.reduce((a,x)=>a+Math.ceil(x/rodCm),0),bins:[],tooLong:true,usedCm:need.reduce((a,b)=>a+b,0),wasteCm:0,leftovers:[]};
  const order=need.map((x,i)=>[x,i]).sort((a,b)=>b[0]-a[0]),bins=[];
  order.forEach(([x,i])=>{let b=bins.filter(b=>b.free>=x).sort((a,c)=>a.free-c.free)[0];if(!b){b={free:rodCm,items:[]};bins.push(b);}b.free-=x;b.items.push(pieces[i]);});
  const usedCm=need.reduce((a,b)=>a+b,0),total=bins.length*rodCm;
  return{rodCm,kerf,pieces,rods:bins.length,bins,usedCm,wasteCm:total-usedCm,leftovers:bins.map(b=>Math.round(b.free*10)/10)};
}
function rodText(r){if(!r)return'';const pz=r.pieces;return `Cortes: 2 × ${fmtCm(pz[0])} + 2 × ${fmtCm(pz[2])} (inglete 45°, sierra ${fmtCm(r.kerf)}) · ${r.rods} varilla${r.rods>1?'s':''} de ${fmtCm(r.rodCm)} · usa ${(r.usedCm/100).toFixed(2).replace('.',',')} m · sobrante ${r.leftovers.map(fmtCm).join(' + ')||'—'}${r.tooLong?' · ⚠ un lado supera el largo de la varilla (requiere empalme)':''}`;}
function update(){const t=$('totalPill');if(!t)return;t.querySelector('b').textContent=gs(compute().total);}
/* ---------- epígrafe (placa metálica grabada) ---------- */
const METAL={
  gold:['#7a5a1c','#d9b456','#f6e3a1','#b88a2c','#e7c873','#8a6420'],
  silver:['#6d7074','#c9cdd1','#f1f3f5','#a4a8ad','#dfe2e5','#7c8085'],
  chromeGold:['#9c7420','#fbe39c','#d6aa4c','#fff5cf','#e2b658','#9c7420'],
  chromeSilver:['#8a8f95','#ffffff','#c3c7cc','#f6f8fa','#cfd3d7','#80858b']};
function plaqueRect(ox,oy,ow,oh,scale){
  const st=G.state,pl=st.plaque;if(!pl||!pl.on)return null;
  const fW=st.frameWidthCm*scale,pW=st.passWidthCm*scale,fil=st.hasFilete?st.fileteWidthCm*scale:0;
  const aw=ow-2*(fW+pW+fil),ah=oh-2*(fW+pW+fil),ax=ox+fW+pW+fil,ay=oy+fW+pW+fil;
  const w=pl.w*scale,h=pl.h*scale,margin=pW;if(margin<h*1.05)return{bad:true};
  let x=pl.pos==='left'?ax:pl.pos==='right'?ax+aw-w:ax+(aw-w)/2;
  const y=ay+ah+fil+(margin-h)*(pl.vy==null?.5:pl.vy);
  return{x,y,w,h};
}
function drawPlaque(ctx,ox,oy,ow,oh,scale){
  const r=plaqueRect(ox,oy,ow,oh,scale);if(!r||r.bad)return;const{x,y,w,h}=r,pl=G.state.plaque,M=METAL[pl.finish]||METAL.gold;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=Math.max(1,h*.08);ctx.shadowOffsetY=Math.max(.5,h*.04);
  const g=ctx.createLinearGradient(x,y,x+w,y+h*.8);[0,.22,.42,.6,.8,1].forEach((s,i)=>g.addColorStop(s,M[i]));
  ctx.fillStyle=g;const rr=Math.min(h*.08,w*.05);ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,rr):ctx.rect(x,y,w,h);ctx.fill();ctx.shadowColor='transparent';
  // cepillado
  ctx.save();ctx.clip();ctx.globalAlpha=pl.finish.startsWith('chrome')?.08:.16;for(let i=0;i<h;i+=Math.max(1,h/40)){ctx.fillStyle=i%2?'#fff':'#000';ctx.fillRect(x,y+i,w,Math.max(.5,h/120));}ctx.restore();
  // bisel
  const b=Math.max(1,h*.06);ctx.lineWidth=b;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.moveTo(x+b/2,y+h-b/2);ctx.lineTo(x+b/2,y+b/2);ctx.lineTo(x+w-b/2,y+b/2);ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.moveTo(x+w-b/2,y+b/2);ctx.lineTo(x+w-b/2,y+h-b/2);ctx.lineTo(x+b/2,y+h-b/2);ctx.stroke();
  // texto grabado
  const l1=pl.title||'',l2=[pl.artist,pl.year].filter(Boolean).join(' · ');const lines=[l1,l2].filter(Boolean);
  if(lines.length){const fs1=h*(lines.length>1?.34:.45),fs2=h*.24;ctx.textAlign='center';ctx.textBaseline='middle';
    const dark=pl.finish==='chromeSilver'||pl.finish==='silver'?'rgba(20,22,26,.92)':'rgba(48,28,2,.92)';
    const put=(t,fs,yy,font)=>{ctx.font=font.replace('#',fs.toFixed(1)+'px');let s=1;const mw=ctx.measureText(t).width;if(mw>w*.9){s=w*.9/mw;ctx.font=font.replace('#',(fs*s).toFixed(1)+'px');}
      ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillText(t,x+w/2,yy+Math.max(.4,fs*.05));ctx.fillStyle=dark;ctx.fillText(t,x+w/2,yy);};
    if(lines.length>1){put(l1,fs1,y+h*.38,'italic 600 # "Cormorant Garamond",Georgia,serif');put(l2,fs2,y+h*.72,'500 # Inter,Arial,sans-serif');}
    else put(l1,fs1,y+h*.52,'italic 600 # "Cormorant Garamond",Georgia,serif');}
  ctx.restore();
}
/* ---------- UI ---------- */
function el(h){const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild;}
const moneyIn=(id,label,val)=>`<label class="text-[11px]">${label}<input id="${id}" class="fe-in money" value="${fmt(val)}"></label>`;
const numIn=(id,label,val,step)=>`<label class="text-[11px]">${label}<input id="${id}" class="fe-in" type="number" inputmode="decimal" step="${step||1}" value="${val}"></label>`;
function ensureDom(){
  if($('priceSheet'))return;
  document.body.appendChild(el(`<div id="priceSheet" class="kb-modal fixed inset-0 z-50 hidden flex flex-col" style="background:rgba(8,7,5,.88);backdrop-filter:blur(6px)">
   <div class="kb-inner m-3 p-4 rounded-2xl flex flex-col gap-3 overflow-y-auto" style="background:#17150f;border:1px solid rgba(201,164,92,.4)">
    <div class="flex items-center justify-between"><h2 class="serif text-[24px] font-semibold">Presupuesto</h2><div class="flex gap-1.5"><button id="psSettings" class="btn btn-ghost px-3 py-1.5">⚙ Precios</button><button id="psClose" class="btn btn-ghost px-3 py-1.5">Cerrar</button></div></div>
    <label class="text-[11px]">Cliente (opcional)<input id="psClient" class="fe-in" placeholder="Nombre del cliente"></label>
    <div id="psItems" class="flex flex-col gap-1"></div>
    <div class="flex items-baseline justify-between pt-2" style="border-top:1px solid var(--line)"><span class="serif text-[18px] font-semibold">Total con IVA</span><b id="psTotal" class="serif text-[28px]" style="color:var(--gold2)"></b></div>
    <div class="grid grid-cols-2 gap-2"><button id="psPdf" class="btn btn-gold justify-center py-2.5">Ficha PDF</button><button id="psPng" class="btn btn-ghost justify-center py-2.5">Ficha PNG</button></div>
    <button id="psShare" class="btn btn-gold justify-center py-2.5">↗ Compartir con el cliente (3D + PDF)</button>
   </div></div>`));
  document.body.appendChild(el(`<div id="priceSettings" class="kb-modal fixed inset-0 z-50 hidden flex flex-col" style="background:rgba(8,7,5,.92)">
   <div class="kb-inner m-3 p-4 rounded-2xl flex flex-col gap-3 overflow-y-auto" style="background:#17150f;border:1px solid rgba(201,164,92,.4)">
    <div class="flex items-center justify-between"><h2 class="serif text-[24px] font-semibold">Precios (₲)</h2><button id="pzClose" class="btn btn-gold px-4 py-1.5">Guardar</button></div>
    <p class="lbl">Moldura</p><div class="grid grid-cols-2 gap-2">${numIn('pzWaste','Desperdicio (%)',P.wastePct)}${moneyIn('pzFrameDef','Precio genérico por metro',P.defaultFramePerM)}</div>
    <p class="text-[10px] -mt-1" style="color:var(--muted)">Cada marco usa su propio precio por metro (editable en “Mis marcos”). El genérico se usa si el marco no tiene precio.</p>
    <p class="lbl">Varillas</p><div class="grid grid-cols-2 gap-2"><label class="text-[11px] col-span-2">Cobrar moldura por<select id="pzRodMode" class="fe-in"><option value="m">Metros lineales usados (+ desperdicio %)</option><option value="rod">Varillas completas necesarias</option></select></label>${numIn('pzRodLen','Largo de varilla por defecto (cm)',P.rodDefaultCm)}${numIn('pzKerf','Corte de sierra por pieza (cm)',P.kerfCm,0.1)}</div>
    <p class="text-[10px] -mt-1" style="color:var(--muted)">Cada marco puede tener su propio largo de varilla y precio por varilla (en “Mis marcos”). Si no tiene precio por varilla se usa precio/m × largo.</p>
    <p class="lbl">Paspartú y filete</p><div class="grid grid-cols-2 gap-2">${moneyIn('pzPassM2','Paspartú por m²',P.passM2)}${moneyIn('pzPassCm','Recargo por cm de ancho',P.passPerCm)}${moneyIn('pzFilete','Filete por metro',P.filetePerM)}</div>
    <p class="lbl">Vidrio (por m²; doble vidrio = 2 láminas)</p><div class="grid grid-cols-2 gap-2">${moneyIn('pzGlassB','Brillante',P.glassBrilloM2)}${moneyIn('pzGlassM','Mate / antirreflejo',P.glassMateM2)}</div>
    <p class="lbl">Fondo</p><div class="grid grid-cols-2 gap-2 items-end"><label class="text-[11px] flex items-center gap-2 pb-2"><input id="pzBackOn" type="checkbox" class="w-4 h-4" style="accent-color:#c9a45c" ${P.backingOn?'checked':''}> Incluir fondo MDF/cartón</label>${moneyIn('pzBack','Fondo por m²',P.backingM2)}</div>
    <p class="lbl">Mano de obra</p><div class="grid grid-cols-2 gap-2 items-end"><label class="text-[11px] col-span-2">Modo<select id="pzLaborMode" class="fe-in"><option value="fixed">Monto fijo</option><option value="pct">% de materiales</option></select></label>${moneyIn('pzLaborFix','Monto fijo',P.laborFixed)}${numIn('pzLaborPct','Porcentaje (%)',P.laborPct)}</div>
    <p class="lbl">Epígrafe (precio por placa)</p><div class="grid grid-cols-2 gap-2">${moneyIn('pzPlGold','Dorado metal',P.plaque.gold)}${moneyIn('pzPlSilver','Plateado metal',P.plaque.silver)}${moneyIn('pzPlCG','Cromado dorado',P.plaque.chromeGold)}${moneyIn('pzPlCS','Cromado plateado',P.plaque.chromeSilver)}</div>
    <p class="lbl">Impuesto y ficha</p><div class="grid grid-cols-2 gap-2 items-end">${numIn('pzIva','IVA (%)',P.ivaPct)}<label class="text-[11px] flex items-center gap-2 pb-2"><input id="pzShowItems" type="checkbox" class="w-4 h-4" style="accent-color:#c9a45c" ${P.fichaItems?'checked':''}> Mostrar detalle de costos en la ficha</label></div>
    <p class="lbl">Publicar en la web</p><button type="button" id="pzWeb" class="btn btn-ghost justify-center py-2" style="border-color:var(--gold);color:var(--gold2)">🌐 Link web para clientes y Mis links publicados…</button>
    <p class="lbl">Negocio (para la ficha)</p><div class="grid grid-cols-1 gap-2"><label class="text-[11px]">Nombre del negocio<input id="pzBiz" class="fe-in" value=""></label>
      <div class="flex items-center gap-2 text-[11px]"><button type="button" id="pzLogoBtn" class="btn btn-ghost py-2 px-3">Elegir logo…</button><span id="pzLogoLbl" style="color:var(--muted)">${P.logo?'Logo cargado ✓':'Sin logo'}</span><button type="button" id="pzLogoDel" class="chip py-1.5 ${P.logo?'':'hidden'}">Quitar</button><input id="pzLogo" type="file" accept="image/*" class="hidden"></div></div>
   </div></div>`));
  $('pzBiz').value=P.business||'';$('pzLaborMode').value=P.laborMode;$('pzRodMode').value=P.rodMode||'m';
  document.querySelectorAll('.money').forEach(bindMoney);
  $('psClose').onclick=()=>$('priceSheet').classList.add('hidden');
  $('pzWeb').onclick=()=>G.Publish&&G.Publish.openSettings();$('psSettings').onclick=()=>$('priceSettings').classList.remove('hidden');
  $('psClient').oninput=e=>{G.state.clientName=e.target.value;};
  $('psShare').onclick=()=>G.Extras&&G.Extras.shareAll();$('psPdf').onclick=()=>exportFicha('pdf');$('psPng').onclick=()=>exportFicha('png');
  $('pzLogoBtn').onclick=()=>$('pzLogo').click();$('pzLogoDel').onclick=()=>{P.logo='';$('pzLogoLbl').textContent='Sin logo';$('pzLogoDel').classList.add('hidden');};
  $('pzLogo').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas'),k=Math.min(1,300/Math.max(i.width,i.height));c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);P.logo=c.toDataURL('image/png');$('pzLogoLbl').textContent='Logo cargado ✓';$('pzLogoDel').classList.remove('hidden');};i.src=r.result;};r.readAsDataURL(f);};
  $('pzClose').onclick=()=>{const m=id=>parseMoney($(id).value),n=id=>parseFloat($(id).value)||0;
    Object.assign(P,{wastePct:n('pzWaste'),defaultFramePerM:m('pzFrameDef'),passM2:m('pzPassM2'),passPerCm:m('pzPassCm'),filetePerM:m('pzFilete'),glassBrilloM2:m('pzGlassB'),glassMateM2:m('pzGlassM'),
      backingOn:$('pzBackOn').checked,backingM2:m('pzBack'),laborMode:$('pzLaborMode').value,laborFixed:m('pzLaborFix'),laborPct:n('pzLaborPct'),ivaPct:n('pzIva'),fichaItems:$('pzShowItems').checked,business:$('pzBiz').value.trim(),rodMode:$('pzRodMode').value,rodDefaultCm:Math.max(50,n('pzRodLen')||300),kerfCm:Math.max(0,n('pzKerf'))});
    P.plaque={gold:m('pzPlGold'),silver:m('pzPlSilver'),chromeGold:m('pzPlCG'),chromeSilver:m('pzPlCS')};saveP();$('priceSettings').classList.add('hidden');renderSheet();update();G.showToast('Precios guardados','check');};
}
function renderSheet(){const r=compute(),L=$('psItems');L.innerHTML='';
  r.items.forEach(i=>{const d=el(`<div class="card px-3 py-2 flex items-center gap-2"><div class="flex-1 min-w-0"><p class="text-[13px] font-semibold truncate"></p><p class="text-[10.5px]" style="color:var(--muted)"></p></div><b class="tabular-nums text-[14px]" style="color:var(--cream)"></b></div>`);
    d.querySelector('p').textContent=i.label;d.querySelectorAll('p')[1].textContent=i.qty+(i.rod?' · '+rodText(i.rod):'');d.querySelector('b').textContent=gs(i.amount);L.appendChild(d);});
  const sep=el(`<div class="flex flex-col gap-0.5 pt-2 text-[13px]" style="border-top:1px solid var(--line)"><div class="flex justify-between"><span>Subtotal</span><b class="tabular-nums"></b></div><div class="flex justify-between"><span></span><b class="tabular-nums"></b></div></div>`);
  sep.querySelectorAll('b')[0].textContent=gs(r.subtotal);sep.querySelectorAll('span')[1].textContent=`IVA ${r.ivaPct}%`;sep.querySelectorAll('b')[1].textContent=gs(r.iva);L.appendChild(sep);
  $('psTotal').textContent=gs(r.total);$('psClient').value=G.state.clientName||'';}
function openSheet(){ensureDom();renderSheet();$('priceSheet').classList.remove('hidden');}
/* ---------- FICHA BLANCA (PNG/PDF) ---------- */
function buildFicha(){
  const st=G.state,img=st.rectifiedImage||st.rawImage;if(!img)return null;
  const Wp=1240,Hp=1754,c=document.createElement('canvas');c.width=Wp;c.height=Hp;const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,Wp,Hp);const M=70,ink='#1d1d1f',mute='#5b5b60',gold='#9a7322';
  let y=M;
  if(P.logo){const li=new Image();li.src=P.logo;try{const k=Math.min(110/li.height,260/li.width);x.drawImage(li,Wp-M-li.width*k,M-10,li.width*k,li.height*k);}catch(e){}}
  x.fillStyle=gold;x.font='600 22px Inter,Arial,sans-serif';x.fillText((P.business||'ENMARCADO STUDIO PRO').toUpperCase(),M,y+8);
  x.fillStyle=ink;x.font='700 44px Inter,Arial,sans-serif';x.fillText('Ficha técnica y presupuesto',M,y+62);
  x.fillStyle=mute;x.font='24px Inter,Arial,sans-serif';const d=new Date();x.fillText(`Fecha: ${d.toLocaleDateString('es-PY')}${st.clientName?'   ·   Cliente: '+st.clientName:''}`,M,y+102);
  y+=130;x.fillStyle='#e6e1d6';x.fillRect(M,y,Wp-2*M,2);y+=24;
  // vista previa
  const {W,H}=G.totals(),box={w:Wp-2*M,h:560},s=Math.min(box.w/W,box.h/H)*.92,fw=W*s,fh=H*s,fx=M+(box.w-fw)/2,fy=y+(box.h-fh)/2;
  x.fillStyle='#f3f1ec';x.fillRect(M,y,box.w,box.h);x.save();x.shadowColor='rgba(0,0,0,.3)';x.shadowBlur=24;x.shadowOffsetY=10;x.fillStyle='#000';x.fillRect(fx,fy,fw,fh);x.restore();
  G.drawFramedPiece(x,fx,fy,fw,fh,s,img);y+=box.h+36;
  // especificaciones
  const di=G.depthInfo(),fr=st.selectedFrame;
  const spec=[['Medida de la obra (luz)',`${st.artWidthCm} × ${st.artHeightCm} cm`],['Tipo de obra',st.artType==='paper'?'Papel / cartulina':'Óleo / acrílico con bastidor'],
    ['Moldura',`${fr.name}${fr.sku?' · '+fr.sku:''} · ${st.frameWidthCm} cm`],['Medida exterior',`${W.toFixed(1)} × ${H.toFixed(1)} × ${di.total.toFixed(1)} cm`],
    ['Paspartú',st.glass==='double'?'Sin paspartú (margen de vidrio)':st.passWidthCm>0?`${st.passWidthCm} cm por lado · ${st.passColor}`:'Sin paspartú'],['Filete',st.hasFilete?`${st.fileteWidthCm} cm`:'Sin filete'],
    ['Vidrio',st.glass==='none'?'Sin vidrio':`${st.glass==='double'?'Doble vidrio flotante':'Vidrio'} ${st.glassFinish==='mate'?'mate':'brillante'}`],['Bastidor / galce',`${di.stretcher} cm / ${di.rebate} cm`]];
  if(st.plaque&&st.plaque.on)spec.push(['Epígrafe',`${FINISH[st.plaque.finish]} · ${st.plaque.w}×${st.plaque.h} cm · “${st.plaque.title||''}”`]);
  x.fillStyle=ink;x.font='700 30px Inter,Arial,sans-serif';x.fillText('Especificaciones',M,y);y+=18;
  const colW=(Wp-2*M)/2;spec.forEach((r,i)=>{const cx=M+(i%2)*colW,cy=y+Math.floor(i/2)*66+30;x.fillStyle=mute;x.font='20px Inter,Arial,sans-serif';x.fillText(r[0].toUpperCase(),cx,cy);
    x.fillStyle=ink;x.font='600 25px Inter,Arial,sans-serif';let t=r[1];while(x.measureText(t).width>colW-20&&t.length>4)t=t.slice(0,-2);if(t!==r[1])t=t.slice(0,-1)+'…';x.fillText(t,cx,cy+30);});
  y+=Math.ceil(spec.length/2)*66+40;
  // presupuesto
  const pr=compute();
  if(P.fichaItems){x.fillStyle=ink;x.font='700 30px Inter,Arial,sans-serif';x.fillText('Presupuesto',M,y);y+=16;
    pr.items.forEach((it,i)=>{const ry=y+i*44;if(i%2===0){x.fillStyle='#f6f4ef';x.fillRect(M,ry,Wp-2*M,44);}
      x.fillStyle=ink;x.font='600 22px Inter,Arial,sans-serif';x.fillText(it.label,M+14,ry+29);x.fillStyle=mute;x.font='19px Inter,Arial,sans-serif';x.fillText(it.qty,M+560,ry+29);
      x.fillStyle=ink;x.font='600 22px Inter,Arial,sans-serif';x.textAlign='right';x.fillText(gs(it.amount),Wp-M-14,ry+29);x.textAlign='left';});
    y+=pr.items.length*44+40;x.font='22px Inter,Arial,sans-serif';x.fillStyle=mute;x.fillText(`Subtotal ${gs(pr.subtotal)}   ·   IVA ${pr.ivaPct}% ${gs(pr.iva)}`,M+14,y);y+=20;}
  // precio final (con IVA) destacado
  y=Math.max(y+10,Hp-M-230);x.fillStyle='#faf6ec';x.fillRect(M,y,Wp-2*M,150);x.fillStyle=gold;x.fillRect(M,y,8,150);
  x.fillStyle=ink;x.font='700 34px Inter,Arial,sans-serif';x.fillText('PRECIO FINAL',M+40,y+66);
  x.fillStyle=mute;x.font='22px Inter,Arial,sans-serif';x.fillText(`IVA ${pr.ivaPct}% incluido`,M+40,y+104);
  x.textAlign='right';x.fillStyle='#7a5a14';x.font='800 64px Inter,Arial,sans-serif';x.fillText(gs(pr.total),Wp-M-36,y+96);x.textAlign='left';
  x.fillStyle=mute;x.font='italic 19px Inter,Arial,sans-serif';x.fillText('Medidas con inglete de 45°. Precios en guaraníes; presupuesto válido por 15 días.',M,Hp-M+10);
  return c;
}
/* PDF mínimo (A4) con la ficha como imagen JPEG */
function canvasToPdf(c){
  const jpg=atob(c.toDataURL('image/jpeg',.92).split(',')[1]),pw=595.28,ph=841.89,enc=new TextEncoder();const parts=[],offs=[];let len=0;
  const add=s=>{const b=typeof s==='string'?latin(s):s;parts.push(b);len+=b.length;};
  const latin=s=>{const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i)&255;return u;};
  const obj=(n,body)=>{offs[n]=len;add(`${n} 0 obj\n`);body();add('\nendobj\n');};
  add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  obj(1,()=>add('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2,()=>add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
  obj(3,()=>add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
  obj(4,()=>{add(`<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`);add(jpg);add('\nendstream');});
  const cs=`q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;obj(5,()=>add(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
  const xref=len;add(`xref\n0 6\n0000000000 65535 f \n`+[1,2,3,4,5].map(n=>String(offs[n]).padStart(10,'0')+' 00000 n \n').join(''));
  add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const out=new Uint8Array(len);let o=0;parts.forEach(p=>{out.set(p,o);o+=p.length;});return out;
}
const b64=u=>{let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s);};
async function exportFicha(kind){
  const c=buildFicha();if(!c)return G.showToast('Primero carga una obra','warn');
  const base=`presupuesto-${(G.state.clientName||'enmarcado').replace(/[^\w-]+/g,'_')}-${new Date().toISOString().slice(0,10)}`;
  const C=G.Capacitor,nat=C&&C.isNativePlatform&&C.isNativePlatform(),Pl=C&&C.Plugins;
  let data,mime,name;
  if(kind==='pdf'){data=b64(canvasToPdf(c));mime='application/pdf';name=base+'.pdf';}else{data=c.toDataURL('image/png').split(',')[1];mime='image/png';name=base+'.png';}
  if(nat){
    const AW=(Pl&&Pl.ArWall)||(C.registerPlugin&&C.registerPlugin('ArWall'));
    try{if(kind==='pdf')await AW.saveDownload({data,name,mime});else await AW.saveToGallery({data,name,mime});G.showToast(kind==='pdf'?'PDF guardado en Descargas/EnmarcadoStudio':'Ficha guardada en la galería','download');}catch(e){console.warn(e);}
    try{const r=await Pl.Filesystem.writeFile({path:name,data,directory:'CACHE'});await Pl.Share.share({title:name,files:[r.uri],dialogTitle:'Compartir ficha'});}catch(e){}
    return;
  }
  const blob=kind==='pdf'?new Blob([canvasToPdf(c)],{type:mime}):await new Promise(r=>c.toBlob(r,'image/png'));
  const a=document.createElement('a');a.download=name;a.href=URL.createObjectURL(blob);document.body.appendChild(a);a.click();a.remove();
}
G.Pricing={rodPlan,rodText,fmtCm,fmt,gs,parseMoney,bindMoney,compute,update,openSheet,drawPlaque,plaqueRect,buildFicha,canvasToPdf,exportFicha,FINISH,get prices(){return P;}};
})(window);
