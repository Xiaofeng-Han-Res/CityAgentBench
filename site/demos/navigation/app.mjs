import {MapService} from './service/core.mjs';
import {renderMap,fitBounds,unproject,clamp,LIMITS as L,distance} from './shared/map.mjs';
import {GUIDE_CATEGORIES} from './shared/guide.mjs';
import {english,categories} from './names.mjs';
const zh=new URLSearchParams(location.search).get('lang')==='zh',t=(en,cn)=>zh?cn:en,$=id=>document.getElementById(id),map=$('map');
const strings={title:['Map & navigation','地图与导航'],scene:['City map','城市导览'],demo:['Navigation demo','导航演示'],searchLabel:['Find a place','查找地点'],prev:['← Previous','← 上一页'],next:['Next →','下一页 →'],closePlace:['Close place details','关闭地点详情'],routeTitle:['A route that adapts','会随情况调整的路线'],routeIntro:['Plan a walk, replay position updates, then test a detour.','规划路线、回放位置更新，体验偏航重规划。'],plan:['Plan route','规划路线'],start:['Start navigation','开始导航'],walk:['Replay walk','沿路线回放'],deviate:['Simulate deviation','演示偏航'],stop:['Stop navigation','停止导航'],reset:['Reset demo','重置演示'],simulation:['Synthetic network · Simulated positions · No agent movement','合成路网 · 模拟定位 · 不移动智能体'],park:['Talent Park','人才公园'],spring:['Chunsun','春笋'],cocoon:['Cocoon','春蚕'],fit:['Fit','全图'],export:['SVG ↓','SVG ↓'],loading:['Loading local map…','正在读取本地地图…']};
document.documentElement.lang=zh?'zh-CN':'en';document.title=t('CityAgentBench · Map & navigation','CityAgentBench · 地图与导航');
for(const e of document.querySelectorAll('[data-t]'))e.textContent=strings[e.dataset.t][zh?1:0];
$('search').placeholder=t('Try “bridge” or “Cocoon”','试试“星光桥”或“春蚕”');
map.setAttribute('aria-label',t('Drag to pan; scroll, pinch or use + and - to zoom; arrow keys to pan','拖动或方向键移动；滚轮、双指或加减键缩放'));
$('zoom-in').setAttribute('aria-label',t('Zoom in','放大'));$('zoom-out').setAttribute('aria-label',t('Zoom out','缩小'));
if(!zh)for(const [k,v] of Object.entries(GUIDE_CATEGORIES))v.name=categories[k]||k.replaceAll('_',' ');
let originals,service,episode,bundle,displayBundle,view,mode='scene',selected=null,route=null,nav=null,position=null,page=1,sequence=0,time=0,drawResult,frame=0,run=0,busy=false,lastReplan=null,toastTimer;
const safe=fn=>async()=>{try{await fn();}catch(e){notice(zh?e.message:(e.status==='no_route_in_map'?'No verified walking route is available.':e.status==='unavailable'?'Public localization is not connected.':'Unable to complete this operation. Reset the demo to try again.'));}};
function notice(s){$('status').textContent=s;$('status').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('status').hidden=true,5500);}
function call(name,args={}){const r=service.call({episode_id:episode.id,request_id:crypto.randomUUID(),tool_name:name,arguments:args});if(r.status!=='ok'){const e=Error(r.data.message);e.status=r.status;throw e;}return r.data;}
function size(){return {width:clamp(map.clientWidth,256,1600),height:clamp(map.clientHeight,256,1200)};}
function draw(){frame=0;if(!view)return;drawResult=renderMap(displayBundle,view,{route,position,selected});map.innerHTML=drawResult.svg;$('zoom-readout').textContent=drawResult.metres_per_css_pixel.toFixed(2)+' m/px';}
function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
function fit(bounds=bundle.bounds){view=fitBounds(bounds,size().width,size().height);schedule();}
function region(name){fit(({park:[-280,-1100,650,100],spring:[-270,-210,110,300],cocoon:[50,70,650,475]})[name]);document.querySelectorAll('[data-region]').forEach(b=>b.classList.toggle('active',b.dataset.region===name));}
function local(e){const r=map.getBoundingClientRect();return [(e.clientX-r.left)*view.width/r.width,(e.clientY-r.top)*view.height/r.height];}
function zoom(z,p=[view.width/2,view.height/2]){const old=unproject(p,view);view.zoom=clamp(z,L.minZoom,L.maxZoom);const next=unproject(p,view);view.center=[view.center[0]+old[0]-next[0],view.center[1]+old[1]-next[1]];schedule();}
function renderResults(){
 const q=$('search').value.trim().toLowerCase();const found=bundle.places.filter(p=>!q||[p.name,english(p.name),...(p.aliases||[])].some(n=>n.toLowerCase().includes(q)));
 page=Math.max(1,Math.min(page,Math.ceil(found.length/8)||1));$('results').replaceChildren();
 for(const p of found.slice((page-1)*8,page*8)){const b=document.createElement('button'),label=document.createElement('span'),note=document.createElement('small');label.textContent=zh?p.name:english(p.name);note.textContent=p.properties.reference_only?t('Guide reference · location unverified','导览参考 · 位置待核实'):t('Scene source · access unverified','场景源候选 · 通行待核实');b.append(label,note);b.dataset.place=p.public_id;b.onclick=()=>select(p.public_id);$('results').append(b);}
 if(!found.length){const p=document.createElement('p');p.textContent=t('No listed places match your search.','没有匹配的已收录地点。');$('results').append(p);}
 $('page').textContent=`${page} / ${Math.max(1,Math.ceil(found.length/8))}`;$('prev').disabled=page===1;$('next').disabled=page*8>=found.length;
}
function select(id){const p=call('map.place',{public_id:id});selected=id;$('detail').hidden=false;$('place-title').textContent=zh?p.name:english(p.name);$('place-id').textContent=p.public_id;
 $('place-note').textContent=p.properties.reference_only?t(`Guide reference with approximately ${p.properties.position_accuracy_m} m position uncertainty. Not a verified navigation endpoint.`,`导览参考，位置不确定范围约 ${p.properties.position_accuracy_m} 米，不能作为已验收导航端点。`):t('Source geometry is available. Entrances and walking connections still require scene validation.','已有场景源几何，入口和步行连接仍须现场核验。');
 view.center=[...p.point];view.zoom=Math.max(view.zoom,2.6);schedule();
}
function cancelPlayback(){run++;busy=false;$('walk').disabled=false;$('deviate').disabled=false;}
function init(nextMode){
 cancelPlayback();clearTimeout(toastTimer);$('status').hidden=true;mode=nextMode;bundle=structuredClone(originals[mode]);displayBundle=structuredClone(bundle);
 if(!zh){for(const collection of [displayBundle.places,displayBundle.features,displayBundle.regions])for(const p of collection)p.name=english(p.name);}
 service=new MapService(bundle);episode=service.createEpisode({position_source:mode==='demo'?'simulated_replay':'public_localization'});selected=route=nav=position=null;sequence=time=0;lastReplan=null;page=1;
 for(const id of ['detail','start-nav','nav-actions','navigation'])$(id).hidden=true;
 $('route-info').textContent='';$('browse').hidden=mode==='demo';$('demo-controls').hidden=mode!=='demo';$('regions').hidden=mode==='demo';$('search').value='';
 $('scene-mode').setAttribute('aria-pressed',mode==='scene');$('demo-mode').setAttribute('aria-pressed',mode==='demo');
 $('mode-note').textContent=mode==='scene'?t('74 public places across three districts. Walking connections await verification.','三个片区、74 处公共地点。步行连接仍待验收。'):t('An isolated navigation sandbox using the existing map engine.','使用既有地图引擎的独立导航演示。');
 $('mode-badge').textContent=mode==='scene'?t('PUBLIC GUIDE / VECTOR MAP','公共导览 / 矢量地图'):t('SYNTHETIC NAVIGATION DEMO','合成路网导航演示');
 $('map-legend').textContent=mode==='scene'?t('Hollow markers: guide references · Paths are unverified','空心标记：导览参考 · 步道待验收'):t('Simulated positions · No agent movement','模拟定位 · 不移动智能体');
 if(mode==='scene'){renderResults();region('park');}else{fit();publish([0,0],90);}
 document.body.dataset.ready='true';
}
function publish(p,heading=0,dt=2){sequence++;time+=dt;position=service.publishLocation(episode.id,{point:p,heading,accuracy_m:.3,position_time:time,as_of_sim_time:time,sequence,scene_hash:bundle.scene_hash,source:'simulated_replay'});if(nav){nav=call('map.navigation.status',{navigation_id:nav.navigation_id});if(nav.replan_event){lastReplan=nav.replan_event;if(nav.route)route=nav.route;}renderNav();}schedule();}
function renderRoute(){$('route-info').textContent=t(`${Math.round(route.length_m)} m · ~${Math.max(1,Math.round(route.estimated_walking_seconds/60))} min walking`,`${Math.round(route.length_m)} 米 · 约 ${Math.max(1,Math.round(route.estimated_walking_seconds/60))} 分钟步行`);}
function renderNav(){
 $('navigation').hidden=!nav;if(!nav)return;
 const next=nav.next_turn?.kind;
 $('instruction').textContent=nav.near_map_destination?t('Near destination','已到终点附近'):nav.location_uncertain?t('Check your location','请核实当前位置'):next==='left'?t('Turn left ahead','前方左转'):next==='right'?t('Turn right ahead','前方右转'):t('Continue to the destination','继续前往终点');
 $('remaining').textContent=t(`${Math.round(nav.remaining_route_distance_m)} m remaining · ${Math.round(nav.distance_to_turn_m)} m to next instruction`,`剩余 ${Math.round(nav.remaining_route_distance_m)} 米 · 距下一指示 ${Math.round(nav.distance_to_turn_m)} 米`);
 $('nav-status').textContent=nav.near_map_destination?t('Map proximity only; task outcome is not evaluated.','仅表示接近地图终点，不代表任务通过。'):lastReplan?.status==='ok'?t('Route replanned after deviation.','偏航后路线已重新规划。'):t('Navigation guidance from simulated position updates.','根据模拟位置更新提供导航指引。');
 renderRoute();
}
function plan(){cancelPlayback();if(nav)call('map.navigation.stop',{navigation_id:nav.navigation_id});nav=null;$('navigation').hidden=true;$('nav-actions').hidden=true;route=call('map.route',{origin:'current',destination:'demo-end',mode:'walking'});renderRoute();$('start-nav').hidden=false;fit();}
function start(){nav=call('map.navigation.start',{route_id:route.route_id});$('start-nav').hidden=true;$('nav-actions').hidden=false;renderNav();schedule();}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function walk(){if(!nav||busy)return;busy=true;const id=++run;$('walk').disabled=$('deviate').disabled=true;const points=[position.point,...route.polyline.slice(1)];try{for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],steps=Math.ceil(distance(a,b)/3);for(let j=1;j<=steps;j++){if(id!==run||!nav)return;publish([a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps],(Math.atan2(b[0]-a[0],b[1]-a[1])*180/Math.PI+360)%360);await delay(100);}}}finally{if(id===run){busy=false;$('walk').disabled=$('deviate').disabled=false;}}}
async function deviate(){if(!nav||busy)return;cancelPlayback();init('demo');plan();start();busy=true;const id=++run;$('walk').disabled=$('deviate').disabled=true;try{for(const p of [[0,15],[0,30],[0,45]]){if(id!==run)return;publish(p,0,6);await delay(550);}}finally{if(id===run){busy=false;$('walk').disabled=$('deviate').disabled=false;}}}
function stop(){cancelPlayback();if(nav)call('map.navigation.stop',{navigation_id:nav.navigation_id});nav=null;$('navigation').hidden=true;$('nav-actions').hidden=true;$('start-nav').hidden=!route;}
$('scene-mode').onclick=()=>init('scene');$('demo-mode').onclick=()=>init('demo');$('reset-demo').onclick=()=>init('demo');
$('plan-route').onclick=safe(plan);$('start-nav').onclick=safe(start);$('walk').onclick=safe(walk);$('deviate').onclick=safe(deviate);$('stop').onclick=safe(stop);
$('search').oninput=()=>{page=1;renderResults();};$('prev').onclick=()=>{page--;renderResults();};$('next').onclick=()=>{page++;renderResults();};$('close-detail').onclick=()=>{selected=null;$('detail').hidden=true;schedule();};
$('zoom-in').onclick=()=>zoom(view.zoom+.5);$('zoom-out').onclick=()=>zoom(view.zoom-.5);$('fit').onclick=()=>fit();
for(const b of document.querySelectorAll('[data-region]'))b.onclick=()=>region(b.dataset.region);
$('export-svg').onclick=()=>{const blob=new Blob([drawResult.svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`CityAgentBench-${mode}-map.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
map.addEventListener('wheel',e=>{e.preventDefault();if(view)zoom(view.zoom-e.deltaY*.002,local(e));},{passive:false});
map.addEventListener('dblclick',e=>{if(view)zoom(view.zoom+.7,local(e));});
const pointers=new Map();let gesture,moved=false;
map.addEventListener('pointerdown',e=>{if(!view)return;map.setPointerCapture(e.pointerId);pointers.set(e.pointerId,local(e));gesture={view:structuredClone(view),points:[...pointers.values()]};moved=false;});
map.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,local(e));const points=[...pointers.values()];if(!gesture||points.length!==gesture.points.length)return;
 if(points.length===1){const a=unproject(gesture.points[0],gesture.view),b=unproject(points[0],gesture.view);if(distance(points[0],gesture.points[0])>4)moved=true;view.center=[gesture.view.center[0]+a[0]-b[0],gesture.view.center[1]+a[1]-b[1]];}
 else if(points.length===2){moved=true;const mid=p=>[(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2],old=unproject(mid(gesture.points),gesture.view);view.zoom=clamp(gesture.view.zoom+Math.log2(distance(points[0],points[1])/Math.max(1,distance(gesture.points[0],gesture.points[1]))),L.minZoom,L.maxZoom);const now=unproject(mid(points),view);view.center=[view.center[0]+old[0]-now[0],view.center[1]+old[1]-now[1]];}schedule();});
function release(e){if(!pointers.has(e.pointerId))return;const p=local(e),click=!moved&&pointers.size===1;pointers.delete(e.pointerId);gesture=pointers.size?{view:structuredClone(view),points:[...pointers.values()]}:null;if(click&&mode==='scene'){const hit=drawResult.hits.find(h=>p[0]>=h.box[0]&&p[0]<=h.box[2]&&p[1]>=h.box[1]&&p[1]<=h.box[3]);if(hit){if(hit.members.length>1)zoom(view.zoom+1,p);else select(hit.id);}}}
map.addEventListener('pointerup',release);map.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);gesture=null;});
map.addEventListener('keydown',e=>{if(!view)return;const d=drawResult.metres_per_css_pixel*60,delta={ArrowLeft:[-d,0],ArrowRight:[d,0],ArrowUp:[0,d],ArrowDown:[0,-d]}[e.key];if(delta){e.preventDefault();view.center=view.center.map((v,i)=>v+delta[i]);schedule();}else if(e.key==='+'||e.key==='=')zoom(view.zoom+.4);else if(e.key==='-')zoom(view.zoom-.4);else if(e.key==='Home')fit();});
new ResizeObserver(()=>{if(view){Object.assign(view,size());schedule();}}).observe(map);
window.addEventListener('pagehide',cancelPlayback);
window.navigationDiagnostics=()=>({mode,view,route,nav,position,lastReplan,ready:!!service,busy,sceneEdgeCount:originals?.scene.graph.edges.length,language:zh?'zh':'en'});
try{const [scene,demo]=await Promise.all(['scene-v0.2','synthetic-demo-v0.1'].map(async name=>{const r=await fetch(`data/${name}.json`);if(!r.ok)throw Error('Missing local map data');return r.json();}));originals={scene,demo};init('scene');}catch(e){$('status').textContent=t('The local map could not load. Serve the complete site over HTTP and retry.','本地地图加载失败。请通过 HTTP 打开完整网站后重试。');}
