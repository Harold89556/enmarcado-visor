/* Enmarcado Studio Pro v1.7 – Mi catálogo de marcos
   - Marcos propios desde foto: detección de orientación + bordes de la moldura, tira tileable con fundido de juntas
   - Edición / ocultado de marcos de fábrica (overrides), modo "solo mis marcos", copia de seguridad JSON
   - Persistencia en IndexedDB (datos de la app: sobreviven a actualizaciones del APK) */
(function(G){
const $=id=>document.getElementById(id);
const CATS=[['propio','Mis marcos'],['rococo','Rococó y barroco'],['madera','Maderas'],['liso','Lisos'],['metal','Metálicos'],['cajon','Cajón 3D']];
const LS_OV='enm_frame_overrides_v1',LS_MINE='enm_only_mine',LS_ASKED='enm_only_mine_asked';
let DB=null,custom=[];
/* ---------- IndexedDB ---------- */
function db(){return DB||(DB=new Promise((res,rej)=>{const r=indexedDB.open('enmarcado',1);r.onupgradeneeded=()=>r.result.createObjectStore('frames',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}));}
async function idb(mode,fn){const d=await db();return new Promise((res,rej)=>{const t=d.transaction('frames',mode),st=t.objectStore('frames');const q=fn(st);t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error);});}
const dbAll=()=>idb('readonly',s=>s.getAll()),dbPut=o=>idb('readwrite',s=>s.put(o)),dbDel=id=>idb('readwrite',s=>s.delete(id));
const loadImg=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;});
/* ---------- overrides de fábrica ---------- */
const ov=()=>{try{return JSON.parse(localStorage.getItem(LS_OV)||'{}');}catch(e){return{};}};
const saveOv=o=>localStorage.setItem(LS_OV,JSON.stringify(o));
const FACTORY={}; // copia original de los de fábrica
function applyOverrides(){const o=ov();G.FRAMES.forEach(f=>{if(f.custom)return;if(!FACTORY[f.id])FACTORY[f.id]={...f};Object.assign(f,FACTORY[f.id],o[f.id]||{});});}
const onlyMine=()=>localStorage.getItem(LS_MINE)==='1';
async function init(){
  G.FRAMES.forEach(f=>{if(!FACTORY[f.id])FACTORY[f.id]={...f};});applyOverrides();
  try{const rows=await dbAll();rows.sort((a,b)=>(a.created||0)-(b.created||0));for(const r of rows)await addCustomToCatalog(r);}catch(e){console.warn('idb',e);}
}
async function addCustomToCatalog(r){
  const img=await loadImg(r.tex);const f=Object.assign({},r,{custom:true,texImg:img,style:[r.sku,r.price?`${fmtPrice(r.price)}/m`:''].filter(Boolean).join(' · ')||`${r.border} cm`});
  delete f.src;const i=G.FRAMES.findIndex(x=>x.id===r.id);if(i>=0)G.FRAMES[i]=f;else G.FRAMES.unshift(f);custom=G.FRAMES.filter(x=>x.custom);return f;}
const fmtPrice=p=>'₲ '+String(Math.round(p)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
function visible(cat){
  let L=G.FRAMES.filter(f=>!f.hidden);
  if(onlyMine())L=L.filter(f=>f.custom||f.stock);
  if(cat==='mine')return L.filter(f=>f.custom||f.stock);
  return cat==='all'?L:L.filter(f=>f.cat===cat);
}
/* ---------- detección automática de la moldura ---------- */
function toGray(c){const x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height).data,g=new Float32Array(c.width*c.height);for(let i=0;i<g.length;i++)g[i]=d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11;return g;}
function scaled(img,max){const k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c;}
function rotated(src,deg){const a=deg*Math.PI/180,cs=Math.abs(Math.cos(a)),sn=Math.abs(Math.sin(a)),w=Math.round(src.width*cs+src.height*sn),h=Math.round(src.width*sn+src.height*cs);
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.translate(w/2,h/2);x.rotate(a);x.drawImage(src,-src.width/2,-src.height/2);return c;}
function autoDetect(img){
  const c=scaled(img,700),w=c.width,h=c.height,g=toGray(c);
  // 1) orientación dominante de bordes rectos (histograma de gradiente ponderado)
  const bins=new Float32Array(180);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x,gx=g[i+1]-g[i-1],gy=g[i+w]-g[i-w],m=Math.hypot(gx,gy);if(m<20)continue;let a=Math.atan2(gy,gx)*180/Math.PI;a=((a%180)+180)%180;bins[Math.round(a)%180]+=m;}
  const sm=new Float32Array(180);for(let i=0;i<180;i++){for(let k=-3;k<=3;k++)sm[i]+=bins[(i+k+180)%180]*(4-Math.abs(k));}
  let best=0;for(let i=1;i<180;i++)if(sm[i]>sm[best])best=i;
  // Hough simplificado: el ángulo cuyo histograma de proyecciones tiene los picos más agudos (bordes rectos largos)
  {const pts=[];for(let y=2;y<h-2;y+=1)for(let x=2;x<w-2;x+=1){const i=y*w+x,gx=g[i+1]-g[i-1],gy=g[i+w]-g[i-w],m=Math.hypot(gx,gy);if(m>40)pts.push(x,y,Math.atan2(gy,gx));}
   const step=Math.max(1,Math.floor(pts.length/3/25000))*3,D=Math.ceil(Math.hypot(w,h)),hist=new Float32Array(2*D+2);let bs=-1,bt=best;
   for(let t=0;t<180;t+=1){const a=t*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a);hist.fill(0);
     for(let k=0;k<pts.length;k+=step){let da=Math.abs(pts[k+2]-a)%Math.PI;da=Math.min(da,Math.PI-da);if(da>.2)continue;hist[Math.round(pts[k]*ca+pts[k+1]*sa)+D]++;}
     let sc=0;for(let q=0;q<hist.length;q++)sc+=hist[q]*hist[q];if(sc>bs){bs=sc;bt=t;}}
   best=bt;}
  // la normal del borde es 'best' -> el listón corre a best+90; girar para dejarlo horizontal (normal vertical = 90°)
  let rot=90-best;if(rot>90)rot-=180;if(rot<-90)rot+=180;
  // 2) bordes del listón: perfil de |dI/dy| por fila en la imagen girada
  const r=rotated(c,rot),rw=r.width,rh=r.height,rg=toGray(r),x0=Math.round(rw*.2),x1=Math.round(rw*.8);
  const rowE=new Float32Array(rh);
  // máscara de píxeles válidos (los bordes de la rotación son transparentes)
  const rd=r.getContext('2d').getImageData(0,0,rw,rh).data;
  for(let y=2;y<rh-2;y++){let s=0,n=0;for(let x=x0;x<x1;x++){const i=y*rw+x;if(rd[(i-2*rw)*4+3]<250||rd[(i+2*rw)*4+3]<250)continue;s+=Math.abs(rg[i+2*rw]-rg[i-2*rw]);n++;}rowE[y]=n?s/n:0;}
  const se=new Float32Array(rh);for(let y=3;y<rh-3;y++)for(let k=-3;k<=3;k++)se[y]+=rowE[y+k]/7;
  let mx=0;for(let y=0;y<rh;y++)mx=Math.max(mx,se[y]);
  // valor medio de color por fila: el listón difiere del fondo
  let top=-1,bot=-1;const thr=mx*.38;
  for(let y=Math.round(rh*.03);y<rh*.97;y++)if(se[y]>thr){top=y;break;}
  for(let y=Math.round(rh*.97);y>rh*.03;y--)if(se[y]>thr){bot=y;break;}
  let conf=0;
  if(top<0||bot<0||bot-top<rh*.06){top=rh*.3;bot=rh*.7;}else conf=Math.min(1,mx/40);
  // columnas: zona válida (sin bordes transparentes) a la altura del listón
  let cl=0,cr=rw-1;const ym=Math.round((top+bot)/2);
  for(let x=0;x<rw;x++){if(rd[(ym*rw+x)*4+3]>250&&rd[(Math.round(top)*rw+x)*4+3]>250&&rd[(Math.round(bot)*rw+x)*4+3]>250){cl=x;break;}}
  for(let x=rw-1;x>=0;x--){if(rd[(ym*rw+x)*4+3]>250&&rd[(Math.round(top)*rw+x)*4+3]>250&&rd[(Math.round(bot)*rw+x)*4+3]>250){cr=x;break;}}
  // extremos del listón: columnas cuyo color dentro de la franja difiere del fondo (muestras por encima/debajo)
  {const t0=Math.round(top),b0=Math.round(bot),bh=b0-t0,bgS=[],col=[];
   const px=(x,y)=>{const i=(y*rw+x)*4;return rd[i+3]>250?[rd[i],rd[i+1],rd[i+2]]:null;};
   for(let x=cl;x<=cr;x++){let s=[0,0,0],n=0;for(let y=t0+Math.round(bh*.2);y<b0-bh*.2;y+=2){const p=px(x,y);if(p){s[0]+=p[0];s[1]+=p[1];s[2]+=p[2];n++;}}col[x]=n?s.map(v=>v/n):null;
     for(const y of [t0-Math.round(bh*.25),b0+Math.round(bh*.25)]){if(y>0&&y<rh){const p=px(x,y);if(p)bgS.push(p);}}}
   if(bgS.length>10){const bg=[0,1,2].map(k=>bgS.reduce((a,p)=>a+p[k],0)/bgS.length);
     const on=[];for(let x=cl;x<=cr;x++){const c=col[x];on[x]=c&&Math.hypot(c[0]-bg[0],c[1]-bg[1],c[2]-bg[2])>28;}
     let bs=0,bl=cl,cur=0,st=cl;for(let x=cl;x<=cr+1;x++){if(x<=cr&&on[x]){if(!cur)st=x;cur++;}else{if(cur>bs){bs=cur;bl=st;}cur=0;}}
     if(bs>(cr-cl)*.2){cl=bl;cr=bl+bs-1;}}}
  const pad=(cr-cl)*.04;
  return{rot,top:top/rh,bot:bot/rh,left:(cl+pad)/rw,right:(cr-pad)/rw,conf};
}
/* ---------- textura tileable ---------- */
function buildTexture(src,p){
  const r=rotated(src,p.rot+(p.turn||0));const sx=p.left*r.width,sy=p.top*r.height,sw=(p.right-p.left)*r.width,sh=(p.bot-p.top)*r.height;
  if(sw<8||sh<4)return null;
  const H=160,W=Math.max(40,Math.min(1400,Math.round(sw*H/sh)));
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.save();if(p.flipV){x.translate(0,H);x.scale(1,-1);}if(p.flipH){x.translate(W,0);x.scale(-1,1);}x.drawImage(r,sx,sy,sw,sh,0,0,W,H);x.restore();
  // fundido de junta: el final se mezcla sobre el comienzo, la tira resultante es periódica
  const b=Math.round(W*.14),T=W-b;if(T<20)return c;
  const d=x.getImageData(0,0,W,H),o=x.createImageData(T,H),s=d.data,od=o.data;
  for(let y=0;y<H;y++)for(let xx=0;xx<T;xx++){const i=(y*T+xx)*4,a=(y*W+xx)*4;if(xx<b){const t=xx/b,e=(y*W+T+xx)*4;for(let k=0;k<3;k++)od[i+k]=s[a+k]*t+s[e+k]*(1-t);}else for(let k=0;k<3;k++)od[i+k]=s[a+k];od[i+3]=255;}
  const t=document.createElement('canvas');t.width=T;t.height=H;t.getContext('2d').putImageData(o,0,0);return t;
}
function avgColor(c){const x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height).data;let r=0,g=0,b=0,n=0;for(let i=0;i<d.length;i+=16){r+=d[i];g+=d[i+1];b+=d[i+2];n++;}return'#'+[r,g,b].map(v=>Math.round(v/n).toString(16).padStart(2,'0')).join('');}

/* ---------- UI ---------- */
let ED=null; // estado del editor
function el(html){const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstChild;}
function ensureDom(){
  if($('catalogSheet'))return;
  document.body.appendChild(el(`<div id="catalogSheet" class="fixed inset-0 z-50 hidden flex flex-col" style="background:rgba(8,7,5,.86);backdrop-filter:blur(6px)">
   <div class="modal-scroll m-3 mt-[calc(env(safe-area-inset-top)+12px)] p-4 rounded-2xl flex flex-col gap-3 flex-1 min-h-0" style="background:#17150f;border:1px solid rgba(201,164,92,.4)">
    <div class="flex items-center justify-between"><h2 class="serif text-[24px] font-semibold">Mi catálogo de marcos</h2><button id="catClose" class="btn btn-ghost px-3 py-1.5">Cerrar</button></div>
    <div class="grid grid-cols-2 gap-2">
      <button id="catFromGallery" class="btn btn-gold justify-center py-2.5">🖼️ Cargar marco desde foto</button>
      <button id="catFromCamera" class="btn btn-ghost justify-center py-2.5">📷 Fotografiar moldura</button>
    </div>
    <input type="file" id="catFile" accept="image/*" class="hidden"><input type="file" id="catCam" accept="image/*" capture="environment" class="hidden">
    <button id="catOnlyMine" class="card p-2.5 flex items-center gap-2 text-[12px] text-left"><span id="catOnlyTgl" class="toggle"></span><span><b>Mostrar solo mis marcos</b><br><span style="color:var(--muted)">Solo los marcos cargados por ti y los de fábrica marcados “en stock”.</span></span></button>
    <div id="catList" class="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0"></div>
    <div class="grid grid-cols-3 gap-2 text-[11px]">
      <button id="catExport" class="btn btn-ghost justify-center py-2">Exportar copia</button>
      <button id="catImport" class="btn btn-ghost justify-center py-2">Importar</button>
      <button id="catRestore" class="btn btn-ghost justify-center py-2">Restaurar fábrica</button>
    </div><input type="file" id="catImportFile" accept="application/json,.json" class="hidden">
   </div></div>`));
  document.body.appendChild(el(`<div id="frameEditor" class="fixed inset-0 z-50 hidden flex flex-col" style="background:rgba(8,7,5,.92)">
   <div class="modal-scroll m-3 mt-[calc(env(safe-area-inset-top)+12px)] p-4 rounded-2xl flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto" style="background:#17150f;border:1px solid rgba(201,164,92,.4)">
    <div class="flex items-center justify-between"><h2 id="feTitle" class="serif text-[22px] font-semibold">Nuevo marco</h2><span id="feConf" class="text-[10.5px]" style="color:var(--muted)"></span></div>
    <div id="feTexBlock" class="flex flex-col gap-2">
      <p class="text-[11px]" style="color:var(--muted)">Ajusta la franja: la línea <b style="color:#e8c66a">dorada</b> es el <b>canto exterior</b> y la <b style="color:#78c8ff">azul</b> el borde interior (luz). Arrastra las 4 líneas para recortar un tramo recto del listón.</p>
      <div class="relative w-full rounded-xl overflow-hidden" style="background:#0b0a08;height:42vh"><canvas id="feCanvas" class="w-full h-full touch-none"></canvas></div>
      <div class="flex gap-1.5 items-center text-[11px] flex-wrap">
        <button id="feRotL" class="chip py-1.5">⟲ 90°</button><button id="feRotR" class="chip py-1.5">⟳ 90°</button>
        <input id="feAngle" type="range" min="-20" max="20" step="0.5" value="0" class="flex-1 min-w-[80px]"><span id="feAngleLbl" class="tabular-nums w-10">0°</span>
        <button id="feFlipV" class="chip py-1.5">Invertir ext./int.</button><button id="feFlipH" class="chip py-1.5">Espejo</button><button id="feAuto" class="chip py-1.5">Auto</button>
      </div>
      <div class="flex gap-2 items-center"><span class="lbl">Vista previa</span><canvas id="fePreview" width="360" height="150" class="rounded-lg flex-1" style="max-width:240px"></canvas></div>
    </div>
    <div class="grid grid-cols-2 gap-2 text-[11px]">
      <label class="col-span-2">Nombre<input id="feName" class="fe-in" placeholder="Ej.: Moldura oro 5 cm"></label>
      <label>Código / SKU<input id="feSku" class="fe-in" placeholder="M-1234"></label>
      <label>Precio por metro (₲)<input id="fePrice" class="fe-in money" type="text" inputmode="numeric" placeholder="ej. 35.000"></label>
      <label>Largo de varilla (cm)<input id="feRod" class="fe-in" type="number" inputmode="decimal" step="1" placeholder="300"></label>
      <label>Precio por varilla (₲, opcional)<input id="feRodPrice" class="fe-in money" type="text" inputmode="numeric" placeholder="auto: precio/m × largo"></label>
      <label>Ancho moldura (cm)<input id="feWidth" class="fe-in" type="number" inputmode="decimal" step="0.1" value="5"></label>
      <label>Profundidad (cm)<input id="feDepth" class="fe-in" type="number" inputmode="decimal" step="0.1" value="3"></label>
      <label>Galce (cm)<input id="feRebate" class="fe-in" type="number" inputmode="decimal" step="0.1" value="1.6"></label>
      <label>Color base<input id="feColor" class="fe-in" type="color" value="#8a6a3a" style="height:38px;padding:2px"></label>
      <label>Categoría<select id="feCat" class="fe-in">${CATS.map(c=>`<option value="${c[0]}">${c[1]}</option>`).join('')}</select></label>
      <label>Tipo<select id="feType" class="fe-in"><option value="normal">Normal</option><option value="caja">Caja (cajón 3D)</option></select></label>
      <label id="feStockRow" class="col-span-2 flex items-center gap-2 hidden"><input id="feStock" type="checkbox" class="w-4 h-4" style="accent-color:#c9a45c"> Lo tengo en stock (aparece en “solo mis marcos”)</label>
    </div>
    <div class="flex gap-2 pb-1"><button id="feCancel" class="btn btn-ghost px-4 py-2.5">Cancelar</button><button id="feSave" class="btn btn-gold flex-1 justify-center py-2.5">Guardar en mi catálogo</button></div>
   </div></div>`));
  wire();
}
function wire(){
  $('catClose').onclick=()=>$('catalogSheet').classList.add('hidden');
  $('catFromGallery').onclick=()=>$('catFile').click();$('catFromCamera').onclick=()=>$('catCam').click();
  $('catFile').onchange=$('catCam').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const u=URL.createObjectURL(f);loadImg(u).then(img=>{if(!img)return G.showToast('No se pudo leer la foto','warn');openEditor(null,img);});};
  $('catOnlyMine').onclick=()=>{setOnlyMine(!onlyMine());};
  $('catRestore').onclick=()=>{if(!confirm('¿Restaurar los marcos de fábrica? Se pierden las ediciones y se vuelven a mostrar los eliminados. Tus marcos propios no se borran.'))return;localStorage.removeItem(LS_OV);applyOverrides();refresh();G.showToast('Marcos de fábrica restaurados','check');};
  $('catExport').onclick=exportCatalog;$('catImport').onclick=()=>$('catImportFile').click();$('catImportFile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)importCatalog(f);};
  $('feCancel').onclick=()=>{$('frameEditor').classList.add('hidden');ED=null;};
  $('feSave').onclick=saveEditor;
  $('feRotL').onclick=()=>{ED.p.turn=((ED.p.turn||0)-90)%360;ED.rc=null;drawEd();};$('feRotR').onclick=()=>{ED.p.turn=((ED.p.turn||0)+90)%360;ED.rc=null;drawEd();};
  $('feAngle').oninput=e=>{ED.p.rot=ED.baseRot+parseFloat(e.target.value);$('feAngleLbl').textContent=e.target.value+'°';ED.rc=null;drawEd();};
  $('feFlipV').onclick=()=>{ED.p.flipV=!ED.p.flipV;drawEd();};$('feFlipH').onclick=()=>{ED.p.flipH=!ED.p.flipH;drawEd();};
  $('feAuto').onclick=()=>{const a=autoDetect(ED.src);Object.assign(ED.p,a,{turn:0});ED.baseRot=a.rot;$('feAngle').value=0;$('feAngleLbl').textContent='0°';ED.rc=null;drawEd();};
  const cv=$('feCanvas');let drag=null;
  const pos=e=>{const r=cv.getBoundingClientRect(),t=(e.touches||[e])[0];return{x:t.clientX-r.left,y:t.clientY-r.top};};
  const down=e=>{if(!ED||!ED.L)return;const p=pos(e),L=ED.L,P=ED.p;const cand=[['top',Math.abs(L.oy+P.top*L.h-p.y)],['bot',Math.abs(L.oy+P.bot*L.h-p.y)],['left',Math.abs(L.ox+P.left*L.w-p.x)],['right',Math.abs(L.ox+P.right*L.w-p.x)]].sort((a,b)=>a[1]-b[1]);
    if(cand[0][1]<34){drag=cand[0][0];e.preventDefault();}};
  const move=e=>{if(!drag)return;e.preventDefault();const p=pos(e),L=ED.L,P=ED.p;
    if(drag==='top'||drag==='bot')P[drag]=Math.max(0,Math.min(1,(p.y-L.oy)/L.h));else P[drag]=Math.max(0,Math.min(1,(p.x-L.ox)/L.w));drawEd(true);};
  const up=()=>{if(drag){drag=null;if(ED.p.top>ED.p.bot)[ED.p.top,ED.p.bot]=[ED.p.bot,ED.p.top];if(ED.p.left>ED.p.right)[ED.p.left,ED.p.right]=[ED.p.right,ED.p.left];drawEd();}};
  cv.addEventListener('touchstart',down,{passive:false});cv.addEventListener('touchmove',move,{passive:false});cv.addEventListener('touchend',up);
  cv.addEventListener('mousedown',down);window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);
}
function setOnlyMine(v){localStorage.setItem(LS_MINE,v?'1':'0');$('catOnlyTgl')&&$('catOnlyTgl').classList.toggle('on',v);G.refreshFrames&&G.refreshFrames();updateMineChip();}
function updateMineChip(){const c=$('chipOnlyMine');if(c)c.classList.toggle('hidden',!onlyMine());}
function openSheet(){ensureDom();$('catOnlyTgl').classList.toggle('on',onlyMine());renderList();$('catalogSheet').classList.remove('hidden');}
function renderList(){
  const L=$('catList');L.innerHTML='';
  const all=[...G.FRAMES.filter(f=>f.custom),...G.FRAMES.filter(f=>!f.custom)];
  const head=t=>{const h=document.createElement('p');h.className='lbl mt-1';h.textContent=t;L.appendChild(h);};
  head(`Mis marcos (${custom.length})`);if(!custom.length){const p=document.createElement('p');p.className='text-[11px]';p.style.color='var(--muted)';p.textContent='Todavía no cargaste marcos. Fotografía un tramo recto de la moldura (de frente, con buena luz y fondo liso).';L.appendChild(p);}
  let factoryHead=false;
  all.forEach(f=>{if(!f.custom&&!factoryHead){factoryHead=true;head('Marcos de fábrica');}
    const row=document.createElement('div');row.className='card p-1.5 flex items-center gap-2';if(f.hidden)row.style.opacity=.45;
    const c=document.createElement('canvas');c.width=120;c.height=72;c.className='w-[60px] h-[36px] rounded-md shrink-0';try{G.FrameRenderer.drawThumb(c.getContext('2d'),f,120,72);}catch(e){}
    const t=document.createElement('div');t.className='flex-1 min-w-0';t.innerHTML=`<p class="serif text-[14px] font-semibold truncate"></p><p class="text-[10px] truncate" style="color:var(--muted)"></p>`;
    t.children[0].textContent=f.name+(f.hidden?' (oculto)':'')+(f.stock&&!f.custom?' · en stock':'');t.children[1].textContent=[f.sku,`${f.border} cm`,`prof ${f.depthCm} / galce ${f.rebateCm}`,f.price?fmtPrice(f.price)+'/m':''].filter(Boolean).join(' · ');
    const e=document.createElement('button');e.className='chip py-1.5';e.textContent='Editar';e.onclick=()=>openEditor(f);
    const d=document.createElement('button');d.className='chip py-1.5';d.textContent=f.hidden?'Mostrar':'Eliminar';d.onclick=()=>removeFrame(f);
    row.append(c,t,e,d);L.appendChild(row);});
}
async function removeFrame(f){
  if(!f.custom&&f.hidden){const o=ov();if(o[f.id]){delete o[f.id].hidden;saveOv(o);}applyOverrides();refresh();return;}
  if(!confirm(f.custom?`¿Eliminar “${f.name}” de tu catálogo? No se puede deshacer.`:`¿Eliminar “${f.name}” del catálogo? (Podrás recuperarlo con “Restaurar fábrica”.)`))return;
  if(f.custom){await dbDel(f.id);const i=G.FRAMES.indexOf(f);if(i>=0)G.FRAMES.splice(i,1);custom=G.FRAMES.filter(x=>x.custom);}
  else{const o=ov();o[f.id]=Object.assign(o[f.id]||{},{hidden:true});saveOv(o);applyOverrides();}
  if(G.state.selectedFrame===f){const n=visible('all')[0]||G.FRAMES[0];G.selectFrame&&G.selectFrame(n);}
  refresh();G.showToast('Marco eliminado','check');
}
function refresh(){renderList();G.refreshFrames&&G.refreshFrames();}
/* editor */
async function openEditor(frame,img){
  ensureDom();const isCustom=!frame||frame.custom;
  ED={frame,p:null,src:null};
  if(isCustom){
    if(img){ED.src=scaled(img,1600);const a=autoDetect(ED.src);ED.p=Object.assign({turn:0},a);ED.baseRot=a.rot;}
    else{const rec=(await dbAll()).find(r=>r.id===frame.id);const s=rec&&rec.src?await loadImg(rec.src):null;ED.src=s?scaled(s,1600):null;ED.p=Object.assign({rot:0,turn:0,top:.3,bot:.7,left:.05,right:.95},rec&&rec.crop||{});ED.baseRot=ED.p.rot-(rec&&rec.crop&&rec.crop.fine||0);}
  }
  $('feTexBlock').classList.toggle('hidden',!isCustom||!ED.src);$('feStockRow').classList.toggle('hidden',isCustom);
  $('feTitle').textContent=frame?(isCustom?'Editar marco':'Editar marco de fábrica'):'Nuevo marco desde foto';
  $('feConf').textContent=ED.p&&img?(ED.p.conf>.35?'Moldura detectada ✓':'Detección dudosa: ajusta las líneas'):'';
  const f=frame||{};$('feName').value=f.name||'';$('feSku').value=f.sku||'';$('fePrice').value=f.price?fmtPrice(f.price).replace('₲ ',''):'';G.Pricing&&G.Pricing.bindMoney($('fePrice'));$('feRod').value=f.rodCm||'';$('feRodPrice').value=f.rodPrice?fmtPrice(f.rodPrice).replace('₲ ',''):'';G.Pricing&&G.Pricing.bindMoney($('feRodPrice'));$('feWidth').value=f.border||5;$('feDepth').value=f.depthCm||3;$('feRebate').value=f.rebateCm||1.6;
  $('feCat').value=f.cat||'propio';$('feType').value=f.cat==='cajon'||f.boxType?'caja':'normal';$('feStock').checked=!!f.stock;
  $('feAngle').value=ED.p?(ED.p.rot-ED.baseRot):0;$('feAngleLbl').textContent=$('feAngle').value+'°';
  $('frameEditor').classList.remove('hidden');ED.rc=null;requestAnimationFrame(()=>drawEd());
}
function drawEd(fast){
  if(!ED||!ED.src)return;const cv=$('feCanvas'),r=cv.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);cv.width=r.width*dpr;cv.height=r.height*dpr;const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);
  if(!ED.rc)ED.rc=rotated(ED.src,ED.p.rot+(ED.p.turn||0));const rc=ED.rc,s=Math.min(r.width/rc.width,r.height/rc.height),w=rc.width*s,h=rc.height*s,ox=(r.width-w)/2,oy=(r.height-h)/2;ED.L={ox,oy,w,h};
  x.fillStyle='#0b0a08';x.fillRect(0,0,r.width,r.height);x.drawImage(rc,ox,oy,w,h);const P=ED.p;
  x.fillStyle='rgba(0,0,0,.55)';x.beginPath();x.rect(ox,oy,w,h);x.rect(ox+P.left*w,oy+P.top*h,(P.right-P.left)*w,(P.bot-P.top)*h);x.fill('evenodd');
  const outerIsTop=!P.flipV;const line=(y,col)=>{x.strokeStyle=col;x.lineWidth=3;x.beginPath();x.moveTo(0,y);x.lineTo(r.width,y);x.stroke();};
  line(oy+P.top*h,outerIsTop?'#e8c66a':'#78c8ff');line(oy+P.bot*h,outerIsTop?'#78c8ff':'#e8c66a');
  x.strokeStyle='#fff';x.setLineDash([6,5]);x.lineWidth=2;[P.left,P.right].forEach(v=>{x.beginPath();x.moveTo(ox+v*w,0);x.lineTo(ox+v*w,r.height);x.stroke();});x.setLineDash([]);
  // asas
  [[ox+(P.left+P.right)/2*w,oy+P.top*h],[ox+(P.left+P.right)/2*w,oy+P.bot*h],[ox+P.left*w,oy+(P.top+P.bot)/2*h],[ox+P.right*w,oy+(P.top+P.bot)/2*h]].forEach(([a,b])=>{x.beginPath();x.arc(a,b,13,0,7);x.fillStyle='rgba(20,16,10,.7)';x.fill();x.lineWidth=2.5;x.strokeStyle='#e8c66a';x.stroke();});
  if(!fast)preview();
}
function preview(){
  const tex=buildTexture(ED.src,ED.p);ED.tex=tex;const c=$('fePreview'),x=c.getContext('2d');if(!tex){x.clearRect(0,0,c.width,c.height);return;}
  const fr={id:'_prev',border:parseFloat($('feWidth').value)||5,texImg:tex,cat:'propio'};G.FrameRenderer.drawThumb(x,fr,c.width,c.height);
}
async function saveEditor(){
  const f=ED.frame,isCustom=!f||f.custom;const num=id=>{const v=parseFloat($(id).value);return isFinite(v)?v:null;};
  const name=$('feName').value.trim()||'Mi marco',border=num('feWidth'),depth=num('feDepth'),reb=num('feRebate');
  if(!(border>0.3&&border<40))return G.showToast('Ancho de moldura entre 0,3 y 40 cm','warn');
  if(!(depth>0&&depth<30))return G.showToast('Profundidad inválida','warn');
  let cat=$('feCat').value;if($('feType').value==='caja')cat='cajon';else if(cat==='cajon')cat='propio';
  const data={name,sku:$('feSku').value.trim(),price:(G.Pricing?G.Pricing.parseMoney($('fePrice').value):num('fePrice'))||0,border,depthCm:depth,rebateCm:reb||1.6,cat,boxType:$('feType').value==='caja',base:$('feColor').value,rodCm:num('feRod')||0,rodPrice:(G.Pricing?G.Pricing.parseMoney($('feRodPrice').value):0)||0};
  if(isCustom){
    if(!ED.src)return G.showToast('Falta la foto del marco','warn');
    const tex=buildTexture(ED.src,ED.p);if(!tex)return G.showToast('La franja es demasiado pequeña','warn');
    const id=f?f.id:'my_'+Date.now().toString(36);
    const old=f?(await dbAll()).find(r=>r.id===id):null;
    const src=old&&old.src&&!ED.newSrc?old.src:ED.src.toDataURL('image/jpeg',.85);
    const crop={...ED.p,fine:ED.p.rot-ED.baseRot};
    if($('feColor').value==='#8a6a3a')data.base=avgColor(tex);
    const rec=Object.assign({id,created:old?old.created:Date.now(),tex:tex.toDataURL('image/jpeg',.9),src,crop},data);
    try{await dbPut(rec);}catch(e){console.error(e);return G.showToast('No se pudo guardar: '+e.message,'warn');}
    const fr=await addCustomToCatalog(rec);G.selectFrame&&G.selectFrame(fr);
    if(!f&&!onlyMine()&&localStorage.getItem(LS_ASKED)!=='1'){localStorage.setItem(LS_ASKED,'1');
      setTimeout(()=>{if(confirm('¿Mostrar solo tus marcos en el catálogo? (Modo catálogo propio: podés cambiarlo en “Mis marcos”.)'))setOnlyMine(true);},300);}
  }else{
    const o=ov();o[f.id]=Object.assign(o[f.id]||{},data,{stock:$('feStock').checked});delete o[f.id].boxType;delete o[f.id].base;saveOv(o);applyOverrides();
    if(G.state.selectedFrame===f)G.selectFrame&&G.selectFrame(f);
  }
  $('frameEditor').classList.add('hidden');ED=null;refresh();G.showToast('Marco guardado en tu catálogo','check');
}
/* copia de seguridad */
async function exportCatalog(){
  const rows=await dbAll();const blob={app:'EnmarcadoStudioPro',v:1,date:new Date().toISOString(),custom:rows,overrides:ov(),onlyMine:onlyMine()};
  const txt=JSON.stringify(blob),name=`catalogo-marcos-${new Date().toISOString().slice(0,10)}.json`;
  const C=G.Capacitor,P=C&&C.Plugins;
  if(C&&C.isNativePlatform&&C.isNativePlatform()&&P.Filesystem){try{const r=await P.Filesystem.writeFile({path:name,data:txt,directory:'CACHE',encoding:'utf8'});await P.Share.share({title:name,files:[r.uri],dialogTitle:'Guardar / compartir copia del catálogo'});}catch(e){G.showToast('No se pudo exportar','warn');}return;}
  const a=document.createElement('a');a.download=name;a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.click();
}
async function importCatalog(file){
  try{const j=JSON.parse(await file.text());if(!j||j.app!=='EnmarcadoStudioPro')throw new Error('archivo no válido');
    for(const r of j.custom||[]){await dbPut(r);await addCustomToCatalog(r);}
    if(j.overrides){saveOv(Object.assign(ov(),j.overrides));applyOverrides();}
    refresh();G.showToast(`Importados ${(j.custom||[]).length} marcos`,'check');}catch(e){G.showToast('No se pudo importar: '+e.message,'warn');}
}
G.Catalog={init,visible,openSheet,openEditor,onlyMine,setOnlyMine,autoDetect,buildTexture,_dbAll:dbAll};
})(window);
