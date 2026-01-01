
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useEffect, useState } from "react";

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = useAuth();
    const [apiKeyError, setApiKeyError] = useState(false);

    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
            setApiKeyError(true);
        }
    }, []);

    const handleGoogleSignIn = async () => {
        if (apiKeyError || !auth) {
             toast({
                title: "Firebase API Key Missing",
                description: "Please check your .env.local file and the SETUP.md guide.",
                variant: "destructive",
            });
            return;
        }

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
            let description = "Could not sign in with Google. Please try again.";
            if (error.code === 'auth/invalid-api-key' || error.code === 'auth/missing-api-key') {
                description = "Firebase API Key is invalid or missing. Please check your .env.local file and the SETUP.md guide."
                setApiKeyError(true);
            } else if (error.message) {
                description = error.message;
            }

            toast({
                title: "Uh oh! Something went wrong.",
                description: description,
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
                         <Alert variant={apiKeyError ? "destructive" : "default"}>
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>For Developers</AlertTitle>
                            <AlertDescription>
                                {apiKeyError 
                                    ? "Your Firebase API key is missing. Please create a .env.local file with your Firebase config. See SETUP.md for instructions."
                                    : "If you see an API key error, make sure you have created a .env.local file with your Firebase config. See SETUP.md."
                                }
                            </AlertDescription>
                        </Alert>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
