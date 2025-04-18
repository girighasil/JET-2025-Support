import React from "react";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FormError from "@/components/ui/form-error";
import { formatZodError } from "@/lib/utils";

interface EnhancedFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
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
>({
  name,
  label,
  description,
  required,
  children,
  className,
}: EnhancedFormFieldProps<TFieldValues, TName>) {
  const { formState } = useFormContext<TFieldValues>();
  const { errors } = formState;
  
  // Find the error for this field
  const fieldError = errors[name];
  
  // Format error message to be user-friendly if it's from Zod
  const errorMessage = fieldError?.message 
    ? fieldError.message.toString()
    : undefined;

  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            {React.isValidElement(children)
              ? React.cloneElement(children as React.ReactElement, {
                  ...field,
                  id: name,
                })
              : children}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {errorMessage && <FormError message={errorMessage} />}
        </FormItem>
      )}
    />
  );
}