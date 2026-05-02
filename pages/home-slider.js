import { useState } from 'react';
import Layout from '@/components/Layout';
import SectionCard from '@/components/SectionCard';
import { query } from '@/lib/db';
import { withPageAuth } from '@/lib/server/with-auth';
import { getSiteContent } from '@/lib/server/site-content-service';

const MAX_SLIDES = 4;
const emptySlide = {
  imageUrl: '',
  title: '',
  copy: '',
  ctaText: '',
  ctaHref: '/store',
  isActive: true
};

export default function HomeSliderPage({ user, siteContent }) {
  const [slides, setSlides] = useState(() => normalizeSlides(siteContent.home?.slides));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [saving, setSaving] = useState(false);

  function updateSlide(index, field, value) {
    setSlides((current) =>
      current.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, [field]: value } : slide
      )
    );
  }

  function addSlide() {
    if (slides.length >= MAX_SLIDES) {
      setError(`Maximum ${MAX_SLIDES} home slider images allowed.`);
      return;
    }

    setSlides((current) => [...current, { ...emptySlide }]);
  }

  function removeSlide(index) {
    setSlides((current) => current.filter((_, slideIndex) => slideIndex !== index));
  }

  async function uploadImage(index, file) {
    if (!file) {
      return;
    }

    setMessage('');
    setError('');
    setUploadingIndex(index);

    try {
      const body = new FormData();
      body.append('image', file);

      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to upload slider image.');
      }

      updateSlide(index, 'imageUrl', payload.imageUrl);
      setMessage('Slider image uploaded.');
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to upload slider image.');
    } finally {
      setUploadingIndex(null);
    }
  }

  async function saveSlides() {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const nextSlides = normalizeSlides(slides).filter((slide) => slide.imageUrl);
      const response = await fetch('/api/site-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: {
            ...siteContent,
            home: {
              ...siteContent.home,
              slides: nextSlides
            }
          }
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to save home slider.');
      }

      setSlides(normalizeSlides(payload.content.home?.slides));
      setMessage('Home slider saved.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save home slider.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Home Slider" subtitle="Upload and manage up to 4 home page slider images." user={user}>
      <SectionCard
        title="Slider Images"
        description="Recommended image size: 1600 x 700 px. Use JPG, PNG, WebP, or GIF up to 4 MB."
      >
        <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-4">
          <div className="text-muted">
            {slides.length} / {MAX_SLIDES} slides configured
          </div>
          <button type="button" className="btn btn-outline-dark rounded-pill px-4" onClick={addSlide} disabled={slides.length >= MAX_SLIDES}>
            Add Slide
          </button>
        </div>

        <div className="home-slider-admin-list">
          {slides.map((slide, index) => (
            <article className="home-slider-admin-card" key={`slide-${index}`}>
              <div className="home-slider-admin-preview">
                {slide.imageUrl ? <img src={slide.imageUrl} alt={`Home slider ${index + 1}`} /> : <span>1600 x 700 px</span>}
              </div>

              <div className="home-slider-admin-fields">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Image Upload</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(event) => uploadImage(index, event.target.files?.[0])}
                      disabled={uploadingIndex === index}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Image URL</label>
                    <input className="form-control" value={slide.imageUrl} onChange={(event) => updateSlide(index, 'imageUrl', event.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Title</label>
                    <input className="form-control" value={slide.title} onChange={(event) => updateSlide(index, 'title', event.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Button Link</label>
                    <input className="form-control" value={slide.ctaHref} onChange={(event) => updateSlide(index, 'ctaHref', event.target.value)} />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows="2" value={slide.copy} onChange={(event) => updateSlide(index, 'copy', event.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Button Text</label>
                    <input className="form-control" value={slide.ctaText} onChange={(event) => updateSlide(index, 'ctaText', event.target.value)} />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mt-3">
                  <label className="form-check mb-0">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={slide.isActive}
                      onChange={(event) => updateSlide(index, 'isActive', event.target.checked)}
                    />
                    <span className="form-check-label">Active</span>
                  </label>
                  <button type="button" className="btn btn-sm btn-outline-dark rounded-pill px-3" onClick={() => removeSlide(index)}>
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!slides.length ? (
          <div className="empty-state">
            <h3 className="feature-title">No slider images yet.</h3>
            <p className="feature-description">Add a slide, upload a 1600 x 700 px image, then save.</p>
          </div>
        ) : null}

        {message ? <div className="alert alert-success mt-4 mb-0">{message}</div> : null}
        {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}

        <div className="d-flex justify-content-end mt-4">
          <button type="button" className="btn btn-dark rounded-pill px-4" onClick={saveSlides} disabled={saving}>
            {saving ? 'Saving...' : 'Save Home Slider'}
          </button>
        </div>
      </SectionCard>
    </Layout>
  );
}

function normalizeSlides(value) {
  return (Array.isArray(value) ? value : [])
    .slice(0, MAX_SLIDES)
    .map((slide) => ({
      ...emptySlide,
      ...slide,
      imageUrl: String(slide?.imageUrl || '').trim(),
      title: String(slide?.title || '').trim(),
      copy: String(slide?.copy || '').trim(),
      ctaText: String(slide?.ctaText || '').trim(),
      ctaHref: String(slide?.ctaHref || '').trim() || '/store',
      isActive: slide?.isActive !== false
    }));
}

export const getServerSideProps = withPageAuth(async () => ({
  props: {
    siteContent: await getSiteContent(query)
  }
}));
