import SectionHeader from '../components/ui/SectionHeader'
import Button from '../components/ui/Button'

export default function Placeholder() {
  return (
    <main className="pt-[72px] min-h-screen flex items-center justify-center bg-cream-2">
      <div className="text-center px-6">
        <SectionHeader
          eyebrow="Coming Soon"
          title={<>Find Your <em>Style</em></>}
          subtitle="AI-powered style analysis is on its way. Upload a photo and discover your perfect colors, metals, and more."
          center
        />
        <div className="mt-8">
          <Button to="/" variant="outline" size="lg">Back to Home</Button>
        </div>
      </div>
    </main>
  )
}