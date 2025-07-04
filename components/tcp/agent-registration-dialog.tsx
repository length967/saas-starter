'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Plus, CheckCircle } from 'lucide-react';

interface AgentRegistrationDialogProps {
  projectId: string;
  onRegistered?: () => void;
}

export function AgentRegistrationDialog({ projectId, onRegistered }: AgentRegistrationDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'details' | 'token'>('details');
  const [loading, setLoading] = useState(false);
  const [agentDetails, setAgentDetails] = useState({
    name: '',
    type: 'tcp-server',
    location: '',
    description: ''
  });
  const [registrationToken, setRegistrationToken] = useState('');

  const handleGenerateToken = async () => {
    setLoading(true);
    try {
      // Call API to create agent and generate token
      const response = await fetch('/api/v1/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...agentDetails,
          projectId
        })
      });

      if (!response.ok) throw new Error('Failed to create agent');

      const data = await response.json();
      
      // Generate registration token
      const tokenResponse = await fetch(`/api/v1/agents/${data.data.id}/register`, {
        method: 'POST'
      });

      if (!tokenResponse.ok) throw new Error('Failed to generate token');

      const tokenData = await tokenResponse.json();
      setRegistrationToken(tokenData.data.token);
      setStep('token');
    } catch (error) {
      console.error('Failed to generate registration token');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleClose = () => {
    setOpen(false);
    setStep('details');
    setAgentDetails({
      name: '',
      type: 'tcp-server',
      location: '',
      description: ''
    });
    setRegistrationToken('');
    if (onRegistered) onRegistered();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Register Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        {step === 'details' ? (
          <>
            <DialogHeader>
              <DialogTitle>Register New Agent</DialogTitle>
              <DialogDescription>
                Configure your TCP agent details. A registration token will be generated for one-time use.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={agentDetails.name}
                  onChange={(e) => setAgentDetails({ ...agentDetails, name: e.target.value })}
                  placeholder="agent-us-west-1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Agent Type</Label>
                <Select
                  value={agentDetails.type}
                  onValueChange={(value) => setAgentDetails({ ...agentDetails, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tcp-server">TCP Server</SelectItem>
                    <SelectItem value="tcp-client">TCP Client</SelectItem>
                    <SelectItem value="tcp-relay">TCP Relay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={agentDetails.location}
                  onChange={(e) => setAgentDetails({ ...agentDetails, location: e.target.value })}
                  placeholder="California, US"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={agentDetails.description}
                  onChange={(e) => setAgentDetails({ ...agentDetails, description: e.target.value })}
                  placeholder="Primary production server"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerateToken}
                disabled={!agentDetails.name || !agentDetails.location || loading}
              >
                Generate Token
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Registration Token Generated</DialogTitle>
              <DialogDescription>
                Use this token to register your agent. It will expire in 15 minutes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Registration Token</span>
                  <Badge variant="secondary">Expires in 15 min</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded border text-sm break-all">
                    {registrationToken}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(registrationToken)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Register your agent with:</p>
                <div className="p-3 bg-muted rounded">
                  <code className="text-sm">
                    agent-cli register -token {registrationToken}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => copyToClipboard(`agent-cli register -token ${registrationToken}`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Next Steps:</p>
                    <ol className="mt-1 space-y-1 text-blue-800">
                      <li>1. Run the registration command on your agent machine</li>
                      <li>2. Start the agent service with: <code className="bg-blue-100 px-1 rounded">gui-service</code></li>
                      <li>3. The agent will appear in your dashboard once connected</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}