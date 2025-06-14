import React from 'react'
import { Link } from 'react-router-dom'
import { Mic, Zap, Shield, Globe, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'

export function Home() {
  const { isAuthenticated } = useAuthStore()

  const features = [
    {
      icon: Mic,
      title: "Voice Commands",
      description: "Send money using natural voice commands. Just say 'send 5 dollars to Alice' and we'll handle the rest."
    },
    {
      icon: Zap,
      title: "Instant Payments",
      description: "Powered by Algorand blockchain for fast, secure, and low-cost transactions that settle in seconds."
    },
    {
      icon: Shield,
      title: "Secure Wallet",
      description: "Your private keys are encrypted and stored securely. We never have access to your funds."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Send money anywhere in the world with just your voice. No borders, no limits."
    }
  ]

  const benefits = [
    "Voice-controlled payments",
    "Blockchain security",
    "Instant settlements",
    "Low transaction fees",
    "AI-powered assistance",
    "Mobile-first design"
  ]

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
              <Mic className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Send Money with
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">
              Your Voice
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            VoicePay revolutionizes digital payments with voice-controlled blockchain transactions. 
            Secure, instant, and as simple as speaking.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <Button size="lg" asChild>
              <Link to="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Why Choose VoicePay?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the future of payments with cutting-edge voice technology and blockchain security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 rounded-2xl p-8 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Everything You Need</h2>
            <p className="text-muted-foreground text-lg">
              VoicePay combines the convenience of voice commands with the security 
              and speed of blockchain technology.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
            {!isAuthenticated && (
              <Button size="lg" asChild>
                <Link to="/register">
                  Start Using VoicePay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
          
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary animate-pulse">
                    <Mic className="h-10 w-10 text-primary-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">"Send $20 to Alice"</p>
                  <p className="text-sm text-muted-foreground">
                    Voice command processed instantly
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="text-center space-y-8 bg-primary/5 rounded-2xl p-8 md:p-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of users who are already sending money with their voice. 
              Create your account and get your blockchain wallet in seconds.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/register">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}