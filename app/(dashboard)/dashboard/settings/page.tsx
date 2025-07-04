'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Building2, CreditCard, Key, Bell, Shield, Webhook, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  // This would come from your database
  const company = {
    name: 'Mediamasters',
    id: 'company_123',
    plan: 'Enterprise',
    industry: 'Media & Entertainment',
    timezone: 'America/Los_Angeles',
    dataRetention: 365,
    billingEmail: 'billing@mediamasters.com'
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company and project settings
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API & Webhooks</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" defaultValue={company.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-id">Company ID</Label>
                  <Input id="company-id" value={company.id} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select defaultValue={company.industry}>
                    <SelectTrigger id="industry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Media & Entertainment">Media & Entertainment</SelectItem>
                      <SelectItem value="Software Development">Software Development</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Research">Research</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue={company.timezone}>
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="data-retention">Data Retention Period</Label>
                <Select defaultValue={company.dataRetention.toString()}>
                  <SelectTrigger id="data-retention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">365 days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  How long to retain telemetry and transfer data
                </p>
              </div>
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for your company
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <p className="font-medium">Export Company Data</p>
                    <p className="text-sm text-muted-foreground">
                      Download all your company data as a ZIP file
                    </p>
                  </div>
                  <Button variant="outline">Export Data</Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded bg-red-50">
                  <div>
                    <p className="font-medium text-red-900">Delete Company</p>
                    <p className="text-sm text-red-700">
                      Permanently delete your company and all associated data
                    </p>
                  </div>
                  <Button variant="destructive">Delete Company</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <p className="font-medium">Current Plan</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge>{company.plan}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Unlimited agents, projects, and team members
                      </span>
                    </div>
                  </div>
                  <Button variant="outline">Manage Plan</Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-email">Billing Email</Label>
                  <Input
                    id="billing-email"
                    type="email"
                    defaultValue={company.billingEmail}
                  />
                  <p className="text-sm text-muted-foreground">
                    Invoices and billing notifications will be sent here
                  </p>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-sm text-muted-foreground">
                      Visa ending in 4242
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage & Limits</CardTitle>
              <CardDescription>
                Current usage across your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Agents</span>
                    <span className="font-medium">24 / Unlimited</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '5%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Data Transferred (This Month)</span>
                    <span className="font-medium">45.7 TB / Unlimited</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '12%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>API Requests (Today)</span>
                    <span className="font-medium">12,450 / 1,000,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '1.2%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security options for your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="2fa">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for all company members
                  </p>
                </div>
                <Switch id="2fa" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sso">Single Sign-On (SSO)</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable SAML-based SSO for your company
                  </p>
                </div>
                <Switch id="sso" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="ip-allowlist">IP Address Allowlist</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict access to specific IP addresses
                  </p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="audit-logs">Audit Log Retention</Label>
                  <p className="text-sm text-muted-foreground">
                    Extended audit log storage for compliance
                  </p>
                </div>
                <Badge>365 days</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Security</CardTitle>
              <CardDescription>
                Security settings for TCP agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="agent-tls">Require TLS for Agents</Label>
                  <p className="text-sm text-muted-foreground">
                    Force all agent connections to use TLS encryption
                  </p>
                </div>
                <Switch id="agent-tls" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="agent-rotation">Automatic Token Rotation</Label>
                  <p className="text-sm text-muted-foreground">
                    Rotate agent JWT secrets every 30 days
                  </p>
                </div>
                <Switch id="agent-rotation" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for programmatic access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">
                  <Key className="mr-2 h-4 w-4" />
                  Generate New API Key
                </Button>
                <div className="space-y-2">
                  <div className="p-4 border rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Production API Key</p>
                        <p className="text-sm text-muted-foreground">
                          tcp_live_sk_...7h8j • Created 30 days ago
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">Revoke</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Configure webhooks for real-time events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">
                  <Webhook className="mr-2 h-4 w-4" />
                  Add Webhook Endpoint
                </Button>
                <div className="space-y-2">
                  <div className="p-4 border rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">https://api.example.com/webhooks</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">transfer.completed</Badge>
                          <Badge variant="outline" className="text-xs">agent.online</Badge>
                          <Badge variant="outline" className="text-xs">agent.offline</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Email Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-transfers">Transfer Completions</Label>
                    <Switch id="email-transfers" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-failures">Transfer Failures</Label>
                    <Switch id="email-failures" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-agents">Agent Status Changes</Label>
                    <Switch id="email-agents" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-usage">Usage Alerts</Label>
                    <Switch id="email-usage" defaultChecked />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Alert Thresholds</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="throughput-alert">Low Throughput Alert</Label>
                    <Select defaultValue="500">
                      <SelectTrigger id="throughput-alert">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">Below 100 Mbps</SelectItem>
                        <SelectItem value="500">Below 500 Mbps</SelectItem>
                        <SelectItem value="1000">Below 1 Gbps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="failure-alert">Failure Rate Alert</Label>
                    <Select defaultValue="5">
                      <SelectTrigger id="failure-alert">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Above 1%</SelectItem>
                        <SelectItem value="5">Above 5%</SelectItem>
                        <SelectItem value="10">Above 10%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}