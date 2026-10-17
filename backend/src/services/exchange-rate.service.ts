interface ExchangeRateApiResponse {
    result: string;
    base_code: string;
    rates: Record<string, number>;
    time_last_update_utc: string;
  }
  
  export class ExchangeRateService {
    private readonly baseUrl = 'https://open.er-api.com/v6/latest';
  
    public async getExchangeRate(
      fromCurrency: string,
      toCurrency: string
    ) {
      const from = fromCurrency.toUpperCase();
      const to = toCurrency.toUpperCase();
  
      const response = await fetch(`${this.baseUrl}/${from}`, {
        signal: AbortSignal.timeout(10000)
      });
  
      if (!response.ok) {
        throw new Error('No se pudo consultar la API de tasas de cambio');
      }
  
      const data = (await response.json()) as ExchangeRateApiResponse;
  
      if (data.result !== 'success' || data.base_code !== from) {
        throw new Error('La API devolvió una respuesta inválida');
      }
  
      const rate = data.rates?.[to];
  
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
        throw new Error(`No existe una tasa válida para ${from} a ${to}`);
      }
  
      return {
        base: from,
        target: to,
        rate,
        fetchedAt: data.time_last_update_utc
      };
    }
  }
  
  export const exchangeRateService = new ExchangeRateService();