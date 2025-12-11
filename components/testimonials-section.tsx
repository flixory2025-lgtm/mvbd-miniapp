import { Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "Lumière transformed our brand presence online. Their attention to detail and understanding of our vision was exceptional.",
    author: "Sarah Mitchell",
    role: "Founder, Serene Living",
  },
  {
    quote:
      "Working with them felt like a true partnership. They brought ideas we hadn't even considered and executed them beautifully.",
    author: "James Chen",
    role: "Creative Director, Bloom Studio",
  },
  {
    quote:
      "The website they created for us has become our most valuable business asset. Our customers constantly compliment the experience.",
    author: "Emma Laurent",
    role: "Owner, Artisan Café",
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#8B7355] text-sm tracking-widest uppercase font-medium">Client Stories</span>
          <h2 className="text-4xl md:text-5xl font-serif font-medium text-[#2D2926] mt-4 text-balance">
            Words of Trust
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="p-8 rounded-2xl bg-[#FDF8F5] border border-[#E8D5C4]/50">
              <Quote className="w-8 h-8 text-[#D4A574] mb-6" />
              <p className="text-[#5C534A] leading-relaxed mb-8">"{testimonial.quote}"</p>
              <div>
                <div className="font-serif font-medium text-[#2D2926]">{testimonial.author}</div>
                <div className="text-sm text-[#8B7355]">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
