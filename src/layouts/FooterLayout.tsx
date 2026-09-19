import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
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
        <>
        <Outlet />
            <footer className="bg-white pt-16 pb-8 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6 sm:gap-x-8">
                        {footerData.map((section) => (
                        <div key={section.title}>
                        <h3 className="text-slate-900 font-semibold text-sm mb-6">
                        {section.title}
                        </h3>
                        <ul className="space-y-4 text-slate-600 text-sm font-normal">
                            {section.links.map((link) => (
                                <li key={link.name}>
                                    <a
                                    href={link.href}
                                    className="hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded transition-all"
                                >
                                    {link.name}
                                </a>
                            </li>
                            ))}
                        </ul>
                    </div>
                    ))}
                </div>

                <hr className="border-slate-300 my-8" />

                <div className="text-left">
                    <p className="text-slate-600 text-sm">
                    © ReadymadeUI. All rights reserved.
                    </p>
                </div>
            </div>
            </footer>
        </>
    )
}