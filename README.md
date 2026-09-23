# Lady Finanzas V1

Programa web privado para organizar las finanzas de Lady Fútbol.

## Qué trae esta versión
- Botón **Fecha por fecha**.
- Botón **Ingresos y egresos general**.
- Caja General Efectivo.
- Caja DRYN.
- Caja de cada fecha / aperturas.
- Retiros de DRYN con comisión automática del 2,5%.
- Comisión DRYN registrada como gasto financiero.
- Gastos fijos mensuales: Sueldo Cuchu, Redes Sociales y otros que se agreguen luego.
- Datos demo de la fecha visible del Sheet PAGOS CL 2026.
- Los movimientos que cargás en esta demo quedan guardados en el navegador mediante localStorage.

## Importante
Esta V1 todavía NO está conectada en vivo al Google Sheet. Es intencional: primero verificamos el funcionamiento y los saldos. La siguiente etapa es conectar el Sheet en modo **solo lectura** para que cada solapa/fecha ingrese automáticamente al programa.

## Cómo abrirlo en tu computadora
1. Instalá Node.js (versión LTS).
2. Descomprimí esta carpeta.
3. Abrí la carpeta en Visual Studio Code o Terminal.
4. Ejecutá: `npm install`
5. Ejecutá: `npm run dev`
6. Abrí `http://localhost:3000`

## Cómo subirlo a GitHub
1. Creá un repositorio nuevo llamado `lady-finanzas`.
2. Subí todos los archivos de esta carpeta.
3. No hace falta modificar nada para la primera prueba.

## Cómo publicarlo en Vercel
1. Entrá a Vercel.
2. Elegí **Add New > Project**.
3. Importá el repositorio `lady-finanzas` de GitHub.
4. Vercel detectará Next.js automáticamente.
5. Presioná **Deploy**.

## Próxima etapa: Google Sheet en vivo
Se conectará el Sheet con Google Sheets API del lado del servidor y permisos de solo lectura. Nunca pondremos credenciales privadas dentro del navegador.

## Regla contable definida
- DRYN recibe transferencias.
- Retiro DRYN: baja el monto retirado + 2,5% de comisión.
- El monto retirado entra a Caja General Efectivo.
- La comisión se registra como gasto financiero/fijo.
- Caja General Efectivo financia la apertura de cada fecha.
- La apertura NO es gasto: es un traspaso interno.
- El resultado real descuenta gastos de fechas + gastos fijos + comisiones DRYN.
