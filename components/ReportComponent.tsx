import React, { ChangeEvent, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import toast from "react-hot-toast";
import { Scale, UploadIcon } from "lucide-react";

type Props = {
  onReportConfirmation: (data: string) => void;
};

const ReportComponent = ({ onReportConfirmation }: Props) => {
  const [base64Data, setBase64Data] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState("");
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleReportSelection(event: ChangeEvent<HTMLInputElement>): void {
    if (!event.target.files) return;
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      let isValidImage = false;
      let isValidDoc = false;
      const validImages = ["image/jpeg", "image/png", "image/webp"];
      const validDocs = ["application/pdf"];
      if (validImages.includes(file.type)) {
        isValidImage = true;
      }
      if (validDocs.includes(file.type)) {
        isValidDoc = true;
      }
      if (!(isValidImage || isValidDoc)) {
        toast.error("File type not supported !!");
        setFileName("");
        return;
      }

      if (isValidImage) {
        compressImage(file, (compressedFile) => {
          const reader = new FileReader();

          reader.onloadend = () => {
            const base64String = reader.result as string;
            setBase64Data(base64String);
            console.log(base64String);
          };

          reader.readAsDataURL(compressedFile);
        });
      }

      if (isValidDoc) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setBase64Data(base64String);
          console.log(base64String);
        };

        reader.readAsDataURL(file);
      }
    }
  }

  function compressImage(file: File, callback: (compressedFile: File) => void) {
    const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;

        ctx!.drawImage(img, 0, 0);

        const quality = 0.1;

        const dataURL = canvas.toDataURL("image/jpeg", quality);

        const byteString = atob(dataURL.split(",")[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const compressedFile = new File([ab], file.name, {
          type: "image/jpeg",
        });

        callback(compressedFile);
      };
      img.src = e.target!.result as string;
    };

    reader.readAsDataURL(file);
  }

  async function extractDetails(): Promise<void> {
    if (!base64Data) {
      toast.error("Upload a valid report.");
      return;
    }
    setIsLoading(true);

    const response = await fetch("api/extractreportgemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64: base64Data,
      }),
    });

    if (response.ok) {
      const reportText = await response.text();
      console.log(reportText);
      setReportData(reportText);
    }

    setIsLoading(false);
  }

  const handleClick = () => {
    if (inputRef?.current) {
      inputRef?.current?.click();
    }
  };

  return (
    <div className="grid w-full bg-muted/50 rounded-lg  h-[95vh] items-start gap-6 overflow-auto p-5">
      <div className="flex flex-col h-full justify-between gap-6 rounded-lg">
        <div className="flex items-center justify-start gap-3">
          <Scale className="text-slate-500" size={36} />{" "}
          <h1 className="font-extrabold text-3xl">
            Law <span className="text-slate-500">Wise</span>
          </h1>
        </div>

        {isLoading ? (
          <div>
            <div className="w-full h-16 flex items-center justify-center gap-3 rounded-lg p-12 
                    border-2 border-dashed border-gray-700
                    bg-slate-700/20 transition-colors duration-200">
              <h1 className="text-gray-300 font-medium">Extracting...</h1>
            </div>
            <Button
              disabled
              className="bg-slate-800 w-full my-4 text-white hover:text-white hover:bg-slate-700"
            >
              1. Upload File
            </Button>
          </div>
        ) : (
          <div>
            <div
              onClick={() => handleClick()}
              className="w-full h-16 flex items-center justify-center gap-3 rounded-lg p-12 
                    border-2 border-dashed border-gray-700 hover:border-gray-600
                    bg-slate-700/20 hover:bg-gray-800/50 
                    transition-colors duration-200 cursor-pointer"
            >
              <UploadIcon className="w-5 h-5 text-gray-400" />
              <h1 className="text-gray-300 font-medium">
                {fileName || "Choose a file"}
              </h1>
            </div>

            <Input
              className="hidden"
              ref={inputRef}
              type="file"
              onChange={handleReportSelection}
            />
            <Button
              className="bg-slate-800 w-full my-4 text-white hover:text-white hover:bg-slate-700"
              onClick={extractDetails}
            >
              1. Upload File
            </Button>
          </div>
        )}

        <div>
          <Label>Report Summary</Label>
          <Textarea
            value={reportData}
            onChange={(e) => {
              setReportData(e.target.value);
            }}
            placeholder="Extracted data from the report will appear here. Get better recommendations by providing additional patient history and symptoms..."
            className="min-h-72 my-4 bg-gray-700/20 resize-none border p-3 shadow-none focus-visible:ring-0"
          />
          <Button
            variant="default"
            className="bg-slate-800 w-full text-white hover:text-white hover:bg-slate-700"
            onClick={() => {
              onReportConfirmation(reportData);
            }}
          >
            2. Looks Good
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportComponent;