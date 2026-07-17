/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko', 'ru'],
    localeDetection: false,
  },
  defaultNS: 'common',
  ns: ['common', 'auth', 'home', 'products', 'admin', 'blog', 'mypage', 'help', 'chat'],
  localePath: './public/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
