#!/usr/bin/env python3
import json, re, html as htmlmod, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

FEEDS = [
    ("NRK","news","https://www.nrk.no/nyheter/siste.rss"),
    ("TV 2","news","https://www.tv2.no/rss/nyheter"),
    ("TV 2 Sport","sport","https://www.tv2.no/rss/sport"),
    ("Nettavisen","news","https://www.nettavisen.no/service/rich-rss?tag=nyheter"),
    ("Nettavisen Sport","sport","https://www.nettavisen.no/service/rich-rss?tag=sport"),
    ("Dagbladet","news","https://www.dagbladet.no/?lab_viewport=rss"),
    ("E24","money","https://e24.no/rss2/"),
    ("Gamereactor","games","https://www.gamereactor.no/rss/rss.php?texttype=%5B4%2C1%2C2%2C3%2C5%2C9%2C10%2C7%2C8%2C11%5D"),
]

UA="Mozilla/5.0 (BatmanStartside/1.0; personal RSS reader)"
NS_MEDIA="{http://search.yahoo.com/mrss/}"
NS_CONTENT="{http://purl.org/rss/1.0/modules/content/}"

def txt(el, names):
    for name in names:
        x=el.find(name)
        if x is not None and x.text:
            return x.text.strip()
    return ""

def iso_date(s):
    if not s: return ""
    try:
        d=parsedate_to_datetime(s)
        if d.tzinfo is None: d=d.replace(tzinfo=timezone.utc)
        return d.astimezone(timezone.utc).isoformat()
    except Exception:
        try:
            d=datetime.fromisoformat(s.replace("Z","+00:00"))
            if d.tzinfo is None: d=d.replace(tzinfo=timezone.utc)
            return d.astimezone(timezone.utc).isoformat()
        except Exception:
            return ""

def image_from(item, description):
    for tag in (NS_MEDIA+"content", NS_MEDIA+"thumbnail", "enclosure"):
        for x in item.findall(".//"+tag):
            u=x.attrib.get("url","")
            typ=x.attrib.get("type","")
            if u and (tag!="enclosure" or not typ or typ.startswith("image/")):
                return u
    m=re.search(r'<img[^>]+src=["\']([^"\']+)', description or "", re.I)
    return htmlmod.unescape(m.group(1)) if m else ""

def fetch_one(source, cat, url):
    req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"application/rss+xml, application/xml, text/xml, */*"})
    with urllib.request.urlopen(req,timeout=25) as r:
        raw=r.read()
    root=ET.fromstring(raw)
    out=[]
    # RSS
    rss_items=root.findall(".//item")
    if rss_items:
        for it in rss_items[:20]:
            title=txt(it,["title"])
            link=txt(it,["link"])
            desc=txt(it,["description",NS_CONTENT+"encoded"])
            date=txt(it,["pubDate","date","{http://purl.org/dc/elements/1.1/}date"])
            if title and link:
                out.append({"source":source,"cat":cat,"title":htmlmod.unescape(re.sub("<[^>]+>","",title)),
                            "link":link,"pubDate":iso_date(date),"image":image_from(it,desc)})
        return out
    # Atom
    for it in root.findall(".//{http://www.w3.org/2005/Atom}entry")[:20]:
        title=txt(it,["{http://www.w3.org/2005/Atom}title"])
        link=""
        for l in it.findall("{http://www.w3.org/2005/Atom}link"):
            if l.attrib.get("rel","alternate")=="alternate":
                link=l.attrib.get("href",""); break
        date=txt(it,["{http://www.w3.org/2005/Atom}published","{http://www.w3.org/2005/Atom}updated"])
        if title and link:
            out.append({"source":source,"cat":cat,"title":htmlmod.unescape(re.sub("<[^>]+>","",title)),
                        "link":link,"pubDate":iso_date(date),"image":""})
    return out

all_items=[]
status={}
for source,cat,url in FEEDS:
    try:
        rows=fetch_one(source,cat,url)
        all_items.extend(rows)
        status[source]={"ok":True,"count":len(rows)}
    except Exception as e:
        status[source]={"ok":False,"error":str(e)[:180]}

# de-duplicate, newest first
seen=set(); clean=[]
for x in sorted(all_items,key=lambda x:x.get("pubDate",""),reverse=True):
    key=(x.get("link") or x.get("title","")).strip()
    if not key or key in seen: continue
    seen.add(key); clean.append(x)

payload={
    "updated_at":datetime.now(timezone.utc).isoformat(),
    "items":clean[:100],
    "sources":status
}
with open("news.json","w",encoding="utf-8") as f:
    json.dump(payload,f,ensure_ascii=False,indent=2)
print(f"Wrote {len(clean[:100])} articles")
