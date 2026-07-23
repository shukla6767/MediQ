import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
    { label: "Search Hospital", href: "#search" },
    { label: "Nearby Hospitals", href: "#nearby" },
    { label: "Crowd Levels", href: "#crowd" },
    { label: "Book Appointment", href: "#" }],

    company: [
    { label: "About Us", href: "#about" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Press", href: "#" }],

    support: [
    { label: "Help Center", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" }]

  };

  return (
    <footer id="footer" className="relative mt-auto">
      {/* Top gradient border */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <path d="M12 6v8" />
                    <path d="M8 10h8" />
                    <path d="M3 10h1" />
                    <path d="M20 10h1" />
                    <path d="M5 18h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                    <path d="M7 22h10" />
                    <path d="M12 18v4" />
                  </svg>
                </div>
                <span className="text-xl font-bold gradient-text">
                  MediQueue
                </span>
              </Link>
              <p className="text-muted text-sm leading-relaxed max-w-sm mb-6">
                Revolutionizing hospital visits with real-time crowd tracking,
                smart search, and seamless queue management. Your health, zero
                wait.
              </p>
              {/* Social Icons */}
              <div className="flex gap-3">
                {[
                {
                  label: "Twitter",
                  icon:
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />

                },
                {
                  label: "GitHub",
                  icon:
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />

                },
                {
                  label: "LinkedIn",
                  icon:
                  <>
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </>

                }].
                map((social) =>
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-muted hover:text-primary hover:bg-primary/10 transition-all duration-300 hover:scale-110">
                  
                    <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    
                      {social.icon}
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Links Columns */}
            {Object.entries(footerLinks).map(([title, links]) =>
            <div key={title}>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                  {title}
                </h3>
                <ul className="space-y-3">
                  {links.map((link) =>
                <li key={link.label}>
                      <a
                    href={link.href}
                    className="text-sm text-muted hover:text-primary transition-colors duration-200">
                    
                        {link.label}
                      </a>
                    </li>
                )}
                </ul>
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted">
              &copy; {currentYear} MediQueue. All rights reserved.
            </p>
            <p className="text-sm text-muted">
              Built with ❤️ for better healthcare access
            </p>
          </div>
        </div>
      </div>
    </footer>);

}