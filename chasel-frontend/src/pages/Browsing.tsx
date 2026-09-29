import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import PageHeading from '../components/editorial/PageHeading';
import FilterTabs from '../components/editorial/FilterTabs';
import ListingGrid from '../components/editorial/ListingGrid';
import { DEFAULT_GRID_COLUMNS, GRID_COLUMN_OPTIONS } from '../components/editorial/gridColumns';
import { useSearch } from '../context/SearchContext';
import type { Listing } from '../types/listing';
import { DEFAULT_HEADING, getCollection } from './browsing/collections';
import {
  ALL_CATEGORIES,
  CATEGORIES,
  CATEGORY_OPTIONS,
  SORT_OPTIONS,
  selectListings,
} from './browsing/selectListings';
import type { SortId } from './browsing/selectListings';
import './Browsing.css';

/**
 * The marketplace browse view (previously `Home`).
 *
 * Filtering and ordering live in `./browsing/*`; this component owns the
 * data fetch, the URL-driven collection framing, and the layout.
 */
function Browsing() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [sort, setSort] = useState<SortId>('curated');
  const [columns, setColumns] = useState<number>(DEFAULT_GRID_COLUMNS);

  const { searchQuery, setSearchItems } = useSearch();
  const [searchParams, setSearchParams] = useSearchParams();

  const collection = getCollection(searchParams.get('collection'));
  const heading = collection ?? DEFAULT_HEADING;
  const maxPriceParam = Number(searchParams.get('maxPrice'));
  const maxPrice = Number.isFinite(maxPriceParam) && maxPriceParam > 0 ? maxPriceParam : null;
  const endpoint = collection?.endpoint ?? '/listings';

  // The category lives in the URL rather than in component state, so a
  // filtered view stays shareable and Discover's `?category=` links just work.
  const requestedCategory = searchParams.get('category');
  const category = CATEGORIES.includes(requestedCategory ?? '')
    ? (requestedCategory as string)
    : ALL_CATEGORIES;

  const changeCategory = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next === ALL_CATEGORIES) {
      params.delete('category');
    } else {
      params.set('category', next);
    }
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    api
      .get<Listing[]>(endpoint)
      .then((response) => {
        setListings(response.data);
        setSearchItems(response.data);
      })
      .catch((error) => console.error('Error fetching listings:', error));
  }, [endpoint, setSearchItems]);

  const visibleListings = useMemo(
    () => selectListings({
      listings,
      category,
      search: searchQuery,
      maxPrice,
      collection,
      sort,
    }),
    [listings, category, searchQuery, maxPrice, collection, sort]
  );

  const pieceCount = `${visibleListings.length} ${visibleListings.length === 1 ? 'PIECE' : 'PIECES'}`;

  return (
    <div className="browse">
      <div className="browse-shell">
        <PageHeading
          kicker={`${heading.kicker} · ${pieceCount}`}
          title={heading.title}
          lede={maxPrice ? `Everything in the archive at or under $${maxPrice}.` : heading.lede}
        >
          <hr className="ed-rule browse-rule" />

          <div className="browse-controls">
            <FilterTabs
              ariaLabel="Filter by category"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={changeCategory}
            />

            <div className="browse-view-controls">
              <label className="browse-select">
                <span>Sort</span>
                <select
                  value={sort}
                  aria-label="Sort listings"
                  onChange={(event) => setSort(event.target.value as SortId)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <span className="browse-select-divider" aria-hidden="true">/</span>

              <label className="browse-select">
                <span>Grid</span>
                <select
                  value={columns}
                  aria-label="Listings per row"
                  onChange={(event) => setColumns(Number(event.target.value))}
                >
                  {GRID_COLUMN_OPTIONS.map((count) => (
                    <option key={count} value={count}>{count} col</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <hr className="ed-rule browse-rule" />
        </PageHeading>

        {visibleListings.length === 0 ? (
          <p className="browse-empty">
            Nothing in the archive matches that yet. Try another category or search.
          </p>
        ) : (
          <ListingGrid listings={visibleListings} columns={columns} />
        )}
      </div>
    </div>
  );
}

export default Browsing;
