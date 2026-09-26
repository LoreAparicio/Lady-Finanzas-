# Lady Finanzas

Panel de Lady Fútbol con el diseño original y lectura automática de PAGOS CL 2026.

## Datos del Sheet

La pantalla consulta `/api/sheet` al abrir, al volver a la ventana y cada minuto mientras está visible. También permite actualizar manualmente. El endpoint existente y el Google Sheet no se modificaron.

El endpoint devuelve CSV de una única solapa, sin título ni fecha. El panel lo aclara y no presenta un historial de otras solapas. Usa los totales de ENTRADA, SALIDA y RESULTADO; identifica ENTRADA DE EFECTIVO y calcula transferencias como entrada total menos efectivo, según la regla existente de DRYN. Los gastos toman su importe de la columna Total, nunca del precio unitario. Los campos vacíos se muestran como Sin informar. Si falta la salida de efectivo, no se calcula Caja General.

Los saldos generales combinan la solapa actual con los movimientos locales y no incluyen un saldo inicial ni otras solapas. La apertura del Sheet se muestra por separado; no se agrega automáticamente al registro local para evitar duplicarla. Las aperturas son traspasos, no gastos.

Si la lectura falla, se informa el error y se permite reintentar. Si ya había datos válidos, se conserva la última lectura con advertencia de desactualización. No hay datos de demostración de respaldo.

## Funciones conservadas

- Vistas Fecha por fecha y General.
- Retiros DRYN y comisión del 2,5%.
- Aperturas de caja y gastos fijos mensuales.
- Movimientos guardados únicamente en el navegador, bajo `lady-finanzas-v1`. Se recuperan antes de volver a guardar y no se escriben en Google Sheets.

## Desarrollo y verificación

Requiere Node.js y las dependencias de package.json.

```sh
npm install
node tests/sheet.test.mjs
npm run build
npm start
```

Las pruebas cubren CSV con comillas y saltos de línea, moneda argentina, campos vacíos, identificación de efectivo, totales sin duplicación y rechazo de respuestas inválidas. No contienen datos financieros reales.

## Despliegue

El proyecto existente en Vercel es lady-finanzas y está conectado a LoreAparicio/Lady-Finanzas-. Publicar los cambios en su rama de producción activa la integración existente. Verificar el despliegue y /api/sheet antes de darlo por terminado.
