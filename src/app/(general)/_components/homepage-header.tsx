import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import React from "react";
import ManualTradeAddForm from "./manual-trade-add-form";

export default function HomePageHeader() {
  return (
    <div className="flex justify-end items-center gap-2">
      <Button size="sm">
        <PlusIcon /> Import
      </Button>
      <ManualTradeAddForm />
    </div>
  );
}
