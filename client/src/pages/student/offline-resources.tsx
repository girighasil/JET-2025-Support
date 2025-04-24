import { useState } from "react";
import Layout from "@/components/layouts/student-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OfflineResourceManager } from "@/components/ui/offline-resource-viewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Wifi, WifiOff, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function OfflineResourcesPage() {
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Offline Resources</h1>
            <p className="text-muted-foreground mt-2">
              Access your downloaded learning materials when you don't have internet connectivity.
            </p>
          </div>

          <Tabs defaultValue="resources" className="space-y-6">
            <TabsList>
              <TabsTrigger value="resources">
                <Download className="h-4 w-4 mr-2" />
                My Downloads
              </TabsTrigger>
              <TabsTrigger value="info">
                <HelpCircle className="h-4 w-4 mr-2" />
                How It Works
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="resources" className="space-y-6">
              <OfflineResourceManager />
            </TabsContent>
            
            <TabsContent value="info" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>How Offline Access Works</CardTitle>
                  <CardDescription>
                    Learn how to use offline resources effectively
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex flex-col space-y-2 items-center text-center p-4 border rounded-lg">
                      <Wifi className="h-10 w-10 text-primary" />
                      <h3 className="font-medium text-lg">Online Mode</h3>
                      <p className="text-sm text-muted-foreground">
                        While online, download the resources you want to access later. 
                        Each download is securely encrypted and stored locally.
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-2 items-center text-center p-4 border rounded-lg">
                      <WifiOff className="h-10 w-10 text-primary" />
                      <h3 className="font-medium text-lg">Offline Mode</h3>
                      <p className="text-sm text-muted-foreground">
                        Access your downloaded materials even without internet. 
                        You can play videos and view content securely within the app.
                      </p>
                    </div>
                  </div>
                  
                  <Accordion type="single" collapsible className="mt-6">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>How do I download content?</AccordionTrigger>
                      <AccordionContent>
                        When viewing a video resource, look for the "Save Offline" button at the bottom of the viewer. 
                        Click this button to download the content for offline use. The content will be encrypted and stored securely.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-2">
                      <AccordionTrigger>How long are downloads available?</AccordionTrigger>
                      <AccordionContent>
                        Downloaded resources typically expire after 7 days for security reasons.
                        You can always re-download resources when you're online again.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Can I share downloaded content?</AccordionTrigger>
                      <AccordionContent>
                        No, downloaded content is encrypted and can only be accessed through this application.
                        This protects intellectual property and ensures content is used as intended.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-4">
                      <AccordionTrigger>What types of content can I download?</AccordionTrigger>
                      <AccordionContent>
                        Currently, you can download video content for offline viewing.
                        Other content types may be supported in future updates.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}