import "./globals.css";
import { Nav } from "../components/Nav";

export const metadata = { title: "Зелена грядка" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        <footer className="max-w-6xl mx-auto px-4 py-10 text-xs text-zinc-500">
          © {new Date().getFullYear()} Зелена грядка
        </footer>
      </body>
    </html>
  );
}
