import StoreLayout from '@/components/StoreLayout';
import { query } from '@/lib/db';
import { getSiteContent } from '@/lib/server/site-content-service';

export default function PrivacyPolicyPage({ content }) {
  const privacy = content.privacy;

  return (
    <StoreLayout
      title={privacy.title}
      description={privacy.description}
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="legal-page">
            <p className="eyebrow mb-2">{privacy.eyebrow}</p>
            <h1 className="section-heading">{privacy.heading}</h1>
            <p className="store-copy">
              {privacy.copy}
            </p>

            {privacy.blocks.map((item) => (
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
