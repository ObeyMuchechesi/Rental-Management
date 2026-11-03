import "./globals.css";
import Providers from "./providers";
import Nav from "./nav";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers>
          <Nav />
          <div className="max-w-6xl mx-auto p-6">{children}</div>
        </Providers>
      </body>
    </html>
  );
}