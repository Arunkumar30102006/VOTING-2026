import { Link } from "react-router-dom";
import { Vote, Shield, Lock, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 text-foreground transition-colors duration-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Vote className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold">E-Vote India</h2>
                <p className="text-xs text-muted-foreground">Secure Shareholder Voting</p>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              ShareholderVoting.in is a digital platform for corporate governance.
              We are a private technology provider enabling secure electronic voting.
            </p>
            <div className="bg-background/5 border border-white/10 p-3 rounded-lg">
              <p className="text-[10px] text-muted-foreground leading-tight">
                <strong>DISCLAIMER:</strong> This is a prototype/demo platform. Not affiliated with NSDL, CDSL, or SEBI.
                Voting results on this platform are for demonstration of technology capabilities only.
              </p>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-accent" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-4 h-4 text-accent" />
                <span>SEBI Compliant</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {["Home", "About Us", "Security", "Contact Us", "Company Registration", "Shareholder Login", "How It Works"].map((item, index) => {
                const paths = ["/", "/about", "/security", "/contact", "/company-register", "/shareholder-login", "/#how-it-works"];
                return (
                  <li key={item}>
                    <Link to={paths[index]} className="text-sm text-foreground/80 hover:text-secondary transition-colors">
                      {item}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-3">
              {["Privacy Policy", "Terms of Service", "SEBI Compliance", "Data Protection"].map((item, index) => {
                const paths = ["/privacy-policy", "/terms-of-service", "/sebi-compliance", "/data-protection"];
                return (
                  <li key={item}>
                    <Link to={paths[index]} className="text-sm text-foreground/80 hover:text-secondary transition-colors">
                      {item}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <Mail className="w-4 h-4 text-secondary" />
                <span>support@shareholdervoting.in</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <Mail className="w-4 h-4 text-secondary" />
                <span>admin@shareholdervoting.in</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-foreground/80">
                <Phone className="w-4 h-4 text-secondary" />
                <span>+91-987654321</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-foreground/80">
                <MapPin className="w-4 h-4 text-secondary mt-0.5" />
                <span>Registered in India<br />Operated by: VoteTech Solutions Pvt Ltd (Proposed)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 ShareholderVoting.in. All rights reserved.</p>
            <p>Secure. Transparent. Reliable.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
