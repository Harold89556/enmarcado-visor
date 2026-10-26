/* Demo – Galería Viedma: datos compartidos (localStorage) */
var DEMO={
 DEF_PRICES:{wastePct:10,defaultFramePerM:35000,passM2:120000,passPerCm:0,filetePerM:15000,glassBrilloM2:150000,glassMateM2:230000,ivaPct:10,fichaItems:false,backingOn:true,backingM2:40000,laborMode:'fixed',laborFixed:50000,laborPct:20,
  plaque:{gold:45000,silver:45000,chromeGold:65000,chromeSilver:65000},business:'Galería Viedma',logo:'',rodMode:'m',rodDefaultCm:300,kerfCm:0.5},
 DEF_FRAMES:[
  {id:'f1',name:'Luis XV Rocalla Oro',sku:'GV-901',base:'roc_volutas_antiguo',price:78000,width:9,rodCm:290,rodPrice:0,active:true},
  {id:'f2',name:'Luis XIII Acanto',sku:'GV-801',base:'roc_pan_oro_acantos',price:68000,width:8,rodCm:290,rodPrice:0,active:true},
  {id:'f3',name:'Nogal con Filo Oro',sku:'GV-552',base:'mad_nogal_filo_oro',price:42000,width:5.5,rodCm:300,rodPrice:0,active:true},
  {id:'f4',name:'Roble Rústico Decapé',sku:'GV-500',base:'mad_roble_rustico',price:36000,width:5,rodCm:300,rodPrice:0,active:true},
  {id:'f5',name:'Negro Satinado Galería',sku:'GV-350',base:'liso_negro_satin',price:28000,width:3.5,rodCm:300,rodPrice:0,active:true},
  {id:'f6',name:'Blanco Mate Puro',sku:'GV-351',base:'liso_blanco_mate',price:28000,width:3.5,rodCm:300,rodPrice:0,active:true},
  {id:'f7',name:'Oro Viejo Cepillado',sku:'GV-320',base:'met_oro_viejo',price:39000,width:3.2,rodCm:300,rodPrice:0,active:true},
  {id:'f8',name:'Plata Pulida Espejo',sku:'GV-280',base:'met_plata_pulida',price:39000,width:2.8,rodCm:300,rodPrice:0,active:true},
  {id:'f9',name:'Cajón Negro Filo Oro',sku:'GV-C40',base:'cajon_filo_oro',price:52000,width:4,rodCm:300,rodPrice:0,active:true},
  {id:'f10',name:'Cajón Roble Natural',sku:'GV-C41',base:'cajon_roble_flotante',price:48000,width:4,rodCm:300,rodPrice:0,active:true}],
 get(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}},
 set(k,v){localStorage.setItem(k,JSON.stringify(v));},
 prices(){var p=Object.assign({},this.DEF_PRICES,this.get('demo_prices',{}));p.plaque=Object.assign({},this.DEF_PRICES.plaque,p.plaque||{});return p;},
 frames(){return this.get('demo_frames',null)||this.DEF_FRAMES;},
 cart(){return this.get('demo_cart',[]);},
 gs(n){n=Math.round(+n||0);return '₲ '+n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');},
 badge:'Demo – Galería Viedma'
};
