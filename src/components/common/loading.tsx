import { Circle, LoaderCircleIcon, LoaderPinwheel } from "lucide-react";
import React from "react";

export default function Loading() {
  return (
    <div className="w-full h-screen flex justify-center items-center">
      <LoaderCircleIcon className="animate-spin" size={48} />
    </div>
  );
}
