interface PlaceholderProps {
  title: string
  description: string
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      <p className="max-w-md text-sm text-ink-500">{description}</p>
    </div>
  )
}