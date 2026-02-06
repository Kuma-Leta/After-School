// app/layout.js
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AfterSchool - Find & Hire Tutors",
  description: "Connect teachers with schools and families",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
