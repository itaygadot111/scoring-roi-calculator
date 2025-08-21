export function Label({ children, className }) {
  return <label className={["text-sm", className].filter(Boolean).join(" ")}>{children}</label>;
}
