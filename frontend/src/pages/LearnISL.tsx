import { useState } from 'react'
import { BookOpen, Award, CheckCircle, Play, Circle } from 'lucide-react'

export default function LearnISL() {
  const [completed, setCompleted] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('signbridge-practice') || '[]') as string[] } catch { return [] }
  })
  const [activeCourse, setActiveCourse] = useState<string | null>(null)
  const togglePractice = (key: string) => {
    const next = completed.includes(key) ? completed.filter(item => item !== key) : [...completed, key]
    setCompleted(next)
    localStorage.setItem('signbridge-practice', JSON.stringify(next))
  }
  const courses = [
    {
      title: 'Beginner: Basic Vocabulary',
      description: 'Essential greetings, numbers, and everyday phrases',
      lessons: 12,
      completed: 0,
      difficulty: 'Beginner',
      duration: '4 hours',
    },
    {
      title: 'Numbers & Counting',
      description: 'ISL numerals from 1-100 and basic counting',
      lessons: 8,
      completed: 0,
      difficulty: 'Beginner',
      duration: '2 hours',
    },
    {
      title: 'Common Phrases',
      description: 'Introduction, expression, and polite phrases',
      lessons: 15,
      completed: 0,
      difficulty: 'Intermediate',
      duration: '5 hours',
    },
  ]

  const quickLessons = [
    { title: 'Greeting', sign: 'Hello', duration: '5 min' },
    { title: 'Self Introduction', sign: 'I am...', duration: '8 min' },
    { title: 'Numbers 1-10', sign: 'Counting', duration: '10 min' },
    { title: 'Help & Emergency', sign: 'Urgent', duration: '7 min' },
  ]
  const totalLessons = courses.reduce((sum, course) => sum + course.lessons, 0)
  const practicedLessons = courses.reduce((sum, course) => sum + completed.filter(item => item.startsWith(`${course.title}|`)).length, 0)

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Learn Indian Sign Language</h1>
        <p className="text-muted-foreground max-w-2xl">
          Use this space to plan and track study. Verified ISL demonstrations are not included in this build; learn sign forms with a qualified instructor or trusted ISL source.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card mb-8">
        <div className="border-b border-border p-6">
          <h2 className="font-display text-2xl font-bold">Your Progress</h2>
          <p className="text-muted-foreground mt-1">Total learning journey so far</p>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-3 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{totalLessons ? Math.round(practicedLessons / totalLessons * 100) : 0}%</div>
              <p className="text-sm text-muted-foreground">Practice tracked</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{practicedLessons}</div>
              <p className="text-sm text-muted-foreground">Lessons Completed</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{completed.filter(item => !item.includes('|')).length}</div>
              <p className="text-sm text-muted-foreground">Quick sessions logged</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-display text-2xl font-bold mb-4">Available Courses</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {courses.map((course) => (
          <div key={course.title} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border p-6">
              <div className="flex items-start justify-between">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  course.difficulty === 'Beginner'
                    ? 'bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {course.difficulty}
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold mt-2">{course.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completed.filter(item => item.startsWith(`${course.title}|`)).length} / {course.lessons} sessions
                  </span>
                  <span className="text-muted-foreground">{course.duration}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(completed.filter(item => item.startsWith(`${course.title}|`)).length / course.lessons) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => setActiveCourse(activeCourse === course.title ? null : course.title)}
                  className="w-full inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activeCourse === course.title ? 'Close outline' : 'Open study outline'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeCourse && <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Study outline</p>
        <h3 className="mt-1 font-display text-xl font-semibold">{activeCourse}</h3>
        <p className="mt-2 text-sm text-muted-foreground">Use each session with an ISL instructor or verified resource. Mark it complete after you have practiced the material.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">{Array.from({ length: courses.find(course => course.title === activeCourse)?.lessons || 0 }, (_, index) => {
          const key = `${activeCourse}|${index + 1}`
          const done = completed.includes(key)
          return <button key={key} onClick={() => togglePractice(key)} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40">{done ? <CheckCircle className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}<span className="text-sm font-medium">Session {index + 1} · {done ? 'Practiced' : 'Mark practiced'}</span></button>
        })}</div>
      </div>}

      <div className="rounded-2xl border border-border bg-card mb-8">
        <div className="border-b border-border p-6">
          <h2 className="font-display text-2xl font-bold">Quick Practice</h2>
          <p className="text-muted-foreground mt-1">Practice essential signs in minutes</p>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {quickLessons.map((lesson) => (
              <div key={lesson.title} className="flex items-center gap-4 p-4 border border-border rounded-xl">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{lesson.title}</h4>
                  <p className="text-sm text-muted-foreground">{lesson.sign} • {lesson.duration}</p>
                </div>
                <button onClick={() => togglePractice(lesson.title)} aria-label={`Mark ${lesson.title} practiced`} className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground">
                  {completed.includes(lesson.title) ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-display text-lg font-semibold mb-2">Video Demonstrations</h3>
          <p className="text-sm text-muted-foreground">
            Verified demonstration videos are not bundled. Use a trusted ISL instructor or resource alongside the practice tracker.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Award className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-display text-lg font-semibold mb-2">Progress Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Earn badges and track your learning achievements.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Play className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-display text-lg font-semibold mb-2">Practice Mode</h3>
          <p className="text-sm text-muted-foreground">
            Track your study sessions here. For experimental camera recognition of 11 isolated signs, open Live Translate.
          </p>
        </div>
      </div>
    </div>
  )
}
