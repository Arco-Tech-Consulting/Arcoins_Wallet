interface PlaceholderProps {
  title: string
  description: string
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low py-16 text-center">
      <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
      <p className="max-w-md text-sm text-on-surface-variant">{description}</p>
    </div>
  )
}