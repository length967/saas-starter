import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Bot, FolderKanban, ArrowUpDown, Users, HardDrive, Cpu, Network } from 'lucide-react';

export default function DashboardOverview() {
  // This would come from your database
  const stats = {
    totalAgents: 24,
    activeAgents: 18,
    totalProjects: 5,
    activeTransfers: 3,
    totalTransferred: '1.2 TB',
    avgThroughput: '1.25 Gbps',
    teamMembers: 12,
    systemHealth: 98,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-muted-foreground">
          Monitor your TCP Agent Platform at a glance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAgents}/{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.activeAgents / stats.totalAgents) * 100)}% online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Transfers</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTransfers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTransferred} transferred today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Throughput</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgThroughput}</div>
            <p className="text-xs text-muted-foreground">
              Peak: 1.5 Gbps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemHealth}%</div>
            <Badge variant="outline" className="text-xs">Healthy</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transfers</CardTitle>
            <CardDescription>Latest file transfers across your agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { file: 'backup-2024-01-04.tar.gz', size: '45.2 GB', status: 'completed', throughput: '1.3 Gbps' },
                { file: 'media-assets.zip', size: '12.8 GB', status: 'in_progress', throughput: '980 Mbps' },
                { file: 'database-dump.sql', size: '3.4 GB', status: 'queued', throughput: '-' },
              ].map((transfer, i) => (
                <div key={i} className="flex items-center justify-between space-x-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{transfer.file}</p>
                    <p className="text-sm text-muted-foreground">{transfer.size}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        transfer.status === 'completed' ? 'default' : 
                        transfer.status === 'in_progress' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {transfer.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">{transfer.throughput}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Status</CardTitle>
            <CardDescription>Real-time agent monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'agent-us-west-1', status: 'online', cpu: 15, memory: 32, location: 'California' },
                { name: 'agent-eu-central-1', status: 'online', cpu: 45, memory: 67, location: 'Frankfurt' },
                { name: 'agent-ap-south-1', status: 'offline', cpu: 0, memory: 0, location: 'Mumbai' },
                { name: 'agent-us-east-1', status: 'online', cpu: 78, memory: 85, location: 'Virginia' },
              ].map((agent, i) => (
                <div key={i} className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4">
                    <div className={`h-2 w-2 rounded-full ${agent.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium leading-none">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">{agent.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">CPU: {agent.cpu}%</p>
                    <p className="text-sm text-muted-foreground">MEM: {agent.memory}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}