import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageCircle, X, Lock } from "lucide-react";
import { useTicketMessages, useSendTicketMessage, TicketMessage } from "@/hooks/useTicketMessages";
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

type Ticket = Tables<"helpdesk_tickets">;

interface TicketMessagingProps {
  ticket: Ticket;
  onClose?: () => void;
  isAdmin?: boolean;
}

export function TicketMessaging({ ticket, onClose, isAdmin = false }: TicketMessagingProps) {
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: messages = [], isLoading } = useTicketMessages(ticket.id);
  const sendMessage = useSendTicketMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;

    sendMessage.mutate(
      {
        ticket_id: ticket.id,
        message: message.trim(),
        is_internal: isAdmin ? isInternal : false,
      },
      {
        onSuccess: () => {
          setMessage("");
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (msg: TicketMessage) => {
    if (msg.sender?.profile) {
      const first = msg.sender.profile.first_name?.[0] || "";
      const last = msg.sender.profile.last_name?.[0] || "";
      return (first + last).toUpperCase() || "U";
    }
    return "U";
  };

  const getSenderName = (msg: TicketMessage) => {
    if (msg.sender?.profile) {
      return `${msg.sender.profile.first_name || ""} ${msg.sender.profile.last_name || ""}`.trim() || "Unknown";
    }
    return "Unknown";
  };

  const isOwnMessage = (msg: TicketMessage) => {
    return msg.sender?.id === user?.id;
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3 flex-shrink-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Messages</CardTitle>
          <Badge variant="outline" className="ml-2">
            {messages.length}
          </Badge>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4" ref={scrollRef}>
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <MessageCircle className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation below</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isOwnMessage(msg) ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.sender?.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{getInitials(msg)}</AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] ${isOwnMessage(msg) ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{getSenderName(msg)}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.created_at), "MMM d, h:mm a")}
                      </span>
                      {msg.is_internal && (
                        <Badge variant="secondary" className="text-xs py-0">
                          <Lock className="h-3 w-3 mr-1" />
                          Internal
                        </Badge>
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 text-sm ${
                        isOwnMessage(msg)
                          ? "bg-primary text-primary-foreground"
                          : msg.is_internal
                          ? "bg-warning/10 border border-warning/20"
                          : "bg-muted"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-background flex-shrink-0">
          {isAdmin && (
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant={isInternal ? "default" : "outline"}
                size="sm"
                onClick={() => setIsInternal(!isInternal)}
              >
                <Lock className="h-3 w-3 mr-1" />
                Internal Note
              </Button>
              {isInternal && (
                <span className="text-xs text-muted-foreground">
                  This message won't be visible to the employee
                </span>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder={
                ticket.status === "closed" || ticket.status === "resolved"
                  ? "This ticket is closed"
                  : "Type your message..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={ticket.status === "closed" || ticket.status === "resolved"}
              className="min-h-[60px] resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={
                !message.trim() ||
                sendMessage.isPending ||
                ticket.status === "closed" ||
                ticket.status === "resolved"
              }
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
