/* Enmarcado Studio Pro v4 – lógica de la app */
const FRAMES_CATALOG = [
  // ROCOCÓ / BARROCO – 12 modelos históricos, cada uno con talla distinta
  { id:"roc_pan_oro_acantos", name:"Luis XIII Acanto", style:"Acantos en voluta · oro al agua sobre bol rojo", cat:"rococo", orn:"acanthus", base:"#c99a32", border:8.0 },
  { id:"roc_volutas_antiguo", name:"Luis XV Rocalla", style:"Ces y eses con venera · oro viejo", cat:"rococo", orn:"rocaille", base:"#a8863a", border:9.0 },
  { id:"roc_cordon_perlas", name:"Perlas y Cinta", style:"Perla-carrete y cinta-junco · oro brillante", cat:"rococo", orn:"beadreel", base:"#d4ac3f", border:6.0 },
  { id:"roc_greca_florentina", name:"Florentino Laurel", style:"Toro de laurel, roble y bayas con cintas", cat:"rococo", orn:"florentine", base:"#b89536", border:10.0 },
  { id:"roc_plata_vieja_tallada", name:"Ovas y Dardos Plata", style:"Ovolo neoclásico · plata vieja", cat:"rococo", orn:"eggdart", base:"#b7b9bc", border:7.0 },
  { id:"roc_luis_xv_blanco_oro", name:"Luis XV Blanco y Oro", style:"Veneras y rosas doradas sobre laca marfil", cat:"rococo", orn:"whitegold", base:"#efe8d8", border:8.5 },
  { id:"roc_bronce_catedral", name:"Sansovino Veneciano", style:"Volutas, mascarones y festones · bronce", cat:"rococo", orn:"sansovino", base:"#5c4a30", border:11.0 },
  { id:"roc_ebano_oro_feston", name:"Holandés Ébano y Guirnalda", style:"Ondulado (ripple) y guirnalda de laurel dorada", cat:"rococo", orn:"ebony", base:"#151413", border:7.5 },
  { id:"roc_champagne_palacio", name:"Luis XVI Palacio", style:"Cinta enrollada en laurel y hojas de agua", cat:"rococo", orn:"louisxvi", base:"#c6a764", border:7.0 },
  { id:"roc_cobre_hojas", name:"Colonial Cusqueño", style:"Granadas y flores sobre fondo punzonado", cat:"rococo", orn:"colonial", base:"#9a5a32", border:9.5 },
  { id:"roc_marfil_tallado", name:"Luis XIV Bérain Marfil", style:"Lacería y girasoles calados · marfil", cat:"rococo", orn:"louisxiv", base:"#e6dcc6", border:8.0 },
  { id:"roc_gran_salon_relieve", name:"Gran Salón Gallones", style:"Gallones y palmetas en alto relieve", cat:"rococo", orn:"gadroon", base:"#c99a32", border:12.0 },
  // MADERAS – veta real + perfil
  { id:"mad_nogal_veteado", name:"Nogal Veteado", style:"Perfil cojín · aceite satinado", cat:"madera", mat:"wood", wood:"walnut", profile:"cushion", base:"#8a5a3a", border:4.5 },
  { id:"mad_roble_rustico", name:"Roble Rústico Decapé", style:"Perfil cima · roble cepillado", cat:"madera", mat:"wood", wood:"oak", profile:"ogee", base:"#c49a62", border:5.0, wash:.18 },
  { id:"mad_cedro_lustrado", name:"Cedro Lustrado", style:"Perfil cojín · goma laca", cat:"madera", mat:"wood", wood:"walnut", profile:"cushion", base:"#b0683a", border:4.5 },
  { id:"mad_caoba_virgen", name:"Caoba Lustre", style:"Perfil cima · laca brillante", cat:"madera", mat:"wood", wood:"walnut", profile:"ogee", base:"#8a3a26", border:5.0 },
  { id:"mad_pino_miel", name:"Pino Miel", style:"Perfil cóncavo", cat:"madera", mat:"wood", wood:"maple", profile:"scoop", base:"#d39a50", border:4.0 },
  { id:"mad_olivo_mediterraneo", name:"Olivo Mediterráneo", style:"Perfil plano redondeado", cat:"madera", mat:"wood", wood:"oak", profile:"flat", base:"#c8aa72", border:4.0, grain:1.4 },
  { id:"mad_cerezo_noble", name:"Cerezo Noble", style:"Perfil cojín", cat:"madera", mat:"wood", wood:"maple", profile:"cushion", base:"#a04a30", border:4.0 },
  { id:"mad_decape_blanco", name:"Blanco Decapé Provenzal", style:"Roble con veladura blanca", cat:"madera", mat:"wood", wood:"oak", profile:"ogee", base:"#cbb79a", border:5.0, wash:.65 },
  { id:"mad_decape_verde", name:"Verde Agua Shabby", style:"Veladura verde sobre roble", cat:"madera", mat:"wood", wood:"oak", profile:"scoop", base:"#9fb0a2", border:4.5, wash:.45, washColor:"#b9c9bf" },
  { id:"mad_nogal_filo_oro", name:"Nogal con Filo Oro", style:"Nogal y bocel interior dorado", cat:"madera", mat:"wood", wood:"walnut", profile:"goldlip", accent:"gold", base:"#6b4428", border:5.5 },
  // LISOS
  { id:"liso_negro_satin", name:"Negro Satinado Galería", cat:"liso", mat:"paint", profile:"flat", base:"#1a1a1a", border:3.5 },
  { id:"liso_negro_slim", name:"Negro Slim 1.8 cm", cat:"liso", mat:"lacquer", profile:"slim", base:"#121212", border:1.8 },
  { id:"liso_blanco_mate", name:"Blanco Mate Puro", cat:"liso", mat:"paint", profile:"flat", base:"#f3f1ec", border:3.5 },
  { id:"liso_blanco_slim", name:"Blanco Galería Slim", cat:"liso", mat:"paint", profile:"slim", base:"#ecebe6", border:1.8 },
  { id:"liso_haya_nordica", name:"Haya Escandinava", cat:"liso", mat:"wood", wood:"maple", profile:"flat", base:"#e2c9a4", border:3.5 },
  { id:"liso_roble_claro", name:"Roble Claro Plano", cat:"liso", mat:"wood", wood:"oak", profile:"flat", base:"#d0ad7c", border:3.5 },
  { id:"liso_wengue_lineal", name:"Wengué Minimalista", cat:"liso", mat:"wood", wood:"walnut", profile:"flat", base:"#4a3428", border:3.5, grain:1.3 },
  { id:"liso_gris_plomo", name:"Gris Plomo Anodizado", cat:"liso", mat:"metal", profile:"slim", base:"#5a5e66", border:3.0 },
  { id:"liso_antracita_ancho", name:"Antracita Ancho 5 cm", cat:"liso", mat:"paint", profile:"step", base:"#2b2d32", border:5.0 },
  { id:"liso_grafito_mate", name:"Grafito Mate Museo", cat:"liso", mat:"paint", profile:"flat", base:"#25272b", border:3.0 },
  // METÁLICOS
  { id:"met_oro_viejo", name:"Oro Viejo Cepillado", cat:"metal", mat:"gold", brushed:true, profile:"cushion", base:"#c89b3c", border:3.2 },
  { id:"met_oro_pulido", name:"Oro Pulido Espejo", cat:"metal", mat:"gold", rough:.15, profile:"cushion", base:"#e7bd4c", border:3.5 },
  { id:"met_plata_pulida", name:"Plata Pulida Espejo", cat:"metal", mat:"silver", rough:.15, profile:"cushion", base:"#d9dde2", border:2.8 },
  { id:"met_plata_vieja_satin", name:"Plata Vieja Satinada", cat:"metal", mat:"metal", profile:"scoop", base:"#a5a8ad", border:3.2 },
  { id:"met_titanio_oscuro", name:"Titanio Gunmetal", cat:"metal", mat:"metal", profile:"step", base:"#4a4c52", border:3.0 },
  { id:"met_cobre_envejecido", name:"Cobre Envejecido", cat:"metal", mat:"metal", profile:"cushion", base:"#b0623e", border:3.0 },
  { id:"met_laton_cepillado", name:"Latón Cepillado", cat:"metal", mat:"metal", profile:"slim", base:"#c4a14e", border:3.2 },
  { id:"met_bronce_florentino", name:"Bronce Florentino", cat:"metal", mat:"metal", profile:"ogee", base:"#8a6a40", border:3.5 },
  { id:"met_oro_rosa", name:"Oro Rosado Francés", cat:"metal", mat:"gold", rough:.2, profile:"cushion", base:"#e0a08a", border:3.0 },
  { id:"met_aluminio_plata", name:"Aluminio Plata Slim", cat:"metal", mat:"metal", profile:"slim", base:"#d2d6da", border:2.0 },
  // CAJÓN 3D
  { id:"cajon_negro_4cm", name:"Cajón Negro 4 cm", cat:"cajon", mat:"paint", profile:"box", base:"#171717", border:4.0 },
  { id:"cajon_blanco_5cm", name:"Cajón Blanco Flotante 5 cm", cat:"cajon", mat:"paint", profile:"box", base:"#f2f1ed", border:5.0 },
  { id:"cajon_roble_flotante", name:"Cajón Roble Natural", cat:"cajon", mat:"wood", wood:"oak", profile:"box", base:"#cfa56c", border:4.0 },
  { id:"cajon_nogal_lujo", name:"Cajón Nogal de Lujo", cat:"cajon", mat:"wood", wood:"walnut", profile:"box", base:"#7a4e30", border:4.5 },
  { id:"cajon_filo_oro", name:"Cajón Negro Filo Oro", cat:"cajon", mat:"paint", profile:"boxlip", accent:"gold", base:"#1a1a1a", border:4.0 },
  { id:"cajon_oro_mate_3d", name:"Cajón Oro Mate", cat:"cajon", mat:"gold", brushed:true, profile:"box", base:"#c9a13e", border:3.5 },
  { id:"cajon_antracita_loft", name:"Cajón Antracita Loft", cat:"cajon", mat:"paint", profile:"box", base:"#2f3237", border:4.0 },
  { id:"cajon_wengue_bastidor", name:"Cajón Wengué", cat:"cajon", mat:"wood", wood:"walnut", profile:"box", base:"#4a3428", border:4.5 },
  { id:"cajon_cedro_box", name:"Cajón Cedro", cat:"cajon", mat:"wood", wood:"walnut", profile:"box", base:"#b0683a", border:4.0 },
  { id:"cajon_plata_cepillada", name:"Cajón Plata Cepillada", cat:"cajon", mat:"metal", profile:"box", base:"#bfc4ca", border:3.8 }
];
/* Profundidad (alto del perfil) y galce/rebaje por moldura, en cm — valores típicos de catálogo */
const MOULDING_DEPTH={
  roc_pan_oro_acantos:[5.5,2.2],roc_volutas_antiguo:[6.0,2.3],roc_cordon_perlas:[4.5,2.0],roc_greca_florentina:[6.5,2.5],roc_plata_vieja_tallada:[5.0,2.0],
  roc_luis_xv_blanco_oro:[5.8,2.2],roc_bronce_catedral:[7.0,2.6],roc_ebano_oro_feston:[5.2,2.0],roc_champagne_palacio:[5.0,2.0],roc_cobre_hojas:[6.2,2.4],
  roc_marfil_tallado:[5.5,2.2],roc_gran_salon_relieve:[7.5,2.8],
  liso_negro_slim:[2.4,1.2],liso_blanco_slim:[2.4,1.2],liso_gris_plomo:[2.5,1.5],liso_antracita_ancho:[3.5,2.0],
  met_aluminio_plata:[2.4,1.5],met_laton_cepillado:[2.6,1.5],met_plata_pulida:[2.8,1.6],
  cajon_negro_4cm:[5.0,4.2],cajon_blanco_5cm:[5.5,4.5],cajon_roble_flotante:[5.0,4.2],cajon_nogal_lujo:[5.5,4.5],cajon_filo_oro:[5.0,4.2],
  cajon_oro_mate_3d:[4.5,3.8],cajon_antracita_loft:[5.0,4.2],cajon_wengue_bastidor:[5.5,4.5],cajon_cedro_box:[5.0,4.2],cajon_plata_cepillada:[4.8,4.0]};
const DEPTH_DEFAULT={rococo:[5.5,2.2],madera:[3.2,1.8],liso:[3.0,1.8],metal:[3.0,1.6],cajon:[5.0,4.2]};
FRAMES_CATALOG.forEach(f=>{const d=MOULDING_DEPTH[f.id]||DEPTH_DEFAULT[f.cat]||[3,1.6];if(f.depthCm==null)f.depthCm=d[0];if(f.rebateCm==null)f.rebateCm=d[1];});
const PASSEPARTOUT_TONES = [
  ["Blanco Nieve Puro","#ffffff"],["Blanco Roto / Lino","#f3efe6"],["Hueso Antiguo","#f6f2e8"],["Crema Museo","#eee4ce"],["Marfil Cálido","#f5e8c8"],
  ["Arena Toscana","#ded2b8"],["Gris Seda Perla","#e0e1de"],["Gris Niebla","#cbcccb"],["Gris Ceniza","#a8aaad"],["Gris Plomo Museo","#63666b"],
  ["Carbón Suave","#35363a"],["Terciopelo Negro","#111113"],["Verde Inglés Museo","#1c2e24"],["Verde Salvia Botánico","#7a8a79"],["Verde Oliva Seco","#5b614d"],
  ["Azul Prusia Oscuro","#162536"],["Azul Petróleo Profundo","#1b353d"],["Azul Francés Pastel","#889eb3"],["Terracota Cálido","#8a4635"],["Borgoña / Burdeos","#471821"],
  ["Ocre Colonial","#a37a34"],["Marrón Tabaco","#3d2c22"],["Rosa Palo Empolvado","#d6b5ad"],["Trigo Dorado","#d1ba8c"],["Papiro Egipcio","#ded4be"]
].map(([name,hex])=>({name,hex}));

const state = {
  rawImage:null, rectifiedImage:null, corners:[], k1:0, lastDetection:null,
  isCropMode:false, pendingDetect:false,
  selectedFrame:FRAMES_CATALOG[0], frameStyle:"classic",
  artWidthCm:60, artHeightCm:90, frameWidthCm:8.0, passWidthCm:5.0, passColor:"#f3efe6", stretcherCm:2.5,
  hasFilete:true, fileteColor:"gold_antique", fileteWidthCm:0.8,
  brightness:100, contrast:100, shadowBlur:25, wallColor:"#eae8e3", wallImage:null,
  glass:"none", glassMarginCm:5, artType:"canvas", glassFinish:"brillo", clientName:"",
  plaque:{on:false,title:"Título de la obra",artist:"Artista",year:"",w:12,h:3,finish:"gold",pos:"center",vy:.5}
};
try{const pj=JSON.parse(localStorage.getItem('enm_project')||'{}');['glass','glassMarginCm','artType','stretcherCm','glassFinish','plaque'].forEach(k=>{if(pj[k]!=null)state[k]=pj[k];});}catch(e){}
function saveProject(){try{localStorage.setItem('enm_project',JSON.stringify({glassFinish:state.glassFinish,plaque:state.plaque,glass:state.glass,glassMarginCm:state.glassMarginCm,artType:state.artType,stretcherCm:state.stretcherCm}));}catch(e){}}
window.FRAMES=FRAMES_CATALOG;
window.state=state; state.mode='studio';
const $ = id => document.getElementById(id);
const viewCanvas=$('viewCanvas'), viewCtx=viewCanvas.getContext('2d');
const cropOverlay=$('cropOverlay'), cropCanvas=$('cropCanvas'), cropCtx=cropCanvas.getContext('2d');
const touchLoupe=$('touchLoupe'), loupeCanvas=$('loupeCanvas'), loupeCtx=loupeCanvas.getContext('2d');

/* ---------- ANDROID: zona segura inferior ---------- */
function updateSafeArea(){
  const root=document.documentElement;
  const vv=window.visualViewport;
  const h = vv ? vv.height : window.innerHeight;
  root.style.setProperty('--app-h', h+'px');
  const envInset = $('sabProbe').getBoundingClientRect().height;
  const isAndroid=/Android/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || document.referrer.startsWith('android-app://');
  let fallback=0;
  if(envInset<1 && isAndroid && !window.Capacitor){
    // Si la ventana ocupa (casi) toda la pantalla física, la barra de navegación se superpone
    const sh = screen.height, ih = window.innerHeight;
    if (standalone || ih >= sh - 4) fallback = 48;
    else if (sh - ih > 0 && sh - ih < 30) fallback = 48 - (sh - ih);
  }
  root.style.setProperty('--nav-fallback', Math.max(0,fallback)+'px');
}

function initApp(){
  updateSafeArea();
  (window.visualViewport||window).addEventListener('resize',()=>{updateSafeArea(); onResize();});
  window.addEventListener('orientationchange',()=>setTimeout(()=>{updateSafeArea();onResize();},300));

  const tabs=document.querySelectorAll('.nav-tab');
  tabs.forEach(tab=>tab.onclick=()=>{
    tabs.forEach(t=>t.classList.remove('on'));tab.classList.add('on');
    ['frames','passepartout','crop','rooms','adjust','sheet'].forEach(id=>{const el=$(`tabContent-${id}`);el.classList.toggle('hidden',id!==tab.dataset.tab);if(id===tab.dataset.tab){el.classList.remove('fade-in');void el.offsetWidth;el.classList.add('fade-in');}});
    if(tab.dataset.tab==='rooms'&&!RoomMode.R.img) RoomMode.openSample('living_modern');
  });

  setupDimensionModal();
  document.querySelectorAll('.cat-pill').forEach(p=>p.onclick=()=>{
    document.querySelectorAll('.cat-pill').forEach(q=>q.classList.remove('on'));p.classList.add('on');
    currentCat=p.dataset.cat;renderFramesCarousel(p.dataset.cat);
  });
  $('btnModeClassic').onclick=()=>setFrameStyle('classic');
  $('btnModeBox').onclick=()=>setFrameStyle('box');
  $('rngFrameW').oninput=e=>{if(state.selectedFrame&&state.selectedFrame.custom){syncWidthLock();showToast('Ancho fijo: edítalo en Mis marcos','lock');return;}state.frameWidthCm=parseFloat(e.target.value);$('lblFrameW').textContent=`${state.frameWidthCm.toFixed(1)} cm`;updateTotalsText();renderFullView();};

  renderPassepartoutPalette();
  $('rngPassW').oninput=e=>{state.passWidthCm=parseFloat(e.target.value);$('lblPassW').textContent=`${state.passWidthCm.toFixed(1)} cm`;updateTotalsText();renderFullView();};
  $('btnPassZero').onclick=()=>{state.passWidthCm=0;$('rngPassW').value=0;$('lblPassW').textContent='0.0 cm';updateTotalsText();renderFullView();};
  $('passCustomColor').oninput=e=>{state.passColor=e.target.value;renderFullView();};
  $('chkFilete').onchange=e=>{state.hasFilete=e.target.checked;$('fileteControls').style.opacity=state.hasFilete?'1':'0.4';updateTotalsText();renderFullView();};
  $('selFileteColor').onchange=e=>{state.fileteColor=e.target.value;renderFullView();};
  $('rngFileteW').oninput=e=>{state.fileteWidthCm=parseFloat(e.target.value);$('lblFileteW').textContent=`${state.fileteWidthCm.toFixed(1)}cm`;renderFullView();};

  $('btnRunScannerAuto').onclick=()=>{ if(!state.rawImage) return showToast('Carga una foto primero','⚠️'); runAutoDetection(true); };
  $('btnOpenManualCorners').onclick=openManualCornerCalibrator;
  $('btnAutoReDetect').onclick=()=>runAutoDetection(true);
  $('btnApplyCrop').onclick=applyCropWarp;
  $('btnCancelCrop').onclick=()=>{state.isCropMode=false;cropOverlay.classList.add('hidden');renderFullView();};
  $('btnRotate90').onclick=rotateImage90;
  $('btnReopenDimensionModal').onclick=()=>openDimensionModal(false);

  setupAdjustSliders();
  document.querySelectorAll('.wall-btn').forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll('.wall-btn').forEach(b=>b.classList.remove('ring-2','ring-[#c9a45c]'));
    btn.classList.add('ring-2','ring-[#c9a45c]');state.wallColor=btn.dataset.wall;state.wallImage=null;renderFullView();
  });
  $('btnWallUpload').onclick=()=>$('wallFileInput').click();
  $('wallFileInput').onchange=e=>{const f=e.target.files[0];if(!f)return;loadImageFile(f).then(img=>{state.wallImage=img;renderFullView();showToast('Pared personalizada cargada','🏡');});};

  const onDim=()=>{state.artWidthCm=Math.max(1,parseFloat($('inArtW').value)||60);state.artHeightCm=Math.max(1,parseFloat($('inArtH').value)||90);updateTotalsText();rewarpIfPossible();};
  $('inArtW').onchange=onDim; $('inArtH').onchange=onDim;

  $('btnExportTop').onclick=()=>Pricing.openSheet();$('btnDownloadWorksheet').onclick=()=>Pricing.exportFicha('pdf');$('totalPill').onclick=()=>Pricing.openSheet();setupPlaqueUI();$('btnDownloadImageOnly').onclick=exportFramedArtOnly;
  $('btnUpload').onclick=()=>$('fileInput').click();
  $('fileInput').onchange=e=>{const f=e.target.files[0];if(f)handleUploadedFile(f);e.target.value='';};
  $('btnDemo').onclick=loadDemoCascadePainting;
  setupScannerTouchEvents();
  setupRooms();
  $('btnAR').onclick=()=>ArBridge.open();
  $('btnARDiag').onclick=()=>ArBridge.diagnose();
  { let lp; $('btnAR').addEventListener('touchstart',()=>{lp=setTimeout(()=>ArBridge.diagnose(),900);}); ['touchend','touchmove','touchcancel'].forEach(e=>$('btnAR').addEventListener(e,()=>clearTimeout(lp))); }
  setBusy(true,'Preparando molduras…');
  setupGlassUI();setupKeyboard();
  $('btnMyFrames').onclick=()=>Catalog.openSheet();
  FrameRenderer.preload().then(()=>Catalog.init()).catch(e=>console.warn(e)).then(()=>{setBusy(false);refreshFrames();syncWidthLock();loadDemoCascadePainting();});
}

function setFrameStyle(s){
  state.frameStyle=s;
  $('btnModeBox').classList.toggle('on',s==='box');$('btnModeClassic').classList.toggle('on',s==='classic');
  renderFullView();
}
function depthInfo(){const fr=state.selectedFrame,md=fr.depthCm||3,rb=fr.rebateCm||1.6,st=state.stretcherCm||0,out=Math.max(0,st+0.3-rb);
  return{moulding:md,rebate:rb,stretcher:st,protrude:out,total:Math.round((md+out)*10)/10};}
window.depthInfo=depthInfo;
function totals(){const f=state.hasFilete?state.fileteWidthCm:0;return{D:depthInfo().total,W:state.artWidthCm+2*(state.passWidthCm+state.frameWidthCm+f),H:state.artHeightCm+2*(state.passWidthCm+state.frameWidthCm+f)};}
function updateTotalsText(){
  try{Pricing.update();}catch(e){}
  const {W,H}=totals();
  $('topSizeIndicator').textContent=`Luz: ${state.artWidthCm} x ${state.artHeightCm} cm | Ext: ${W.toFixed(1)} x ${H.toFixed(1)} cm`;
  $('txtSheetTotal').textContent=`${W.toFixed(1)} x ${H.toFixed(1)}`;
  $('lblAspectTarget').textContent=`${state.artWidthCm} x ${state.artHeightCm} cm`;
  const di=depthInfo();if($('txtSheetDepth'))$('txtSheetDepth').textContent=di.total.toFixed(1);
  if($('txtDepthDetail'))$('txtDepthDetail').textContent=`Moldura ${di.moulding} cm (galce ${di.rebate} cm) · bastidor ${di.stretcher} cm${di.protrude>0?` · sobresale ${di.protrude.toFixed(1)} cm atrás`:''}`;
  syncStretcherUI();
}
const STRETCHER_PRESETS=[1.8,2.5,3.5,4.5];
function syncStretcherUI(){const v=state.stretcherCm;
  document.querySelectorAll('.st-preset').forEach(b=>b.classList.toggle('on',parseFloat(b.dataset.d)===v));
  ['inStretcher','modalStretcher'].forEach(id=>{const e=$(id);if(e&&document.activeElement!==e)e.value=v;});}
function setStretcher(v){v=parseFloat(v);if(!(v>=0.5&&v<=20))return;state.stretcherCm=Math.round(v*10)/10;updateTotalsText();renderFullView();}
const ICONMAP={'⚠️':'warn','🎯':'target','📐':'corners','🖼️':'frame','💾':'download','🔄':'rotate','✨':'spark','🏡':'room'};
let toastT; function showToast(msg,icon='check'){const t=$('toast');$('toastIcon').setAttribute('href','#i-'+(ICONMAP[icon]||icon));$('toastMsg').textContent=msg;t.classList.remove('opacity-0');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.add('opacity-0'),2600);}
function setBusy(on,msg){$('busy').classList.toggle('hidden',!on);if(msg)$('busyMsg').textContent=msg;}

/* ---------- PASO 1: MEDIDAS (antes de detectar) ---------- */
function openDimensionModal(detectAfter){
  state.pendingDetect=detectAfter;
  $('modalInputW').value=state.artWidthCm;$('modalInputH').value=state.artHeightCm;$('modalStretcher').value=state.stretcherCm;syncStretcherUI();
  highlightPreset();
  $('btnConfirmDimensions').textContent = detectAfter ? 'Detectar obra' : 'Aplicar medidas';
  setModalArtType(state.artType,state.glass);
  $('dimensionModal').classList.remove('hidden');
}
function highlightPreset(){
  const w=$('modalInputW').value,h=$('modalInputH').value;
  document.querySelectorAll('.preset-btn').forEach(b=>{const on=b.dataset.w==w&&b.dataset.h==h;
    b.classList.toggle('on',on);});
}
function setupDimensionModal(){
  document.querySelectorAll('.preset-btn').forEach(b=>b.onclick=()=>{$('modalInputW').value=b.dataset.w;$('modalInputH').value=b.dataset.h;highlightPreset();});
  document.querySelectorAll('.st-preset').forEach(b=>b.onclick=()=>{const v=b.dataset.d;if(v==='custom'){const t=b.closest('[data-stgroup]').querySelector('input');t.focus();t.select&&t.select();return;}
    if(b.closest('#dimensionModal')){$('modalStretcher').value=v;document.querySelectorAll('#dimensionModal .st-preset').forEach(x=>x.classList.toggle('on',x===b));}else setStretcher(v);});
  $('modalStretcher').oninput=()=>{const v=parseFloat($('modalStretcher').value);document.querySelectorAll('#dimensionModal .st-preset').forEach(x=>x.classList.toggle('on',x.dataset.d==='custom'?!STRETCHER_PRESETS.includes(v):parseFloat(x.dataset.d)===v));};
  $('inStretcher').onchange=$('inStretcher').oninput=()=>setStretcher($('inStretcher').value);
  $('modalInputW').oninput=highlightPreset;$('modalInputH').oninput=highlightPreset;
  $('btnCancelDimensions').onclick=()=>{$('dimensionModal').classList.add('hidden');if(state.pendingDetect){state.pendingDetect=false;openManualCornerCalibrator();}};
  $('btnConfirmDimensions').onclick=()=>{
    const w=parseFloat($('modalInputW').value),h=parseFloat($('modalInputH').value);
    if(!(w>0&&h>0)) return showToast('Introduce ancho y alto válidos','⚠️');
    const at=document.querySelector('#dimensionModal .at-btn.on');state.artType=at?at.dataset.t:'canvas';
    const gl=document.querySelector('#dimensionModal .gl-btn.on');
    if(state.artType==='paper'){const g=gl?gl.dataset.g:'glass';if(g==='none')return showToast('Papel/cartulina requiere vidrio','⚠️');state.stretcherCm=0.3;setGlass(g);}
    else{const sd=parseFloat($('modalStretcher').value);if(!(sd>=0.5&&sd<=20))return showToast('Grosor del bastidor entre 0,5 y 20 cm','⚠️');state.stretcherCm=Math.round(sd*10)/10;setGlass(gl?gl.dataset.g:'none');}
    saveProject();
    state.artWidthCm=w;state.artHeightCm=h;$('inArtW').value=w;$('inArtH').value=h;
    $('dimensionModal').classList.add('hidden');updateTotalsText();
    if(state.pendingDetect){state.pendingDetect=false;runAutoDetection(true);} else rewarpIfPossible();
  };
}

function loadImageFile(file){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file);const img=new Image();
    img.onload=async()=>{
      // Limitar resolución (memoria en móviles) y aplicar orientación EXIF (createImageBitmap la respeta)
      let src=img;
      try{ if(window.createImageBitmap) src=await createImageBitmap(file,{imageOrientation:'from-image'}); }catch(e){}
      const w=src.width,h=src.height,s=Math.min(1,3000/Math.max(w,h));
      const c=document.createElement('canvas');c.width=Math.round(w*s);c.height=Math.round(h*s);
      c.getContext('2d').drawImage(src,0,0,c.width,c.height);URL.revokeObjectURL(url);res(c);
    };
    img.onerror=rej;img.src=url;
  });
}
function handleUploadedFile(file){
  loadImageFile(file).then(img=>{
    state.rawImage=img;state.rectifiedImage=null;state.corners=[];state.k1=0;
    openDimensionModal(true); // SIEMPRE preguntar medidas antes de detectar
  }).catch(()=>showToast('No se pudo leer la imagen','⚠️'));
}

function setDefaultProportionalCorners(){
  const iw=state.rawImage.width,ih=state.rawImage.height,ta=state.artWidthCm/state.artHeightCm;
  let w=0.75*iw,h=w/ta; if(h>0.85*ih){h=0.85*ih;w=h*ta;}
  const nx=w/iw/2,ny=h/ih/2;
  state.corners=[{x:.5-nx,y:.5-ny},{x:.5+nx,y:.5-ny},{x:.5+nx,y:.5+ny},{x:.5-nx,y:.5+ny}];state.k1=0;
}

/* ---------- PASO 2: DETECCIÓN AUTOMÁTICA ---------- */
function runAutoDetection(openEditor){
  if(!state.rawImage) return;
  setBusy(true,'Detectando bordes y perspectiva…');
  setTimeout(()=>{
    let r=null;
    try{ r=FrameDetector.detectArtwork(state.rawImage,state.artWidthCm/state.artHeightCm); }catch(e){console.error(e);}
    setBusy(false);
    state.lastDetection=r;
    if(r&&r.confidence>0.15){
      state.corners=r.corners;state.k1=r.k1||0;
      const lens=Math.abs(state.k1)>0?` · lente ${state.k1>0?'cojín':'barril'} ${state.k1.toFixed(3)}`:'';
      $('lblDetectInfo').textContent=`confianza ${(r.confidence*100|0)}% · proporción medida ${r.physAspect.toFixed(2)}${lens}`;
      showToast(`Obra detectada (${(r.confidence*100|0)}%) – revisa las esquinas`,'🎯');
    }else{
      setDefaultProportionalCorners();
      $('lblDetectInfo').textContent='no detectada – ajuste manual';
      showToast('No se encontró un borde claro: ajusta las esquinas','📐');
    }
    if(openEditor) openManualCornerCalibrator(); else drawScannerGuides();
  },30);
}

/* ---------- PASO 3: EDITOR DE ESQUINAS (object-contain) ---------- */
let draggingCorner=-1,dragOffset={x:0,y:0};
function imageRect(){ // rectángulo donde se dibuja la foto dentro del overlay (sin estirar)
  const W=cropOverlay.clientWidth,H=cropOverlay.clientHeight,pad=14,top=44,bottom=64;
  const iw=state.rawImage.width,ih=state.rawImage.height;
  const aw=W-2*pad,ah=H-top-bottom,s=Math.min(aw/iw,ah/ih);
  const w=iw*s,h=ih*s;return{x:(W-w)/2,y:top+(ah-h)/2,w,h,s};
}
function openManualCornerCalibrator(){
  if(!state.rawImage) return showToast('Carga una imagen primero','⚠️');
  state.isCropMode=true;cropOverlay.classList.remove('hidden');
  if(!state.corners||state.corners.length!==4) setDefaultProportionalCorners();
  drawScannerGuides();
}
function applyCropWarp(){
  if(!state.rawImage) return;
  state.isCropMode=false;cropOverlay.classList.add('hidden');
  state.corners=FrameDetector.orderCorners(state.corners.map(p=>({...p}))); // siempre TL,TR,BR,BL
  warpImageByHomography();
}
function rewarpIfPossible(){ if(state.rawImage&&state.corners.length===4&&state.rectifiedImage) warpImageByHomography(); else renderFullView(); }

function setupScannerTouchEvents(){
  const c=cropCanvas;
  const pt=e=>{const t=e.touches?e.touches[0]:e,r=c.getBoundingClientRect();return{x:t.clientX-r.left,y:t.clientY-r.top,clientX:t.clientX,clientY:t.clientY};};
  const toScreen=p=>{const R=imageRect();return{x:R.x+p.x*R.w,y:R.y+p.y*R.h};};
  function down(e){
    if(!state.isCropMode) return;const p=pt(e);let best=-1,md=56;
    state.corners.forEach((cn,i)=>{const s=toScreen(cn),d=Math.hypot(s.x-p.x,s.y-p.y);if(d<md){md=d;best=i;}});
    if(best>=0){e.preventDefault();draggingCorner=best;const s=toScreen(state.corners[best]);dragOffset={x:s.x-p.x,y:s.y-p.y};move(e);}
  }
  function move(e){
    if(draggingCorner<0) return;e.preventDefault();
    const p=pt(e),R=imageRect();
    const nx=Math.max(0,Math.min(1,(p.x+dragOffset.x-R.x)/R.w)),ny=Math.max(0,Math.min(1,(p.y+dragOffset.y-R.y)/R.h));
    state.corners[draggingCorner]={x:nx,y:ny};
    updateLoupe(p,nx,ny);drawScannerGuides();
  }
  function up(){if(draggingCorner<0)return;draggingCorner=-1;touchLoupe.classList.add('hidden');drawScannerGuides();}
  c.addEventListener('mousedown',down);window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);
  c.addEventListener('touchstart',down,{passive:false});window.addEventListener('touchmove',move,{passive:false});
  window.addEventListener('touchend',up);window.addEventListener('touchcancel',up);
}
function updateLoupe(p,nx,ny){
  touchLoupe.classList.remove('hidden');
  const vr=$('viewportContainer').getBoundingClientRect(),cr=cropCanvas.getBoundingClientRect();
  const lx=cr.left-vr.left+p.x-64; let ly=cr.top-vr.top+p.y-150; if(ly<8) ly=cr.top-vr.top+p.y+40;
  touchLoupe.style.left=`${Math.max(8,Math.min(vr.width-136,lx))}px`;touchLoupe.style.top=`${ly}px`;
  const img=state.rawImage,cx=nx*img.width,cy=ny*img.height,R=imageRect(),half=Math.max(10,24/(R.s*2.5));
  loupeCtx.fillStyle='#000';loupeCtx.fillRect(0,0,128,128);loupeCtx.imageSmoothingQuality='high';
  loupeCtx.drawImage(img,cx-half,cy-half,half*2,half*2,0,0,128,128);
}
function drawScannerGuides(){
  if(!state.isCropMode||!state.rawImage) return;
  const dpr=Math.min(2,window.devicePixelRatio||1),W=cropOverlay.clientWidth,H=cropOverlay.clientHeight;
  cropCanvas.width=W*dpr;cropCanvas.height=H*dpr;const ctx=cropCtx;ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,H);const R=imageRect();
  ctx.drawImage(state.rawImage,R.x,R.y,R.w,R.h);
  const pts=state.corners.map(c=>({x:R.x+c.x*R.w,y:R.y+c.y*R.h}));
  ctx.save();ctx.beginPath();ctx.rect(R.x,R.y,R.w,R.h);ctx.moveTo(pts[0].x,pts[0].y);for(let i=3;i>=1;i--)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fill('evenodd');ctx.restore();
  ctx.save();ctx.strokeStyle='#eab308';ctx.lineWidth=2;ctx.shadowColor='#000';ctx.shadowBlur=5;
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<4;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();ctx.stroke();ctx.restore();
  const lbl=['TL','TR','BR','BL'];
  pts.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x,p.y,14,0,Math.PI*2);ctx.fillStyle=i===draggingCorner?'rgba(254,240,138,.55)':'rgba(34,197,94,.45)';ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
    ctx.font='bold 9px sans-serif';ctx.fillStyle='#fde047';ctx.fillText(lbl[i],p.x+16,p.y-12);});
}

/* ---------- PASO 4: HOMOGRAFÍA 3x3 REAL ---------- */
function warpImageByHomography(){
  const img=state.rawImage,iw=img.width,ih=img.height;
  const P=state.corners.map(c=>({x:c.x*iw,y:c.y*ih}));
  const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const aspect=state.artWidthCm/state.artHeightCm;
  // resolución: la del lado más largo detectado (limitada para móviles), proporción EXACTA en cm
  const maxEdge=Math.min(2000,Math.max(600,d(P[0],P[1]),d(P[3],P[2]),d(P[0],P[3]),d(P[1],P[2])));
  let outW,outH; if(aspect>=1){outW=Math.round(maxEdge);outH=Math.round(maxEdge/aspect);}else{outH=Math.round(maxEdge);outW=Math.round(maxEdge*aspect);}
  setBusy(true,'Enderezando con homografía…');
  setTimeout(()=>{
    try{ state.rectifiedImage=FrameDetector.warpPerspective(img,P,outW,outH,state.k1);state._imgVer=(state._imgVer||0)+1; }catch(e){console.error(e);showToast('Error al rectificar','⚠️');}
    setBusy(false);renderFullView();showToast(`Enderezado a ${state.artWidthCm}×${state.artHeightCm} cm`,'🖼️');
  },30);
}
function rotateImage90(){
  const cur=state.rectifiedImage||state.rawImage;if(!cur)return;
  const c=document.createElement('canvas');c.width=cur.height;c.height=cur.width;const ctx=c.getContext('2d');
  ctx.translate(c.width/2,c.height/2);ctx.rotate(Math.PI/2);ctx.drawImage(cur,-cur.width/2,-cur.height/2);
  if(state.rectifiedImage){state.rectifiedImage=c;[state.artWidthCm,state.artHeightCm]=[state.artHeightCm,state.artWidthCm];}
  else {state.rawImage=c;state.corners=state.corners.map(p=>({x:1-p.y,y:p.x}));}
  $('inArtW').value=state.artWidthCm;$('inArtH').value=state.artHeightCm;updateTotalsText();renderFullView();showToast('Rotado 90°','🔄');
}

/* ---------- RENDER (igual que v3, con correcciones) ---------- */
function onResize(){ if(state.isCropMode) drawScannerGuides(); else renderFullView(); }
function renderFullView(){
  try{Pricing.update();}catch(e){}
  if(state.isCropMode) return;const img=state.rectifiedImage||state.rawImage;if(!img) return;
  const ct=$('viewportContainer');
  $('roomBadge').classList.toggle('hidden',state.mode!=='room');
  if(state.mode==='room'&&RoomMode.R.img){
    const cw=ct.clientWidth,ch=ct.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);
    viewCanvas.width=cw*dpr;viewCanvas.height=ch*dpr;viewCanvas.style.width=cw+'px';viewCanvas.style.height=ch+'px';viewCtx.setTransform(dpr,0,0,dpr,0,0);
    RoomMode.render(viewCtx,cw,ch);try{if(!RoomMode.R.persp||!RoomMode.R.persp.on)Extras.lightRoom(viewCtx,cw,ch);}catch(e){}$('lblRoomRef').textContent=RoomMode.R.refText;return;
  }
  const availW=ct.clientWidth-16,availH=ct.clientHeight-16;if(availW<10||availH<10)return;
  const {W:totalW,H:totalH}=totals(),sceneW=totalW*1.25,sceneH=totalH*1.25;
  const s=Math.min(availW/sceneW,availH/sceneH),dpr=Math.min(2,window.devicePixelRatio||1);
  const cw=Math.round(sceneW*s),ch=Math.round(sceneH*s);
  viewCanvas.width=cw*dpr;viewCanvas.height=ch*dpr;viewCanvas.style.width=cw+'px';viewCanvas.style.height=ch+'px';
  viewCtx.setTransform(dpr,0,0,dpr,0,0);drawWallTexture(viewCtx,cw,ch);
  const fw=totalW*s,fh=totalH*s,fx=(cw-fw)/2,fy=(ch-fh)/2;
  const D=depthInfo().total;
  viewCtx.save();viewCtx.shadowColor="rgba(0,0,0,0.6)";viewCtx.shadowBlur=(state.shadowBlur*.6+D*2.2)*(s/8)+D*s*.25;viewCtx.shadowOffsetX=(.35+D*.22)*s;viewCtx.shadowOffsetY=(.6+D*.42)*s;
  viewCtx.fillStyle="#000";if(state.glass==='double'){const b=state.frameWidthCm*s;viewCtx.beginPath();viewCtx.rect(fx,fy,fw,fh);viewCtx.rect(fx+b,fy+b,fw-2*b,fh-2*b);viewCtx.fill('evenodd');}else viewCtx.fillRect(fx,fy,fw,fh);viewCtx.restore();
  drawDepthSides(viewCtx,[{x:fx,y:fy},{x:fx+fw,y:fy},{x:fx+fw,y:fy+fh},{x:fx,y:fy+fh}],D*s);
  drawFramedPiece(viewCtx,fx,fy,fw,fh,s,img);
  try{Extras.applyLight(viewCtx,cw,ch,{x:fx,y:fy,w:fw,h:fh});}catch(e){}
}
function drawWallTexture(ctx,w,h){
  if(state.wallImage){ctx.drawImage(state.wallImage,0,0,w,h);const v=ctx.createRadialGradient(w/2,h/2,w*.2,w/2,h/2,w*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=v;ctx.fillRect(0,0,w,h);}
  else{ctx.fillStyle=state.wallColor;ctx.fillRect(0,0,w,h);const g=ctx.createRadialGradient(w/2,h*.35,30,w/2,h*.4,w*.7);g.addColorStop(0,'rgba(255,255,255,.4)');g.addColorStop(.5,'rgba(255,255,255,.08)');g.addColorStop(1,'rgba(0,0,0,.28)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
}
function drawFramedPiece(ctx,ox,oy,ow,oh,scale,img){
  const fW=state.frameWidthCm*scale,pW=state.passWidthCm*scale,filW=state.hasFilete?state.fileteWidthCm*scale:0,isBox=state.frameStyle==='box',frame=state.selectedFrame;
  drawMouldingBevels(ctx,ox,oy,ow,oh,fW,frame,scale);
  const ix=ox+fW,iy=oy+fW,iw=ow-2*fW,ih=oh-2*fW;
  if(isBox) drawBoxShadow(ctx,ix,iy,iw,ih,scale);
  const dbl=state.glass==='double';
  if(dbl){ // doble vidrio: el margen es transparente (se ve la pared), con leve tinte y canto verdoso
    ctx.save();ctx.fillStyle='rgba(205,225,228,.07)';ctx.fillRect(ix,iy,iw,ih);
    ctx.strokeStyle='rgba(150,190,175,.55)';ctx.lineWidth=Math.max(1,.25*scale);ctx.strokeRect(ix+ctx.lineWidth/2,iy+ctx.lineWidth/2,iw-ctx.lineWidth,ih-ctx.lineWidth);ctx.restore();}
  else if(pW>0){ctx.save();ctx.fillStyle=state.passColor;ctx.fillRect(ix,iy,iw,ih);const bx=ix+pW,by=iy+pW,bw=iw-2*pW,bh=ih-2*pW;
    ctx.strokeStyle="#fff";ctx.lineWidth=Math.max(1,1.8*scale/8);ctx.strokeRect(bx,by,bw,bh);ctx.strokeStyle="rgba(0,0,0,.22)";ctx.lineWidth=Math.max(1,2.5*scale/8);ctx.strokeRect(bx+1,by+1,bw-2,bh-2);ctx.restore();}
  const fi=fW+pW;if(filW>0) drawMetallicFilete(ctx,ox+fi,oy+fi,ow-2*fi,oh-2*fi,filW,state.fileteColor);
  const ai=fW+pW+filW,aw=ow-2*ai,ah=oh-2*ai;
  if(dbl&&aw>4&&ah>4){ // sombra de la obra sobre el fondo, detrás del vidrio trasero
    ctx.save();ctx.beginPath();ctx.rect(ix,iy,iw,ih);ctx.clip();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=Math.max(2,.9*scale);ctx.shadowOffsetX=.35*scale;ctx.shadowOffsetY=.55*scale;
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(ox+ai,oy+ai,aw,ah);ctx.restore();}
  if(aw>4&&ah>4) drawArtCanvas(ctx,ox+ai,oy+ai,aw,ah,img,isBox);
  try{Pricing.drawPlaque(ctx,ox,oy,ow,oh,scale);}catch(e){console.warn(e);}
  if(state.glass!=='none') drawGlassSheen(ctx,ix,iy,iw,ih,scale,dbl);
}
/* reflejo de vidrio: banda diagonal suave + brillo de canto */
function drawGlassSheen(ctx,x,y,w,h,scale,dbl){
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();const mate=state.glassFinish==='mate';if(mate){ctx.globalAlpha=.3;ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(x,y,w,h);}
  const g=ctx.createLinearGradient(x,y,x+w*.9,y+h);
  g.addColorStop(0,'rgba(255,255,255,.10)');g.addColorStop(.18,'rgba(255,255,255,.03)');g.addColorStop(.26,'rgba(255,255,255,.13)');g.addColorStop(.34,'rgba(255,255,255,.02)');
  g.addColorStop(.62,'rgba(255,255,255,0)');g.addColorStop(.7,'rgba(255,255,255,.06)');g.addColorStop(.76,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,.03)');
  ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
  ctx.strokeStyle=`rgba(255,255,255,${dbl?.35:.22})`;ctx.lineWidth=Math.max(.8,.12*scale);ctx.beginPath();ctx.moveTo(x+1,y+h);ctx.lineTo(x+1,y+1);ctx.lineTo(x+w,y+1);ctx.stroke();
  ctx.restore();
}

/* Canto lateral (insinuación 3/4): lados derecho e inferior visibles, proporcional a la profundidad. q=[tl,tr,br,bl], dpx=profundidad en px */
function drawDepthSides(ctx,q,dpx,col){
  if(!(dpx>0.5))return;const base=col||state.selectedFrame.base||'#6b4a2a';
  const ux=q[1].x-q[0].x,uy=q[1].y-q[0].y,vx=q[3].x-q[0].x,vy=q[3].y-q[0].y,lu=Math.hypot(ux,uy)||1,lv=Math.hypot(vx,vy)||1;
  const k=.16,ox=(ux/lu*.55+vx/lv*.8)*dpx*k,oy=(uy/lu*.55+vy/lv*.8)*dpx*k; // desplazamiento sutil hacia abajo-derecha
  const P=(p)=>({x:p.x+ox,y:p.y+oy});
  ctx.save();
  const side=(a,b,f1,f2)=>{const A=P(a),B=P(b);const g=ctx.createLinearGradient(a.x,a.y,A.x,A.y);g.addColorStop(0,shade(base,f1));g.addColorStop(1,shade(base,f2));
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(B.x,B.y);ctx.lineTo(A.x,A.y);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();};
  side(q[1],q[2],.62,.42);side(q[3],q[2],.48,.3);
  ctx.restore();
}
window.drawDepthSides=drawDepthSides;
function drawMouldingBevels(ctx,x,y,w,h,fW,frame,scale){ FrameRenderer.drawFrame(ctx,x,y,w,h,fW,frame,scale); }
function drawBoxShadow(ctx,x,y,w,h,scale){ctx.save();const d=20*scale/8;ctx.fillStyle="#14151a";ctx.fillRect(x,y,w,h);
  let g=ctx.createLinearGradient(x,y,x,y+d);g.addColorStop(0,"rgba(0,0,0,.85)");g.addColorStop(1,"rgba(0,0,0,.05)");ctx.fillStyle=g;ctx.fillRect(x,y,w,d);
  g=ctx.createLinearGradient(x,y,x+d,y);g.addColorStop(0,"rgba(0,0,0,.8)");g.addColorStop(1,"rgba(0,0,0,.05)");ctx.fillStyle=g;ctx.fillRect(x,y,d,h);ctx.restore();}
const FILETES={gold_antique:{id:'f_ga',mat:'gold',base:'#c39a3e',profile:'round',border:.8},gold_bright:{id:'f_gb',mat:'gold',rough:.15,base:'#e8c050',profile:'round',border:.8},
  silver:{id:'f_s',mat:'silver',base:'#d4d8dc',profile:'round',border:.8},bronze:{id:'f_b',mat:'metal',base:'#9a6a3e',profile:'round',border:.8},ebony_gold:{id:'f_e',mat:'lacquer',base:'#161616',profile:'goldlip',accent:'gold',border:.8}};
FrameRenderer.PROFILES.round=([{w:.15,s:'round',m:'main'},{w:.7,s:'convex',m:'main'},{w:.15,s:'round',m:'main'}]);
function drawMetallicFilete(ctx,x,y,w,h,fW,type){ FrameRenderer.drawFrame(ctx,x,y,w,h,fW,FILETES[type]||FILETES.gold_antique); }
function drawArtCanvas(ctx,x,y,w,h,img,isBox){
  ctx.save();if(isBox){ctx.shadowColor="rgba(0,0,0,.75)";ctx.shadowBlur=18;ctx.shadowOffsetX=6;ctx.shadowOffsetY=8;}
  ctx.filter=`brightness(${state.brightness/100}) contrast(${state.contrast/100})`;ctx.drawImage(img,x,y,w,h);ctx.filter="none";ctx.shadowColor='transparent';
  const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,"rgba(255,255,255,.06)");g.addColorStop(.3,"rgba(255,255,255,.01)");g.addColorStop(.32,"rgba(255,255,255,0)");g.addColorStop(1,"rgba(255,255,255,.03)");ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.restore();}
function shade(hex,f){let c=hex.replace('#','');if(c.length===3)c=c.split('').map(x=>x+x).join('');const n=parseInt(c,16),cl=v=>Math.min(255,Math.max(0,Math.round(v*f)));return `rgb(${cl(n>>16)},${cl((n>>8)&255)},${cl(n&255)})`;}

function renderFramesCarousel(cat){
  const sc=$('framesScroller');sc.innerHTML='';
  const list=Catalog.visible(cat);
  if(!list.length){const e=document.createElement('div');e.className='text-[11px] p-3 self-center';e.style.color='var(--muted)';e.textContent=Catalog.onlyMine()?'Modo “solo mis marcos”: aún no hay marcos aquí. Toca “Mis marcos” para cargar uno.':'Sin marcos en esta categoría.';sc.appendChild(e);}
  list.forEach(frame=>{
    const card=document.createElement('div');
    card.className=`frame-card w-[104px] p-1.5 rounded-xl card ${state.selectedFrame.id===frame.id?'active':''} flex flex-col gap-1`;
    const pc=document.createElement('canvas');pc.width=184;pc.height=128;pc.className="w-full h-[64px] rounded-lg";drawFrameThumbnail(pc.getContext('2d'),frame,184,128);
    const nl=document.createElement('span');nl.className="serif text-[13px] font-semibold leading-[1.05] w-full line-clamp-2";nl.style.color='var(--cream)';nl.textContent=frame.name;
    const st=document.createElement('span');st.className="text-[8.5px] leading-tight w-full truncate";st.style.color='var(--muted)';st.textContent=frame.style||`${frame.border} cm`;
    card.append(pc,nl,st);
    if(frame.custom){const b=document.createElement('span');b.className='text-[8px] font-bold px-1.5 rounded-full absolute';b.style.cssText='background:var(--gold);color:#1a140a;top:8px;left:8px';b.textContent='MÍO';card.style.position='relative';card.appendChild(b);}
    card.onclick=()=>{
      if(state.selectedFrame===frame&&card.classList.contains('active')){Catalog.openEditor(frame);return;} // segundo toque: editar
      selectFrame(frame);
      document.querySelectorAll('.frame-card').forEach(c=>c.classList.remove('active'));card.classList.add('active');
    };
    sc.appendChild(card);
  });
}
let currentCat='all';
function selectFrame(frame){
  state.selectedFrame=frame;
  setFrameStyle(frame.cat==='cajon'||frame.boxType?'box':'classic');
  state.frameWidthCm=frame.border;$('rngFrameW').value=frame.border;$('lblFrameW').textContent=`${(+frame.border).toFixed(1)} cm`;
  syncWidthLock();updateTotalsText();renderFullView();
}
function syncWidthLock(){
  const f=state.selectedFrame,lock=!!(f&&f.custom),r=$('rngFrameW');
  if(lock){state.frameWidthCm=+f.border;r.value=f.border;$('lblFrameW').textContent=`${(+f.border).toFixed(1)} cm`;}
  r.disabled=lock;r.classList.toggle('hidden',lock);$('lblFrameW').classList.toggle('hidden',lock);if(r.previousElementSibling&&r.previousElementSibling.classList.contains('lbl'))r.previousElementSibling.classList.toggle('hidden',lock);$('lockFrameW').classList.toggle('hidden',!lock);$('fixedWidthNote').classList.toggle('hidden',!lock);
  if(lock)$('fixedWidthNote').textContent=`🔒 Ancho fijo de la moldura: ${(+f.border).toFixed(1).replace('.',',')} cm\neditable en Mis marcos`;
}
window.syncWidthLock=syncWidthLock;
function refreshFrames(){
  const all=Catalog.visible('all');document.querySelectorAll('.cat-pill').forEach(p=>{const c=p.dataset.cat;const n=Catalog.visible(c).length;
    p.classList.toggle('hidden',c!=='all'&&n===0&&c!=='mine');const base=p.dataset.label||(p.dataset.label=p.textContent.replace(/ · \d+$/,''));p.textContent=c==='all'?`${base} · ${all.length}`:base;});
  $('chipOnlyMine').classList.toggle('hidden',!Catalog.onlyMine());
  if(!Catalog.visible(currentCat).length&&currentCat!=='all'){currentCat='all';document.querySelectorAll('.cat-pill').forEach(q=>q.classList.toggle('on',q.dataset.cat==='all'));}
  renderFramesCarousel(currentCat);
}
window.selectFrame=selectFrame;window.refreshFrames=refreshFrames;
function drawFrameThumbnail(ctx,f,w,h){ FrameRenderer.drawThumb(ctx,f,w,h); }
function renderPassepartoutPalette(){
  const c=$('passColorScroller');c.innerHTML='';
  PASSEPARTOUT_TONES.forEach(t=>{const b=document.createElement('button');const on=()=>state.passColor.toLowerCase()===t.hex;
    b.className=`w-8 h-8 rounded-full shrink-0 transition ${on()?'ring-2 ring-[#c9a45c] ring-offset-2 ring-offset-[#15130f]':''}`;b.style.border='1px solid rgba(255,255,255,.15)';b.style.backgroundColor=t.hex;b.title=t.name;
    b.onclick=()=>{state.passColor=t.hex;$('passCustomColor').value=t.hex;renderPassepartoutPalette();renderFullView();};c.appendChild(b);});
}
function setupAdjustSliders(){
  $('rngBri').oninput=e=>{state.brightness=+e.target.value;$('lblBri').textContent=`${state.brightness}%`;renderFullView();};
  $('rngCon').oninput=e=>{state.contrast=+e.target.value;$('lblCon').textContent=`${state.contrast}%`;renderFullView();};
  $('rngShadow').oninput=e=>{state.shadowBlur=+e.target.value;$('lblShadow').textContent=state.shadowBlur>30?"Fuerte":state.shadowBlur>18?"Media":"Suave";renderFullView();};
}

/* ---------- SALAS ---------- */
function setupRooms(){
  const sc=$('roomsScroller');sc.innerHTML='';
  const mk=(label,sub,src,onclick,id)=>{const c=document.createElement('button');c.className='room-card frame-card card w-[118px] p-1 rounded-xl flex flex-col gap-1 text-left';c.dataset.id=id||'';
    const box=document.createElement('div');box.className='w-full h-[62px] rounded-lg overflow-hidden flex items-center justify-center';box.style.background='#0e0d0b';
    if(src){const im=document.createElement('img');im.src=src;im.className='w-full h-full object-cover';im.loading='lazy';box.appendChild(im);}else box.innerHTML='<svg class="ico" style="stroke:var(--gold2);width:26px;height:26px"><use href="#i-camera"/></svg>';
    const t=document.createElement('span');t.className='serif text-[13px] font-semibold leading-none px-0.5';t.textContent=label;
    const s2=document.createElement('span');s2.className='text-[8.5px] px-0.5 truncate';s2.style.color='var(--muted)';s2.textContent=sub;
    c.append(box,t,s2);c.onclick=()=>{document.querySelectorAll('.room-card').forEach(x=>x.classList.remove('active'));c.classList.add('active');onclick();};sc.appendChild(c);return c;};
  mk('Tu sala','Foto: detecta pared y escala',null,()=>$('roomFileInput').click(),'photo');
  RoomMode.ROOMS.forEach(r=>mk(r.name,r.ref,r.img,()=>RoomMode.openSample(r.id),r.id));
  $('roomFileInput').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;loadImageFile(f).then(img=>RoomMode.openPhoto(img)).catch(()=>showToast('No se pudo leer la imagen','warn'));};
  RoomMode.attach(viewCanvas);
  const R=RoomMode.R;
  $('btnLockScale').onclick=()=>{R.lock=!R.lock;if(R.lock)R.userScale=1;updateRoomPanel();renderFullView();showToast(R.lock?'Tamaño real bloqueado':'Escala libre: pellizca o usa el deslizador',R.lock?'lock':'plus');};
  $('rngRoomScale').oninput=e=>{if(R.lock){R.lock=false;}R.userScale=e.target.value/100;updateRoomPanel();renderFullView();};
  $('btnAnalysis').onclick=()=>{R.showAnalysis=!R.showAnalysis;$('btnAnalysis').style.borderColor=R.showAnalysis?'var(--gold)':'';renderFullView();};
  $('btnExitRoom').onclick=()=>{RoomMode.deactivate();};
  $('btnMeasure').onclick=()=>{if(!R.img)return;R.measuring=true;R.measure=null;$('measurePanel').classList.remove('hidden');$('measureHint').textContent='Arrastra una línea sobre algo de medida conocida (puerta, mesa…)';};
  $('btnCancelMeasure').onclick=()=>{R.measuring=false;R.measure=null;$('measurePanel').classList.add('hidden');renderFullView();};
  $('btnApplyMeasure').onclick=()=>{const cm=parseFloat($('inMeasureCm').value);if(!R.measure)return showToast('Primero dibuja la línea','warn');
    if(!(cm>0))return showToast('Escribe la medida real en cm','warn');RoomMode.applyMeasure(cm);R.lock=true;R.userScale=1;$('measurePanel').classList.add('hidden');updateRoomPanel();renderFullView();showToast('Escala calibrada','ruler');};
  $('btnRoomCamera').onclick=()=>$('roomCameraInput').click();
  $('roomCameraInput').onchange=$('roomFileInput').onchange;
  $('btnPersp').onclick=()=>{if(!R.img)return;if(R.measuring)$('btnCancelMeasure').click();RoomMode.perspStart();$('perspPanel').classList.remove('hidden');};
  $('btnPerspReset').onclick=()=>RoomMode.perspReset();
  $('btnPerspCancel').onclick=()=>{RoomMode.perspCancel();$('perspPanel').classList.add('hidden');};
  $('btnPerspOk').onclick=()=>{if(RoomMode.perspApply()){$('perspPanel').classList.add('hidden');renderFullView();showToast('Perspectiva aplicada: arrastra el cuadro sobre la pared','check');}};
  $('btnSaveRoom').onclick=()=>saveRoomImage(false);
  $('btnShareRoom').onclick=()=>saveRoomImage(true);
  window.onMeasureDone=()=>{$('measureHint').textContent='¿Cuánto mide esa línea en la realidad?';$('inMeasureCm').focus();};
}
function updateRoomPanel(){const R=RoomMode.R;$('tglLock').classList.toggle('on',R.lock);const pct=Math.round((R.lock?1:R.userScale)*100);$('rngRoomScale').value=pct;$('lblRoomScale').textContent=pct+'%';}

async function saveRoomImage(share){
  const R=RoomMode.R;if(!R.img)return showToast('Primero elige una sala','warn');
  setBusy(true,share?'Preparando imagen…':'Guardando imagen…');await new Promise(r=>setTimeout(r,30));
  let c;try{c=RoomMode.exportComposite(4096);}catch(e){console.error(e);}
  if(!c){setBusy(false);return showToast('No se pudo componer la imagen','warn');}
  const name=`sala-${(state.selectedFrame&&state.selectedFrame.id)||'cuadro'}-${Date.now()}.jpg`;
  const C=window.Capacitor,nat=C&&C.isNativePlatform&&C.isNativePlatform(),P=C&&C.Plugins;
  const data=c.toDataURL('image/jpeg',.93).split(',')[1];
  try{
    if(nat){
      if(!share){const AW=(P&&P.ArWall)||(C.registerPlugin&&C.registerPlugin('ArWall'));
        try{await AW.saveToGallery({data,name,mime:'image/jpeg'});setBusy(false);showToast('Guardada en Galería › Pictures/EnmarcadoStudio','download');return;}
        catch(e){console.warn(e);showToast('No se pudo guardar en la galería; usa Compartir','warn');}}
      const r=await P.Filesystem.writeFile({path:name,data,directory:'CACHE'});setBusy(false);
      await P.Share.share({title:'Mi cuadro en la sala',files:[r.uri],dialogTitle:'Compartir imagen'});return;
    }
    setBusy(false);
    if(share&&navigator.canShare){const b=await (await fetch(c.toDataURL('image/jpeg',.93))).blob(),f=new File([b],name,{type:'image/jpeg'});if(navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'Mi cuadro en la sala'});return;}}
    c.toBlob(b=>{const a=document.createElement('a');a.download=name;a.href=URL.createObjectURL(b);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);},'image/jpeg',.93);
    showToast('Imagen de la sala guardada','download');
  }catch(e){setBusy(false);console.warn(e);}
}

/* ---------- DEMO ---------- */
function loadDemoCascadePainting(){
  const c=document.createElement('canvas');c.width=900;c.height=1200;const ctx=c.getContext('2d');
  ctx.fillStyle="#dedad2";ctx.fillRect(0,0,900,920);ctx.fillStyle="#fff";ctx.fillRect(0,910,900,30);ctx.fillStyle="#e5e1d8";ctx.fillRect(0,940,900,260);
  ctx.strokeStyle="#c8c4ba";ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,1080);ctx.lineTo(900,1080);ctx.moveTo(250,940);ctx.lineTo(120,1200);ctx.moveTo(680,940);ctx.lineTo(780,1200);ctx.stroke();
  const Q=[[140,160],[760,180],[710,980],[150,960]];
  ctx.save();ctx.beginPath();Q.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.clip();
  const sky=ctx.createLinearGradient(0,160,0,450);sky.addColorStop(0,"#3b82f6");sky.addColorStop(1,"#bae6fd");ctx.fillStyle=sky;ctx.fillRect(0,0,900,1200);
  ctx.fillStyle="#1e3a1b";ctx.fillRect(100,420,700,80);
  const wt=ctx.createLinearGradient(0,500,0,1000);wt.addColorStop(0,"#92683e");wt.addColorStop(.3,"#f0f9ff");wt.addColorStop(.6,"#38bdf8");wt.addColorStop(1,"#64748b");ctx.fillStyle=wt;ctx.fillRect(100,500,700,500);ctx.restore();
  ctx.strokeStyle="#271c14";ctx.lineWidth=3;ctx.beginPath();Q.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.stroke();
  state.rawImage=c;state.rectifiedImage=null;state.artWidthCm=60;state.artHeightCm=90;$('inArtW').value=60;$('inArtH').value=90;updateTotalsText();
  const r=FrameDetector.detectArtwork(c,60/90);
  if(r&&r.confidence>0.15){state.corners=r.corners;state.k1=r.k1;}else{state.corners=Q.map(([x,y])=>({x:x/900,y:y/1200}));state.k1=0;}
  warpImageByHomography();
}

/* ---------- EXPORTACIÓN ---------- */
function downloadCanvas(c,name){
  const P=window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()&&window.Capacitor.Plugins;
  if(P&&P.Filesystem){
    const data=c.toDataURL('image/png').split(',')[1];
    (async()=>{
      let uri=null;
      try{const r=await P.Filesystem.writeFile({path:'EnmarcadoStudio/'+name,data,directory:'DOCUMENTS',recursive:true});uri=r.uri;showToast('Guardado en Documentos/EnmarcadoStudio','💾');}catch(e){}
      try{const r=await P.Filesystem.writeFile({path:name,data,directory:'CACHE'});await P.Share.share({title:name,files:[r.uri],dialogTitle:'Compartir / guardar imagen'});}catch(e){if(!uri)showToast('No se pudo guardar la imagen','⚠️');}
    })();
    return;
  }
  c.toBlob(b=>{const a=document.createElement('a');a.download=name;a.href=URL.createObjectURL(b);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);},'image/png');
}
function exportHDWorksheet(){
  const img=state.rectifiedImage||state.rawImage;if(!img)return;
  const c=document.createElement('canvas');c.width=1400;c.height=1680;const ctx=c.getContext('2d');
  ctx.fillStyle="#0c0d12";ctx.fillRect(0,0,1400,1680);ctx.fillStyle="#eab308";ctx.font="bold 32px sans-serif";ctx.fillText("ORDEN & FICHA TÉCNICA DE ENMARCADO",50,65);
  ctx.fillStyle="#9ca3af";ctx.font="16px sans-serif";ctx.fillText(`Emitido el: ${new Date().toLocaleString('es-PY')} | Taller Profesional`,50,95);
  const {W,H}=totals(),s=Math.min(1240/W,860/H),fw=W*s,fh=H*s;drawFramedPiece(ctx,50+(1300-fw)/2,120+(920-fh)/2,fw,fh,s,img);
  ctx.fillStyle="#161822";ctx.fillRect(50,1070,1300,560);ctx.strokeStyle="#2e3447";ctx.strokeRect(50,1070,1300,560);
  ctx.fillStyle="#facc15";ctx.font="bold 22px sans-serif";ctx.fillText("ESPECIFICACIONES DE CORTE Y MATERIALES",80,1120);
  const row=(l,v,x,y)=>{ctx.fillStyle="#94a3b8";ctx.font="15px sans-serif";ctx.fillText(l,x,y);ctx.fillStyle="#fff";ctx.font="bold 18px monospace";ctx.fillText(v,x,y+25);};
  let y=1170;row("MEDIDA LUZ DE OBRA",`${state.artWidthCm} x ${state.artHeightCm} cm`,80,y);row("MOLDURA",state.selectedFrame.name,480,y);row("ANCHO MOLDURA",`${state.frameWidthCm} cm`,960,y);
  y+=75;row("TIPO",state.frameStyle==='box'?"Cajón / Shadowbox 3D":"Clásico Plano",80,y);row("PASPARTÚ",state.glass==='double'?'Sin paspartú (vidrio)':`${state.passWidthCm} cm`,480,y);row("COLOR PASPARTÚ",state.passColor,960,y);
  y+=75;row("FILETE",state.hasFilete?`${state.fileteColor} (${state.fileteWidthCm} cm)`:"Sin filete",80,y);row("MEDIDA EXTERIOR FINAL",`${W.toFixed(1)} x ${H.toFixed(1)} x ${depthInfo().total.toFixed(1)} cm`,480,y);
  row("CORRECCIÓN",state.rectifiedImage?`Homografía 3x3${state.k1?' + lente':''}`:"Original",960,y);
  const di=depthInfo();y+=75;row("GROSOR BASTIDOR",`${di.stretcher} cm`,80,y);row("PROFUNDIDAD MOLDURA / GALCE",`${di.moulding} / ${di.rebate} cm`,480,y);
  row("PROFUNDIDAD TOTAL",`${di.total.toFixed(1)} cm${di.protrude>0?` (sobresale ${di.protrude.toFixed(1)})`:''}`,960,y);
  y+=75;row("TIPO DE OBRA",state.artType==='paper'?"Papel / cartulina":"Óleo / acrílico con bastidor",80,y);
  row("VIDRIO",state.glass==='double'?`Doble vidrio flotante (margen ${state.glassMarginCm} cm)`:state.glass==='glass'?"Vidrio simple":"Sin vidrio",480,y);
  const fr0=state.selectedFrame,per=2*(W+H)/100;row("MOLDURA NECESARIA",`${per.toFixed(2)} m${fr0.price?` · ${Math.round(per*fr0.price).toLocaleString('es-PY')} ₲`:''}${fr0.sku?` · ${fr0.sku}`:''}`,960,y);
  y+=60;ctx.fillStyle="#eab308";ctx.font="italic 15px sans-serif";ctx.fillText("* Medidas con inglete de 45°. Verificar tolerancia de taller antes del corte.",80,y);
  downloadCanvas(c,`ficha-enmarcado-${state.selectedFrame.id}.png`);showToast('Ficha técnica exportada','💾');
}
function exportFramedArtOnly(){
  const img=state.rectifiedImage||state.rawImage;if(!img)return;const {W,H}=totals(),s=Math.min(14,4000/Math.max(W,H));
  const c=document.createElement('canvas');c.width=Math.round(W*s);c.height=Math.round(H*s);drawFramedPiece(c.getContext('2d'),0,0,c.width,c.height,s,img);
  downloadCanvas(c,`obra-enmarcada-${state.selectedFrame.id}.png`);showToast('Imagen del cuadro exportada','🖼️');
}

window.addEventListener('load',()=>{initApp();updateTotalsText();});
if(!window.Capacitor && 'serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});

/* ---------- TIPO DE OBRA Y VIDRIO ---------- */
function setModalArtType(t,g){
  document.querySelectorAll('#dimensionModal .at-btn').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  const paper=t==='paper';$('modalStretcherBlock').classList.toggle('hidden',paper);$('modalPaperNote').classList.toggle('hidden',!paper);
  const none=document.querySelector('#dimensionModal .gl-btn[data-g=none]');none.disabled=paper;none.style.opacity=paper?.35:1;
  if(paper&&g==='none')g='glass';
  document.querySelectorAll('#dimensionModal .gl-btn').forEach(b=>b.classList.toggle('on',b.dataset.g===g));
}
function setGlass(g){
  if(state.artType==='paper'&&g==='none'){showToast('El papel o cartulina necesita vidrio para protegerse','warn');g='glass';}
  const was=state.glass;state.glass=g;
  if(g==='double'&&was!=='double'){state._passBefore=state.passWidthCm;state.passWidthCm=state.glassMarginCm;}
  if(g!=='double'&&was==='double'){state.passWidthCm=state._passBefore!=null?state._passBefore:5;}
  syncGlassUI();updateTotalsText();renderFullView();saveProject();
}
function syncGlassUI(){
  document.querySelectorAll('#glassRow .gl-chip').forEach(b=>{b.classList.toggle('on',b.dataset.g===state.glass);const dis=state.artType==='paper'&&b.dataset.g==='none';b.disabled=dis;b.style.opacity=dis?.35:1;});
  document.querySelectorAll('#glassRow .gf-chip').forEach(b=>{b.classList.toggle('on',b.dataset.f===state.glassFinish);b.classList.toggle('hidden',state.glass==='none');});
  const dbl=state.glass==='double';$('glassMarginRow').classList.toggle('hidden',!dbl);
  $('rngGlassM').value=state.glassMarginCm;$('lblGlassM').textContent=`${(+state.glassMarginCm).toFixed(1)} cm`;
  $('rngPassW').disabled=dbl;$('btnPassZero').disabled=dbl;$('rngPassW').closest('div').style.opacity=dbl?.4:1;
  $('rngPassW').value=state.passWidthCm;$('lblPassW').textContent=`${(+state.passWidthCm).toFixed(1)} cm`;
  $('glassHint').textContent=state.artType==='paper'?'Papel/cartulina: vidrio obligatorio':dbl?'La obra flota entre dos vidrios; el margen transparente hace de paspartú':state.glass==='glass'?(state.glassFinish==='mate'?'Vidrio mate antirreflejo':'Vidrio brillante con reflejo sutil'):'';
}
function setupGlassUI(){
  document.querySelectorAll('#glassRow .gl-chip').forEach(b=>b.onclick=()=>setGlass(b.dataset.g));
  document.querySelectorAll('#glassRow .gf-chip').forEach(b=>b.onclick=()=>{state.glassFinish=b.dataset.f;syncGlassUI();renderFullView();saveProject();});
  $('rngGlassM').oninput=e=>{state.glassMarginCm=parseFloat(e.target.value);if(state.glass==='double')state.passWidthCm=state.glassMarginCm;syncGlassUI();updateTotalsText();renderFullView();saveProject();};
  document.querySelectorAll('#dimensionModal .at-btn').forEach(b=>b.onclick=()=>{const g=document.querySelector('#dimensionModal .gl-btn.on');setModalArtType(b.dataset.t,g?g.dataset.g:'none');});
  document.querySelectorAll('#dimensionModal .gl-btn').forEach(b=>b.onclick=()=>{if(b.disabled){showToast('Papel/cartulina requiere vidrio','warn');return;}document.querySelectorAll('#dimensionModal .gl-btn').forEach(x=>x.classList.toggle('on',x===b));});
  if(state.glass==='double'){state._passBefore=5;state.passWidthCm=state.glassMarginCm;}
  syncGlassUI();
}
/* ---------- TECLADO: el diálogo se ajusta por encima del teclado ---------- */
function setKb(px){
  px=Math.max(0,Math.round(px||0));document.documentElement.style.setProperty('--kb',px+'px');document.body.classList.toggle('kb-open',px>60);
  if(px>60){const a=document.activeElement;if(a&&/INPUT|SELECT|TEXTAREA/.test(a.tagName))setTimeout(()=>a.scrollIntoView({block:'center',behavior:'smooth'}),60);}
}
let fullH=window.innerHeight;
window.__kb=h=>{window.__kbNative=true;if(!(h>0)){fullH=Math.max(fullH,window.innerHeight);setKb(0);return;}
  // si el WebView ya se redimensionó (adjustResize), descontar lo que ya encogió
  setTimeout(()=>{const shrink=Math.max(0,fullH-window.innerHeight);setKb(Math.max(0,h-shrink));},120);};
function setupKeyboard(){
  const vv=window.visualViewport;
  if(vv)vv.addEventListener('resize',()=>{if(window.__kbNative)return;const kb=window.innerHeight-vv.height-vv.offsetTop;setKb(kb>60?kb:0);});
  document.addEventListener('focusin',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))setTimeout(()=>e.target.scrollIntoView({block:'center',behavior:'smooth'}),300);});
}

/* ---------- EPÍGRAFE ---------- */
function setupPlaqueUI(){
  const pl=()=>state.plaque,S=$('plaqueSheet');
  const fill=()=>{const p=pl();$('plOn').checked=p.on;$('plTitle').value=p.title;$('plArtist').value=p.artist;$('plYear').value=p.year;$('plW').value=p.w;$('plH').value=p.h;$('plFinish').value=p.finish;$('plVy').value=Math.round((p.vy??.5)*100);
    document.querySelectorAll('#plaqueSheet .pl-pos').forEach(b=>b.classList.toggle('on',b.dataset.p===p.pos));
    [...$('plFinish').options].forEach(o=>o.textContent=`${Pricing.FINISH[o.value]} · ${Pricing.gs(Pricing.prices.plaque[o.value]||0)}`);check();};
  const check=()=>{const p=pl(),ok=(state.passWidthCm>=p.h*1.05);$('plWarn').classList.toggle('hidden',!p.on||ok);
    $('plWarn').textContent=state.passWidthCm<=0?'El epígrafe va sobre el paspartú (o el margen de doble vidrio): agrega paspartú para poder colocarlo.':`El margen inferior (${state.passWidthCm} cm) es menor que el alto del epígrafe (${p.h} cm): reduce el alto o aumenta el paspartú.`;};
  const apply=()=>{const p=pl();p.on=$('plOn').checked;p.title=$('plTitle').value;p.artist=$('plArtist').value;p.year=$('plYear').value;
    p.w=Math.max(2,Math.min(60,parseFloat($('plW').value)||12));p.h=Math.max(1,Math.min(20,parseFloat($('plH').value)||3));p.finish=$('plFinish').value;p.vy=(+$('plVy').value)/100;
    if(p.on&&state.passWidthCm<=0){showToast('El epígrafe necesita paspartú o margen de doble vidrio','warn');}
    check();saveProject();$('btnPlaque').textContent=p.on?'Epígrafe ✓':'＋ Epígrafe';updateTotalsText();renderFullView();};
  $('btnPlaque').onclick=()=>{fill();S.classList.remove('hidden');};
  $('plClose').onclick=()=>S.classList.add('hidden');
  $('plRemove').onclick=()=>{state.plaque.on=false;fill();apply();S.classList.add('hidden');showToast('Epígrafe eliminado','check');};
  ['plOn','plTitle','plArtist','plYear','plW','plH','plFinish','plVy'].forEach(id=>$(id).addEventListener('input',apply));$('plOn').addEventListener('change',apply);$('plFinish').addEventListener('change',apply);
  document.querySelectorAll('#plaqueSheet .pl-pos').forEach(b=>b.onclick=()=>{state.plaque.pos=b.dataset.p;fill();apply();});
  $('btnPlaque').textContent=state.plaque.on?'Epígrafe ✓':'＋ Epígrafe';
}
