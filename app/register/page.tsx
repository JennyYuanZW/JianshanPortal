"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!formData.agreeTerms) {
            setError("You must agree to the Terms of Service");
            return;
        }

        setLoading(true);
        try {
            await register(formData.email, formData.username, formData.password);
            // Wait a bit to ensure state updates or just push
            router.push("/dashboard"); // Redirect to Dashboard which will decide where to go
        } catch (error: any) {
            console.error("Registration failed", error);
            setError(error.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full flex-row overflow-hidden bg-background">
            {/* Left Column - Hero (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-7/12 flex-col justify-between p-10 h-full relative">
                <div className="absolute inset-0 m-6 rounded-2xl overflow-hidden cursor-pointer group">
                    <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuABx36VECA-_Kl_B4ms9OXRMx-qLQsl5TWKE68tN44oZTHAmG5zIC7Be7Dz9i01jjsNpx3nFcWQEZWHLot8N_ypSZkhHkI9UXOveAsBvS8L7--mg-_YnZD9YMhX94K8S4XBjXwYPj3DCwOb6L3jMzTTxnBoBhrjJXo0Dmrlmlba1mc5LWQeLdbeCuPv6hYJT0TeUsDvda470mVwZUr-zqKCy_3KvcQZDTzGw8VSU1-C4lxBaP7iG9J-KQ3nWXMKm6NhuFC1Me6oJYbB"
                        alt="Students studying"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-12">
                        <blockquote className="text-white mb-4">
                            <p className="text-3xl font-bold leading-tight mb-4">"The best summer of my life. I learned so much and made friends from all over the world."</p>
                            <footer className="text-white/80 font-medium text-lg">— Sarah Chen, Alumni '23</footer>
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="flex w-full lg:w-5/12 flex-col justify-center px-6 sm:px-12 py-10 lg:p-20 bg-background h-full overflow-y-auto">
                <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">
                    <div className="flex flex-col gap-2 mb-4">
                        <h1 className="text-4xl font-black tracking-tight text-foreground">Your Summer Adventure Starts Here!</h1>
                        <p className="text-muted-foreground text-lg">Sign up and get ready for an unforgettable experience!</p>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="flex flex-col gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                placeholder="Enter your preferred username"
                                className="h-14 bg-background"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="student@example.com"
                                className="h-14 bg-background"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="At least 8 characters"
                                    className="h-14 bg-background pr-12"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-0 h-full px-4 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter your password"
                                    className="h-14 bg-background pr-12"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-0 top-0 h-full px-4 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 mt-2">
                            <Checkbox
                                id="terms"
                                checked={formData.agreeTerms}
                                onCheckedChange={(checked) => setFormData({ ...formData, agreeTerms: checked as boolean })}
                            />
                            <Label htmlFor="terms" className="text-sm font-medium leading-tight text-muted-foreground">
                                I agree to the <Link href="#" className="font-bold text-foreground hover:text-primary underline">Terms of Service</Link> and <Link href="#" className="font-bold text-foreground hover:text-primary underline">Privacy Policy</Link>.
                            </Label>
                        </div>

                        <Button type="submit" disabled={loading} size="lg" className="h-14 text-base font-bold mt-2 w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </form>

                    <div className="text-center mt-4 md:hidden">
                        <p className="text-muted-foreground text-sm">
                            Already have an account? <Link href="/login" className="font-bold text-foreground hover:text-primary">Log in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
