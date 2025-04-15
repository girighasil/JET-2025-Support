import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { LucideIcon } from 'lucide-react';

// Define variants for stats cards
const statsCardVariants = cva(
  "bg-white rounded-lg shadow-sm border border-border p-4",
  {
    variants: {
      variant: {
        default: "border-blue-100",
        primary: "",
        info: "bg-blue-50",
        success: "bg-green-50",
        warning: "bg-amber-50",
        error: "bg-red-50",
      },
      iconVariant: {
        default: "text-primary bg-blue-50",
        info: "text-blue-500 bg-blue-50",
        success: "text-green-500 bg-green-50",
        warning: "text-amber-500 bg-amber-50",
        error: "text-red-500 bg-red-50",
      }
    },
    defaultVariants: {
      variant: "default",
      iconVariant: "default",
    },
  }
);

export interface StatsCardProps extends VariantProps<typeof statsCardVariants> {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  actionLink?: {
    href: string;
    text: string;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
  actionLink,
  variant,
  iconVariant,
  className,
}: StatsCardProps) {
  return (
    <div className={cn(statsCardVariants({ variant }), className)}>
      <div className="flex items-start">
        <div className={cn("p-2 rounded-md", statsCardVariants({ iconVariant }))}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {actionLink && (
        <a
          href={actionLink.href}
          className="block mt-3 text-sm text-primary hover:underline font-medium"
        >
          {actionLink.text}
        </a>
      )}
    </div>
  );
}
