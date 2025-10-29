import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SelectSection = () => {
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const navigate = useNavigate();

  const credentials = {
    1: { email: "student1@tetr.com", password: "TetrStudent1!" },
    2: { email: "student2@tetr.com", password: "TetrStudent2!" },
    3: { email: "student3@tetr.com", password: "TetrStudent3!" },
    4: { email: "student4@tetr.com", password: "TetrStudent4!" },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <GraduationCap className="w-12 h-12 text-primary" />
            <h1 className="text-4xl font-bold">A TETR Way to Study</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Select your section to get started
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-card border rounded-2xl shadow-lg p-8">
          {!selectedSection ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Which section are you in?</h2>
                <p className="text-muted-foreground">Choose your section to receive your login credentials</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[1, 2, 3, 4].map((section) => (
                  <Button
                    key={section}
                    size="lg"
                    variant="outline"
                    className="h-24 text-3xl font-bold hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
                    onClick={() => setSelectedSection(section)}
                  >
                    Section {section}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold text-primary">Section {selectedSection}</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Your Login Credentials</h2>
                <p className="text-muted-foreground">Click on "Go to Login" to automatically use them</p>
              </div>

              <div className="space-y-5 bg-muted/50 p-6 rounded-xl">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
                  <div className="px-4 py-3 rounded-lg border bg-background text-foreground font-mono text-lg">
                    {credentials[selectedSection as keyof typeof credentials].email}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Password</label>
                  <div className="px-4 py-3 rounded-lg border bg-background text-foreground font-mono text-lg">
                    {credentials[selectedSection as keyof typeof credentials].password}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setSelectedSection(null)}
                >
                  Choose Different Section
                </Button>
                <Button 
                  size="lg" 
                  className="w-full text-lg py-6 flex-1"
                  onClick={() => navigate('/auth', { 
                    state: { 
                      email: credentials[selectedSection as keyof typeof credentials].email,
                      password: credentials[selectedSection as keyof typeof credentials].password
                    }
                  })}
                >
                  Go to Login
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            By: Juan Pablo Rocha, Alan Ayala and Samuel Estrada
          </p>
          <button 
            onClick={() => navigate('/')}
            className="text-sm text-primary hover:underline mt-2 inline-block"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectSection;
