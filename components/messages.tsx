import { Message } from "ai";
import React from "react";
import MessageBox from "./messagebox";

interface MessagesProps {
  messages: Message[];
  isLoading: boolean;
}

const Messages = ({ messages, isLoading }: MessagesProps) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">No messages yet. Start by asking a question.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, index) => (
        <MessageBox
          key={message.id}
          role={message.role}
          content={message.content}
          isStreaming={isLoading && index === messages.length - 1}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default Messages;