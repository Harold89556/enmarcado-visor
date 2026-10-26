/* Enmarcado Studio Pro v1.11 – Vista 3D, sugerencias, comparador, pared de galería, iluminación, link para cliente */
(function(G){
const $=id=>document.getElementById(id);
const toast=(m,i)=>{try{G.showToast(m,i||'check');}catch(e){}};
const artImg=()=>G.state.rectifiedImage||G.state.rawImage;
function el(h){const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild;}
/* ================= ILUMINACIÓN ================= */
const LIGHTS={neutra:{n:'Neutra'},dia:{n:'Día',tint:'rgba(200,220,255,.10)',dir:[-.5,.6,.65],col:[1,1,1.04],amb:.42},calida:{n:'Cálida',tint:'rgba(255,170,80,.16)',dir:[-.3,.5,.8],col:[1.08,.95,.78],amb:.38},
  foco:{n:'Foco',dir:[0,.85,.5],col:[1.05,1,.92],amb:.18},noche:{n:'Noche',tint:'rgba(40,50,90,.30)',dir:[.2,.7,.68],col:[.75,.78,.95],amb:.16}};
LIGHTS.neutra.dir=[-.42,.62,.66];LIGHTS.neutra.col=[1,1,1];LIGHTS.neutra.amb=.4;
const getLight=()=>localStorage.getItem('enm_light')||'neutra';
function setLight(k){localStorage.setItem('enm_light',k);G.renderFullView();syncLightChips();}
function applyLight(ctx,cw,ch,r){
  const k=getLight(),L=LIGHTS[k];if(!r)return;const st=G.state;ctx.save();
  if(L.tint){ctx.globalCompositeOperation='multiply';ctx.fillStyle=L.tint.replace(/[\d.]+\)$/,'1)');ctx.globalAlpha=parseFloat(L.tint.match(/([\d.]+)\)$/)[1])*2.2;ctx.fillRect(0,0,cw,ch);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
  if(k==='foco'||k==='noche'){const cx=r.x+r.w/2,cy=r.y+r.h*.42,R=Math.max(r.w,r.h)*(k==='foco'?.85:.75);
    const g=ctx.createRadialGradient(cx,cy-r.h*.15,R*.15,cx,cy,R*1.25);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.55,'rgba(0,0,0,.08)');g.addColorStop(1,k==='foco'?'rgba(0,0,0,.72)':'rgba(0,0,0,.8)');
    ctx.fillStyle=g;ctx.fillRect(0,0,cw,ch);
    ctx.globalCompositeOperation='screen';const h=ctx.createRadialGradient(cx,r.y-r.h*.05,4,cx,r.y+r.h*.35,R*.9);h.addColorStop(0,'rgba(255,236,200,.35)');h.addColorStop(1,'rgba(255,236,200,0)');ctx.fillStyle=h;ctx.fillRect(0,0,cw,ch);}
  if(k==='calida'){ctx.globalCompositeOperation='screen';const h=ctx.createLinearGradient(r.x,r.y-r.h*.4,r.x+r.w,r.y+r.h);h.addColorStop(0,'rgba(255,190,110,.22)');h.addColorStop(1,'rgba(255,190,110,0)');ctx.fillStyle=h;ctx.fillRect(0,0,cw,ch);}
  // reflejo del vidrio según la luz: brillante = ventana nítida, mate = velo difuso
  if(st.glass!=='none'){ctx.globalCompositeOperation='screen';const fw=st.frameWidthCm/G.totals().W*r.w,x=r.x+fw,y=r.y+fw,w=r.w-2*fw,h=r.h-2*fw;ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
    const mate=st.glassFinish==='mate',a={neutra:.10,dia:.26,calida:.16,foco:.22,noche:.05}[k]*(mate?.35:1);
    if(mate){ctx.fillStyle=`rgba(255,255,255,${a*.5})`;ctx.fillRect(x,y,w,h);}
    else if(k==='foco'){const g=ctx.createRadialGradient(x+w*.5,y+h*.12,2,x+w*.5,y+h*.12,Math.min(w,h)*.22);g.addColorStop(0,`rgba(255,250,235,${a*2.5})`);g.addColorStop(1,'rgba(255,250,235,0)');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);}
    else{ctx.fillStyle=`rgba(235,245,255,${a})`;ctx.beginPath();ctx.moveTo(x+w*.08,y);ctx.lineTo(x+w*.30,y);ctx.lineTo(x+w*.02,y+h);ctx.lineTo(x-w*.2,y+h);ctx.fill();ctx.beginPath();ctx.moveTo(x+w*.36,y);ctx.lineTo(x+w*.42,y);ctx.lineTo(x+w*.14,y+h);ctx.lineTo(x+w*.08,y+h);ctx.fill();}}
  ctx.restore();
}
function lightRoom(ctx,cw,ch){const q=G.RoomMode&&G.RoomMode.R.frameQuad;if(!q)return;const xs=q.map(p=>p.x),ys=q.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);applyLight(ctx,cw,ch,{x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y});}
/* ================= VISTA 3D (WebGL puro, también se incrusta en el link) ================= */
function Viewer3D(cv,o){
  var gl=cv.getContext('webgl',{antialias:true,preserveDrawingBuffer:true,alpha:false});if(!gl)return null;
  var VS='attribute vec3 p;attribute vec3 n;attribute vec2 t;uniform mat4 M,P;varying vec3 vn,vp;varying vec2 vt;void main(){vec4 w=M*vec4(p,1.);vp=w.xyz;vn=mat3(M)*n;vt=t;gl_Position=P*w;}';
  var FS='precision mediump float;varying vec3 vn,vp;varying vec2 vt;uniform sampler2D s;uniform vec4 c;uniform float mt,gls,amb,shin;uniform vec3 L,LC,E;void main(){vec3 N=normalize(vn);vec3 V=normalize(E-vp);vec3 H=normalize(L+V);'+
   'vec4 b=mt>.5?texture2D(s,vt):c;float d=max(dot(N,L),0.);float sp=pow(max(dot(N,H),0.),shin);'+
   'if(gls>0.){float f=pow(1.-max(dot(N,V),0.),3.);float band=smoothstep(.02,0.,abs(fract((vp.x*.7+vp.y)*.012+V.x*.6)-.5)-.12);gl_FragColor=vec4(LC*(sp*gls*1.6+band*gls*.35+f*.4),clamp(sp*gls+band*gls*.25+f*.3+.03,0.,.9));return;}'+
   'gl_FragColor=vec4(b.rgb*LC*(amb+d*(1.-amb)*1.15)+LC*sp*.18,1.);}';
  function sh(k,src){var x=gl.createShader(k);gl.shaderSource(x,src);gl.compileShader(x);return x;}
  var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
  var U={};['M','P','s','c','mt','gls','amb','L','LC','E','shin'].forEach(function(k){U[k]=gl.getUniformLocation(pr,k);});
  var W=o.W,H=o.H,D=Math.max(1,o.D),fw=o.fw,rec=Math.min(D*.8,Math.max(.6,o.rec||1.2)),x0=-W/2,y0=-H/2,x1=W/2,y1=H/2,ix0=x0+fw,iy0=y0+fw,ix1=x1-fw,iy1=y1-fw,zf=D,zi=D-rec;
  var uv=function(x,y){return[(x-x0)/W,(y1-y)/H];};
  var parts=[];function quad(ps,nrm,mode,col,uvs){var v=[];var idx=[0,1,2,0,2,3];idx.forEach(function(i){var q=ps[i],u=uvs?uvs[i]:uv(q[0],q[1]);v.push(q[0],q[1],q[2],nrm[0],nrm[1],nrm[2],u[0],u[1]);});parts.push({v:v,mode:mode,col:col});}
  var ec=o.edge||[.4,.3,.2];
  // frente de la moldura (anillo) con textura
  quad([[x0,y1,zf],[x1,y1,zf],[ix1,iy1,zf],[ix0,iy1,zf]],[0,0,1],'t');quad([[ix0,iy0,zf],[ix1,iy0,zf],[x1,y0,zf],[x0,y0,zf]],[0,0,1],'t');
  quad([[x0,y0,zf],[ix0,iy0,zf],[ix0,iy1,zf],[x0,y1,zf]],[0,0,1],'t');quad([[ix1,iy0,zf],[x1,y0,zf],[x1,y1,zf],[ix1,iy1,zf]],[0,0,1],'t');
  // interior hundido (paspartú + obra)
  quad([[ix0,iy0,zi],[ix1,iy0,zi],[ix1,iy1,zi],[ix0,iy1,zi]],[0,0,1],'t');
  // paredes del galce (con el color del borde interior)
  var ic=o.inner||ec;
  quad([[ix0,iy1,zf],[ix1,iy1,zf],[ix1,iy1,zi],[ix0,iy1,zi]],[0,-1,0],'c',ic.map(function(x){return x*.75;}));quad([[ix0,iy0,zi],[ix1,iy0,zi],[ix1,iy0,zf],[ix0,iy0,zf]],[0,1,0],'c',ic);
  quad([[ix0,iy0,zi],[ix0,iy0,zf],[ix0,iy1,zf],[ix0,iy1,zi]],[1,0,0],'c',ic);quad([[ix1,iy0,zf],[ix1,iy0,zi],[ix1,iy1,zi],[ix1,iy1,zf]],[-1,0,0],'c',ic.map(function(x){return x*.85;}));
  // cantos exteriores (textura del borde estirada) y fondo
  quad([[x0,y1,0],[x1,y1,0],[x1,y1,zf],[x0,y1,zf]],[0,1,0],'c',ec);quad([[x0,y0,zf],[x1,y0,zf],[x1,y0,0],[x0,y0,0]],[0,-1,0],'c',ec);
  quad([[x0,y0,0],[x0,y0,zf],[x0,y1,zf],[x0,y1,0]],[-1,0,0],'c',ec);quad([[x1,y0,zf],[x1,y0,0],[x1,y1,0],[x1,y1,zf]],[1,0,0],'c',ec);
  quad([[x1,y0,0],[x0,y0,0],[x0,y1,0],[x1,y1,0]],[0,0,-1],'c',[.36,.3,.24]);
  if(o.glass&&o.glass!=='none')quad([[ix0,iy0,zf-.25],[ix1,iy0,zf-.25],[ix1,iy1,zf-.25],[ix0,iy1,zf-.25]],[0,0,1],'g');
  parts.forEach(function(p){p.b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,p.b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(p.v),gl.STATIC_DRAW);});
  var tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,o.img);['TEXTURE_WRAP_S','TEXTURE_WRAP_T'].forEach(function(k){gl.texParameteri(gl.TEXTURE_2D,gl[k],gl.CLAMP_TO_EDGE);});gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  var lp=gl.getAttribLocation(pr,'p'),ln=gl.getAttribLocation(pr,'n'),lt=gl.getAttribLocation(pr,'t');
  var S={rx:-.18,ry:.42,z:1,px:0,py:0,k:1,L:o.light||{dir:[-.42,.62,.66],col:[1,1,1],amb:.4}};
  function mul(a,b){var r=new Array(16);for(var i=0;i<4;i++)for(var j=0;j<4;j++){var s=0;for(var k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];r[i*4+j]=s;}return r;}
  function rot(){var cx=Math.cos(S.rx),sx=Math.sin(S.rx),cy=Math.cos(S.ry),sy=Math.sin(S.ry);var X=[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1],Y=[cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1];return mul(X,mul(Y,[1,0,0,0,0,1,0,0,0,0,1,0,0,0,-D/2,1]));}
  function draw(){var w=cv.width,h=cv.height;gl.viewport(0,0,w,h);var bg=o.bg||[.09,.085,.075];gl.clearColor(bg[0],bg[1],bg[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
    var a=w/h,f=1/Math.tan(.35),dist=Math.max(W/a,H)*1.25*f/2/S.z+D,n=1,fa=dist*4+500;
    var P=[f/a,0,0,0,0,f,0,0,0,0,(fa+n)/(n-fa),-1,0,0,2*fa*n/(n-fa),0];P=mul(P,[1,0,0,0,0,1,0,0,0,0,1,0,0,0,-dist,1]);P=mul(P,[1,0,0,0,0,1,0,0,0,0,1,0,S.px,S.py,0,1]);S.k=(cv.clientHeight||h)/(2*dist*Math.tan(.35));
    gl.uniformMatrix4fv(U.P,false,new Float32Array(P));gl.uniformMatrix4fv(U.M,false,new Float32Array(rot()));
    var Ld=S.L.dir,ll=Math.hypot(Ld[0],Ld[1],Ld[2]);gl.uniform3f(U.L,Ld[0]/ll,Ld[1]/ll,Ld[2]/ll);gl.uniform3fv(U.LC,S.L.col);gl.uniform1f(U.amb,S.L.amb);gl.uniform3f(U.E,0,0,dist);gl.uniform1i(U.s,0);
    var gp=null;parts.forEach(function(p){if(p.mode==='g'){gp=p;return;}dp(p);});
    if(gp){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);dp(gp);gl.depthMask(true);gl.disable(gl.BLEND);}}
  function dp(p){gl.bindBuffer(gl.ARRAY_BUFFER,p.b);gl.enableVertexAttribArray(lp);gl.vertexAttribPointer(lp,3,gl.FLOAT,false,32,0);gl.enableVertexAttribArray(ln);gl.vertexAttribPointer(ln,3,gl.FLOAT,false,32,12);gl.enableVertexAttribArray(lt);gl.vertexAttribPointer(lt,2,gl.FLOAT,false,32,24);
    gl.uniform1f(U.mt,p.mode==='t'?1:0);gl.uniform1f(U.gls,p.mode==='g'?(o.glass==='mate'?.18:1):0);gl.uniform1f(U.shin,p.mode==='g'?(o.glass==='mate'?6:90):18);var c=p.col||[1,1,1];gl.uniform4f(U.c,c[0],c[1],c[2],1);gl.drawArrays(gl.TRIANGLES,0,6);}
  function fit(){var r=cv.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);cv.width=Math.max(2,r.width*d);cv.height=Math.max(2,r.height*d);draw();}
  var pts={},g0=null,mode='rot',tap=0;
  function clampPan(){var mx=W/2+fw,my=H/2+fw;S.px=Math.max(-mx,Math.min(mx,S.px));S.py=Math.max(-my,Math.min(my,S.py));}
  function zoomAt(z,cx,cy){var k0=S.k||1;var r=cv.getBoundingClientRect();var fx=cx-r.width/2,fy=-(cy-r.height/2);var wx=fx/k0-S.px,wy=fy/k0-S.py;S.z=Math.max(.5,Math.min(8,z));draw();var k1=S.k||1;S.px=fx/k1-wx;S.py=fy/k1-wy;clampPan();draw();}
  function two(){var k=Object.keys(pts);var a=pts[k[0]],b=pts[k[1]];return{d:Math.hypot(a.x-b.x,a.y-b.y),x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
  function loc(e){var r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  cv.addEventListener('pointerdown',function(e){cv.setPointerCapture(e.pointerId);pts[e.pointerId]=loc(e);var n=Object.keys(pts).length;
    if(n===1){var t=Date.now();if(t-tap<300){api.reset();tap=0;}else tap=t;}
    if(n===2){var m=two();g0={d:m.d,x:m.x,y:m.y,z:S.z};}});
  cv.addEventListener('pointermove',function(e){var p=pts[e.pointerId];if(!p)return;var q=loc(e),dx=q.x-p.x,dy=q.y-p.y;pts[e.pointerId]=q;var n=Object.keys(pts).length;
    if(n===1){if(mode==='pan'){S.px+=dx/(S.k||1);S.py-=dy/(S.k||1);clampPan();}else{S.ry=Math.max(-1.45,Math.min(1.45,S.ry+dx*.006));S.rx=Math.max(-1.4,Math.min(1.4,S.rx+dy*.006));}draw();}
    else if(n===2&&g0){var m=two();S.px+=(m.x-g0.x)/(S.k||1);S.py-=(m.y-g0.y)/(S.k||1);g0.x=m.x;g0.y=m.y;clampPan();zoomAt(g0.z*m.d/g0.d,m.x,m.y);}});
  var up=function(e){delete pts[e.pointerId];if(Object.keys(pts).length<2)g0=null;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',function(e){e.preventDefault();var q=loc(e);zoomAt(S.z*Math.exp(-e.deltaY*.0015),q.x,q.y);},{passive:false});
  cv.style.touchAction='none';
  var api={draw:draw,fit:fit,reset:function(){S.rx=-.18;S.ry=.42;S.z=1;S.px=0;S.py=0;draw();},front:function(){S.rx=0;S.ry=0;S.z=1;S.px=0;S.py=0;draw();},setLight:function(L){S.L=L;draw();},
    setMode:function(m){mode=m;},getMode:function(){return mode;},zoom:function(f){var r=cv.getBoundingClientRect();zoomAt(S.z*f,r.width/2,r.height/2);},S:S};
  return api;
}
function hex3(h){h=String(h).replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');var n=parseInt(h,16);return[(n>>16)/255,((n>>8)&255)/255,(n&255)/255];}
function viewerData(maxPx){
  const st=G.state,img=artImg();if(!img)return null;const{W,H}=G.totals(),s=Math.min(14,(maxPx||1600)/Math.max(W,H));
  const c=document.createElement('canvas');c.width=Math.round(W*s);c.height=Math.round(H*s);const x=c.getContext('2d');x.fillStyle='#ddd';x.fillRect(0,0,c.width,c.height);
  const sv=st.glass;st.glass=st.glass==='double'?'double':'none'; // el reflejo lo pone el shader
  try{G.drawFramedPiece(x,0,0,c.width,c.height,s,img);}finally{st.glass=sv;}
  let edge='#6b4a2a',inner=edge;try{edge=G.ArBridge.edgeColor(x,c.width,c.height);const f=Math.round(st.frameWidthCm*s),d=x.getImageData(f-2,Math.round(c.height/2),2,1).data;inner='#'+[d[0],d[1],d[2]].map(v=>Math.round(v*.8).toString(16).padStart(2,'0')).join('');}catch(e){}
  const di=G.depthInfo(),fr=st.selectedFrame;
  return{canvas:c,W,H,D:di.total,fw:st.frameWidthCm,rec:Math.max(.6,Math.min(di.total*.8,(fr.depthCm||3)-(st.artType==='paper'?.6:0)-(fr.rebateCm||1.6)*.4)),edge:hex3(edge),inner:hex3(inner),glass:st.glass==='none'?'none':st.glassFinish};
}
let V=null;
function open3D(){
  const d=viewerData(1800);if(!d)return toast('Primero carga la foto de la obra','warn');
  let m=$('v3d');if(m)m.remove();
  m=el(`<div id="v3d" class="fixed inset-0 z-50 flex flex-col" style="background:#0b0a08">
   <div class="flex items-center justify-between px-3 pt-[calc(env(safe-area-inset-top)+8px)] pb-2 gap-2"><h2 class="serif text-[20px] font-semibold">Vista 3D</h2>
    <div class="flex gap-1.5"><button id="v3Front" class="chip py-1.5">Frente</button><button id="v3Reset" class="chip py-1.5">↺</button><button id="v3Close" class="btn btn-gold px-3 py-1.5 xclose">Cerrar</button></div></div>
   <div class="relative flex-1 min-h-0"><canvas id="v3c" class="absolute inset-0 w-full h-full"></canvas>
    <div class="absolute right-2 bottom-2 flex flex-col gap-1.5"><button id="v3Mode" class="btn btn-gold px-3 py-2 text-[12px]">✋ Mover</button><button id="v3In" class="btn btn-ghost px-3 py-1.5" style="background:rgba(20,18,14,.8)">＋</button><button id="v3Out" class="btn btn-ghost px-3 py-1.5" style="background:rgba(20,18,14,.8)">－</button></div></div>
   <div class="px-3 py-2 flex flex-col gap-1.5 pb-[calc(env(safe-area-inset-bottom)+10px)]"><div id="v3Light" class="hide-scroll gap-1.5"></div>
    <p class="text-[10.5px]" style="color:var(--muted)">1 dedo: girar (o mover con ✋) · 2 dedos: mover + zoom · doble toque: reiniciar · ${d.W.toFixed(1)} × ${d.H.toFixed(1)} × ${d.D.toFixed(1)} cm</p></div></div>`);
  document.body.appendChild(m);
  V=Viewer3D($('v3c'),{img:d.canvas,W:d.W,H:d.H,D:d.D,fw:d.fw,rec:d.rec,edge:d.edge,inner:d.inner,glass:d.glass,light:LIGHTS[getLight()]});
  if(!V){m.remove();return toast('Este dispositivo no soporta WebGL','warn');}
  requestAnimationFrame(()=>V.fit());
  $('v3Close').onclick=()=>{m.remove();V=null;};$('v3Reset').onclick=()=>V.reset();$('v3Front').onclick=()=>V.front();$('v3In').onclick=()=>V.zoom(1.4);$('v3Out').onclick=()=>V.zoom(1/1.4);
  $('v3Mode').onclick=()=>{const p=V.getMode()==='rot';V.setMode(p?'pan':'rot');$('v3Mode').textContent=p?'⟲ Girar':'✋ Mover';};
  const lb=$('v3Light');Object.keys(LIGHTS).forEach(k=>{const b=el(`<button class="chip py-1">${LIGHTS[k].n}</button>`);b.classList.toggle('on',k===getLight());b.onclick=()=>{localStorage.setItem('enm_light',k);V.setLight(LIGHTS[k]);lb.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));b.classList.add('on');G.renderFullView();syncLightChips();};lb.appendChild(b);});
  window.addEventListener('resize',()=>V&&V.fit());
}
/* ================= SNAPSHOTS (combinaciones) ================= */
const SNAP_KEYS=['frameWidthCm','passWidthCm','passColor','hasFilete','fileteColor','fileteWidthCm','glass','glassFinish','frameStyle','glassMarginCm'];
function snap(){const st=G.state,o={frameId:st.selectedFrame.id};SNAP_KEYS.forEach(k=>o[k]=st[k]);return o;}
function applySnap(o,quiet){
  const st=G.state,f=G.FRAMES.find(x=>x.id===o.frameId);if(!f)return toast('Ese marco ya no está en el catálogo','warn');
  G.selectFrame(f);SNAP_KEYS.forEach(k=>{if(o[k]!==undefined)st[k]=o[k];});
  try{$('rngFrameW').value=st.frameWidthCm;$('lblFrameW').textContent=`${(+st.frameWidthCm).toFixed(1)} cm`;$('rngPassW').value=st.passWidthCm;$('lblPassW').textContent=`${(+st.passWidthCm).toFixed(1)} cm`;$('passCustomColor').value=st.passColor;
    $('chkFilete').checked=st.hasFilete;}catch(e){}
  try{syncGlassUI();}catch(e){}try{renderPassepartoutPalette();}catch(e){}try{G.syncWidthLock&&G.syncWidthLock();}catch(e){}
  try{updateTotalsText();}catch(e){}G.renderFullView();if(!quiet)toast('Combinación aplicada','check');
}
function withSnap(o,fn){const old=snap(),st=G.state,of=st.selectedFrame;const f=G.FRAMES.find(x=>x.id===o.frameId)||of;st.selectedFrame=f;SNAP_KEYS.forEach(k=>{if(o[k]!==undefined)st[k]=o[k];});
  try{return fn();}finally{st.selectedFrame=of;SNAP_KEYS.forEach(k=>st[k]=old[k]);}}
function thumbOf(o,px){return withSnap(o,()=>{const{W,H}=G.totals(),s=(px||360)/Math.max(W,H),c=document.createElement('canvas');c.width=Math.round(W*s);c.height=Math.round(H*s);G.drawFramedPiece(c.getContext('2d'),0,0,c.width,c.height,s,artImg());return c;});}
const priceOf=o=>withSnap(o,()=>G.Pricing.compute().total);
const frameName=o=>{const f=G.FRAMES.find(x=>x.id===o.frameId);return f?f.name:'(marco borrado)';};
/* ================= SUGERENCIA AUTOMÁTICA ================= */
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}return[h,s,l];}
function analyzeArt(img){
  const c=document.createElement('canvas'),n=48;c.width=n;c.height=n;const x=c.getContext('2d');x.drawImage(img,0,0,n,n);const d=x.getImageData(0,0,n,n).data,px=[];
  for(let i=0;i<d.length;i+=4)px.push([d[i],d[i+1],d[i+2]]);
  let C=[0,.2,.4,.6,.8].map(f=>px[Math.floor(f*px.length)].slice());
  for(let it=0;it<8;it++){const s=C.map(()=>[0,0,0,0]);px.forEach(p=>{let b=0,bd=1e9;C.forEach((c,j)=>{const dd=(p[0]-c[0])**2+(p[1]-c[1])**2+(p[2]-c[2])**2;if(dd<bd){bd=dd;b=j;}});s[b][0]+=p[0];s[b][1]+=p[1];s[b][2]+=p[2];s[b][3]++;});C=s.map((v,j)=>v[3]?[v[0]/v[3],v[1]/v[3],v[2]/v[3],v[3]/px.length]:[...C[j].slice(0,3),0]);}
  C.sort((a,b)=>b[3]-a[3]);let L=0,warm=0,sat=0;px.forEach(p=>{const h=rgb2hsl(...p);L+=h[2];sat+=h[1];warm+=(p[0]-p[2]);});L/=px.length;sat/=px.length;warm/=px.length*255;
  return{palette:C,light:L,sat,warm};
}
const FC={};
function frameColor(f){if(FC[f.id])return FC[f.id];let col=hex3(f.base||'#8a6a3a').map(v=>v*255);
  try{const c=document.createElement('canvas');c.width=60;c.height=60;G.FrameRenderer.drawThumb(c.getContext('2d'),f,60,60);const d=c.getContext('2d').getImageData(0,0,60,8).data;let s=[0,0,0],n=0;for(let i=0;i<d.length;i+=4){if(d[i+3]<200)continue;s[0]+=d[i];s[1]+=d[i+1];s[2]+=d[i+2];n++;}if(n)col=s.map(v=>v/n);}catch(e){}
  return FC[f.id]=col;}
const metallicGold=f=>/oro|gold|dorad|bronce|cobre|lat[oó]n|champ/i.test(f.name+' '+(f.id||''));
const metallicSilver=f=>/plata|silver|alumin|cromad|plate/i.test(f.name+' '+(f.id||''));
function suggest(){
  const img=artImg();if(!img)return null;const A=analyzeArt(img),st=G.state;
  const list=G.FRAMES.filter(f=>!f.hidden);const sc=[];
  list.forEach(f=>{const c=frameColor(f),h=rgb2hsl(...c);let s=0,why=[];
    const lc=Math.abs(h[2]-A.light);s+=(lc>.12&&lc<.55?1:lc>=.55?.5:-.3);
    if(A.warm>.06&&(metallicGold(f)||(h[0]<50&&h[1]>.2))){s+=1.2;why.push('tono cálido como la obra');}
    if(A.warm<-.02&&(metallicSilver(f)||h[1]<.12)){s+=1.2;why.push('neutro/frío acorde a la paleta');}
    // armonía con algún color dominante
    const m=Math.min(...A.palette.slice(0,3).map(p=>Math.hypot(p[0]-c[0],p[1]-c[1],p[2]-c[2])));if(m<70){s+=.9;why.push('repite un color dominante');}
    if(A.light>.6&&h[2]<.3){s+=.5;why.push('contraste oscuro sobre obra clara');}
    if(A.light<.35&&(h[2]>.6||metallicGold(f))){s+=.5;why.push('realza una obra oscura');}
    if(A.sat>.45&&h[1]<.15){s+=.6;why.push('marco sobrio para colores intensos');}
    if(st.artType==='canvas'&&(f.cat==='cajon'||f.cat==='rococo'))s+=.3;
    if(st.artType==='paper'&&(f.cat==='liso'||f.cat==='metal'||f.cat==='madera'))s+=.3;
    if(f.custom||f.stock)s+=.35;
    sc.push({f,s,why});});
  sc.sort((a,b)=>b.s-a.s);const out=[],cats={};
  for(const r of sc){if(out.length>=3)break;if(cats[r.f.cat]&&sc.length>10&&out.length<2)continue;cats[r.f.cat]=1;out.push(r);}
  // paspartú: tono neutro claro tomado de la paleta o clásicos de museo
  const tones=PASSEPARTOUT_TONES;const pickPass=(dark)=>{if(dark)return tones.find(t=>t.name.startsWith('Carbón'))||tones[10];
    const warm=A.warm>.04;return tones.find(t=>t.name.startsWith(warm?'Hueso':'Blanco Roto'))||tones[1];};
  return out.map((r,i)=>{const passW=st.artType==='paper'?(i===2?8:6):(i===0?0:i===1?0:4);const dark=i===2&&A.light>.65;const pt=pickPass(dark);
    const o=Object.assign(snap(),{frameId:r.f.id,frameWidthCm:r.f.border,passWidthCm:st.glass==='double'?st.passWidthCm:passW,passColor:pt.hex,frameStyle:r.f.cat==='cajon'||r.f.boxType?'box':'classic'});
    if(st.artType==='paper'&&o.glass==='none')o.glass='glass';
    const why=(r.why.length?r.why.slice(0,2).join(', '):'equilibrio de luz y tono')+(passW?` · paspartú ${pt.name.toLowerCase()} ${passW} cm`:' · sin paspartú (óleo)');
    return{o,why:why[0].toUpperCase()+why.slice(1),palette:A.palette};});
}
function sheet(id,title,body){let m=$(id);if(m)m.remove();
  m=el(`<div id="${id}" class="fixed inset-0 z-50 flex flex-col" style="background:rgba(8,7,5,.92)"><div class="m-3 mt-[calc(env(safe-area-inset-top)+12px)] mb-[calc(env(safe-area-inset-bottom)+12px)] p-4 rounded-2xl flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto" style="background:#17150f;border:1px solid rgba(201,164,92,.4)">
   <div class="flex items-center justify-between gap-2"><h2 class="serif text-[22px] font-semibold">${title}</h2><button class="btn btn-gold px-4 py-1.5 xclose">Cerrar</button></div>${body}</div></div>`);
  document.body.appendChild(m);m.querySelector('.xclose').onclick=()=>m.remove();return m;}
function openSuggest(){
  if(!artImg())return toast('Primero carga la foto de la obra','warn');G.setBusy(true,'Analizando colores de la obra…');
  setTimeout(()=>{let S;try{S=suggest();}finally{G.setBusy(false);}if(!S||!S.length)return toast('No hay marcos para sugerir','warn');
    const pal=S[0].palette.map(p=>`<span class="inline-block w-6 h-6 rounded-full" style="background:rgb(${p.slice(0,3).map(Math.round)});border:1px solid rgba(255,255,255,.25)"></span>`).join('');
    const m=sheet('sugSheet','Sugerencias',`<div class="flex items-center gap-2 text-[11px]" style="color:var(--muted)">Paleta de la obra ${pal}</div><div id="sugList" class="flex flex-col gap-2"></div>`);
    const L=m.querySelector('#sugList');
    S.forEach((s,i)=>{const t=thumbOf(s.o,300),d=el(`<div class="card p-2 flex gap-3 items-center"><div class="w-24 shrink-0 flex justify-center"></div><div class="flex-1 min-w-0"><p class="text-[13px] font-semibold">${i+1}. </p><p class="text-[11px]" style="color:var(--muted)"></p><p class="text-[13px] mt-1" style="color:var(--gold2)"></p></div><div class="flex flex-col gap-1"><button class="btn btn-gold px-3 py-1.5 ap">Aplicar</button><button class="chip py-1 cmp">＋ Comparar</button></div></div>`);
      t.style.cssText='max-width:96px;max-height:110px';d.children[0].appendChild(t);const p=d.querySelectorAll('p');p[0].textContent+=frameName(s.o);p[1].textContent=s.why;p[2].textContent=G.Pricing.gs(priceOf(s.o))+' (IVA incl.)';
      d.querySelector('.ap').onclick=()=>{applySnap(s.o);m.remove();};d.querySelector('.cmp').onclick=()=>{addCompare(s.o);};L.appendChild(d);});},40);
}
/* ================= COMPARADOR ================= */
let CMP=[];
function addCompare(o){o=o||snap();if(!artImg())return toast('Primero carga la foto de la obra','warn');if(CMP.length>=3)CMP.shift();CMP.push(o);toast(`Guardada para comparar (${CMP.length}/3)`,'check');syncChips();}
function openCompare(){
  if(!CMP.length){addCompare();}
  const m=sheet('cmpSheet','Comparar',`<p class="text-[11px]" style="color:var(--muted)">Hasta 3 combinaciones de la misma obra. Precio final con IVA incluido.</p><div id="cmpGrid" class="grid gap-2" style="grid-template-columns:repeat(${Math.max(2,CMP.length)},minmax(0,1fr))"></div>
    <div class="flex gap-2"><button id="cmpAdd" class="btn btn-ghost flex-1 justify-center py-2">＋ Guardar la actual</button><button id="cmpClear" class="chip">Vaciar</button></div>`);
  const Gd=m.querySelector('#cmpGrid');
  CMP.forEach((o,i)=>{const t=thumbOf(o,420),d=el(`<div class="card p-2 flex flex-col gap-1 items-center text-center"><div class="w-full flex justify-center items-center" style="min-height:120px"></div><p class="text-[11.5px] font-semibold leading-tight"></p><p class="text-[10px]" style="color:var(--muted)"></p><b class="text-[14px] tabular-nums" style="color:var(--gold2)"></b><div class="flex gap-1"><button class="btn btn-gold px-2.5 py-1 text-[12px] ap">Elegir</button><button class="chip py-1 rm">✕</button></div></div>`);
    t.style.cssText='max-width:100%;max-height:170px;box-shadow:0 6px 18px rgba(0,0,0,.5)';d.children[0].appendChild(t);const p=d.querySelectorAll('p');p[0].textContent=frameName(o);
    p[1].textContent=`${(+o.frameWidthCm).toFixed(1)} cm · ${o.passWidthCm>0&&o.glass!=='double'?'paspartú '+o.passWidthCm+' cm':'sin paspartú'} · ${o.glass==='none'?'sin vidrio':o.glass==='double'?'doble vidrio':'vidrio '+(o.glassFinish==='mate'?'mate':'brillante')}`;
    d.querySelector('b').textContent=G.Pricing.gs(priceOf(o));d.querySelector('.ap').onclick=()=>{applySnap(o);m.remove();};d.querySelector('.rm').onclick=()=>{CMP.splice(i,1);syncChips();openCompare();};Gd.appendChild(d);});
  m.querySelector('#cmpAdd').onclick=()=>{addCompare();openCompare();};m.querySelector('#cmpClear').onclick=()=>{CMP=[];syncChips();m.remove();};
}
/* ================= LINK PARA EL CLIENTE (HTML autónomo) ================= */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function proposalData(){
  const d=viewerData(1400);if(!d)return null;const st=G.state,P=G.Pricing.prices,r=G.Pricing.compute(),fr=st.selectedFrame,di=G.depthInfo();
  const spec=[['Obra',`${st.artWidthCm} × ${st.artHeightCm} cm`],['Moldura',`${fr.name} · ${st.frameWidthCm} cm`],['Medida exterior',`${d.W.toFixed(1)} × ${d.H.toFixed(1)} × ${di.total.toFixed(1)} cm`],
    ['Paspartú',st.glass==='double'?'Sin (doble vidrio)':st.passWidthCm>0?`${st.passWidthCm} cm`:'Sin paspartú'],['Vidrio',st.glass==='none'?'Sin vidrio':`${st.glass==='double'?'Doble ':''}${st.glassFinish==='mate'?'mate':'brillante'}`]];
  if(st.plaque&&st.plaque.on)spec.push(['Epígrafe',`${G.Pricing.FINISH[st.plaque.finish]}${st.plaque.title?' · “'+st.plaque.title+'”':''}`]);
  return{v:1,biz:P.business||'Galería',client:st.clientName||'',date:new Date().toLocaleDateString('es-PY'),spec,price:G.Pricing.gs(r.total),ivaPct:r.ivaPct,
    tex:d.canvas.toDataURL('image/jpeg',.82),opts:{W:d.W,H:d.H,D:d.D,fw:d.fw,rec:d.rec,edge:d.edge,inner:d.inner,glass:d.glass,light:LIGHTS[getLight()]}};
}
/* página del visor: data = objeto (archivo autónomo) o null (sitio web: lee ?id= y busca p/<id>.json) */
function viewerPage(data,site){
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${data?esc(data.biz)+' · ':''}Propuesta de enmarcado</title>
<style>body{margin:0;font-family:system-ui,Arial,sans-serif;background:#f4f1ea;color:#1d1d1f}header{padding:16px 18px 6px}h1{margin:0;font-size:13px;letter-spacing:.12em;color:#9a7322;text-transform:uppercase}h2{margin:4px 0 0;font-size:22px}
#c{width:100%;height:58vh;display:block;background:#17150f;touch-action:none}.bar{display:flex;gap:8px;justify-content:center;padding:8px;flex-wrap:wrap}button{border:1px solid #9a7322;background:#fff;border-radius:20px;padding:7px 14px;font-size:14px;color:#5a420f}
.sp{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:6px 18px}.sp div{font-size:12px;color:#5b5b60}.sp b{display:block;font-size:14px;color:#1d1d1f}
.pr{margin:14px 18px;background:#faf6ec;border-left:6px solid #9a7322;padding:14px 16px;display:flex;justify-content:space-between;align-items:center}.pr b{font-size:26px;color:#7a5a14}footer{font-size:11px;color:#777;padding:6px 18px 24px}
#land{padding:40px 22px;text-align:center}#land h2{font-family:Georgia,serif;font-size:30px;margin:10px 0}#land p{color:#5b5b60;line-height:1.5}.hid{display:none}</style></head>
<body><div id="land" class="hid"><h1>Enmarcado Studio Pro</h1><h2>Visor 3D de enmarcados</h2><p id="lmsg">Abrí el enlace que te envió la galería para ver tu cuadro enmarcado en 3D: girarlo, acercarlo y ver el precio final.</p></div>
<div id="app" class="hid"><header><h1 id="biz"></h1><h2 id="ttl">Propuesta de enmarcado</h2></header>
<canvas id="c"></canvas><div class="bar"><button id="f">Frente</button><button id="m">✋ Mover</button><button id="zi">＋</button><button id="zo">－</button><button id="r">↺</button></div>
<p style="text-align:center;font-size:12px;color:#777;margin:0">1 dedo: girar (o mover con ✋) · 2 dedos: mover y zoom · doble toque: reiniciar</p>
<div class="sp" id="sp"></div><div class="pr"><div><div style="font-weight:700">PRECIO FINAL</div><div style="font-size:12px;color:#5b5b60" id="iva"></div></div><b id="price"></b></div>
<footer id="foot"></footer></div>
<script>${Viewer3D.toString()}
function $(i){return document.getElementById(i);}function t(e,x){e.textContent=x;}
function show(D){$('app').className='';$('land').className='hid';t($('biz'),D.biz);t($('ttl'),'Propuesta de enmarcado'+(D.client?' · '+D.client:''));document.title=D.biz+' · Propuesta de enmarcado';
  D.spec.forEach(function(s){var d=document.createElement('div');d.textContent=s[0];var b=document.createElement('b');b.textContent=s[1];d.appendChild(b);$('sp').appendChild(d);});
  t($('iva'),'IVA '+D.ivaPct+'% incluido');t($('price'),D.price);t($('foot'),'Fecha '+D.date+' · Presupuesto válido por 15 días · Vista ilustrativa: colores y texturas pueden variar.');
  var im=new Image();im.onload=function(){var o=D.opts;o.img=im;o.bg=[.09,.085,.075];var v=Viewer3D($('c'),o);if(!v)return;v.fit();window.onresize=v.fit;$('f').onclick=v.front;$('r').onclick=v.reset;
    var mb=$('m');mb.onclick=function(){var p=v.getMode()==='rot';v.setMode(p?'pan':'rot');mb.textContent=p?'⟲ Girar':'✋ Mover';};$('zi').onclick=function(){v.zoom(1.4);};$('zo').onclick=function(){v.zoom(1/1.4);};};im.src=D.tex;}
${data?`show(${JSON.stringify(data)});`:`(function(){var id=(location.search.match(/[?&]id=([\\w-]{4,40})/)||[])[1];if(!id){$('land').className='';return;}
  var m=location.hostname.match(/^([\\w-]+)\\.github\\.io$/),repo=location.pathname.split('/')[1],raw=m?'https://raw.githubusercontent.com/'+m[1]+'/'+repo+'/main/p/'+id+'.json':null,n=0;
  function fail(){$('land').className='';t($('lmsg'),'No se encontró esta propuesta. Puede que haya sido retirada por la galería.');}
  function go(){var u=(n%2===0&&raw)?raw+'?t='+Date.now():'p/'+id+'.json';fetch(u,{cache:'no-store'}).then(function(r){if(!r.ok)throw r.status;return r.json();}).then(show).catch(function(){n++;if(n<12){$('land').className='';t($('lmsg'),'Cargando la propuesta…');setTimeout(go,n<2?300:5000);}else fail();});}
  go();})();`}
<\/script></body></html>`;
}
function buildClientHtml(){const d=proposalData();return d?viewerPage(d):null;}
async function shareAll(){
  if(G.Publish&&G.Publish.ready()&&navigator.onLine!==false){try{await G.Publish.shareLink();return;}catch(e){G.setBusy(false);toast('No se pudo publicar el link ('+(e&&e.message||e)+'). Envío los archivos.','warn');}}
  const html=buildClientHtml();if(!html)return toast('Primero carga la foto de la obra','warn');
  const base=`propuesta-${(G.state.clientName||'cliente').replace(/[^\w-]+/g,'_')}-${new Date().toISOString().slice(0,10)}`;
  const fc=G.Pricing.buildFicha(),pdf=G.Pricing.canvasToPdf(fc);const C=G.Capacitor,nat=C&&C.isNativePlatform&&C.isNativePlatform(),Pl=C&&C.Plugins;
  const b64u=u=>{let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s);};
  if(nat){try{G.setBusy(true,'Preparando archivos…');const a=await Pl.Filesystem.writeFile({path:base+'-3D.html',data:b64u(new TextEncoder().encode(html)),directory:'CACHE'});
      const b=await Pl.Filesystem.writeFile({path:base+'.pdf',data:b64u(pdf),directory:'CACHE'});G.setBusy(false);
      await Pl.Share.share({title:'Propuesta de enmarcado',text:`${G.Pricing.prices.business||'Galería'} – Propuesta de enmarcado. Abrí el archivo “3D” en el navegador (Chrome) para girar y hacer zoom; el PDF tiene la ficha con el precio final.`,files:[a.uri,b.uri],dialogTitle:'Compartir con el cliente'});}
    catch(e){G.setBusy(false);if(!/cancel/i.test(e&&e.message||''))toast('No se pudo compartir: '+(e&&e.message||e),'warn');}return;}
  const dl=(blob,n)=>{const a=document.createElement('a');a.download=n;a.href=URL.createObjectURL(blob);document.body.appendChild(a);a.click();a.remove();};
  dl(new Blob([html],{type:'text/html'}),base+'-3D.html');dl(new Blob([pdf],{type:'application/pdf'}),base+'.pdf');toast('Archivos descargados','download');
}
async function shareClientLink(){
  const html=buildClientHtml();if(!html)return toast('Primero carga la foto de la obra','warn');
  const name=`propuesta-${(G.state.clientName||'cliente').replace(/[^\w-]+/g,'_')}-${new Date().toISOString().slice(0,10)}.html`;
  const C=G.Capacitor,nat=C&&C.isNativePlatform&&C.isNativePlatform(),Pl=C&&C.Plugins;
  if(nat){try{const b64=btoa(unescape(encodeURIComponent(html)));const r=await Pl.Filesystem.writeFile({path:name,data:b64,directory:'CACHE'});
      await Pl.Share.share({title:'Propuesta de enmarcado',text:'Abrí el archivo adjunto en el navegador para ver tu cuadro en 3D y el precio final.',files:[r.uri],dialogTitle:'Enviar al cliente'});}
    catch(e){if(!/cancel/i.test(e&&e.message||''))toast('No se pudo compartir: '+(e&&e.message||e),'warn');}return;}
  const a=document.createElement('a');a.download=name;a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));document.body.appendChild(a);a.click();a.remove();toast('Archivo HTML descargado','download');
}
/* ================= PARED DE GALERÍA ================= */
const GW={items:[],wallW:400,wallH:270,gap:6,center:150,bg:null,sel:-1};
function addToWall(){
  const st=G.state;if(!artImg())return toast('Primero carga la foto de la obra','warn');const{W,H}=G.totals(),s=Math.min(8,900/Math.max(W,H));
  const c=document.createElement('canvas');c.width=Math.round(W*s);c.height=Math.round(H*s);G.drawFramedPiece(c.getContext('2d'),0,0,c.width,c.height,s,artImg());
  GW.items.push({c,W,H,D:G.depthInfo().total,price:G.Pricing.compute().total,name:st.selectedFrame.name,x:0,y:0});autoArrange('row');toast(`Agregada a la pared (${GW.items.length})`,'check');syncChips();
}
function autoArrange(mode){
  const I=GW.items,g=GW.gap;if(!I.length)return;
  if(mode==='grid'&&I.length>=3){const cols=Math.ceil(Math.sqrt(I.length)),rows=Math.ceil(I.length/cols);const cw=Math.max(...I.map(i=>i.W)),rh=Math.max(...I.map(i=>i.H));
    const tw=cols*cw+(cols-1)*g,th=rows*rh+(rows-1)*g;I.forEach((it,k)=>{const cx=k%cols,ry=Math.floor(k/cols);it.x=GW.wallW/2-tw/2+cx*(cw+g)+(cw-it.W)/2;it.y=GW.center-th/2+ry*(rh+g)+(rh-it.H)/2;});}
  else{const tw=I.reduce((a,i)=>a+i.W,0)+g*(I.length-1);let x=GW.wallW/2-tw/2;I.forEach(it=>{it.x=x;it.y=GW.center-it.H/2;x+=it.W+g;});}
  drawWall();
}
function wallLayout(cv){const r=cv.getBoundingClientRect(),s=Math.min(r.width/GW.wallW,r.height/GW.wallH);return{s,ox:(r.width-GW.wallW*s)/2,oy:(r.height-GW.wallH*s)/2,r};}
function drawWall(){
  const cv=$('gwC');if(!cv)return;const d=Math.min(2,devicePixelRatio||1),{s,ox,oy,r}=wallLayout(cv);cv.width=r.width*d;cv.height=r.height*d;const x=cv.getContext('2d');x.setTransform(d,0,0,d,0,0);
  x.fillStyle='#0b0a08';x.fillRect(0,0,r.width,r.height);const ww=GW.wallW*s,wh=GW.wallH*s;
  if(GW.bg)x.drawImage(GW.bg,ox,oy,ww,wh);else{x.fillStyle=G.state.wallColor||'#eae8e3';x.fillRect(ox,oy,ww,wh);}
  x.strokeStyle='rgba(201,164,92,.7)';x.setLineDash([6,5]);x.beginPath();const cy=oy+(GW.wallH-GW.center)*0+GW.center*s;x.moveTo(ox,oy+wh-GW.center*s);x.lineTo(ox+ww,oy+wh-GW.center*s);x.stroke();x.setLineDash([]);
  x.fillStyle='rgba(120,90,30,.9)';x.font='600 11px Inter,sans-serif';x.fillText(`centro ${GW.center} cm del piso`,ox+6,oy+wh-GW.center*s+13);
  // y se mide desde arriba en cm de pared: convertir: yTop(cm desde arriba) = wallH - centerFromFloor
  GW.items.forEach((it,i)=>{const X=ox+it.x*s,Y=oy+(it.y+(GW.wallH-2*GW.center))*s+0;const yy=oy+(GW.wallH-GW.center-(GW.center-it.y))*s;
    const px=X,py=oy+(GW.wallH-GW.center)*s+(it.y-GW.center)*s;x.save();x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=it.D*s*1.5+4;x.shadowOffsetY=it.D*s*.5+2;x.fillStyle='#000';x.fillRect(px,py,it.W*s,it.H*s);x.restore();
    x.drawImage(it.c,px,py,it.W*s,it.H*s);if(i===GW.sel){x.strokeStyle='#e8c66a';x.lineWidth=2;x.strokeRect(px-2,py-2,it.W*s+4,it.H*s+4);}it._r={x:px,y:py,w:it.W*s,h:it.H*s};});
  // separaciones entre piezas vecinas en la misma fila
  x.font='600 10px Inter,sans-serif';const I=GW.items.slice().sort((a,b)=>a.x-b.x);
  for(let i=0;i<I.length-1;i++){const a=I[i],b=I[i+1];const gap=b.x-(a.x+a.W);if(gap>=0&&gap<60&&Math.abs((a.y+a.H/2)-(b.y+b.H/2))<Math.max(a.H,b.H)/2){const gx=a._r.x+a._r.w,gy=Math.max(a._r.y,b._r.y)+10;x.fillStyle=gap>=5&&gap<=8?'#2e7d32':'#c62828';x.fillText(`${gap.toFixed(1).replace('.',',')} cm`,gx+1,gy-2);}}
  try{applyLight(x,r.width,r.height,(()=>{if(!GW.items.length)return null;const R=GW.items.map(i=>i._r),x0=Math.min(...R.map(r=>r.x)),y0=Math.min(...R.map(r=>r.y));return{x:x0,y:y0,w:Math.max(...R.map(r=>r.x+r.w))-x0,h:Math.max(...R.map(r=>r.y+r.h))-y0};})());}catch(e){}
  const tot=GW.items.reduce((a,i)=>a+i.price,0),L=$('gwTot');if(L)L.textContent=`${GW.items.length} pieza${GW.items.length===1?'':'s'} · total ${G.Pricing.gs(tot)} (IVA incl.)`;
}
function compositePng(){
  const I=GW.items;if(!I.length)return null;const x0=Math.min(...I.map(i=>i.x)),y0=Math.min(...I.map(i=>i.y)),x1=Math.max(...I.map(i=>i.x+i.W)),y1=Math.max(...I.map(i=>i.y+i.H));
  const W=x1-x0,H=y1-y0,s=Math.min(10,2048/Math.max(W,H)),c=document.createElement('canvas');c.width=Math.round(W*s);c.height=Math.round(H*s);const g=c.getContext('2d');
  I.forEach(it=>g.drawImage(it.c,(it.x-x0)*s,(it.y-y0)*s,it.W*s,it.H*s));return{c,W,H,D:Math.max(...I.map(i=>i.D))};
}
async function wallToAR(){
  const p=compositePng();if(!p)return toast('Agregá obras a la pared primero','warn');const C=G.Capacitor;
  if(!(C&&C.isNativePlatform&&C.isNativePlatform()))return toast('La RA funciona en la app Android','info');
  const AW=(C.Plugins&&C.Plugins.ArWall)||C.registerPlugin('ArWall');
  try{const av=await AW.checkAvailability();if(!av.supported)return toast(av.message||'ARCore no disponible','warn');
    await AW.open({png:p.c.toDataURL('image/png').split(',')[1],widthCm:p.W,heightCm:p.H,depthCm:0.2,edgeColor:'#000000',label:`Pared de galería · ${GW.items.length} obras · ${p.W.toFixed(0)} × ${p.H.toFixed(0)} cm`});}
  catch(e){toast('No se pudo abrir la RA: '+(e&&e.message||e),'warn');}
}
function openWall(){
  if(!GW.items.length&&artImg())addToWall();
  const m=sheet('gwSheet','Pared de galería',`<div class="relative w-full rounded-xl overflow-hidden" style="height:46vh"><canvas id="gwC" class="w-full h-full touch-none"></canvas></div>
   <p id="gwTot" class="text-[12px] font-semibold" style="color:var(--gold2)"></p>
   <div class="grid grid-cols-3 gap-2 text-[11px]"><label>Ancho pared (cm)<input id="gwW" class="fe-in" type="number" value="${GW.wallW}"></label><label>Separación (cm)<input id="gwG" class="fe-in" type="number" step="0.5" value="${GW.gap}"></label><label>Centro (cm del piso)<input id="gwCe" class="fe-in" type="number" value="${GW.center}"></label></div>
   <div class="flex flex-wrap gap-1.5"><button id="gwAdd" class="btn btn-gold px-3 py-1.5">＋ Obra actual</button><button id="gwRow" class="chip">Alinear en fila</button><button id="gwGrid" class="chip">Grilla</button><button id="gwDel" class="chip">Quitar selección</button>
    <button id="gwBg" class="chip">Foto de pared…</button><button id="gwSave" class="chip">Guardar imagen</button><button id="gwAR" class="chip" style="border-color:var(--gold);color:var(--gold2)">Ver en AR</button><input id="gwFile" type="file" accept="image/*" class="hidden"></div>
   <p class="text-[10px]" style="color:var(--muted)">Arrastrá cada cuadro. Sugerido: 5–8 cm entre piezas (verde = dentro del rango) y el centro del conjunto a ~150 cm del piso. Cambiá de marco en la pantalla principal y tocá “＋ Obra actual” para sumar otra pieza o variante.</p>`);
  const cv=$('gwC');requestAnimationFrame(drawWall);let drag=null;
  cv.onpointerdown=e=>{const r=cv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;GW.sel=-1;for(let i=GW.items.length-1;i>=0;i--){const q=GW.items[i]._r;if(q&&px>=q.x&&px<=q.x+q.w&&py>=q.y&&py<=q.y+q.h){GW.sel=i;drag={i,px,py,x:GW.items[i].x,y:GW.items[i].y};cv.setPointerCapture(e.pointerId);break;}}drawWall();};
  cv.onpointermove=e=>{if(!drag)return;const r=cv.getBoundingClientRect(),{s}=wallLayout(cv),it=GW.items[drag.i];it.x=drag.x+(e.clientX-r.left-drag.px)/s;it.y=drag.y+(e.clientY-r.top-drag.py)/s;
    // imán: alinear al gap sugerido con vecinos
    GW.items.forEach((o,j)=>{if(j===drag.i)return;const g=GW.gap;if(Math.abs(it.x-(o.x+o.W+g))<3)it.x=o.x+o.W+g;if(Math.abs(it.x+it.W+g-o.x)<3)it.x=o.x-g-it.W;if(Math.abs((it.y+it.H/2)-(o.y+o.H/2))<3)it.y=o.y+o.H/2-it.H/2;});drawWall();};
  cv.onpointerup=cv.onpointercancel=()=>{drag=null;};
  const num=(id,k)=>{$(id).oninput=e=>{const v=parseFloat(e.target.value);if(v>0){GW[k]=v;if(k==='wallW')GW.wallH=Math.max(GW.wallH,250);drawWall();}};};num('gwW','wallW');num('gwG','gap');num('gwCe','center');
  $('gwAdd').onclick=()=>{addToWall();};$('gwRow').onclick=()=>autoArrange('row');$('gwGrid').onclick=()=>autoArrange('grid');
  $('gwDel').onclick=()=>{if(GW.sel>=0){GW.items.splice(GW.sel,1);GW.sel=-1;drawWall();syncChips();}};
  $('gwBg').onclick=()=>$('gwFile').click();$('gwFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const i=new Image();i.onload=()=>{GW.bg=i;drawWall();};i.src=URL.createObjectURL(f);};
  $('gwAR').onclick=wallToAR;
  $('gwSave').onclick=()=>{const c=$('gwC');const d=c.toDataURL('image/png');const C=G.Capacitor;if(C&&C.isNativePlatform&&C.isNativePlatform()){const AW=(C.Plugins&&C.Plugins.ArWall)||C.registerPlugin('ArWall');AW.saveToGallery({data:d.split(',')[1],name:`pared-galeria-${Date.now()}.png`,mime:'image/png'}).then(()=>toast('Imagen guardada en la galería','download')).catch(e=>toast(String(e&&e.message||e),'warn'));}
    else{const a=document.createElement('a');a.download='pared-galeria.png';a.href=d;a.click();}};
}
/* ================= VARILLAS (detalle) ================= */
function openRods(){
  const{W,H}=G.totals(),fr=G.state.selectedFrame,r=G.Pricing.rodPlan(W,H,G.state.frameWidthCm,fr),P=G.Pricing.prices,ppm=fr.price||P.defaultFramePerM,rp=fr.rodPrice||Math.round(ppm*r.rodCm/100),f=G.Pricing.fmtCm;
  const bars=r.bins.map((b,i)=>`<div class="flex flex-col gap-0.5"><span class="text-[10.5px]" style="color:var(--muted)">Varilla ${i+1}</span><div class="flex h-6 rounded overflow-hidden" style="background:#3a2f22">${b.items.map(x=>`<div class="text-[9.5px] flex items-center justify-center" style="width:${(x+r.kerf)/r.rodCm*100}%;background:linear-gradient(#c9a45c,#8a6a2a);color:#1a140a;border-right:2px solid #17150f">${f(x)}</div>`).join('')}<div class="flex-1 text-[9.5px] flex items-center justify-center" style="color:#d9c9a0;background:repeating-linear-gradient(45deg,#2a231a 0 5px,#3a2f22 5px 10px)">${f(b.free)}</div></div></div>`).join('');
  sheet('rodSheet','Varillas necesarias',`<p class="text-[12px]">${esc(fr.name)} · varilla de <b>${f(r.rodCm)}</b> · corte de sierra ${f(r.kerf)}</p>
   <div class="grid grid-cols-3 gap-2 text-center"><div class="card p-2"><b class="text-[22px]" style="color:var(--gold2)">${r.rods}</b><p class="text-[10px]">varilla${r.rods>1?'s':''}</p></div><div class="card p-2"><b class="text-[18px]">${(r.usedCm/100).toFixed(2).replace('.',',')} m</b><p class="text-[10px]">usados</p></div><div class="card p-2"><b class="text-[18px]">${(r.wasteCm/100).toFixed(2).replace('.',',')} m</b><p class="text-[10px]">sobrante</p></div></div>
   <p class="text-[11px]" style="color:var(--muted)">Piezas a inglete 45° (largo en la punta = luz + 2 × ancho de moldura): 2 × ${f(r.pieces[0])} y 2 × ${f(r.pieces[2])}.${r.tooLong?' ⚠ Un lado supera el largo de la varilla: necesita empalme.':''}</p>
   <div class="flex flex-col gap-2">${bars}</div>
   <div class="card p-2 text-[12px] flex flex-col gap-0.5"><div class="flex justify-between"><span>Por metros (${(2*(W+H)/100*(1+(P.wastePct||0)/100)).toFixed(2).replace('.',',')} m con ${P.wastePct}% desperdicio)</span><b>${G.Pricing.gs(2*(W+H)/100*(1+(P.wastePct||0)/100)*ppm)}</b></div>
    <div class="flex justify-between"><span>Por varillas completas (${r.rods} × ${G.Pricing.gs(rp)})</span><b>${G.Pricing.gs(r.rods*rp)}</b></div>
    <p class="text-[10px] mt-1" style="color:var(--muted)">Modo actual: <b>${P.rodMode==='rod'?'varillas completas':'metros lineales'}</b> (cambialo en ⚙ Precios). Este detalle es interno: la ficha del cliente muestra solo el precio final.</p></div>`);
}
/* ================= BARRA DE HERRAMIENTAS ================= */
function syncLightChips(){document.querySelectorAll('.lt-chip').forEach(c=>c.classList.toggle('on',c.dataset.l===getLight()));}
function syncChips(){const c=$('xCmp');if(c)c.textContent=`⇆ Comparar${CMP.length?' ('+CMP.length+')':''}`;const w=$('xWall'),n=G.Wall?G.Wall.count:0;if(w)w.textContent=`▦ Pared de galería${n?' ('+n+')':''}`;const nw=$('navWallN');if(nw)nw.textContent=n?n:'';}
function openLightMenu(){const m=sheet('ltSheet','Iluminación',`<p class="text-[11px]" style="color:var(--muted)">Afecta la vista del estudio, el ambiente, la pared de galería y la vista 3D. El vidrio brillante refleja la luz; el mate la difumina.</p><div class="grid grid-cols-2 gap-2">${Object.keys(LIGHTS).map(k=>`<button class="lt-chip chip py-3 justify-center" data-l="${k}">${LIGHTS[k].n}</button>`).join('')}</div>`);
  m.querySelectorAll('.lt-chip').forEach(b=>b.onclick=()=>setLight(b.dataset.l));syncLightChips();}
function init(){
  const host=document.querySelector('#totalPill').parentElement,lbl=host.querySelector('span');
  const bar=el(`<div id="xBar" class="xbar gap-1.5 flex-1 min-w-0 mr-2" style="display:flex;overflow-x:auto">
    <button id="xShare" class="chip py-1 text-[11px]" style="background:var(--gold);color:#1a140a;border-color:var(--gold)">↗ Compartir</button><button id="x3d" class="chip py-1 text-[11px]" style="border-color:var(--gold);color:var(--gold2)">◈ 3D</button><button id="xSug" class="chip py-1 text-[11px]">✨ Sugerir</button><button id="xCmp" class="chip py-1 text-[11px]">⇆ Comparar</button><button id="xCmpAdd" class="chip py-1 text-[11px]">＋</button>
    <button id="xWall" class="chip py-1 text-[11px]" style="border-color:var(--gold);color:var(--gold2)">▦ Pared de galería</button><button id="xLight" class="chip py-1 text-[11px]">☀ Luz</button><button id="xRod" class="chip py-1 text-[11px]">⟷ Varillas</button></div>`);
  if(lbl)lbl.replaceWith(bar);else host.prepend(bar);
  $('x3d').onclick=open3D;$('xSug').onclick=openSuggest;$('xCmp').onclick=openCompare;$('xCmpAdd').onclick=()=>addCompare();$('xWall').onclick=()=>G.Wall.open();$('xLight').onclick=openLightMenu;$('xRod').onclick=openRods;$('xShare').onclick=shareAll;
}
G.Extras={shareAll,proposalData,viewerPage,syncChips,init,applyLight,lightRoom,open3D,openSuggest,suggest,analyzeArt,openCompare,addCompare,buildClientHtml,shareClientLink,openWall,addToWall,compositePng,openRods,Viewer3D,viewerData,LIGHTS,setLight,GW,get CMP(){return CMP;}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
