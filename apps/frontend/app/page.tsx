import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Contract Intelligence &<br />
            <span className="text-blue-600">Negotiation Copilot</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-assisted contract redlining, risk analysis, and negotiation platform. 
            Upload contracts, get intelligent redlines, and track obligations automatically.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/dashboard">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Smart Redlining</CardTitle>
              <CardDescription>
                AI-powered contract analysis with playbook-driven positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Upload contracts and get intelligent redlines with rationale, 
                clause matching, and risk scoring in minutes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Analysis</CardTitle>
              <CardDescription>
                Comprehensive risk scoring across legal, privacy, and commercial dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Identify exceptions, compliance issues, and commercial risks 
                with detailed mitigation recommendations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Obligation Tracking</CardTitle>
              <CardDescription>
                Automatic extraction and tracking of contract obligations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Never miss a renewal deadline or compliance requirement. 
                Track all obligations with automated reminders.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to transform your contract workflow?
          </h2>
          <p className="text-gray-600 mb-8">
            Join legal teams, deal desks, and procurement professionals who are already saving time and reducing risk.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">Start Your Free Trial</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
