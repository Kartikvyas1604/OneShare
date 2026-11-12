import { Button } from "@/app/components/Button";
import { Card, CardContent } from "@/app/components/Card";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-20">
      <Card className="w-full max-w-sm text-center">
        <CardContent className="pt-8 pb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Compass className="h-8 w-8 text-muted-foreground" aria-hidden />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn’t find that page. Check the URL or head back to buy.
          </p>
          <Button className="mt-5 w-full" href="/buy">Go to buy</Button>
        </CardContent>
      </Card>
    </div>
  );
}
