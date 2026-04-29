import React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  variant = "shimmer",
  ...props
}: React.ComponentProps<"div"> & { variant?: "pulse" | "shimmer" }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-primary/10 rounded-md",
        variant === "shimmer" ? "skeleton-shimmer" : "animate-pulse",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
