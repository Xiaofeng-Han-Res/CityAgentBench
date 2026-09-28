(()=>{
 const zh=new URLSearchParams(location.search).get('lang')==='zh';window.mapText=(en,cn)=>zh?cn:en;
 document.documentElement.lang=zh?'zh-CN':'en';
 if(zh)return;
 document.title='CityAgentBench · 18K city atlas';
 const put=(s,t)=>document.querySelector(s).textContent=t;
 put('.eyebrow','CITY ATLAS / NATIVE RENDER');put('h1','Chunsun · Cocoon · Talent Park');put('#status','Loading the local city atlas…');put('.north b','N');
 put('#fit','Fit map');put('#actual','1:1 pixels');put('#download-png','Full PNG ↓');put('#download-zip','Offline ZIP ↓');put('#loading','Loading the city atlas…');put('.help','Scroll to zoom · Drag to pan · Double-click to enlarge');
 for(const [s,label] of [['#viewer','Zoomable high-resolution city atlas'],['#map','Scroll or pinch to zoom; drag or arrow keys to pan; Home to reset'],['nav','Map controls'],['.downloads','Download original image'],['#zoom-in','Zoom in'],['#zoom-out','Zoom out']]){document.querySelector(s).setAttribute('aria-label',label);document.querySelector(s).title=label;}
 document.querySelector('.north').title='Project +Y points north; +X points east';
})();
