"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { HeroLanding } from "@/components/ui/hero-1";

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/trending");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <HeroLanding
      logo={{
        src: "https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=blue&shade=600",
        alt: "TrendForge Logo",
        companyName: "TrendForge",
      }}
      navigation={[
        { name: "Trending", href: "/trending" },
        { name: "Features", href: "#features" },
        { name: "How It Works", href: "#how-it-works" },
      ]}
      loginText="Log in"
      loginHref="/login"
      announcementBanner={{
        text: "Live trending topics updated every hour.",
        linkText: "See what’s hot right now",
        linkHref: "/trending",
      }}
      title="Turn Trending Topics Into Viral Content"
      description="TrendForge reads what’s trending in India right now and auto-generates YouTube scripts, AI thumbnails, and full blog posts — in seconds."
      callToActions={[
        { text: "Get Started — Free", href: "/register", variant: "primary" },
        { text: "Learn more", href: "#how-it-works", variant: "secondary" },
      ]}
      titleSize="large"
      gradientColors={{
        from: "oklch(0.623 0.214 259.815)",
        to: "oklch(0.488 0.243 264.376)",
      }}
      className="min-h-screen"
    />
  );
}
