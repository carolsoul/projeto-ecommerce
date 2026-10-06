import { Outlet } from 'react-router-dom'
import { BORDER, BRAND_BG, CREAM, FOCUS, HOVER_ON_BRAND, MUTED, ON_BRAND } from '../lib/theme';

const footerData = [
   {
      title: "Quick Links",
      links: [
         { name: "Our Story", href: "#" },
         { name: "Newsroom", href: "#" },
         { name: "Careers", href: "#" },
         { name: "Blog", href: "#" },
         { name: "Press Kit", href: "#" },
      ],
   },
   {
      title: "Services",
      links: [
         { name: "Web Development", href: "#" },
         { name: "Testing Automation", href: "#" },
         { name: "AWS Development Services", href: "#" },
         { name: "Mobile App Development", href: "#" },
         { name: "UI/UX Design", href: "#" },
      ],
   },
   {
      title: "Platforms",
      links: [
         { name: "Hubspot", href: "#" },
         { name: "Marketo Integration Services", href: "#" },
         { name: "Marketing Glossary", href: "#" },
         { name: "UIPath", href: "#" },
         { name: "Salesforce", href: "#" },
         { name: "Zapier Integration", href: "#" },
      ],
   },
   {
      title: "Company",
      links: [
         { name: "Accessibility", href: "#" },
         { name: "About", href: "#" },
         { name: "Contact", href: "#" },
         { name: "Learn more", href: "#" },
         { name: "Privacy Policy", href: "#" },
         { name: "Terms of Service", href: "#" },
      ],
   },
];

export default function FooterLayout() {
    return (
        <div className={`${CREAM} flex min-h-screen flex-col`}>
            <div className="flex-1">
                <Outlet />
            </div>
            <footer className={`${BRAND_BG} rounded-lg pt-16 pb-8 m-4 px-4 md:px-8`}>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6 sm:gap-x-8">
                        {footerData.map((section) => (
                        <div key={section.title}>
                        <h3 className={`${ON_BRAND} font-semibold text-sm mb-6`}>
                        {section.title}
                        </h3>
                        <ul className={`space-y-4 ${MUTED} text-sm font-normal`}>
                            {section.links.map((link) => (
                                <li key={link.name}>
                                    <a
                                    href={link.href}
                                    className={`${HOVER_ON_BRAND} ${FOCUS} rounded transition-all`}
                                >
                                    {link.name}
                                </a>
                            </li>
                            ))}
                        </ul>
                    </div>
                    ))}
                </div>

                <hr className={`${BORDER} my-8`} />

                <div className="text-left">
                    <p className={`${MUTED} text-sm`}>
                    © ReadymadeUI. All rights reserved.
                    </p>
                </div>
            </div>
            </footer>
        </div>
    )
}