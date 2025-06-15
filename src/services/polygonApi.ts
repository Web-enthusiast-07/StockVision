// Polygon.io API service for fetching real-time stock data
const POLYGON_API_KEY = 'a64df39f-bb49-4923-861c-76151aba2ce0';
const BASE_URL = 'https://api.polygon.io';

export interface StockTicker {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik?: string;
  composite_figi?: string;
  share_class_figi?: string;
  last_updated_utc: string;
}

export interface StockQuote {
  ticker: string;
  todaysChangePerc: number;
  todaysChange: number;
  updated: number;
  day: {
    c: number; // close
    h: number; // high
    l: number; // low
    o: number; // open
    v: number; // volume
    vw: number; // volume weighted average price
  };
  min: {
    av: number; // average
    c: number; // close
    h: number; // high
    l: number; // low
    o: number; // open
    t: number; // timestamp
    v: number; // volume
    vw: number; // volume weighted average price
  };
  prevDay: {
    c: number;
    h: number;
    l: number;
    o: number;
    v: number;
    vw: number;
  };
}

export interface StockDetails {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  description?: string;
  homepage_url?: string;
  total_employees?: number;
  list_date?: string;
  branding?: {
    logo_url?: string;
    icon_url?: string;
  };
  share_class_shares_outstanding?: number;
  weighted_shares_outstanding?: number;
  market_cap?: number;
  phone_number?: string;
  address?: {
    address1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  sic_code?: string;
  sic_description?: string;
}

export interface HistoricalData {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: Array<{
    c: number; // close
    h: number; // high
    l: number; // low
    o: number; // open
    t: number; // timestamp
    v: number; // volume
    vw: number; // volume weighted average price
  }>;
  status: string;
  request_id: string;
  count: number;
}

export interface MarketStatus {
  market: string;
  serverTime: string;
  exchanges: {
    nasdaq: string;
    nyse: string;
    otc: string;
  };
  currencies: {
    fx: string;
    crypto: string;
  };
}

class PolygonApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = POLYGON_API_KEY;
    this.baseUrl = BASE_URL;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add API key and other parameters
    url.searchParams.append('apikey', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Polygon API request failed:', error);
      throw error;
    }
  }

  // Get list of stock tickers
  async getTickers(params: {
    market?: string;
    exchange?: string;
    cusip?: string;
    date?: string;
    search?: string;
    type?: string;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  } = {}): Promise<{ results: StockTicker[]; status: string; count: number }> {
    return this.makeRequest('/v3/reference/tickers', {
      market: 'stocks',
      active: true,
      limit: params.limit || 100,
      ...params
    });
  }

  // Get real-time quote for a ticker
  async getQuote(ticker: string): Promise<{ results: StockQuote; status: string }> {
    return this.makeRequest(`/v2/snapshot/locale/us/markets/stocks/tickers/${ticker.toUpperCase()}`);
  }

  // Get quotes for multiple tickers
  async getQuotes(tickers: string[]): Promise<{ results: StockQuote[]; status: string }> {
    const tickerList = tickers.map(t => t.toUpperCase()).join(',');
    return this.makeRequest('/v2/snapshot/locale/us/markets/stocks/tickers', {
      tickers: tickerList
    });
  }

  // Get all market snapshots
  async getAllSnapshots(): Promise<{ results: StockQuote[]; status: string }> {
    return this.makeRequest('/v2/snapshot/locale/us/markets/stocks/tickers');
  }

  // Get ticker details
  async getTickerDetails(ticker: string, date?: string): Promise<{ results: StockDetails; status: string }> {
    return this.makeRequest(`/v3/reference/tickers/${ticker.toUpperCase()}`, {
      date
    });
  }

  // Get historical data (aggregates)
  async getHistoricalData(
    ticker: string,
    multiplier: number = 1,
    timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day',
    from: string,
    to: string,
    params: {
      adjusted?: boolean;
      sort?: 'asc' | 'desc';
      limit?: number;
    } = {}
  ): Promise<HistoricalData> {
    return this.makeRequest(
      `/v2/aggs/ticker/${ticker.toUpperCase()}/range/${multiplier}/${timespan}/${from}/${to}`,
      {
        adjusted: true,
        sort: 'asc',
        limit: 50000,
        ...params
      }
    );
  }

  // Get market status
  async getMarketStatus(): Promise<MarketStatus> {
    return this.makeRequest('/v1/marketstatus/now');
  }

  // Get previous close for a ticker
  async getPreviousClose(ticker: string, adjusted: boolean = true): Promise<{
    results: Array<{
      T: string; // ticker
      c: number; // close
      h: number; // high
      l: number; // low
      o: number; // open
      t: number; // timestamp
      v: number; // volume
      vw: number; // volume weighted average price
    }>;
    status: string;
  }> {
    return this.makeRequest(`/v2/aggs/ticker/${ticker.toUpperCase()}/prev`, {
      adjusted
    });
  }

  // Get gainers and losers
  async getGainersLosers(direction: 'gainers' | 'losers' = 'gainers'): Promise<{
    results: Array<{
      ticker: string;
      todaysChangePerc: number;
      todaysChange: number;
      updated: number;
      day: {
        c: number;
        h: number;
        l: number;
        o: number;
        v: number;
        vw: number;
      };
    }>;
    status: string;
  }> {
    return this.makeRequest(`/v2/snapshot/locale/us/markets/stocks/${direction}`);
  }

  // Get most active stocks
  async getMostActive(): Promise<{
    results: Array<{
      ticker: string;
      todaysChangePerc: number;
      todaysChange: number;
      updated: number;
      day: {
        c: number;
        h: number;
        l: number;
        o: number;
        v: number;
        vw: number;
      };
    }>;
    status: string;
  }> {
    return this.makeRequest('/v2/snapshot/locale/us/markets/stocks/tickers', {
      sort: 'volume',
      order: 'desc',
      limit: 50
    });
  }

  // Search for tickers
  async searchTickers(query: string, limit: number = 10): Promise<{
    results: StockTicker[];
    status: string;
    count: number;
  }> {
    return this.makeRequest('/v3/reference/tickers', {
      search: query,
      market: 'stocks',
      active: true,
      limit,
      sort: 'ticker',
      order: 'asc'
    });
  }

  // Get sector performance (using SIC codes)
  async getSectorPerformance(): Promise<{
    sectors: Array<{
      sector: string;
      avgChange: number;
      count: number;
      tickers: string[];
    }>;
  }> {
    try {
      // Get snapshots of all stocks
      const snapshots = await this.getAllSnapshots();
      
      // Group by sector (this is a simplified approach)
      const sectorMap = new Map();
      
      // Define sector mappings based on common ticker patterns
      const sectorMappings = {
        'Technology': ['AAPL', 'MSFT', 'GOOGL', 'GOOG', 'META', 'NVDA', 'TSLA', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'INTC', 'AMD', 'AVGO'],
        'Healthcare': ['JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'ABT', 'LLY', 'DHR', 'BMY', 'AMGN', 'GILD', 'CVS'],
        'Finance': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SCHW', 'USB', 'PNC', 'TFC'],
        'Consumer': ['AMZN', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'TJX', 'COST', 'WMT'],
        'Energy': ['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'PSX', 'VLO', 'MPC', 'OXY', 'BKR'],
        'Industrial': ['BA', 'CAT', 'GE', 'MMM', 'HON', 'UPS', 'RTX', 'LMT', 'DE', 'FDX'],
        'Utilities': ['NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'XEL', 'SRE', 'PEG', 'ED'],
        'Real Estate': ['AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'WELL', 'SPG', 'O', 'SBAC', 'DLR']
      };

      snapshots.results?.forEach(stock => {
        let sector = 'Other';
        
        // Find sector for this ticker
        for (const [sectorName, tickers] of Object.entries(sectorMappings)) {
          if (tickers.includes(stock.ticker)) {
            sector = sectorName;
            break;
          }
        }

        if (!sectorMap.has(sector)) {
          sectorMap.set(sector, {
            sector,
            totalChange: 0,
            count: 0,
            tickers: []
          });
        }

        const sectorData = sectorMap.get(sector);
        sectorData.totalChange += stock.todaysChangePerc || 0;
        sectorData.count += 1;
        sectorData.tickers.push(stock.ticker);
      });

      const sectors = Array.from(sectorMap.values()).map(sector => ({
        sector: sector.sector,
        avgChange: sector.count > 0 ? sector.totalChange / sector.count : 0,
        count: sector.count,
        tickers: sector.tickers
      }));

      return { sectors };
    } catch (error) {
      console.error('Error getting sector performance:', error);
      return { sectors: [] };
    }
  }
}

export const polygonApi = new PolygonApiService();
export default polygonApi;