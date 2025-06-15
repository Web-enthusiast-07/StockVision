import { useState, useEffect, useCallback } from 'react';
import { polygonApi, StockQuote, StockDetails } from '@/services/polygonApi';

export interface EnhancedStockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  marketCapValue: number;
  sector: string;
  pe?: number;
  dividend?: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  history: Array<{
    date: string;
    price: number;
    volume: number;
    high: number;
    low: number;
    open: number;
  }>;
  isFavorite: boolean;
  lastUpdated: number;
}

export interface UseStockDataReturn {
  stocks: EnhancedStockData[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  searchStocks: (query: string) => Promise<EnhancedStockData[]>;
  getStockHistory: (symbol: string, days?: number) => Promise<void>;
  marketStatus: any;
}

// Sector mappings for better categorization
const SECTOR_MAPPINGS: Record<string, string> = {
  'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'GOOG': 'Technology',
  'META': 'Technology', 'NVDA': 'Technology', 'TSLA': 'Technology', 'NFLX': 'Technology',
  'ADBE': 'Technology', 'CRM': 'Technology', 'ORCL': 'Technology', 'INTC': 'Technology',
  'AMD': 'Technology', 'AVGO': 'Technology', 'PYPL': 'Technology', 'UBER': 'Technology',
  
  'JNJ': 'Healthcare', 'UNH': 'Healthcare', 'PFE': 'Healthcare', 'ABBV': 'Healthcare',
  'TMO': 'Healthcare', 'ABT': 'Healthcare', 'LLY': 'Healthcare', 'DHR': 'Healthcare',
  'BMY': 'Healthcare', 'AMGN': 'Healthcare', 'GILD': 'Healthcare', 'CVS': 'Healthcare',
  
  'JPM': 'Finance', 'BAC': 'Finance', 'WFC': 'Finance', 'GS': 'Finance',
  'MS': 'Finance', 'C': 'Finance', 'AXP': 'Finance', 'BLK': 'Finance',
  'SCHW': 'Finance', 'USB': 'Finance', 'PNC': 'Finance', 'TFC': 'Finance',
  'V': 'Finance', 'MA': 'Finance',
  
  'AMZN': 'Consumer', 'HD': 'Consumer', 'MCD': 'Consumer', 'NKE': 'Consumer',
  'SBUX': 'Consumer', 'TGT': 'Consumer', 'LOW': 'Consumer', 'TJX': 'Consumer',
  'COST': 'Consumer', 'WMT': 'Consumer', 'PG': 'Consumer', 'KO': 'Consumer',
  
  'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'EOG': 'Energy',
  'SLB': 'Energy', 'PSX': 'Energy', 'VLO': 'Energy', 'MPC': 'Energy',
  
  'BA': 'Industrial', 'CAT': 'Industrial', 'GE': 'Industrial', 'MMM': 'Industrial',
  'HON': 'Industrial', 'UPS': 'Industrial', 'RTX': 'Industrial', 'LMT': 'Industrial',
  
  'NEE': 'Utilities', 'DUK': 'Utilities', 'SO': 'Utilities', 'D': 'Utilities',
  'AEP': 'Utilities', 'EXC': 'Utilities',
  
  'AMT': 'Real Estate', 'PLD': 'Real Estate', 'CCI': 'Real Estate', 'EQIX': 'Real Estate'
};

// Popular stock symbols to fetch by default
const DEFAULT_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'JNJ', 'V',
  'PG', 'UNH', 'HD', 'MA', 'BAC', 'XOM', 'ABBV', 'KO', 'PFE', 'AVGO',
  'NFLX', 'ADBE', 'CRM', 'TMO', 'ABT', 'COST', 'WMT', 'MCD', 'CVX', 'NKE'
];

export function useStockData(): UseStockDataReturn {
  const [stocks, setStocks] = useState<EnhancedStockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketStatus, setMarketStatus] = useState(null);

  const transformStockData = useCallback((quote: StockQuote, details?: StockDetails): EnhancedStockData => {
    const price = quote.day?.c || quote.min?.c || 0;
    const change = quote.todaysChange || 0;
    const changePercent = quote.todaysChangePerc || 0;
    const volume = quote.day?.v || quote.min?.v || 0;
    const high = quote.day?.h || quote.min?.h || price;
    const low = quote.day?.l || quote.min?.l || price;
    const open = quote.day?.o || quote.min?.o || price;
    const previousClose = quote.prevDay?.c || price;

    // Estimate market cap (simplified calculation)
    const estimatedShares = details?.weighted_shares_outstanding || 1000000000; // 1B default
    const marketCapValue = (price * estimatedShares) / 1000000000; // in billions

    return {
      symbol: quote.ticker,
      name: details?.name || quote.ticker,
      price,
      change,
      changePercent,
      volume,
      marketCap: `${marketCapValue.toFixed(1)}B`,
      marketCapValue,
      sector: SECTOR_MAPPINGS[quote.ticker] || 'Other',
      high,
      low,
      open,
      previousClose,
      history: [], // Will be populated separately
      isFavorite: false,
      lastUpdated: quote.updated || Date.now(),
      pe: Math.random() * 30 + 5, // Mock P/E ratio
      dividend: Math.random() * 5 // Mock dividend yield
    };
  }, []);

  const fetchStockData = useCallback(async (symbols: string[] = DEFAULT_SYMBOLS) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch quotes for all symbols
      const quotesResponse = await polygonApi.getQuotes(symbols);
      
      if (!quotesResponse.results || quotesResponse.results.length === 0) {
        throw new Error('No stock data received');
      }

      // Transform the data
      const transformedStocks: EnhancedStockData[] = quotesResponse.results.map(quote => 
        transformStockData(quote)
      );

      // Fetch historical data for each stock (last 30 days)
      const stocksWithHistory = await Promise.all(
        transformedStocks.map(async (stock) => {
          try {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            const historyResponse = await polygonApi.getHistoricalData(
              stock.symbol,
              1,
              'day',
              startDate,
              endDate,
              { limit: 30 }
            );

            const history = historyResponse.results?.map(bar => ({
              date: new Date(bar.t).toISOString().split('T')[0],
              price: bar.c,
              volume: bar.v,
              high: bar.h,
              low: bar.l,
              open: bar.o
            })) || [];

            return { ...stock, history };
          } catch (error) {
            console.warn(`Failed to fetch history for ${stock.symbol}:`, error);
            return stock;
          }
        })
      );

      setStocks(stocksWithHistory);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  }, [transformStockData]);

  const refreshData = useCallback(async () => {
    await fetchStockData();
  }, [fetchStockData]);

  const searchStocks = useCallback(async (query: string): Promise<EnhancedStockData[]> => {
    try {
      const searchResponse = await polygonApi.searchTickers(query, 20);
      
      if (!searchResponse.results || searchResponse.results.length === 0) {
        return [];
      }

      // Get quotes for search results
      const symbols = searchResponse.results.map(ticker => ticker.ticker);
      const quotesResponse = await polygonApi.getQuotes(symbols);

      return quotesResponse.results?.map(quote => transformStockData(quote)) || [];
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }, [transformStockData]);

  const getStockHistory = useCallback(async (symbol: string, days: number = 30) => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const historyResponse = await polygonApi.getHistoricalData(
        symbol,
        1,
        'day',
        startDate,
        endDate,
        { limit: days }
      );

      const history = historyResponse.results?.map(bar => ({
        date: new Date(bar.t).toISOString().split('T')[0],
        price: bar.c,
        volume: bar.v,
        high: bar.h,
        low: bar.l,
        open: bar.o
      })) || [];

      // Update the specific stock's history
      setStocks(prev => prev.map(stock => 
        stock.symbol === symbol ? { ...stock, history } : stock
      ));
    } catch (error) {
      console.error(`Error fetching history for ${symbol}:`, error);
    }
  }, []);

  // Fetch market status
  const fetchMarketStatus = useCallback(async () => {
    try {
      const status = await polygonApi.getMarketStatus();
      setMarketStatus(status);
    } catch (error) {
      console.error('Error fetching market status:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchStockData();
    fetchMarketStatus();
  }, [fetchStockData, fetchMarketStatus]);

  // Auto-refresh data every 5 minutes during market hours
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        refreshData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loading, refreshData]);

  return {
    stocks,
    loading,
    error,
    refreshData,
    searchStocks,
    getStockHistory,
    marketStatus
  };
}