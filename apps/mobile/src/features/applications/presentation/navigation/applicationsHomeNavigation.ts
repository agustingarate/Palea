export interface ApplicationsHomeRouter {
  replace: (href: '/') => void;
}

/**
 * Returns to the applications home without relying on browser or native
 * navigation history. This keeps deep links reliable after a page reload.
 */
export function navigateToApplicationsHome(router: ApplicationsHomeRouter) {
  router.replace('/');
}
