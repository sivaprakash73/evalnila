import StoreLayout from '@/components/StoreLayout';
import { query } from '@/lib/db';
import { getSiteContent } from '@/lib/server/site-content-service';

export default function TermsPage({ content }) {
  const terms = content.terms;

  return (
    <StoreLayout
      title={terms.title}
      description={terms.description}
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="legal-page">
            <p className="eyebrow mb-2">{terms.eyebrow}</p>
            <h1 className="section-heading">{terms.heading}</h1>
            <p className="store-copy">
              {terms.copy}
            </p>

            {terms.blocks.map((item) => (
              <div className="legal-block" key={item.title}>
                <h2 className="feature-title">{item.title}</h2>
                <p className="feature-description mb-0">{item.description}</p>
              </div>
            ))}
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
