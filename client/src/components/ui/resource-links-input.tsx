import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PlusCircle,
  Trash2,
  FileText,
  ExternalLink,
  FileCode,
  BookOpen,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Define the resource link interface
export interface ResourceLink {
  url: string;
  type: string;
  label: string;
}

interface ResourceLinksInputProps {
  values: ResourceLink[];
  onChange: (values: ResourceLink[]) => void;
}

const resourceTypes = [
  { value: "pdf", label: "PDF Document", icon: FileText },
  { value: "webpage", label: "Web Page", icon: ExternalLink },
  { value: "code", label: "Source Code", icon: FileCode },
  { value: "reading", label: "Reading Material", icon: BookOpen },
];

export default function ResourceLinksInput({
  values = [],
  onChange,
}: ResourceLinksInputProps) {
  const [newResource, setNewResource] = useState<ResourceLink>({
    url: "",
    type: "",
    label: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const addResource = () => {
    const newErrors: Record<string, string> = {};

    if (!newResource.url.trim()) {
      newErrors.url = "URL is required";
    } else if (!validateUrl(newResource.url)) {
      newErrors.url = "Please enter a valid URL";
    }

    if (!newResource.type) {
      newErrors.type = "Resource type is required";
    }

    if (!newResource.label.trim()) {
      newErrors.label = "Label is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onChange([...values, { ...newResource }]);
    setNewResource({ url: "", type: "", label: "" });
    setErrors({});
  };

  const removeResource = (index: number) => {
    const updatedValues = [...values];
    updatedValues.splice(index, 1);
    onChange(updatedValues);
  };

  const getResourceIcon = (type: string) => {
    const resourceType = resourceTypes.find((rt) => rt.value === type);
    const Icon = resourceType?.icon || ExternalLink;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="resource-label">Resource Label</Label>
          <Input
            id="resource-label"
            className={cn(errors.label && "border-destructive")}
            placeholder="e.g., Class Notes, Reference Guide"
            value={newResource.label}
            onChange={(e) =>
              setNewResource({ ...newResource, label: e.target.value })
            }
          />
          {errors.label && (
            <p className="text-sm text-destructive">{errors.label}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="resource-type">Resource Type</Label>
          <Select
            value={newResource.type}
            onValueChange={(value) =>
              setNewResource({ ...newResource, type: value })
            }
          >
            <SelectTrigger
              id="resource-type"
              className={cn(errors.type && "border-destructive")}
            >
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {resourceTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center">
                    <type.icon className="mr-2 h-4 w-4" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="resource-url">Resource URL</Label>
          <Input
            id="resource-url"
            className={cn(errors.url && "border-destructive")}
            placeholder="https://"
            value={newResource.url}
            onChange={(e) =>
              setNewResource({ ...newResource, url: e.target.value })
            }
          />
          {errors.url && (
            <p className="text-sm text-destructive">{errors.url}</p>
          )}
        </div>

        <Button type="button" onClick={addResource}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {values.length > 0 && (
        <div className="space-y-3">
          <Label>Added Resources ({values.length})</Label>
          <ScrollArea className="h-[250px] rounded-md border">
            <div className="p-4 space-y-3">
              {values.map((resource, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getResourceIcon(resource.type)}
                        <span className="font-medium">{resource.label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResource(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <Separator className="my-2" />
                    <div className="truncate text-sm text-muted-foreground">
                      {resource.url}
                    </div>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(resource.url, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Open Link
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