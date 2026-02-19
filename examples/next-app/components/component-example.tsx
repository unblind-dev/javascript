"use client";
import { Example, ExampleWrapper } from "@/components/example";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Timeseries, useMetrics } from "@unblind/nextjs";
import { Skeleton } from "./ui/skeleton";

export function ComponentExample() {
  return (
    <ExampleWrapper>
      <MetricsExample />
    </ExampleWrapper>
  );
}

function MetricsExample() {
  const { metrics, isLoading, hasError } = useMetrics();
  const displayMetrics = metrics ? metrics.slice(0, 6) : [];

  if (hasError) {
    return (
      <Example title="Metrics" className="items-center justify-center">
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          Unable to load metrics. Check your configuration.
        </div>
      </Example>
    );
  }

  if (isLoading) {
    return (
      <Example title="Metrics" className="items-center justify-center">
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="relative w-full overflow-hidden p-4 py-6">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Example>
    );
  }

  if (displayMetrics.length === 0) {
    return (
      <Example title="Metrics" className="items-center justify-center">
        <div className="rounded-md border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
          No metrics available.
        </div>
      </Example>
    );
  }

  return (
    <Example title="Metrics" className="items-center justify-center">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {displayMetrics.map((metric) => (
          <Card
            key={metric.name}
            className="relative w-full overflow-hidden p-4 py-6"
          >
            <CardHeader>
              <CardTitle>{metric.name}</CardTitle>
              <CardDescription>{metric.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <Timeseries metrics={[metric.name]} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Example>
  );
}
