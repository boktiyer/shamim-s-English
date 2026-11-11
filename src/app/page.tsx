import { Hero } from "@/components/home/hero";
import { CourseCatalog } from "@/components/home/course-catalog";
import { BooksSection } from "@/components/home/books-section";
import { AboutTeacher } from "@/components/home/about-teacher";
import { WhyChoose } from "@/components/home/why-choose";
import { SuccessStories } from "@/components/home/success-stories";
import { StudentAchievements } from "@/components/home/student-achievements";
import { Faq } from "@/components/home/faq";
import { CtaBanner } from "@/components/home/cta-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CourseCatalog />
      <BooksSection />
      <AboutTeacher />
      <WhyChoose />
      <StudentAchievements />
      <SuccessStories />
      <Faq />
      <CtaBanner />
    </>
  );
}
