/* Enmarcado Studio Pro v1.1 – Renderizador fotorrealista de molduras
   - Perfil 1D (sección transversal) => normales => iluminación por píxel (difusa + especular + entorno)
   - Texturas reales de veta de madera, metales cepillados, dorados con reflejo de estudio
   - Ornamentos tallados reales (12 modelos históricos) en tiras continuas, re-iluminados por lado
   - Esquinas a inglete de 45° */
(function(G){
const ORN = {};      // id -> {a:Image (luz desde exterior), b:Image (re-iluminada para lados derecho/inferior)}
const WOOD = {};
const TEX_CACHE = {};
function loadImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;});}
async function preload(){
  const orns=['acanthus','rocaille','beadreel','florentine','eggdart','whitegold','sansovino','ebony','louisxvi','colonial','louisxiv','gadroon'];
  await Promise.all([
    ...orns.map(async k=>{const [a,b]=await Promise.all([loadImg(`assets/orn/${k}.jpg`),loadImg(`assets/orn/${k}_b.jpg`)]);ORN[k]={a,b};}),
    ...['walnut','oak','maple'].map(async k=>{WOOD[k]=await loadImg(`assets/wood/${k}.jpg`);})
  ]);
}
const hex2rgb=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)/255,((n>>8)&255)/255,(n&255)/255];};

/* ---------- PERFILES (t: 0 = canto exterior, 1 = luz/borde interior) ---------- */
// cada perfil: lista de segmentos {w, s:forma, m:material('main'|'acc'|'dark')}; la altura se arma sumando formas
const PROFILES = {
  cushion:[{w:.08,s:'lip',m:'main'},{w:.80,s:'convex',m:'main'},{w:.12,s:'bead',m:'main'}],
  ogee:   [{w:.10,s:'lip',m:'main'},{w:.35,s:'convex',m:'main'},{w:.35,s:'cove',m:'main'},{w:.20,s:'bevel',m:'main'}],
  flat:   [{w:.10,s:'round',m:'main'},{w:.78,s:'flat',m:'main'},{w:.12,s:'round',m:'main'}],
  slim:   [{w:.20,s:'round',m:'main'},{w:.60,s:'flat',m:'main'},{w:.20,s:'round',m:'main'}],
  scoop:  [{w:.12,s:'lip',m:'main'},{w:.70,s:'cove',m:'main'},{w:.18,s:'bead',m:'main'}],
  step:   [{w:.30,s:'flat',m:'main'},{w:.06,s:'bevel',m:'main'},{w:.50,s:'flat',m:'main'},{w:.14,s:'round',m:'main'}],
  goldlip:[{w:.08,s:'lip',m:'main'},{w:.72,s:'convex',m:'main'},{w:.20,s:'bead',m:'acc'}],
  box:    [{w:.12,s:'round',m:'main'},{w:.76,s:'flat',m:'main'},{w:.12,s:'round',m:'main'}],
  boxlip: [{w:.12,s:'round',m:'main'},{w:.70,s:'flat',m:'main'},{w:.18,s:'bead',m:'acc'}],
};
function buildProfile(name,n){
  const segs=PROFILES[name]||PROFILES.flat,h=new Float32Array(n),mat=new Uint8Array(n);
  let t0=0,base=0;
  segs.forEach(sg=>{const t1=t0+sg.w;const i0=Math.round(t0*n),i1=Math.max(i0+1,Math.round(t1*n));
    for(let i=i0;i<Math.min(n,i1);i++){const u=(i-i0+.5)/(i1-i0);let z;
      switch(sg.s){case'lip':z=Math.sin(u*Math.PI)*.35+u*.25;break;case'convex':z=Math.sin(u*Math.PI)*.9;break;
        case'cove':z=-Math.sin(u*Math.PI)*.45;break;case'bead':z=Math.sqrt(Math.max(0,1-(2*u-1)**2))*.5-u*.35;break;
        case'round':z=Math.sqrt(Math.max(0,1-(2*u-1)**2))*.35;break;case'bevel':z=-u*.4;break;default:z=0;}
      h[i]=base+z;mat[i]=sg.m==='acc'?1:sg.m==='dark'?2:0;}
    const e=sg.s==='lip'?.25:sg.s==='bead'?-.35:sg.s==='bevel'?-.4:0;base+=e;t0=t1;});
  return{h,mat};
}

/* ---------- MATERIALES ---------- */
// tipo: gold | silver | metal (cepillado) | wood | paint | lacquer
const ACC={gold:{type:'gold',color:'#d9b04a'},black:{type:'paint',color:'#151515'}};
const L=(()=>{const v=[-.42,-.62,.66],n=Math.hypot(...v);return v.map(x=>x/n);})();
const Hh=(()=>{const v=[L[0],L[1],L[2]+1],n=Math.hypot(...v);return v.map(x=>x/n);})();
function shadeMat(m,nx,ny,nz,alb,ao,out){
  const nl=Math.max(0,nx*L[0]+ny*L[1]+nz*L[2]),nh=Math.max(0,nx*Hh[0]+ny*Hh[1]+nz*Hh[2]);
  // entorno de estudio: cenital luminoso + rebote cálido
  const env=.30+.55*Math.max(0,-ny*.7+nz*.5)+.35*Math.pow(Math.max(0,nl),3);
  let r,g,b;
  if(m.type==='gold'||m.type==='silver'||m.type==='metal'){
    // reflejo de entorno de estudio: softbox superior-izquierdo nítido + techo + suelo oscuro
    const rz=2*nz*nz-1,rx=2*nz*nx,ry=2*nz*ny; // reflexión de la vista (0,0,1)
    const soft=Math.pow(Math.max(0,(rx*L[0]+ry*L[1]+rz*L[2])),m.type==='metal'?4:8);
    const sky=Math.max(0,-ry)*.55,floor=Math.max(0,ry)*.25;
    const env=.16+soft*1.2+sky*.9+.22*Math.max(0,rz)-floor*.8;
    const sp=Math.pow(nh,(m.rough||.3)<.25?140:50)*(m.type==='metal'?.6:1.1);
    const f=Math.max(.03,env)*(m.type==='metal'?.95:1.05)+nl*.12;
    r=alb[0]*f+sp*(.5+alb[0]*.5);g=alb[1]*f+sp*(.5+alb[1]*.5);b=alb[2]*f+sp*(.45+alb[2]*.5);
  }else{
    const d=.16+.98*nl,sp=Math.pow(nh,m.type==='lacquer'?120:m.type==='wood'?40:20)*(m.type==='lacquer'?.55:m.type==='wood'?.2:.08);
    r=alb[0]*d+sp;g=alb[1]*d+sp;b=alb[2]*d+sp;
  }
  out[0]=r*ao;out[1]=g*ao;out[2]=b*ao;
}
// textura de albedo (Float32 RGB) por material, en cm: texPxPerCm
function materialTexture(fr){
  const key=fr.id;if(TEX_CACHE[key])return TEX_CACHE[key];
  const W=512,H=192,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const base=fr.base;
  if(fr.mat==='wood'&&WOOD[fr.wood||'walnut']){
    x.drawImage(WOOD[fr.wood||'walnut'],0,0,W,H);
    // teñido: multiplicar por color base manteniendo veta
    const id=x.getImageData(0,0,W,H),d=id.data,[br,bg,bb]=hex2rgb(base);let mean=0;for(let i=0;i<d.length;i+=4)mean+=d[i]*.3+d[i+1]*.59+d[i+2]*.11;mean/=d.length/4;
    const k=fr.grain||1;
    for(let i=0;i<d.length;i+=4){const l=(d[i]*.3+d[i+1]*.59+d[i+2]*.11)/mean;const v=1+(l-1)*1.6*k;d[i]=br*255*v;d[i+1]=bg*255*v;d[i+2]=bb*255*v;}
    if(fr.wash){for(let i=0;i<d.length;i+=4){const l=(d[i]+d[i+1]+d[i+2])/765;const w=fr.wash*(1-Math.pow(1-l,2));const [wr,wg,wb]=hex2rgb(fr.washColor||'#f1ede4');d[i]=d[i]*(1-w)+wr*255*w;d[i+1]=d[i+1]*(1-w)+wg*255*w;d[i+2]=d[i+2]*(1-w)+wb*255*w;}}
    x.putImageData(id,0,0);
  }else{
    x.fillStyle=base;x.fillRect(0,0,W,H);
    const id=x.getImageData(0,0,W,H),d=id.data;let seed=fr.id.length*977;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    const brushed=fr.mat==='metal'||fr.mat==='gold'&&fr.brushed;
    const rowN=new Float32Array(H).map(()=>rnd()-.5);
    for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){const i=(y*W+xx)*4;
      let n;if(brushed)n=rowN[y]*.10+(rnd()-.5)*.05;else if(fr.mat==='paint')n=(rnd()-.5)*.035;else if(fr.mat==='lacquer')n=(rnd()-.5)*.015;else n=(rnd()-.5)*.08+Math.sin(xx*.05+y*.3)*.01;
      // dorado al agua: craquelado sutil
      if(fr.mat==='gold'&&!brushed&&!fr.rough&&rnd()<.0008)n-=.18;
      d[i]*=1+n;d[i+1]*=1+n;d[i+2]*=1+n;}
    x.putImageData(id,0,0);
  }
  const data=x.getImageData(0,0,W,H).data,f=new Float32Array(W*H*3);for(let i=0,j=0;i<data.length;i+=4,j+=3){f[j]=data[i]/255;f[j+1]=data[i+1]/255;f[j+2]=data[i+2]/255;}
  return TEX_CACHE[key]={W,H,f,pxPerCm:W/40};
}

/* ---------- LISTÓN (un lado) ---------- */
// lado: 0 arriba,1 derecha,2 abajo,3 izquierda. Devuelve canvas len x fw con fila 0 = canto exterior
const SIDE_LIGHT=[1.06,.90,.82,1.0];
function renderSide(fr,side,len,fw,pxPerCm){
  const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(len));c.height=Math.max(1,Math.ceil(fw));const x=c.getContext('2d');
  if(fr.texImg&&fr.texImg.width){
    // moldura propia (foto): tira tileable, fila 0 = canto exterior; repetición espejada para ocultar juntas
    const img=fr.texImg,tl=fw*img.width/img.height,off=(side%2?0.31:0)*tl;let k=0;
    for(let t=-off;t<len;t+=tl,k++){if(k%2){x.save();x.translate(t+tl,0);x.scale(-1,1);x.drawImage(img,0,0,tl,fw);x.restore();}else x.drawImage(img,t,0,tl,fw);}
    const sl=SIDE_LIGHT[side];x.globalCompositeOperation='multiply';x.fillStyle=`rgb(${Math.round(255*Math.min(1,sl))},${Math.round(255*Math.min(1,sl))},${Math.round(255*Math.min(1,sl))})`;x.fillRect(0,0,len,fw);x.globalCompositeOperation='source-over';
    const g=x.createLinearGradient(0,0,0,fw);g.addColorStop(0,'rgba(0,0,0,.3)');g.addColorStop(.04,'rgba(0,0,0,0)');g.addColorStop(.95,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.4)');x.fillStyle=g;x.fillRect(0,0,len,fw);
    return c;
  }
  if(fr.orn&&ORN[fr.orn]&&ORN[fr.orn].a){
    const o=ORN[fr.orn],img=(side===1||side===2)?o.b:o.a;
    const crop=fr.ornCrop||[0,1];const sy=crop[0]*img.height,sh=(crop[1]-crop[0])*img.height;
    const tl=fw*img.width/sh;const off=(side%2?0.37:0)*tl;
    for(let t=-off;t<len;t+=tl)x.drawImage(img,0,sy,img.width,sh,t,0,tl,fw);
    // corrección de luz por lado + sombra de contacto en la luz interior y canto exterior
    x.globalCompositeOperation='multiply';x.fillStyle=`rgba(${Math.round(255*Math.min(1,SIDE_LIGHT[side]))},${Math.round(255*Math.min(1,SIDE_LIGHT[side]))},${Math.round(255*Math.min(1,SIDE_LIGHT[side]))},1)`;x.fillRect(0,0,len,fw);
    x.globalCompositeOperation='source-over';
    if(SIDE_LIGHT[side]>1){x.fillStyle=`rgba(255,240,200,${(SIDE_LIGHT[side]-1)*1.2})`;x.globalCompositeOperation='soft-light';x.fillRect(0,0,len,fw);x.globalCompositeOperation='source-over';}
    const g=x.createLinearGradient(0,0,0,fw);g.addColorStop(0,'rgba(0,0,0,.35)');g.addColorStop(.05,'rgba(0,0,0,0)');g.addColorStop(.93,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.45)');x.fillStyle=g;x.fillRect(0,0,len,fw);
    return c;
  }
  const W=c.width,Hn=c.height,prof=buildProfile(fr.profile||'flat',Hn),tex=materialTexture(fr);
  const mainM={type:fr.mat==='gold'?'gold':fr.mat==='silver'?'silver':fr.mat,rough:fr.rough};
  const accM=fr.accent?ACC[fr.accent]:mainM,accAlb=fr.accent?hex2rgb(ACC[fr.accent].color):null;
  const id=x.createImageData(W,Hn),d=id.data,out=[0,0,0];
  const inward=[[0,1],[-1,0],[0,-1],[1,0]][side];
  const depthPx=fw*(fr.mat==='wood'||fr.mat==='paint'||fr.mat==='lacquer'?.32:.26); // relieve proporcional
  const tpc=tex.pxPerCm/pxPerCm;
  for(let r=0;r<Hn;r++){
    const h0=prof.h[Math.max(0,r-1)],h1=prof.h[Math.min(Hn-1,r+1)],slope=(h1-h0)/2*depthPx;
    // normal en el plano de la sección: inclinada hacia el exterior si sube hacia dentro
    let nx=-slope*inward[0],ny=-slope*inward[1],nz=1;const nn=Math.hypot(nx,ny,nz);nx/=nn;ny/=nn;nz/=nn;
    const curv=(h0+h1-2*prof.h[r]);const ao=Math.max(.55,Math.min(1.05,1+curv*Hn*.06+(prof.h[r]-.2)*.12));
    const m=prof.mat[r]===1?accM:mainM;const ty=Math.floor((r*tpc)%tex.H);
    for(let col=0;col<W;col++){
      const tx=Math.floor(((col+side*997)*tpc)%tex.W),ti=(ty*tex.W+tx)*3;
      const alb=m===mainM?[tex.f[ti],tex.f[ti+1],tex.f[ti+2]]:accAlb;
      shadeMat(m,nx,ny,nz,alb,ao*SIDE_LIGHT[side]*(m.type==='gold'||m.type==='silver'||m.type==='metal'?1:1),out);
      const i=(r*W+col)*4;d[i]=Math.min(255,out[0]*255);d[i+1]=Math.min(255,out[1]*255);d[i+2]=Math.min(255,out[2]*255);d[i+3]=255;}
  }
  x.putImageData(id,0,0);
  // canto exterior oscuro + filo interior
  x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,W,Math.max(1,fw*.02));x.fillStyle='rgba(0,0,0,.30)';x.fillRect(0,Hn-Math.max(1,fw*.025),W,Math.max(1,fw*.025));
  return c;
}
/* ---------- MARCO COMPLETO A INGLETE ---------- */
function drawFrame(ctx,x,y,w,h,fw,fr,pxPerCm){
  if(fw<1)return;pxPerCm=pxPerCm||fw/(fr.border||4);
  const sides=[0,1,2,3].map(s=>renderSide(fr,s,(s%2?h:w),fw,pxPerCm));
  const poly=[[[x,y],[x+w,y],[x+w-fw,y+fw],[x+fw,y+fw]],[[x+w,y],[x+w,y+h],[x+w-fw,y+h-fw],[x+w-fw,y+fw]],
              [[x+w,y+h],[x,y+h],[x+fw,y+h-fw],[x+w-fw,y+h-fw]],[[x,y+h],[x,y],[x+fw,y+fw],[x+fw,y+h-fw]]];
  const tf=[[x,y,0],[x+w,y,Math.PI/2],[x+w,y+h,Math.PI],[x,y+h,-Math.PI/2]];
  for(let s=0;s<4;s++){ctx.save();ctx.beginPath();poly[s].forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.clip();
    ctx.translate(tf[s][0],tf[s][1]);ctx.rotate(tf[s][2]);ctx.drawImage(sides[s],0,0);ctx.restore();}
  // juntas de inglete
  ctx.save();ctx.lineWidth=Math.max(.6,fw*.012);ctx.strokeStyle='rgba(0,0,0,.35)';ctx.beginPath();
  [[x,y,x+fw,y+fw],[x+w,y,x+w-fw,y+fw],[x+w,y+h,x+w-fw,y+h-fw],[x,y+h,x+fw,y+h-fw]].forEach(l=>{ctx.moveTo(l[0],l[1]);ctx.lineTo(l[2],l[3]);});ctx.stroke();ctx.restore();
}
/* miniatura: esquina superior izquierda del marco real con el mismo renderizador */
function drawThumb(ctx,fr,w,h){
  ctx.fillStyle='#1b1a17';ctx.fillRect(0,0,w,h);
  const fw=Math.min(h*.46,Math.max(10,fr.border*4.2));const pad=4;
  ctx.save();ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;ctx.fillStyle='#000';ctx.fillRect(pad,pad,w*1.6,h*1.6);ctx.restore();
  ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();
  ctx.fillStyle='#efe9dc';ctx.fillRect(pad+fw,pad+fw,w*2,h*2);
  if(fr.cat==='cajon'){const g=ctx.createLinearGradient(pad+fw,0,pad+fw+fw*.6,0);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(pad+fw,pad+fw,fw*.6,h*2);
    const g2=ctx.createLinearGradient(0,pad+fw,0,pad+fw+fw*.6);g2.addColorStop(0,'rgba(0,0,0,.55)');g2.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g2;ctx.fillRect(pad+fw,pad+fw,w*2,fw*.6);}
  drawFrame(ctx,pad,pad,w*2,h*2,fw,fr,fw/fr.border);ctx.restore();
}
G.FrameRenderer={preload,drawFrame,drawThumb,PROFILES};
})(window);
