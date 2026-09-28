export const GUIDE_CATEGORIES=Object.freeze({
 all:{name:'全部地点',icon:'compass',color:'#22756a'},
 scenic:{name:'景点广场',icon:'tree',color:'#368257'},
 culture:{name:'文化艺术',icon:'museum',color:'#956642'},
 nature:{name:'草坪水岸',icon:'leaf',color:'#648747'},
 recreation:{name:'运动亲子',icon:'ball',color:'#c06a8c'},
 toilet:{name:'卫生间',icon:'wc',color:'#617dab'},
 water_station:{name:'饮水点',icon:'drop',color:'#2787ad'},
 parking:{name:'停车场',icon:'parking',color:'#4f7eba'},
 entrance:{name:'出入口',icon:'gate',color:'#5e7e88'},
 rest:{name:'休憩凉亭',icon:'bench',color:'#9c794d'},
 service:{name:'公共服务',icon:'info',color:'#617c96'},
 landmark:{name:'地标建筑',icon:'building',color:'#727aa3'},
 district:{name:'片区',icon:'compass',color:'#42665d'},
 road:{name:'道路桥梁',icon:'road',color:'#7d8e93'},
 infrastructure:{name:'基础设施',icon:'building',color:'#8d9899'}
});
export const categoryFor=p=>p.properties?.guide_category||({building:'landmark',water:'nature',path:'scenic'}[p.category]||p.category);
export const categoryInfo=p=>GUIDE_CATEGORIES[typeof p==='string'?p:categoryFor(p)]||GUIDE_CATEGORIES.all;
const paths={
 tree:'<path d="M12 3 6 11h3l-4 6h14l-4-6h3L12 3Zm0 14v4"/>',
 leaf:'<path d="M20 4C8 2 3 8 5 15s15 6 15-11ZM6 18 16 8M10 14h5"/>',
 museum:'<path d="m3 8 9-5 9 5H3Zm2 2v8m5-8v8m4-8v8m5-8v8M3 21h18"/>',
 ball:'<circle cx="12" cy="12" r="9"/><path d="m9 8 6 0 2 5-5 4-5-4 2-5Zm0 0L7 4m8 4 2-4m0 9 4 1m-9 3v4m-5-8-4 1"/>',
 wc:'<circle cx="7" cy="5" r="1.5"/><circle cx="17" cy="5" r="1.5"/><path d="M7 9v12m-3-7V9h6v5m7-5-4 8h8l-4-8Zm-2 8v4m4-4v4"/>',
 drop:'<path d="M12 3c-2 5-7 9-7 12a7 7 0 0 0 14 0c0-3-5-7-7-12ZM9 16c0 2 1 3 3 3"/>',
 parking:'<path d="M8 21V4h5a5 5 0 0 1 0 10H8"/>',
 gate:'<path d="M4 21V4h11v17M2 21h15m-6-9h10m-3-3 3 3-3 3"/>',
 bench:'<path d="M5 4h14v8H5V4Zm-2 9v3h18v-3M6 16v5m12-5v5M5 8h14"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v7m0-12v1"/>',
 building:'<path d="M5 21V5l14-3v19M2 21h20M9 7v2m5-3v2m-5 4v2m5-3v2m-5 4v2m5-3v2"/>',
 road:'<path d="m7 3-3 18M17 3l3 18M12 3v3m0 3v4m0 3v5"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m16 7-2 7-7 3 3-7 6-3Z"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 arrow:'<path d="M3 12h17m-6-6 6 6-6 6"/>',
 layers:'<path d="m12 3 10 6-10 6L2 9l10-6ZM3 14l9 5 9-5M3 18l9 5 9-5"/>',
 location:'<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>',
 expand:'<path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>'
};
export function iconSvg(name,size=20){return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.compass}</svg>`;}
export function markerGlyph(name,x,y,size=15,color='white'){return `<g transform="translate(${x-size/2},${y-size/2}) scale(${size/24})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.compass}</g>`;}
