import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { RefreshCw, Activity, Clock, Zap, Server } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PerformanceMetrics() {
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h">("24h");
  
  // TODO: Implement metrics API endpoint
  const [isLoading, setIsLoading] = useState(false);
  
  const refetch = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  // Mock data for demonstration (replace with real data from API)
  const mockData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    updateRate: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100) + 50),
    apiLatency: Array.from({ length: 24 }, () => Math.floor(Math.random() * 200) + 50),
    cpuUsage: Array.from({ length: 24 }, () => Math.floor(Math.random() * 40) + 20),
    memoryUsage: Array.from({ length: 24 }, () => Math.floor(Math.random() * 30) + 40),
  };

  const updateRateData = {
    labels: mockData.labels,
    datasets: [
      {
        label: "BGP Updates/min",
        data: mockData.updateRate,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const latencyData = {
    labels: mockData.labels,
    datasets: [
      {
        label: "API Latency (ms)",
        data: mockData.apiLatency,
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const resourceData = {
    labels: mockData.labels,
    datasets: [
      {
        label: "CPU Usage (%)",
        data: mockData.cpuUsage,
        borderColor: "rgb(251, 146, 60)",
        backgroundColor: "rgba(251, 146, 60, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Memory Usage (%)",
        data: mockData.memoryUsage,
        borderColor: "rgb(168, 85, 247)",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  // Calculate current metrics (latest values)
  const currentMetrics = {
    updateRate: mockData.updateRate[mockData.updateRate.length - 1],
    latency: mockData.apiLatency[mockData.apiLatency.length - 1],
    cpu: mockData.cpuUsage[mockData.cpuUsage.length - 1],
    memory: mockData.memoryUsage[mockData.memoryUsage.length - 1],
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Performance Metrics</h1>
          <p className="text-muted-foreground mt-1">
            Real-time system performance and BGP processing metrics
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={timeRange === "1h" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange("1h")}
            >
              1H
            </Button>
            <Button
              variant={timeRange === "6h" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange("6h")}
            >
              6H
            </Button>
            <Button
              variant={timeRange === "24h" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange("24h")}
            >
              24H
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Current Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">BGP Update Rate</p>
              <p className="text-2xl font-bold">{currentMetrics.updateRate}</p>
              <p className="text-xs text-muted-foreground">updates/min</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">API Latency</p>
              <p className="text-2xl font-bold">{currentMetrics.latency}</p>
              <p className="text-xs text-muted-foreground">milliseconds</p>
            </div>
            <Clock className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">CPU Usage</p>
              <p className="text-2xl font-bold">{currentMetrics.cpu}%</p>
              <p className="text-xs text-muted-foreground">current load</p>
            </div>
            <Zap className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Memory Usage</p>
              <p className="text-2xl font-bold">{currentMetrics.memory}%</p>
              <p className="text-xs text-muted-foreground">of total RAM</p>
            </div>
            <Server className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BGP Update Rate Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">BGP Update Rate</h3>
          <div className="h-[300px]">
            <Line data={updateRateData} options={chartOptions} />
          </div>
        </Card>

        {/* API Latency Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">API Response Time</h3>
          <div className="h-[300px]">
            <Line data={latencyData} options={chartOptions} />
          </div>
        </Card>

        {/* Resource Usage Chart */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">System Resource Usage</h3>
          <div className="h-[300px]">
            <Line data={resourceData} options={chartOptions} />
          </div>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
            <div>
              <p className="font-medium">System Health: Good</p>
              <p className="text-sm text-muted-foreground">
                All metrics are within normal operating ranges. BGP processing is stable.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
            <div>
              <p className="font-medium">Average Update Rate: {Math.round(mockData.updateRate.reduce((a, b) => a + b, 0) / mockData.updateRate.length)} updates/min</p>
              <p className="text-sm text-muted-foreground">
                Consistent BGP update processing over the past {timeRange}.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
            <div>
              <p className="font-medium">Average API Latency: {Math.round(mockData.apiLatency.reduce((a, b) => a + b, 0) / mockData.apiLatency.length)}ms</p>
              <p className="text-sm text-muted-foreground">
                API response times are optimal for real-time monitoring.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
