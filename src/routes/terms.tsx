import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, FileText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Lettflix" },
      { name: "description", content: "The terms and conditions governing your use of the Lettflix platform and services." },
      { property: "og:title", content: "Terms of Use — Lettflix" },
      { property: "og:description", content: "The terms and conditions governing your use of the Lettflix platform and services." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://lettflix.com/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://lettflix.com/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
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
          <div className="size-10 rounded-lg bg-accent/10 grid place-items-center">
            <FileText className="size-5 text-accent" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Terms of Use</h1>
        </div>

        <p className="text-sm text-[color:var(--muted-foreground)] mb-10">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="legal-prose">
          <p>
            Welcome to Lettflix. These Terms of Use ("Terms") govern your access to and use of the Lettflix platform, including live television, radio, podcasts, on-demand video, and related services (collectively, the "Services"). By creating an account, accessing, or using Lettflix, you agree to be bound by these Terms.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            If you do not agree to these Terms, you may not use the Services. We may update these Terms from time to time, and continued use of the Services after changes constitutes your acceptance of the revised Terms.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 13 years old to use Lettflix. By registering, you represent that you meet this requirement and that all information you provide is accurate and complete.
          </p>

          <h2>3. Accounts and Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized use or security breach.
          </p>

          <h2>4. Subscriptions and Payments</h2>
          <p>
            Some content and features require a paid subscription. Subscription fees are billed in advance and are non-refundable except where required by law. You may cancel your subscription at any time through your account settings.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Services for unlawful, harmful, or fraudulent purposes.</li>
            <li>Reproduce, distribute, or publicly perform content without authorization.</li>
            <li>Attempt to circumvent content protection, access controls, or regional restrictions.</li>
            <li>Upload or distribute content that infringes the rights of others.</li>
            <li>Interfere with the operation of the platform or other users' enjoyment.</li>
          </ul>

          <h2>6. Creator and Channel Content</h2>
          <p>
            Creators and broadcasters are responsible for the content they upload, stream, or publish through Lettflix. By submitting content, you grant Lettflix a license to host, distribute, and promote that content on the platform.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            All platform branding, software, designs, and original content provided by Lettflix are owned by us or our licensors. These Terms do not grant you any ownership rights in our intellectual property.
          </p>

          <h2>8. Termination</h2>
          <p>
            We may suspend or terminate your account if you violate these Terms or engage in conduct that harms the platform or other users. You may terminate your account at any time through your account settings.
          </p>

          <h2>9. Disclaimers and Limitation of Liability</h2>
          <p>
            The Services are provided "as is" without warranties of any kind. To the fullest extent permitted by law, Lettflix shall not be liable for indirect, incidental, or consequential damages arising from your use of the Services.
          </p>

          <h2>10. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the jurisdiction in which Lettflix operates, without regard to conflict of law principles. Any disputes shall be resolved in the courts of that jurisdiction.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            For questions about these Terms, please contact us at <a href="mailto:legal@lettflix.com">legal@lettflix.com</a>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
