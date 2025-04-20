interface Interaction {
  id: string
  contactId: string
  date: string
  type: string
  notes: string
  createdAt: Date
}

interface InteractionTileProps {
  interaction: Interaction
}

export function InteractionTile({ interaction }: InteractionTileProps) {
  console.log("Rendering interaction:", interaction)
  if (!interaction) {
    console.error("Interaction is undefined or null")
    return null
  }
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="font-semibold text-lg mb-2">{interaction.type}</div>
      <div className="text-sm text-gray-500 mb-2">Date: {new Date(interaction.date).toLocaleDateString()}</div>
      <div className="text-sm">{interaction.notes}</div>
    </div>
  )
}