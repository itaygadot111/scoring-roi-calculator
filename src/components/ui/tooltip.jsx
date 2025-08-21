import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export const TooltipProvider = TooltipPrimitive.Provider;
export function Tooltip({ children, ...props }) {
  return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>;
}
export function TooltipTrigger(props) {
  return <TooltipPrimitive.Trigger {...props} />;
}
export function TooltipContent({ className = "", ...props }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content sideOffset={6} className={[
        "rounded-md bg-black text-white text-xs px-2 py-1 shadow",
        className
      ].filter(Boolean).join(" ")} {...props} />
    </TooltipPrimitive.Portal>
  );
}
