import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const TemporaryCheckoutBlockModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Checkout Temporarily Unavailable
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-center">
          <div className="text-gray-600">
            We're currently experiencing technical difficulties with our checkout system. Our team is working to restore service as quickly as possible.
          </div>
          <div className="text-sm text-gray-500">
            Please try again in a few moments.
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            Got It
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemporaryCheckoutBlockModal;
