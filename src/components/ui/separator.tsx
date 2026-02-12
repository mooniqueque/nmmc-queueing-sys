"use client"

<<<<<<< HEAD
import { Separator as SeparatorPrimitive } from "radix-ui"
import * as React from "react"
=======
import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"
>>>>>>> c86fe1e8e9c9a08e9b65be2daf3289119460b21d

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
