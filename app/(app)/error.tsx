"use client";

import { ErrorState } from "@/app/components/ErrorState";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Something went wrong"
      description="A part of the app crashed. Try again, or reload the page."
      onRetry={reset}
    />
  );
}
