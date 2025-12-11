export function GallerySection() {
  const projects = [
    {
      title: "Serene Living",
      category: "E-Commerce",
      image: "/luxury-home-decor-website-design-warm-tones.jpg",
    },
    {
      title: "Bloom Studio",
      category: "Portfolio",
      image: "/elegant-photography-portfolio-website-soft-aesthet.jpg",
    },
    {
      title: "Artisan Café",
      category: "Restaurant",
      image: "/cozy-cafe-website-design-warm-atmosphere.jpg",
    },
    {
      title: "Velvet Beauty",
      category: "Beauty Brand",
      image: "/luxury-beauty-brand-website-minimalist-elegant.jpg",
    },
  ]

  return (
    <section id="gallery" className="py-24 bg-[#FDF8F5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#8B7355] text-sm tracking-widest uppercase font-medium">Selected Work</span>
          <h2 className="text-4xl md:text-5xl font-serif font-medium text-[#2D2926] mt-4 text-balance">
            Our Portfolio
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <div key={index} className="group relative overflow-hidden rounded-2xl cursor-pointer">
              <div className="aspect-[4/3] bg-[#E8D5C4]">
                <img
                  src={project.image || "/placeholder.svg"}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D2926]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="text-[#D4A574] text-sm tracking-wide">{project.category}</span>
                  <h3 className="text-2xl font-serif text-white mt-1">{project.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
