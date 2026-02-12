import { markdownToHtml } from '@/utils/markdown';
import '@/styles/features/accelerators/AcceleratorHero.css';

interface AcceleratorHeroProps {
  title: string;
  subtitle: string;
  description: string;
}

const AcceleratorHero = ({ title, subtitle, description }: AcceleratorHeroProps) => {
  const descriptionHtml = markdownToHtml(description || '');

  return (
    <section className="single-hero">
      <div className="single-hero-content">
        <h1 className="single-hero-title">{title}</h1>
        <p className="single-hero-subtitle">{subtitle}</p>
        <div
          className="single-hero-description single-hero-markdown-content"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      </div>
    </section>
  );
};

export default AcceleratorHero;
