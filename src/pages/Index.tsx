import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FeatureCard from "@/components/FeatureCard";
import StepCard from "@/components/StepCard";
import VisitorCounter from "@/components/VisitorCounter";
import CountdownTimer from "@/components/CountdownTimer";
import { 
  Download, 
  Sparkles, 
  MessageCircle, 
  Users, 
  Database,
  ArrowRight,
  GraduationCap,
  Zap,
  UserPlus,
  Copy,
  CheckCircle
} from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const credentials = {
    1: { email: "student1@tetr.com", password: "TetrStudent1!" },
    2: { email: "student2@tetr.com", password: "TetrStudent2!" },
    3: { email: "student3@tetr.com", password: "TetrStudent3!" },
    4: { email: "student4@tetr.com", password: "TetrStudent4!" },
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Get Credentials Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="fixed bottom-6 right-6 z-50 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            size="lg"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Click here to get your user!
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Get Your Credentials</DialogTitle>
            <DialogDescription>
              Select your section to receive your login credentials
            </DialogDescription>
          </DialogHeader>
          
          {!selectedSection ? (
            <div className="space-y-4 pt-4">
              <p className="text-lg font-semibold text-center">Which section are you on?</p>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((section) => (
                  <Button
                    key={section}
                    size="lg"
                    variant="outline"
                    className="h-20 text-2xl font-bold hover:bg-primary hover:text-primary-foreground transition-all"
                    onClick={() => setSelectedSection(section)}
                  >
                    Section {section}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Section {selectedSection}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Email</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={credentials[selectedSection as keyof typeof credentials].email}
                      className="flex-1 px-4 py-2 rounded-md border bg-muted text-foreground font-mono"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials[selectedSection as keyof typeof credentials].email, "Email")}
                    >
                      {copiedField === "Email" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Password</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={credentials[selectedSection as keyof typeof credentials].password}
                      className="flex-1 px-4 py-2 rounded-md border bg-muted text-foreground font-mono"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials[selectedSection as keyof typeof credentials].password, "Password")}
                    >
                      {copiedField === "Password" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedSection(null)}
                >
                  Choose Different Section
                </Button>
                <Link to="/auth" className="flex-1">
                  <Button className="w-full" onClick={() => setDialogOpen(false)}>
                    Go to Login
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-subtle)]" />
        
        <div className="relative container mx-auto px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 animate-pulse">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Only for TETR Students</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight">
                A TETR Way to Study
              </h1>
              
              <p className="text-lg text-muted-foreground">
                By: Juan Pablo Rocha, Alan Ayala and Samuel Estrada
              </p>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                Transform hours of lecture recordings into an AI tutor that knows everything from your classes. Ask questions, get summaries, and study smarter—all powered by your actual course content.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button 
                    size="lg" 
                    className="text-lg px-10 py-7 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-[var(--shadow-hover)] font-semibold"
                  >
                    Start Learning Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-col gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>Free to Start</span>
                </div>
                <VisitorCounter />
                <CountdownTimer />
              </div>
            </div>
            
            <div className="relative animate-fade-in-delay group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-primary/10 rounded-3xl blur-3xl group-hover:blur-2xl transition-all" />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-2xl" />
              <img 
                src={heroBanner} 
                alt="AI Tutor Interface" 
                className="relative rounded-2xl shadow-2xl w-full border border-primary/20 transition-transform group-hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="text-sm font-semibold text-primary">Built for TETR Students</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Study Smarter, Not Harder
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We understand the challenges you face. Here's how we help:
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { pain: "Hours wasted scrubbing through recordings", solved: "Instant answers from your AI tutor" },
              { pain: "Messy transcripts impossible to study from", solved: "Clean, organized course materials" },
              { pain: "Can't remember everything from lectures", solved: "Your entire semester in one chatbot" },
              { pain: "Studying alone with no help", solved: "24/7 AI teaching assistant" }
            ].map((item, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-primary/10 shadow-sm hover:shadow-[var(--shadow-soft)] hover:border-primary/30 transition-all group">
                <p className="text-muted-foreground leading-relaxed mb-3 line-through text-sm">"{item.pain}"</p>
                <p className="text-primary font-semibold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                  {item.solved}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Powered by Advanced AI</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your complete AI-powered learning platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <FeatureCard
              icon={MessageCircle}
              title="Intelligent Q&A Chatbot"
              description="Ask anything about your lectures. The AI has processed all content and gives instant, accurate answers with sources."
              benefit="Stop scrubbing through videos—get answers instantly"
            />
            
            <FeatureCard
              icon={Database}
              title="Centralized Knowledge Hub"
              description="All course materials are processed and stored in a searchable knowledge base from your actual lectures."
              benefit="Your ultimate study partner for the entire semester"
            />
            
            <FeatureCard
              icon={GraduationCap}
              title="Exam Preparation Assistant"
              description="Generate summaries, practice questions, and topic reviews from your lectures to ace your exams."
              benefit="Prepare effectively with AI-generated study materials"
            />
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary opacity-5" />
        
        <div className="relative container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-semibold text-primary">Only for TETR Students</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-foreground">
              Start Learning Smarter Today
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your AI tutor is ready. No setup required, no credit card needed. Jump straight into your course materials and start asking questions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link to="/demo">
                <Button 
                  size="lg" 
                  className="text-lg px-12 py-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-[var(--shadow-hover)] font-bold text-xl"
                >
                  Launch AI Tutor
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground pt-4">
              ✓ Free to start  •  ✓ All TETR courses available  •  ✓ Instant access
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="text-primary font-bold">
                A TETR Way to Study
              </span>
            </div>
            
            <p className="text-muted-foreground text-center">
              © 2025 A TETR Way to Study. Built for TETR College of Business students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
