import { Button } from "@/app/components/Button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-24">
      <div className="w-full max-w-sm engraved rounded-2xl bg-card p-8 text-center">
        <Compass className="mx-auto h-6 w-6 text-faint" aria-hidden />
        <h1 className="display mt-4 text-2xl text-foreground">Page not found</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          We couldn’t find that page. Check the URL or head back to the app.
        </p>
        <Button className="mt-6 w-full" href="/dashboard">
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
