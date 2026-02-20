"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useEffect, useState } from "react";
import SignInTab from "./_components/sign-in-tab";
import SignUpTab from "./_components/sign-up-tab.tsx";
import { Separator } from "@/components/ui/separator";
import SocialAuthButtons from "./_components/social-auth-buttons";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import EmailVerification from "./_components/email-verification";
import ForgotPassword from "./_components/forgot-password";

type Tab = "signin" | "signup" | "email-verification" | "forgot-password";

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [selectedTab, setSelectedTab] = useState<Tab>("signin");

  useEffect(() => {
    authClient.getSession().then((session) => {
      if (session.data != null) router.push("/");
    });
  }, [router]);

  function openEmailVerificationTab(email: string) {
    console.log("This triggered");
    setEmail(email);
    setSelectedTab("email-verification");
  }
  function openSignIn() {
    setSelectedTab("signin");
  }

  function openForgotPassword() {
    setSelectedTab("forgot-password");
  }

  return (
    <div className="min-h-screen flex items-center justify-center mx-5">
      <Tabs
        value={selectedTab}
        onValueChange={(t) => setSelectedTab(t as Tab)}
        className="max-auto w-full my-6 px-4 max-w-md mx-auto"
      >
        {(selectedTab == "signin" || selectedTab == "signup") && (
          <TabsList>
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="signin">
          <Card>
            <CardHeader className="text-2xl font-bold">Sign In</CardHeader>
            <CardContent>
              <SignInTab
                openEmailVerificationTab={openEmailVerificationTab}
                openForgotPassword={openForgotPassword}
              />
            </CardContent>
            <Separator />
            <CardFooter className="w-full">
              <SocialAuthButtons />
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader className="text-2xl font-bold">Sign Up</CardHeader>
            <CardContent>
              <SignUpTab openEmailVerificationTab={openEmailVerificationTab} />
            </CardContent>
            <Separator />
            <CardFooter className="w-full">
              <SocialAuthButtons />
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="email-verification">
          <Card>
            <CardHeader className="text-2xl font-bold">
              Email Verification
            </CardHeader>
            <CardContent>
              <EmailVerification email={email} />
            </CardContent>
            <Separator />
          </Card>
        </TabsContent>
        <TabsContent value="forgot-password">
          <Card>
            <CardHeader className="text-2xl font-bold">
              Forgot Password
            </CardHeader>
            <CardContent>
              <ForgotPassword openSignIn={openSignIn} />
            </CardContent>
            <Separator />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LoginPage;
