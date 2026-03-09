import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error(`Failed to fetch settings: ${response.status}`);
      return response.json();
    },
    retry: 1,
  });

  // Update user settings
  const updateSettings = useMutation({
    mutationFn: async (newSettings: any) => {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to update settings`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Settings updated", description: "Your settings have been saved." });
    },
    onError: (error: Error) =>
      toast({ title: "Error updating settings", description: error.message, variant: "destructive" }),
  });

  // Send OTP
  const sendEmailVerification = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/settings/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send verification");
      return data;
    },
    onSuccess: () =>
      toast({ title: "Verification code sent", description: "Check your email for the 6-digit code." }),
    onError: (error: Error) =>
      toast({ title: "Error sending verification", description: error.message, variant: "destructive" }),
  });

  // Verify OTP
  const verifyEmailCode = useMutation({
    mutationFn: async ({ code, email }: { code: string; email: string }) => {
      const response = await fetch("/api/settings/verify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verification failed");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Verification successful", description: "Your email has been verified." });
    },
    onError: (error: Error) =>
      toast({ title: "Verification failed", description: error.message, variant: "destructive" }),
  });

  // Deactivate account
  const deactivateAccount = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/settings/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to deactivate account");
      return data;
    },
    onSuccess: () => toast({ title: "Account deactivated", description: "Your account is now hidden." }),
    onError: (error: Error) =>
      toast({ title: "Error deactivating account", description: error.message, variant: "destructive" }),
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettings.mutate,
    sendEmailVerification: sendEmailVerification.mutate,
    verifyEmailCode: verifyEmailCode.mutate,
    deactivateAccount: deactivateAccount.mutate,
    isUpdating: updateSettings.isPending,
    isSendingCode: sendEmailVerification.isPending,
    isVerifyingCode: verifyEmailCode.isPending,
    isDeactivating: deactivateAccount.isPending,
  };
}