import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import FilterTabs, { type FilterOption } from '../components/editorial/FilterTabs';
import Purchases from './Purchases';
import Sales from './Sales';
import './Activity.css';

type ActivityTab = 'purchases' | 'sales';

// Only the fields the summary needs from /orders/my-purchases and /orders/my-sales.
interface PurchaseSummary {
  status: string;
}

interface SaleSummary {
  status: string;
  returnStatus: string | null;
}

interface ActivityCounts {
  activePurchases: number;
  toShip: number;
  returnRequests: number;
}

const FINISHED_ORDER_STATUSES = ['DELIVERED', 'CANCELLED'];
const OPEN_RETURN_STATUSES = ['REQUESTED', 'NEEDS_DISCUSSION'];
const COUNTS_REFRESH_MS = 15000;

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * "Manage activity": order history and sell history behind one set of tabs.
 * The tab lives in the URL (?tab=sales) so it survives refresh and the back
 * button. The /purchases and /sales pages are reused as-is, so links that
 * already point at them (notifications, checkout) keep working.
 */
function Activity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [counts, setCounts] = useState<ActivityCounts | null>(null);
  const [countsLoaded, setCountsLoaded] = useState(false);

  const loadCounts = useCallback(async () => {
    try {
      const [purchases, sales] = await Promise.all([
        api.get<PurchaseSummary[]>('/orders/my-purchases'),
        api.get<SaleSummary[]>('/orders/my-sales'),
      ]);
      setCounts({
        activePurchases: purchases.data.filter((o) => !FINISHED_ORDER_STATUSES.includes(o.status)).length,
        toShip: sales.data.filter((s) => s.status === 'PROCESSING').length,
        returnRequests: sales.data.filter((s) => s.returnStatus && OPEN_RETURN_STATUSES.includes(s.returnStatus)).length,
      });
    } catch (error) {
      // The tabs still work without counts; the pages show their own errors.
      console.error('Failed to load activity counts:', error);
    } finally {
      setCountsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const firstLoad = window.setTimeout(loadCounts, 0);
    const timer = window.setInterval(loadCounts, COUNTS_REFRESH_MS);
    return () => {
      window.clearTimeout(firstLoad);
      window.clearInterval(timer);
    };
  }, [loadCounts]);

  const salesNeedingAction = counts ? counts.toShip + counts.returnRequests : 0;

  // An explicit ?tab= always wins; otherwise open Sales only when something there needs doing.
  const requestedTab = searchParams.get('tab');
  const tab: ActivityTab =
    requestedTab === 'sales' || requestedTab === 'purchases'
      ? requestedTab
      : salesNeedingAction > 0 ? 'sales' : 'purchases';

  const changeTab = (next: ActivityTab) => {
    setSearchParams({ tab: next });
    void loadCounts();
  };

  const tabOptions: FilterOption<ActivityTab>[] = [
    { value: 'purchases', label: 'Purchases', count: counts?.activePurchases || undefined },
    { value: 'sales', label: 'Sales', count: salesNeedingAction || undefined },
  ];

  const summaryParts: string[] = [];
  if (counts?.activePurchases) {
    summaryParts.push(`${plural(counts.activePurchases, 'order', 'orders')} on the way`);
  }
  if (salesNeedingAction > 0 && counts) {
    const details = [
      counts.toShip > 0 && `${counts.toShip} to ship`,
      counts.returnRequests > 0 && plural(counts.returnRequests, 'return request', 'return requests'),
    ].filter(Boolean).join(', ');
    summaryParts.push(`${plural(salesNeedingAction, 'sale needs', 'sales need')} your action (${details})`);
  }

  // Wait for the counts before rendering a tab, so the default doesn't flip
  // from Purchases to Sales a moment after the page appears.
  const ready = requestedTab !== null || countsLoaded;

  return (
    <div className="activity">
      <div className="activity-bar">
        <div className="activity-bar-top">
          <p className="ed-kicker">Your account · Manage activity</p>
          <Link to="/profile" className="activity-back">← Back to profile</Link>
        </div>
        <FilterTabs
          ariaLabel="Activity type"
          options={tabOptions}
          value={tab}
          onChange={changeTab}
        />
        {summaryParts.length > 0 && (
          <p className="activity-summary" role="status">{summaryParts.join(' · ')}</p>
        )}
      </div>

      <div className="activity-panel" role="tabpanel">
        {!ready ? (
          <p className="activity-loading">Loading your activity…</p>
        ) : tab === 'purchases' ? (
          <Purchases />
        ) : (
          <Sales />
        )}
      </div>
    </div>
  );
}

export default Activity;
