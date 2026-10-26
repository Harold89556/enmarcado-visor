/* Enmarcado Studio Pro – modo WooCommerce (solo se activa si existe window.ENM_WP) */
(function(G){
const W=G.ENM_WP;if(!W)return;
const css=document.createElement('style');css.textContent=`#btnAR,#btnARDiag,#btnMyFrames,#chipOnlyMine,#psSettings,#xShare,#xRod,#psShare,#psItems,#wlAR,#pzWeb{display:none!important}
 .enm-wp-cats .cat-pill:not([data-cat=all]){display:none!important}#enmCart{white-space:nowrap}.frame-card span.absolute{display:none!important}`;document.head.appendChild(css);
const loadImg=src=>new Promise(r=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;});
let uploaded=false;
function wrap(){const C=G.Catalog;if(!C||C._wp)return;C._wp=1;const init=C.init;
  C.init=async function(){try{await init.apply(this,arguments);}catch(e){console.warn(e);}
    if(!(W.frames&&W.frames.length))return;const list=[];
    for(const a of W.frames){const base=G.FRAMES.find(x=>x.id===a.base);
      const f=Object.assign({},base||{cat:'propio',base:'#8a6a3a',profile:'flat'},{id:'wp_'+a.id,name:a.name,sku:a.sku||'',price:+a.price||0,border:+a.width||5,rodCm:+a.rodCm||0,rodPrice:+a.rodPrice||0,
        depthCm:+a.depth||(base&&base.depthCm)||3,rebateCm:(base&&base.rebateCm)||1.6,custom:true,stock:true,hidden:false,style:[a.sku,a.width+' cm'].filter(Boolean).join(' · ')});
      if(a.texture){f.texImg=await loadImg(a.texture);}list.push(f);}
    G.FRAMES.splice(0,G.FRAMES.length,...list);document.body.classList.add('enm-wp-cats');
    try{G.selectFrame(G.FRAMES[0]);}catch(e){}};}
function cfg(){const s=G.state,p=s.plaque||{};return{frameId:s.selectedFrame.id,artW:+s.artWidthCm,artH:+s.artHeightCm,passW:+s.passWidthCm,passColor:s.passColor,hasFilete:!!s.hasFilete,fileteW:+s.fileteWidthCm,fileteColor:s.fileteColor,
  glass:s.glass,glassFinish:s.glassFinish,artType:s.artType,stretcherCm:+s.stretcherCm,frameStyle:s.frameStyle,plaque:{on:!!p.on,finish:p.finish,w:+p.w,h:+p.h,title:p.title||'',artist:p.artist||'',year:p.year||''},
  frameWidthCm:+s.frameWidthCm,clientTotal:G.Pricing.compute().total,frameName:s.selectedFrame.name};}
function jpeg(img,max,q){const k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',q||.85);}
function preview(){const{W:w,H:h}=G.totals(),s=900/Math.max(w,h),c=document.createElement('canvas');c.width=Math.round(w*s);c.height=Math.round(h*s);G.drawFramedPiece(c.getContext('2d'),0,0,c.width,c.height,s,G.state.rectifiedImage||G.state.rawImage);return jpeg(c,900,.85);}
async function addToCart(){
  const img=G.state.rectifiedImage||G.state.rawImage;if(!img)return G.showToast('Primero subí la foto de tu obra','warn');
  if(!uploaded&&!confirm('Estás usando la obra de ejemplo. ¿Agregar igual al carrito?'))return;
  G.setBusy(true,'Agregando al carrito…');
  try{const fd=new FormData();fd.append('action','enm_add_to_cart');fd.append('nonce',W.nonce);fd.append('cfg',JSON.stringify(cfg()));fd.append('preview',preview());fd.append('art',jpeg(img,2000,.88));
    const r=await fetch(W.ajax,{method:'POST',body:fd,credentials:'same-origin'});const j=await r.json();G.setBusy(false);
    if(!j.success)throw new Error(j.data&&j.data.message||'Error');
    showDone(j.data);}catch(e){G.setBusy(false);G.showToast('No se pudo agregar: '+e.message,'warn');}}
function showDone(d){let m=document.getElementById('enmDone');if(m)m.remove();m=document.createElement('div');m.id='enmDone';m.className='fixed inset-0 z-[70] flex items-center justify-center p-4';m.style.background='rgba(8,7,5,.85)';
  m.innerHTML=`<div class="p-5 rounded-2xl flex flex-col gap-3 w-full max-w-sm text-center" style="background:#17150f;border:1px solid rgba(201,164,92,.5)"><div class="serif text-[24px] font-semibold">¡Agregado al carrito!</div>
   <div class="text-[13px]" style="color:var(--muted)">Precio final (IVA ${d.iva}% incluido)</div><div class="serif text-[30px]" style="color:var(--gold2)">${d.total_fmt}</div>
   <a class="btn btn-gold justify-center py-2.5" href="${d.cart_url}" target="_top">Ver carrito y pagar</a><button class="btn btn-ghost justify-center py-2.5 xclose">Seguir diseñando</button></div>`;
  document.body.appendChild(m);m.querySelector('.xclose').onclick=()=>m.remove();}
function ui(){const pill=document.getElementById('totalPill');if(pill&&!document.getElementById('enmCart')){const b=document.createElement('button');b.id='enmCart';b.className='btn btn-gold py-1 px-3 ml-1.5 text-[12px]';b.textContent='🛒 Agregar';b.title='Agregar al carrito';b.onclick=addToCart;pill.after(b);}
  const lbl=pill&&pill.querySelector('span');if(lbl)lbl.textContent='IVA incl.';
  const n=document.getElementById('fixedWidthNote');if(n&&!n._wp){n._wp=1;const fx=()=>{if(/Mis marcos/.test(n.textContent))n.textContent=n.textContent.replace(/\s*editable en Mis marcos/,'');};new MutationObserver(fx).observe(n,{childList:true,characterData:true,subtree:true});fx();}
  const fi=document.getElementById('fileInput');if(fi)fi.addEventListener('change',()=>{uploaded=true;});
  const ps=document.getElementById('psPdf');if(ps&&!document.getElementById('enmCart2')){const b=document.createElement('button');b.id='enmCart2';b.className='btn btn-gold justify-center py-2.5';b.textContent='🛒 Agregar al carrito';b.onclick=addToCart;ps.parentElement.after(b);}}
wrap();addEventListener('DOMContentLoaded',()=>{wrap();ui();});addEventListener('load',()=>{ui();const o=G.Pricing&&G.Pricing.openSheet;if(o&&!G.Pricing._wpui){G.Pricing._wpui=1;G.Pricing.openSheet=function(){o.apply(this,arguments);ui();};}});
G.EnmWP={cfg,addToCart};
})(window);
