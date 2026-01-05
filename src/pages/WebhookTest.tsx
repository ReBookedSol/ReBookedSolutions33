import { useState } from "react";
import { Mail, Lock, User, Loader2, Phone } from "lucide-react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sendRegistrationWebhook, RegistrationData } from "@/utils/registrationWebhook";

const WebhookTest = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const normalizePhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (value.trim().startsWith("+27")) {
      return ("0" + digits.slice(2)).slice(0, 10);
    }
    if (digits.startsWith("27")) {
      return ("0" + digits.slice(2)).slice(0, 10);
    }
    return digits.slice(0, 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
        throw new Error("All fields are required");
      }

      const normalizedPhone = normalizePhone(phone);

      if (!/^0\d{9}$/.test(normalizedPhone)) {
        const proceed = window.confirm(
          "South African numbers should start with 0 and be 10 digits. Proceed anyway?"
        );
        if (!proceed) {
          setIsLoading(false);
          return;
        }
      }

      const registrationData: RegistrationData = {
        firstName,
        lastName,
        email,
        phone: normalizedPhone,
        ...(affiliateCode && { affiliateCode }),
      };

      await sendRegistrationWebhook(registrationData);

      toast.success("Webhook data sent successfully!", {
        duration: 4000,
      });

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setAffiliateCode("");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send webhook data. Please try again.";
      toast.error(errorMessage, {
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-sm md:max-w-md">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-5 sm:p-6">
              <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
                Webhook Test
              </h1>
              <p className="text-center text-sm text-gray-600 mb-6">
                Send test data to the registration webhook without creating an account
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="test_first_name">First Name</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id="test_first_name"
                          type="text"
                          placeholder="John"
                          className="pl-10"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="test_last_name">Last Name</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id="test_last_name"
                          type="text"
                          placeholder="Doe"
                          className="pl-10"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test_email">Email</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="test_email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test_phone">Phone Number</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="test_phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="e.g., 0812345678"
                      className="pl-10"
                      value={phone}
                      onChange={(e) => setPhone(normalizePhone(e.target.value))}
                    />
                    {phone && !/^0\d{9}$/.test(phone) && (
                      <p className="text-xs text-amber-600 mt-1 pl-10">
                        South African numbers should start with 0 and be 10 digits.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test_affiliate">Affiliate Code (Optional)</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="test_affiliate"
                      type="text"
                      placeholder="e.g., REF123"
                      className="pl-10"
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-book-600 hover:bg-book-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send to Webhook"
                  )}
                </Button>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                  <strong>Note:</strong> This page only tests sending data to the webhook. No account is created.
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WebhookTest;
