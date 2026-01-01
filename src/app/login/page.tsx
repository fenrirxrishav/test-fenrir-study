"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase/config";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            toast({
                title: "Login Successful",
                description: "Welcome back!",
            });
            router.push('/dashboard');
        } catch (error: any) {
            console.error("Error during sign-in:", error);
            toast({
                title: "Uh oh! Something went wrong.",
                description: error.message || "Could not sign in with Google.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                    <CardDescription>
                        Sign in to access your dashboard and track your study progress.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                            <FcGoogle className="mr-2 h-4 w-4" />
                            Sign in with Google
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
