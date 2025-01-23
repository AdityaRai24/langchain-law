"use client";
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
      
      <main className="flex flex-1 overflow-hidden">
        <div className="hidden md:block w-96 border-r p-4 overflow-y-auto">
          <ReportComponent onReportConfirmation={onReportConfirmation} />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <ChatComponent reportData={reportData} />
        </div>
      </main>
    </div>
  );
};

export default Home;