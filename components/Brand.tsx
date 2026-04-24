export function PizzaHutMark({ className = "h-7 w-auto" }: { className?: string }) {
  // Yum! Brands wordmark (sourced from Wikimedia Commons) served from /public.
  // Kept exported under the legacy name so existing call-sites keep working.
  return (
    <img
      src="/yum-logo.svg"
      alt="Yum! Brands"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}

export { PizzaHutMark as YumMark };
