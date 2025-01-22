import React from 'react';
import { Message } from 'ai';
import { Bot, User } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import Markdown from './markdown';
import { cn } from '@/lib/utils';

interface MessageBoxProps {
  role: string;
  content: string;
  isStreaming?: boolean;
}

const MessageBox = ({ role, content, isStreaming }: MessageBoxProps) => {
  return (
    <div className={cn(
      "animate-in fade-in-0 slide-in-from-bottom-3",
      isStreaming && "animate-pulse-subtle"
    )}>
      <Card className="overflow-hidden">
        <CardContent className="flex gap-3 p-6">
          <div className={cn(
            "shrink-0 size-8 rounded-md flex items-center justify-center",
            role === "assistant" ? "bg-primary/10" : "bg-muted"
          )}>
            {role === "assistant" ? <Bot size={18} /> : <User size={18} />}
          </div>
          <div className={cn(
            "text-sm min-h-[20px]",
            isStreaming && "streaming-content"
          )}>
            <Markdown 
              text={content} 
              className={cn(
                "prose prose-sm break-words prose-p:leading-relaxed prose-pre:p-0",
                isStreaming && "stream-text"
              )}
            />
          </div>
        </CardContent>
        {role === "assistant" && (
          <CardFooter className="border-t bg-muted/50 px-6 py-3 text-xs text-muted-foreground">
            Disclaimer: The law advice and recommendations provided by this
            application are for informational purposes only and should not
            replace professionals.
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default MessageBox;
