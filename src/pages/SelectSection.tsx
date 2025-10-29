import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, ArrowRight, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SelectSection = () => {
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        // Auto-redirect to demo if already logged in
        navigate("/demo");
      }
    });
  }, [navigate]);

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
                <p className="text-muted-foreground">Copy these credentials to log in</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      readOnly
                      value={credentials[selectedSection as keyof typeof credentials].email}
                      className="flex-1 px-4 py-3 rounded-lg border bg-muted text-foreground font-mono text-lg"
                    />
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials[selectedSection as keyof typeof credentials].email, "Email")}
                    >
                      {copiedField === "Email" ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Password</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      readOnly
                      value={credentials[selectedSection as keyof typeof credentials].password}
                      className="flex-1 px-4 py-3 rounded-lg border bg-muted text-foreground font-mono text-lg"
                    />
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials[selectedSection as keyof typeof credentials].password, "Password")}
                    >
                      {copiedField === "Password" ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
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
                <Link to="/auth" className="flex-1">
                  <Button size="lg" className="w-full text-lg py-6">
                    Go to Login
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            By: Juan Pablo Rocha, Alan Ayala and Samuel Estrada
          </p>
          <Link to="/" className="text-sm text-primary hover:underline mt-2 inline-block">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SelectSection;
