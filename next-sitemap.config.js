/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://deli-event-2n62.vercel.app',
  generateRobotsTxt: true,
  sitemapSize: 7000,
};
