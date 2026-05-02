import StoreLayout from '@/components/StoreLayout';
import { query } from '@/lib/db';
import { getSiteContent } from '@/lib/server/site-content-service';

function getContactLink(item) {
  const label = String(item.label || '').toLowerCase();
  const value = String(item.value || '').trim();

  if (label.includes('instagram')) {
    return {
      href: `https://instagram.com/${value.replace(/^@/, '')}`,
      icon: 'instagram',
      text: value
    };
  }

  if (label.includes('whatsapp')) {
    const digits = value.replace(/\D/g, '');
    return {
      href: `https://wa.me/${digits}`,
      icon: 'phone',
      text: value
    };
  }

  if (label.includes('phone') || label.includes('mobile')) {
    return {
      href: `tel:${value.replace(/\s/g, '')}`,
      icon: 'phone',
      text: value
    };
  }

  if (label.includes('address')) {
    return {
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`,
      icon: 'location',
      text: value
    };
  }

  return null;
}

function ContactIcon({ type }) {
  if (type === 'instagram') {
    return (
      <svg className="contact-link-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17" cy="7" r="1" />
      </svg>
    );
  }

  if (type === 'location') {
    return (
      <svg className="contact-link-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s6-5.3 6-11a6 6 0 0 0-12 0c0 5.7 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.4" />
      </svg>
    );
  }

  return (
    <svg className="contact-link-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.6 3.8 9.2 3l2.1 5.1-1.5.9c.9 1.9 2.3 3.4 4.2 4.3l.9-1.5 5.1 2.1-.8 2.6c-.3 1-1.2 1.7-2.3 1.6C10.8 17.7 6.3 13.2 5.9 7c-.1-1 .6-2 1.7-2.3Z" />
    </svg>
  );
}

export default function ContactPage({ content }) {
  const contact = content.contact;

  return (
    <StoreLayout
      title={contact.title}
      description={contact.description}
    >
      <section className="store-section store-section-top">
        <div className="container-fluid">
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="page-panel h-100">
                <p className="eyebrow mb-2">{contact.eyebrow}</p>
                <h1 className="section-heading">{contact.heading}</h1>
                <p className="store-copy">
                  {contact.copy}
                </p>

                <div className="row g-3 mt-1">
                  {contact.cards.map((item) => {
                    const link = getContactLink(item);

                    return (
                      <div className="col-12" key={item.label}>
                        <div className="content-block">
                          <div className="invoice-label">{item.label}</div>
                          {link ? (
                            <a
                              className="contact-action-link"
                              href={link.href}
                              target={link.href.startsWith('http') ? '_blank' : undefined}
                              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                            >
                              <ContactIcon type={link.icon} />
                              <span>{link.text}</span>
                            </a>
                          ) : (
                            <div className="fw-semibold">{item.value}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="page-panel h-100">
                <h2 className="section-heading h3">Contact Form</h2>
                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <label className="form-label">First Name</label>
                    <input className="form-control" placeholder="Your first name" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last Name</label>
                    <input className="form-control" placeholder="Your last name" />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Email</label>
                    <input className="form-control" placeholder="you@example.com" />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" rows="6" placeholder="Tell us how we can help." />
                  </div>
                  <div className="col-12 d-flex justify-content-end">
                    <button type="button" className="btn btn-dark rounded-pill px-4">
                      Send Message
                    </button>
                  </div>
                </div>
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
