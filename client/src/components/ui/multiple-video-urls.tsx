import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { isValidVideoUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MultipleVideoUrlsProps {
  values: string[];
  onChange: (values: string[]) => void;
}

export default function MultipleVideoUrls({
  values = [],
  onChange,
}: MultipleVideoUrlsProps) {
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");

  const addVideo = () => {
    if (!newUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidVideoUrl(newUrl)) {
      setError("Please enter a valid YouTube, Vimeo, or video URL");
      return;
    }

    onChange([...values, newUrl.trim()]);
    setNewUrl("");
    setError("");
  };

  const removeVideo = (index: number) => {
    const updatedValues = [...values];
    updatedValues.splice(index, 1);
    onChange(updatedValues);
  };

  // Preview component for each video URL
  const VideoPreview = ({ url }: { url: string }) => {
    // Get video ID and provider
    const { provider, videoId } = extractVideoInfo(url);
    
    return (
      <div className="relative aspect-video w-full rounded overflow-hidden">
        {provider === "youtube" && videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            title="YouTube video"
          />
        ) : provider === "vimeo" && videoId ? (
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            title="Vimeo video"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <Video className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Video URL: {url}</p>
          </div>
        )}
      </div>
    );
  };

  // Helper function to extract video information
  const extractVideoInfo = (url: string) => {
    let videoId = null;
    let provider = "unknown";

    // YouTube
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);

    // Vimeo
    const vimeoRegex =
      /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|)(\d+)(?:$|\/|\?))/;
    const vimeoMatch = url.match(vimeoRegex);

    if (youtubeMatch && youtubeMatch[1]) {
      videoId = youtubeMatch[1];
      provider = "youtube";
    } else if (vimeoMatch && vimeoMatch[1]) {
      videoId = vimeoMatch[1];
      provider = "vimeo";
    }

    return { videoId, provider };
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="grid gap-2">
          <Label>Add Video URL</Label>
          <div className="flex space-x-2">
            <Input
              className={cn(error && "border-destructive")}
              placeholder="YouTube or Vimeo URL"
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addVideo();
                }
              }}
            />
            <Button type="button" onClick={addVideo}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>

      {values.length > 0 && (
        <div className="space-y-3">
          <Label>Added Videos ({values.length})</Label>
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-4 space-y-4">
              {values.map((url, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-3">
                    <VideoPreview url={url} />
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between">
                      <div className="text-sm truncate max-w-[70%]">{url}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVideo(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}