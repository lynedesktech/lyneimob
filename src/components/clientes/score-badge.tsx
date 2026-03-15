import { Badge } from "@/components/ui/badge"

function getCorScore(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 70) return "default"
  if (score >= 40) return "secondary"
  if (score >= 1) return "outline"
  return "destructive"
}

export function ScoreBadge({ score }: { score: number }) {
  return (
    <Badge variant={getCorScore(score)}>
      {score} pts
    </Badge>
  )
}
