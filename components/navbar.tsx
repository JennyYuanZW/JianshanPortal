"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Tent, Menu, X, User as UserIcon, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    // Hide Navbar on specific pages (Login, Register, Welcome) if design dictates full custom layout
    // User requested "Login interface... no full width footer". Doesn't say no navbar.
    // However, usually login/register/welcome are standalone. 
    // Based on provided designs, they have their own headers.
    // Let's exclude Navbar from /login, /register, /welcome, /acceptance.
    const hiddenPaths = ['/login', '/register'];
    if (hiddenPaths.some(path => pathname === path || pathname === `${path}/`)) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white">
            <div className="container px-4 md:px-8 flex h-16 items-center justify-between mx-auto max-w-7xl">
                <div className="flex items-center gap-2 md:gap-4">
                    <Link href={isAdmin ? "/admin/dashboard" : "/"} className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Tent className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-lg text-foreground">
                            {isAdmin ? "Admin Portal" : "Jianshan Academy"}
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-6">
                    {/* Desktop Nav Items */}

                    {/* Admin Links */}
                    {isAdmin && (
                        <Link
                            href="/admin/dashboard"
                            className={cn("text-sm font-medium transition-colors hover:text-primary hidden sm:block", pathname.startsWith('/admin') ? "text-primary" : "text-muted-foreground")}
                        >
                            Dashboard
                        </Link>
                    )}

                    {/* Standard User Links - Only show if NOT admin */}
                    {!isAdmin && (
                        <Link
                            href="/faq"
                            className={cn("text-sm font-medium transition-colors hover:text-primary hidden sm:block", pathname === '/faq' ? "text-primary" : "text-muted-foreground")}
                        >
                            FAQ
                        </Link>
                    )}

                    {user ? (
                        <>
                            {/* Username link */}
                            <button
                                className="text-sm font-medium text-muted-foreground hover:text-primary hidden sm:flex items-center gap-2"
                                onClick={() => { }} // Profile TODO
                            >
                                <UserIcon className="h-4 w-4" />
                                {user.name || (isAdmin ? 'Admin' : 'Student')}
                            </button>

                            <Button
                                variant="ghost"
                                className="text-muted-foreground hover:bg-transparent hover:text-destructive hidden sm:flex px-2"
                                onClick={() => logout()}
                                title="Log Out"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </>
                    ) : (
                        <div className="hidden sm:flex items-center gap-4">
                            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
                                Log in
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className="flex items-center justify-center p-2 sm:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="sm:hidden border-t p-4 bg-background">
                    <nav className="flex flex-col gap-4">
                        <Link
                            href="/faq"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-base font-medium"
                        >
                            FAQ
                        </Link>
                        {user && (
                            <>
                                <div className="text-base font-medium text-muted-foreground">
                                    {user.name}
                                </div>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="text-left text-base font-medium text-destructive"
                                >
                                    Log out
                                </button>
                            </>
                        )}
                        {!user && (
                            <Link href="/login" onClick={() => setIsMenuOpen(false)}>Log in</Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
