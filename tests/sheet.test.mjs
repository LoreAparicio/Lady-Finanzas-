import test from 'node:test';
import assert from 'node:assert/strict';
import { amount, parseCSV, readSheet } from '../app/sheet.mjs';

const csv = (result='70,00') => [
  ['COBRANZAS','','','','','','RESPONSABLE DE CAJA: PAGOS','','Responsable'],
  ['','EQUIPOS','','','','','','PROVEEDOR'],
  ['','Equipo','100','','100','','MESA','Proveedor','','30','30'],
  ['','','','','','','EXTRAS','','1','25',''],
  ['','','100','','100','','','','','','30'],
  ['','','','','','','','RESULTADO DE LA FECHA'],
  ['','APERTURA DE CAJA','20','','','','','ENTRADA','100'],
  ['','ENTRADA DE EFECTIVO','40','','','','','SALIDA','30'],
  ['','SALIDA DE EFECTIVO','','','','','','RESULTADO',result],
].map(row=>row.map(c=>'"'+c.replaceAll('"','""')+'"').join(',')).join('\r\n');

test('CSV quoted commas, embedded newlines and escaped quotes',()=>{
  assert.deepEqual(parseCSV('"a,b","una ""cita""\nsegunda línea"\r\n"fin",""'),[['a,b','una "cita"\nsegunda línea'],['fin','']]);
  assert.throws(()=>parseCSV('"incompleto'));
});
test('Argentine amounts distinguish missing values from zero',()=>{
  assert.equal(amount(' $ 1.234.567,89 '),1234567.89);
  assert.equal(amount('$ -'),0);
  assert.equal(amount(''),null);
  assert.equal(amount('-2.000,50'),-2000.5);
  assert.throws(()=>amount('#REF!'));
});
test('Uses summary once, explicit cash label, and expense total column',()=>{
  const data=readSheet(csv());
  assert.equal(data.ingresos,100);
  assert.equal(data.efectivo,40);
  assert.equal(data.transferencia,60);
  assert.equal(data.egresos,30);
  assert.equal(data.resultado,70);
  assert.equal(data.apertura,20);
  assert.equal(data.salidaEfectivo,null);
  assert.equal(data.gastos.length,2);
  assert.equal(data.gastos[1].monto,null);
  assert.equal(data.responsable,'Responsable');
});
test('Rejects login pages, empty data, changed layout and inconsistent totals',()=>{
  for(const input of ['', '<html>Login</html>', 'otra,estructura', csv('999')]) assert.throws(()=>readSheet(input));
});
