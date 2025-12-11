import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="py-24 bg-[#2D2926]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-serif font-medium text-[#FDF8F5] text-balance">
          Ready to Create Something Beautiful?
        </h2>
        <p className="text-[#E8D5C4] mt-6 text-lg max-w-2xl mx-auto leading-relaxed">
          Let's collaborate to bring your vision to life. Every great project starts with a conversation.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button size="lg" className="bg-[#FDF8F5] hover:bg-white text-[#2D2926] rounded-full px-8 group">
            Start a Project
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8 border-[#FDF8F5] text-[#FDF8F5] hover:bg-[#FDF8F5] hover:text-[#2D2926] bg-transparent"
          >
            Contact Us
          </Button>
        </div>
      </div>
    </section>
  )
}
