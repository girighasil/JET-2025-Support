import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigation } from '@/lib/navigation';

export interface CourseCardProps {
  id: number;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  progress: number;
  isEnrolled?: boolean;
  onEnroll?: (courseId: number) => void;
}

export function CourseCard({
  id,
  title,
  description,
  category,
  thumbnail,
  progress = 0,
  isEnrolled = true,
  onEnroll,
}: CourseCardProps) {
  const { navigate } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  // Handle course enrollment
  const handleEnroll = async () => {
    if (onEnroll) {
      setIsLoading(true);
      try {
        await onEnroll(id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle continue learning
  const handleContinue = () => {
    navigate(`/student/courses/${id}`);
  };

  // Default thumbnail image if none provided
  const defaultThumbnail = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="h-40 bg-gray-200 relative">
        <img 
          src={thumbnail || defaultThumbnail} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <span className="text-xs font-medium text-white bg-primary px-2 py-1 rounded">
            {category}
          </span>
        </div>
      </div>
      
      <CardContent className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{description}</p>
        
        {isEnrolled && (
          <div className="mb-3 mt-auto">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        <Button 
          className="w-full" 
          variant={isEnrolled ? "default" : "outline"}
          disabled={isLoading}
          onClick={isEnrolled ? handleContinue : handleEnroll}
        >
          {isLoading ? 'Processing...' : isEnrolled ? 'Continue Learning' : 'Enroll Now'}
        </Button>
      </CardContent>
    </Card>
  );
}
