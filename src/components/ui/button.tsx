import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-modern hover:shadow-modern-lg transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-modern hover:shadow-modern-lg transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
        outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-modern transform hover:-translate-y-0.5 active:translate-y-0",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-modern hover:shadow-modern-lg transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground transform hover:-translate-y-0.5 active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        glass: "bg-glass-background border border-glass-border backdrop-blur-md text-foreground hover:bg-glass-background/80 shadow-modern hover:shadow-modern-lg transform hover:-translate-y-0.5 active:translate-y-0",
        gradient: "bg-gradient-to-r from-primary via-accent to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-primary-foreground shadow-modern hover:shadow-modern-lg transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
        success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-modern hover:shadow-modern-lg transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
        warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-modern hover:shadow-modern-lg transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
        info: "bg-blue-500 text-white hover:bg-blue-600 shadow-modern hover:shadow-modern-lg transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
