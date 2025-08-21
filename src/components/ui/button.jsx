export function Button({ children, variant = "default", className, ...rest }) {
  const base = "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm";
  const styles = variant === "secondary" ? "bg-gray-100 border-gray-300 text-gray-800" : "bg-black text-white border-black";
  return <button className={[base, styles, className].filter(Boolean).join(" ")} {...rest}>{children}</button>;
}
