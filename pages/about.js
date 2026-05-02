import Link from 'next/link';
import StoreLayout from '@/components/StoreLayout';
import { query } from '@/lib/db';
import { getSiteContent } from '@/lib/server/site-content-service';

export default function AboutPage({ content }) {
  const about = content.about;

  return (
    <StoreLayout
      title={about.title}
      description={about.description}
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="page-panel">
            <p className="eyebrow mb-2">{about.eyebrow}</p>
            <h1 className="section-heading">{about.heading}</h1>
            <p className="store-copy">
              {about.copy}
            </p>
          </div>

          <div className="row g-4 mt-1">
            {about.values.map((item) => (
              <div className="col-md-4" key={item.title}>
                <div className="content-block h-100">
                  <h3 className="feature-title">{item.title}</h3>
                  <p className="feature-description mb-0">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="page-panel mt-4">
            <div className="section-intro mb-0">
              <div>
                <p className="eyebrow mb-2">{about.nextEyebrow}</p>
                <h2 className="section-heading">{about.nextHeading}</h2>
              </div>
              <div className="d-flex gap-3 flex-wrap">
                <Link href="/store" className="btn btn-dark rounded-pill px-4">
                  Shop Now
                </Link>
                <Link href="/contact" className="btn btn-outline-dark rounded-pill px-4">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}

export async function getServerSideProps() {
  return {
    props: {
      content: await getSiteContent(query)
    }
  };
}
