import React from "react";
import { useFormContext, FieldValues, FieldPath } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface EnhancedFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: string;
  description?: string;
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
  render?: (props: { field: any; fieldState: any }) => React.ReactNode;
}

/**
 * Enhanced form field component with better error handling
 * 
 * This component extends the shadcn FormField to provide better error visualization
 * and user-friendly error messages.
 */
export function EnhancedFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: EnhancedFormFieldProps<TFieldValues, TName>) {
  const { 
    name, 
    label, 
    description, 
    required = false, 
    children, 
    className,
    render 
  } = props;
  
  const { control } = useFormContext<TFieldValues>();

  // If render prop is provided, use it directly
  if (render) {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <FormItem className={cn(className, fieldState.error && "animate-shake")}>
            {label && (
              <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
                {label}
              </FormLabel>
            )}
            <FormControl>
              {render({ field, fieldState })}
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Standard render for regular form fields
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={cn(className, fieldState.error && "animate-shake")}>
          {label && (
            <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            {React.isValidElement(children)
              ? React.cloneElement(children, { ...field })
              : children}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}