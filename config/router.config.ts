export default [
  {
    path: '/',
    component: '../layouts/BasicLayout',
    Routes: ['src/pages/Authorized'],
    authority: ['admin', 'user'],
    routes: [
      {
        path: '/',
        name: 'welcome',
        icon: 'smile',
        component: './Welcome',
      },
      {
        path: '/crawler/site',
        name: 'site',
        icon: 'global',
        component: './Crawler/Site',
      },
      {
        path: '/crawler/rule-conf',
        name: 'rule-conf',
        icon: 'control',
        component: './Crawler/RuleConf',
      },
      {
        component: './404',
      },
    ],
  },
  {
    component: './404',
  },
];
