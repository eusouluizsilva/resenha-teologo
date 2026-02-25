import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Navbar from "../../components/ui/Navbar";
import CourseCard from "../../components/ui/CourseCard";

export default function CoursesPage() {
  const courses = useQuery(api.courses.listPublished);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Cursos</h1>
            <p className="text-slate-400 mt-1">Escolha um curso e comece a aprender.</p>
          </div>

          {courses === undefined && (
            <div className="text-slate-400 text-center py-20">Carregando cursos...</div>
          )}

          {courses?.length === 0 && (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg">Nenhum curso disponível ainda.</p>
              <p className="text-slate-600 text-sm mt-2">Volte em breve!</p>
            </div>
          )}

          {courses && courses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course._id}
                  id={course._id}
                  title={course.title}
                  description={course.description}
                  thumbnailUrl={course.thumbnailUrl}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
