import Link from 'next/link';
import { useEffect, useState } from 'react';
import StoreLayout from '@/components/StoreLayout';
import ProductShowcaseCard from '@/components/ProductShowcaseCard';
import { getCategoryShowcases, getFeaturedProducts } from '@/lib/server/products-service';
import { getSiteContent } from '@/lib/server/site-content-service';
import { query } from '@/lib/db';

export default function Home({ products, categoryShowcases, content }) {
  const home = content.home;
  const slides = Array.isArray(home.slides)
    ? home.slides.filter((slide) => slide.imageUrl && slide.isActive !== false).slice(0, 4)
    : [];
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveSlideIndex((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[activeSlideIndex] || slides[0];

  return (
    <StoreLayout
      title={home.title}
      description={home.description}
    >
      {activeSlide ? (
        <section className="home-slider-section">
          <div className="container-fluid">
            <div className="home-slider" style={{ backgroundImage: `url("${activeSlide.imageUrl}")` }}>
              <div className="home-slider-content">
                {activeSlide.title ? <h1 className="home-slider-title">{activeSlide.title}</h1> : null}
                {activeSlide.copy ? <p className="home-slider-copy">{activeSlide.copy}</p> : null}
                {activeSlide.ctaText && activeSlide.ctaHref ? (
                  <Link href={activeSlide.ctaHref} className="btn btn-dark btn-lg rounded-pill px-4">
                    {activeSlide.ctaText}
                  </Link>
                ) : null}
              </div>

              {slides.length > 1 ? (
                <div className="home-slider-dots" aria-label="Home slider controls">
                  {slides.map((slide, index) => (
                    <button
                      type="button"
                      className={index === activeSlideIndex ? 'active' : ''}
                      aria-label={`Show slide ${index + 1}`}
                      onClick={() => setActiveSlideIndex(index)}
                      key={`${slide.imageUrl}-${index}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="store-hero">
        <div className="container-fluid">
          <div className="store-hero-panel">
            <div className="row g-4 align-items-center">
              <div className="col-lg-7">
                <p className="eyebrow mb-3">{home.eyebrow}</p>
                <h1 className="store-title">{home.heading}</h1>
                <p className="store-copy">
                  {home.copy}
                </p>
                <div className="d-flex gap-3 flex-wrap mt-4">
                  <Link href="/store" className="btn btn-dark btn-lg rounded-pill px-4">
                    {home.primaryCta}
                  </Link>
                  <Link href="/order-tracking" className="btn btn-outline-dark btn-lg rounded-pill px-4">
                    {home.secondaryCta}
                  </Link>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="store-feature-panel">
                  <div className="store-feature-kicker">{home.featureKicker}</div>
                  {home.features.map((item) => (
                    <div className="store-feature-item" key={item}>{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="store-section">
        <div className="container-fluid">
          <div className="promo-banner-grid">
            <div className="promo-banner promo-banner-primary">
              <p className="eyebrow mb-2">{home.promoEyebrow}</p>
              <h2 className="section-heading">{home.promoHeading}</h2>
              <p className="store-copy mb-0">
                {home.promoCopy}
              </p>
              <div className="d-flex gap-3 flex-wrap mt-4">
                <Link href="/store?sort=latest" className="btn btn-dark rounded-pill px-4">
                  {home.promoPrimaryCta}
                </Link>
                <Link href="/store?sort=price-desc" className="btn btn-outline-dark rounded-pill px-4">
                  {home.promoSecondaryCta}
                </Link>
              </div>
            </div>

            <div className="promo-banner promo-banner-secondary">
              <p className="eyebrow mb-2">{home.secondaryPromoEyebrow}</p>
              <h3 className="section-heading">{home.secondaryPromoHeading}</h3>
              <div className="promo-stat-grid">
                <div className="promo-stat">
                  <strong>{categoryShowcases.length}</strong>
                  <span>Featured collections</span>
                </div>
                <div className="promo-stat">
                  <strong>{products.length}</strong>
                  <span>Homepage highlights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="store-section">
        <div className="container-fluid">
          <div className="section-intro">
            <div>
              <p className="eyebrow mb-2">{home.categoryEyebrow}</p>
              <h2 className="section-heading">{home.categoryHeading}</h2>
              <p className="store-copy mb-0">
                {home.categoryCopy}
              </p>
            </div>
            <Link href="/store" className="btn btn-outline-dark rounded-pill px-4">
              Open Catalog
            </Link>
          </div>

          <div className="row g-4">
            {categoryShowcases.map((category) => (
              <div className="col-md-6 col-xl-3" key={category.slug}>
                <Link href={`/store/categories/${category.slug}`} className="category-showcase-card h-100">
                  <span className="category-showcase-kicker">Collection</span>
                  <h3 className="category-showcase-title">{category.name}</h3>
                  <p className="category-showcase-copy">
                    {category.count} {category.count === 1 ? 'product' : 'products'} available
                  </p>
                  <span className="category-showcase-link">
                    Explore {category.sampleProductName}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="store-section">
        <div className="container-fluid">
          <div className="section-intro">
            <div>
              <p className="eyebrow mb-2">{home.productsEyebrow}</p>
              <h2 className="section-heading">{home.productsHeading}</h2>
            </div>
            <Link href="/store" className="btn btn-outline-dark rounded-pill px-4">
              View All
            </Link>
          </div>

          <div className="row g-4">
            {products.map((product) => (
              <div className="col-md-6 col-xl-3" key={product.id || product.slug}>
                <ProductShowcaseCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}

export async function getServerSideProps() {
  const [products, categoryShowcases, content] = await Promise.all([
    getFeaturedProducts(query).catch(() => []),
    getCategoryShowcases(query).catch(() => []),
    getSiteContent(query)
  ]);

  return {
    props: {
      products,
      categoryShowcases,
      content
    }
  };
}
