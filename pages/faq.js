import StoreLayout from '@/components/StoreLayout';
import { query } from '@/lib/db';
import { getSiteContent } from '@/lib/server/site-content-service';

export default function FaqPage({ content }) {
  const faq = content.faq;

  return (
    <StoreLayout
      title={faq.title}
      description={faq.description}
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="page-panel">
            <p className="eyebrow mb-2">{faq.eyebrow}</p>
            <h1 className="section-heading">{faq.heading}</h1>
          </div>

          <div className="row g-4 mt-1">
            {faq.items.map((item) => (
              <div className="col-md-6" key={item.question}>
                <div className="content-block h-100">
                  <h3 className="feature-title">{item.question}</h3>
                  <p className="feature-description mb-0">{item.answer}</p>
                </div>
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
