import { BookOpen, Award, Users } from 'lucide-react'

export default function LearningCommunity() {
  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Learning & Community</h1>
        <p className="text-muted-foreground max-w-2xl">
          Structured ISL learning with Deaf-led content and community contributions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-display text-lg font-semibold mb-2">Beginner Basics</h3>
          <p className="text-sm text-muted-foreground mb-4">Greetings, introductions, daily phrases</p>
          <a href="/learn" className="text-primary hover:underline text-sm font-medium">
            Start Lesson →
          </a>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Award className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-display text-lg font-semibold mb-2">Practice Exercises</h3>
          <p className="text-sm text-muted-foreground mb-4">Interactive signing practice with feedback</p>
          <a href="#" className="text-primary hover:underline text-sm font-medium">
            Practice →
          </a>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Users className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-display text-lg font-semibold mb-2">Progress Tracking</h3>
          <p className="text-sm text-muted-foreground mb-4">Your learning journey and achievements</p>
          <a href="#" className="text-primary hover:underline text-sm font-medium">
            View Progress →
          </a>
        </div>
      </div>

      <div className="rounded-2xl border-l-4 border-primary bg-card p-6">
        <h2 className="font-display text-2xl font-bold mb-4">Deaf-Led Content</h2>
        <p className="text-muted-foreground">
          All language content sourced from qualified ISL instructors and Deaf community experts.
          Introductory communication guidance clearly labeled, not presented as certification.
        </p>
      </div>
    </div>
  )
}