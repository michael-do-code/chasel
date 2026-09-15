import './PageHeading.css';

interface PageHeadingProps {
  /** Small uppercase mono line above the title, e.g. "THE ARCHIVE · 6 PIECES". */
  kicker: string;
  /** Italic serif display title. */
  title: string;
  /** Optional right-aligned supporting copy. */
  lede?: string;
  /** Optional controls rendered under the heading (filters, tabs). */
  children?: React.ReactNode;
  /** `page` sizes the title for a full-width page; `panel` for a column. */
  size?: 'page' | 'panel';
}

/**
 * The kicker / display-title / lede block that opens every editorial page.
 * Shared by Browsing and Messages so both keep the same optical rhythm.
 */
function PageHeading({
  kicker,
  title,
  lede,
  children,
  size = 'page',
}: PageHeadingProps) {
  return (
    <header className={`ed-page-heading ed-page-heading-${size}`}>
      <div className="ed-page-heading-row">
        <div>
          <p className="ed-kicker">{kicker}</p>
          <h1 className="ed-display">{title}</h1>
        </div>
        {lede && <p className="ed-page-lede">{lede}</p>}
      </div>
      {children}
    </header>
  );
}

export default PageHeading;
