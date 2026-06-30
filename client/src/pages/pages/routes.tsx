import { lazy } from 'react';
import { Route } from 'react-router-dom';

const CreatePage = lazy(() => import('./CreatePage').then((module) => ({ default: module.CreatePage })));
const PageInbox = lazy(() => import('./PageInbox').then((module) => ({ default: module.PageInbox })));
const PageProfile = lazy(() => import('./PageProfile').then((module) => ({ default: module.PageProfile })));

export const pageRoutes = (
  <>
    <Route path="/pages/create" element={<CreatePage />} />
    <Route path="/pages/:id" element={<PageProfile />} />
    <Route path="/pages/:id/inbox" element={<PageInbox />} />
  </>
);