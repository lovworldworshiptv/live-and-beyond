import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, Shield } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Lettflix" },
      { name: "description", content: "Learn how Lettflix collects, uses, and protects your personal information." },
      { property: "og:title", content: "Privacy Policy — Lettflix" },
      { property: "og:description", content: "Learn how Lettflix collects, uses, and protects your personal information." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://lettflix.com/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://lettflix.com/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-[800px] px-6 pt-10 pb-4 lg:pt-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[color:var(--muted-foreground)] hover:text-foreground transition mb-10"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-lg bg-primary/10 grid place-items-center">
            <Shield className="size-5 text-primary" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Privacy Policy</h1>
        </div>

        <p className="text-sm text-[color:var(--muted-foreground)] mb-10">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="legal-prose">
          <p>
            Lettflix ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and safeguard your personal information when you use the Lettflix platform, including our website, applications, streaming services, and related features.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect the following types of information to provide and improve our services:</p>
          <ul>
            <li><strong>Account Information:</strong> name, email address, password, profile picture, and account preferences.</li>
            <li><strong>Usage Data:</strong> viewing history, search queries, watchlists, interactions with channels and content, and device information.</li>
            <li><strong>Payment Information:</strong> billing details processed securely through our payment partners.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, operating system, and cookies or similar technologies.</li>
            <li><strong>Creator/Channel Data:</strong> channel details, uploaded content, analytics, and verification documents submitted by creators.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Deliver personalized content recommendations and streaming experiences.</li>
            <li>Process subscriptions, payments, and account management.</li>
            <li>Communicate updates, security alerts, and promotional offers.</li>
            <li>Maintain platform security, prevent fraud, and enforce our Terms of Use.</li>
            <li>Support creators and broadcasters with analytics and channel management tools.</li>
          </ul>

          <h2>3. Sharing Your Information</h2>
          <p>
            We do not sell your personal information. We may share information with trusted service providers (such as cloud hosting, payment processing, and analytics partners) solely to operate the platform, and only under strict confidentiality obligations.
          </p>

          <h2>4. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to remember your preferences, analyze traffic, and improve our services. For more details, please see our <Link to="/cookies">Cookies Notice</Link>.
          </p>

          <h2>5. Your Rights and Choices</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access, update, or delete your personal information.</li>
            <li>Opt out of marketing communications.</li>
            <li>Manage cookie preferences through your browser settings.</li>
            <li>Request a copy of the data we hold about you.</li>
          </ul>
          <p>To exercise these rights, contact us using the information provided below.</p>

          <h2>6. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your information, including encryption, access controls, and regular security reviews. However, no system is completely secure, and we cannot guarantee absolute security.
          </p>

          <h2>7. Children's Privacy</h2>
          <p>
            Lettflix is not directed to children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.
          </p>

          <h2>8. International Transfers</h2>
          <p>
            Your information may be stored and processed in countries other than your own. By using Lettflix, you consent to such transfers in accordance with this policy.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the updated policy on our website and updating the "Last updated" date.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or your data, please contact us at <a href="mailto:privacy@lettflix.com">privacy@lettflix.com</a>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
