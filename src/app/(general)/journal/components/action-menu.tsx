"use client";

import { EllipsisVertical, Trash2, Pencil } from "lucide-react";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import ConfirmationDialog from "@/components/common/confirmation-dialog";
import { toast } from "sonner";
import { deleteTradeAccountAction } from "@/actions/trade-account/delete";
import CreateTradeAccountDialog from "@/app/_components/create-trade-account-dialog";

interface ActionMenuProps {
  account: {
    id: string;
    name: string;
    broker: string | null;
    type: "real" | "demo" | "backtest";
    balance: string;
    currency: string;
    isActive: boolean;
  };
}

export default function ActionMenu({ account }: ActionMenuProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = async () => {
    try {
      // Dummy API endpoint for delete
      const response = await deleteTradeAccountAction(account.id);
      if (!response.success) {
        throw new Error(response.message);
      }
      toast.success("Account deleted successfully");
      // Optionally refresh the page or update the list
      // window.location.reload();
    } catch (error) {
      toast.error("Failed to delete account");
      console.error(error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <EllipsisVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <ConfirmationDialog
            title="Are you sure?"
            description="This action cannot be undone. This will permanently delete the account and all associated data."
            onConfirm={handleDelete}
            confirmText="Delete"
            cancelText="Cancel"
            trigger={
              <DropdownMenuItem
                className="w-full"
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateTradeAccountDialog
        mode="edit"
        accountData={account}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}
