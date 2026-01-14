//src/services/insightsService.js
import { getActiveCampaign, getUpcomingCampaign } from "./campaignService";
import {
  getTopViewedProducts,
  getTopSearches,
  getMissingSearches,
  getZeroViewedProducts,
  getLowViewedProducts,
} from "./analyticsService";

export async function getStoreInsights({ leadDays = 30 } = {}) {
  const [
    activeCampaign,
    upcomingCampaign,
    topViewed,
    zeroViewed,
    lowViewed,
    topSearches,
    missingSearches,
  ] = await Promise.all([
    getActiveCampaign(),
    getUpcomingCampaign({ leadDays }),
    getTopViewedProducts({ limit: 10 }),
    getZeroViewedProducts({ limit: 15 }),
    getLowViewedProducts({ limit: 15, maxViews: 3 }),
    getTopSearches({ limit: 10 }),
    getMissingSearches({ limit: 10 }),
  ]);

  return {
    campaigns: {
      active: activeCampaign,
      upcoming: upcomingCampaign,
      leadDays,
    },
    products: {
      topViewed,
      zeroViewed,
      lowViewed,
    },
    searches: {
      topSearches,
      missingSearches,
    },
  };
}