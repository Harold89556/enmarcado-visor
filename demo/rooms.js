/* Enmarcado Studio Pro v1.1 – Modo Sala
   - Salas de muestra con calibración (cm por píxel en la pared, referencia usada)
   - Fotos propias: segmentos de línea (LSD simplificado) -> puntos de fuga (RANSAC) -> plano de pared con perspectiva
   - Escala automática: puertas (205 cm), altura de techo (250 cm), objetos detectados con COCO-SSD offline
   - Línea de referencia manual, arrastre, pellizco y bloqueo a escala real */
(function(G){
const ROOMS=[
 {id:'living_modern',name:'Living moderno',img:'assets/rooms/living_modern.jpg',cmPerPx:205/452,ref:'Puerta estándar 205 cm',center:[470,250]},
 {id:'living_classic',name:'Salón clásico',img:'assets/rooms/living_classic.jpg',cmPerPx:90/195,ref:'Zócalo de boiserie 90 cm',center:[512,235]},
 {id:'bedroom',name:'Dormitorio',img:'assets/rooms/bedroom.jpg',cmPerPx:60/139,ref:'Mesa de noche 60 cm',center:[516,175]},
 {id:'office',name:'Oficina ejecutiva',img:'assets/rooms/office.jpg',cmPerPx:205/420,ref:'Puerta estándar 205 cm',center:[600,250]},
 {id:'gallery',name:'Galería de arte',img:'assets/rooms/gallery.jpg',cmPerPx:320/435,ref:'Altura de muro de galería 320 cm',center:[512,330]},
 {id:'restaurant',name:'Restaurante',img:'assets/rooms/restaurant.jpg',cmPerPx:95/190,ref:'Respaldo de banqueta 95 cm',center:[512,330]},
 {id:'colonial',name:'Hall colonial',img:'assets/rooms/colonial.jpg',cmPerPx:80/212,ref:'Consola 80 cm de alto',center:[520,250]},
 {id:'dining',name:'Comedor nórdico',img:'assets/rooms/dining.jpg',cmPerPx:75/217,ref:'Aparador 75 cm de alto',center:[430,230]},
];
const R={active:false,img:null,H:null,Hi:null,u:0,v:0,userScale:1,lock:true,refs:[],refText:'',showAnalysis:false,segments:[],measure:null,dets:[],K:null};

/* ---------- álgebra 3x3 ---------- */
const mul=(A,B)=>{const C=new Array(9).fill(0);for(let i=0;i<3;i++)for(let j=0;j<3;j++)for(let k=0;k<3;k++)C[i*3+j]+=A[i*3+k]*B[k*3+j];return C;};
function inv(m){const[a,b,c,d,e,f,g,h,i]=m,A=e*i-f*h,B=-(d*i-f*g),C=d*h-e*g,D=-(b*i-c*h),E=a*i-c*g,F=-(a*h-b*g),Gg=b*f-c*e,Hh=-(a*f-c*d),I=a*e-b*d,det=a*A+b*B+c*C;return[A/det,D/det,Gg/det,B/det,E/det,Hh/det,C/det,F/det,I/det];}
const ap=(H,x,y)=>{const w=H[6]*x+H[7]*y+H[8];return{x:(H[0]*x+H[1]*y+H[2])/w,y:(H[3]*x+H[4]*y+H[5])/w};};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>{const n=Math.hypot(...a)||1;return a.map(x=>x/n);};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];

/* ---------- dibujo proyectivo por malla (homografía real) ---------- */
function drawProjective(ctx,src,Hm,n){
  n=n||12;const sw=src.width,sh=src.height;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const x0=i*sw/n,x1=(i+1)*sw/n,y0=j*sh/n,y1=(j+1)*sh/n;
    const p00=ap(Hm,x0,y0),p10=ap(Hm,x1,y0),p01=ap(Hm,x0,y1),p11=ap(Hm,x1,y1);
    tri(ctx,src,[x0,y0,x1,y0,x0,y1],[p00,p10,p01]);tri(ctx,src,[x1,y0,x1,y1,x0,y1],[p10,p11,p01]);
  }
}
function tri(ctx,img,s,d){
  const[sx0,sy0,sx1,sy1,sx2,sy2]=s,[a,b,c]=d;
  const cx=(a.x+b.x+c.x)/3,cy=(a.y+b.y+c.y)/3,ex=p=>({x:p.x+(p.x-cx)*.04+Math.sign(p.x-cx)*.4,y:p.y+(p.y-cy)*.04+Math.sign(p.y-cy)*.4});
  const A=ex(a),B=ex(b),C=ex(c);
  ctx.save();ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.lineTo(C.x,C.y);ctx.closePath();ctx.clip();
  const den=(sx1-sx0)*(sy2-sy0)-(sx2-sx0)*(sy1-sy0);
  const m11=((b.x-a.x)*(sy2-sy0)-(c.x-a.x)*(sy1-sy0))/den,m12=((c.x-a.x)*(sx1-sx0)-(b.x-a.x)*(sx2-sx0))/den;
  const m21=((b.y-a.y)*(sy2-sy0)-(c.y-a.y)*(sy1-sy0))/den,m22=((c.y-a.y)*(sx1-sx0)-(b.y-a.y)*(sx2-sx0))/den;
  ctx.transform(m11,m21,m12,m22,a.x-m11*sx0-m12*sy0,a.y-m21*sx0-m22*sy0);ctx.drawImage(img,0,0);ctx.restore();
}

/* ---------- LSD simplificado: crecimiento de regiones por orientación de gradiente ---------- */
function detectSegments(img){
  const S=Math.min(1,640/Math.max(img.width,img.height)),w=Math.round(img.width*S),h=Math.round(img.height*S);
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(img,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data,g=new Float32Array(w*h);for(let i=0;i<w*h;i++)g[i]=d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11;
  const gb=new Float32Array(w*h);for(let y=1;y<h-1;y++)for(let xx=1;xx<w-1;xx++){const i=y*w+xx;gb[i]=(g[i]*4+g[i-1]+g[i+1]+g[i-w]+g[i+w])/8;}
  const ang=new Float32Array(w*h),mag=new Float32Array(w*h);
  for(let y=1;y<h-1;y++)for(let xx=1;xx<w-1;xx++){const i=y*w+xx;
    const gx=(gb[i+1]-gb[i-1])*2+gb[i-w+1]-gb[i-w-1]+gb[i+w+1]-gb[i+w-1],gy=(gb[i+w]-gb[i-w])*2+gb[i+w-1]-gb[i-w-1]+gb[i+w+1]-gb[i-w+1];
    mag[i]=Math.hypot(gx,gy);ang[i]=Math.atan2(gx,-gy);} // dirección de la línea (perpendicular al gradiente)
  const thr=18,used=new Uint8Array(w*h),segs=[],tol=Math.PI/9;
  const order=[];for(let i=0;i<w*h;i++)if(mag[i]>thr)order.push(i);order.sort((a,b)=>mag[b]-mag[a]);
  const stack=[];
  for(const seed of order){if(used[seed])continue;used[seed]=1;let reg=[seed],sx=Math.cos(2*ang[seed]),sy=Math.sin(2*ang[seed]),ra=ang[seed];stack.length=0;stack.push(seed);
    while(stack.length){const p=stack.pop(),px=p%w,py=(p/w)|0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const q=(py+dy)*w+px+dx;if(q<0||q>=w*h||used[q]||mag[q]<=thr)continue;
        let df=Math.abs(ang[q]-ra)%Math.PI;df=Math.min(df,Math.PI-df);if(df>tol)continue;used[q]=1;reg.push(q);stack.push(q);
        sx+=Math.cos(2*ang[q]);sy+=Math.sin(2*ang[q]);ra=Math.atan2(sy,sx)/2;}}
    if(reg.length<18)continue;
    let mx=0,my=0;reg.forEach(p=>{mx+=p%w;my+=(p/w)|0;});mx/=reg.length;my/=reg.length;
    let a=0,b=0,cc=0;reg.forEach(p=>{const dx=p%w-mx,dy=((p/w)|0)-my;a+=dx*dx;b+=dx*dy;cc+=dy*dy;});
    const th=.5*Math.atan2(2*b,a-cc),ux=Math.cos(th),uy=Math.sin(th);let lo=1e9,hi=-1e9,wd=0;
    reg.forEach(p=>{const dx=p%w-mx,dy=((p/w)|0)-my,t=dx*ux+dy*uy;lo=Math.min(lo,t);hi=Math.max(hi,t);wd+=Math.abs(-dx*uy+dy*ux);});
    const len=hi-lo;wd/=reg.length;if(len<20||wd>2.2||len/(wd+.5)<8)continue;
    segs.push({x1:(mx+ux*lo)/S,y1:(my+uy*lo)/S,x2:(mx+ux*hi)/S,y2:(my+uy*hi)/S,len:len/S});
  }
  return segs;
}
/* ---------- punto de fuga RANSAC (admite punto en el infinito) ---------- */
function vanishingPoint(segs,iters){
  if(segs.length<2)return null;const L=segs.map(s=>({l:cross([s.x1,s.y1,1],[s.x2,s.y2,1]),s,mx:(s.x1+s.x2)/2,my:(s.y1+s.y2)/2,dx:(s.x2-s.x1)/s.len,dy:(s.y2-s.y1)/s.len}));
  const score=v=>{let sc=0;const inl=[];for(const q of L){let ex,ey;if(Math.abs(v[2])<1e-9){ex=v[0];ey=v[1];}else{ex=v[0]/v[2]-q.mx;ey=v[1]/v[2]-q.my;}
      const n=Math.hypot(ex,ey)||1,c=Math.abs((ex*q.dx+ey*q.dy)/n);if(c>Math.cos(1.2*Math.PI/180)){sc+=q.s.len;inl.push(q);}}return{sc,inl};};
  let best=null;const tot=L.reduce((a,q)=>a+q.s.len,0);
  // hipótesis ponderadas por longitud
  const pick=()=>{let r=Math.random()*tot;for(const q of L){r-=q.s.len;if(r<=0)return q;}return L[L.length-1];};
  for(let it=0;it<(iters||400);it++){const a=pick(),b=pick();if(a===b)continue;let v=cross(a.l,b.l);const n=Math.hypot(...v);if(!n)continue;v=v.map(x=>x/n);
    const r=score(v);if(!best||r.sc>best.sc)best={v,...r};}
  if(!best||best.sc<=tot*.15)return null;
  // refinamiento por mínimos cuadrados: autovector menor de sum(w·l·lᵀ) con líneas normalizadas
  const M=[0,0,0,0,0,0,0,0,0];best.inl.forEach(q=>{const n=Math.hypot(q.l[0],q.l[1]);const l=q.l.map(x=>x/n),w=q.s.len;for(let i=0;i<3;i++)for(let j=0;j<3;j++)M[i*3+j]+=w*l[i]*l[j];});
  const v=smallestEig(M);if(v){const r=score(v);if(r.sc>=best.sc*.97)return{v,...r};}
  return best;
}
function smallestEig(A){ // Jacobi 3x3
  const a=A.slice(),V=[1,0,0,0,1,0,0,0,1];
  for(let sweep=0;sweep<30;sweep++){let off=Math.abs(a[1])+Math.abs(a[2])+Math.abs(a[5]);if(off<1e-12)break;
    for(const[p,q]of[[0,1],[0,2],[1,2]]){const apq=a[p*3+q];if(Math.abs(apq)<1e-15)continue;const th=(a[q*3+q]-a[p*3+p])/(2*apq),t=Math.sign(th||1)/(Math.abs(th)+Math.sqrt(th*th+1)),c=1/Math.sqrt(t*t+1),s=t*c;
      for(let k=0;k<3;k++){const akp=a[k*3+p],akq=a[k*3+q];a[k*3+p]=c*akp-s*akq;a[k*3+q]=s*akp+c*akq;}
      for(let k=0;k<3;k++){const apk=a[p*3+k],aqk=a[q*3+k];a[p*3+k]=c*apk-s*aqk;a[q*3+k]=s*apk+c*aqk;}
      for(let k=0;k<3;k++){const vkp=V[k*3+p],vkq=V[k*3+q];V[k*3+p]=c*vkp-s*vkq;V[k*3+q]=s*vkp+c*vkq;}}}
  let m=0;for(let i=1;i<3;i++)if(a[i*4]<a[m*4])m=i;const v=[V[m],V[3+m],V[6+m]];return isFinite(v[0])?v:null;
}
/* ---------- análisis completo de una foto propia ---------- */
async function analyzeRoom(img,onStatus){
  const W=img.width,H=img.height,f=Math.max(W,H)*.82,cx=W/2,cy=H/2;
  onStatus&&onStatus('Buscando líneas de la habitación…');await tick();
  const bd=4,segs=detectSegments(img).filter(s=>s.len>Math.max(W,H)*.03&&Math.min(s.y1,s.y2)>bd&&Math.max(s.y1,s.y2)<H-bd&&Math.min(s.x1,s.x2)>bd&&Math.max(s.x1,s.x2)<W-bd);R.segments=segs;
  const angOf=s=>Math.atan2(s.y2-s.y1,s.x2-s.x1);
  const vert=segs.filter(s=>{const a=Math.abs(angOf(s));return Math.abs(a-Math.PI/2)<Math.PI/9;});
  const horz=segs.filter(s=>{const a=Math.abs(angOf(s));return a<Math.PI/5||a>Math.PI-Math.PI/5;});
  onStatus&&onStatus('Calculando perspectiva (puntos de fuga)…');await tick();
  let vv=vanishingPoint(vert,300),vh=null;
  // la pared principal: el punto de fuga horizontal con más soporte cerca del centro de la imagen
  const central=horz.filter(s=>{const m=(s.x1+s.x2)/2;return m>W*.12&&m<W*.88;});
  vh=vanishingPoint(central,500);
  let Vv=vv?vv.v:[0,1,0],Vh=vh?vh.v:[1,0,0];
  // si los dos puntos de fuga son finitos y casi ortogonales, estimar focal
  const K=[f,0,cx,0,f,cy,0,0,1],Ki=inv(K);
  let r1=norm(matv(Ki,Vh)),r2=norm(matv(Ki,Vv));
  if(r1[0]<0)r1=r1.map(x=>-x);if(r2[1]<0)r2=r2.map(x=>-x);
  r2=norm(r2.map((x,i)=>x-dot(r1,r2)*r1[i]));
  // seguridad: si la perspectiva es extrema (>60° de giro) usar frontal
  if(Math.abs(r1[2])>.87){r1=[1,0,0];}
  const n=cross(r1,r2);
  K._w=W;R.K=K;R.r1=r1;R.r2=r2;R.n=n;R.vInfo={vert:!!vv,horz:!!vh,vertCount:vert.length,horzCount:horz.length};
  // plano provisional a Z=100 cm del punto central-alto
  const p0=[W*.5,H*.38,1];
  R.basis=(Z)=>{const t=matv(Ki,p0).map(x=>x*Z);const M=[r1[0],r2[0],t[0],r1[1],r2[1],t[1],r1[2],r2[2],t[2]];return mul(K,M);};
  // ---- referencias de escala ----
  const refs=[];
  const backDist=(a,b)=>{const Hm=R.basis(1),Hi=inv(Hm),pa=ap(Hi,a.x,a.y),pb=ap(Hi,b.x,b.y);return Math.hypot(pa.x-pb.x,pa.y-pb.y);};
  const addRef=(name,cm,a,b,w,box)=>{const d=backDist(a,b);if(d>1e-6&&isFinite(d))refs.push({name,cm,Z:cm/d,w,a,b,box});};
  // 1) techo + encuentro pared/piso (altura estándar 250 cm)
  const longH=horz.filter(s=>s.len>W*.25);
  const top=longH.filter(s=>(s.y1+s.y2)/2<H*.30&&Math.min(s.y1,s.y2)>H*.03).sort((a,b)=>b.len-a.len)[0];
  const bot=longH.filter(s=>(s.y1+s.y2)/2>H*.55).sort((a,b)=>(b.y1+b.y2)-(a.y1+a.y2))[0];
  if(top&&bot){const xm=W/2,yAt=s=>s.y1+(s.y2-s.y1)*((xm-s.x1)/((s.x2-s.x1)||1));const yt=yAt(top),yb=yAt(bot);if(yb-yt>H*.45)addRef('Altura de techo estándar (250 cm)',250,{x:xm,y:yt},{x:xm,y:yb},.6);}
  // 2) puertas: par de verticales largas + dintel
  const tall=vert.filter(s=>s.len>H*.33).map(s=>{const t=s.y1<s.y2?{x:s.x1,y:s.y1}:{x:s.x2,y:s.y2},b=s.y1<s.y2?{x:s.x2,y:s.y2}:{x:s.x1,y:s.y1};return{t,b,len:s.len};});
  let bestDoor=null;
  for(let i=0;i<tall.length;i++)for(let j=0;j<tall.length;j++){if(i===j)continue;const A=tall[i],B=tall[j];if(B.t.x<=A.t.x)continue;
    const wd=B.t.x-A.t.x,hd=(A.len+B.len)/2;if(wd/hd<.27||wd/hd>.6)continue;if(Math.abs(A.t.y-B.t.y)>hd*.16||Math.abs(A.b.y-B.b.y)>hd*.16)continue;
    if(A.b.y<H*.6)continue;
    const lintel=horz.some(s=>Math.min(s.x1,s.x2)<A.t.x+wd*.3&&Math.max(s.x1,s.x2)>B.t.x-wd*.3&&Math.abs((s.y1+s.y2)/2-(A.t.y+B.t.y)/2)<hd*.06);
    const sc=hd*(lintel?1.5:1);if(!bestDoor||sc>bestDoor.sc)bestDoor={sc,A,B,lintel};}
  if(bestDoor){const {A,B}=bestDoor;addRef(`Puerta estándar (205 cm)${bestDoor.lintel?'':' – probable'}`,205,{x:(A.t.x+B.t.x)/2,y:(A.t.y+B.t.y)/2},{x:(A.b.x+B.b.x)/2,y:(A.b.y+B.b.y)/2},bestDoor.lintel?1.3:.8,{x:A.t.x,y:Math.min(A.t.y,B.t.y),w:B.t.x-A.t.x,h:(A.len+B.len)/2});}
  // 3) objetos con COCO-SSD (offline)
  onStatus&&onStatus('Reconociendo muebles y objetos…');await tick();
  try{const dets=await detectObjects(img);R.dets=dets;
    const SIZE={couch:[82,'Sofá (respaldo ~82 cm)'],chair:[88,'Silla (~88 cm)'],'dining table':[75,'Mesa (75 cm)'],bed:[100,'Cama con respaldo (~100 cm)'],person:[168,'Persona (~168 cm)'],refrigerator:[178,'Heladera (~178 cm)'],tv:[null,''],toilet:[76,'Inodoro (76 cm)'],bench:[45,'Banco (45 cm)'],oven:[88,'Cocina (88 cm)'],'potted plant':[null,''],clock:[null,'']};
    dets.forEach(dd=>{const z=SIZE[dd.class];if(!z||!z[0]||dd.score<.5)return;const[x,y,w,h]=dd.bbox;
      // los muebles están delante de la pared: corrección ~8%
      addRef(z[1],z[0]*1.08,{x:x+w/2,y},{x:x+w/2,y:y+h},dd.score*.7,{x,y,w,h});});
  }catch(e){console.warn('coco',e);}
  R.refs=refs;
  let Z;
  if(refs.length){const s=refs.slice().sort((a,b)=>a.Z-b.Z);const tw=s.reduce((a,r)=>a+r.w,0);let acc=0;Z=s[0].Z;for(const r of s){acc+=r.w;if(acc>=tw/2){Z=r.Z;break;}}
    R.refText=refs.sort((a,b)=>b.w-a.w).map(r=>r.name).slice(0,3).join(' · ');R.refAuto=true;}
  else{Z=270;R.refText='Sin referencias claras: escala estimada (≈ pared a 2,7 m). Usa “Medir referencia”.';R.refAuto=false;}
  setWallFromZ(Z);
  return R;
}
function matv(M,v){return[M[0]*v[0]+M[1]*v[1]+M[2]*v[2],M[3]*v[0]+M[4]*v[1]+M[5]*v[2],M[6]*v[0]+M[7]*v[1]+M[8]*v[2]];}
function setWallFromZ(Z){R.Z=Z;R.H=R.basis(Z);R.Hi=inv(R.H);}
const tick=()=>new Promise(r=>setTimeout(r,20));
let cocoModel=null;
async function detectObjects(img){
  if(!G.cocoSsd||!G.tf)return[];
  if(!cocoModel)cocoModel=await G.cocoSsd.load({base:'lite_mobilenet_v2',modelUrl:'lib/coco/model.json'});
  const S=Math.min(1,640/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*S);c.height=Math.round(img.height*S);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  const r=await cocoModel.detect(c,20,.35);return r.map(d=>({...d,bbox:d.bbox.map(v=>v/S)}));
}

/* ---------- carga de salas ---------- */
function loadImg(src){return new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=src;});}
async function openSample(id){
  const m=ROOMS.find(r=>r.id===id);if(!m)return;const img=await loadImg(m.img);
  R.img=img;R.sample=m;R.K=null;R.persp=null;R.refs=[];R.dets=[];R.segments=[];
  const k=img.width/1024,s=m.cmPerPx/k;R.H=[1/s,0,m.center[0]*k,0,1/s,m.center[1]*k,0,0,1];R.Hi=inv(R.H);
  // coordenadas de pared con origen en el centro sugerido
  R.basis=null;R.u=0;R.v=0;R.userScale=1;R.refText=`${m.ref} · ${(s).toFixed(3)} cm/px`;R.refAuto=true;
  activate();
}
async function openPhoto(img){
  R.img=img;R.sample=null;R.userScale=1;R.K=null;R.persp=null;
  G.setBusy&&G.setBusy(true,'Analizando la sala…');
  try{await analyzeRoom(img,m=>G.setBusy&&G.setBusy(true,m));}catch(e){console.error(e);}
  G.setBusy&&G.setBusy(false);
  // posición inicial: centro horizontal, 38% de alto (origen del plano)
  R.u=0;R.v=0;activate();
  G.showToast&&G.showToast(R.refAuto?'Pared y escala detectadas':'Pared detectada – calibra con una referencia',R.refAuto?'check':'ruler');
}
function activate(){R.active=true;G.state.mode='room';G.renderFullView();G.updateRoomPanel&&G.updateRoomPanel();}
function deactivate(){R.active=false;G.state.mode='studio';G.renderFullView();G.updateRoomPanel&&G.updateRoomPanel();}

/* ---------- render ---------- */
let lastLayout=null;
function render(ctx,cw,ch){
  const img=R.img;if(!img)return;
  const s=Math.min(cw/img.width,ch/img.height),dw=img.width*s,dh=img.height*s,ox=(cw-dw)/2,oy=(ch-dh)/2;
  ctx.fillStyle='#0d0c0b';ctx.fillRect(0,0,cw,ch);ctx.drawImage(img,ox,oy,dw,dh);
  const toScr=p=>({x:ox+p.x*s,y:oy+p.y*s});lastLayout={s,ox,oy};
  const {W,H}=G.totals(),k=R.lock?1:R.userScale,fw=W*k,fh=H*k;
  // rectángulo en la pared (cm) -> imagen
  const u0=R.u-fw/2,v0=R.v-fh/2;
  // grilla de perspectiva (análisis)
  if(R.showAnalysis||R.dragging){ctx.save();ctx.strokeStyle='rgba(214,180,106,.35)';ctx.lineWidth=1;
    for(let u=-300;u<=300;u+=50){ctx.beginPath();for(let v=-200;v<=200;v+=20){const p=toScr(ap(R.H,R.u+u,R.v+v));v===-200?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);}ctx.stroke();}
    for(let v=-200;v<=200;v+=50){ctx.beginPath();for(let u=-300;u<=300;u+=20){const p=toScr(ap(R.H,R.u+u,R.v+v));u===-300?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);}ctx.stroke();}ctx.restore();}
  if(R.showAnalysis){ctx.save();ctx.lineWidth=1.5;
    R.segments.forEach(sg=>{const a=toScr({x:sg.x1,y:sg.y1}),b=toScr({x:sg.x2,y:sg.y2});ctx.strokeStyle='rgba(120,200,255,.55)';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();});
    R.refs.forEach(r=>{const a=toScr(r.a),b=toScr(r.b);ctx.strokeStyle='#e8c66a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      if(r.box){const p=toScr(r.box);ctx.lineWidth=1.5;ctx.strokeRect(p.x,p.y,r.box.w*s,r.box.h*s);}
      ctx.font='600 11px Inter,sans-serif';ctx.fillStyle='#fff';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(r.name,a.x+6,a.y+14);ctx.shadowBlur=0;});ctx.restore();}
  // pieza enmarcada (offscreen) con margen para la sombra
  const projW=Math.hypot(...['x','y'].map(c=>ap(R.H,u0+fw,v0)[c]-ap(R.H,u0,v0)[c]))*s;
  const res=Math.min(1600,Math.max(200,projW*Math.min(2,devicePixelRatio||1)*1.15));const ppc=res/fw;
  const mg=0;
  const st=G.state,lum=wallLuma(img,ap(R.H,R.u,R.v)),f=Math.max(.5,Math.min(1.08,.45+lum/255*.75));
  const key=[st.selectedFrame.id,st.frameStyle,st.frameWidthCm,st.passWidthCm,st.passColor,st.hasFilete,st.fileteColor,st.fileteWidthCm,st.brightness,st.contrast,st.shadowBlur,st.artWidthCm,st.artHeightCm,st.stretcherCm,st.glass,st.glassMarginCm,st.glassFinish,JSON.stringify(st.plaque),st.selectedFrame.border,k,Math.round(res/40),f.toFixed(2),st.rectifiedImage?1:0,st._imgVer||0].join('|');
  let lit;
  if(R._cache&&R._cache.key===key){lit=R._cache.c;}else{
  const oc=document.createElement('canvas');oc.width=Math.round(fw*ppc)+2*mg;oc.height=Math.round(fh*ppc)+2*mg;const o=oc.getContext('2d');
  G.drawFramedPiece(o,mg,mg,fw*ppc,fh*ppc,ppc*k,st.rectifiedImage||st.rawImage);
  lit=document.createElement('canvas');lit.width=oc.width;lit.height=oc.height;const lx=lit.getContext('2d');lx.filter=`brightness(${f.toFixed(2)})`;lx.drawImage(oc,0,0);R._cache={key,c:lit};}
  const mgc=(lit.width-Math.round(fw*ppc))/2;
  const Hs2=mul(mul([s,0,ox,0,s,oy,0,0,1],R.H),[1/ppc,0,u0-mgc/ppc,0,1/ppc,v0-mgc/ppc,0,0,1]);
  // sombra proyectada sobre la pared (en pantalla) y luego el cuadro con homografía
  const q=[[u0,v0],[u0+fw,v0],[u0+fw,v0+fh],[u0,v0+fh]].map(([u,v])=>{const p=ap(R.H,u,v);return{x:ox+p.x*s,y:oy+p.y*s};});
  const pxcm=Math.hypot(q[1].x-q[0].x,q[1].y-q[0].y)/fw;
  const Dk=G.depthInfo().total*k;ctx.save();ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=(st.shadowBlur*.25+Dk*1.1)*pxcm;ctx.shadowOffsetX=(.3+Dk*.2)*pxcm;ctx.shadowOffsetY=(.6+Dk*.45)*pxcm;ctx.fillStyle='rgba(0,0,0,.9)';
  ctx.beginPath();q.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
  if(st.glass==='double'){const b=st.frameWidthCm*k;[[u0+b,v0+b],[u0+fw-b,v0+b],[u0+fw-b,v0+fh-b],[u0+b,v0+fh-b]].map(([u,v])=>toScr(ap(R.H,u,v))).reverse().forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill('evenodd');}else ctx.fill();ctx.restore();
  // volumen con perspectiva real: el frente del cuadro está a Dk cm de la pared, proyectado con la cámara estimada
  const Hf=frontH(img,R.H,Dk);
  const qf=[[u0,v0],[u0+fw,v0],[u0+fw,v0+fh],[u0,v0+fh]].map(([u,v])=>toScr(ap(Hf,u,v)));
  drawBoxSides(ctx,img,R.H,Dk,[u0,v0,fw,fh],q,qf);
  const Hs3=mul(mul([s,0,ox,0,s,oy,0,0,1],Hf),[1/ppc,0,u0-mgc/ppc,0,1/ppc,v0-mgc/ppc,0,0,1]);
  drawProjective(ctx,lit,Hs3,Math.abs(Hf[6])+Math.abs(Hf[7])<1e-9?1:14);
  R.frameQuad=qf;
  if(R.persp&&R.persp.on&&!R.exporting)drawPerspEditor(ctx,toScr,s);
  if(R.measure){const m=R.measure;ctx.save();ctx.strokeStyle='#ffd76a';ctx.lineWidth=3;ctx.setLineDash([8,5]);const a=toScr(m.a),b=toScr(m.b);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
    [a,b].forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,7,0,7);ctx.fillStyle='rgba(255,215,106,.8)';ctx.fill();});ctx.restore();}
}
function wallLuma(img,p){if(!R._lc){R._lc=document.createElement('canvas');R._lc.width=R._lc.height=1;}const x=R._lc.getContext('2d');
  try{x.drawImage(img,Math.max(0,p.x-120),Math.max(0,p.y-120),240,240,0,0,1,1);const d=x.getImageData(0,0,1,1).data;return d[0]*.3+d[1]*.59+d[2]*.11;}catch(e){return 200;}}


/* ---------- cámara y volumen ---------- */
function camK(img){if(R.K&&R.K._w===img.width)return R.K;const f=Math.max(img.width,img.height)*.82,K=[f,0,img.width/2,0,f,img.height/2,0,0,1];K._w=img.width;return K;}
// columnas métricas de la pared: M=K⁻¹H -> c1,c2 (por cm), c3 (origen), n (normal por cm, hacia la cámara)
function wallCols(img,H){const K=camK(img),M=mul(inv(K),H);let c1=[M[0],M[3],M[6]],c2=[M[1],M[4],M[7]],c3=[M[2],M[5],M[8]];
  if(c3[2]<0){c1=c1.map(x=>-x);c2=c2.map(x=>-x);c3=c3.map(x=>-x);}
  const l=Math.sqrt(Math.hypot(...c1)*Math.hypot(...c2));let n=norm(cross(c1,c2)).map(x=>x*l);if(dot(n,c3)>0)n=n.map(x=>-x);return{K,c1,c2,c3,n};}
function frontH(img,H,d){if(!(d>0.05))return H;const{K,c1,c2,c3,n}=wallCols(img,H);const t=c3.map((x,i)=>x+d*n[i]);
  const M=[c1[0],c2[0],t[0],c1[1],c2[1],t[1],c1[2],c2[2],t[2]];return mul(K,M);}
function drawBoxSides(ctx,img,H,d,rect,q,qf){
  if(!(d>0.05))return;const{c1,c2,c3}=wallCols(img,H),[u0,v0,fw,fh]=rect,base=(G.state.selectedFrame&&G.state.selectedFrame.base)||'#6b4a2a';
  const P=(u,v)=>c1.map((x,i)=>u*x+v*c2[i]+c3[i]);
  // caras: [índices en q, normal exterior en el plano, punto medio, tono]
  const faces=[[0,1,c2.map(x=>-x),P(u0+fw/2,v0),.78],[1,2,c1,P(u0+fw,v0+fh/2),.6],[2,3,c2,P(u0+fw/2,v0+fh),.42],[3,0,c1.map(x=>-x),P(u0,v0+fh/2),.55]];
  const vis=faces.map(f=>({f,v:dot(f[2],f[3])<0}));
  ctx.save();
  [...vis.filter(x=>!x.v),...vis.filter(x=>x.v)].forEach(({f})=>{const[a,b,,,tone]=f;const A=q[a],B=q[b],Af=qf[a],Bf=qf[b];
    const g=ctx.createLinearGradient((A.x+B.x)/2,(A.y+B.y)/2,(Af.x+Bf.x)/2,(Af.y+Bf.y)/2);g.addColorStop(0,G.shade(base,tone*.7));g.addColorStop(1,G.shade(base,tone));
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.lineTo(Bf.x,Bf.y);ctx.lineTo(Af.x,Af.y);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=.7;ctx.stroke();});
  ctx.restore();
}

/* ---------- ajuste de perspectiva con líneas ---------- */
function persp4(src,dst){ // homografía de 4 puntos (DLT)
  const A=[],b=[];for(let i=0;i<4;i++){const[x,y]=src[i],[X,Y]=dst[i];A.push([x,y,1,0,0,0,-X*x,-X*y]);b.push(X);A.push([0,0,0,x,y,1,-Y*x,-Y*y]);b.push(Y);}
  for(let c=0;c<8;c++){let p=c;for(let r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];[b[c],b[p]]=[b[p],b[c]];
    for(let r=0;r<8;r++)if(r!==c){const f=A[r][c]/A[c][c];for(let k=c;k<8;k++)A[r][k]-=f*A[c][k];b[r]-=f*b[c];}}
  const h=b.map((v,i)=>v/A[i][i]);return[...h,1];}
function perspStart(){
  if(!R.img)return;const {W,H}=G.totals(),k=R.lock?1:R.userScale,hw=Math.max(W*k*.9,60),hh=Math.max(H*k*.8,50);
  R.persp={on:true,H0:R.H.slice(),K0:R.K,u0:R.u,v0:R.v};
  R.persp.quad=[[R.u-hw,R.v-hh],[R.u+hw,R.v-hh],[R.u+hw,R.v+hh],[R.u-hw,R.v+hh]].map(([u,v])=>{const p=ap(R.H,u,v);return{x:p.x,y:p.y};});
  // mantener dentro de la imagen
  const iw=R.img.width,ih=R.img.height;R.persp.quad.forEach(p=>{p.x=Math.max(iw*.03,Math.min(iw*.97,p.x));p.y=Math.max(ih*.03,Math.min(ih*.97,p.y));});
  R.persp.init=R.persp.quad.map(p=>({...p}));G.renderFullView();
}
function perspReset(){if(!R.persp)return;R.persp.quad=R.persp.init.map(p=>({...p}));G.renderFullView();}
function perspCancel(){if(!R.persp)return;R.H=R.persp.H0;R.Hi=inv(R.H);R.K=R.persp.K0;R.u=R.persp.u0;R.v=R.persp.v0;R.persp=null;G.renderFullView();}
function perspApply(){
  const P=R.persp;if(!P)return false;const img=R.img,q=P.quad.map(p=>[p.x,p.y]);
  const Hq=persp4([[0,0],[1,0],[1,1],[0,1]],q);
  // focal desde los dos puntos de fuga del cuadrilátero (si es fiable)
  const L=(a,b)=>cross([a[0],a[1],1],[b[0],b[1],1]),v1=cross(L(q[0],q[1]),L(q[3],q[2])),v2=cross(L(q[0],q[3]),L(q[1],q[2]));
  const cx=img.width/2,cy=img.height/2,M=Math.max(img.width,img.height);let f=M*.82;
  if(Math.abs(v1[2])>1e-9&&Math.abs(v2[2])>1e-9){const a=[v1[0]/v1[2]-cx,v1[1]/v1[2]-cy],b=[v2[0]/v2[2]-cx,v2[1]/v2[2]-cy],f2=-(a[0]*b[0]+a[1]*b[1]);
    if(f2>0){const ff=Math.sqrt(f2);if(ff>M*.45&&ff<M*2.2)f=ff;}}
  const K=[f,0,cx,0,f,cy,0,0,1];K._w=img.width;R.K=K;
  const Mq=mul(inv(K),Hq),n1=Math.hypot(Mq[0],Mq[3],Mq[6]),n2=Math.hypot(Mq[1],Mq[4],Mq[7]),aspect=n1/n2; // ancho/alto real del rectángulo
  // escala: conservar cm/px de la calibración anterior en el centro del cuadrilátero
  const ctr=ap(Hq,.5,.5),w0=ap(inv(P.H0),ctr.x,ctr.y),pa=ap(P.H0,w0.x-5,w0.y),pb=ap(P.H0,w0.x+5,w0.y),pc=ap(P.H0,w0.x,w0.y-5),pd=ap(P.H0,w0.x,w0.y+5);
  const dOld=(Math.hypot(pb.x-pa.x,pb.y-pa.y)+Math.hypot(pd.x-pc.x,pd.y-pc.y))/20;
  const mk=Wr=>mul(Hq,[1/Wr,0,.5,0,aspect/Wr,.5,0,0,1]);
  let Hn=mk(100);const qa=ap(Hn,-5,0),qb=ap(Hn,5,0),qc=ap(Hn,0,-5),qd=ap(Hn,0,5),dNew=(Math.hypot(qb.x-qa.x,qb.y-qa.y)+Math.hypot(qd.x-qc.x,qd.y-qc.y))/20;
  const Wr=100*dNew/dOld;Hn=mk(Wr);
  // conservar la posición del cuadro en la imagen
  const fc=ap(P.H0,P.u0,P.v0);R.H=Hn;R.Hi=inv(Hn);const nw=ap(R.Hi,fc.x,fc.y);R.u=nw.x;R.v=nw.y;
  R.basis=null;R.persp=null;R.userPersp=true;R.refText=(R.refText||'').replace(/ · Perspectiva manual$/,'')+' · Perspectiva manual';return true;
}
function drawPerspEditor(ctx,toScr,s){
  const P=R.persp,q=P.quad.map(toScr),tz=ctx.getTransform().a||1,cw=ctx.canvas.width/tz,ch=ctx.canvas.height/tz;
  const Hq=persp4([[0,0],[1,0],[1,1],[0,1]],q.map(p=>[p.x,p.y]));
  ctx.save();
  // velo fuera del plano
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.rect(0,0,cw,ch);q.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill('evenodd');
  // líneas guía prolongadas (verticales y horizontales de la pared)
  const ext=(a,b,col)=>{const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,k=4000/L;ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.setLineDash([10,7]);ctx.beginPath();ctx.moveTo(a.x-dx*k,a.y-dy*k);ctx.lineTo(b.x+dx*k,b.y+dy*k);ctx.stroke();ctx.setLineDash([]);};
  ext(q[0],q[1],'rgba(120,200,255,.75)');ext(q[3],q[2],'rgba(120,200,255,.75)');ext(q[0],q[3],'rgba(255,170,90,.8)');ext(q[1],q[2],'rgba(255,170,90,.8)');
  // grilla
  ctx.strokeStyle='rgba(232,198,106,.55)';ctx.lineWidth=1;const N=8;
  for(let i=0;i<=N;i++){const t=i/N;let a=ap(Hq,t,0),b=ap(Hq,t,1);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();a=ap(Hq,0,t);b=ap(Hq,1,t);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  ctx.strokeStyle='#e8c66a';ctx.lineWidth=2.5;ctx.beginPath();q.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();
  // asas grandes
  q.forEach((p,i)=>{const act=P.drag===i;ctx.beginPath();ctx.arc(p.x,p.y,act?26:22,0,7);ctx.fillStyle=act?'rgba(232,198,106,.55)':'rgba(20,16,10,.55)';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#e8c66a';ctx.stroke();
    ctx.beginPath();ctx.moveTo(p.x-8,p.y);ctx.lineTo(p.x+8,p.y);ctx.moveTo(p.x,p.y-8);ctx.lineTo(p.x,p.y+8);ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();});
  // lupa al arrastrar
  if(P.drag!=null&&P.drag>=0){const p=q[P.drag],ip=P.quad[P.drag],r=58,z=3,lx=p.x<cw/2?p.x+90:p.x-90,ly=Math.max(r+8,p.y-100);
    ctx.save();ctx.beginPath();ctx.arc(lx,ly,r,0,7);ctx.clip();ctx.fillStyle='#000';ctx.fillRect(lx-r,ly-r,2*r,2*r);
    ctx.drawImage(R.img,ip.x-r/(s*z),ip.y-r/(s*z),2*r/(s*z),2*r/(s*z),lx-r,ly-r,2*r,2*r);ctx.restore();
    ctx.beginPath();ctx.arc(lx,ly,r,0,7);ctx.lineWidth=3;ctx.strokeStyle='#e8c66a';ctx.stroke();
    ctx.beginPath();ctx.moveTo(lx-12,ly);ctx.lineTo(lx+12,ly);ctx.moveTo(lx,ly-12);ctx.lineTo(lx,ly+12);ctx.lineWidth=1.5;ctx.strokeStyle='#ff4d4d';ctx.stroke();}
  ctx.restore();
}
/* ---------- exportación a resolución completa ---------- */
function exportComposite(maxSide){
  const img=R.img;if(!img)return null;const k=Math.min(1,(maxSide||4096)/Math.max(img.width,img.height));
  const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);const x=c.getContext('2d');
  const sv={L:lastLayout,a:R.showAnalysis,d:R.dragging,m:R.measure};R.exporting=true;R.showAnalysis=false;R.dragging=false;R.measure=null;
  try{render(x,c.width,c.height);try{G.Extras&&G.Extras.lightRoom(x,c.width,c.height);}catch(e){}}finally{lastLayout=sv.L;R.showAnalysis=sv.a;R.dragging=sv.d;R.measure=sv.m;R.exporting=false;}
  return c;
}

/* ---------- interacción ---------- */
function screenToImg(px,py){const L=lastLayout;return{x:(px-L.ox)/L.s,y:(py-L.oy)/L.s};}
function screenToWall(px,py){const p=screenToImg(px,py);return ap(R.Hi,p.x,p.y);}
function attach(canvas){
  let mode=null,grab=null,pinch0=0,scale0=1;
  const pts=e=>{const r=canvas.getBoundingClientRect();return[...(e.touches||[e])].map(t=>({x:t.clientX-r.left,y:t.clientY-r.top}));};
  const down=e=>{if(!R.active)return;const p=pts(e);
    if(R.persp&&R.persp.on){const L=lastLayout;let bi=-1,bd=1e9;R.persp.quad.forEach((c,i)=>{const d=Math.hypot(L.ox+c.x*L.s-p[0].x,L.oy+c.y*L.s-p[0].y);if(d<bd){bd=d;bi=i;}});
      const ip=screenToImg(p[0].x,p[0].y);
      if(bd<48){mode='persp';R.persp.drag=bi;R.persp.off={x:R.persp.quad[bi].x-ip.x,y:R.persp.quad[bi].y-ip.y};}
      else{mode='perspMove';R.persp.drag=-1;R.persp.last=ip;}
      e.preventDefault();G.renderFullView();return;}
    if(R.measuring){mode='measure';const a=screenToImg(p[0].x,p[0].y);R.measure={a,b:{...a}};e.preventDefault();return;}
    if(p.length===2){mode='pinch';pinch0=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);scale0=R.userScale;e.preventDefault();return;}
    const w=screenToWall(p[0].x,p[0].y);mode='drag';R.dragging=true;grab={du:R.u-w.x,dv:R.v-w.y};e.preventDefault();};
  const move=e=>{if(!mode)return;const p=pts(e);e.preventDefault();
    if(mode==='persp'){const ip=screenToImg(p[0].x,p[0].y),c=R.persp.quad[R.persp.drag];c.x=ip.x+R.persp.off.x;c.y=ip.y+R.persp.off.y;G.renderFullView();return;}
    if(mode==='perspMove'){const ip=screenToImg(p[0].x,p[0].y),l=R.persp.last;R.persp.quad.forEach(c=>{c.x+=ip.x-l.x;c.y+=ip.y-l.y;});R.persp.last=ip;G.renderFullView();return;}
    if(mode==='measure'){R.measure.b=screenToImg(p[0].x,p[0].y);G.renderFullView();return;}
    if(mode==='pinch'&&p.length===2){const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(R.lock){G.showToast('Escala real bloqueada: desbloquéala para agrandar','lock');mode=null;return;}
      R.userScale=Math.max(.3,Math.min(4,scale0*d/pinch0));G.updateRoomPanel();G.renderFullView();return;}
    if(mode==='drag'){const w=screenToWall(p[0].x,p[0].y);R.u=w.x+grab.du;R.v=w.y+grab.dv;G.renderFullView();}};
  const up=()=>{if(mode==='persp'||mode==='perspMove'){R.persp.drag=null;mode=null;G.renderFullView();return;}if(mode==='measure'){R.measuring=false;G.onMeasureDone&&G.onMeasureDone();}mode=null;if(R.dragging){R.dragging=false;G.renderFullView();}};
  canvas.addEventListener('touchstart',down,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',up);
  canvas.addEventListener('mousedown',down);window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);
}
/* calibración manual: la línea medida está en la pared y mide cm reales */
function applyMeasure(cm){
  const m=R.measure;if(!m||!(cm>0))return false;
  if(R.basis){const Hm=R.basis(1),Hi=inv(Hm),a=ap(Hi,m.a.x,m.a.y),b=ap(Hi,m.b.x,m.b.y),d=Math.hypot(a.x-b.x,a.y-b.y);
    const c0=ap(R.Hi,ap(R.H,R.u,R.v).x,ap(R.H,R.u,R.v).y);const pimg=ap(R.H,R.u,R.v);setWallFromZ(cm/d);const nw=ap(R.Hi,pimg.x,pimg.y);R.u=nw.x;R.v=nw.y;}
  else{const a=ap(R.Hi,m.a.x,m.a.y),b=ap(R.Hi,m.b.x,m.b.y),d=Math.hypot(a.x-b.x,a.y-b.y);if(!(d>0))return false;const f=cm/d;
    R.H=mul(R.H,[1/f,0,0,0,1/f,0,0,0,1]);R.Hi=inv(R.H);R.u*=f;R.v*=f;}
  R.refText=`Referencia medida por ti: ${cm} cm`;R.refAuto=true;R.measure=null;return true;
}
G.RoomMode={R,ROOMS,perspStart,perspReset,perspCancel,perspApply,exportComposite,openSample,openPhoto,render,attach,applyMeasure,deactivate,analyzeRoom,detectSegments};
})(window);
