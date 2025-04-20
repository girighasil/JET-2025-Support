import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertCircle, 
  ExternalLink, 
  FileText, 
  Globe, 
  Link2, 
  Plus, 
  Trash2 
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface ResourceLink {
  url: string;
  type: string;
  label: string;
}

interface ResourceLinksInputProps {
  values: ResourceLink[];
  onChange: (values: ResourceLink[]) => void;
}

export default function ResourceLinksInput({
  values = [],
  onChange,
}: ResourceLinksInputProps) {
  const [newLink, setNewLink] = useState<ResourceLink>({
    url: "",
    type: "webpage",
    label: "",
  });
  
  const [error, setError] = useState<string | null>(null);

  const handleAddLink = () => {
    // Clear previous errors
    setError(null);

    // Validate the URL
    if (!newLink.url.trim()) {
      setError("Please enter a resource URL");
      return;
    }

    // Validate URL format
    try {
      new URL(newLink.url);
    } catch (e) {
      setError("Please enter a valid URL including http:// or https://");
      return;
    }

    // Validate label
    if (!newLink.label.trim()) {
      setError("Please enter a label for this resource");
      return;
    }

    // Check for duplicates
    if (values.some(link => link.url === newLink.url)) {
      setError("This resource URL is already in the list");
      return;
    }

    // Add the link to the list
    onChange([...values, { ...newLink }]);
    
    // Reset the form
    setNewLink({
      url: "",
      type: "webpage",
      label: "",
    });
  };

  const handleRemoveLink = (index: number) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    onChange(newValues);
  };

  // Get icon based on resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "webpage":
        return <Globe className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <Link2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-6">
          <Input
            type="url"
            placeholder="https://example.com/resource"
            value={newLink.url}
            onChange={(e) => setNewLink({...newLink, url: e.target.value})}
          />
        </div>
        
        <div className="md:col-span-3">
          <Select
            value={newLink.type}
            onValueChange={(value) => setNewLink({...newLink, type: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Resource Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF Document</SelectItem>
              <SelectItem value="webpage">Web Page</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="other">Other Resource</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:col-span-3 flex gap-2">
          <Input
            type="text"
            placeholder="Resource Name"
            value={newLink.label}
            onChange={(e) => setNewLink({...newLink, label: e.target.value})}
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={handleAddLink}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {values.length > 0 ? (
        <div className="space-y-2 mt-2">
          {values.map((link, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 p-2 bg-muted/50 rounded border"
            >
              {getResourceIcon(link.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{link.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {link.type}
                  </Badge>
                </div>
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  {link.url.length > 50 ? `${link.url.substring(0, 50)}...` : link.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveLink(index)}
                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic py-2">
          No resource links added yet
        </div>
      )}
    </div>
  );
}