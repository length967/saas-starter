'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Shield, CreditCard, Users, Settings, Search, MoreVertical } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // This would come from your database
  const currentCompany = {
    name: 'Mediamasters',
    plan: 'Enterprise',
    seats: { used: 12, total: 'Unlimited' }
  };

  const teamMembers = [
    {
      id: '1',
      name: 'Mark Johns',
      email: 'mark.johns@me.com',
      avatar: '',
      companyRole: 'Owner',
      projectRoles: ['Production: Project Owner', 'Development: Project Admin'],
      lastActive: '2 mins ago',
      status: 'active'
    },
    {
      id: '2',
      name: 'Sarah Chen',
      email: 'sarah.chen@mediamasters.com',
      avatar: '',
      companyRole: 'Admin',
      projectRoles: ['Production: Project Admin', 'Backup: Project Owner'],
      lastActive: '1 hour ago',
      status: 'active'
    },
    {
      id: '3',
      name: 'Alex Kumar',
      email: 'alex.kumar@mediamasters.com',
      avatar: '',
      companyRole: 'Member',
      projectRoles: ['Development: Developer'],
      lastActive: '3 hours ago',
      status: 'active'
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@mediamasters.com',
      avatar: '',
      companyRole: 'Billing Admin',
      projectRoles: ['Production: Analyst'],
      lastActive: '1 day ago',
      status: 'active'
    },
  ];

  const invitations = [
    {
      id: '1',
      email: 'john.doe@mediamasters.com',
      role: 'Member',
      invitedBy: 'Mark Johns',
      invitedAt: '2 days ago',
      status: 'pending'
    }
  ];

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.companyRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Owner':
        return <Shield className="h-4 w-4" />;
      case 'Billing Admin':
        return <CreditCard className="h-4 w-4" />;
      case 'Admin':
        return <Settings className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (role) {
      case 'Owner':
        return 'destructive';
      case 'Admin':
      case 'Billing Admin':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage team members and permissions for {currentCompany.name}
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Company Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Company Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">{currentCompany.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <Badge variant="outline">{currentCompany.plan}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Team Seats</p>
              <p className="font-medium">
                {currentCompany.seats.used} / {currentCompany.seats.total}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Team Members */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Active Members</CardTitle>
          <CardDescription>
            Manage roles and permissions for team members
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Company Role</TableHead>
                <TableHead>Project Access</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.companyRole)} className="gap-1">
                      {getRoleIcon(member.companyRole)}
                      {member.companyRole}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {member.projectRoles.slice(0, 2).map((role, i) => (
                        <p key={i} className="text-sm">{role}</p>
                      ))}
                      {member.projectRoles.length > 2 && (
                        <p className="text-sm text-muted-foreground">
                          +{member.projectRoles.length - 2} more
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{member.lastActive}</p>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Edit Roles</DropdownMenuItem>
                        <DropdownMenuItem>Manage Projects</DropdownMenuItem>
                        <DropdownMenuItem>View Activity</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Remove from Company
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Team invitations waiting for acceptance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell>{invitation.invitedBy}</TableCell>
                    <TableCell>{invitation.invitedAt}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">Resend</Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}