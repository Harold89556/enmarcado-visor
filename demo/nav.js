/* Enmarcado Studio Pro v1.12 – Botón atrás de Android: cierra paso a paso; en la pantalla principal, doble atrás para salir */
(function(G){
const $=id=>document.getElementById(id);
const STATIC=['priceSettings','priceSheet','frameEditor','catalogSheet','dimensionModal','plaqueSheet'];
const vis=e=>e&&!e.classList.contains('hidden')&&e.offsetParent!==null||(e&&getComputedStyle(e).position==='fixed'&&!e.classList.contains('hidden')&&getComputedStyle(e).display!=='none');
function overlays(){return [...document.body.children].filter(e=>{if(e.tagName==='SCRIPT'||e.id==='arDiag'&&!e.isConnected)return false;const cs=getComputedStyle(e);return cs.position==='fixed'&&cs.display!=='none'&&!e.classList.contains('hidden')&&e.id!=='toast'&&e.offsetWidth>100&&e.offsetHeight>100&&!e.contains(document.getElementById('dock'));});}
function closeEl(e){
  if(e.id==='wallView'&&G.Wall&&G.Wall.S.calib){G.Wall.cancelCalib();return;}
  const b=e.querySelector('.xclose,[data-back],#arDiagClose,#psClose,#plClose,#feCancel,#catClose');
  if(e.id==='priceSettings'){e.classList.add('hidden');return;}
  if(e.id==='dimensionModal'){e.classList.add('hidden');return;}
  if(b){b.click();return;}
  if(STATIC.includes(e.id))e.classList.add('hidden');else e.remove();
}
let lastBack=0;
function back(){
  // 1) ventanas / hojas abiertas (la de más arriba primero)
  const ov=overlays();if(ov.length){const z=e=>parseInt(getComputedStyle(e).zIndex)||0;ov.sort((a,b)=>z(a)-z(b)||0);closeEl(ov[ov.length-1]);return true;}
  // 2) ocupado
  if($('busy')&&!$('busy').classList.contains('hidden'))return true;
  // 3) editor de esquinas
  if($('cropOverlay')&&!$('cropOverlay').classList.contains('hidden')){$('btnCancelCrop').click();return true;}
  const R=G.RoomMode&&G.RoomMode.R;
  if(R){if(R.measuring&&$('btnCancelMeasure')){$('btnCancelMeasure').click();return true;}
    if(R.persp&&R.persp.on){$('btnPerspCancel')?$('btnPerspCancel').click():G.RoomMode.perspCancel();return true;}
    if(G.state.mode==='room'){G.RoomMode.deactivate();return true;}}
  // 4) pestaña distinta de Molduras -> volver a Molduras
  const on=document.querySelector('.nav-tab.on');if(on&&on.dataset.tab!=='frames'){document.querySelector('.nav-tab[data-tab=frames]').click();return true;}
  return false;
}
function exit(){const now=Date.now();if(now-lastBack<2000){const A=G.Capacitor&&G.Capacitor.Plugins&&G.Capacitor.Plugins.App;if(A&&A.exitApp)A.exitApp();return;}lastBack=now;try{G.showToast('¿Salir? Tocá atrás otra vez','info');}catch(e){}}
function onBack(){if(!back())exit();}
function init(){
  const C=G.Capacitor,A=C&&C.Plugins&&C.Plugins.App;
  if(A&&A.addListener)A.addListener('backButton',onBack);
  else{ // navegador: usar historial
    history.replaceState({b:0},'');history.pushState({b:1},'');addEventListener('popstate',()=>{history.pushState({b:1},'');onBack();});}
  addEventListener('keydown',e=>{if(e.key==='Escape')onBack();});
  const nw=$('navWall');if(nw)nw.onclick=()=>G.Wall.open();
}
G.Nav={back:onBack,closeTop:back};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
