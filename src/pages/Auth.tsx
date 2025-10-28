import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, Copy, CheckCircle } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const navigate = useNavigate();
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

  const fillCredentials = (section: number) => {
    setEmail(credentials[section as keyof typeof credentials].email);
    setPassword(credentials[section as keyof typeof credentials].password);
    setDialogOpen(false);
    toast({
      title: "Credentials filled!",
      description: `Section ${section} credentials are ready to use`,
    });
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/demo");
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
      navigate("/demo");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
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
                <Button 
                  className="flex-1"
                  onClick={() => fillCredentials(selectedSection)}
                >
                  Use These Credentials
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to TETR AI Tutor</CardTitle>
          <CardDescription>
            Enter your credentials to access the AI tutor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
