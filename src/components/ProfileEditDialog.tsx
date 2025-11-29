import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { User, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ActivityService } from "@/services/activityService";

interface ProfileEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileEditDialog = ({ isOpen, onClose }: ProfileEditDialogProps) => {
  const { user, profile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      setFirstName((profile as any)?.first_name || "");
      setLastName((profile as any)?.last_name || "");
      setEmail(profile.email || user?.email || "");
    }
  }, [isOpen, profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your first and last name");
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setIsLoading(true);

    try {
      // Only update the name, not the email
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully! Refreshing...");

      // Log profile update activity
      try {
        await ActivityService.logProfileUpdate(user.id);
      } catch (activityError) {
      }

      onClose();

      // Force refresh to update the auth context with new profile data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setFirstName((profile as any)?.first_name || "");
      setLastName((profile as any)?.last_name || "");
      // Email is read-only, no need to reset it
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-5 w-5 text-book-600 mr-2" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-sm font-medium">
              First Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="first_name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="pl-10"
                placeholder="Enter your first name"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-sm font-medium">
              Last Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="last_name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="pl-10"
                placeholder="Enter your last name"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-600"
            >
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                className="pl-10 bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="Email cannot be changed"
                disabled={true}
                readOnly={true}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              For security reasons, email addresses cannot be changed. Contact
              support if you need to update your email.
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-book-600 hover:bg-book-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;
