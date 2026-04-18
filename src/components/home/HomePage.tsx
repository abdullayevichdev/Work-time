import { Hero } from './Hero';
import { LandingContent } from './LandingContent';
import { Footer } from '@/components/layout/Footer';

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <LandingContent />
      <Footer />
    </div>
  );
}
