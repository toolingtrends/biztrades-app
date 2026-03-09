"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/hooks/use-settings";

interface SettingsSectionProps {
  userData?: any;
  onUpdate?: (updatedUser: any) => void;
}

export function SettingsSection({ userData, onUpdate }: SettingsSectionProps) {
  const { toast } = useToast();
  const { 
    settings, 
    isLoading, 
    updateSettings, 
    sendEmailVerification, 
    verifyEmailCode, 
    deactivateAccount,
    isSendingCode,
    isVerifyingCode 
  } = useSettings();

  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editingField, setEditingField] = useState<"phone" | "email" | "profile" | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState("");
  const [emailError, setEmailError] = useState("");

  // Clear email error when email changes
  useEffect(() => {
    if (editEmail && emailError) {
      setEmailError("");
    }
  }, [editEmail, emailError]);

  if (isLoading) {
    return <div className="w-full px-6 py-6">Loading settings...</div>;
  }

  const handleToggle = (key: string, value: boolean) => {
    updateSettings({ [key]: value });
  };

  const handleSavePhone = () => {
    if (editPhone.trim()) {
      updateSettings({ phoneNumber: editPhone });
      setEditPhone("");
      setEditingField(null);
    }
  };

const handleSendVerification = () => {
  if (editEmail.trim()) {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // REMOVED: Check if email is same as current
    // This check is now handled by the backend properly
    
    // Store the email to verify
    setEmailToVerify(editEmail);
    setEmailError("");
    
    // Start email verification process
    sendEmailVerification(editEmail, {
      onSuccess: () => {
        setIsVerifying(true);
        toast({
          title: "Verification code sent",
          description: "A 6-digit code has been sent to your email.",
        });
      },
      onError: (error: any) => {
        setIsVerifying(false);
        setEmailToVerify("");
        setEmailError(error.message || "Failed to send verification code");
      }
    });
  }
};

const handleSaveEmailWithoutVerification = () => {
  if (editEmail.trim()) {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // REMOVED: Check if email is same as current
    
    setEmailError("");
    updateSettings({ email: editEmail });
    setEditEmail("");
    setEditingField(null);
    toast({
      title: "Email updated",
      description: "Your email has been updated. Please verify it later.",
    });
  }
};

  const handleProfileVisibilityChange = (value: string) => {
    updateSettings({ profileVisibility: value });
  };

  const handleEmailNotificationsToggle = (newValue: boolean) => {
    updateSettings({ emailNotifications: newValue });
  };

  const cancelEdit = () => {
    setEditPhone("");
    setEditEmail("");
    setEditingField(null);
    setOtp(["", "", "", "", "", ""]);
    setIsVerifying(false);
    setEmailToVerify("");
    setEmailError("");
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    verifyEmailCode(
      { code: enteredOtp, email: emailToVerify },
      {
        onSuccess: () => {
          toast({
            title: "Verification successful",
            description: "Your email has been verified successfully.",
          });
          setEditingField(null);
          setOtp(["", "", "", "", "", ""]);
          setEditEmail("");
          setIsVerifying(false);
          setEmailToVerify("");
          setEmailError("");
        },
        onError: (error: any) => {
          toast({
            title: "Verification failed",
            description: error.message,
            variant: "destructive",
          });
          setEmailError(error.message);
        }
      }
    );
  };

  const handleDeactivateAccount = () => {
    if (confirm("Are you sure you want to deactivate your account? This action can be reversed later.")) {
      deactivateAccount(undefined, {
        onSuccess: () => {
          toast({
            title: "Account deactivated",
            description: "Your account has been deactivated successfully.",
          });
        }
      });
    }
  };

  return (
    <div className="w-full px-6 py-6 space-y-10 bg-white">
      {/* ---- Privacy Settings ---- */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>
        <div className="space-y-5 text-sm">
          {/* Profile Visibility */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium">Profile Visibility</div>
                <p className="text-gray-500">Who can see your profile</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 capitalize">{settings?.profileVisibility}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingField(editingField === "profile" ? null : "profile")}
                >
                  {editingField === "profile" ? "Cancel" : "Edit"}
                </Button>
              </div>
            </div>
            
            {editingField === "profile" && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                <div className="flex gap-2">
                  {["public", "private"].map((option) => (
                    <Button
                      key={option}
                      variant={settings?.profileVisibility === option ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleProfileVisibilityChange(option)}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium">Phone Number</div>
                <p className="text-gray-500">{settings?.phoneNumber || "Not set"}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditingField(editingField === "phone" ? null : "phone");
                  setEditPhone(settings?.phoneNumber || "");
                }}
              >
                {editingField === "phone" ? "Cancel" : "Edit"}
              </Button>
            </div>
            
            {editingField === "phone" && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter phone number"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSavePhone} className="flex-1">
                    Save
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Email ID */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium">Email ID</div>
                <p className="text-gray-500">{settings?.email}</p>
                {settings?.emailVerified && (
                  <span className="text-xs text-green-600">✓ Verified</span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditingField(editingField === "email" ? null : "email");
                  setEditEmail(settings?.email || "");
                  setIsVerifying(false);
                  setEmailToVerify("");
                  setEmailError("");
                }}
              >
                {editingField === "email" ? "Cancel" : "Edit"}
              </Button>
            </div>
            
            {editingField === "email" && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                {!isVerifying ? (
                  <>
                    <div className="flex gap-2 mb-3">
                      <Input
                        type="email"
                        placeholder="Enter new email address"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSendVerification}
                        disabled={!editEmail.trim() || isSendingCode}
                        className="whitespace-nowrap"
                      >
                        {isSendingCode ? "Sending..." : "Send Code"}
                      </Button>
                    </div>
                    
                    {emailError && (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                        {emailError}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveEmailWithoutVerification}
                        disabled={!editEmail.trim() || !!emailError}
                        variant="outline"
                        className="flex-1"
                      >
                        Save Without Verification
                      </Button>
                      <Button variant="outline" onClick={cancelEdit} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3">Verify Email Address</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Enter the 6-digit verification code sent to <strong>{emailToVerify}</strong>
                    </p>
                    <div className="flex gap-2 mb-3 justify-center">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(e.target.value, index)}
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          className="w-12 h-12 text-center text-lg font-semibold"
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                    
                    {emailError && (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded mb-3">
                        {emailError}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleVerifyOtp} 
                        disabled={isVerifyingCode}
                        className="flex-1"
                      >
                        {isVerifyingCode ? "Verifying..." : "Verify Code"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsVerifying(false);
                          setOtp(["", "", "", "", "", ""]);
                          setEmailError("");
                        }}
                        className="flex-1"
                      >
                        Back
                      </Button>
                    </div>
                    <div className="mt-3 text-center">
                      <Button 
                        variant="link" 
                        onClick={handleSendVerification}
                        className="text-blue-600 text-sm"
                      >
                        Resend Code
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Introduce Me */}
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <div className="font-medium">Introduce me</div>
              <p className="text-gray-500">
                We will introduce you to other users interested in similar events
              </p>
            </div>
            <Switch
              checked={settings?.introduceMe ?? true}
              onCheckedChange={(checked) => handleToggle("introduceMe", checked)}
            />
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Notifications</div>
              <p className="text-gray-500">
                Receive event updates via email
              </p>
            </div>
            <Switch
              checked={settings?.emailNotifications ?? true}
              onCheckedChange={handleEmailNotificationsToggle}
            />
          </div>
        </div>
      </section>

      {/* ---- Notification Preferences ---- */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
        <div className="space-y-5 text-sm">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <div className="font-medium">Event Reminders</div>
              <p className="text-gray-500">Get notified about upcoming events</p>
            </div>
            <Switch
              checked={settings?.eventReminders ?? true}
              onCheckedChange={(checked) => handleToggle("eventReminders", checked)}
            />
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <div className="font-medium">New Messages</div>
              <p className="text-gray-500">Get notified about new messages</p>
            </div>
            <Switch
              checked={settings?.newMessages ?? true}
              onCheckedChange={(checked) => handleToggle("newMessages", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Connection Requests</div>
              <p className="text-gray-500">
                Get notified about new connection requests
              </p>
            </div>
            <Switch
              checked={settings?.connectionRequests ?? true}
              onCheckedChange={(checked) => handleToggle("connectionRequests", checked)}
            />
          </div>
        </div>
      </section>

      {/* ---- Manage ---- */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Manage</h2>
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between text-red-600 border-b pb-4">
            <div>
              <p className="font-medium">Deactivate my account</p>
              <p className="text-gray-500">Hide your profile from everywhere.</p>
            </div>
            <Button variant="ghost" onClick={handleDeactivateAccount} className="text-gray-600">
              ›
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}