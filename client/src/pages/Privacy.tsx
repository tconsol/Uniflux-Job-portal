import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase } from 'lucide-react';

const LAST_UPDATED = 'June 10, 2026';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: `We collect the following types of information when you use Uniflux:

• Account Information: Your name, email address, and password (hashed) when you register. If you sign in with Google, we receive your name, email, and Google profile picture.

• Usage Data: Pages visited, jobs viewed, jobs applied to, filters used, and session duration — collected to improve our service.

• Payment Information: When you subscribe to a paid plan, payment is processed by Razorpay. Uniflux does not store your card details; we only receive a payment confirmation and transaction ID from Razorpay.

• Device & Technical Data: IP address, browser type, device type, and operating system — collected automatically via server logs.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use your information to:

• Provide, operate, and maintain the Uniflux platform
• Authenticate your identity and secure your account
• Process subscription payments and manage plan access
• Track your job applications and apply limit usage
• Send transactional emails (OTP verification, password reset, account notices)
• Improve platform features based on aggregate usage patterns
• Comply with legal obligations`,
  },
  {
    title: '3. Information We Do Not Collect or Share',
    content: `Uniflux does not:

• Sell your personal data to third parties
• Share your information with employers or job platforms
• Use your data for advertising or marketing to third parties
• Store sensitive documents such as resumes or cover letters (unless explicitly added by you in future features)
• Track you across other websites`,
  },
  {
    title: '4. Job Application Data',
    content: `When you apply to a job through Uniflux, we record the job ID, title, company, and the timestamp of your application for tracking purposes. Clicking "Apply" redirects you to the employer's external platform. Any information you submit to that platform is governed by their own privacy policy. Uniflux has no visibility into or control over data submitted to third-party employers.`,
  },
  {
    title: '5. Cookies & Local Storage',
    content: `Uniflux uses browser localStorage to store authentication tokens (JWT) for session management. We do not use advertising cookies or third-party tracking cookies. We may use essential session cookies required for the platform to function. You can clear localStorage via your browser settings, which will log you out of the platform.`,
  },
  {
    title: '6. Data Retention',
    content: `We retain your account data for as long as your account is active. If you delete your account, we remove your personal information, subscription records, and application history within 30 days, except where retention is required by law. Anonymized aggregate data may be retained indefinitely for analytics purposes.`,
  },
  {
    title: '7. Data Security',
    content: `We implement industry-standard security measures to protect your information, including:

• Passwords stored as bcrypt hashes (never in plain text)
• JWT-based authentication with short-lived access tokens and refresh token rotation
• HTTPS encryption for all data in transit
• OTP-based email verification for account creation and password resets

No method of transmission over the internet is 100% secure. We cannot guarantee absolute security, but we continuously work to protect your data.`,
  },
  {
    title: '8. Third-Party Services',
    content: `Uniflux integrates with the following third-party services:

• Google OAuth — for social login (governed by Google's Privacy Policy)
• Razorpay — for payment processing (governed by Razorpay's Privacy Policy)
• Job Marketplace API — for sourcing job listings (publicly available data only)

These services have their own privacy policies and we encourage you to review them.`,
  },
  {
    title: '9. Children\'s Privacy',
    content: `Uniflux is not intended for children under the age of 16. We do not knowingly collect personal information from children. If we become aware that a child under 16 has provided us with personal information, we will take steps to delete such information promptly.`,
  },
  {
    title: '10. Your Rights',
    content: `Depending on your location, you may have the following rights regarding your personal data:

• Access: Request a copy of the personal data we hold about you
• Correction: Request correction of inaccurate or incomplete data
• Deletion: Request deletion of your personal data (right to be forgotten)
• Portability: Request your data in a portable format
• Objection: Object to processing of your data for certain purposes

To exercise any of these rights, contact us at privacy@uniflux.com. We will respond within 30 days.`,
  },
  {
    title: '11. Changes to This Policy',
    content: `We may update this Privacy Policy periodically. When we make material changes, we will notify you via email or a prominent notice on the platform. Your continued use of the Service after the changes take effect constitutes your acceptance of the revised policy.`,
  },
  {
    title: '12. Contact Us',
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:

Email: privacy@uniflux.com
Address: Uniflux, Hyderabad, Telangana, India`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Uniflux</span>
          </Link>
          <Link to="/register" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Intro */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 mb-8">
          <p className="text-brand-900 text-sm leading-relaxed">
            At Uniflux, we take your privacy seriously. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our job search and application tracking platform.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map(({ title, content }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-3">{title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{content}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-400 text-sm mb-4">
            By using Uniflux, you acknowledge that you have read and understood this Privacy Policy.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/terms" className="text-brand-600 hover:text-brand-700 text-sm font-medium">Terms & Conditions</Link>
            <span className="text-gray-300">|</span>
            <Link to="/register" className="text-brand-600 hover:text-brand-700 text-sm font-medium">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
