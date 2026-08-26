import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Offers } from "@/components/Offers";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Services } from "@/components/Services";
import { Jornadas } from "@/components/Jornadas";
import { Catalog } from "@/components/Catalog";
import { About } from "@/components/About";
import { Testimonials } from "@/components/Testimonials";
import { Locations } from "@/components/Locations";
import { ContactCTA } from "@/components/ContactCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Offers />
        <Jornadas />
        <BeforeAfter />
        <Services />
        <Catalog />
        <About />
        <Testimonials />
        <Locations />
        <ContactCTA />
      </main>
      <Footer />
    </>
  );
}
