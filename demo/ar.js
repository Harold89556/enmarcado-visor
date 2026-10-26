/* Enmarcado Studio Pro v1.3 – Puente a la RA nativa (ARCore) + diagnóstico */
(function(G){
let lastJsError='';
function cap(){return G.Capacitor;}
function isNative(){const C=cap();return !!(C&&C.isNativePlatform&&C.isNativePlatform());}
function plugin(){
  const C=cap();if(!isNative())return null;
  if(C.Plugins&&C.Plugins.ArWall)return C.Plugins.ArWall;
  if(C.registerPlugin){try{return C.registerPlugin('ArWall');}catch(e){}}
  return null;
}
/* color del canto: promedio del borde exterior de la moldura (2 px), con respaldo al color base */
function edgeColor(x,w,h){
  try{let r=0,g=0,b=0,n=0;const acc=(d)=>{for(let i=0;i<d.length;i+=4){if(d[i+3]<128)continue;r+=d[i];g+=d[i+1];b+=d[i+2];n++;}};
    acc(x.getImageData(0,0,w,2).data);acc(x.getImageData(0,h-2,w,2).data);acc(x.getImageData(0,0,2,h).data);acc(x.getImageData(w-2,0,2,h).data);
    if(n>0)return '#'+[r,g,b].map(v=>Math.round(v/n).toString(16).padStart(2,'0')).join('');}catch(e){}
  return G.state.selectedFrame.base||'#6b4a2a';
}
function renderPng(){
  const st=G.state,img=st.rectifiedImage||st.rawImage;if(!img)return null;
  const {W,H}=G.totals(),s=Math.min(12,2048/Math.max(W,H));
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(W*s));c.height=Math.max(1,Math.round(H*s));
  const x=c.getContext('2d');G.drawFramedPiece(x,0,0,c.width,c.height,s,img);
  return {data:c.toDataURL('image/png').split(',')[1],widthCm:W,heightCm:H,depthCm:G.depthInfo().total,edgeColor:edgeColor(x,c.width,c.height)};
}
function err(msg){lastJsError=msg;try{G.showToast(msg,'warn');}catch(e){alert(msg);}}
async function open(){
  if(!isNative()){G.showToast('La realidad aumentada funciona en la app Android con ARCore','info');return;}
  const P=plugin();
  if(!P){err('No se encontró el módulo de RA en la app. Abre "Diagnóstico AR".');return;}
  const st=G.state;
  if(!(st.rectifiedImage||st.rawImage)){err('Primero carga la foto de la obra (botón Foto) para verla en RA');return;}
  try{
    const av=await P.checkAvailability();
    if(!av.supported){err(av.message||'Este teléfono no es compatible con ARCore');return;}
    G.setBusy(true,'Preparando el cuadro para la RA…');
    await new Promise(r=>setTimeout(r,30));
    let p;try{p=renderPng();}finally{G.setBusy(false);}
    if(!p){err('No se pudo preparar la imagen del cuadro');return;}
    await P.open({png:p.data,widthCm:p.widthCm,heightCm:p.heightCm,depthCm:p.depthCm,edgeColor:p.edgeColor,label:`${p.widthCm.toFixed(1)} × ${p.heightCm.toFixed(1)} × ${p.depthCm.toFixed(1)} cm · ${st.selectedFrame.name}`});
  }catch(e){G.setBusy(false);err('No se pudo abrir la RA: '+(e&&e.message||e));}
}
function esc(s){return String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
async function diagnose(){
  let d={};
  const P=plugin();
  if(!isNative())d={arcore:'(no es la app Android)'};
  else if(!P)d={arcore:'módulo ArWall no registrado'};
  else{try{d=await P.diagnose();}catch(e){d={arcore:'error: '+(e&&e.message||e)};}}
  let box=document.getElementById('arDiag');
  if(!box){box=document.createElement('div');box.id='arDiag';document.body.appendChild(box);}
  box.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px;padding-bottom:max(16px,env(safe-area-inset-bottom))';
  const row=(k,v)=>`<div style="margin:4px 0"><span style="color:#b9a77f">${k}:</span> <b>${esc(v)}</b></div>`;
  box.innerHTML=`<div style="background:#14120e;border:1px solid #c9a45c;border-radius:14px;max-width:520px;width:100%;max-height:85vh;overflow:auto;padding:16px;color:#efe7d6;font-size:13px;user-select:text;-webkit-user-select:text">
   <div style="font-size:16px;font-weight:700;color:#e6c987;margin-bottom:8px">Diagnóstico AR</div>
   ${row('Teléfono',d.device||'-')}${row('ARCore',d.arcore||'-')}${row('Servicios de Google Play para RA',d.arServices||'-')}
   ${row('Permiso de cámara',d.camera||'-')}${row('Último error',(d.lastError&&d.lastError!=='ninguno')?d.lastError:(lastJsError||'ninguno'))}
   <div style="margin-top:8px;color:#b9a77f">Registro:</div>
   <pre style="white-space:pre-wrap;font-size:11px;background:#0b0a08;padding:8px;border-radius:8px;max-height:35vh;overflow:auto">${esc(d.log||'(vacío)')}</pre>
   <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
    ${P?'<button id="arDiagShare" style="padding:8px 14px;border-radius:20px;border:1px solid #c9a45c;color:#e6c987">Compartir registro</button>':''}
    <button id="arDiagClose" style="padding:8px 14px;border-radius:20px;background:#d6b46a;color:#1a140a;font-weight:700">Cerrar</button></div></div>`;
  box.querySelector('#arDiagClose').onclick=()=>box.remove();
  const sh=box.querySelector('#arDiagShare');if(sh)sh.onclick=()=>P.shareLog().catch(e=>err(e&&e.message||String(e)));
}
G.ArBridge={open,renderPng,diagnose,edgeColor};
})(window);
