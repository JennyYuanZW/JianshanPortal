"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail, MessagesSquare } from "lucide-react";
import { isAdmin } from "@/lib/utils";

export default function LoginPage() {
    const router = useRouter();
    const { login, loginWithGoogle } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await login(email, password);

            // Check if logging in as admin
            if (isAdmin(email)) {
                router.push("/admin/dashboard");
            } else {
                router.push("/dashboard");
            }
        } catch (error: any) {
            console.error("Login failed", error);
            setError("Invalid username or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full flex-row overflow-hidden bg-background">
            {/* Left Column - Hero Image */}
            <div className="hidden lg:flex lg:w-2/3 relative flex-col justify-end p-12 xl:p-20 overflow-hidden bg-primary/95 group/design-root">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCfNWP0JwrlodGUVOhgBcerYgpmWEexPBJTMNIqPFGp8BI-GFgOdTf0dTX-wsF_SApimdrAedCFMOjdPi--C-AdvDmMFU3resmz_XEbbMP_2Vd51nZVgQLNIW4VHVtcsI8g5XXa-lch7i2PTYu6dIwdiTUQ665PRM6KE61m_8OsSWlE_9jVtcqvwbWYDU9ZzQVjIbkWNZNdCVCBnsx0mjqGyp739PwV3a_WohUN6-P-6BufJU0Gsgv3CQTMGOtzUVc1L_IjyWL7Gfkz')" }}
                />
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-primary/95 via-primary/50 to-transparent" />

                {/* Content */}
                <div className="relative z-10 max-w-3xl">
                    <div className="mb-6 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-accent text-primary">
                            <span className="font-bold text-lg">J</span>
                        </span>
                        <span className="text-accent font-bold tracking-wider uppercase text-sm">
                            Jianshan Summer Camp 2024
                        </span>
                    </div>

                    <h1 className="text-white text-5xl xl:text-7xl font-black leading-tight tracking-tight mb-4 drop-shadow-sm">
                        Discover Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-100">
                            Potential
                        </span> at Jianshan
                    </h1>

                    <h2 className="text-gray-200 text-lg xl:text-xl font-normal leading-relaxed max-w-xl">
                        Join a community of ambitious learners. Embark on a summer of growth, friendship, and unforgettable memories.
                    </h2>

                    <div className="mt-10 flex gap-4">
                        <div className="flex -space-x-3 overflow-hidden">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-10 w-10 rounded-full ring-2 ring-white bg-gray-300" />
                            ))}
                        </div>
                        <div className="flex flex-col justify-center">
                            <p className="text-white text-xs font-bold">500+ Students</p>
                            <p className="text-gray-300 text-xs">Joined last year</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex w-full lg:w-1/3 flex-col relative bg-background shadow-2xl z-20 h-full overflow-y-auto">
                {/* Mobile Header Image */}
                <div
                    className="lg:hidden h-48 w-full bg-cover bg-center relative shrink-0"
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBJQZ6JfR5KlW8qbAlOUoLfg3HO2g1jQMh4YIfylZB7cP_uhrU988A9iaT_ClPv8wVKfxBArQbqo3SkTw_NeJ47rr0N8MVkNqgoYHqDykhQFm3wx6lWhE5jyThL7uSG1iUvZZefi7_hWeb15yDbcID-OlrwZjTSw2D_jJuQ-8FvopWS8LkprbRigcCKxirGoJ9ZVwORiGdUx8olaeoU5hAtwRnVvfSpGCn2m_A_7LZfDYY_0se9BTGW8YpZEBcZg0Q11LFZOMdn-OYS')" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    <div className="absolute bottom-4 left-6 text-white">
                        <h1 className="font-bold text-2xl text-primary">Jianshan Camp</h1>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-10 pt-10 lg:pt-32">
                    <div className="w-full max-w-[400px] mx-auto flex flex-col gap-8">
                        <div className="flex flex-col gap-2">
                            <p className="text-primary tracking-tight text-3xl font-bold leading-tight">Student Login</p>
                            <p className="text-muted-foreground text-sm font-normal">
                                Welcome to Jianshan Application Portal. Please enter your details below.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="font-semibold text-primary">Username or Email</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="text"
                                        placeholder="Username or Email"
                                        className="pl-11 h-12 border-input bg-background focus-visible:ring-accent"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password" className="font-semibold text-primary">Password</Label>
                                    <Link href="#" className="text-xs font-semibold text-muted-foreground hover:text-accent transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        className="pl-11 h-12 border-input bg-background focus-visible:ring-accent"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="mt-2 h-12 w-full bg-primary hover:bg-primary/90 text-white font-bold tracking-wide border border-transparent shadow-none"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Log In
                            </Button>
                        </form>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-border"></div>
                            <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase font-semibold tracking-wider">Or continue with</span>
                            <div className="flex-grow border-t border-border"></div>
                        </div>

                        <Button
                            variant="secondary"
                            onClick={async () => {
                                try {
                                    await loginWithGoogle();
                                    router.push("/dashboard");
                                } catch (error) {
                                    console.error("Google login failed", error);
                                }
                            }}
                            className="h-14 w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-bold gap-3 shadow-sm hover:shadow-md transition-all"
                        >
                            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.17c-.22-.66-.35-1.36-.35-2.17s.13-1.51.35-2.17V7.01H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.99l3.66-2.82z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.01l3.66 2.82c.87-2.6 3.3-4.45 6.16-4.45z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Sign in with Google
                        </Button>

                        <div className="mt-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Don't have an account yet?{' '}
                                <Link href="/register" className="text-primary font-bold hover:text-accent underline decoration-2 decoration-accent/30 hover:decoration-accent transition-all">
                                    Register Account
                                </Link>
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto pt-10 text-center pb-8">
                        <p className="text-xs text-muted-foreground/60">
                            © 2024 Jianshan Education. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
