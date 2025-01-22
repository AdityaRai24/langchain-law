"use client";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Settings } from "lucide-react";
import { useState } from "react";
import ReportComponent from "@/components/ReportComponent";
import ChatComponent from "@/components/ChatComponent";
import toast from "react-hot-toast";

const Home = () => {
  const [reportData, setreportData] = useState("");
  const onReportConfirmation = (data: string) => {
    setreportData(data);
    toast.success("Updated !!");
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-[57px] items-center gap-1 border-b bg-background px-4">
        <h1 className="text-xl font-semibold text-[#D90013]">
          <span className="flex flex-row">Mr.AlmostMD</span>
        </h1>
        <div className="flex w-full flex-row justify-end gap-2">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Settings />
                <span className="sr-only">Settings</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh]">
              <ReportComponent onReportConfirmation={onReportConfirmation} />
            </DrawerContent>
          </Drawer>
        </div>
      </header>
      
      <main className="flex flex-1 overflow-hidden">
        {/* Fixed Report Section */}
        <div className="hidden md:block w-96 border-r p-4 overflow-y-auto">
          <ReportComponent onReportConfirmation={onReportConfirmation} />
        </div>
        
        {/* Scrollable Chat Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <ChatComponent reportData={reportData} />
        </div>
      </main>
    </div>
  );
};

export default Home;