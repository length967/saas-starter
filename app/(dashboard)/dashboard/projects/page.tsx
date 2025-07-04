import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Users, Bot, Activity } from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  // This would come from your database
  const projects = [
    {
      id: '1',
      name: 'Production Environment',
      description: 'Main production file transfer network',
      agents: 12,
      activeTransfers: 3,
      dataTransferred: '45.2 TB',
      status: 'active',
      role: 'Project Owner'
    },
    {
      id: '2',
      name: 'Development Network',
      description: 'Testing and development transfers',
      agents: 5,
      activeTransfers: 1,
      dataTransferred: '8.7 TB',
      status: 'active',
      role: 'Developer'
    },
    {
      id: '3',
      name: 'Backup Infrastructure',
      description: 'Automated backup and archival system',
      agents: 8,
      activeTransfers: 0,
      dataTransferred: '120.5 TB',
      status: 'active',
      role: 'Project Admin'
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your TCP Agent Platform projects
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription className="mt-1">{project.description}</CardDescription>
                </div>
                <Badge variant="outline">{project.role}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Bot className="mr-2 h-4 w-4" />
                    Agents
                  </div>
                  <span className="font-medium">{project.agents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Activity className="mr-2 h-4 w-4" />
                    Active Transfers
                  </div>
                  <span className="font-medium">{project.activeTransfers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    Data Transferred
                  </div>
                  <span className="font-medium">{project.dataTransferred}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/dashboard/projects/${project.id}`}>
                    View Details
                  </Link>
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state for when there are no projects */}
      {projects.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to start managing TCP agents and transfers
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}