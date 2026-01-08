import { Link } from "react-router-dom";
import { Vote, Shield, Lock, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground dark:bg-background dark:text-foreground dark:border-t dark:border-border transition-colors duration-300">
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
                <p className="text-xs text-primary-foreground/70 dark:text-muted-foreground">Secure Shareholder Voting</p>
              </div>
            </Link>
            <p className="text-sm text-primary-foreground/80 dark:text-muted-foreground leading-relaxed">
              India's most trusted e-voting platform for shareholder meetings.
              Secure, transparent, and compliant with SEBI regulations.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-xs text-primary-foreground/70 dark:text-muted-foreground">
                <Shield className="w-4 h-4 text-accent" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-primary-foreground/70 dark:text-muted-foreground">
                <Lock className="w-4 h-4 text-accent" />
                <span>SEBI Compliant</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-primary-foreground/80 hover:text-secondary dark:text-muted-foreground dark:hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/company-register" className="text-sm text-primary-foreground/80 hover:text-secondary dark:text-muted-foreground dark:hover:text-primary transition-colors">
                  Company Registration
                </Link>
              </li>
              <li>
                <Link to="/shareholder-login" className="text-sm text-primary-foreground/80 hover:text-secondary dark:text-muted-foreground dark:hover:text-primary transition-colors">
                  Shareholder Login
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="text-sm text-primary-foreground/80 hover:text-secondary dark:text-muted-foreground dark:hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy-policy" className="text-sm text-primary-foreground/80 hover:text-secondary dark:text-muted-foreground dark:hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-sm text-primary-foreground/80 hover:text-secondary dark:text-muted-foreground dark:hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/sebi-compliance" className="text-sm text-primary-foreground/80 hover:text-secondary dark:text-muted-foreground dark:hover:text-primary transition-colors">
                  SEBI Compliance
                </Link>
              </li>
              <li>
                <Link to="/data-protection" className="text-sm text-primary-foreground/80 hover:text-secondary dark:text-muted-foreground dark:hover:text-primary transition-colors">
                  Data Protection
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-primary-foreground/80 dark:text-muted-foreground">
                <Mail className="w-4 h-4 text-secondary" />
                <span>support@evoteindia.com</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-foreground/80 dark:text-muted-foreground">
                <Phone className="w-4 h-4 text-secondary" />
                <span>+91 1800-123-4567</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-primary-foreground/80 dark:text-muted-foreground">
                <MapPin className="w-4 h-4 text-secondary mt-0.5" />
                <span>Mumbai Financial District,<br />Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10 dark:border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60 dark:text-muted-foreground">
            <p>© 2024 E-Vote India. All rights reserved.</p>
            <p>Made with ❤️ for Indian Shareholders</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
