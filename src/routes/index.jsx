import Login from '../view/login';
import { Routes, Route } from 'react-router-dom';
import Layout from '../layouts';
import PersonCenter from '../view/person-center';
import Constans from '../lib/constans';
import Shopbag from '../view/shopbag';
import GoodDetail from '../view/good-detail';

const routes = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/goods/:id',
    element: <GoodDetail />
  },
  {
    path: '/',
    element: <Layout />,
    isTabBar: true,
    children: [
      {
        title: Constans.TabBarTitle.Shopbag,
        path: 'shop-bag',
        element: <Shopbag />,
        roles: ['admin'],
      },
      {
        title: Constans.TabBarTitle.PersonCenter,
        path: 'person-center',
        element: <PersonCenter />,
        roles: ['admin'],
      },
    ]
  },
]

function readerRoutes(routes) {
  return routes.map((route, index) => {
    return <Route path={route.path} element={route.element} key={index} children={route.children && route.children.length ? readerRoutes(route.children) : []} a={1} />
  });
}

const TabBarRoute = routes.find(route => route.isTabBar);
export const TabBarRoutes = TabBarRoute.children.map(route => ({ title: route.title, path: TabBarRoute.path + route.path }));

export const RouterRole = routes.reduce((routerRole, router) => {
  if (!router.children) {
    if (router.roles) {
      routerRole[router.path] = router.roles;
    }
  } else {
    router.children.forEach(childrenRouter => {
      if (childrenRouter.roles) {
        routerRole[router.path + childrenRouter.path] = childrenRouter.roles;
      }
    });
  }
  return routerRole;
}, {});

export default function RouteList() {
  return (
    <Routes>
      {readerRoutes(routes)}
    </Routes>
  )
}