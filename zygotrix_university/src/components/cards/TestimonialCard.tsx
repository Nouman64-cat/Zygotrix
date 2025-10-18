import type { Testimonial } from "../../types";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition duration-300 hover:border-indigo-400/40">
      <div className="absolute -right-12 top-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-xl" />
      <div className="flex items-center gap-4">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="h-12 w-12 rounded-full border border-white/10 object-cover"
          loading="lazy"
        />
        <div>
          <p className="text-sm font-semibold text-white">{testimonial.name}</p>
          <p className="text-xs text-indigo-200">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-200">{testimonial.message}</p>
    </div>
  );
};

export default TestimonialCard;
