import { Toaster } from "react-hot-toast";

import { Footer } from "@/components/common/footer";
import { Navigation } from "@/components/common/navigation";

export default function WithNavLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="container mx-auto px-4 py-4 md:py-8 flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <Toaster position="bottom-right" />
    </>
  );
}