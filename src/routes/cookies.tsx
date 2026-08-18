import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Cookie } from "lucide-react";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookies Notice — Lettflix" },
      { name: "description", content: "Learn how Lettflix uses cookies and similar technologies to enhance your experience." },
      { property: "og:title", content: "Cookies Notice — Lettflix" },
      { property: "og:description", content: "Learn how Lettflix uses cookies and similar technologies to enhance your experience." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://lettflix.com/cookies" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://lettflix.com/cookies" }],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[800px] px-6 py-16 lg:py-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[color:var(--muted-foreground)] hover:text-foreground transition mb-10"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-lg bg-warning/10 grid place-items-center">
            <Cookie className="size-5 text-warning" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Cookies Notice</h1>
        </div>

        <p className="text-sm text-[color:var(--muted-foreground)] mb-10">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="prose prose-invert prose-sm max-w-none">
          <p>
            This Cookies Notice explains how Lettflix uses cookies and similar tracking technologies when you visit or use our platform. By continuing to use Lettflix, you consent to the use of cookies as described in this notice.
          </p>

          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, understand how you interact with content, and improve your overall experience.
          </p>

          <h2>2. How We Use Cookies</h2>
          <p>We use cookies for the following purposes:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> required for the platform to function, such as authentication, security, and session management.</li>
            <li><strong>Preference Cookies:</strong> remember your settings, language, playback preferences, and personalized features.</li>
            <li><strong>Analytics Cookies:</strong> help us understand how visitors use the platform so we can improve performance and content.</li>
            <li><strong>Advertising and Marketing Cookies:</strong> used to deliver relevant promotions and measure the effectiveness of campaigns.</li>
          </ul>

          <h2>3. Third-Party Cookies</h2>
          <p>
            Some cookies may be set by trusted third-party partners who provide services such as analytics, payment processing, and embedded media. These partners are contractually bound to use your data responsibly.
          </p>

          <h2>4. Managing Your Cookie Preferences</h2>
          <p>
            Most browsers allow you to control cookies through their settings. You can choose to block or delete cookies, but doing so may affect the functionality of the platform. For guidance on managing cookies in your browser, visit your browser's help documentation.
          </p>

          <h2>5. Changes to This Notice</h2>
          <p>
            We may update this Cookies Notice from time to time. Any changes will be posted on this page with an updated "Last updated" date.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            If you have questions about our use of cookies, please contact us at <a href="mailto:privacy@lettflix.com" className="text-primary hover:underline">privacy@lettflix.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
