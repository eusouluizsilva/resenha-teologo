// Persistência local temporária até Convex ser conectado

export type Course = {
  _id: string
  title: string
  description: string
  category: string
  level: 'iniciante' | 'intermediario' | 'avancado'
  thumbnail: string
  tags: string[]
  language: string
  isPublished: boolean
  totalLessons: number
  totalStudents: number
  totalModules: number
  createdAt: number
}

const KEY = 'rdt_courses'

export function getCourses(): Course[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveCourse(data: Omit<Course, '_id' | 'isPublished' | 'totalLessons' | 'totalStudents' | 'totalModules' | 'createdAt'>): Course {
  const courses = getCourses()
  const course: Course = {
    ...data,
    _id: crypto.randomUUID(),
    isPublished: false,
    totalLessons: 0,
    totalStudents: 0,
    totalModules: 0,
    createdAt: Date.now(),
  }
  localStorage.setItem(KEY, JSON.stringify([course, ...courses]))
  return course
}

export function updateCourse(id: string, patch: Partial<Course>) {
  const courses = getCourses().map((c) => c._id === id ? { ...c, ...patch } : c)
  localStorage.setItem(KEY, JSON.stringify(courses))
}

export function deleteCourse(id: string) {
  const courses = getCourses().filter((c) => c._id !== id)
  localStorage.setItem(KEY, JSON.stringify(courses))
}

export function getCourseById(id: string): Course | undefined {
  return getCourses().find((c) => c._id === id)
}
