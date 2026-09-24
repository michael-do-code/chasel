import { useEffect } from 'react';
import './StaticPage.css';

export interface StaticPageSection {
  heading: string;
  body: string[];
}

interface StaticPageProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  lastUpdated?: string;
  sections: StaticPageSection[];
}

/**
 * Shared shell for simple content pages (About Us, Privacy Policy, Terms of
 * Use, and future policy pages). Pages just supply their own copy.
 */
function StaticPage({ eyebrow, title, intro, lastUpdated, sections }: StaticPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="static-page">
      <div className="static-page-container">
        <header className="static-page-header">
          {eyebrow && <p className="static-page-eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {intro && <p className="static-page-intro">{intro}</p>}
          {lastUpdated && <p className="static-page-updated">Last updated {lastUpdated}</p>}
        </header>

        <div className="static-page-body">
          {sections.map((section) => (
            <section className="static-page-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StaticPage;
