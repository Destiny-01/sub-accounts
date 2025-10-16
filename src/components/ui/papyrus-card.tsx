import * as React from "react"
import { cn } from "@/lib/utils"

const PapyrusCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border-2 border-double border-primary/30 bg-card/80 backdrop-blur-sm text-card-foreground shadow-sm transition-all duration-300 hover:border-primary/60 egyptian-border",
      className
    )}
    {...props}
  />
))
PapyrusCard.displayName = "PapyrusCard"

const PapyrusCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
PapyrusCardHeader.displayName = "PapyrusCardHeader"

const PapyrusCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-egyptian font-semibold leading-none tracking-wide text-primary",
      className
    )}
    {...props}
  />
))
PapyrusCardTitle.displayName = "PapyrusCardTitle"

const PapyrusCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
PapyrusCardDescription.displayName = "PapyrusCardDescription"

const PapyrusCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
PapyrusCardContent.displayName = "PapyrusCardContent"

const PapyrusCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
PapyrusCardFooter.displayName = "PapyrusCardFooter"

export { PapyrusCard, PapyrusCardHeader, PapyrusCardFooter, PapyrusCardTitle, PapyrusCardDescription, PapyrusCardContent }
