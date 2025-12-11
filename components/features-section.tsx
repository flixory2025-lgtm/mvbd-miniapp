import { Palette, Sparkles, Zap, Heart } from "lucide-react"

const features = [
  {
    icon: Palette,
    title: "Bespoke Design",
    description: "Every project is uniquely tailored to reflect your brand's personality and vision.",
  },
  {
    icon: Sparkles,
    title: "Refined Aesthetics",
    description: "We craft elegant interfaces that balance beauty with intuitive functionality.",
  },
  {
    icon: Zap,
    title: "Performance First",
    description: "Lightning-fast experiences that keep your visitors engaged and coming back.",
  },
  {
    icon: Heart,
    title: "Thoughtful Details",
    description: "From micro-interactions to typography, every element is carefully considered.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#8B7355] text-sm tracking-widest uppercase font-medium">Our Approach</span>
          <h2 className="text-4xl md:text-5xl font-serif font-medium text-[#2D2926] mt-4 text-balance">
            Design with Intention
          </h2>
          <p className="text-[#5C534A] mt-4 leading-relaxed">
            We believe great design emerges from understanding your story and translating it into meaningful digital
            experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-[#FDF8F5] hover:bg-[#E8D5C4]/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-[#2D2926] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-5 h-5 text-[#FDF8F5]" />
              </div>
              <h3 className="text-xl font-serif font-medium text-[#2D2926] mb-3">{feature.title}</h3>
              <p className="text-[#5C534A] text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
