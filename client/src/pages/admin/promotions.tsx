import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { EditModal } from "@/components/admin/EditModal";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

// Define the promo model (will need to add this to schema.ts later)
interface Promo {
  id: number;
  text: string;
  url?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

const promoSchema = z.object({
  text: z.string().min(5, "Promo text must be at least 5 characters"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  order: z.coerce.number().min(1, "Order must be at least 1"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});

type PromoValues = z.infer<typeof promoSchema>;

// Temporary data for demonstration purposes
const mockPromos: Promo[] = [
  { 
    id: 1, 
    text: "New JEE 2023 Batch Starting Soon! Early Birds Get 25% Discount", 
    url: "/courses/jee", 
    isActive: true, 
    order: 1 
  },
  { 
    id: 2, 
    text: "Free Doubt Solving Session Every Sunday - Register Now!", 
    url: "/doubt-class", 
    isActive: true, 
    order: 2 
  },
  { 
    id: 3, 
    text: "Mock Test Series at Just ₹999 - Limited Time Offer", 
    url: "/test-series", 
    isActive: true, 
    order: 3 
  },
];

export default function PromoManagement() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);

  // For now, we'll use mock data since we haven't created the API endpoint yet
  const { data: promos, isLoading } = useQuery<Promo[]>({
    queryKey: ["/api/admin/promotions"],
    queryFn: async () => {
      // This would be replaced with an actual API call
      return mockPromos;
    },
  });

  const form = useForm<PromoValues>({
    resolver: zodResolver(promoSchema),
    defaultValues: {
      text: "",
      url: "",
      isActive: true,
      order: 1,
      startDate: "",
      endDate: "",
    },
  });

  const handleOpenModal = (promo?: Promo) => {
    if (promo) {
      setSelectedPromo(promo);
      form.reset({
        text: promo.text,
        url: promo.url || "",
        isActive: promo.isActive,
        order: promo.order,
        startDate: promo.startDate || "",
        endDate: promo.endDate || "",
      });
    } else {
      setSelectedPromo(null);
      form.reset({
        text: "",
        url: "",
        isActive: true,
        order: (promos?.length || 0) + 1,
        startDate: "",
        endDate: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    form.handleSubmit((data) => {
      // Here we'd normally make API calls, but for now we'll just show success messages
      toast({
        title: "Success!",
        description: selectedPromo 
          ? "Promotional message updated successfully" 
          : "Promotional message created successfully",
      });
      setIsModalOpen(false);
      form.reset();
    })();
  };

  const handleDelete = (promo: Promo) => {
    if (window.confirm(`Are you sure you want to delete this promotional message?`)) {
      toast({
        title: "Success!",
        description: "Promotional message deleted successfully",
      });
    }
  };

  const columns = [
    { key: "text", title: "Message" },
    { key: "url", title: "URL" },
    { 
      key: "isActive", 
      title: "Status", 
      render: (promo: Promo) => (
        <div className={promo.isActive ? "text-green-600" : "text-red-600"}>
          {promo.isActive ? "Active" : "Inactive"}
        </div>
      ) 
    },
    { key: "order", title: "Display Order" },
  ];

  return (
    <AdminLayout title="Promotional Banner Management">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          title="Promotional Messages"
          data={promos || []}
          columns={columns}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          onAdd={() => handleOpenModal()}
          isLoading={isLoading}
        />
      )}

      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={selectedPromo ? "Edit Promotional Message" : "Add New Promotional Message"}
        description={selectedPromo 
          ? "Update the promotional message details below." 
          : "Fill in the promotional message details below."}
      >
        <form className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="text">Message Text</Label>
            <Input
              id="text"
              {...form.register("text")}
            />
            {form.formState.errors.text && (
              <p className="text-sm text-red-500">{form.formState.errors.text.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL (Optional)</Label>
            <Input
              id="url"
              placeholder="https://example.com/page"
              {...form.register("url")}
            />
            {form.formState.errors.url && (
              <p className="text-sm text-red-500">{form.formState.errors.url.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                min="1"
                {...form.register("order", { valueAsNumber: true })}
              />
              {form.formState.errors.order && (
                <p className="text-sm text-red-500">{form.formState.errors.order.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="isActive"
                {...form.register("isActive")}
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register("startDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                {...form.register("endDate")}
              />
            </div>
          </div>
        </form>
      </EditModal>
    </AdminLayout>
  );
}