// The existing endpoint returns the visible worksheet as Google CSV.
export function parseCSV(text) {
  if (typeof text !== 'string' || !text.trim() || /^\s*</.test(text)) throw new Error('La planilla no devolvió datos válidos.');
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n' || c === '\r')) {
      row.push(cell.trim()); cell = '';
      if (c !== ',') { rows.push(row); row = []; if (c === '\r' && text[i + 1] === '\n') i++; }
    } else cell += c;
  }
  if (quoted) throw new Error('La planilla devolvió un CSV incompleto.');
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows;
}

export function amount(value) {
  const raw = String(value ?? '').replace(/[$\s]/g, '');
  if (!raw) return null;
  if (raw === '-') return 0;
  if (!/^-?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?$/.test(raw)) throw new Error('Hay un importe que no se puede interpretar en la planilla.');
  return Number(raw.replaceAll('.', '').replace(',', '.'));
}

export function readSheet(csv) {
  const rows = parseCSV(csv);
  const key = s => String(s ?? '').trim().toUpperCase();
  const header = rows.findIndex(r => key(r[1]) === 'EQUIPOS' && key(r[7]) === 'PROVEEDOR');
  const summary = rows.findIndex(r => key(r[7]) === 'RESULTADO DE LA FECHA');
  if (header < 0 || summary <= header) throw new Error('Cambió la estructura de la planilla. No se calcularon saldos.');
  const value = (label, col, val) => amount(rows.find(r => key(r[col]) === label)?.[val]);
  const ingresos = value('ENTRADA', 7, 8);
  const egresos = value('SALIDA', 7, 8);
  const resultado = value('RESULTADO', 7, 8);
  const efectivo = value('ENTRADA DE EFECTIVO', 1, 2);
  if ([ingresos, egresos, resultado].some(n => n === null)) throw new Error('Faltan los totales de la fecha en la planilla.');
  if (Math.abs(ingresos - egresos - resultado) > 0.01) throw new Error('Los totales de la planilla no coinciden. Revisá entrada, salida y resultado.');
  const gastos = rows.slice(header + 1, summary).filter(r => r[6]).map(r => ({
    concepto: r[6], proveedor: r[7] || '', monto: amount(r[10])
  }));
  const responsableRow = rows.find(r => r.some(c => key(c).includes('RESPONSABLE DE CAJA')));
  const responsableIndex = responsableRow?.findIndex(c => key(c).includes('RESPONSABLE DE CAJA')) ?? -1;
  return {
    fecha: 'Solapa actual del Sheet', ingresos, egresos, resultado, efectivo,
    transferencia: efectivo === null ? null : ingresos - efectivo,
    apertura: value('APERTURA DE CAJA', 1, 2),
    salidaEfectivo: value('SALIDA DE EFECTIVO', 1, 2),
    responsable: responsableRow?.slice(responsableIndex + 1).find(c => c) || 'Sin informar', gastos
  };
}
