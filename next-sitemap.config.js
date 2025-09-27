/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://deliv-event.fr',
  generateRobotsTxt: true,
  sitemapSize: 7000,
};
