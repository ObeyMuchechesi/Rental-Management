import "./globals.css";
import Providers from "./providers";
import Nav from "./nav";

export const metadata = {
  title: "Rental Management System",
  description: "Manage properties, units, tenants, leases, rent payments and maintenance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900 antialiased">
        <Providers>
          <Nav />
          <div className="mx-auto max-w-6xl p-6">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
