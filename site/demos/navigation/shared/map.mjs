import {categoryFor,categoryInfo,markerGlyph} from './guide.mjs';
export const STYLE_VERSION='bay-guide-v2';
export const LIMITS=Object.freeze({minZoom:-1,maxZoom:7,minWidth:256,maxWidth:1600,minHeight:256,maxHeight:1200,pageSize:12,maxRadius:3000,routePoints:4096,toolBudget:800,replanBudget:20,grid:1,accuracy:1,offEnter:9,offExit:5,offObservations:3,cooldown:15,near:6,speed:1.3,maxSnap:4,maxAge:10});
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export const mppForZoom=z=>8/2**z;
export const zoomForMpp=m=>Math.log2(8/m);
export function inRing(p,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function inGeometry(p,g){const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;return polys.some(poly=>inRing(p,poly[0])&&!poly.slice(1).some(r=>inRing(p,r)));}
export function fitBounds(bounds,width,height){const [x0,y0,x1,y1]=bounds;return {center:[(x0+x1)/2,(y0+y1)/2],zoom:clamp(zoomForMpp(Math.max((x1-x0)/width,(y1-y0)/height)*1.15),LIMITS.minZoom,LIMITS.maxZoom),width,height,bearing:0};}
export function project(p,v){const a=(v.bearing||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),m=mppForZoom(v.zoom),dx=p[0]-v.center[0],dy=p[1]-v.center[1];return[v.width/2+(dx*c-dy*s)/m,v.height/2-(dx*s+dy*c)/m];}
export function unproject(p,v){const a=(v.bearing||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),m=mppForZoom(v.zoom),dx=(p[0]-v.width/2)*m,dy=-(p[1]-v.height/2)*m;return[v.center[0]+dx*c+dy*s,v.center[1]-dx*s+dy*c];}
export function viewport(v){const corners=[[0,0],[v.width,0],[v.width,v.height],[0,v.height]].map(p=>unproject(p,v));return {center:v.center,zoom:v.zoom,bearing:v.bearing||0,width:v.width,height:v.height,corners,bounds:[Math.min(...corners.map(p=>p[0])),Math.min(...corners.map(p=>p[1])),Math.max(...corners.map(p=>p[0])),Math.max(...corners.map(p=>p[1]))],metres_per_css_pixel:mppForZoom(v.zoom)};}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n.toFixed(1));
function path(g,v){let lines,closed=false;if(g.type==='Polygon'){lines=g.coordinates;closed=true;}else if(g.type==='MultiPolygon'){lines=g.coordinates.flat();closed=true;}else if(g.type==='LineString')lines=[g.coordinates];else if(g.type==='MultiLineString')lines=g.coordinates;else return '';
return lines.map(line=>line.map((p,i)=>{let [x,y]=project(p,v);return `${i?'L':'M'}${num(x)} ${num(y)}`;}).join('')+(closed?'Z':'')).join('');}
const geomBounds=new WeakMap();
function bounds(g){if(geomBounds.has(g))return geomBounds.get(g);let xs=[],ys=[];const visit=x=>{if(typeof x[0]==='number'){xs.push(x[0]);ys.push(x[1]);}else x.forEach(visit);};visit(g.coordinates);const b=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];geomBounds.set(g,b);return b;}
const palettes={district:['#e7efde','#cedac5'],green:['#c5dfa8','#b5d09b'],water:['#a3d8e4','#8bc6d6'],building:['#e3e7ed','#b6c0cc'],plaza:['#f3ecdb','#dbd2bd'],road_area:['#f9faf6','#c6cecc'],road:['none','#ffffff'],path:['none','#fffdf3']};
export function renderMap(bundle,v,{route=null,position=null,selected=null,poi_category='all',layers=['district','green','water','road_area','road','plaza','building','path','poi']}={}){
 const mpp=mppForZoom(v.zoom),vb=viewport(v).bounds,parts=[],hits=[],boxes=[],visible=[];
 const visibleGeo=g=>{const b=bounds(g);return !(b[2]<vb[0]||b[0]>vb[2]||b[3]<vb[1]||b[1]>vb[3]);};
 const border=path(bundle.coverage,v);
 parts.push(`<defs><pattern id="outside" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M0 20L20 0" stroke="#d6e0e1" stroke-width=".6"/></pattern><clipPath id="cover"><path d="${border}" fill-rule="evenodd"/></clipPath></defs><rect width="100%" height="100%" fill="#eaf0ef"/><rect width="100%" height="100%" fill="url(#outside)"/><path d="${border}" fill="#e7efde" fill-rule="evenodd" stroke="#bdcdbf" stroke-dasharray="5 6"/><g clip-path="url(#cover)">`);
 const order=['district','green','water','road_area','road','plaza','building','path'];
 for(const category of order){if(!layers.includes(category))continue;for(const f of bundle.features){if(f.category!==category||f.geometry.type==='Point'||!visibleGeo(f.geometry))continue;
 const alpha=clamp((v.zoom-(f.min_zoom??0)+.65)/.65,0,1);if(!alpha)continue;
 const [fill,stroke]=palettes[category];const line=category==='road'||category==='path';let width=line?clamp((f.properties.width_m||3)/mpp,category==='path'?1.5:3,30):.8;
 const d=path(f.geometry,v);
 if(category==='building'&&v.zoom>2)parts.push(`<path d="${d}" transform="translate(2,3)" fill="#8d9da9" fill-opacity=".12"/>`);
 if(line)parts.push(`<path d="${d}" fill="none" stroke="${category==='road'?'#b9c6c9':'#abb99f'}" stroke-width="${num(width+1.8)}" opacity="${alpha}" stroke-linejoin="round" stroke-linecap="round"/>`);
 parts.push(`<path d="${d}" fill="${fill}" fill-rule="evenodd" stroke="${stroke}" stroke-width="${num(width)}" opacity="${alpha}" stroke-linejoin="round" stroke-linecap="round"/>`);
 }}parts.push('</g>');
 if(route){const d=path({type:'LineString',coordinates:route.polyline},v);parts.push(`<path d="${d}" fill="none" stroke="white" stroke-width="10" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#237def" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`);for(const [i,p] of [route.polyline[0],route.polyline.at(-1)].entries()){const[x,y]=project(p,v);parts.push(`<circle cx="${x}" cy="${y}" r="8" fill="${i?'#ea7860':'#237def'}" stroke="white" stroke-width="3"/>`);boxes.push([x-12,y-12,x+12,y+12]);}}
 const selectedPlace=bundle.places.find(p=>p.public_id===selected);
 if(selectedPlace?.properties.reference_only){const[x,y]=project(selectedPlace.point,v),r=selectedPlace.properties.position_accuracy_m/mpp;parts.push(`<circle cx="${x}" cy="${y}" r="${num(r)}" fill="#b87948" fill-opacity=".06" stroke="#a27c53" stroke-dasharray="4 5" stroke-opacity=".55"/>`);}
 const candidates=[],byId=new Map(bundle.features.map(f=>[f.public_id,f]));
 if(layers.includes('poi'))for(const p of bundle.places){const f=byId.get(p.public_id);if(!f)continue;const chosen=p.public_id===selected,category=categoryFor(p);if(poi_category!=='all'&&category!==poi_category&&!chosen&&!['district','road','water'].includes(p.category))continue;
 const min=f.category==='district'? -1:(f.min_zoom??0);const alpha=chosen?1:clamp((v.zoom-min+.3)/.5,0,1);if(!alpha)continue;const[x,y]=project(p.point,v);if(x<10||y<40||x>v.width-20||y>v.height-65)continue;candidates.push({p,x,y,alpha,priority:chosen?1000:f.priority||20,chosen,category});}
 candidates.sort((a,b)=>b.priority-a.priority||a.p.public_id.localeCompare(b.p.public_id));
 const clusters=[];
 for(const c of candidates){const prev=!c.chosen&&c.priority<65&&v.zoom<2&&clusters.find(o=>o.category===c.category&&o.priority<65&&Math.hypot(o.x-c.x,o.y-c.y)<28);if(prev){prev.members.push(c.p.public_id);continue;}clusters.push({...c,members:[c.p.public_id]});}
 const roadNames=new Set();
 const collides=b=>boxes.some(a=>!(a[2]+6<b[0]||a[0]-6>b[2]||a[3]+5<b[1]||a[1]-5>b[3]));
 for(const c of clusters){const info=categoryInfo(c.p),isArea=c.p.category==='district'||c.p.category==='water',isRoad=c.category==='road';
 if(isRoad&&roadNames.has(c.p.name))continue;
 const text=c.members.length>1?`${info.name} · ${c.members.length}`:c.p.name,font=isArea?17:isRoad?11:12.5;
 const w=Math.max(40,Array.from(text).reduce((n,ch)=>n+(ch.charCodeAt(0)<128?.6:1),0)*font)+(isArea||isRoad?8:31),h=isArea?30:28;
 let b,tx,ty,side;
 const options=isArea||isRoad?[[c.x-w/2,c.y-h/2,0]]:[[c.x-12,c.y-h/2,1],[c.x-w+12,c.y-h/2,-1],[c.x-w/2,c.y-43,0],[c.x-w/2,c.y+17,0]];
 for(const [x,y,s]of options){const box=[x,y,x+w,y+h];if(box[0]<4||box[2]>v.width-4||box[1]<3||box[3]>v.height-58||collides(box))continue;b=box;side=s;break;}
 if(!b)continue;boxes.push(b);if(isRoad)roadNames.add(c.p.name);visible.push(c.p.public_id);hits.push({box:b,id:c.p.public_id,members:c.members,point:c.p.point});
 const color=c.chosen?'#174d48':info.color,ref=c.p.properties.reference_only;
 parts.push(`<g opacity="${c.alpha}" data-place="${esc(c.p.public_id)}">`);
 if(isArea||isRoad){parts.push(`<text x="${num((b[0]+b[2])/2)}" y="${num(c.y+5)}" text-anchor="middle" fill="${c.p.category==='water'?'#4b91a8':color}" font-size="${font}" font-weight="${isArea?'600':'400'}" stroke="#ffffff" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${esc(text)}</text>`);}
 else{
 const cy=(b[1]+b[3])/2,cx=side===-1?b[2]-12:b[0]+12;
 if(side===0)parts.push(`<path d="M${num(c.x)} ${num(c.y)}L${num(cx)} ${num(cy)}" stroke="${color}" stroke-opacity=".4"/>`);
 if(c.chosen)parts.push(`<rect x="${num(b[0]-3)}" y="${num(b[1]-3)}" width="${num(w+6)}" height="${h+6}" rx="9" fill="#164e48"/>`);
 parts.push(`<circle cx="${num(cx)}" cy="${num(cy)}" r="11" fill="${ref?'#fffdf7':color}" stroke="${c.chosen?'#b4d6c6':ref?color:'white'}" stroke-width="2"${ref?' stroke-dasharray="3 1.3"':''}/>${markerGlyph(info.icon,cx,cy,14,ref?color:'white')}`);
 tx=side===-1?b[0]+2:b[0]+29;ty=cy+4.5;
 parts.push(`<text x="${num(tx)}" y="${num(ty)}" fill="${c.chosen?'white':color}" font-size="${font}" font-weight="500"${c.chosen?'':' stroke="#ffffff" stroke-width="3.5" paint-order="stroke" stroke-linejoin="round"'}>${esc(text)}</text>`);
 }parts.push('</g>');}
 if(position){const[x,y]=project(position.point,v),r=clamp(position.accuracy_m/mpp,8,150);parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#3280f5" fill-opacity=".13" stroke="#3280f5" stroke-opacity=".2"/>`);if(position.heading!=null)parts.push(`<path d="M${x-6} ${y-14}L${x} ${y-27}L${x+6} ${y-14}Z" fill="#287af3" transform="rotate(${position.heading-(v.bearing||0)},${x},${y})"/>`);parts.push(`<circle cx="${x}" cy="${y}" r="7" fill="#287af3" stroke="white" stroke-width="3"/>`);}
 const scale=2**Math.floor(Math.log2(mpp*95)),scalePx=scale/mpp;
 parts.push(`<rect x="14" y="${v.height-50}" width="${scalePx+22}" height="36" rx="7" fill="white" fill-opacity=".9"/><path d="M24 ${v.height-30}v6h${scalePx}v-6" stroke="#46645f" fill="none"/><text x="24" y="${v.height-34}" font-size="10" fill="#46645f">${scale>=1000?scale/1000+' km':scale+' m'}</text><text x="${v.width-22}" y="26" text-anchor="middle" font-size="12" fill="#244e43">N</text><path d="M${v.width-27} 42l5 -10l5 10Z" fill="#244e43" transform="rotate(${-v.bearing||0},${v.width-22},37)"/>`);
 const level=mpp>=4?'G0':mpp>=2?'G1':mpp>=.7?'G2':mpp>=.25?'G3':mpp>=.1?'G4':'G5';
 return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${v.width}" height="${v.height}" viewBox="0 0 ${v.width} ${v.height}" style="font-family:MapSans,'Noto Sans CJK SC',sans-serif">${parts.join('')}</svg>`,hits,visible_labels:visible,level,scale_m:scale,metres_per_css_pixel:mpp,actual_viewport:viewport(v),legend:['实心图标：场景源候选','空心图标：导览参考，位置/场景对应未核验','候选步道不承诺通行','斜纹：当前场景范围外']};
}
