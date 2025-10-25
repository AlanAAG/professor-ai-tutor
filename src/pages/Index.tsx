import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/FeatureCard";
import StepCard from "@/components/StepCard";
import { 
  Download, 
  Sparkles, 
  MessageCircle, 
  Users, 
  Database,
  ArrowRight,
  GraduationCap,
  Zap
} from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-subtle)]" />
        
        <div className="relative container mx-auto px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-primary/20">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-secondary-foreground">Powered by Advanced AI</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight">
                <span className="text-primary">A TETR Way</span> to Study
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                Stop scrubbing through hours of recordings. A TETR Way to Study automatically transforms your lecture recordings into an intelligent, personalized AI tutor.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/demo">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-[var(--shadow-soft)]"
                  >
                    See a Live Demo
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 border-2"
                >
                  Get Early Access
                </Button>
              </div>
            </div>
            
            <div className="relative animate-fade-in-delay">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <img 
                src={heroBanner} 
                alt="AI Tutor Interface" 
                className="relative rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Study Smarter, Not Harder
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We understand the challenges TETR students face. Here's what we solve:
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              "Watching hours of recordings to find one topic wastes precious time",
              "Messy transcripts are impossible to study from effectively",
              "Reviewing entire lectures for quick clarifications is inefficient",
              "Tracking information across multiple classes is overwhelming"
            ].map((pain, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-destructive/20 shadow-sm">
                <p className="text-foreground leading-relaxed">"{pain}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Intelligent Features, Real Benefits
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Powered by cutting-edge AI to revolutionize how you learn
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <FeatureCard
              icon={Download}
              title="Automated Transcript Harvesting"
              description="The agent automatically logs into your university portal and downloads all your class transcripts. Zero manual work required."
              benefit="Save hours of manual work and never miss a lecture"
            />
            
            <FeatureCard
              icon={Sparkles}
              title="AI-Powered Cleaning & Refining"
              description="Advanced AI models like Google's Gemini transform messy raw text into perfectly structured, readable study notes."
              benefit="Get crystal-clear, accurate materials to study from"
            />
            
            <FeatureCard
              icon={MessageCircle}
              title="Intelligent Q&A Chatbot"
              description="Ask anything about your lectures. The AI has processed all content and gives instant, accurate answers with sources."
              benefit="Stop scrubbing through videos—get answers instantly"
            />
            
            <FeatureCard
              icon={Users}
              title="Professor Personas"
              description="The AI adopts the personality and teaching style of your actual professor for each specific course."
              benefit="A familiar, personalized learning experience"
            />
            
            <FeatureCard
              icon={Database}
              title="Centralized Knowledge Hub"
              description="All course materials are processed and stored in a vector database, creating a powerful searchable knowledge base."
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

      {/* How It Works Section */}
      <section className="py-20 bg-[var(--gradient-subtle)]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Three simple steps to transform your learning experience
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-16 max-w-6xl mx-auto relative">
            <StepCard
              number="1"
              title="Harvest"
              description="The agent logs into your university portal and automatically gathers all available lecture recording transcripts."
            />
            
            <StepCard
              number="2"
              title="Refine"
              description="Raw text is cleaned, formatted, and enriched using our AI pipeline, then stored as intelligent, searchable data."
            />
            
            <StepCard
              number="3"
              title="Chat"
              description="Interact with your AI Tutor through a simple chat interface to ask questions, get summaries, and clarify concepts from any lecture."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary opacity-5" />
        
        <div className="relative container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl lg:text-6xl font-bold text-foreground">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join the future of education. Get instant access to your lectures, personalized to your learning style.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/demo">
                <Button 
                  size="lg" 
                  className="text-lg px-10 py-7 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-[var(--shadow-hover)]"
                >
                  See a Live Demo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-10 py-7 border-2"
              >
                Get Early Access
              </Button>
            </div>
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
