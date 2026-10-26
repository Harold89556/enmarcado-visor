/* configura el estudio en modo cliente (como el plugin) y simula el carrito */
(function(){
var fr=DEMO.frames().filter(function(f){return f.active;});
window.ENM_WP={ajax:'demo:add',nonce:'demo',prices:Object.assign(DEMO.prices(),{fichaItems:false}),frames:fr,cart:'cart.html'};
try{localStorage.removeItem('enm_prices_v1');}catch(e){}
var FIN={gold:'Dorado metal',silver:'Plateado metal',chromeGold:'Cromado dorado',chromeSilver:'Cromado plateado'};
function f1(v){return (Math.round(v*10)/10).toString().replace('.',',');}
function specs(){var s=state,t=totals(),dbl=s.glass==='double',fil=s.hasFilete?s.fileteWidthCm:0,f=s.selectedFrame,rod=Pricing.compute().items[0].rod;
  var o=[['Obra (luz)',f1(s.artWidthCm)+' × '+f1(s.artHeightCm)+' cm'],['Tipo de obra',s.artType==='paper'?'Papel / cartulina':'Óleo / acrílico con bastidor'],
   ['Moldura',f.name+(f.sku?' ('+f.sku+')':'')+' · '+f1(s.frameWidthCm)+' cm'],['Medida exterior',f1(t.W)+' × '+f1(t.H)+' cm'],
   ['Paspartú',dbl?'Sin paspartú (doble vidrio)':s.passWidthCm>0?f1(s.passWidthCm)+' cm · '+s.passColor:'Sin paspartú'],['Filete',fil>0?f1(fil)+' cm':'Sin filete'],
   ['Vidrio',s.glass==='none'?'Sin vidrio':(dbl?'Doble vidrio ':'Vidrio ')+(s.glassFinish==='mate'?'mate':'brillante')]];

  if(s.plaque&&s.plaque.on)o.push(['Epígrafe',FIN[s.plaque.finish]+' '+f1(s.plaque.w)+'×'+f1(s.plaque.h)+' cm · “'+(s.plaque.title||'')+'” '+[s.plaque.artist,s.plaque.year].filter(Boolean).join(' ')]);
  return o;}
var of=window.fetch;
window.fetch=function(u,opt){if(u!=='demo:add')return of.apply(this,arguments);
  var fd=opt.body,c=Pricing.compute(),item={id:Date.now(),specs:specs(),total:c.total,iva:c.ivaPct,preview:fd.get('preview'),name:'Enmarcado a medida · '+state.artWidthCm+'×'+state.artHeightCm+' cm',qty:1};
  var cart=DEMO.cart();cart.push(item);
  try{DEMO.set('demo_cart',cart);}catch(e){cart.splice(0,cart.length-1);try{DEMO.set('demo_cart',cart);}catch(e2){}}
  return Promise.resolve({json:function(){return Promise.resolve({success:true,data:{total:c.total,total_fmt:Pricing.gs(c.total),iva:c.ivaPct,cart_url:'cart.html',count:cart.length}});}});};
})();
addEventListener('load',function(){var bar=document.querySelector('#totalPill')&&document.querySelector('#totalPill').parentElement;if(!bar||document.getElementById('demoBadge'))return;
  var n=DEMO.cart().length,d=document.createElement('div');d.id='demoBadge';d.style.cssText='display:flex;gap:6px;align-items:center;flex-shrink:0;margin-right:8px';
  d.innerHTML='<span style="background:#c9a45c;color:#1a140a;font-size:10.5px;font-weight:800;padding:3px 9px;border-radius:20px;white-space:nowrap">DEMO</span><span style="color:#e6c987;font-size:11px;white-space:nowrap" class="gvname">Galería Viedma</span><a href="cart.html" style="color:#e6c987;font-size:12px;text-decoration:none;white-space:nowrap">🛒 '+n+'</a><a href="admin.html" style="color:#bdb39c;font-size:12px;text-decoration:none">Admin</a>';
  bar.insertBefore(d,bar.firstChild);});
