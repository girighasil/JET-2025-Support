import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Check, 
  X, 
  Clock, 
  User, 
  BookOpen, 
  Calendar,
  Loader2,
  UserPlus,
  UserCheck,
  UserX
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

// Schema for rejection form
const rejectionSchema = z.object({
  notes: z.string().min(1, { message: "Please provide a reason for rejection" }),
});

type RejectionFormValues = z.infer<typeof rejectionSchema>;

export default function EnrollmentRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Fetch all enrollment requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["/api/enrollment-requests"],
    queryFn: () => fetch(`/api/enrollment-requests`).then(res => res.json()),
  });

  // Form for rejection reason
  const form = useForm<RejectionFormValues>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Approve request mutation
  const approveMutation = useMutation({
    mutationFn: (requestData: { userId: number; courseId: number }) => {
      return apiRequest("PATCH", `/api/enrollment-requests/${requestData.userId}/${requestData.courseId}`, { 
        status: "approved" 
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Approved",
        description: "The enrollment request has been approved successfully.",
      });
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/enrollment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Approve Request",
        description: error.message || "An error occurred while approving the enrollment request.",
        variant: "destructive",
      });
    },
  });

  // Reject request mutation
  const rejectMutation = useMutation({
    mutationFn: (data: { userId: number; courseId: number; notes: string }) => {
      return apiRequest("PATCH", `/api/enrollment-requests/${data.userId}/${data.courseId}`, { 
        status: "rejected",
        notes: data.notes
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Rejected",
        description: "The enrollment request has been rejected.",
      });
      setIsRejectDialogOpen(false);
      form.reset();
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/enrollment-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Reject Request",
        description: error.message || "An error occurred while rejecting the enrollment request.",
        variant: "destructive",
      });
    },
  });

  // Handle approval
  const handleApprove = (request: any) => {
    approveMutation.mutate({
      userId: request.userId,
      courseId: request.courseId,
    });
  };

  // Handle rejection dialog open
  const handleOpenRejectDialog = (request: any) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  };

  // Handle rejection submission
  const onSubmitRejection = (values: RejectionFormValues) => {
    if (selectedRequest) {
      rejectMutation.mutate({
        userId: selectedRequest.userId,
        courseId: selectedRequest.courseId,
        notes: values.notes,
      });
    }
  };

  // Filter requests by status
  const pendingRequests = requests?.filter((req: any) => req.status === "pending") || [];
  const approvedRequests = requests?.filter((req: any) => req.status === "approved") || [];
  const rejectedRequests = requests?.filter((req: any) => req.status === "rejected") || [];

  // Render request card
  const renderRequestCard = (request: any, showActions: boolean = true) => (
    <Card key={`${request.userId}-${request.courseId}`} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            <span className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              {request.courseTitle || "Unknown Course"}
            </span>
          </CardTitle>
          <Badge variant={
            request.status === "pending" ? "outline" : 
            request.status === "approved" ? "success" : 
            "destructive"
          }>
            {request.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
            {request.status === "approved" && <Check className="h-3 w-3 mr-1" />}
            {request.status === "rejected" && <X className="h-3 w-3 mr-1" />}
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center text-sm text-gray-500">
            <User className="h-4 w-4 mr-2" />
            <span>Student: <span className="font-medium text-gray-900">{request.userName || "Unknown User"}</span></span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Requested: <span className="font-medium text-gray-900">
              {request.requestedAt ? format(new Date(request.requestedAt), 'MMM d, yyyy') : "Unknown"}
            </span></span>
          </div>
        </div>
        
        {request.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
            <p className="font-medium mb-1">Student's Notes:</p>
            <p className="text-gray-700">{request.notes}</p>
          </div>
        )}
        
        {showActions && request.status === "pending" && (
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              className="w-1/2 border-green-500 text-green-600 hover:bg-green-50"
              onClick={() => handleApprove(request)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
            <Button 
              variant="outline" 
              className="w-1/2 border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => handleOpenRejectDialog(request)}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserX className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Enrollment Requests</h1>
            <p className="text-gray-500 mt-1">
              Manage student enrollment requests
            </p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="mt-6">
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Pending
              <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center">
              <UserCheck className="h-4 w-4 mr-2" />
              Approved
              <Badge variant="secondary" className="ml-2">{approvedRequests.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center">
              <UserX className="h-4 w-4 mr-2" />
              Rejected
              <Badge variant="secondary" className="ml-2">{rejectedRequests.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingRequests.length > 0 ? (
              pendingRequests.map((request: any) => renderRequestCard(request))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-600">No Pending Requests</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                  There are currently no pending enrollment requests to review.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : approvedRequests.length > 0 ? (
              approvedRequests.map((request: any) => renderRequestCard(request, false))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserCheck className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-600">No Approved Requests</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                  There are no approved enrollment requests yet.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rejectedRequests.length > 0 ? (
              rejectedRequests.map((request: any) => renderRequestCard(request, false))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserX className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-600">No Rejected Requests</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                  There are no rejected enrollment requests.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Rejection Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Enrollment Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this enrollment request. This will be visible to the student.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitRejection)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Rejection</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please explain why this enrollment request is being rejected..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRejectDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" disabled={rejectMutation.isPending}>
                    {rejectMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      "Reject Request"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}