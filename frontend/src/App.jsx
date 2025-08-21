// Force rebuild
import React, { useEffect, useMemo, useState } from 'react'
import YandexMap from './YandexMap'
import { Upload, FileSpreadsheet, FileDown, BarChart3, Loader2, Download } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'


const PALETTE = ['#2563eb','#16a34a','#dc2626','#f59e0b','#7c3aed','#0891b2','#e11d48','#84cc16','#a855f7','#0ea5e9','#f97316','#10b981'];
function colorForCategory(name){
  if(!name) return '#6b7280';
  let h = 0; for (let i=0;i<name.length;i++) h = (h*31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const API_BASE = (typeof window !== 'undefined' && window.AI_DOVERIE_API_BASE) || '/api'

async function fetchJSON(url, options={}){
  const resp = await fetch(url, options)
  const ct = resp.headers.get('content-type') || ''
  if (ct.includes('application/json')){
    const data = await resp.json()
    if (!resp.ok) throw new Error(data?.detail || data?.error || ('HTTP '+resp.status))
    return data
  }
  const text = await resp.text()
  throw new Error('Ожидался JSON, но получен контент: ' + text.slice(0,180) + '...')
}

const apiGet  = (p)=>fetchJSON(API_BASE+p,{headers:{}})
const apiPostJSON=(p,body)=>fetchJSON(API_BASE+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
const apiUpload=(p,form)=>fetchJSON(API_BASE+p,{method:'POST',body:form})

function ErrorNote({error}){ if(!error) return null; return <div className="badge err" style={{display:'block'}}>{String(error.message||error)}</div> }

const MUNICIPALITIES_FALLBACK = [ { id:4, name:'Люберцы' } ]


function backendOrigin(){
  const base = API_BASE || '';
  const m = base.match(/^(https?:\/\/[^/]+)(?:\/api)?/i);
  return m ? m[1] : '';
}
function absApiUrlMaybe(u){
  if(!u) return u;
  if(/^https?:\/\//i.test(u)) return u;
  const origin = backendOrigin();
  if(u.startsWith('/api/')) return origin + u;
  if(u.startsWith('/')) return origin + u; // just in case
  return origin + '/api/' + u.replace(/^\/?/, '');
}

export default function App(){
  const [municipalities, setMunicipalities] = useState(MUNICIPALITIES_FALLBACK)
  const [mId, setMId] = useState(4)
  const [files, setFiles] = useState([])
  const [uploadRes, setUploadRes] = useState(null)

  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'analytics' | 'plans'
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  const [analytics, setAnalytics] = useState(null)
  const [plans, setPlans] = useState([])
  const [openAiApiKey, setOpenAiApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(()=>{ (async()=>{
    try{ const data = await apiGet('/appeals/municipalities'); setMunicipalities(data.items||MUNICIPALITIES_FALLBACK) }catch(e){ /* fallback */ }
    try{ const a = await apiGet('/appeals/analytics?municipality_id='+mId); setAnalytics(a) }catch(e){}
    try{ const p = await apiGet('/appeals/plans?municipality_id='+mId); setPlans(p.items||[]) }catch(e){}
  })() }, [mId])

  const handleUpload = async ()=>{
    setLoading(true); setError(null)
    const form = new FormData()
    files.forEach(f=>form.append('files', f))
    form.append('municipality_id', String(mId))
    try{
      const res = await apiUpload('/appeals/upload', form)
      setUploadRes(res)
      const a = await apiGet('/appeals/analytics?municipality_id='+mId); setAnalytics(a)
    }catch(e){ setError(e) }finally{ setLoading(false) }
  }

  const handleGeneratePlan = async (category)=>{
    setLoading(true); setError(null)
    try{
      const payload = { municipality_id: mId, openai_api_key: openAiApiKey };
      const res = await apiPostJSON('/appeals/generate-plan/'+encodeURIComponent(category), payload)
      const refreshed = await apiGet('/appeals/plans?municipality_id='+mId)
      setPlans(refreshed.items||[])
    }catch(e){ setError(e) }finally{ setLoading(false) }
  }

  return <div className="container">
    <header className="row" style={{justifyContent:'space-between', marginBottom:16}}>
      <div className="row" style={{gap:10}}>
        <div className="badge">AI-ДОВЕРИЕ</div>
        <div className="muted">Платформа управленческой повестки</div>
      </div>
      <div className="row" style={{gap:8}}>
        <div className="badge">Люберцы</div>
      </div>
    </header>

    <ErrorNote error={error} />

    
    
    <div className="row" style={{gap:8, marginBottom:12}}>
      <button className={"btn " + (activeTab==='upload'?'primary':'')} onClick={()=>setActiveTab('upload')}>Загрузка</button>
      <button className={"btn " + (activeTab==='analytics'?'primary':'')} onClick={()=>setActiveTab('analytics')}>Аналитика</button>
      <button className={"btn " + (activeTab==='plans'?'primary':'')} onClick={()=>setActiveTab('plans')}>Планы действий</button>
    </div>

    {activeTab==='upload' && (
<section className="panel" style={{marginBottom:16}}>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div className="row">
          <Upload size={18}/> <b>Загрузка файлов обращений</b>
        </div>
      </div>
      <div className="row" style={{marginTop:8, flexWrap:'wrap'}}>
        <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))} accept=".xls,.xlsx,.csv,.pdf,.doc,.docx"/>
        <button onClick={handleUpload} disabled={loading || files.length===0}>
          {loading? <><Loader2 size={16} className="spin"/> Обработка…</> : <>Обработать</>}
        </button>
        {uploadRes?.export_url && <a className="badge" href={absApiUrlMaybe(uploadRes.export_url)} target="_blank"><FileSpreadsheet size={14}/> Скачать объединённый Excel</a>}
      </div>
      <YandexMap points={uploadRes?.items || []} />
      {uploadRes?.items?.length>0 && <div style={{marginTop:12, maxHeight:280, overflow:'auto'}}>
        <table>
          <thead><tr>
            <th>Источник</th><th>Дата</th><th>Адрес</th><th>Текст</th><th>Категория</th><th>Геометка</th>
          </tr></thead>
          <tbody>
            {uploadRes.items.map((r,i)=>(<tr key={i}>
              <td className="mono">{r.source}</td>
              <td>{r.date||''}</td>
              <td>{r.address||''}</td>
              <td>{r.text?.slice(0,160)||''}</td>
              <td>{r.category||''}</td>
              <td className="mono">{r.lat&&r.lng? (r.lat.toFixed(5)+','+r.lng.toFixed(5)) : ''}</td>
            </tr>))}
          </tbody>
        </table>
      </div>}
    </section>
    )}

    {activeTab==='analytics' && (<>
<section className="panel" style={{marginBottom:16}}>
      <div className="row" style={{gap:8, alignItems:"center"}}><BarChart3 size={18}/> <b>Аналитика обращений</b><div style={{flex:1}}/><label className="muted" style={{marginRight:8}}>Период:</label><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} /><span className="muted" style={{padding:"0 6px"}}>—</span><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} /><button className="btn" onClick={async()=>{ try{ const a = await apiGet(`/appeals/analytics?municipality_id=${mId}&date_from=${dateFrom||""}&date_to=${dateTo||""}`); setAnalytics(a) }catch(e){ setAnalytics({by_category:[],by_date:[],per_category:[]}) } }}>Показать</button></div>
      {analytics? <div className="row" style={{gap:24, marginTop:12, flexWrap:'wrap'}}>
        <div style={{width:360, height:260}}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie dataKey="value" data={analytics.by_category} outerRadius={90} label>
  {analytics.by_category.map((s,i)=> (<Cell key={i} fill={colorForCategory(s.name)} />))}
</Pie>
              <Tooltip/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{flex:'1 1 420px', height:260}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.by_date}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis allowDecimals={false}/><Tooltip/>
              <Bar dataKey="count" fill="#2563eb"/></BarChart>
          </ResponsiveContainer>
        </div>
      </div> : <div className="muted">Загрузите данные для аналитики.</div>}
    </section>
    <section className="panel" style={{marginBottom:16}}>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div className="row">
          <BarChart3 size={18}/> <b>Расширенная аналитика по категориям</b>
        </div>
      </div>
      <div className="col" style={{gap:12, marginTop:8}}>
        {(analytics?.per_category||[]).map((c,i)=> (
          <div key={i} className="box" style={{border:'1px solid var(--border)', padding:12, borderRadius:12}}>
            <div className="row" style={{justifyContent:'space-between'}}>
              <div><b>{c.category}</b> • Обращений: {c.count} • Настроение: <b>{c.sentiment>0 ? 'позитивное' : c.sentiment<0 ? 'негативное' : 'нейтральное'}</b> ({c.sentiment})</div>
            </div>
            <div className="row" style={{gap:24, flexWrap:'wrap', marginTop:8}}>
              <div style={{minWidth:220}}>
                <div className="muted">Частые темы</div>
                <ul style={{margin:'6px 0'}}>
                  {c.topics?.map((t,idx)=>(<li key={idx}>• {t}</li>))}
                </ul>
              </div>
              <div style={{minWidth:260}}>
                <div className="muted">Горячие точки</div>
                {(c.hotspots?.length? c.hotspots: []).slice(0,5).map((h,idx)=>(
                  <div key={idx} className="row" style={{justifyContent:'space-between'}}>
                    <span>{h.address}</span><span className="muted">{h.count}</span>
                  </div>
                ))}
                {(!c.hotspots || c.hotspots.length===0) && <div className="muted">—</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
    </>)}

    {activeTab==='plans' && (
    <section className="panel">
      <div className="row" style={{gap:8}}><FileDown size={18}/> <b>Планы действий по категориям</b></div>
      <div className="row" style={{gap:8, marginTop:12, alignItems:'center'}}>
        <label className="muted">OpenAI API Key:</label>
        <input type="password" value={openAiApiKey} onChange={e=>setOpenAiApiKey(e.target.value)} placeholder="sk-..." style={{minWidth:300}}/>
      </div>
      <div className="row" style={{gap:6, flexWrap:'wrap', marginTop:8}}>
        {['Благоустройство','Окружающая среда','Доступность цифровых услуг','Дороги','Образование','Культура','Здравоохранение','Транспортное обслуживание','ЖКХ','Адаптация участников СВО','Политическое доверие']
          .map(cat=>(<button key={cat} onClick={()=>handleGeneratePlan(cat)} disabled={loading}>{cat}</button>))}
      </div>
      <div style={{marginTop:10}}>
        {plans?.map((p,i)=>(<div key={i} className="row" style={{justifyContent:'space-between', borderBottom:'1px solid var(--border)', padding:'8px 0'}}>
          <div>
            <div><b>{p.category}</b> • {p.municipality_name} • <span className="muted">{p.created_at}</span></div>
            <div className="muted">{p.summary}</div>
          </div>
          <div className="row" style={{gap:8}}>
            <a className="badge" href={absApiUrlMaybe(p.docx_url)} target="_blank"><Download size={14}/> DOCX</a>
            <a className="badge" href={absApiUrlMaybe(p.pdf_url)} target="_blank"><Download size={14}/> PDF</a>
          </div>
        </div>))}
      </div>
    </section>
    )}

    <footer style={{marginTop:24, borderTop:'1px solid var(--border)'}}>
      <div className="row" style={{justifyContent:'space-between', padding:'12px 0'}}>
        <div>© {new Date().getFullYear()} AI-ДОВЕРИЕ</div>
        <div className="muted">Загрузка • Унификация • Аналитика • Экспорт</div>
      </div>
    </footer>
  </div>
}
