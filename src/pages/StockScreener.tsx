import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useStockData, EnhancedStockData } from "@/hooks/useStockData";
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshCw,
  Download,
  Star,
  StarOff,
  AlertCircle,
  Wifi,
  WifiOff
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Cell
} from "recharts";

export default function StockScreener() {
  const { 
    stocks, 
    loading, 
    error, 
    refreshData, 
    searchStocks, 
    getStockHistory, 
    marketStatus 
  } = useStockData();

  const [filteredStocks, setFilteredStocks] = useState<EnhancedStockData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [marketCapRange, setMarketCapRange] = useState([0, 3000]);
  const [sortBy, setSortBy] = useState("marketCapValue");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedStock, setSelectedStock] = useState<EnhancedStockData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<EnhancedStockData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const sectors = useMemo(() => {
    const uniqueSectors = [...new Set(stocks.map(stock => stock.sector))];
    return uniqueSectors.sort();
  }, [stocks]);

  // Update price and market cap ranges based on available data
  useEffect(() => {
    if (stocks.length > 0) {
      const prices = stocks.map(s => s.price);
      const marketCaps = stocks.map(s => s.marketCapValue);
      
      const maxPrice = Math.max(...prices);
      const maxMarketCap = Math.max(...marketCaps);
      
      setPriceRange(prev => [prev[0], Math.max(prev[1], Math.ceil(maxPrice))]);
      setMarketCapRange(prev => [prev[0], Math.max(prev[1], Math.ceil(maxMarketCap))]);
    }
  }, [stocks]);

  // Filter and sort stocks
  useEffect(() => {
    let filtered = stocks.filter(stock => {
      const matchesSearch = stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           stock.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = selectedSector === "all" || stock.sector === selectedSector;
      const matchesPrice = stock.price >= priceRange[0] && stock.price <= priceRange[1];
      const matchesMarketCap = stock.marketCapValue >= marketCapRange[0] && stock.marketCapValue <= marketCapRange[1];
      
      return matchesSearch && matchesSector && matchesPrice && matchesMarketCap;
    });

    // Sort stocks
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof EnhancedStockData];
      let bValue = b[sortBy as keyof EnhancedStockData];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredStocks(filtered);
  }, [stocks, searchTerm, selectedSector, priceRange, marketCapRange, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchStocks(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFavorite = (symbol: string) => {
    // This would typically update a user's favorites in a database
    // For now, we'll just update the local state
    console.log(`Toggle favorite for ${symbol}`);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />;
  };

  const handleStockSelect = async (stock: EnhancedStockData) => {
    setSelectedStock(stock);
    if (stock.history.length === 0) {
      await getStockHistory(stock.symbol);
    }
  };

  // Chart data for market overview
  const sectorData = useMemo(() => {
    const sectorStats: Record<string, { count: number; avgChange: number; totalMarketCap: number }> = {};
    
    filteredStocks.forEach(stock => {
      if (!sectorStats[stock.sector]) {
        sectorStats[stock.sector] = { count: 0, avgChange: 0, totalMarketCap: 0 };
      }
      sectorStats[stock.sector].count++;
      sectorStats[stock.sector].avgChange += stock.changePercent;
      sectorStats[stock.sector].totalMarketCap += stock.marketCapValue;
    });

    return Object.entries(sectorStats).map(([sector, stats]) => ({
      sector,
      count: stats.count,
      avgChange: parseFloat((stats.avgChange / stats.count).toFixed(2)),
      totalMarketCap: stats.totalMarketCap
    }));
  }, [filteredStocks]);

  const performanceData = useMemo(() => {
    return filteredStocks.map(stock => ({
      symbol: stock.symbol,
      price: stock.price,
      change: stock.changePercent,
      volume: stock.volume,
      marketCap: stock.marketCapValue
    }));
  }, [filteredStocks]);

  if (loading && stocks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gradient">Stock Screener</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Live market data powered by Polygon.io</span>
            {marketStatus ? (
              <div className="flex items-center gap-1">
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-xs">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-xs">Disconnected</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing || loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", (isRefreshing || loading) && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}. Please try refreshing the data.
          </AlertDescription>
        </Alert>
      )}

      {/* Market Status */}
      {marketStatus && (
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Market Status: </span>
                <Badge variant="outline" className="ml-1">
                  {marketStatus.exchanges?.nasdaq || 'Unknown'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">NYSE: </span>
                <Badge variant="outline" className="ml-1">
                  {marketStatus.exchanges?.nyse || 'Unknown'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Server Time: </span>
                <span className="text-muted-foreground">
                  {marketStatus.serverTime ? new Date(marketStatus.serverTime).toLocaleTimeString() : 'Unknown'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Symbol or company name"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="pl-10"
                />
                {isSearching && (
                  <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && searchTerm.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setSearchTerm(stock.symbol);
                        setSearchResults([]);
                      }}
                    >
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sector */}
            <div className="space-y-2">
              <Label>Sector</Label>
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {sectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="symbol">Symbol</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="changePercent">Change %</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="marketCapValue">Market Cap</SelectItem>
                  <SelectItem value="pe">P/E Ratio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label>Order</Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price Range */}
            <div className="space-y-3">
              <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={Math.max(1000, Math.max(...stocks.map(s => s.price)))}
                min={0}
                step={10}
                className="w-full"
              />
            </div>

            {/* Market Cap Range */}
            <div className="space-y-3">
              <Label>Market Cap Range: ${marketCapRange[0]}B - ${marketCapRange[1]}B</Label>
              <Slider
                value={marketCapRange}
                onValueChange={setMarketCapRange}
                max={Math.max(3000, Math.max(...stocks.map(s => s.marketCapValue)))}
                min={0}
                step={50}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sectors">Sectors</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="details">Stock Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Overview Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Price vs Performance</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Bubble size represents market cap
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="price" 
                        name="Price"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <YAxis 
                        dataKey="change" 
                        name="Change %"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'price' ? `$${value}` : 
                          name === 'change' ? `${value}%` : value,
                          name === 'price' ? 'Price' : 
                          name === 'change' ? 'Change %' : name
                        ]}
                        labelFormatter={(label) => `Symbol: ${label}`}
                      />
                      <Scatter dataKey="change" fill="#3b82f6">
                        {performanceData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.change >= 0 ? "#22c55e" : "#ef4444"}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Volume Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Trading Volume (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="symbol" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        formatter={(value) => [`${(value / 1000000).toFixed(1)}M`, 'Volume']}
                      />
                      <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sectors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sector Performance */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Sector Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="sector" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Avg Change']}
                      />
                      <Bar dataKey="avgChange" radius={[4, 4, 0, 0]}>
                        {sectorData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.avgChange >= 0 ? "#22c55e" : "#ef4444"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sector Market Cap */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Sector Market Cap Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sectorData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="sector" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}B`}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value.toFixed(1)}B`, 'Total Market Cap']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="totalMarketCap" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {selectedStock ? (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <span>{selectedStock.symbol} - {selectedStock.name}</span>
                    <div className="text-sm text-muted-foreground mt-1">
                      Last updated: {new Date(selectedStock.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${selectedStock.price.toFixed(2)}</div>
                    <div className={cn(
                      "flex items-center gap-1",
                      selectedStock.changePercent >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {selectedStock.changePercent >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>
                        {selectedStock.changePercent >= 0 ? "+" : ""}{selectedStock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-muted-foreground">Open</div>
                    <div className="font-bold">${selectedStock.open.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">High</div>
                    <div className="font-bold">${selectedStock.high.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Low</div>
                    <div className="font-bold">${selectedStock.low.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Volume</div>
                    <div className="font-bold">{(selectedStock.volume / 1000000).toFixed(1)}M</div>
                  </div>
                </div>
                
                {selectedStock.history.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={selectedStock.history}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${value}`}
                          domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip 
                          formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6, fill: "#3b82f6" }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Loading historical data...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Select a stock from the table below to view its performance chart</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Stock Details ({filteredStocks.length} stocks)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('symbol')}
                      >
                        <div className="flex items-center gap-1">
                          Symbol {getSortIcon('symbol')}
                        </div>
                      </TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Price {getSortIcon('price')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                        onClick={() => handleSort('changePercent')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Change {getSortIcon('changePercent')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                        onClick={() => handleSort('volume')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Volume {getSortIcon('volume')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                        onClick={() => handleSort('marketCapValue')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Market Cap {getSortIcon('marketCapValue')}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">High</TableHead>
                      <TableHead className="text-right">Low</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStocks.map((stock) => (
                      <TableRow 
                        key={stock.symbol}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleStockSelect(stock)}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(stock.symbol);
                            }}
                          >
                            {stock.isFavorite ? (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-bold">{stock.symbol}</TableCell>
                        <TableCell className="max-w-48 truncate">{stock.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{stock.sector}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ${stock.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {stock.changePercent >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className={cn(
                              "font-medium",
                              stock.changePercent >= 0 ? "text-green-500" : "text-red-500"
                            )}>
                              {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {(stock.volume / 1000000).toFixed(1)}M
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {stock.marketCap}
                        </TableCell>
                        <TableCell className="text-right">
                          ${stock.high.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${stock.low.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { StockScreener }