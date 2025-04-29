import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useSiteConfig } from '@/hooks/use-site-config';
import { Button } from '@/components/ui/button';

interface AlertItem {
  text: string;
  date?: string;
}

const AlertPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { config } = useSiteConfig();

  // Alert data - this would ideally come from an API
  const alerts: AlertItem[] = [
    {
      text: "JET form filling will be started from 06:15 PM today (29.04.2025).",
      date: "28-04-2025"
    },
    {
      text: "Last date of Form filling: 28.05.2025 (without late fee) and 31.05.2025 (with late fee)",
      date: "28-04-2025"
    },
    {
      text: "Date of Exam: 29.06.2025",
      date: ""
    },
    {
      text: "All information related to this examination will be communicated on official website.",
      date: "25-04-2025"
    },
    {
      text: "इस परीक्षा से संबंधित सभी जानकारी अधिकारिक वेबसाइट पर दी जाएगी।",
      date: ""
    }
  ];

  // Show popup on component mount
  useEffect(() => {
    // Show popup after a short delay for better UX
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Close the popup
  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="relative w-[95%] max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-green-700 text-white p-3 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center">
            Important Alert(s)
          </h2>
          <button 
            onClick={handleClose} 
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <ul className="space-y-4">
            {alerts.map((alert, index) => (
              <li key={index} className="flex">
                <span className="mr-3 mt-1 text-green-800 flex-shrink-0">
                  <Check className="h-5 w-5 bg-green-100 rounded-full p-0.5" />
                </span>
                <p className="text-gray-800">{alert.text}</p>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex justify-end">
          <Button 
            onClick={handleClose}
            className="bg-red-500 hover:bg-red-600 text-base px-6"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlertPopup;