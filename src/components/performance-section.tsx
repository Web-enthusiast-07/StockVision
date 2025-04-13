import { marketIndices } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ChartContainer } from "./ui/chart";

export function PerformanceSection({ className }: { className?: string }) {
  // Filter the data for the performance chart (last 30 days)
  const performanceData = marketIndices.map((index) => ({
    name: index.name,
    data: index.history,
    change: index.change,
  }));

  return (
    <Card className={cn("backdrop-blur-lg bg-card/80 border-primary/10 shadow-lg transition-all hover:shadow-xl overflow-hidden", className)}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle className="text-xl font-extrabold">Market Performance</CardTitle>
        <div className="flex flex-wrap gap-2">
          {marketIndices.map((index) => (
            <Badge 
              key={index.name} 
              variant={index.change >= 0 ? "success" : "destructive"}
              className="flex items-center gap-1 font-medium whitespace-nowrap"
            >
              {index.name}
              {index.change >= 0 ? (
                <ArrowUpIcon className="h-3 w-3" />
              ) : (
                <ArrowDownIcon className="h-3 w-3" />
              )}
              {Math.abs(index.change).toFixed(2)}%
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="h-[450px] md:h-[500px] lg:h-[650px] pt-0 pb-16 px-2 md:px-6 flex items-center justify-center">
        <div className="w-full h-full max-w-7xl mx-auto">
          <ChartContainer
            config={{
              "S&P 500": { color: "#22C55E" },
              "NASDAQ": { color: "#4E97F5" },
              "DOW JONES": { color: "#F59E0B" },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={marketIndices[0].history}
                margin={{ top: 20, right: 40, left: 10, bottom: 50 }}
              >
                <defs>
                  <linearGradient id="s&p500" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="nasdaq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4E97F5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4E97F5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dowjones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                  minTickGap={30}
                  dy={10}
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(price) => `$${Math.round(price)}`}
                  domain={['dataMin - 100', 'dataMax + 100']}
                  orientation="right"
                  dx={10}
                  width={70}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#22C55E"
                  fillOpacity={1}
                  fill="url(#s&p500)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const date = new Date(label);
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md backdrop-blur-lg">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium">Date:</div>
          <div>{date.toLocaleDateString()}</div>
          <div className="font-medium">Price:</div>
          <div>${payload[0].value.toFixed(2)}</div>
        </div>
      </div>
    );
  }
  return null;
}
