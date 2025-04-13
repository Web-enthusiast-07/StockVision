
import { portfolioStocks } from "@/data/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Badge } from "./ui/badge";

export function PortfolioSection({ className }: { className?: string }) {
  return (
    <Card className={cn("backdrop-blur-lg bg-card/80 border-primary/10 shadow-lg transition-all hover:shadow-xl", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-extrabold">My Portfolio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioStocks.map((stock) => (
                <TableRow key={stock.symbol} className="hover:bg-muted/50 backdrop-blur-lg transition-colors">
                  <TableCell className="font-medium">{stock.symbol}</TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell className="text-right">${stock.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant={stock.change >= 0 ? "success" : "destructive"}
                      className="inline-flex items-center gap-1"
                    >
                      {stock.change >= 0 ? (
                        <ArrowUpIcon className="h-3 w-3" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3" />
                      )}
                      {Math.abs(stock.changePercent).toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{stock.shares}</TableCell>
                  <TableCell className="text-right font-bold">${stock.value.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
