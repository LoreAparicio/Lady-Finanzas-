'use client';

import { useEffect, useMemo, useState } from 'react';

const fechaDemo = {
  fecha: 'Fecha visible del Sheet', responsable: 'Cuchu', efectivo: 475000,
  transferencia: 800000, egresos: 1182200, apertura: 300000, resultado: 92800,
  gastos: [
    ['Canchas GRÜN',610200],['Médico',66000],['Fotografía',90000],['Mesa / coordinación',112000],
    ['Árbitros',210000],['Lavadero',30000],['Comida',39000],['Extras / botiquín',25000]
  ]
};

const money = n => '$ ' + Number(n || 0).toLocaleString('es-AR');

export default function Home(){
  const [tab,setTab]=useState('fecha');
  const [retiros,setRetiros]=useState([]);
  const [fijos,setFijos]=useState([
    {id:1,concepto:'Sueldo Cuchu',monto:0,medio:'Efectivo',pagado:false},
    {id:2,concepto:'Redes sociales',monto:0,medio:'DRYN',pagado:false}
  ]);
  const [aperturas,setAperturas]=useState([]);
  const [retiro,setRetiro]=useState('100000');
  const [apertura,setApertura]=useState('300000');

  useEffect(()=>{
    const saved=localStorage.getItem('lady-finanzas-v1');
    if(saved){try{const d=JSON.parse(saved); setRetiros(d.retiros||[]); setFijos(d.fijos||fijos); setAperturas(d.aperturas||[]);}catch{}}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{localStorage.setItem('lady-finanzas-v1',JSON.stringify({retiros,fijos,aperturas}))},[retiros,fijos,aperturas]);

  const comisiones=useMemo(()=>retiros.reduce((a,r)=>a+r.comision,0),[retiros]);
  const retirado=useMemo(()=>retiros.reduce((a,r)=>a+r.monto,0),[retiros]);
  const totalAperturas=useMemo(()=>aperturas.reduce((a,r)=>a+r.monto,0),[aperturas]);
  const gastosFijos=useMemo(()=>fijos.filter(x=>x.pagado).reduce((a,x)=>a+Number(x.monto||0),0),[fijos]);
  const cajaGeneral=fechaDemo.efectivo + retirado - totalAperturas - fijos.filter(x=>x.pagado&&x.medio==='Efectivo').reduce((a,x)=>a+Number(x.monto||0),0);
  const dryn=fechaDemo.transferencia - retirado - comisiones - fijos.filter(x=>x.pagado&&x.medio==='DRYN').reduce((a,x)=>a+Number(x.monto||0),0);
  const resultadoReal=fechaDemo.resultado-gastosFijos-comisiones;

  function registrarRetiro(){
    const monto=Number(retiro); if(!monto||monto<=0)return;
    const comision=Math.round(monto*0.025);
    setRetiros(v=>[{id:Date.now(),fecha:new Date().toLocaleDateString('es-AR'),monto,comision},...v]);
  }
  function registrarApertura(){
    const monto=Number(apertura); if(!monto||monto<=0)return;
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

      {tab==='fecha' ? <>
        <section className="cards four">
          <Kpi title="Ingresos fecha" value={money(fechaDemo.efectivo+fechaDemo.transferencia)} note={`${money(fechaDemo.efectivo)} efectivo · ${money(fechaDemo.transferencia)} transferencia`} tone="green"/>
          <Kpi title="Egresos fecha" value={money(fechaDemo.egresos)} note="Gastos operativos" tone="pink"/>
          <Kpi title="Resultado fecha" value={money(fechaDemo.resultado)} note="Antes de gastos fijos" tone="blue"/>
          <Kpi title="Apertura de caja" value={money(fechaDemo.apertura)} note="Responsable: Cuchu" tone="gold"/>
        </section>
        <section className="grid2">
          <Card title="Resumen fecha por fecha">
            <table><thead><tr><th>Fecha</th><th>Efectivo</th><th>Transferencia</th><th>Egresos</th><th>Resultado</th></tr></thead><tbody>
              <tr><td>{fechaDemo.fecha}</td><td>{money(fechaDemo.efectivo)}</td><td>{money(fechaDemo.transferencia)}</td><td>{money(fechaDemo.egresos)}</td><td className="pos">{money(fechaDemo.resultado)}</td></tr>
            </tbody></table>
            <p className="hint">Cuando conectemos el Sheet, cada solapa/fecha aparecerá automáticamente acá.</p>
          </Card>
          <Card title="Apertura de caja">
            <div className="flow"><div><small>Caja General</small><b>- {money(Number(apertura)||0)}</b></div><span>→</span><div><small>Caja de la fecha</small><b className="pos">+ {money(Number(apertura)||0)}</b></div></div>
            <p className="hint">Es un traspaso interno, no un gasto.</p>
            <div className="actionRow"><input value={apertura} onChange={e=>setApertura(e.target.value)} type="number"/><button onClick={registrarApertura}>Registrar apertura</button></div>
          </Card>
        </section>
        <Card title="Gastos de la fecha">
          <table><thead><tr><th>Concepto</th><th>Total</th></tr></thead><tbody>{fechaDemo.gastos.map(([c,m])=><tr key={c}><td>{c}</td><td>{money(m)}</td></tr>)}</tbody></table>
        </Card>
      </> : <>
        <section className="cards four">
          <Kpi title="Caja General Efectivo" value={money(cajaGeneral)} note="Disponible para aperturas" tone="green"/>
          <Kpi title="Saldo DRYN" value={money(dryn)} note="Después de retiros y comisiones" tone="blue"/>
          <Kpi title="Comisiones DRYN" value={money(comisiones)} note="2,5% de retiros · gasto financiero" tone="pink"/>
          <Kpi title="Resultado real" value={money(resultadoReal)} note="Resultado fechas - fijos - DRYN" tone="gold"/>
        </section>
        <section className="grid2">
          <Card title="Registrar retiro de DRYN">
            <div className="flow"><div><small>DRYN</small><b>- {money((Number(retiro)||0)*1.025)}</b></div><span>→</span><div><small>Caja General</small><b className="pos">+ {money(Number(retiro)||0)}</b></div></div>
            <div className="commission">Comisión 2,5%: <b>{money((Number(retiro)||0)*.025)}</b></div>
            <div className="actionRow"><input value={retiro} onChange={e=>setRetiro(e.target.value)} type="number"/><button onClick={registrarRetiro}>Registrar retiro</button></div>
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
