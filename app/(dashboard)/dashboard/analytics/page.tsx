'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Activity, Network, Download } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Performance metrics and insights for your TCP Agent Platform
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="7d">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data Transferred</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.7 TB</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transfer Speed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.18 Gbps</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.3%</span> improvement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">-3.2%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Efficiency</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              AI optimization active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="throughput" className="space-y-4">
        <TabsList>
          <TabsTrigger value="throughput">Throughput</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="network">Network Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="throughput" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Throughput Over Time</CardTitle>
              <CardDescription>
                Aggregated throughput across all agents (Gbps)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted rounded">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
                <p className="ml-4 text-muted-foreground">Throughput chart visualization</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Peak Hours Analysis</CardTitle>
                <CardDescription>Highest throughput periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">9:00 AM - 11:00 AM</span>
                    <span className="text-sm font-medium">2.4 Gbps avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">2:00 PM - 4:00 PM</span>
                    <span className="text-sm font-medium">2.1 Gbps avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">7:00 PM - 9:00 PM</span>
                    <span className="text-sm font-medium">1.8 Gbps avg</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Route Performance</CardTitle>
                <CardDescription>Top performing transfer routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">US-West → EU-Central</span>
                    <span className="text-sm font-medium">1.45 Gbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">EU-Central → AP-South</span>
                    <span className="text-sm font-medium">1.12 Gbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">US-East → US-West</span>
                    <span className="text-sm font-medium">1.38 Gbps</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Volume Trends</CardTitle>
              <CardDescription>
                Daily transfer counts and success rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted rounded">
                <Activity className="h-12 w-12 text-muted-foreground" />
                <p className="ml-4 text-muted-foreground">Transfer trends visualization</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Metrics</CardTitle>
              <CardDescription>
                Resource utilization and efficiency by agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted rounded">
                <Network className="h-12 w-12 text-muted-foreground" />
                <p className="ml-4 text-muted-foreground">Agent performance visualization</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Optimization Analysis</CardTitle>
              <CardDescription>
                AI-driven optimization impact and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">AI Optimization Impact</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Throughput improvement</span>
                      <span className="font-medium text-green-600">+18.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Packet loss reduction</span>
                      <span className="font-medium text-green-600">-42%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency optimization</span>
                      <span className="font-medium text-green-600">-15ms avg</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded">
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Enable BBR on agent-ap-south-1 for 20% throughput gain</li>
                    <li>• Increase buffer size on Windows agents during peak hours</li>
                    <li>• Consider adding agent in SA region for better coverage</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}