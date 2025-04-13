'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Gift, Heart, Users, CreditCard, TrendingUp, CheckCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/5"></div>
        
        <div className="container relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 animate-slide-down">
                Create Your Perfect <span className="gradient-heading">Gift Registry</span>
              </h1>
              
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 animate-slide-up">
                Share your wishlist with loved ones, track contributions, and make gift-giving a delightful experience.
              </p>
              
              <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="animate-fade-in button-glow">
                  <Link href="/login">
                    Get Started
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <Link href="/find-registry">
                    Find Registry
                  </Link>
                </Button>
              </div>
              
              <div className="mt-12 flex flex-wrap gap-6 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Easy sharing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Group gifting</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-xl opacity-50"></div>
              <div className="relative bg-card rounded-xl border shadow-xl overflow-hidden">
                <img 
                  src="/images/hero-mockup.png" 
                  alt="Gift Registry Platform Screenshot" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform makes it easy to create and manage gift registries for any occasion
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Custom Registries</h3>
              <p className="text-muted-foreground">Create personalized registries for weddings, baby showers, birthdays and more</p>
            </div>
            
            <div className="feature-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Group Gifting</h3>
              <p className="text-muted-foreground">Allow friends to contribute any amount toward higher-priced items</p>
            </div>
            
            <div className="feature-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Wish Lists</h3>
              <p className="text-muted-foreground">Add items from any store or create custom gift ideas</p>
            </div>
            
            <div className="feature-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
              <p className="text-muted-foreground">Securely process contributions with our integrated payment system</p>
            </div>
            
            <div className="feature-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
              <p className="text-muted-foreground">Track contributions and monitor your registry's performance</p>
            </div>
            
            <div className="feature-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Thank You Tracking</h3>
              <p className="text-muted-foreground">Keep track of gifts received and manage your thank-you notes</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials/CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5"></div>
        
        <div className="container relative z-10">
          <div className="glass-card p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Your Registry Today</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
              Join thousands of others who have created beautiful gift registries for their special occasions
            </p>
            
            <Button asChild size="lg" className="button-glow">
              <Link href="/login">
                Create Free Registry
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
} 