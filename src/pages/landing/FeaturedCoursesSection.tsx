import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { CoursePlaceholderCard } from './shared'
import { useInView } from './useInView'

export function FeaturedCoursesSection() {
  const inView = useInView()
  const featuredCourses = useQuery(api.landingHighlights.getCourseTrio, {})
  type CourseTrioItem = NonNullable<typeof featuredCourses>[number]
  const courseSlots: Array<CourseTrioItem | null> = [
    (featuredCourses ?? [])[0] ?? null,
    (featuredCourses ?? [])[1] ?? null,
    (featuredCourses ?? [])[2] ?? null,
  ]

  return (
    <section className="bg-[#EFE9E1] px-6 py-24 text-[#111827]">
      <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
        <m.div variants={fadeUp} className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F37E20]">
              Cursos em destaque
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
              Três caminhos para começar agora.
            </h2>
            <p className="mt-3 max-w-xl font-serif text-base leading-7 text-[#4B5563]">
              O curso com mais alunos matriculados, o lançamento mais recente e um curso do perfil oficial @resenhadoteologo, atualizado todos os dias.
            </p>
          </div>
          <Link
            to="/cursos"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#111827]/10 bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:border-[#F37E20]/40 hover:text-[#7A4A14]"
          >
            Ver todos os cursos
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5l7.5 7.5-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </m.div>

        <m.div variants={staggerContainer} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {courseSlots.map((course, index) => {
            if (!course) {
              return (
                <m.div key={`placeholder-${index}`} variants={fadeUp}>
                  <CoursePlaceholderCard />
                </m.div>
              )
            }
            const slotLabel =
              course.slot === 'top'
                ? 'Mais procurado'
                : course.slot === 'recent'
                  ? 'Mais recente'
                  : 'Do @resenhadoteologo'
            const href = course.slug ? `/cursos/${course.slug}` : `/cursos`
            return (
              <m.div key={String(course._id)} variants={fadeUp}>
                <Link
                  to={href}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[#D9CFC2] bg-white transition-all hover:border-[#F37E20]/40 hover:shadow-[0_24px_60px_rgba(17,24,39,0.08)]"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#E8DFD4]">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#F37E20]/8 text-[#F37E20]">
                        <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-[#111827]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                      {slotLabel}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F37E20]">
                      {course.category}
                    </p>
                    <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-[#111827] group-hover:text-[#7A4A14]">
                      {course.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 font-serif text-sm leading-6 text-[#4B5563]">
                      {course.shortDescription}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-[#6B7280]">
                      <div className="flex items-center gap-2">
                        {course.creator.avatarUrl ? (
                          <img
                            src={course.creator.avatarUrl}
                            alt={course.creator.name}
                            loading="lazy"
                            decoding="async"
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F37E20]/10 text-[10px] font-semibold text-[#F37E20]">
                            {course.creator.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span>{course.creator.name}</span>
                      </div>
                      <span className="text-[11px] text-[#9CA3AF]">
                        {course.totalLessons} aulas
                      </span>
                    </div>
                  </div>
                </Link>
              </m.div>
            )
          })}
        </m.div>
      </m.div>
    </section>
  )
}
