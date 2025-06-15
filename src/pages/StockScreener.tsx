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
import { cn } from "@/lib/utils";
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
  StarOff
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

// Mock stock data - In production, this would come from an API
const generateMockStockData = () => {
  const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrial', 'Real Estate', 'Utilities'];
  const companies = [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Finance' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Finance' },
    { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer' },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare' },
    { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer' },
    { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Finance' },
    { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'Finance' },
    { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy' },
    { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
    { symbol: 'KO', name: 'Coca-Cola Company', sector: 'Consumer' },
    { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
    { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology' }
  ];

  return companies.map(company => {
    const basePrice = Math.random() * 300 + 50;
    const change = (Math.random() - 0.5) * 20;
    const changePercent = (change / basePrice) * 100;
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    const marketCap = Math.floor(Math.random() * 2000) + 100;
    const pe = Math.random() * 40 + 5;
    const dividend = Math.random() * 5;
    
    // Generate historical data for charts
    const history = [];
    let currentPrice = basePrice;
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      currentPrice += (Math.random() - 0.5) * 5;
      history.push({
        date: date.toISOString().split('T')[0],
        price: Math.max(currentPrice, 1),
        volume: Math.floor(Math.random() * 5000000) + 500000
      });
    }

    return {
      ...company,
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume,
      marketCap: `${marketCap.toFixed(1)}B`,
      marketCapValue: marketCap,
      pe: parseFloat(pe.toFixed(2)),
      dividend: parseFloat(dividend.toFixed(2)),
      history,
      isFavorite: Math.random() > 0.7
    };
  });
};

export default function StockScreener() {
  const [stocks, setStocks] = useState(generateMockStockData());
  const [filteredStocks, setFilteredStocks] = useState(stocks);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [marketCapRange, setMarketCapRange] = useState([0, 2000]);
  const [sortBy, setSortBy] = useState("marketCap");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedStock, setSelectedStock] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const sectors = useMemo(() => {
    const uniqueSectors = [...new Set(stocks.map(stock => stock.sector))];
    return uniqueSectors.sort();
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
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'marketCapValue') {
        aValue = a.marketCapValue;
        bValue = b.marketCapValue;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredStocks(filtered);
  }, [stocks, searchTerm, selectedSector, priceRange, marketCapRange, sortBy, sortOrder]);

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setStocks(generateMockStockData());
      setIsLoading(false);
    }, 1000);
  };

  const toggleFavorite = (symbol) => {
    setStocks(prev => prev.map(stock => 
      stock.symbol === symbol 
        ? { ...stock, isFavorite: !stock.isFavorite }
        : stock
    ));
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />;
  };

  // Chart data for market overview
  const sectorData = useMemo(() => {
    const sectorStats = {};
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

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gradient">Stock Screener</h1>
          <p className="text-muted-foreground">Discover and analyze stocks with advanced filtering</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshData} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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
                max={500}
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
                max={2000}
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
                <CardTitle>Market Cap Distribution</CardTitle>
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
                <CardTitle>Trading Volume</CardTitle>
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
                <CardTitle>Sector Market Cap</CardTitle>
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
                        formatter={(value) => [`${value}B`, 'Total Market Cap']}
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
          {selectedStock && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{selectedStock.symbol} - {selectedStock.name}</CardTitle>
              </CardHeader>
              <CardContent>
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
                      />
                      <Tooltip 
                        formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
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
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                        onClick={() => handleSort('pe')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          P/E {getSortIcon('pe')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStocks.map((stock) => (
                      <TableRow 
                        key={stock.symbol}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedStock(stock)}
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
                          {stock.pe.toFixed(2)}
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