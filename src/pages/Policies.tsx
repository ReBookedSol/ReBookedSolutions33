import { useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Scale, Mail } from "lucide-react";

const Policies = () => {
  const [activeTab, setActiveTab] = useState("marketplace");

  return (
    <Layout>
      <SEO
        title="Policies & Terms | ReBooked Solutions"
        description="Complete policy documentation for ReBooked Solutions - Privacy Policy, Terms and Conditions, and Marketplace Rules & Responsibilities."
        keywords="policies, terms, privacy, POPIA, consumer protection, ReBooked Solutions"
      />

      <div className="container mx-auto px-4 py-6 sm:py-12 max-w-7xl">
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Platform Policies
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto">
            Complete policy documentation for ReBooked Solutions
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 mt-6 max-w-5xl mx-auto shadow-sm">
            <div className="text-blue-900 text-xs sm:text-sm leading-snug">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <span className="whitespace-nowrap"><strong>Effective Date:</strong> 15 November 2025</span>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap"><strong>Platform:</strong> rebookedsolutions.co.za</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1">
                <span className="whitespace-nowrap"><strong>Operator:</strong> ReBooked Solutions (Pty) Ltd</span>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap break-all"><strong>Support:</strong> legal@rebookedsolutions.co.za</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1">
                <span className="whitespace-nowrap"><strong>Jurisdiction:</strong> Republic of South Africa</span>
              </div>
              <div className="mt-1 text-center">
                <span className="block sm:inline break-words max-w-[62ch] mx-auto">
                  <strong>Regulatory Compliance:</strong> Consumer Protection Act (Act 68 of 2008) • Electronic Communications and Transactions Act (Act 25 of 2002) • Protection of Personal Information Act (Act 4 of 2013)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="mb-8 sm:mb-12">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl">All Policies & Terms</CardTitle>
                <p className="text-gray-600 text-sm">Select a policy to view details</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  <Button
                    onClick={() => setActiveTab("privacy")}
                    variant={activeTab === "privacy" ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-start font-medium px-3 py-2 whitespace-normal break-words text-sm leading-tight min-h-[44px]"
                  >
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-left">Privacy Policy</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("terms")}
                    variant={activeTab === "terms" ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-start font-medium px-3 py-2 whitespace-normal break-words text-sm leading-tight min-h-[44px]"
                  >
                    <Scale className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-left">Terms & Conditions</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("marketplace")}
                    variant={activeTab === "marketplace" ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-start font-medium px-3 py-2 whitespace-normal break-words text-sm leading-tight min-h-[44px]"
                  >
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-left">Marketplace Rules</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Privacy Policy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-6 sm:space-y-8">
              <Card className="shadow-md border-gray-200">
                <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl flex items-center gap-3 mb-3 sm:mb-4 text-gray-800">
                    <Shield className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 flex-shrink-0 text-blue-600" />
                    <span>Privacy Policy</span>
                  </CardTitle>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <div className="text-blue-800 text-xs sm:text-sm space-y-2">
                      <div className="text-center">
                        <span>
                          <strong>Effective Date:</strong> 3 December 2025
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Platform:</strong>{" "}
                          <span className="break-all">
                            www.rebookedsolutions.co.za
                          </span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Operator:</strong> ReBooked Solutions (Pty) Ltd
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Privacy Contact:</strong>{" "}
                          <span className="break-all">
                            legal@rebookedsolutions.co.za
                          </span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Jurisdiction:</strong> Republic of South Africa
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        <strong>Last updated: 3 December 2025</strong>
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions (Pty) Ltd, registration number 2025/452062/07, principal place of business info@rebookedsolutions.co.za, email legal@rebookedsolutions.co.za, processes personal data of persons using the peer-to-peer textbook marketplace Platform (rebookedsolutions.co.za and mobile application).
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions ensures personal data processing complies with the Protection of Personal Information Act 4 of 2013 (POPIA), any applicable legislation, and good practices. Privacy of individuals and data protection is prioritised with measures to secure the Platform.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Read this Privacy Policy with any supplemental notices provided during data collection. It supplements but does not override other notices. By using the Platform, you accept these provisions.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        Definitions
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>User:</strong> Person creating an account or using Platform services.</li>
                        <li><strong>Processing:</strong> Any operation on personal data including collection, storage, use, or transmission.</li>
                        <li><strong>Platform:</strong> Textbook buying/selling environment at rebookedsolutions.co.za and app.</li>
                        <li><strong>Services:</strong> Account management, transaction facilitation, Wallet, and related features per Terms.</li>
                        <li><strong>Terms:</strong> User Agreement accepted to join the Platform.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        1. How Personal Data is Collected
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Personal data is collected via:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>Direct interactions:</strong> When registering, listing textbooks, buying/selling, using Wallet, contacting support at info@rebookedsolutions.co.za, or providing feedback.</li>
                        <li><strong>Automated technologies:</strong> Cookies, server logs, tracking for device info, IP address, browsing patterns, usage data.</li>
                        <li><strong>Third parties:</strong> Payment processors (e.g., BobPay), couriers, analytics providers, banks.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2. Lawful Basis for Processing
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Processing occurs for Platform administration, account creation, transaction mediation under POPIA bases: contract performance, pre-contract steps, legitimate interests (not overriding User rights), legal obligations, or consent where required.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3. Personal Data Collected and Purposes
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Data enables Platform use, services, transactions, payments, communications. Registration may use Google/Facebook/Apple ID (profile name visible to others); optional profile additions like location. Essential data is mandatory for contracts; some for legal compliance; behavioural data for security/fraud prevention.
                      </p>
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2 text-left font-semibold">Processing Operation</th>
                              <th className="border border-gray-300 p-2 text-left font-semibold">Data Category</th>
                              <th className="border border-gray-300 p-2 text-left font-semibold">Purpose</th>
                              <th className="border border-gray-300 p-2 text-left font-semibold">Legal Basis</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-700">
                            <tr>
                              <td className="border border-gray-300 p-2">Account creation/profile</td>
                              <td className="border border-gray-300 p-2">Name, email, phone, profile photo, location, Google/Facebook/Apple ID</td>
                              <td className="border border-gray-300 p-2">Register/manage account</td>
                              <td className="border border-gray-300 p-2">Contract performance</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 p-2">Contact details</td>
                              <td className="border border-gray-300 p-2">Name, phone, email</td>
                              <td className="border border-gray-300 p-2">Service info, billing notifications</td>
                              <td className="border border-gray-300 p-2">Contract performance</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">Income data</td>
                              <td className="border border-gray-300 p-2">Name, birthdate, address, VAT number</td>
                              <td className="border border-gray-300 p-2">Tax reporting to SARS/accountants</td>
                              <td className="border border-gray-300 p-2">Legal obligation</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 p-2">Bank details</td>
                              <td className="border border-gray-300 p-2">Account holder name, number</td>
                              <td className="border border-gray-300 p-2">Payouts for sales</td>
                              <td className="border border-gray-300 p-2">Contract performance</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">Delivery data</td>
                              <td className="border border-gray-300 p-2">Name, phone, address, tracking</td>
                              <td className="border border-gray-300 p-2">Shipping coordination</td>
                              <td className="border border-gray-300 p-2">Contract; Legitimate interests</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 p-2">Service providers</td>
                              <td className="border border-gray-300 p-2">Courier/shipping/payment info</td>
                              <td className="border border-gray-300 p-2">Integration with providers</td>
                              <td className="border border-gray-300 p-2">Contract; Legitimate interests</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">Transaction notifications</td>
                              <td className="border border-gray-300 p-2">Email/push</td>
                              <td className="border border-gray-300 p-2">Order updates, Terms changes</td>
                              <td className="border border-gray-300 p-2">Contract performance</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 p-2">User messaging</td>
                              <td className="border border-gray-300 p-2">Message content, sender name, device info, timestamps</td>
                              <td className="border border-gray-300 p-2">Order fulfilment communication</td>
                              <td className="border border-gray-300 p-2">Contract; Legitimate interests</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">Support</td>
                              <td className="border border-gray-300 p-2">Name, email, usage/transaction data, messages</td>
                              <td className="border border-gray-300 p-2">Handle requests</td>
                              <td className="border border-gray-300 p-2">Contract; Legitimate interests</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 p-2">Disputes</td>
                              <td className="border border-gray-300 p-2">Transaction/User details</td>
                              <td className="border border-gray-300 p-2">Resolve complaints, ensure security</td>
                              <td className="border border-gray-300 p-2">Legitimate interests; Legal obligations</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">Platform activity</td>
                              <td className="border border-gray-300 p-2">Technical usage, feedback</td>
                              <td className="border border-gray-300 p-2">Improve Services</td>
                              <td className="border border-gray-300 p-2">Legitimate interests</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 p-2">Cookies/technical</td>
                              <td className="border border-gray-300 p-2">Device/browser/IP, preferences</td>
                              <td className="border border-gray-300 p-2">Functionality, analytics</td>
                              <td className="border border-gray-300 p-2">Consent</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">Admin/maintenance</td>
                              <td className="border border-gray-300 p-2">Usage/contact data</td>
                              <td className="border border-gray-300 p-2">Protect Platform, reporting</td>
                              <td className="border border-gray-300 p-2">Legitimate interests; Legal obligation</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Aggregated/anonymised data for statistics falls outside POPIA. Users may object to legitimate interest processing. Data used only for original/compatible purposes; unrelated uses notified with basis.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4. Security Data Collection
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Technical tools detect fraud, prohibited items (e.g., counterfeits). Listing data (descriptions, photos) reviewed; shared anonymised with brands for authenticity. Basis: legitimate interest in Platform/User protection.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5. Marketing
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Opt-in for newsletters/marketing via email. Consent-based; withdraw anytime in account settings.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        6. Legal Compliance
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Processing for accounting, authority requests, breach supervision. Basis: legal obligation.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        7. Internal Access
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Needs-based for employees fulfilling roles; limited to partners (e.g., IT, accounting, couriers).
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        8. Data Sharing
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Shared only as necessary:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>Internal:</strong> ReBooked entities as joint controllers/processors.</li>
                        <li><strong>External:</strong> Processors (hosting Vercel/Supabase, payments BobPay/Paystack, couriers); authorities (tax); advisors (lawyers/auditors); merger/acquisition parties.Third parties bound by confidentiality, instructed use only.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        9. International Transfers
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Data may go outside South Africa (e.g., cloud providers). Safeguards: adequate countries or contracts ensuring POPIA-equivalent protection.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        10. Data Security
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        IT/organisational/physical measures: TLS encryption, access controls, monitoring. Platform links to third-party sites (e.g., social media) outside control—review their policies.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        11. Retention Periods
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>Account/activity:</strong> Account lifetime + 7 years post-deletion for legal protection.</li>
                        <li><strong>Accounting:</strong> 5-10 years per law.</li>
                        <li><strong>Cookies:</strong> Up to 3 years.Details on request to legal@rebookedsolutions.co.za.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        12. Data Protection Rights
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Under POPIA (updated regulations):
                      </p>
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2 text-left font-semibold">Right</th>
                              <th className="border border-gray-300 p-2 text-left font-semibold">Description</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-700">
                            <tr>
                              <td className="border border-gray-300 p-2">Access/Awareness</td>
                              <td className="border border-gray-300 p-2">Request confirmation/processing details/copy (Form 2-like, free via email/SMS/WhatsApp).</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 p-2">Correction</td>
                              <td className="border border-gray-300 p-2">Fix incomplete/outdated data.</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">Erasure</td>
                              <td className="border border-gray-300 p-2">Delete if unnecessary/withdrawn consent/rights outweigh.</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 p-2">Restriction</td>
                              <td className="border border-gray-300 p-2">Limit if accuracy contested/no basis but needed for claims.</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">Objection</td>
                              <td className="border border-gray-300 p-2">To legitimate interests/marketing/automated decisions (Form 1-like, multi-channel).</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 p-2">Portability</td>
                              <td className="border border-gray-300 p-2">Structured format for consent/contract data.</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">Withdraw Consent</td>
                              <td className="border border-gray-300 p-2">Anytime, no retroactive effect.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Requests assessed per law/other rights. Proof of identity may be required.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        13. Complaints/Queries
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Contact legal@rebookedsolutions.co.za (response within 1-3 months). Complain to Information Regulator (inforegulator.org.za).
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        14. Children's Privacy
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Not for under-16s without guardian consent; delete if discovered.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        15. Policy Changes
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Updates posted on Platform/email; continued use = acceptance. Keep info current.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        16. Contact
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        ReBooked Solutions (Pty) Ltd, legal@rebookedsolutions.co.za, info@rebookedsolutions.co.za.
                      </p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Terms & Conditions Tab */}
          {activeTab === "terms" && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="shadow-md border-gray-200">
                <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl flex items-center gap-3 mb-3 sm:mb-4 text-gray-800">
                    <Scale className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 flex-shrink-0 text-blue-600" />
                    <span>Terms and Conditions</span>
                  </CardTitle>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <div className="text-blue-800 text-xs sm:text-sm space-y-2">
                      <div className="text-center">
                        <span>
                          <strong>Effective Date:</strong> 3 December 2025
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Platform:</strong>{" "}
                          <span className="break-all">https://www.rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Operator:</strong> ReBooked Solutions (Pty) Ltd
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Registration:</strong> 2025 / 452062 / 07
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Legal Email:</strong>{" "}
                          <span className="break-all">
                            legal@rebookedsolutions.co.za
                          </span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Jurisdiction:</strong> Republic of South Africa
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 py-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        1. About the Company
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>1.1</strong> ReBooked Solutions (Pty) Ltd ("ReBooked Solutions", "we", "our") operates a peer-to-peer marketplace Platform enabling registered users ("Users") to buy and sell textbooks.</li>
                        <li><strong>1.2</strong> Company details: Registration No.: 2025 / 452062 / 07. Principal place of business and contact email: info@rebookedsolutions.co.za. Legal queries to legal@rebookedsolutions.co.za. Support at info@rebookedsolutions.co.za.</li>
                        <li><strong>1.3</strong> Acceptance of these Terms occurs by creating an account, listing an item, purchasing, or continuing use of the Platform.</li>
                        <li><strong>1.4</strong> The terms "User", "Seller", and "Buyer" apply as follows: User = anyone using the Platform; Seller = User listing textbooks; Buyer = User purchasing textbooks. "Wallet" refers to the virtual balance/payment functionality on the Platform.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2. Eligibility and User Accounts
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>2.1</strong> You must be of legal age in South Africa or have parental/guardian consent to use the Platform.</li>
                        <li><strong>2.2</strong> Only one account per person; false identities or multiple accounts are prohibited.</li>
                        <li><strong>2.3</strong> Users are responsible for account security and all actions under their accounts; report suspected misuse to info@rebookedsolutions.co.za immediately.</li>
                        <li><strong>2.4</strong> Users must provide and maintain accurate, current information. The Platform may verify identity if suspicious activity arises.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3. How the Platform Works
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>3.1</strong> ReBooked Solutions acts as a technology facilitator—not as buyer or seller—and does not take ownership of textbooks sold.</li>
                        <li><strong>3.2</strong> Users may list, browse, save favorites, and buy textbooks, but all transactions must occur through, and remain on, the Platform. Direct off-platform transactions initiated via the Platform are prohibited.</li>
                        <li><strong>3.3</strong> ReBooked Solutions acts as a limited payment agent: payments from Buyers are held until transaction completion and then released to Sellers.</li>
                        <li><strong>3.4</strong> Transactions occur in South African Rands (ZAR) by approved payment methods including EFT, card payment, or Wallet balance.</li>
                        <li><strong>3.5</strong> Purchase flow:
                          <ol className="list-decimal pl-6 mt-2 space-y-1 text-gray-700 text-sm sm:text-base">
                            <li>Buyer pays via Platform; funds held by ReBooked Solutions as agent.</li>
                            <li>Seller must commit to sale within 48 hours or order auto-cancels and Buyer refunded.</li>
                            <li>Upon commitment, Seller ships using chosen delivery mode; Buyer confirms receipt.</li>
                            <li>Funds release to Seller's Wallet, with payout to bank within 1-3 business days after confirmation.</li>
                          </ol>
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4. Fees, VAT, and Invoices
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>4.1</strong> Seller commission is 10% of the sale price, deducted upon successful sale completion.</li>
                        <li><strong>4.2</strong> Buyer pays a R20 platform fee per order plus any applicable shipping charges shown at checkout.</li>
                        <li><strong>4.3</strong> Fees are VAT inclusive or exclusive as specified; tax invoices available upon request to accounts@rebookedsolutions.co.za.</li>
                        <li><strong>4.4</strong> Fees may be changed with prior notice; changes apply only to transactions initiated after the effective date.</li>
                        <li><strong>4.5</strong> Users are responsible for their own tax obligations related to sales and purchases.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5. Transaction Security and Acceptable Use
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>5.1</strong> All transaction communications, payments, and deliveries must occur on the Platform using approved methods. Off-platform transactions linked to Platform orders are prohibited and may result in sanctions.</li>
                        <li><strong>5.2</strong> Users must provide accurate descriptions and respond promptly to communications; abusive, harassing, discriminatory, or misleading behavior is prohibited.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        6. Shipping, Delivery, and Risk
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>6.1</strong> Sellers must commit within 48 hours and ship within 60 hours (3 days), unless otherwise stated.</li>
                        <li><strong>6.2</strong> Integrated courier options on the Platform may auto-update shipment status; non-integrated couriers require accurate tracking numbers from Sellers.</li>
                        <li><strong>6.3</strong> Sellers are responsible for safe packaging to avoid damage; ReBooked Solutions is not liable for damages caused by poor packaging.</li>
                        <li><strong>6.4</strong> Risk passes to Buyer upon confirmed delivery by the carrier, supported by tracking or carrier confirmation.</li>
                        <li><strong>6.5</strong> Buyers should confirm receipt within 48 hours; absent confirmation or claims, orders may be auto-completed based on delivery evidence.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        7. Wallet and Payouts
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>7.1</strong> The Wallet is a virtual payment tool, not a bank account; no interest is accrued.</li>
                        <li><strong>7.2</strong> After order completion, funds appear in Seller's Wallet; payouts to South African bank accounts take 1-3 business days, conditional on accurate details.</li>
                        <li><strong>7.3</strong> Sellers bear responsibility for correct bank information; Platform bears no liability for payout delays or misdirection.</li>
                        <li><strong>7.4</strong> Wallet balances dormant for 6 months or longer may be handled per unclaimed funds policies.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        8. Refunds, Cancellations, and Returns
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>8.1</strong> Orders are cancelled and refunded if Seller fails to commit within 48 hours (including fees and shipping).</li>
                        <li><strong>8.2</strong> If delivery cannot be verified or fails, Buyers may request refunds; the Platform may cancel orders under such circumstances.</li>
                        <li><strong>8.3</strong> Claims for "not as described" must be made within 48 hours of delivery with supporting evidence.</li>
                        <li><strong>8.4</strong> Approved returns must be shipped back within 72 hours with tracking; Buyer usually bears return shipping costs unless otherwise required by law.</li>
                        <li><strong>8.5</strong> Funds remain on hold during disputes until resolution, with final outcomes either releasing funds to Seller or refunding Buyer.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        9. Disputes Between Users
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>9.1</strong> Users should first attempt to resolve disputes via Platform messages; the Platform may assist but is not obliged.</li>
                        <li><strong>9.2</strong> Non-response within 48 hours may lead to decisions favoring the responding party.</li>
                        <li><strong>9.3</strong> Buyers may seek external remedies through South African regulators or courts, preserving non-waivable consumer rights under the CPA.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        10. Seller Obligations
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>10.1</strong> Sellers warrant lawful ownership, accurate and complete listings including real photos, proper disclosures (defects, annotations), and correct pricing.</li>
                        <li><strong>10.2</strong> AI-generated or stock images are prohibited.</li>
                        <li><strong>10.3</strong> Sellers must promptly commit to orders and ship within stated SLAs, providing accurate tracking information.</li>
                        <li><strong>10.4</strong> Packaging must be secure; Sellers are liable for loss or damage before delivery confirmation.</li>
                        <li><strong>10.5</strong> Prohibited items include illegal, counterfeit, digital-only, adult, medical, dangerous goods, or any items violating laws. Violations may cause suspension, termination, and reporting.</li>
                        <li><strong>10.6</strong> Sellers must respond to Buyer/Platform communications within 48 hours, aiding dispute resolution.</li>
                        <li><strong>10.7</strong> Compliance with tax, consumer protection, IP, and other laws is Sellers' responsibility.</li>
                        <li><strong>10.8</strong> Bank details must be accurate and updated; funds may be held pending KYC/AML verification.</li>
                        <li><strong>10.9</strong> Off-platform payments or shipments for Platform-initiated orders are prohibited.</li>
                        <li><strong>10.10</strong> Sellers indemnify ReBooked Solutions for claims, losses, costs from listings, sales, misrepresentations, IP infringement, or regulatory violations.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        11. Liability Limits
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>11.1</strong> The Platform does not inspect goods, guarantee quality, or act as a party to sales contracts; sellers and couriers bear responsibility.</li>
                        <li><strong>11.2</strong> Services are provided "as is" with no warranties; statutory consumer rights remain intact.</li>
                        <li><strong>11.3</strong> Liability is limited to the greater of fees paid in the past six months or R1,000. Indirect, consequential, or punitive damages are excluded.</li>
                        <li><strong>11.4</strong> Users bear responsibility for packaging, listing accuracy, compliance, and resolving disputes; Platform is not liable for third party issues or force majeure.</li>
                        <li><strong>11.5</strong> Chargebacks or disputes causing deficits are Users' responsibility; the Platform may offset Wallet balances or delay payouts.</li>
                        <li><strong>11.6</strong> Platform applies reasonable security but is not liable for unauthorized access beyond its control; POPIA protections apply.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        12. Prohibited Items and Conduct
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>12.1</strong> Only textbooks and related study materials are allowed. Prohibited items include counterfeit goods, stolen items, illegal products, digital vouchers, weapons, drugs, and inappropriate content.</li>
                        <li><strong>12.2</strong> Listings must use original photos and accurate descriptions; AI or stock images and misleading info are banned.</li>
                        <li><strong>12.3</strong> Violations lead to removal of listings, account suspension or termination, and potential cooperation with authorities.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        13. Intellectual Property
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>13.1</strong> Platform software, logos, content, and materials are owned/licensed by ReBooked Solutions and protected by IP laws.</li>
                        <li><strong>13.2</strong> Users grant a revocable, royalty-free license for uploaded content to ReBooked Solutions for service provision and promotion.</li>
                        <li><strong>13.3</strong> IP infringement notices should be sent to legal@rebookedsolutions.co.za. Repeat infringers may have content removed and accounts terminated.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        14. Compliance: CPA, ECTA, POPIA, AML/FICA
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>14.1</strong> Non-waivable consumer rights are preserved under the Consumer Protection Act (CPA).</li>
                        <li><strong>14.2</strong> Supplier and transaction info including pricing, payment, delivery, and complaint processes are disclosed per Electronic Communications and Transactions Act (ECTA).</li>
                        <li><strong>14.3</strong> Personal data is processed compliant with POPIA and Privacy Policy; data access requests to info@rebookedsolutions.co.za.</li>
                        <li><strong>14.4</strong> AML and FICA compliance require KYC verification; identity and banking documents may be requested with potential withholding of payments for non-compliance.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        15. Withholding, Chargebacks, and Risk Controls
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>15.1</strong> Payments may be held, delayed, or reversed for suspected fraud, chargebacks, policy breaches, AML, or legal requests.</li>
                        <li><strong>15.2</strong> Users are liable for losses and fees arising from fraud or chargebacks; ReBooked Solutions may seek recovery.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        16. Platform Availability and Security
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>16.1</strong> The Platform may be unavailable due to maintenance or force majeure; ongoing transactions are not affected.</li>
                        <li><strong>16.2</strong> Scraping, reverse engineering, security circumvention, malware introduction, and unauthorized testing are prohibited; monitoring and rate-limiting apply.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        17. Liability and Indemnity
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>17.1</strong> The Platform does not inspect or guarantee listings; courier and User obligations apply.</li>
                        <li><strong>17.2</strong> Liability is limited as described in section 11.</li>
                        <li><strong>17.3</strong> Users indemnify ReBooked Solutions against claims, losses, and expenses arising from their use or violation of Terms including IP infringements or legal breaches.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        18. Suspension and Termination
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>18.1</strong> Accounts may be suspended or terminated for breaches, fraud, prohibited item sales, or repeated disputes.</li>
                        <li><strong>18.2</strong> Pending orders may cancel, and Wallet funds may be held pending dispute or AML reviews. Remaining balances are paid out post-resolution.</li>
                        <li><strong>18.3</strong> User-initiated account closure requires no open orders and zero Wallet balance; records are retained per law.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        19. Force Majeure
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Neither party is liable for delays or failures due to events beyond control including load shedding, strikes, natural disasters, epidemics, or carrier disruptions.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        20. Changes to Terms
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Updates to Terms will be posted on the Platform and/or emailed; continued use after changes constitutes acceptance. Historical versions may be maintained.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        21. General
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>21.1</strong> Governing law is the Republic of South Africa; jurisdiction lies with Magistrates' Courts without excluding High Courts.</li>
                        <li><strong>21.2</strong> Severability applies; invalid provisions do not affect remainder. Waivers must be in writing.</li>
                        <li><strong>21.3</strong> Notices to Users are sent via registered email or in-app messages.</li>
                        <li><strong>21.4</strong> These Terms with referenced policies constitute the entire agreement between Users and ReBooked Solutions.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        22. Security
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>22.1</strong> Technical safeguards include TLS encryption, credential hashing, role-based access, monitoring, and vulnerability management.</li>
                        <li><strong>22.2</strong> Payment card data are processed by PCI DSS-compliant providers with 3D Secure; ReBooked stores only truncated tokens.</li>
                        <li><strong>22.3</strong> Users must protect credentials, use strong passwords, enable MFA, keep devices secure, and report compromises.</li>
                        <li><strong>22.4</strong> Unauthorized security probing, bypassing, scraping, or penetration testing is forbidden and punishable.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        23. Data Protection, POPIA, and Breach Notification
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>23.1</strong> Personal information is processed in compliance with POPIA; privacy inquiries to info@rebookedsolutions.co.za.</li>
                        <li><strong>23.2</strong> Breach notifications are sent to affected Users and the Information Regulator with full cooperation.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        24. Payments, Processors, and Card Data
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>24.1</strong> Authorized payment processors include BobPay and others as disclosed; Users authorize payment processing for purchases, refunds, and chargebacks.</li>
                        <li><strong>24.2</strong> Sensitive card data are handled exclusively by processors; the Platform retains only non-sensitive tokenized info.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        25. Business Continuity and Maintenance
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>25.1</strong> Platform availability is generally maintained; planned and emergency maintenance can cause temporary outages.</li>
                        <li><strong>25.2</strong> Backup and disaster recovery processes exist with timing dependent on incident specifics.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        26. Vulnerability Disclosure
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Security vulnerabilities should be reported to info@rebookedsolutions.co.za. Public disclosure is discouraged until remediation.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        27. User Accounts Detailed Provisions
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>27.1</strong> Users must provide truthful information; false info may cause account actions.</li>
                        <li><strong>27.2</strong> Multiple accounts or attempts to mask identity are forbidden.</li>
                        <li><strong>27.3</strong> Account holders are responsible for all account activity.</li>
                        <li><strong>27.4</strong> Users must immediately report unauthorized access or suspicious activity.</li>
                        <li><strong>27.5</strong> Identity verification may be required if suspicious behavior detected.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        28. Transactions &amp; Payments
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>28.1</strong> All transactions must use the Platform system.</li>
                        <li><strong>28.2</strong> Payments release to Sellers only after Buyer receipt confirmation or verified delivery.</li>
                        <li><strong>28.3</strong> Sellers responsible for providing correct banking details; delays from errors are not Platform liability.</li>
                        <li><strong>28.4</strong> The Platform is not responsible for losses from chargebacks or fraud beyond its control.</li>
                        <li><strong>28.5</strong> International transactions may require additional verification for legal compliance.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        29. Seller and Buyer Responsibilities
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Sellers must: accurately describe items, provide real photos, package securely, and cooperate in returns and disputes.</li>
                        <li>Buyers must: provide accurate delivery info, promptly confirm receipt, report issues quickly, and cooperate with dispute processes.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        30. Prohibited Items
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>30.1</strong> Prohibited: counterfeit goods, illegal substances, weapons, adult content, expired goods, etc.</li>
                        <li><strong>30.2</strong> Violations may lead to removal and account termination without liability.</li>
                        <li><strong>30.3</strong> Sellers of prohibited items risk civil or criminal penalties.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        31. Liability &amp; Disclaimers
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>31.1</strong> The Platform is not responsible for item authenticity, condition, or legality.</li>
                        <li><strong>31.2</strong> Services are provided "as is" without warranties except as required by law.</li>
                        <li><strong>31.3</strong> Platform is not liable for delivery issues, disputes, or losses beyond control.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        32. Intellectual Property
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>32.1</strong> All Platform content is copyrighted/trademarked and owned/licensed by ReBooked Solutions.</li>
                        <li><strong>32.2</strong> Users grant a license for uploaded content for the purpose of service provision and marketing.</li>
                        <li><strong>32.3</strong> Unauthorized copying or modification is prohibited.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        33. Returns &amp; Claims
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>33.1</strong> Buyers may request returns if items differ significantly from descriptions.</li>
                        <li><strong>33.2</strong> Returns must be requested within 48 hours and shipped within 72 hours unless agreed otherwise.</li>
                        <li><strong>33.3</strong> Funds remain held by the Platform during dispute resolution.</li>
                        <li><strong>33.4</strong> Dispute escalation: direct resolution → Platform mediation → external legal action.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        34. Amendments
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>34.1</strong> Terms may be amended by ReBooked Solutions with notification.</li>
                        <li><strong>34.2</strong> Continued use implies acceptance of changes.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        35. Indemnities
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Users indemnify ReBooked Solutions against claims and damages arising from their actions or breaches.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        36. Dispute Resolution
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>36.1</strong> Users and Platform should attempt amicable resolution first.</li>
                        <li><strong>36.2</strong> Mediation by independent experts if negotiation fails.</li>
                        <li><strong>36.3</strong> Arbitration or courts in South Africa as a last resort.</li>
                        <li><strong>36.4</strong> Platform may facilitate but is not obliged to arbitrate legally.</li>
                      </ul>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Marketplace Rules & Responsibilities Tab */}
          {activeTab === "marketplace" && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="shadow-md border-gray-200">
                <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl flex items-center gap-3 mb-3 sm:mb-4 text-gray-800">
                    <Shield className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 flex-shrink-0 text-blue-600" />
                    <span>Marketplace Rules & Responsibilities</span>
                  </CardTitle>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <div className="text-blue-800 text-xs sm:text-sm space-y-2">
                      <div className="text-center">
                        <span>
                          <strong>Effective Date:</strong> 3 December 2025
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Platform:</strong>{" "}
                          <span className="break-all">www.rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Operator:</strong> ReBooked Solutions (Pty) Ltd
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Support:</strong>{" "}
                          <span className="break-all">info@rebookedsolutions.co.za</span>
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Legal:</strong>{" "}
                          <span className="break-all">legal@rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Jurisdiction:</strong> Republic of South Africa
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 py-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        By using the Platform (rebookedsolutions.co.za and mobile application), Users agree to these Marketplace Rules, which form part of the Terms and Conditions. ReBooked Solutions acts solely as a digital intermediary facilitating peer-to-peer textbook transactions between independent Sellers and Buyers. The Platform does not own, inspect, endorse, or guarantee inventory.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        1. Account Registration &amp; Eligibility
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>1.1</strong> Users must register with accurate, truthful, current information; false details may result in suspension or termination.</li>
                        <li><strong>1.2</strong> One account per person; multiple accounts, false identities, or evasion prohibited.</li>
                        <li><strong>1.3</strong> Users bear full responsibility for account security and all activity; report misuse immediately to info@rebookedsolutions.co.za.</li>
                        <li><strong>1.4</strong> Users must have legal capacity under South African law; minors require parental/guardian consent and supervision.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2. Listing &amp; Pricing Rules (Sellers)
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">2.1 Listing Requirements</h4>
                          <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                            <li>Accurate details: title, author, edition, ISBN, condition, defects, annotations, missing pages.</li>
                            <li>Original photos only; AI/stock images prohibited.</li>
                            <li>No misleading, incomplete, or deceptive listings.</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">2.2 Pricing &amp; Fees</h4>
                          <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                            <li>Sellers set prices in ZAR.</li>
                            <li>10% commission deducted from sale price on completion.</li>
                            <li>Buyer pays R20 platform fee + shipping at checkout.</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">2.3 Order Process &amp; Payouts</h4>
                          <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                            <li>Buyer pays via Platform; funds held by ReBooked as limited agent.</li>
                            <li>Seller commits within 48 hours or auto-cancel/refund.</li>
                            <li>Ship via approved methods (e.g., integrated couriers); Buyer confirms receipt.</li>
                            <li>Payouts to Wallet then bank (1-3 business days) post-confirmation.</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2.4 Fine System (Misrepresentation/Non-Compliance)
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-4">
                        Tiered fines protect Buyers and integrity; deducted from Wallet/payouts:
                      </p>
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2 text-left font-semibold">Offense</th>
                              <th className="border border-gray-300 p-2 text-left font-semibold">Refund to Buyer</th>
                              <th className="border border-gray-300 p-2 text-left font-semibold">Seller Penalty</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-700">
                            <tr>
                              <td className="border border-gray-300 p-2">First</td>
                              <td className="border border-gray-300 p-2">Full (incl. fees/shipping)</td>
                              <td className="border border-gray-300 p-2">No payout + delivery fee</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 p-2">Second</td>
                              <td className="border border-gray-300 p-2">Full (incl. fees/shipping)</td>
                              <td className="border border-gray-300 p-2">No payout + delivery fee + R100</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-2">Third</td>
                              <td className="border border-gray-300 p-2">Full (incl. fees/shipping)</td>
                              <td className="border border-gray-300 p-2">No payout + delivery fee + R250 + suspension review</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 p-2">Zero-Tolerance</td>
                              <td className="border border-gray-300 p-2">Full (incl. fees/shipping)</td>
                              <td className="border border-gray-300 p-2">R250+ fee, permanent ban</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Zero-Tolerance: Fraud, counterfeits, scams, system bypass—full refund, R250+ fee, permanent ban.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3. Shipping, Delivery &amp; Risk
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>3.1</strong> Sellers: Commit within 48 hours; ship/present for collection within 60 hours/3 days; secure, appropriate packaging. Seller liable for pre-delivery loss/damage.</li>
                        <li><strong>3.2</strong> Integrated couriers (e.g., Bobgo/The Courier Guy): Auto-tracking; provide accurate numbers for others. Standard: 2-7 business days.</li>
                        <li><strong>3.3</strong> Risk passes on carrier-confirmed delivery. Buyers confirm within 48 hours or auto-complete.</li>
                        <li><strong>3.4</strong> Delays/Failures: Seller error → refund; Buyer issues (wrong address/unclaimed &gt;7 days) → no refund, Buyer pays redelivery.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4. Refunds, Cancellations &amp; Returns
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>4.1</strong> Grounds (within 48 hours delivery): Wrong item, undisclosed defects (missing pages, damage), counterfeits. Evidence required (photos, tracking).</li>
                        <li><strong>4.2</strong> Process: Complaint to legal@rebookedsolutions.co.za; approved returns shipped within 72 hours (Buyer pays unless Seller fault); funds held until resolution. Non-return → possible donation.</li>
                        <li><strong>4.3</strong> Exclusions: Remorse, wear/tear, courier delays.</li>
                        <li><strong>4.4</strong> Cancellations: Buyer pre-commitment; Seller justified only (notify via Platform/legal@rebookedsolutions.co.za). Frequent → penalties/suspension. Refunds: 1-3 business days to original method.</li>
                        <li><strong>4.5</strong> Processing: 7-10 business days post-approval.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5. Buyer Responsibilities
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Accurate delivery info.</li>
                        <li>No post-dispatch cancellations.</li>
                        <li>Prompt acceptance/collection; report issues within 48 hours.</li>
                        <li>Repeated non-compliance/fraud → suspension/ban.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        6. Seller Obligations
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Warrant ownership, authenticity, accurate listings.</li>
                        <li>Respond within 48 hours to Buyers/Platform.</li>
                        <li>Comply with taxes, IP, consumer laws.</li>
                        <li>No off-Platform transactions for initiated orders.</li>
                        <li>Indemnify Platform for breaches.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        7. Prohibited Items &amp; Conduct
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>7.1</strong> Textbooks/study materials only; prohibited: counterfeits, illegal, digital, adult, medical, weapons, drugs.</li>
                        <li><strong>7.2</strong> No harassment, abuse, fraud, scraping, off-Platform solicitation. Violations → removal, suspension, ban, authorities.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        8. Dispute Resolution
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>8.1</strong> Direct via Platform messages first.</li>
                        <li><strong>8.2</strong> Platform mediates; non-response → decision favors responder. Final internally.</li>
                        <li><strong>8.3</strong> External: Consumer Commission/courts; CPA rights preserved.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        9. Liability Limits &amp; Compliance
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li><strong>9.1</strong> Platform not liable for items, disputes, carriers; "as is" services. Liability capped at fees paid (6 months) or R1,000.</li>
                        <li><strong>9.2</strong> Users handle taxes/compliance; POPIA/ECTA/CPA rights intact.</li>
                      </ul>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Policies;
