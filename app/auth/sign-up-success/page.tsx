import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, Stethoscope } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Stethoscope className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Accra Technical Clinic</h1>
            <p className="text-muted-foreground">Blood Pressure Monitoring System</p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Access Request Submitted</CardTitle>
              <CardDescription>Your request has been successfully submitted and is under review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Check Your Email</h3>
                    <p className="text-sm text-muted-foreground">
                      We've sent a confirmation email to verify your email address. Please check your inbox and click
                      the verification link.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">What happens next?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your access request will be reviewed by our administrators</li>
                  <li>• You'll receive an email notification once approved</li>
                  <li>• After approval, you can sign in with your credentials</li>
                  <li>• Review typically takes 1-2 business days</li>
                </ul>
              </div>

              <div className="pt-4 space-y-3">
                <Link href="/auth/login">
                  <Button className="w-full">Try Signing In</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full bg-transparent">
                    Return to Homepage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
