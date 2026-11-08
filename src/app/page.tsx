import { Hero } from "@/components/home/hero";
import { CourseCategories } from "@/components/home/course-categories";
import { PopularCourses } from "@/components/home/popular-courses";
import { BooksSection } from "@/components/home/books-section";
import { AboutTeacher } from "@/components/home/about-teacher";
import { WhyChoose } from "@/components/home/why-choose";
import { SuccessStories } from "@/components/home/success-stories";
import { Faq } from "@/components/home/faq";
import { CtaBanner } from "@/components/home/cta-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CourseCategories />
      <PopularCourses />
      <BooksSection />
      <AboutTeacher />
      <WhyChoose />
      <SuccessStories />
      <Faq />
      <CtaBanner />
    </>
  );
}
