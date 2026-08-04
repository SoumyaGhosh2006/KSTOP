/**
 * LoadingSpinner
 * Reusable loading indicator component used while content is loading.
 */
export default function LoadingSpinner() {
  return (
    <div
      aria-label="Loading"
      style={{
        width: "1rem",
        height: "1rem",
        border: "2px solid rgba(255,255,255,0.4)",
        borderTopColor: "currentColor",
        borderRadius: "9999px",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}
