"use client";
import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { authClient } from "@/lib/auth/auth-client";
import React, { useEffect, useRef, useState } from "react";

function EmailVerification({ email }: { email: string }) {
  const [timeToNextResend, setTimeToNextResend] = useState(60);
  const interval = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    startEmailVerificationCountdown();
  }, []);

  function startEmailVerificationCountdown(time = 60) {
    setTimeToNextResend(time);
    interval.current = setInterval(() => {
      setTimeToNextResend((t) => {
        const newT = t - 1;
        if (newT <= 0) {
          clearInterval(interval.current);
          return 0;
        }
        return newT;
      });
    }, 1000);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mt-2">
        We send you a verification link. Please check your email and click the
        link to verify your account
      </p>
      <BetterAuthActionButton
        variant="outline"
        className="w-full"
        successMessage="Verification email sent!"
        action={() => {
          startEmailVerificationCountdown();
          return authClient.sendVerificationEmail({
            email,
            callbackURL: "/",
          });
        }}
        disabled={timeToNextResend > 0}
      >
        {timeToNextResend > 0
          ? `Resend Email (${timeToNextResend})`
          : `Resend Email`}
      </BetterAuthActionButton>
    </div>
  );
}

export default EmailVerification;
