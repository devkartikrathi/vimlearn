import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_LESSONS, lessonBySlug } from "@/lib/curriculum/lessons";
import { LessonView } from "@/components/vim/lesson-view";

export function generateStaticParams() {
  return ALL_LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) return { title: "Lesson not found" };
  return { title: lesson.title, description: lesson.summary };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) notFound();
  return <LessonView lesson={lesson} />;
}
