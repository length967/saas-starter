'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bot, Plus, Search, Signal, SignalHigh, SignalLow, Download, Upload, Cpu, HardDrive, Globe } from 'lucide-react';
import { AgentRegistrationDialog } from '@/components/tcp/agent-registration-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // This would come from your database
  const agents = [
    {
      id: '1',
      name: 'agent-us-west-1',
      hostname: 'tcp-agent-001.example.com',
      ip: '192.168.1.101',
      location: 'California, US',
      status: 'online',
      version: '2.4.1',
      os: 'Linux',
      lastSeen: '2 mins ago',
      throughput: { up: '1.2 Gbps', down: '980 Mbps' },
      resources: { cpu: 15, memory: 32, disk: 45 },
      capabilities: { bbr: true, tls: true, zeroCopy: true }
    },
    {
      id: '2',
      name: 'agent-eu-central-1',
      hostname: 'tcp-agent-002.example.com',
      ip: '192.168.2.101',
      location: 'Frankfurt, DE',
      status: 'online',
      version: '2.4.1',
      os: 'Linux',
      lastSeen: '1 min ago',
      throughput: { up: '850 Mbps', down: '1.1 Gbps' },
      resources: { cpu: 45, memory: 67, disk: 72 },
      capabilities: { bbr: true, tls: true, zeroCopy: true }
    },
    {
      id: '3',
      name: 'agent-ap-south-1',
      hostname: 'tcp-agent-003.example.com',
      ip: '192.168.3.101',
      location: 'Mumbai, IN',
      status: 'offline',
      version: '2.4.0',
      os: 'Windows',
      lastSeen: '3 hours ago',
      throughput: { up: '0 bps', down: '0 bps' },
      resources: { cpu: 0, memory: 0, disk: 0 },
      capabilities: { bbr: false, tls: true, zeroCopy: false }
    },
  ];

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground">
            Manage and monitor your TCP agents
          </p>
        </div>
        <AgentRegistrationDialog projectId="default-project" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Signal className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter(a => a.status === 'online').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Throughput</CardTitle>
            <SignalHigh className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.05 Gbps</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents by name, hostname, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Agents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Throughput</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead>Capabilities</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">{agent.hostname}</p>
                      <p className="text-xs text-muted-foreground">{agent.ip}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      {agent.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        agent.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm">{agent.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{agent.lastSeen}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{agent.version}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{agent.os}</p>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        <Upload className="mr-1 h-3 w-3" />
                        {agent.throughput.up}
                      </div>
                      <div className="flex items-center text-xs">
                        <Download className="mr-1 h-3 w-3" />
                        {agent.throughput.down}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div>CPU: {agent.resources.cpu}%</div>
                      <div>MEM: {agent.resources.memory}%</div>
                      <div>DISK: {agent.resources.disk}%</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {agent.capabilities.bbr && (
                        <Badge variant="secondary" className="text-xs">BBR</Badge>
                      )}
                      {agent.capabilities.tls && (
                        <Badge variant="secondary" className="text-xs">TLS</Badge>
                      )}
                      {agent.capabilities.zeroCopy && (
                        <Badge variant="secondary" className="text-xs">ZC</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}