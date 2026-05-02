import { useState } from 'react';
import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';
import { getSiteContent } from '@/lib/server/site-content-service';

const jsonFields = [
  ['home.features', 'Home Feature List'],
  ['about.values', 'About Value Cards'],
  ['contact.cards', 'Contact Cards'],
  ['faq.items', 'FAQ Items'],
  ['privacy.blocks', 'Privacy Blocks'],
  ['terms.blocks', 'Terms Blocks']
];

export default function SettingsPage({ user, siteContent }) {
  const [content, setContent] = useState(siteContent);
  const [jsonValues, setJsonValues] = useState(() =>
    Object.fromEntries(jsonFields.map(([path]) => [path, JSON.stringify(getValue(siteContent, path), null, 2)]))
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function updateField(path, value) {
    setContent((current) => setValue(current, path, value));
  }

  async function saveContent() {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      let payload = content;

      for (const [path] of jsonFields) {
        payload = setValue(payload, path, JSON.parse(jsonValues[path]));
      }

      const response = await fetch('/api/site-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: payload })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to save website content.');
      }

      setContent(result.content);
      setMessage('Website content saved.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save website content.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout
      title="Settings"
      subtitle="Manage website content shown on the public storefront."
      user={user}
    >
      <SectionCard
        title="Website Content"
        description="Update static website copy from the admin dashboard. Changes load on the storefront server-side."
      >
        <div className="row g-4">
          <div className="col-lg-6">
            <ContentGroup title="Home Page">
              <TextField label="Meta Title" value={content.home.title} onChange={(value) => updateField('home.title', value)} />
              <TextField label="Meta Description" value={content.home.description} onChange={(value) => updateField('home.description', value)} textarea />
              <TextField label="Hero Eyebrow" value={content.home.eyebrow} onChange={(value) => updateField('home.eyebrow', value)} />
              <TextField label="Hero Heading" value={content.home.heading} onChange={(value) => updateField('home.heading', value)} textarea />
              <TextField label="Hero Copy" value={content.home.copy} onChange={(value) => updateField('home.copy', value)} textarea />
              <TextField label="Primary Button" value={content.home.primaryCta} onChange={(value) => updateField('home.primaryCta', value)} />
              <TextField label="Secondary Button" value={content.home.secondaryCta} onChange={(value) => updateField('home.secondaryCta', value)} />
              <TextField label="Feature Kicker" value={content.home.featureKicker} onChange={(value) => updateField('home.featureKicker', value)} />
              <TextField label="Promo Eyebrow" value={content.home.promoEyebrow} onChange={(value) => updateField('home.promoEyebrow', value)} />
              <TextField label="Promo Heading" value={content.home.promoHeading} onChange={(value) => updateField('home.promoHeading', value)} textarea />
              <TextField label="Promo Copy" value={content.home.promoCopy} onChange={(value) => updateField('home.promoCopy', value)} textarea />
              <TextField label="Promo Primary Button" value={content.home.promoPrimaryCta} onChange={(value) => updateField('home.promoPrimaryCta', value)} />
              <TextField label="Promo Secondary Button" value={content.home.promoSecondaryCta} onChange={(value) => updateField('home.promoSecondaryCta', value)} />
              <TextField label="Collection Section Heading" value={content.home.categoryHeading} onChange={(value) => updateField('home.categoryHeading', value)} />
              <TextField label="Featured Products Heading" value={content.home.productsHeading} onChange={(value) => updateField('home.productsHeading', value)} />
            </ContentGroup>
          </div>

          <div className="col-lg-6">
            <ContentGroup title="About Page">
              <TextField label="Meta Title" value={content.about.title} onChange={(value) => updateField('about.title', value)} />
              <TextField label="Meta Description" value={content.about.description} onChange={(value) => updateField('about.description', value)} textarea />
              <TextField label="Eyebrow" value={content.about.eyebrow} onChange={(value) => updateField('about.eyebrow', value)} />
              <TextField label="Heading" value={content.about.heading} onChange={(value) => updateField('about.heading', value)} textarea />
              <TextField label="Copy" value={content.about.copy} onChange={(value) => updateField('about.copy', value)} textarea />
              <TextField label="Next Step Eyebrow" value={content.about.nextEyebrow} onChange={(value) => updateField('about.nextEyebrow', value)} />
              <TextField label="Next Step Heading" value={content.about.nextHeading} onChange={(value) => updateField('about.nextHeading', value)} textarea />
            </ContentGroup>

            <ContentGroup title="Contact Page">
              <TextField label="Meta Title" value={content.contact.title} onChange={(value) => updateField('contact.title', value)} />
              <TextField label="Meta Description" value={content.contact.description} onChange={(value) => updateField('contact.description', value)} textarea />
              <TextField label="Eyebrow" value={content.contact.eyebrow} onChange={(value) => updateField('contact.eyebrow', value)} />
              <TextField label="Heading" value={content.contact.heading} onChange={(value) => updateField('contact.heading', value)} />
              <TextField label="Copy" value={content.contact.copy} onChange={(value) => updateField('contact.copy', value)} textarea />
            </ContentGroup>
          </div>

          <div className="col-lg-6">
            <ContentGroup title="FAQ Page">
              <TextField label="Meta Title" value={content.faq.title} onChange={(value) => updateField('faq.title', value)} />
              <TextField label="Meta Description" value={content.faq.description} onChange={(value) => updateField('faq.description', value)} textarea />
              <TextField label="Eyebrow" value={content.faq.eyebrow} onChange={(value) => updateField('faq.eyebrow', value)} />
              <TextField label="Heading" value={content.faq.heading} onChange={(value) => updateField('faq.heading', value)} textarea />
            </ContentGroup>
          </div>

          <div className="col-lg-6">
            <ContentGroup title="Legal Pages">
              <TextField label="Privacy Heading" value={content.privacy.heading} onChange={(value) => updateField('privacy.heading', value)} textarea />
              <TextField label="Privacy Copy" value={content.privacy.copy} onChange={(value) => updateField('privacy.copy', value)} textarea />
              <TextField label="Terms Heading" value={content.terms.heading} onChange={(value) => updateField('terms.heading', value)} textarea />
              <TextField label="Terms Copy" value={content.terms.copy} onChange={(value) => updateField('terms.copy', value)} textarea />
            </ContentGroup>
          </div>

          {jsonFields.map(([path, label]) => (
            <div className="col-lg-6" key={path}>
              <JsonField
                label={label}
                value={jsonValues[path]}
                onChange={(value) => setJsonValues((current) => ({ ...current, [path]: value }))}
              />
            </div>
          ))}
        </div>

        {message ? <div className="alert alert-success mt-4 mb-0">{message}</div> : null}
        {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}

        <div className="d-flex justify-content-end mt-4">
          <button type="button" className="btn btn-dark rounded-pill px-4" onClick={saveContent} disabled={saving}>
            {saving ? 'Saving...' : 'Save Website Content'}
          </button>
        </div>
      </SectionCard>
    </Layout>
  );
}

function ContentGroup({ title, children }) {
  return (
    <div className="content-block h-100">
      <h3 className="feature-title">{title}</h3>
      <div className="d-flex flex-column gap-3 mt-3">{children}</div>
    </div>
  );
}

function TextField({ label, value, onChange, textarea = false }) {
  const Input = textarea ? 'textarea' : 'input';

  return (
    <label className="form-label mb-0">
      <span className="d-block mb-2">{label}</span>
      <Input
        className="form-control"
        rows={textarea ? 3 : undefined}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function JsonField({ label, value, onChange }) {
  return (
    <div className="content-block h-100">
      <label className="form-label mb-0 w-100">
        <span className="d-block mb-2">{label}</span>
        <textarea className="form-control font-monospace" rows={10} value={value} onChange={(event) => onChange(event.target.value)} />
      </label>
    </div>
  );
}

function getValue(source, path) {
  return path.split('.').reduce((current, key) => current?.[key], source);
}

function setValue(source, path, value) {
  const keys = path.split('.');
  const next = structuredClone(source);
  let cursor = next;

  keys.slice(0, -1).forEach((key) => {
    cursor[key] = { ...(cursor[key] || {}) };
    cursor = cursor[key];
  });

  cursor[keys[keys.length - 1]] = value;
  return next;
}

export const getServerSideProps = withPageAuth(async () => ({
  props: {
    siteContent: await getSiteContent(query)
  }
}));
