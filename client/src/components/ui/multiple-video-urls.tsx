import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertCircle, 
  Plus, 
  Trash2, 
  Video 
} from "lucide-react";
import { isValidVideoUrl } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MultipleVideoUrlsProps {
  values: string[];
  onChange: (values: string[]) => void;
}

export default function MultipleVideoUrls({
  values = [],
  onChange,
}: MultipleVideoUrlsProps) {
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAddVideo = () => {
    // Clear previous errors
    setError(null);

    // Validate the URL
    if (!newUrl.trim()) {
      setError("Please enter a video URL");
      return;
    }

    if (!isValidVideoUrl(newUrl)) {
      setError("Please enter a valid YouTube or Vimeo URL");
      return;
    }

    // Check for duplicates
    if (values.includes(newUrl)) {
      setError("This video URL is already in the list");
      return;
    }

    // Add the URL to the list
    onChange([...values, newUrl]);
    setNewUrl(""); // Clear the input
  };

  const handleRemoveVideo = (index: number) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    onChange(newValues);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="url"
          placeholder="Enter YouTube or Vimeo URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="flex-1"
        />
        <Button 
          type="button" 
          onClick={handleAddVideo}
          size="sm"
          className="whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Video
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {values.length > 0 ? (
        <div className="space-y-2 mt-2">
          {values.map((url, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 p-2 bg-muted/50 rounded border"
            >
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm truncate">{url}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveVideo(index)}
                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic py-2">
          No videos added yet
        </div>
      )}
    </div>
  );
}