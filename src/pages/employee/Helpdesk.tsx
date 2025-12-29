import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useMyTickets, useCreateTicket } from "@/hooks/useHelpdesk";
import { TicketMessaging } from "@/components/helpdesk/TicketMessaging";
import { Tables } from "@/integrations/supabase/types";

type Ticket = Tables<"helpdesk_tickets">;

export default function EmployeeHelpdesk() {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const { data: myTickets = [], isLoading } = useMyTickets();
  const createTicket = useCreateTicket();

  const openTickets = myTickets.filter((t) => t.status === "open" || t.status === "in-progress");
  const resolvedTickets = myTickets.filter((t) => t.status === "resolved" || t.status === "closed");

  const handleCreateTicket = () => {
    if (!subject || !category || !priority) return;

    createTicket.mutate(
      { subject, description, category, priority },
      {
        onSuccess: () => {
          setIsNewTicketOpen(false);
          setCategory("");
          setPriority("");
          setSubject("");
          setDescription("");
        },
      }
    );
  };

  const priorityColors: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-info/10 text-info",
    high: "bg-warning/10 text-warning",
    urgent: "bg-destructive/10 text-destructive",
  };

  const categoryLabels: Record<string, string> = {
    payroll: "Payroll",
    leave: "Leave",
    attendance: "Attendance",
    documents: "Documents",
    benefits: "Benefits",
    general: "General",
    other: "Other",
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Helpdesk" description="Submit and track your support requests" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Helpdesk" description="Submit and track your support requests">
        <Button onClick={() => setIsNewTicketOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{openTickets.length}</p>
              <p className="text-sm text-muted-foreground">Open Tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{resolvedTickets.length}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{myTickets.length}</p>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ticket List */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="open">
            <TabsList className="mb-4">
              <TabsTrigger value="open">Open ({openTickets.length})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({resolvedTickets.length})</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value="open">
              <div className="space-y-3">
                {openTickets.length > 0 ? openTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={priorityColors[ticket.priority]}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {ticket.description || "No description"}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{categoryLabels[ticket.category] || ticket.category}</span>
                            <span>•</span>
                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <StatusBadge status={ticket.status as any} />
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card>
                    <CardContent className="py-12 px-4">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium">No open tickets</h3>
                          <p className="text-muted-foreground text-sm">
                            All your tickets have been resolved
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="resolved">
              <div className="space-y-3">
                {resolvedTickets.length > 0 ? resolvedTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Resolved on {ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <StatusBadge status={ticket.status as any} />
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card>
                    <CardContent className="py-12 px-4">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium">No resolved tickets</h3>
                          <p className="text-muted-foreground text-sm">
                            Resolved tickets will appear here
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="all">
              <div className="space-y-3">
                {myTickets.length > 0 ? myTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {categoryLabels[ticket.category] || ticket.category} • {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={ticket.status as any} />
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card>
                    <CardContent className="py-12 px-4">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium">No tickets yet</h3>
                          <p className="text-muted-foreground text-sm">
                            Create a new ticket to get support
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Ticket Detail / Messages */}
        <div>
          {selectedTicket ? (
            <TicketMessaging
              ticket={selectedTicket}
              onClose={() => setSelectedTicket(null)}
              isAdmin={false}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Quick Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Select a ticket to view details and messages, or create a new one for support.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Common Topics:</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setCategory("payroll");
                      setIsNewTicketOpen(true);
                    }}
                  >
                    Payroll inquiries
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setCategory("leave");
                      setIsNewTicketOpen(true);
                    }}
                  >
                    Leave balance issues
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setCategory("documents");
                      setIsNewTicketOpen(true);
                    }}
                  >
                    Document requests
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      setCategory("benefits");
                      setIsNewTicketOpen(true);
                    }}
                  >
                    Benefits information
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="benefits">Benefits</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input 
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Please provide details about your issue..."
                className="min-h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTicketOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTicket}
              disabled={!subject || !category || !priority || createTicket.isPending}
            >
              {createTicket.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
