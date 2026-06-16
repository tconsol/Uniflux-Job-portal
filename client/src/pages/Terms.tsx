import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase } from 'lucide-react';

const LAST_UPDATED = 'June 10, 2026';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By creating an account or using the Jobwalkers platform ("Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, do not use the Service. These terms apply to all visitors, users, and others who access the Service.`,
  },
  {
    title: '2. Description of Service',
    content: `Jobwalkers is a job aggregation and application tracking platform that collects publicly available job listings from third-party sources including but not limited to Indeed, LinkedIn, Glassdoor, ZipRecruiter, and Google Jobs. Jobwalkers does not guarantee the accuracy, completeness, or availability of any job listing sourced from third-party platforms.`,
  },
  {
    title: '3. User Accounts',
    content: `You must provide accurate and complete information when registering. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately at support@Jobwalkers.com of any unauthorized use of your account. Jobwalkers will not be liable for any loss resulting from unauthorized use of your account.`,
  },
  {
    title: '4. Subscription Plans & Billing',
    content: `Jobwalkers offers a free plan and paid subscription plans (Standard, Premium, Elite). Paid plans are billed in advance on a monthly basis in USD. All payments are processed securely via Razorpay. Subscriptions are non-refundable except as required by applicable law. You may cancel your subscription at any time; access continues until the end of the current billing period. Downgrading to a lower plan is restricted until the current plan expires.`,
  },
  {
    title: '5. Apply Limits',
    content: `Each plan includes a defined number of job applications ("apply limit") per billing period. Apply limits reset at the start of each new billing period. The free plan includes a limited number of applies as defined on the Plans page. Unused applies do not roll over to the next period. Jobwalkers reserves the right to modify apply limits with reasonable notice.`,
  },
  {
    title: '6. Prohibited Conduct',
    content: `You agree not to: (a) use the Service for any unlawful purpose; (b) scrape, crawl, or harvest data from the Service using automated means; (c) impersonate any person or entity; (d) attempt to gain unauthorized access to any part of the Service; (e) transmit viruses, malware, or harmful code; (f) interfere with or disrupt the integrity or performance of the Service; (g) use the Service to spam or send unsolicited communications.`,
  },
  {
    title: '7. Third-Party Job Listings',
    content: `Job listings displayed on Jobwalkers are sourced from third-party platforms. Jobwalkers does not endorse, verify, or guarantee any employer, job listing, or hiring outcome. When you click "Apply" you are redirected to the original job listing on the respective third-party platform. Your interaction with that platform is governed by their own terms. Jobwalkers is not responsible for the hiring decisions, practices, or actions of any employer.`,
  },
  {
    title: '8. Intellectual Property',
    content: `All content, design, logos, trademarks, and software on the Jobwalkers platform are owned by or licensed to Jobwalkers and are protected by applicable intellectual property laws. You may not copy, reproduce, distribute, or create derivative works without express written permission from Jobwalkers.`,
  },
  {
    title: '9. Disclaimer of Warranties',
    content: `The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. Jobwalkers does not warrant that the Service will be uninterrupted, error-free, or free of viruses. We do not guarantee that any job listing will lead to employment. Your use of the Service is at your own risk.`,
  },
  {
    title: '10. Limitation of Liability',
    content: `To the maximum extent permitted by applicable law, Jobwalkers and its affiliates, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability to you for any claim arising out of or relating to these Terms shall not exceed the amount you paid to Jobwalkers in the twelve months preceding the claim.`,
  },
  {
    title: '11. Privacy',
    content: `Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your information as described in our Privacy Policy.`,
  },
  {
    title: '12. Account Termination',
    content: `Jobwalkers reserves the right to suspend or terminate your account at its discretion, with or without notice, for conduct that violates these Terms or is harmful to other users, Jobwalkers, or third parties. Upon termination, your right to use the Service immediately ceases. You may delete your account at any time from your profile settings.`,
  },
  {
    title: '13. Changes to Terms',
    content: `We may update these Terms from time to time. We will notify you of significant changes by posting a notice on the platform or emailing your registered address. Your continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.`,
  },
  {
    title: '14. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Hyderabad, Telangana, India.`,
  },
  {
    title: '15. Contact',
    content: `If you have any questions about these Terms, please contact us at support@Jobwalkers.com.`,
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Jobwalkers</span>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Intro */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 mb-8">
          <p className="text-brand-900 text-sm leading-relaxed">
            Please read these Terms and Conditions carefully before using the Jobwalkers platform. These terms constitute a legally binding agreement between you and Jobwalkers regarding your use of our job search and application tracking services.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map(({ title, content }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-3">{title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{content}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-400 text-sm mb-4">
            By using Jobwalkers, you acknowledge that you have read, understood, and agree to these Terms and Conditions.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/privacy" className="text-brand-600 hover:text-brand-700 text-sm font-medium">Privacy Policy</Link>
            <span className="text-gray-300">|</span>
            <Link to="/register" className="text-brand-600 hover:text-brand-700 text-sm font-medium">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
