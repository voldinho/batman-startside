
function tick(){const d=new Date();clock.textContent=d.toLocaleTimeString('no-NO',{hour:'2-digit',minute:'2-digit'});date.textContent=d.toLocaleDateString('no-NO',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}tick();setInterval(tick,1000);
const wt=c=>c===0?'Klart':c<=3?'Delvis skyet':c<=48?'Tåke':c<=57?'Yr':c<=67?'Regn':c<=77?'Snø':c<=82?'Regnbyger':c<=86?'Snøbyger':'Torden';
const wi=c=>c===0?'☀️':c<=3?'⛅':c<=48?'🌫️':c<=67?'🌧️':c<=77?'🌨️':c<=82?'🌦️':c<=86?'🌨️':'⛈️';
async function weather(){try{const u='https://api.open-meteo.com/v1/forecast?latitude=58.8524&longitude=5.7352&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FOslo&forecast_days=5';const d=await(await fetch(u)).json();wtemp.textContent=Math.round(d.current.temperature_2m)+'°';wicon.textContent=wi(d.current.weather_code);wdesc.textContent=wt(d.current.weather_code)+' · Føles '+Math.round(d.current.apparent_temperature)+'° · Vind '+Math.round(d.current.wind_speed_10m)+' km/t';forecast.innerHTML=d.daily.time.map((x,i)=>`<div class="fday"><b>${new Date(x+'T12:00').toLocaleDateString('no-NO',{weekday:'short'})}</b><div style="font-size:22px">${wi(d.daily.weather_code[i])}</div>${Math.round(d.daily.temperature_2m_max[i])}° / ${Math.round(d.daily.temperature_2m_min[i])}°<div>💧${d.daily.precipitation_probability_max[i]??0}%</div></div>`).join('')}catch(e){wdesc.textContent='Værdata utilgjengelig akkurat nå'}}weather();

const feeds=[
['NRK','news','https://www.nrk.no/nyheter/siste.rss'],
['TV 2','news','https://www.tv2.no/rss/nyheter'],
['TV 2 Sport','sport','https://www.tv2.no/rss/sport'],
['Nettavisen','news','https://www.nettavisen.no/service/rich-rss?tag=nyheter'],
['Nettavisen Sport','sport','https://www.nettavisen.no/service/rich-rss?tag=sport'],
['Dagbladet','news','https://www.dagbladet.no/?lab_viewport=rss'],
['E24','money','https://e24.no/rss2/'],
['Gamereactor','games','https://www.gamereactor.no/rss/']
];
const sourcePages=[
['Sandnesposten','local','https://www.sandnesposten.no','Lokale nyheter fra Sandnes'],
['Tidens Krav','local','https://www.tk.no','Siste nytt fra Tidens Krav'],
['VG','news','https://www.vg.no','Siste nytt fra VG'],
['Tek.no','games','https://www.tek.no','Teknologi fra Tek.no'],
['Gamer.no','games','https://www.gamer.no','Spillnyheter fra Gamer.no'],
['Dine Penger','money','https://www.dinepenger.no','Personlig økonomi fra Dine Penger']
];
function imgOf(i){return i.thumbnail||i.enclosure?.link||i.enclosure?.url||((i.description||'').match(/<img[^>]+src=["']([^"']+)/i)||[])[1]||''}
function safe(s){return (s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
async function fetchFeed(f){try{const r=await fetch('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(f[2]));const d=await r.json();return(d.items||[]).slice(0,7).map(x=>({...x,source:f[0],cat:f[1],image:imgOf(x)}))}catch(e){return[]}}
function visual(i,h='card'){const image=i.image?`<img src="${i.image}" loading="lazy" onerror="this.outerHTML='<div class=&quot;fallback&quot;>📰</div>'">`:`<div class="fallback">📰</div>`;if(h==='hero')return `<a href="${i.link}" target="_blank" rel="noopener">${image}<div class="heroOverlay"><div class="source">${safe(i.source)}</div><div class="heroTitle">${safe(i.title)}</div></div></a>`;if(h==='side')return `<a href="${i.link}" target="_blank" rel="noopener">${image}<div class="sidebody"><div class="source">${safe(i.source)}</div><div class="sidetitle">${safe(i.title)}</div></div></a>`;return `<article class="newsCard" data-cat="${i.cat}"><a href="${i.link}" target="_blank" rel="noopener">${image}<div class="cardbody"><div class="source">${safe(i.source)}</div><div class="cardtitle">${safe(i.title)}</div><div class="cardtime">${i.pubDate?new Date(i.pubDate).toLocaleString('no-NO'):''}</div></div></a></article>`}
let items=[];
async function load(){for(const f of feeds)items.push(...await fetchFeed(f));items.sort((a,b)=>new Date(b.pubDate||0)-new Date(a.pubDate||0));
sourcePages.forEach(s=>items.push({source:s[0],cat:s[1],link:s[2],title:s[3],image:'',pubDate:''}));
const withImages=items.filter(x=>x.image), top=(withImages.length>=3?withImages:items).slice(0,3);hero.innerHTML=visual(top[0]||items[0],'hero');sideStack.innerHTML=(top.slice(1,3)).map(x=>`<div class="sidecard">${visual(x,'side')}</div>`).join('');const used=new Set(top.map(x=>x.link));cards.innerHTML=items.filter(x=>!used.has(x.link)).map(x=>visual(x)).join('');}
load();
function filter(cat){document.querySelectorAll('.newsCard').forEach(c=>c.classList.toggle('hidden',cat!=='all'&&c.dataset.cat!==cat))}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter(b.dataset.cat)});

document.addEventListener('error', function(e){
  if(e.target && e.target.tagName === 'IMG'){
    const d=document.createElement('div');
    d.className='fallback';
    d.textContent='📰';
    e.target.replaceWith(d);
  }
}, true);
