import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle, Send } from "lucide-react";
import { tickets } from "@/data/mockData";
import { Ticket } from "@/types/hrms";
import { toast } from "sonner";

export default function EmployeeHelpdesk() {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Filter tickets for current employee
  const myTickets = tickets.filter((t) => t.employeeId === "emp-3");
  const openTickets = myTickets.filter((t) => t.status === "open" || t.status === "in-progress");
  const resolvedTickets = myTickets.filter((t) => t.status === "resolved" || t.status === "closed");

  const handleCreateTicket = () => {
    toast.success("Ticket created successfully!");
    setIsNewTicketOpen(false);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      toast.success("Message sent!");
      setNewMessage("");
    }
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
    other: "Other",
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Helpdesk" }]} />

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
                            <span className="font-mono text-sm text-muted-foreground">
                              {ticket.ticketNumber}
                            </span>
                            <Badge className={priorityColors[ticket.priority]}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{categoryLabels[ticket.category]}</span>
                            <span>•</span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <StatusBadge status={ticket.status} />
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No open tickets
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
                          <span className="font-mono text-sm text-muted-foreground">
                            {ticket.ticketNumber}
                          </span>
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Resolved on {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <StatusBadge status={ticket.status} />
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No resolved tickets
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="all">
              <div className="space-y-3">
                {myTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-sm text-muted-foreground">
                            {ticket.ticketNumber}
                          </span>
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                        </div>
                        <StatusBadge status={ticket.status} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Ticket Detail / Quick Help */}
        <div>
          {selectedTicket ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedTicket.ticketNumber}</CardTitle>
                  <StatusBadge status={selectedTicket.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">{selectedTicket.subject}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTicket.description}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Conversation</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedTicket.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${msg.senderRole === "employee" ? "justify-end" : ""}`}
                      >
                        {msg.senderRole === "hr" && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">HR</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[80%] p-3 rounded-lg text-sm ${
                            msg.senderRole === "employee"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p>{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(selectedTicket.status === "open" || selectedTicket.status === "in-progress") && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button size="icon" onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedTicket(null)}
                >
                  Close
                </Button>
              </CardContent>
            </Card>
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
                  Select a ticket to view details or create a new one for support.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Common Topics:</p>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Payroll inquiries
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Leave balance issues
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Document requests
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
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
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="benefits">Benefits</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select>
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
              <Input placeholder="Brief description of your issue" />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Please provide details about your issue..."
                className="min-h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTicketOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket}>Create Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
