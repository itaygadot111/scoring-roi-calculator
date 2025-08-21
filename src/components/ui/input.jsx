export function Input(props) {
  const { className, ...rest } = props;
  return <input className={["border rounded-md px-2 py-1 w-full", className].filter(Boolean).join(" ")} {...rest} />;
}
