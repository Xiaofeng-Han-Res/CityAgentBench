/* Fully local, no fetch/import/CDN. Native image pyramid, Canvas2D view only. */
(() => {
  'use strict';
  const M = window.CITY_OVERVIEW;
  const canvas = document.getElementById('map'), ctx = canvas.getContext('2d', {alpha:false});
  const loading = document.getElementById('loading'), status = document.getElementById('status');
  const cache = new Map(), errors = new Set(), pointers = new Map();
  let width=0, height=0, ratio=1, zoom=1, ox=0, oy=0, initialized=false, preview=null, drawPending=false;
  let drag=null, pinch=null, completeTiles=0, lastLevel=null, visiblePendingTiles=0;
  if (!M) {loading.textContent=window.mapText("Map manifest is missing. Keep the complete offline folder.","未找到 manifest.js，请保留解压后的完整文件夹。"); return;}
  const nativeRatio = M.status === 'complete' ? 1 : (M.previewWidth || 2048) / M.width;
  function requestDraw() {if (!drawPending) {drawPending=true; requestAnimationFrame(draw);}}
  function fit() {zoom=Math.min(width/M.width,height/M.height)*.95;ox=(width-M.width*zoom)/2;oy=(height-M.height*zoom)/2;requestDraw();}
  function zoomAt(x,y,newZoom) {
    const fitZoom=Math.min(width/M.width,height/M.height)*.95;
    newZoom=Math.min(nativeRatio*8,Math.max(fitZoom*.5,newZoom));
    const wx=(x-ox)/zoom,wy=(y-oy)/zoom;
    ox=x-wx*newZoom;oy=y-wy*newZoom;zoom=newZoom;requestDraw();
  }
  function resize() {
    const oldW=width,oldH=height; width=window.innerWidth;height=window.innerHeight;ratio=Math.min(devicePixelRatio || 1,2);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    if (!initialized) {initialized=true;fit();if(width>640){zoom=width*.85/M.width;ox=(width-M.width*zoom)/2;oy=height/2-M.height*.61*zoom;requestDraw();}} else {ox+=(width-oldW)/2;oy+=(height-oldH)/2;requestDraw();}
  }
  function image(url) {
    if (cache.has(url)) {const item=cache.get(url);item.seen=performance.now();return item;}
    const im=new Image(); const item={im,ready:false,seen:performance.now()};cache.set(url,item);
    im.onload=()=>{item.ready=true;completeTiles++;requestDraw();};
    im.onerror=()=>{errors.add(url);requestDraw();}; im.src=url;return item;
  }
  function draw() {
    drawPending=false;visiblePendingTiles=0;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle='#233330';ctx.fillRect(0,0,width,height);
    ctx.imageSmoothingEnabled=true;
    if (preview && preview.complete && preview.naturalWidth) ctx.drawImage(preview,ox,oy,M.width*zoom,M.height*zoom);
    if (M.status==='complete') {
      const level=Math.max(0,Math.min(M.maxLevel,Math.ceil(Math.log2(zoom*ratio))+M.maxLevel));lastLevel=level;
      const divisor=2**(M.maxLevel-level), lw=Math.ceil(M.width/divisor),lh=Math.ceil(M.height/divisor), ts=M.tileSize;
      const left=Math.max(0,Math.floor(-ox/zoom/divisor/ts)),right=Math.min(Math.ceil(lw/ts)-1,Math.floor((width-ox)/zoom/divisor/ts));
      const top=Math.max(0,Math.floor(-oy/zoom/divisor/ts)),bottom=Math.min(Math.ceil(lh/ts)-1,Math.floor((height-oy)/zoom/divisor/ts));
      for(let y=top;y<=bottom;y++) for(let x=left;x<=right;x++) {
        const item=image(`${M.tileRoot}/${level}/${x}_${y}.${M.tileFormat}`);
        if(item.ready) {
          const px=x*ts*divisor,py=y*ts*divisor;
          const pw=Math.min(item.im.naturalWidth*divisor,M.width-px),ph=Math.min(item.im.naturalHeight*divisor,M.height-py);
          ctx.drawImage(item.im,0,0,pw/divisor,ph/divisor,ox+px*zoom,oy+py*zoom,pw*zoom,ph*zoom);
        } else visiblePendingTiles++;
      }
      if(cache.size>160) {
        const oldest=[...cache.entries()].sort((a,b)=>a[1].seen-b[1].seen);
        for(const [url] of oldest.slice(0,cache.size-128)) cache.delete(url);
      }
    }
    document.getElementById('zoom').textContent=`${Math.round(zoom/nativeRatio*100)}%`;
    const maxMeters=140*M.metersPerPixel/zoom;
    const base=10**Math.floor(Math.log10(maxMeters));
    const length=[5,2,1].map(v=>v*base).find(v=>v<=maxMeters)||base/2;
    const scale=document.getElementById('scale');scale.style.width=`${length/M.metersPerPixel*zoom}px`;scale.textContent=length>=1000?`${length/1000} km`:`${length} m`;
    if(errors.size) status.textContent=window.mapText("Some map tiles are missing. Keep the complete offline folder.","有图块未找到，请解压完整文件夹后再打开。");
  }
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,zoom*Math.exp(-e.deltaY*.0015));},{passive:false});
  canvas.addEventListener('dblclick',e=>zoomAt(e.clientX,e.clientY,zoom*2));
  canvas.addEventListener('pointerdown',e=>{
    canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    canvas.classList.add('dragging');drag={x:e.clientX,y:e.clientY};
    if(pointers.size===2) {const p=[...pointers.values()];pinch={distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),zoom};}
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2 && pinch) {
      const p=[...pointers.values()],distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
      zoomAt((p[0].x+p[1].x)/2,(p[0].y+p[1].y)/2,pinch.zoom*distance/Math.max(1,pinch.distance));
    } else if(drag) {ox+=e.clientX-drag.x;oy+=e.clientY-drag.y;requestDraw();}
    drag={x:e.clientX,y:e.clientY};
  });
  function release(e){pointers.delete(e.pointerId);pinch=null;drag=null;if(!pointers.size)canvas.classList.remove('dragging');}
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  document.getElementById('zoom-in').onclick=()=>zoomAt(width/2,height/2,zoom*1.5);
  document.getElementById('zoom-out').onclick=()=>zoomAt(width/2,height/2,zoom/1.5);
  document.getElementById('fit').onclick=fit;
  document.getElementById('actual').onclick=()=>zoomAt(width/2,height/2,nativeRatio);
  window.addEventListener('keydown',e=>{
    const changes={ArrowLeft:[80,0],ArrowRight:[-80,0],ArrowUp:[0,80],ArrowDown:[0,-80]};
    if(changes[e.key]){e.preventDefault();ox+=changes[e.key][0];oy+=changes[e.key][1];requestDraw();}
    else if(e.key==='+'||e.key==='=')zoomAt(width/2,height/2,zoom*1.5);
    else if(e.key==='-')zoomAt(width/2,height/2,zoom/1.5);
    else if(e.key==='Home'||e.key.toLowerCase()==='r')fit();
  });
  status.textContent=M.status==='complete'?`${M.width.toLocaleString()} × ${M.height.toLocaleString()} · ${window.mapText("North-up · Offline ready","北向正交 · 离线可用")}`:'Blender 原生全区域预览 · 大图制作中';
  const downloads=document.querySelector('.downloads');
  if(M.status==='complete' && M.fullImage) {
    const link=document.getElementById('download-png');link.href=M.fullImage;link.hidden=false;downloads.hidden=false;
  }
  // The pack does not contain a recursive copy of its own ZIP. The online
  // manifest enables this link only after the archive was atomically saved.
  if(location.protocol!=='file:' && M.offlineArchive) {
    const link=document.getElementById('download-zip');link.href=M.offlineArchive;link.hidden=false;downloads.hidden=false;
  }
  if(M.preview) {
    preview=new Image();preview.onload=()=>{loading.classList.add('hidden');requestDraw();};
    preview.onerror=()=>{loading.textContent=window.mapText("The preview could not be loaded. Please reopen the viewer.","预览尚未就绪，请稍后重新打开。");};preview.src=M.preview;
  }
  window.addEventListener('resize',resize);resize();
  window.overviewDiagnostics=()=>({status:M.status,zoom,ox,oy,lastLevel,loadedTileCount:completeTiles,visiblePendingTiles,cacheSize:cache.size,missingTiles:[...errors],previewLoaded:!!(preview&&preview.naturalWidth)});
})();
