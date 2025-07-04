'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpDown, Plus, Pause, Play, X, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function TransfersPage() {
  const [activeTab, setActiveTab] = useState('active');

  // This would come from your database
  const activeTransfers = [
    {
      id: '1',
      fileName: 'project-backup-2024-01-04.tar.gz',
      size: '45.2 GB',
      sourceAgent: 'agent-us-west-1',
      destAgent: 'agent-eu-central-1',
      progress: 67,
      speed: '1.3 Gbps',
      eta: '12 min',
      status: 'transferring',
      priority: 'high',
      startedAt: '10:30 AM'
    },
    {
      id: '2',
      fileName: 'media-assets-collection.zip',
      size: '12.8 GB',
      sourceAgent: 'agent-eu-central-1',
      destAgent: 'agent-ap-south-1',
      progress: 23,
      speed: '980 Mbps',
      eta: '8 min',
      status: 'transferring',
      priority: 'normal',
      startedAt: '10:45 AM'
    },
    {
      id: '3',
      fileName: 'database-snapshot.sql',
      size: '3.4 GB',
      sourceAgent: 'agent-us-east-1',
      destAgent: 'agent-us-west-1',
      progress: 0,
      speed: '0 bps',
      eta: 'Calculating...',
      status: 'queued',
      priority: 'low',
      startedAt: '-'
    },
  ];

  const completedTransfers = [
    {
      id: '4',
      fileName: 'analytics-data-export.csv',
      size: '8.7 GB',
      sourceAgent: 'agent-us-west-1',
      destAgent: 'agent-eu-central-1',
      duration: '4 min 32 sec',
      avgSpeed: '1.5 Gbps',
      completedAt: '9:15 AM',
      status: 'completed'
    },
    {
      id: '5',
      fileName: 'video-render-output.mp4',
      size: '24.3 GB',
      sourceAgent: 'agent-ap-south-1',
      destAgent: 'agent-us-west-1',
      duration: '18 min 12 sec',
      avgSpeed: '1.1 Gbps',
      completedAt: '8:45 AM',
      status: 'completed'
    },
  ];

  const scheduledTransfers = [
    {
      id: '6',
      fileName: 'daily-backup-*.tar.gz',
      sourceAgent: 'agent-us-west-1',
      destAgent: 'agent-eu-central-1',
      schedule: 'Daily at 2:00 AM UTC',
      nextRun: 'In 14 hours',
      priority: 'high',
      enabled: true
    },
    {
      id: '7',
      fileName: 'weekly-logs-*.zip',
      sourceAgent: 'agent-*',
      destAgent: 'agent-backup-central',
      schedule: 'Every Sunday at 12:00 AM UTC',
      nextRun: 'In 3 days',
      priority: 'normal',
      enabled: true
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Transfers</h1>
          <p className="text-muted-foreground">
            Manage file transfers across your agent network
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Transfer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Transfers</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTransfers.filter(t => t.status === 'transferring').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queued</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTransfers.filter(t => t.status === 'queued').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Throughput</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.28 Gbps</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Volume</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2 TB</div>
          </CardContent>
        </Card>
      </div>

      {/* Transfers Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transfer.fileName}</p>
                          <p className="text-sm text-muted-foreground">{transfer.size}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{transfer.sourceAgent}</p>
                          <p className="text-muted-foreground">→ {transfer.destAgent}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={transfer.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">{transfer.progress}%</p>
                        </div>
                      </TableCell>
                      <TableCell>{transfer.speed}</TableCell>
                      <TableCell>{transfer.eta}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transfer.priority === 'high' ? 'destructive' :
                          transfer.priority === 'normal' ? 'default' :
                          'secondary'
                        }>
                          {transfer.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {transfer.status === 'transferring' ? (
                            <Button variant="ghost" size="sm">
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Avg Speed</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.fileName}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{transfer.sourceAgent}</p>
                          <p className="text-muted-foreground">→ {transfer.destAgent}</p>
                        </div>
                      </TableCell>
                      <TableCell>{transfer.size}</TableCell>
                      <TableCell>{transfer.duration}</TableCell>
                      <TableCell>{transfer.avgSpeed}</TableCell>
                      <TableCell>{transfer.completedAt}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pattern</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.fileName}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{transfer.sourceAgent}</p>
                          <p className="text-muted-foreground">→ {transfer.destAgent}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {transfer.schedule}
                        </div>
                      </TableCell>
                      <TableCell>{transfer.nextRun}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transfer.priority === 'high' ? 'destructive' :
                          transfer.priority === 'normal' ? 'default' :
                          'secondary'
                        }>
                          {transfer.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transfer.enabled ? 'default' : 'outline'}>
                          {transfer.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}