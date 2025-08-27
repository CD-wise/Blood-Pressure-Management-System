import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Shield, Users, BarChart3, Stethoscope, Clock } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.02]">
      {/* Header */}
      <header className="medical-header sticky top-0 z-50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Accra Technical Clinic</h1>
                <p className="text-sm text-muted-foreground">Blood Pressure Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="outline" className="bg-card/50 hover:bg-card border-border/50">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="bg-primary hover:bg-primary/90 shadow-sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20 shadow-lg">
              <Stethoscope className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Professional Blood Pressure
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}
              Monitoring System
            </span>
          </h1>
          <p className="text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto leading-relaxed">
            Comprehensive healthcare management platform designed for Accra Technical Clinic. Monitor, track, and manage
            blood pressure readings with role-based access for patients, doctors, nurses, and administrators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg">
                Start Monitoring Today
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-card/50 hover:bg-card border-border/50"
              >
                Healthcare Provider Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-muted/30 via-primary/[0.02] to-accent/[0.02]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Comprehensive Healthcare Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Built specifically for healthcare professionals and patients to ensure accurate monitoring and seamless
              care coordination.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="medical-card group hover:scale-[1.02] transition-all duration-300">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl w-fit border border-primary/20 group-hover:border-primary/30 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Role-Based Access</CardTitle>
                <CardDescription className="leading-relaxed">
                  Secure dashboards tailored for patients, doctors, nurses, and administrators with appropriate
                  permissions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="medical-card group hover:scale-[1.02] transition-all duration-300">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl w-fit border border-accent/20 group-hover:border-accent/30 transition-colors">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-foreground">Advanced Analytics</CardTitle>
                <CardDescription className="leading-relaxed">
                  Comprehensive charts and trends to track blood pressure patterns over time with actionable insights.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="medical-card group hover:scale-[1.02] transition-all duration-300">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl w-fit border border-green-500/20 group-hover:border-green-500/30 transition-colors">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-foreground">HIPAA Compliant</CardTitle>
                <CardDescription className="leading-relaxed">
                  Enterprise-grade security with row-level security policies ensuring patient data privacy and
                  compliance.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="medical-card group hover:scale-[1.02] transition-all duration-300">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl w-fit border border-red-500/20 group-hover:border-red-500/30 transition-colors">
                  <Heart className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle className="text-foreground">Real-Time Monitoring</CardTitle>
                <CardDescription className="leading-relaxed">
                  Instant blood pressure reading capture with validation, notes, and location tracking for comprehensive
                  care.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="medical-card group hover:scale-[1.02] transition-all duration-300">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl w-fit border border-orange-500/20 group-hover:border-orange-500/30 transition-colors">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle className="text-foreground">Historical Records</CardTitle>
                <CardDescription className="leading-relaxed">
                  Complete patient history with timestamped readings, healthcare provider notes, and trend analysis.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="medical-card group hover:scale-[1.02] transition-all duration-300">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl w-fit border border-purple-500/20 group-hover:border-purple-500/30 transition-colors">
                  <Stethoscope className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="text-foreground">Clinical Integration</CardTitle>
                <CardDescription className="leading-relaxed">
                  Seamless workflow integration for healthcare providers with patient assignment and care coordination
                  tools.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Ready to Transform Your Healthcare Practice?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Join Accra Technical Clinic's comprehensive blood pressure monitoring system and provide better patient
            care.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg px-8">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="medical-header py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Accra Technical Clinic</span>
          </div>
          <p className="text-muted-foreground">
            Professional healthcare management solutions for better patient outcomes.
          </p>
        </div>
      </footer>
    </div>
  )
}
