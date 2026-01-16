import '@/styles/features/accelerators/AcceleratorHero.css';

interface AcceleratorHeroProps {
  title: string;
  subtitle: string;
  description: string;
}

const AcceleratorHero = ({ title, subtitle, description }: AcceleratorHeroProps) => {
  return (
    <section className="single-hero">
      <div className="single-hero-content">
        <h1 className="single-hero-title">{title}</h1>
        <p className="single-hero-subtitle">{subtitle}</p>
        <p className="single-hero-description">{description}</p>
      </div>
    </section>
  );
};

export default AcceleratorHero;
