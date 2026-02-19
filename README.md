<p align="center">
  <a href="https://tryunblind.dev?utm_source=github&utm_medium=unblind_javascript" target="_blank" rel="noopener noreferrer">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://framerusercontent.com/images/jr9hF3ROFmfSiQUfy3VkvjXVok.png?width=512&height=512">
      <img src="https://framerusercontent.com/images/jr9hF3ROFmfSiQUfy3VkvjXVok.png?width=512&height=512" height="64">
    </picture>
  </a>
  <br />
</p>
<div align="center">
  <h1>
    Official Unblind JavaScript SDKs
  </h1>
  <br />
  <br />
  <p>
    <strong>
      Unblind helps developers build user-facing observability.
    </strong>
  </p>
  <p>
    This repository contains all the unblind JavaScript SDKs under the <code>@unblind</code> namespace.
  </p>
</div>

# Getting started

1. Install package:

   ```sh
   npm install @unblind/nextjs

   yarn add @unblind/nextjs

   pnpm add @unblind/nextjs
   ```

2. Add [Unblind API](https://console.unblind.dev/settings) key:

   ```sh
   UNBLIND_API_KEY=<your_api_key>
   ```

3. Add Unblind styles to your global tailwind file:

   ```css
   /* file: globals.css */
   @import "@unblind/react/styles.css";
   @import "tailwindcss";
   /* ... */
   ```

4. Add Unblind proxy:

  ```typescript
    // Works also for middleware
    import { unblindProxy } from "@unblind/nextjs/server";
    export default unblindProxy((req) => req.cookies.get("userId")?.value);
  
    export const config = {
      matcher: "/api/unblind/:path*",
    };
  ```

5. Add Unblind provider:

   ```jsx
   import { UnblindProvider } from "@unblind/nextjs";

   export default function Page() {
     return <UnblindProvider>...</UnblindProvider>;
   }
   ```

6. Render timeseries charts:

   ```jsx
   import { UnblindProvider, Timeseries } from "@unblind/nextjs";

   export default function Page() {
     return (
       <UnblindProvider>
         <Timeseries metrics="nodejs.eventloop.p50" />
       </UnblindProvider>
     );
   }
   ```

7. Aggregate by service name:

   ```jsx
   import { UnblindProvider, Timeseries } from "@unblind/nextjs";

   export default function Page() {
     return (
       <UnblindProvider>
         <Timeseries
           metrics="nodejs.eventloop.p50"
           groupBy={["service.name"]}
         />
       </UnblindProvider>
     );
   }
   ```

8. Use different filters and aggregations through a scope:

   ```jsx
   import { UnblindProvider, Scope, Timeseries } from "@unblind/nextjs";

   export default function Page() {
     return (
       <UnblindProvider>
         <Scope
           timeRange="1h"
           groupBy={["service.name"]}
           attributes={{ "host.name": ["us-east-2", "us-east-1"] }}
         >
           <Timeseries metrics="nodejs.eventloop.p50" />
         </Scope>
       </UnblindProvider>
     );
   }
   ```

### Additional props example

```jsx
<Timeseries
  metrics={["metricName"]}
  startTime={1770746168}
  endTime={1770746168}
  interval={3600}
  operator="avg"
  attributes={{ "attributeName": ["value1", "value2"]}}
  groupBy={["attributeName"]}
  
  // Style
  // Area and Bar are stacked by default. Use line + fill for area without stack.
  type={"line" || "area" || "bar" || "step" || "spline"}
  className
  appearance
  unit={"by"}
  thresholds={[{
    // Range format
    from: 0,
    to: 20,
    level: "warning" || "info" || "ok" || "error"
  }, {
    value: 80,
    level: "warning" || "info" || "ok" || "error"
  }]}
  tooltip={{
    hide: false,
    visibilityLimit: 5,
  }}
  min={0}
  max={100}
  colors={['#FFFFFF'] || () => '#FFFFFF'}
  invertSort={false},
  fill={false}
  hideAxis={false}
  hideCursor={false}
  relativeTimeAxis={false}
  invertSort={false}
  disableSuggestedLabel={false}
>
  {/* ... */}
</Timeseries>
```

### Hooks

```jsx
const { times, series, metadata, isLoading } = useTimeseries({
  metrics: "nodejs.eventloop.p50",
});
const { logs, isLoading } = useLogs({ severity: ["ERROR", "WARN"] });

// Returns global metrics
const { metrics } = useMetrics();
```

### Custom appearance

You can use custom appearance components:

```jsx
<Scope
  appearance={{
    components: {
      loading: <></>,
      error: <></>,
      empty: <></>,
      tooltip: <></>,
    },
  }}
>
  {/* ... */}
</Scope>
```
