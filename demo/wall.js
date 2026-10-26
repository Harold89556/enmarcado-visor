/* Enmarcado Studio Pro v1.12 – Pared de galería (nivel experto) */
(function(G){
const $=id=>document.getElementById(id);
const toast=(m,i)=>{try{G.showToast(m,i||'check');}catch(e){}};
function el(h){const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild;}
const gs=n=>G.Pricing.gs(n),f1=v=>(Math.round(v*10)/10).toString().replace('.',',');
const W0={name:'Pared nueva',wallW:400,wallH:270,center:148,gap:6,furn:'none',furnW:220,guides:true,bgSrc:null};
const S=Object.assign({},W0,{items:[],sel:new Set(),multi:false,undo:[],redo:[],id:null,bg:null,calib:null,snapLines:[],view:{z:1,px:0,py:0}});
let uid=1;const nid=()=>'w'+Date.now().toString(36)+(uid++);
/* ---------- render de una obra con su propia configuración ---------- */
const KEYS=['rawImage','rectifiedImage','artWidthCm','artHeightCm','selectedFrame','frameWidthCm','passWidthCm','passColor','hasFilete','glass','glassFinish','frameStyle','plaque','artType','stretcherCm'];
function withState(over,fn){const st=G.state,old={};KEYS.forEach(k=>old[k]=st[k]);Object.assign(st,over);try{return fn();}finally{KEYS.forEach(k=>st[k]=old[k]);}}
function renderPiece(){const{W,H}=G.totals(),s=Math.min(8,700/Math.max(W,H)),c=document.createElement('canvas');c.width=Math.round(W*s);c.height=Math.round(H*s);
  G.drawFramedPiece(c.getContext('2d'),0,0,c.width,c.height,s,G.state.rectifiedImage||G.state.rawImage);return{c,W,H,D:G.depthInfo().total,price:G.Pricing.compute().total,name:G.state.selectedFrame.name};}
function addItem(p,name){snapUndo();const it=Object.assign({id:nid(),locked:false},p,{name:name||p.name});
  const last=S.items[S.items.length-1];it.x=last?Math.min(S.wallW-it.W,last.x+last.W+S.gap):S.wallW/2-it.W/2;it.y=(S.wallH-S.center)-it.H/2;
  S.items.push(it);S.sel=new Set([it.id]);draw();sync();return it;}
function addCurrent(){if(!(G.state.rectifiedImage||G.state.rawImage))return toast('Primero carga la foto de la obra','warn');addItem(renderPiece(),'Obra actual · '+G.state.selectedFrame.name);}
/* agregar obra desde foto con su tamaño y marco */
function addFromPhoto(file){
  const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{
    const ratio=img.height/img.width,frames=G.FRAMES.filter(f=>!f.hidden);
    const m=sheet('wpAdd','Agregar obra',`<canvas id="wpPrev" class="rounded-lg self-center" width="300" height="300" style="max-height:30vh;max-width:100%"></canvas>
      <div class="grid grid-cols-2 gap-2 text-[11px]"><label>Ancho obra (cm)<input id="wpW" class="fe-in" type="number" inputmode="decimal" value="40"></label><label>Alto obra (cm)<input id="wpH" class="fe-in" type="number" inputmode="decimal" value="${Math.round(40*ratio)}"></label>
      <label class="col-span-2">Marco<select id="wpF" class="fe-in">${frames.map(f=>`<option value="${f.id}">${f.name.replace(/</g,'')}</option>`).join('')}</select></label>
      <label>Ancho moldura (cm)<input id="wpFW" class="fe-in" type="number" step="0.5" value="${frames[0].border}"></label><label>Paspartú (cm)<input id="wpP" class="fe-in" type="number" step="0.5" value="5"></label>
      <label>Color paspartú<input id="wpPC" type="color" class="fe-in" value="#f3efe6" style="height:38px"></label><label>Tipo<select id="wpT" class="fe-in"><option value="canvas">Óleo / bastidor</option><option value="paper">Papel (con vidrio)</option></select></label>
      <label class="col-span-2">Nombre<input id="wpN" class="fe-in" placeholder="Ej.: Retrato, acuarela…"></label></div>
      <button id="wpOk" class="btn btn-gold justify-center py-2.5">Agregar a la pared</button>`);
    $('wpH').dataset.auto='1';$('wpW').oninput=()=>{if($('wpH').dataset.auto)$('wpH').value=Math.round(parseFloat($('wpW').value||0)*ratio);prev();};$('wpH').oninput=()=>{delete $('wpH').dataset.auto;prev();};
    $('wpF').onchange=()=>{const f=G.FRAMES.find(x=>x.id===$('wpF').value);$('wpFW').value=f.border;prev();};['wpFW','wpP','wpPC','wpT'].forEach(i=>$(i).oninput=prev);
    const over=()=>{const f=G.FRAMES.find(x=>x.id===$('wpF').value),paper=$('wpT').value==='paper';return{rawImage:img,rectifiedImage:null,artWidthCm:parseFloat($('wpW').value)||40,artHeightCm:parseFloat($('wpH').value)||40,selectedFrame:f,
      frameWidthCm:f.custom?f.border:(parseFloat($('wpFW').value)||f.border),passWidthCm:Math.max(0,parseFloat($('wpP').value)||0),passColor:$('wpPC').value,hasFilete:false,glass:paper?'glass':'none',glassFinish:'brillo',frameStyle:f.cat==='cajon'||f.boxType?'box':'classic',plaque:{on:false},artType:paper?'paper':'canvas'};};
    function prev(){try{const p=withState(over(),renderPiece),c=$('wpPrev'),x=c.getContext('2d'),k=Math.min(300/p.c.width,300/p.c.height);c.width=p.c.width*k;c.height=p.c.height*k;x.drawImage(p.c,0,0,c.width,c.height);}catch(e){console.warn(e);}}
    prev();$('wpOk').onclick=()=>{const o=over(),p=withState(o,renderPiece);addItem(p,($('wpN').value.trim()||'Obra')+' · '+o.selectedFrame.name);m.remove();};
  };img.src=r.result;};r.readAsDataURL(file);
}
/* ---------- deshacer ---------- */
const meta=()=>JSON.stringify({items:S.items.map(i=>({id:i.id,x:i.x,y:i.y,locked:i.locked})),wall:[S.wallW,S.wallH,S.center,S.gap,S.furn,S.furnW]});
const POOL={};
function snapUndo(){S.items.forEach(i=>POOL[i.id]=i);S.undo.push(meta());if(S.undo.length>60)S.undo.shift();S.redo=[];}
function restore(js){const o=JSON.parse(js);S.items=o.items.map(m=>Object.assign(POOL[m.id],m));[S.wallW,S.wallH,S.center,S.gap,S.furn,S.furnW]=o.wall;S.sel=new Set([...S.sel].filter(id=>S.items.some(i=>i.id===id)));draw();sync();syncInputs();}
function undo(){if(!S.undo.length)return toast('Nada para deshacer','info');S.items.forEach(i=>POOL[i.id]=i);S.redo.push(meta());restore(S.undo.pop());}
function redo(){if(!S.redo.length)return toast('Nada para rehacer','info');S.items.forEach(i=>POOL[i.id]=i);S.undo.push(meta());restore(S.redo.pop());}
/* ---------- selección / grupos ---------- */
const selItems=()=>{const L=S.items.filter(i=>S.sel.has(i.id));return L.length?L:[];};
const target=()=>{const L=selItems();return L.length>=2?L:S.items;};
const bbox=L=>{const x0=Math.min(...L.map(i=>i.x)),y0=Math.min(...L.map(i=>i.y)),x1=Math.max(...L.map(i=>i.x+i.W)),y1=Math.max(...L.map(i=>i.y+i.H));return{x0,y0,x1,y1,w:x1-x0,h:y1-y0};};
const cy=()=>S.wallH-S.center;
function centerBlock(L){const b=bbox(L),dx=S.wallW/2-(b.x0+b.w/2),dy=cy()-(b.y0+b.h/2);L.forEach(i=>{i.x+=dx;i.y+=dy;});}
/* ---------- plantillas ---------- */
const TPL={
  linea(L){let x=0;L.forEach(i=>{i.x=x;i.y=-i.H/2;x+=i.W+S.gap;});},
  arriba(L){let x=0;L.forEach(i=>{i.x=x;i.y=0;x+=i.W+S.gap;});},
  abajo(L){let x=0;L.forEach(i=>{i.x=x;i.y=-i.H;x+=i.W+S.gap;});},
  grilla(L){const n=L.length,c=Math.ceil(Math.sqrt(n)),cw=Math.max(...L.map(i=>i.W)),rh=Math.max(...L.map(i=>i.H));L.forEach((i,k)=>{i.x=(k%c)*(cw+S.gap)+(cw-i.W)/2;i.y=Math.floor(k/c)*(rh+S.gap)+(rh-i.H)/2;});},
  salon(L){const A=L.slice().sort((a,b)=>b.W*b.H-a.W*a.H),area=A.reduce((s,i)=>s+(i.W+S.gap)*(i.H+S.gap),0),tw=Math.max(A[0].W,Math.sqrt(area)*1.35);
    const rows=[[]];let rw=0;A.forEach(i=>{if(rw+i.W>tw&&rows[rows.length-1].length){rows.push([]);rw=0;}rows[rows.length-1].push(i);rw+=i.W+S.gap;});
    // fila con la pieza más grande al medio
    rows.sort((a,b)=>b.reduce((s,i)=>s+i.H,0)/b.length-a.reduce((s,i)=>s+i.H,0)/a.length);const ord=[];rows.forEach((r,k)=>k%2?ord.push(r):ord.unshift(r));
    let y=0;ord.forEach(r=>{const h=Math.max(...r.map(i=>i.H)),w=r.reduce((s,i)=>s+i.W,0)+S.gap*(r.length-1);let x=-w/2;
      r.sort((a,b)=>b.H-a.H);const m=[];r.forEach((i,k)=>k%2?m.push(i):m.unshift(i));m.forEach(i=>{i.x=x;i.y=y+(h-i.H)/2;x+=i.W+S.gap;});y+=h+S.gap;});},
  simetrica(L){const A=L.slice().sort((a,b)=>b.W*b.H-a.W*a.H),c=A[0];c.x=-c.W/2;c.y=-c.H/2;let lx=c.x,rx=c.x+c.W;
    for(let k=1;k<A.length;k+=2){const a=A[k],b=A[k+1];if(b&&Math.abs(a.H-b.H)<a.H*.6){const hs=[a,b];hs.forEach((i,j)=>{i.y=-i.H/2;if(j===0){i.x=lx-S.gap-i.W;}else{i.x=rx+S.gap;}});lx=a.x;rx=b.x+b.W;}
      else{[a,b].filter(Boolean).forEach((i,j)=>{i.y=-i.H/2;if(j===0){i.x=lx-S.gap-i.W;lx=i.x;}else{i.x=rx+S.gap;rx=i.x+i.W;}});}}},
  escalera(L){let x=0,y=0;L.forEach(i=>{i.x=x;i.y=y-i.H;x+=i.W+S.gap;y-=Math.min(30,i.H*.45);});}
};
function applyTpl(k){const L=target();if(!L.length)return toast('Agregá obras primero','warn');snapUndo();TPL[k](L);centerBlock(L);draw();toast('Plantilla aplicada','check');}
/* ---------- alinear / distribuir ---------- */
function align(k){const L=selItems().filter(i=>!i.locked);if(L.length<2&&!['ch','cv'].includes(k))return toast('Seleccioná 2 o más obras (Multi)','info');if(!L.length)return toast('Seleccioná una obra','info');snapUndo();const b=bbox(L);
  L.forEach(i=>{if(k==='l')i.x=b.x0;if(k==='r')i.x=b.x1-i.W;if(k==='t')i.y=b.y0;if(k==='b')i.y=b.y1-i.H;if(k==='mh')i.x=b.x0+b.w/2-i.W/2;if(k==='mv')i.y=b.y0+b.h/2-i.H/2;});
  if(k==='ch'){const dx=S.wallW/2-(b.x0+b.w/2);L.forEach(i=>i.x+=dx);}if(k==='cv'){const dy=cy()-(b.y0+b.h/2);L.forEach(i=>i.y+=dy);}
  if(k==='dh'||k==='gh'){const A=L.slice().sort((a,c)=>a.x-c.x),tot=A.reduce((s,i)=>s+i.W,0),g=k==='gh'?S.gap:(b.w-tot)/(A.length-1);let x=A[0].x;A.forEach(i=>{i.x=x;x+=i.W+g;});}
  if(k==='dv'||k==='gv'){const A=L.slice().sort((a,c)=>a.y-c.y),tot=A.reduce((s,i)=>s+i.H,0),g=k==='gv'?S.gap:(b.h-tot)/(A.length-1);let y=A[0].y;A.forEach(i=>{i.y=y;y+=i.H+g;});}
  draw();}
function layer(k){const L=selItems();if(!L.length)return toast('Seleccioná una obra','info');snapUndo();
  if(k==='front'){S.items=S.items.filter(i=>!S.sel.has(i.id)).concat(L);}if(k==='back'){S.items=L.concat(S.items.filter(i=>!S.sel.has(i.id)));}
  if(k==='lock'){const v=!L.every(i=>i.locked);L.forEach(i=>i.locked=v);toast(v?'Bloqueada':'Desbloqueada','check');}
  if(k==='del'){S.items=S.items.filter(i=>!S.sel.has(i.id));S.sel.clear();}
  if(k==='dup'){const n=L.map(i=>Object.assign({},i,{id:nid(),x:i.x+12,y:i.y+12,locked:false}));S.items.push(...n);S.sel=new Set(n.map(i=>i.id));}
  draw();sync();}
/* ---------- dibujo ---------- */
const FURN={none:null,sofa:{n:'Sofá',h:85},aparador:{n:'Aparador',h:80},cama:{n:'Cama',h:110},consola:{n:'Consola',h:80},escritorio:{n:'Escritorio',h:75}};
function drawFurn(x,s,ox,oy){const F=FURN[S.furn];if(!F)return;const w=S.furnW*s,h=F.h*s,X=ox+(S.wallW/2)*s-w/2,Y=oy+S.wallH*s-h;x.save();x.fillStyle='rgba(30,28,26,.55)';x.beginPath();
  if(S.furn==='sofa'){x.roundRect(X,Y+h*.35,w,h*.65,h*.12);x.roundRect(X+w*.04,Y,w*.92,h*.55,h*.15);x.roundRect(X-w*.02,Y+h*.3,w*.1,h*.55,h*.1);x.roundRect(X+w*.92,Y+h*.3,w*.1,h*.55,h*.1);}
  else if(S.furn==='cama'){x.roundRect(X,Y,w,h,h*.08);x.fillRect(X-w*.02,Y+h*.55,w*1.04,h*.45);}
  else{x.rect(X,Y,w,h*.12);x.rect(X+w*.04,Y+h*.12,w*.92,S.furn==='escritorio'?h*.08:h*.7);x.rect(X+w*.05,Y+h*.82,w*.03,h*.18);x.rect(X+w*.92,Y+h*.82,w*.03,h*.18);}
  x.fill();x.fillStyle='rgba(255,255,255,.75)';x.font=`600 ${Math.max(9,11)}px Inter,sans-serif`;x.textAlign='center';x.fillText(`${F.n} ${S.furnW} cm`,X+w/2,Y+h*.75);x.restore();}
function label(x,t,X,Y,col){x.font='600 10.5px Inter,sans-serif';const w=x.measureText(t).width+8;x.fillStyle='rgba(15,13,10,.85)';x.fillRect(X-w/2,Y-8,w,16);x.fillStyle=col||'#ffd76a';x.textAlign='center';x.textBaseline='middle';x.fillText(t,X,Y);x.textBaseline='alphabetic';}
function scene(x,cw,ch,L,exp){const{s,ox,oy}=L,ww=S.wallW*s,wh=S.wallH*s;x.fillStyle='#0b0a08';x.fillRect(0,0,cw,ch);
  if(S.bg)x.drawImage(S.bg,ox,oy,ww,wh);else{x.fillStyle=G.state.wallColor||'#eae8e3';x.fillRect(ox,oy,ww,wh);const g=x.createLinearGradient(0,oy,0,oy+wh);g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(0,0,0,.12)');x.fillStyle=g;x.fillRect(ox,oy,ww,wh);
    x.fillStyle='#8b7355';x.fillRect(ox,oy+wh-6*s,ww,6*s);}
  drawFurn(x,s,ox,oy);
  if(S.guides||!exp){x.save();x.strokeStyle='rgba(180,140,60,.75)';x.setLineDash([7,5]);x.lineWidth=1;x.beginPath();x.moveTo(ox,oy+cy()*s);x.lineTo(ox+ww,oy+cy()*s);x.stroke();
    x.strokeStyle='rgba(180,140,60,.35)';x.beginPath();x.moveTo(ox+ww/2,oy);x.lineTo(ox+ww/2,oy+wh);x.stroke();x.setLineDash([]);x.restore();if(!exp)label(x,`centro ${S.center} cm`,ox+40,oy+cy()*s-11,'#e8c66a');}
  S.items.forEach(i=>{const X=ox+i.x*s,Y=oy+i.y*s,w=i.W*s,h=i.H*s;x.save();x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=(i.D||3)*s*1.4+3;x.shadowOffsetX=(i.D||3)*s*.2;x.shadowOffsetY=(i.D||3)*s*.45+1;x.fillStyle='#000';x.fillRect(X,Y,w,h);x.restore();x.drawImage(i.c,X,Y,w,h);
    if(!exp&&S.sel.has(i.id)){x.strokeStyle='#e8c66a';x.lineWidth=2;x.strokeRect(X-3,Y-3,w+6,h+6);}if(!exp&&i.locked){x.font='13px sans-serif';x.fillText('🔒',X+3,Y+15);}});
  try{G.Extras.applyLight(x,cw,ch,S.items.length?(()=>{const b=bbox(S.items);return{x:ox+b.x0*s,y:oy+b.y0*s,w:b.w*s,h:b.h*s};})():null);}catch(e){}
  if(exp)return;
  // guías de medición de la selección
  const L2=selItems();if(S.guides&&L2.length){const b=bbox(L2),X0=ox+b.x0*s,X1=ox+b.x1*s,Y0=oy+b.y0*s,Y1=oy+b.y1*s,my=(Y0+Y1)/2,mx=(X0+X1)/2;x.save();x.strokeStyle='rgba(255,215,106,.9)';x.lineWidth=1;x.setLineDash([3,3]);
    x.beginPath();x.moveTo(ox,my);x.lineTo(X0,my);x.moveTo(X1,my);x.lineTo(ox+ww,my);x.moveTo(mx,Y1);x.lineTo(mx,oy+wh);x.moveTo(mx,oy);x.lineTo(mx,Y0);x.stroke();x.restore();
    label(x,`${f1(b.x0)} cm`,(ox+X0)/2,my);label(x,`${f1(S.wallW-b.x1)} cm`,(X1+ox+ww)/2,my);label(x,`${f1(S.wallH-b.y1)} cm al piso`,mx,(Y1+oy+wh)/2);label(x,`${f1(b.y0)} cm`,mx,(oy+Y0)/2);
    label(x,`centro a ${f1(S.wallH-(b.y0+b.h/2))} cm del piso`,mx,Y0-12,'#9fe29f');}
  // separaciones
  const A=S.items.slice().sort((a,b)=>a.x-b.x);for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){const a=A[i],b=A[j],g=b.x-(a.x+a.W);const ov=Math.min(a.y+a.H,b.y+b.H)-Math.max(a.y,b.y);if(g>=0&&g<40&&ov>0){const yy=oy+(Math.max(a.y,b.y)+ov/2)*s;label(x,f1(g),ox+(a.x+a.W+g/2)*s,yy,g>=5&&g<=8?'#7be07b':'#ff8a80');break;}}
  S.snapLines.forEach(l=>{x.save();x.strokeStyle='#ff4fd8';x.lineWidth=1;x.beginPath();if(l.v!=null){x.moveTo(ox+l.v*s,oy);x.lineTo(ox+l.v*s,oy+wh);}else{x.moveTo(ox,oy+l.h*s);x.lineTo(ox+ww,oy+l.h*s);}x.stroke();x.restore();});
  if(S.calib){x.save();x.strokeStyle='#4fc3ff';x.lineWidth=3;const P=S.calib.pts.map(p=>({x:ox+p.x*s,y:oy+p.y*s}));P.forEach(p=>{x.beginPath();x.arc(p.x,p.y,7,0,7);x.stroke();});if(P[1]){x.beginPath();x.moveTo(P[0].x,P[0].y);x.lineTo(P[1].x,P[1].y);x.stroke();}x.restore();}
}
function layout(cv){const r=cv.getBoundingClientRect(),V=S.view,s0=Math.min((r.width-16)/S.wallW,(r.height-16)/S.wallH),s=s0*V.z;return{s,ox:(r.width-S.wallW*s)/2+V.px,oy:(r.height-S.wallH*s)/2+V.py,r};}
function draw(){const cv=$('wlC');if(!cv)return;const d=Math.min(2,devicePixelRatio||1),L=layout(cv);cv.width=L.r.width*d;cv.height=L.r.height*d;const x=cv.getContext('2d');x.setTransform(d,0,0,d,0,0);scene(x,L.r.width,L.r.height,L,false);
  const t=$('wlInfo');if(t){const tot=S.items.reduce((a,i)=>a+(i.price||0),0),L2=selItems();t.textContent=`${S.items.length} obra${S.items.length===1?'':'s'} · total ${gs(tot)} (IVA incl.)`+(L2.length?` · sel: ${L2.length===1?L2[0].name:L2.length+' obras'}`:'');}
  const u=$('wlUndo'),re=$('wlRedo');if(u)u.disabled=!S.undo.length;if(re)re.disabled=!S.redo.length;}
/* ---------- interacción ---------- */
function hit(L,px,py){for(let i=S.items.length-1;i>=0;i--){const it=S.items[i],X=L.ox+it.x*L.s,Y=L.oy+it.y*L.s;if(px>=X&&px<=X+it.W*L.s&&py>=Y&&py<=Y+it.H*L.s)return it;}return null;}
function snap(group){S.snapLines=[];const b=bbox(group),others=S.items.filter(i=>!group.includes(i)),th=2.5/S.view.z;let dx=null,dy=null;
  const xs=[[b.x0,'l'],[b.x0+b.w/2,'c'],[b.x1,'r']],ys=[[b.y0,'t'],[b.y0+b.h/2,'c'],[b.y1,'b']];
  const tx=[S.wallW/2];const ty=[cy()];others.forEach(o=>{tx.push(o.x,o.x+o.W/2,o.x+o.W,o.x+o.W+S.gap,o.x-S.gap);ty.push(o.y,o.y+o.H/2,o.y+o.H,o.y+o.H+S.gap,o.y-S.gap);});
  xs.forEach(([v])=>tx.forEach(t=>{const d=t-v;if(Math.abs(d)<th&&(dx==null||Math.abs(d)<Math.abs(dx))){dx=d;}}));ys.forEach(([v])=>ty.forEach(t=>{const d=t-v;if(Math.abs(d)<th&&(dy==null||Math.abs(d)<Math.abs(dy))){dy=d;}}));
  if(dx!=null){group.forEach(i=>i.x+=dx);const nb=bbox(group);[nb.x0,nb.x0+nb.w/2,nb.x1].forEach(v=>{if(tx.some(t=>Math.abs(t-v)<.01))S.snapLines.push({v});});}
  if(dy!=null){group.forEach(i=>i.y+=dy);const nb=bbox(group);[nb.y0,nb.y0+nb.h/2,nb.y1].forEach(v=>{if(ty.some(t=>Math.abs(t-v)<.01))S.snapLines.push({h:v});});}}
function attach(cv){const P={};let mode=null,st=null,lastTap=0;
  cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);const r=cv.getBoundingClientRect();P[e.pointerId]={x:e.clientX-r.left,y:e.clientY-r.top};const ks=Object.keys(P);
    if(ks.length===2){mode='view';const a=P[ks[0]],b=P[ks[1]];st={d:Math.hypot(a.x-b.x,a.y-b.y),z:S.view.z,px:S.view.px,py:S.view.py,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,cx:r.width/2,cy:r.height/2};return;}
    const L=layout(cv),p=P[e.pointerId];
    if(S.calib){const q={x:(p.x-L.ox)/L.s,y:(p.y-L.oy)/L.s};S.calib.pts.push(q);draw();if(S.calib.pts.length===2)finishCalib();return;}
    const it=hit(L,p.x,p.y);
    if(!it){if(!S.multi)S.sel.clear();mode='pan';st={x:p.x,y:p.y,px:S.view.px,py:S.view.py};const now=Date.now();if(now-lastTap<300){S.view={z:1,px:0,py:0};}lastTap=now;draw();return;}
    if(S.multi){S.sel.has(it.id)?S.sel.delete(it.id):S.sel.add(it.id);}else if(!S.sel.has(it.id))S.sel=new Set([it.id]);
    const grp=selItems().filter(i=>!i.locked);if(!grp.length||it.locked){mode=null;draw();return;}
    snapUndo();mode='drag';st={x:p.x,y:p.y,g:grp.map(i=>({i,x:i.x,y:i.y})),moved:false};draw();};
  cv.onpointermove=e=>{const p=P[e.pointerId];if(!p)return;const r=cv.getBoundingClientRect();p.x=e.clientX-r.left;p.y=e.clientY-r.top;const L=layout(cv);
    if(mode==='view'){const ks=Object.keys(P);if(ks.length<2)return;const a=P[ks[0]],b=P[ks[1]],z=Math.max(.5,Math.min(6,st.z*Math.hypot(a.x-b.x,a.y-b.y)/st.d)),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,k=z/st.z;
      S.view.z=z;S.view.px=(st.px-(st.mx-st.cx))*k+(mx-st.cx);S.view.py=(st.py-(st.my-st.cy))*k+(my-st.cy);draw();return;}
    if(mode==='pan'&&S.view.z>1.01){S.view.px=st.px+p.x-st.x;S.view.py=st.py+p.y-st.y;draw();return;}
    if(mode==='drag'){const dx=(p.x-st.x)/L.s,dy=(p.y-st.y)/L.s;if(Math.abs(dx)+Math.abs(dy)>.3)st.moved=true;st.g.forEach(o=>{o.i.x=o.x+dx;o.i.y=o.y+dy;});snap(st.g.map(o=>o.i));draw();}};
  cv.onpointerup=cv.onpointercancel=e=>{delete P[e.pointerId];if(mode==='drag'&&!st.moved)S.undo.pop();if(Object.keys(P).length===0){mode=null;S.snapLines=[];draw();}};
  cv.onwheel=e=>{e.preventDefault();S.view.z=Math.max(.5,Math.min(6,S.view.z*Math.exp(-e.deltaY*.0015)));draw();};
}
/* ---------- calibración con foto de pared ---------- */
function setBg(file){const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas'),k=Math.min(1,1600/Math.max(i.width,i.height));c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);
  S.bgSrc=c.toDataURL('image/jpeg',.82);S.bg=c;snapUndo();S.wallH=Math.round(S.wallW*c.height/c.width);syncInputs();draw();
  toast('Ahora calibrá: tocá 2 puntos de una medida conocida','info');startCalib();};i.src=r.result;};r.readAsDataURL(file);}
function startCalib(){S.calib={pts:[]};$('wlCalibHint').classList.remove('hidden');draw();}
function cancelCalib(){S.calib=null;const h=$('wlCalibHint');if(h)h.classList.add('hidden');draw();}
function finishCalib(){const[a,b]=S.calib.pts,dCm=Math.hypot(a.x-b.x,a.y-b.y);setTimeout(()=>{const v=parseFloat(String(prompt('¿Cuántos cm mide en la realidad la línea marcada? (ej.: ancho de una puerta = 80)','80')||'').replace(',','.'));
  if(v>0&&dCm>0){snapUndo();const k=v/dCm,ow=S.wallW;S.wallW=Math.round(S.wallW*k);S.wallH=Math.round(S.wallH*k);S.items.forEach(i=>{i.x=i.x*k;i.y=i.y*k;});toast(`Escala calibrada: pared de ${S.wallW} × ${S.wallH} cm`,'check');}
  cancelCalib();syncInputs();},50);}
/* ---------- proyectos (IndexedDB) ---------- */
let DBP=null;const db=()=>DBP||(DBP=new Promise((res,rej)=>{const r=indexedDB.open('enm_walls',1);r.onupgradeneeded=()=>r.result.createObjectStore('p',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}));
async function tx(mode,fn){const d=await db();return new Promise((res,rej)=>{const t=d.transaction('p',mode),q=fn(t.objectStore('p'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error);});}
const toURL=c=>c.toDataURL?c.toDataURL('image/jpeg',.85):(()=>{const k=document.createElement('canvas');k.width=c.width;k.height=c.height;k.getContext('2d').drawImage(c,0,0);return k.toDataURL('image/jpeg',.85);})();
async function save(asNew){let name=S.name;if(asNew||!S.id){name=prompt('Nombre del proyecto de pared',S.name==='Pared nueva'?`Pared ${new Date().toLocaleDateString('es-PY')}`:S.name);if(!name)return;S.id=nid();}S.name=name;
  const rec={id:S.id,name,updated:Date.now(),wall:{wallW:S.wallW,wallH:S.wallH,center:S.center,gap:S.gap,furn:S.furn,furnW:S.furnW,guides:S.guides},bg:S.bgSrc,items:S.items.map(i=>({id:i.id,name:i.name,W:i.W,H:i.H,D:i.D,price:i.price,x:i.x,y:i.y,locked:i.locked,img:i.src||(i.src=toURL(i.c))}))};
  try{await tx('readwrite',s=>s.put(rec));toast('Proyecto guardado','check');$('wlName').textContent=name;}catch(e){toast('No se pudo guardar: '+e.message,'warn');}}
const loadImg=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;});
async function load(id){const r=(await tx('readonly',s=>s.get(id)));if(!r)return;Object.assign(S,r.wall,{id:r.id,name:r.name,bgSrc:r.bg||null,bg:r.bg?await loadImg(r.bg):null,undo:[],redo:[],sel:new Set()});
  S.items=[];for(const m of r.items){const c=await loadImg(m.img);if(c)S.items.push(Object.assign({},m,{c,src:m.img}));}$('wlName').textContent=S.name;syncInputs();draw();sync();}
async function projects(){const rows=(await tx('readonly',s=>s.getAll())||[]).sort((a,b)=>b.updated-a.updated);
  const m=sheet('wlProj','Proyectos de pared',`<div class="flex gap-2"><button id="wpNew" class="btn btn-ghost flex-1 justify-center py-2">＋ Pared nueva</button><button id="wpSaveAs" class="btn btn-gold flex-1 justify-center py-2">Guardar como…</button></div><div id="wpList" class="flex flex-col gap-2"></div>`);
  const L=m.querySelector('#wpList');if(!rows.length)L.innerHTML='<p class="text-[12px]" style="color:var(--muted)">Todavía no guardaste proyectos.</p>';
  rows.forEach(r=>{const d=el(`<div class="card p-2 flex items-center gap-2"><div class="flex-1 min-w-0"><p class="text-[13px] font-semibold truncate"></p><p class="text-[10.5px]" style="color:var(--muted)"></p></div><button class="btn btn-gold px-3 py-1.5 op">Abrir</button><button class="chip py-1 rm">Borrar</button></div>`);
    d.querySelector('p').textContent=r.name;d.querySelectorAll('p')[1].textContent=`${r.items.length} obras · ${r.wall.wallW}×${r.wall.wallH} cm · ${new Date(r.updated).toLocaleString('es-PY')}`;
    d.querySelector('.op').onclick=async()=>{m.remove();await load(r.id);toast('Proyecto abierto','check');};d.querySelector('.rm').onclick=async()=>{if(!confirm(`¿Borrar “${r.name}”?`))return;await tx('readwrite',s=>s.delete(r.id));m.remove();projects();};L.appendChild(d);});
  m.querySelector('#wpNew').onclick=()=>{Object.assign(S,W0,{items:[],sel:new Set(),undo:[],redo:[],id:null,bg:null,bgSrc:null,view:{z:1,px:0,py:0}});$('wlName').textContent=S.name;m.remove();syncInputs();draw();sync();};
  m.querySelector('#wpSaveAs').onclick=()=>{m.remove();save(true);};}
/* ---------- exportar ---------- */
function exportCanvas(){const pxcm=Math.min(10,2400/S.wallW),c=document.createElement('canvas'),foot=150;c.width=Math.round(S.wallW*pxcm);c.height=Math.round(S.wallH*pxcm)+foot;const x=c.getContext('2d');
  const g=S.guides;scene(x,c.width,c.height-foot,{s:pxcm,ox:0,oy:0},true);S.guides=g;x.fillStyle='#fff';x.fillRect(0,c.height-foot,c.width,foot);const tot=S.items.reduce((a,i)=>a+(i.price||0),0),P=G.Pricing.prices;
  x.fillStyle='#9a7322';x.font='600 26px Inter,Arial,sans-serif';x.textAlign='left';x.fillText((P.business||'Enmarcado Studio Pro').toUpperCase()+' · '+S.name,30,c.height-foot+45);
  x.fillStyle='#333';x.font='22px Inter,Arial,sans-serif';x.fillText(`${S.items.length} obras · pared ${S.wallW} × ${S.wallH} cm · centro a ${S.center} cm del piso · separación ${f1(S.gap)} cm`,30,c.height-foot+85);
  x.fillStyle='#7a5a14';x.font='800 36px Inter,Arial,sans-serif';x.textAlign='right';x.fillText(`TOTAL ${gs(tot)}`,c.width-30,c.height-foot+60);x.font='20px Inter,Arial,sans-serif';x.fillStyle='#555';x.fillText(`IVA ${P.ivaPct}% incluido`,c.width-30,c.height-foot+95);return c;}
async function exportImg(){const c=exportCanvas(),data=c.toDataURL('image/jpeg',.9).split(',')[1],name=`pared-${S.name.replace(/[^\w-]+/g,'_')}-${Date.now()}.jpg`,C=G.Capacitor;
  if(C&&C.isNativePlatform&&C.isNativePlatform()){const Pl=C.Plugins,AW=Pl.ArWall||C.registerPlugin('ArWall');try{await AW.saveToGallery({data,name,mime:'image/jpeg'});toast('Imagen guardada en la galería','download');}catch(e){}
    try{const r=await Pl.Filesystem.writeFile({path:name,data,directory:'CACHE'});await Pl.Share.share({title:S.name,files:[r.uri],dialogTitle:'Compartir pared'});}catch(e){}return;}
  const a=document.createElement('a');a.download=name;a.href='data:image/jpeg;base64,'+data;a.click();}
async function toAR(){const L=S.items;if(!L.length)return toast('Agregá obras primero','warn');const b=bbox(L),s=Math.min(10,2048/Math.max(b.w,b.h)),c=document.createElement('canvas');c.width=Math.round(b.w*s);c.height=Math.round(b.h*s);const x=c.getContext('2d');
  L.forEach(i=>x.drawImage(i.c,(i.x-b.x0)*s,(i.y-b.y0)*s,i.W*s,i.H*s));const C=G.Capacitor;if(!(C&&C.isNativePlatform&&C.isNativePlatform()))return toast('La RA funciona en la app Android','info');
  const AW=(C.Plugins&&C.Plugins.ArWall)||C.registerPlugin('ArWall');try{const av=await AW.checkAvailability();if(!av.supported)return toast(av.message||'ARCore no disponible','warn');
    await AW.open({png:c.toDataURL('image/png').split(',')[1],widthCm:b.w,heightCm:b.h,depthCm:0.2,edgeColor:'#000000',label:`${S.name} · ${L.length} obras · ${b.w.toFixed(0)} × ${b.h.toFixed(0)} cm`});}catch(e){toast('No se pudo abrir la RA: '+(e&&e.message||e),'warn');}}
/* ---------- UI ---------- */
function sheet(id,title,body){let m=$(id);if(m)m.remove();m=el(`<div id="${id}" class="fixed inset-0 z-[60] flex flex-col" style="background:rgba(8,7,5,.92)"><div class="m-3 mt-[calc(env(safe-area-inset-top)+12px)] mb-[calc(env(safe-area-inset-bottom)+12px)] p-4 rounded-2xl flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto" style="background:#17150f;border:1px solid rgba(201,164,92,.4)"><div class="flex items-center justify-between gap-2"><h2 class="serif text-[22px] font-semibold">${title}</h2><button class="btn btn-gold px-4 py-1.5 xclose">Cerrar</button></div>${body}</div></div>`);document.body.appendChild(m);m.querySelector('.xclose').onclick=()=>m.remove();return m;}
const B=(id,t,extra)=>`<button data-a="${id}" class="chip py-1.5 text-[11.5px]" ${extra||''}>${t}</button>`;
const TABS={
  add:`${B('cur','＋ Obra actual','style="border-color:var(--gold);color:var(--gold2)"')}${B('photo','＋ Otra obra (foto/galería)','style="border-color:var(--gold);color:var(--gold2)"')}${B('dup','Duplicar')}${B('del','Eliminar')}${B('all','Seleccionar todo')}`,
  tpl:`${B('t:linea','Línea centrada')}${B('t:grilla','Grilla')}${B('t:salon','Salón / Petersburgo')}${B('t:simetrica','Simétrica')}${B('t:escalera','Escalera')}${B('t:arriba','Alineado arriba')}${B('t:abajo','Alineado abajo')}<p class="w-full text-[10px]" style="color:var(--muted)">Se aplica a las obras seleccionadas (2+) o a todas.</p>`,
  ali:`${B('a:l','⇤ Izq.')}${B('a:mh','↔ Centro')}${B('a:r','⇥ Der.')}${B('a:t','⤒ Arriba')}${B('a:mv','↕ Medio')}${B('a:b','⤓ Abajo')}${B('a:dh','Distribuir horiz.')}${B('a:dv','Distribuir vert.')}${B('a:gh','Igualar separación ↔')}${B('a:gv','Igualar separación ↕')}${B('a:ch','Centrar en la pared')}${B('a:cv','A la línea de centro')}`,
  cap:`${B('multi','☐ Selección múltiple')}${B('l:front','Traer al frente')}${B('l:back','Enviar atrás')}${B('l:lock','🔒 Bloquear / desbloquear')}${B('l:dup','Duplicar')}${B('l:del','Eliminar')}`,
  wall:`<div class="grid grid-cols-4 gap-1.5 w-full text-[10.5px]"><label>Ancho (cm)<input id="wlW" class="fe-in" type="number"></label><label>Alto (cm)<input id="wlH" class="fe-in" type="number"></label><label>Centro (cm)<input id="wlCe" class="fe-in" type="number" min="100" max="200"></label><label>Separación<input id="wlG" class="fe-in" type="number" step="0.5"></label></div>
    ${B('bg','Foto de la pared…')}${B('calib','📏 Calibrar escala')}${B('nobg','Quitar foto')}${B('guides','Guías on/off')}<label class="text-[10.5px] flex items-center gap-1">Mueble<select id="wlFurn" class="fe-in py-1">${Object.keys(FURN).map(k=>`<option value="${k}">${FURN[k]?FURN[k].n:'Ninguno'}</option>`).join('')}</select></label><label class="text-[10.5px] flex items-center gap-1">ancho<input id="wlFW" class="fe-in py-1 w-16" type="number"></label>`
};
function syncInputs(){const v=(id,x)=>{const e=$(id);if(e&&document.activeElement!==e)e.value=x;};v('wlW',S.wallW);v('wlH',S.wallH);v('wlCe',S.center);v('wlG',S.gap);v('wlFurn',S.furn);v('wlFW',S.furnW);}
function sync(){try{G.Extras&&G.Extras.syncChips&&G.Extras.syncChips();}catch(e){}const m=document.querySelector('[data-a=multi]');if(m){m.textContent=(S.multi?'☑':'☐')+' Selección múltiple';m.classList.toggle('on',S.multi);}}
function showTab(k){document.querySelectorAll('.wl-tab').forEach(t=>t.classList.toggle('on',t.dataset.t===k));const p=$('wlPanel');p.innerHTML=TABS[k];sync();syncInputs();
  const num=(id,key,min)=>{const e=$(id);if(e)e.onchange=()=>{const v=parseFloat(e.value);if(v>=min){snapUndo();S[key]=v;draw();}};};num('wlW','wallW',50);num('wlH','wallH',50);num('wlCe','center',60);num('wlG','gap',0);num('wlFW','furnW',30);
  const fu=$('wlFurn');if(fu)fu.onchange=()=>{snapUndo();S.furn=fu.value;draw();};}
function act(a){
  if(a==='cur')return addCurrent();if(a==='photo')return $('wlFile').click();if(a==='all'){S.sel=new Set(S.items.map(i=>i.id));return draw();}
  if(a==='dup')return layer('dup');if(a==='del')return layer('del');if(a==='multi'){S.multi=!S.multi;sync();return;}
  if(a.startsWith('t:'))return applyTpl(a.slice(2));if(a.startsWith('a:'))return align(a.slice(2));if(a.startsWith('l:'))return layer(a.slice(2));
  if(a==='bg')return $('wlBgFile').click();if(a==='calib'){if(!S.bg)toast('Tip: con una foto de pared, marcá una puerta o mueble de medida conocida','info');return startCalib();}
  if(a==='nobg'){S.bg=null;S.bgSrc=null;return draw();}if(a==='guides'){S.guides=!S.guides;return draw();}}
function open(){
  let v=$('wallView');if(v)v.remove();
  if(!S.items.length&&(G.state.rectifiedImage||G.state.rawImage)){addCurrent();S.undo=[];}
  v=el(`<div id="wallView" class="fixed inset-0 z-50 flex flex-col" style="background:#0b0a08">
   <div class="flex items-center gap-1.5 px-2 pt-[calc(env(safe-area-inset-top)+8px)] pb-1.5"><button class="btn btn-ghost px-2.5 py-1.5 xclose" data-back>‹</button>
    <div class="flex-1 min-w-0"><p class="serif text-[18px] font-semibold leading-tight">Pared de galería</p><p id="wlName" class="text-[10.5px] truncate" style="color:var(--muted)">${S.name}</p></div>
    <button id="wlUndo" class="chip py-1.5" title="Deshacer">↶</button><button id="wlRedo" class="chip py-1.5" title="Rehacer">↷</button><button id="wlProjBtn" class="chip py-1.5">Proyectos</button><button id="wlSave" class="btn btn-gold px-3 py-1.5">Guardar</button></div>
   <div class="relative flex-1 min-h-0"><canvas id="wlC" class="w-full h-full touch-none"></canvas>
    <div id="wlCalibHint" class="hidden absolute top-2 left-2 right-2 text-center text-[11.5px] px-3 py-2 rounded-xl" style="background:rgba(10,40,60,.9);color:#cfefff">📏 Tocá los 2 extremos de algo de medida conocida (puerta, zócalo, mueble) <button id="wlCalibX" class="underline ml-2">Cancelar</button></div></div>
   <p id="wlInfo" class="px-3 py-1 text-[11.5px] font-semibold" style="color:var(--gold2)"></p>
   <div class="flex gap-1 px-2">${[['add','Agregar'],['tpl','Plantillas'],['ali','Alinear'],['cap','Capas'],['wall','Pared']].map(([k,n])=>`<button class="wl-tab chip flex-1 justify-center py-1.5 text-[11.5px]" data-t="${k}">${n}</button>`).join('')}</div>
   <div id="wlPanel" class="flex flex-wrap gap-1.5 px-2 pt-2 pb-1 items-center content-start" style="min-height:96px"></div>
   <div class="flex gap-1.5 px-2 pt-1 pb-[calc(env(safe-area-inset-bottom)+10px)]"><button id="wlExport" class="btn btn-ghost flex-1 justify-center py-2">Exportar imagen</button><button id="wlAR" class="btn btn-ghost flex-1 justify-center py-2" style="border-color:var(--gold);color:var(--gold2)">Ver en AR</button></div>
   <input id="wlFile" type="file" accept="image/*" class="hidden"><input id="wlBgFile" type="file" accept="image/*" class="hidden"></div>`);
  document.body.appendChild(v);v.querySelector('.xclose').onclick=()=>{v.remove();sync();};
  v.querySelectorAll('.wl-tab').forEach(t=>t.onclick=()=>showTab(t.dataset.t));showTab('add');
  $('wlPanel').onclick=e=>{const b=e.target.closest('[data-a]');if(b)act(b.dataset.a);};
  $('wlUndo').onclick=undo;$('wlRedo').onclick=redo;$('wlSave').onclick=()=>save(false);$('wlProjBtn').onclick=projects;$('wlExport').onclick=exportImg;$('wlAR').onclick=toAR;$('wlCalibX').onclick=cancelCalib;
  $('wlFile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)addFromPhoto(f);};$('wlBgFile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)setBg(f);};
  attach($('wlC'));requestAnimationFrame(draw);addEventListener('resize',draw);
}
G.Wall={open,S,addCurrent,applyTpl,align,layer,undo,redo,save,load,projects,exportCanvas,draw,cancelCalib,TPL,addItem,withState,renderPiece,get count(){return S.items.length;}};
})(window);
