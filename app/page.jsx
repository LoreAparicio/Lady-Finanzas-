'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readSheet } from './sheet.mjs';

const money = n => n == null ? 'Sin informar' : '$ ' + Number(n).toLocaleString('es-AR');

export default function Home(){
  const [fecha,setFecha]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [updated,setUpdated]=useState(null);
  const [storageReady,setStorageReady]=useState(false);
  const [storageError,setStorageError]=useState('');
  const request=useRef(null);
  const loadSheet=useCallback(async()=>{
    request.current?.abort();
    const controller=new AbortController(); request.current=controller;
    const timeout=setTimeout(()=>controller.abort(),20000);
    setLoading(true); setError('');
    try {
      const response=await fetch('/api/sheet',{cache:'no-store',signal:controller.signal});
      const payload=await response.json();
      if(!response.ok || payload.ok!==true) throw new Error(payload.error || 'No se pudo leer la planilla.');
      const data=readSheet(payload.data);
      if(request.current===controller){setFecha(data);setUpdated(new Date());}
    } catch(e) {
      if(request.current===controller) setError(e.name==='AbortError'?'La lectura demoró demasiado. Volvé a intentar.':e.name==='TypeError' || e.name==='SyntaxError'?'No se pudo leer el Sheet. Revisá la conexión y volvé a intentar.':e.message);
    } finally {
      clearTimeout(timeout);
      if(request.current===controller)setLoading(false);
    }
  },[]);
  useEffect(()=>{
    loadSheet();
    const refresh=()=>{if(document.visibilityState==='visible')loadSheet()};
    const timer=setInterval(refresh,60000);
    window.addEventListener('focus',refresh);
    return ()=>{clearInterval(timer);window.removeEventListener('focus',refresh);const current=request.current;request.current=null;current?.abort()};
  },[loadSheet]);
  const [tab,setTab]=useState('fecha');
  const [retiros,setRetiros]=useState([]);
  const [fijos,setFijos]=useState([
    {id:1,concepto:'Sueldo Cuchu',monto:0,medio:'Efectivo',pagado:false},
    {id:2,concepto:'Redes sociales',monto:0,medio:'DRYN',pagado:false}
  ]);
  const [aperturas,setAperturas]=useState([]);
  const [retiro,setRetiro]=useState('');
  const [apertura,setApertura]=useState('');

  useEffect(()=>{
    try {
      const saved=localStorage.getItem('lady-finanzas-v1');
      if(saved){const d=JSON.parse(saved); if(!d || !['retiros','fijos','aperturas'].every(k=>d[k]===undefined||Array.isArray(d[k])))throw new Error(); setRetiros(d.retiros||[]); setFijos(d.fijos||fijos); setAperturas(d.aperturas||[]);}
      setStorageReady(true);
    } catch {setStorageError('No se pudieron recuperar los movimientos guardados. No se sobrescribirán.');}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{if(storageReady)try{localStorage.setItem('lady-finanzas-v1',JSON.stringify({retiros,fijos,aperturas}))}catch{setStorageError('El navegador no permite guardar los movimientos.')}},[retiros,fijos,aperturas,storageReady]);

  const comisiones=useMemo(()=>retiros.reduce((a,r)=>a+r.comision,0),[retiros]);
  const retirado=useMemo(()=>retiros.reduce((a,r)=>a+r.monto,0),[retiros]);
  const totalAperturas=useMemo(()=>aperturas.reduce((a,r)=>a+r.monto,0),[aperturas]);
  const gastosFijos=useMemo(()=>fijos.filter(x=>x.pagado).reduce((a,x)=>a+Number(x.monto||0),0),[fijos]);
  const cajaGeneral=fecha?.efectivo==null || fecha?.salidaEfectivo==null ? null : fecha.efectivo-fecha.salidaEfectivo + retirado - totalAperturas - fijos.filter(x=>x.pagado&&x.medio==='Efectivo').reduce((a,x)=>a+Number(x.monto||0),0);
  const dryn=fecha?.transferencia==null ? null : fecha.transferencia - retirado - comisiones - fijos.filter(x=>x.pagado&&x.medio==='DRYN').reduce((a,x)=>a+Number(x.monto||0),0);
  const resultadoReal=fecha ? fecha.resultado-gastosFijos-comisiones : null;

  function registrarRetiro(){
    const monto=Number(retiro); if(!Number.isFinite(monto)||monto<=0||!storageReady)return;
    const comision=Math.round(monto*0.025);
    setRetiros(v=>[{id:Date.now(),fecha:new Date().toLocaleDateString('es-AR'),monto,comision},...v]);
  }
  function registrarApertura(){
    const monto=Number(apertura); if(!Number.isFinite(monto)||monto<=0||!storageReady)return;
    setAperturas(v=>[{id:Date.now(),fecha:new Date().toLocaleDateString('es-AR'),monto},...v]);
  }
  function editarFijo(id,field,value){setFijos(v=>v.map(x=>x.id===id?{...x,[field]:field==='monto'?Number(value):value}:x))}

  return <div className="app">
    <aside className="side">
      <img src="/lady-logo.jpeg" className="logo" alt="Lady Fútbol"/>
      <div className="sideTitle">LADY FINANZAS</div>
      <div className="sideNote">Uso privado</div>
      <button className={tab==='fecha'?'nav active':'nav'} onClick={()=>setTab('fecha')}>📅 Fecha por fecha</button>
      <button className={tab==='general'?'nav active':'nav'} onClick={()=>setTab('general')}>📊 General</button>
    </aside>

    <main className="main">
      <header><div><h1>Lady Finanzas</h1><p>Todo tu torneo, en orden.</p></div><span className="source">Fuente actual: PAGOS CL 2026</span></header>
      <div className="tabs">
        <button className={tab==='fecha'?'tab active':'tab'} onClick={()=>setTab('fecha')}>FECHA POR FECHA</button>
        <button className={tab==='general'?'tab active':'tab'} onClick={()=>setTab('general')}>INGRESOS Y EGRESOS GENERAL</button>
      </div>

      <section className="sheetStatus" aria-live="polite">
        <div>{loading ? 'Leyendo PAGOS CL 2026…' : updated ? `Última lectura: ${updated.toLocaleTimeString('es-AR')}` : 'Sin datos disponibles'}
        {error && <p role="alert" className="neg">{error}{fecha ? ' Se muestra la última lectura correcta; puede estar desactualizada.' : ''}</p>}
        <p className="hint">Lectura automática cada minuto de la solapa que entrega el Sheet. Los movimientos manuales se guardan en este navegador.</p></div>
        <button onClick={loadSheet} disabled={loading}>Actualizar datos</button>
      </section>
      {storageError && <p role="alert" className="neg">{storageError}</p>}
      {!fecha ? <Card title={loading ? 'Cargando datos reales' : 'No se pudo cargar el Sheet'}><p>{loading ? 'Los importes aparecerán al terminar la lectura.' : 'Usá Actualizar datos para volver a intentar.'}</p></Card> : tab==='fecha' ? <>
        <section className="cards four">
          <Kpi title="Ingresos fecha" value={money(fecha.ingresos)} note={`${money(fecha.efectivo)} efectivo · ${money(fecha.transferencia)} transferencia`} tone="green"/>
          <Kpi title="Egresos fecha" value={money(fecha.egresos)} note="Gastos operativos" tone="pink"/>
          <Kpi title="Resultado fecha" value={money(fecha.resultado)} note="Antes de gastos fijos" tone="blue"/>
          <Kpi title="Apertura de caja" value={money(fecha.apertura)} note={`Responsable: ${fecha.responsable}`} tone="gold"/>
        </section>
        <section className="grid2">
          <Card title="Resumen fecha por fecha">
            <table><thead><tr><th>Fecha</th><th>Efectivo</th><th>Transferencia</th><th>Egresos</th><th>Resultado</th></tr></thead><tbody>
              <tr><td>{fecha.fecha}</td><td>{money(fecha.efectivo)}</td><td>{money(fecha.transferencia)}</td><td>{money(fecha.egresos)}</td><td className={fecha.resultado<0?'neg':'pos'}>{money(fecha.resultado)}</td></tr>
            </tbody></table>
            <p className="hint">Se muestra la solapa actual; la fecha no está informada. Transferencias = entrada total − entrada de efectivo. No incluye otras solapas.</p>
          </Card>
          <Card title="Apertura de caja">
            <div className="flow"><div><small>Caja General</small><b>- {money(Number(apertura)||0)}</b></div><span>→</span><div><small>Caja de la fecha</small><b className="pos">+ {money(Number(apertura)||0)}</b></div></div>
            <p className="hint">Es un traspaso interno, no un gasto.</p>
            <div className="actionRow"><input aria-label="Monto de apertura" placeholder="Monto" value={apertura} onChange={e=>setApertura(e.target.value)} type="number" min="0"/><button disabled={!storageReady} onClick={registrarApertura}>Registrar apertura</button></div>
          </Card>
        </section>
        <Card title="Gastos de la fecha">
          <table><thead><tr><th>Concepto</th><th>Proveedor</th><th>Total</th></tr></thead><tbody>{fecha.gastos.map((g,i)=><tr key={`${g.concepto}-${i}`}><td>{g.concepto}</td><td>{g.proveedor || '—'}</td><td>{money(g.monto)}</td></tr>)}</tbody></table>
          <p className="hint">Se respeta la columna de totales del Sheet. Un importe vacío figura como sin informar y no se reemplaza por el precio unitario.</p>
        </Card>
      </> : <>
        <section className="cards four">
          <Kpi title="Caja General Efectivo" value={money(cajaGeneral)} note={cajaGeneral==null?'Falta entrada o salida de efectivo en el Sheet':'Neto de la solapa y movimientos locales; sin saldo inicial'} tone="green"/>
          <Kpi title="Saldo DRYN" value={money(dryn)} note="Transferencias de la solapa − retiros, comisiones y fijos locales; sin saldo inicial" tone="blue"/>
          <Kpi title="Comisiones DRYN" value={money(comisiones)} note="2,5% de retiros · gasto financiero" tone="pink"/>
          <Kpi title="Resultado real" value={money(resultadoReal)} note="Resultado de esta solapa − fijos y comisiones locales" tone="gold"/>
        </section>
        <section className="grid2">
          <Card title="Registrar retiro de DRYN">
            <div className="flow"><div><small>DRYN</small><b>- {money((Number(retiro)||0)*1.025)}</b></div><span>→</span><div><small>Caja General</small><b className="pos">+ {money(Number(retiro)||0)}</b></div></div>
            <div className="commission">Comisión 2,5%: <b>{money((Number(retiro)||0)*.025)}</b></div>
            <div className="actionRow"><input aria-label="Monto de retiro" placeholder="Monto" value={retiro} onChange={e=>setRetiro(e.target.value)} type="number" min="0"/><button disabled={!storageReady} onClick={registrarRetiro}>Registrar retiro</button></div>
          </Card>
          <Card title="Gastos fijos mensuales">
            {fijos.map(x=><div className="fixed" key={x.id}>
              <b>{x.concepto}</b><input type="number" placeholder="Monto" value={x.monto||''} onChange={e=>editarFijo(x.id,'monto',e.target.value)}/>
              <select value={x.medio} onChange={e=>editarFijo(x.id,'medio',e.target.value)}><option>Efectivo</option><option>DRYN</option></select>
              <label><input type="checkbox" checked={x.pagado} onChange={e=>editarFijo(x.id,'pagado',e.target.checked)}/> Pagado</label>
            </div>)}
            <p className="hint">La comisión DRYN se contabiliza automáticamente aparte como gasto financiero.</p>
          </Card>
        </section>
        <section className="grid2">
          <Card title="Últimos retiros DRYN">
            <table><thead><tr><th>Fecha</th><th>Retiro</th><th>Comisión</th></tr></thead><tbody>{retiros.length?retiros.map(r=><tr key={r.id}><td>{r.fecha}</td><td>{money(r.monto)}</td><td className="neg">{money(r.comision)}</td></tr>):<tr><td colSpan="3">Todavía no cargaste retiros.</td></tr>}</tbody></table>
          </Card>
          <Card title="Aperturas registradas">
            <table><thead><tr><th>Fecha</th><th>Monto</th></tr></thead><tbody>{aperturas.length?aperturas.map(r=><tr key={r.id}><td>{r.fecha}</td><td>{money(r.monto)}</td></tr>):<tr><td colSpan="2">Todavía no cargaste aperturas.</td></tr>}</tbody></table>
          </Card>
        </section>
      </>}
    </main>
  </div>
}

function Kpi({title,value,note,tone}){return <div className={`kpi ${tone}`}><span>{title}</span><b>{value}</b><small>{note}</small></div>}
function Card({title,children}){return <section className="card"><h2>{title}</h2>{children}</section>}
