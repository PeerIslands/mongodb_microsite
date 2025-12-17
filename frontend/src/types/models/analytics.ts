export interface SiteAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  totalDownloads: number;
  trafficSources: TrafficSource[];
  topPages: PageStat[];
  periodStart: string;
  periodEnd: string;
}

export interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
}

export interface PageStat {
  page: string;
  views: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
}

export interface PageAnalytics {
  page: string;
  views: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  conversions: number;
  topReferrers: Referrer[];
}

export interface Referrer {
  url: string;
  visits: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalViews: number;
  uniqueVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  totalDownloads: number;
  topAccelerators: AcceleratorStat[];
  topCaseStudies: CaseStudyStat[];
  dailyStats: DailyStat[];
}

export interface AcceleratorStat {
  id: string;
  name: string;
  views: number;
  downloads: number;
}

export interface CaseStudyStat {
  id: string;
  title: string;
  views: number;
}

export interface DailyStat {
  date: string;
  views: number;
  uniqueVisitors: number;
  downloads: number;
}

