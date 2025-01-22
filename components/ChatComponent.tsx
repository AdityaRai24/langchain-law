import React from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { CornerDownLeft, Loader2, TextSearch } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { useChat } from "ai/react";
import Markdown from "./markdown";
import Messages from "./messages";

type Props = {
  reportData?: string;
};

const ChatComponent = ({ reportData }: Props) => {
  const { messages, input, handleInputChange, handleSubmit, isLoading, data } =
    useChat({
      api: "api/medichatgemini",
    });
    
    return (
    <div className="h-full bg-muted/50 relative flex flex-col overflow-y-auto min-h-[50vh] rounded-xl p-4 gap-4">
      <Badge
        variant={"outline"}
        className={`absolute right-3 top-1.5 ${reportData && "bg-[#00B612]"}`}
      >
        {reportData ? "✓ Report Added" : "No Report Added"}
      </Badge>
      <div className="flex-1" />
      <Messages messages={messages} isLoading={isLoading} />
      <form
        className=" p-3 border flex items-start justify-between !rounded-lg bg-gray-700/20"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(event, {
            data: {
              reportData: reportData as string,
            },
          });
        }}
      >
        <Textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Type your query here..."
          className="min-h-36 max-w-[85%] resize-none border-0 p-3 rounded-lg shadow-none  focus-visible:ring-0"
        />
        <div className="pt-3 pr-6">
          <Button
            disabled={isLoading}
            type="submit"
            size="lg"
            className="bg-slate-800 text-white hover:text-white hover:bg-slate-700"
          >
            {isLoading ? "Analysing..." : "3. Ask"}
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CornerDownLeft className="size-3.5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatComponent;
