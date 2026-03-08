import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Component() {
  const [count, setCount] = useState(0);

  return (
<div className="min-h-screen w-full relative">
  {/* Radial Gradient Background from Bottom */}
  <div
    className="absolute inset-0 z-0"
    style={{
      background: "radial-gradient(125% 125% at 50% 90%, #fff 40%, #4180de 100%)",
    }}
  />
     {/* Your Content/Components */}
</div>
  );
};




