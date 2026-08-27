# Crypto Predictor

Panel web para analizar criptomonedas en velas de 1 minuto.

## Versión actual
- Datos públicos de mercado desde Binance.
- Velas de 1 minuto.
- Selección de BTC, ETH, BNB, SOL, XRP, DOGE, ADA y AVAX.
- Indicador experimental de tendencia + momentum + RSI.
- Señal SUBIDA / BAJADA / NEUTRAL y confianza estimada.
- TP/SL simulados.
- Responsive para móvil.

## Ejecutar
Es una aplicación estática: abre `index.html` en un navegador o publícala con GitHub Pages/Vercel.

## Importante
Las señales no son asesoramiento financiero ni garantizan resultados. La versión actual no coloca órdenes y no requiere claves privadas.

## Próximas fases
1. Backtesting real y métricas por activo.
2. Backend para almacenar velas y señales.
3. Modelo ML entrenado con datos históricos.
4. Validación walk-forward para evitar fuga de información.
5. Alertas y autenticación.
6. Ejecución de órdenes solo después de pruebas y controles de riesgo.