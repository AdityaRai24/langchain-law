"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Database, LucideLoader2, MoveUp, RefreshCcw } from "lucide-react";
import React, { useState } from "react";

const VectorDbPage = () => {
  const [isUploading, setisUploading] = useState(false);
  const [indexname, setIndexname] = useState("");
  const [namespace, setNamespace] = useState("");
  const [fileListAsText, setfileListAsText] = useState("");
  const [filename, setFilename] = useState("");
  const [progress, setProgress] = useState(0);

  const onFileListRefresh = async () => {
    setfileListAsText("");
    const response = await fetch("api/getFile", { method: "GET" });
    const filenames = await response.json();
    console.log(filenames);
    const resultString = (filenames as [])
      .map((filename) => `📄 ${filename}`)
      .join("\n");
    setfileListAsText(resultString);
  };

  const onStartUpload = async () => {
    if (!indexname || !namespace) {
      alert("Please fill in both Index Name and Namespace");
      return;
    }

    setProgress(0);
    setFilename("");
    setisUploading(true);

    try {
      const response = await fetch("api/updateDatabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          indexname,
          namespace,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Response received:", response);
      await processStreamedResponse(response);
    } catch (error) {
      console.error("Upload error:", error);
      setisUploading(false);
    }
  };

  async function processStreamedResponse(response: Response) {
    const reader = response?.body?.getReader();
    if (!reader) {
      console.error("Reader was not found");
      return;
    }

    const textDecoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setisUploading(false);
          break;
        }

        // Decode the new chunk and add it to our buffer
        const chunk = textDecoder.decode(value, { stream: true });
        buffer += chunk;

        // Split the buffer into lines and process each complete line
        const lines = buffer.split("\n");

        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || "";

        // Process all complete lines
        for (const line of lines) {
          if (line.trim()) {
            // Only process non-empty lines
            try {
              console.log(line);
              const data = JSON.parse(line);
              console.log("Parsed data:", data);

              if (
                data.filename &&
                typeof data.totalChunks === "number" &&
                typeof data.chunksUpserted === "number"
              ) {
                const currentProgress = Math.round(
                  (data.chunksUpserted / data.totalChunks) * 100
                );
                console.log(`Updating progress: ${currentProgress}%`);

                setFilename(
                  (prev) =>
                    `${data.filename} [${data.chunksUpserted}/${data.totalChunks}]`
                );
                setProgress((prev) => currentProgress);

                if (data.isComplete) {
                  setisUploading(false);
                }
              }
            } catch (e) {
              console.warn("Failed to parse line:", line, e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing stream:", error);
    } finally {
      reader.releaseLock();
      setisUploading(false);
    }
  }

  return (
    <main className="flex flex-col items-center p-24">
      <Card>
        <CardHeader>
          <CardTitle>Update Knowledge Base</CardTitle>
          <CardDescription>Add new documents to your vector DB</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 grid gap-4 border rounded-lg p-6">
              <div className="gap-4 relative">
                <Button
                  onClick={onFileListRefresh}
                  className="absolute -right-4 -top-4"
                  variant={"ghost"}
                  size={"icon"}
                >
                  <RefreshCcw />
                </Button>
                <Label>Files List:</Label>
                <Textarea
                  readOnly
                  value={fileListAsText}
                  className="min-h-24 resize-none border p-3 shadow-none disabled:cursor-default focus-visible:ring-0 text-sm text-muted-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Index Name</Label>
                  <Input
                    value={indexname}
                    onChange={(e) => setIndexname(e.target.value)}
                    placeholder="index name"
                    disabled={isUploading}
                    className="disabled:cursor-default"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Namespace</Label>
                  <Input
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    placeholder="namespace"
                    disabled={isUploading}
                    className="disabled:cursor-default"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={onStartUpload}
              variant={"outline"}
              className="w-full h-full"
              disabled={isUploading}
            >
              <span className="flex flex-row">
                <Database size={50} className="stroke-[#D90013]" />
                <MoveUp className="stroke-[#D90013]" />
              </span>
            </Button>
          </div>
          {isUploading && (
            <div className="mt-4">
              <Label>File Name: {filename}</Label>
              <div className="flex flex-row items-center gap-4">
                <Progress value={progress} />
                <LucideLoader2 className="stroke-[#D90013] animate-spin" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default VectorDbPage;
