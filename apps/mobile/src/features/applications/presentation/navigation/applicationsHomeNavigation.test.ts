import { navigateToApplicationsHome } from './applicationsHomeNavigation';

describe('navigateToApplicationsHome', () => {
  it('replaces the current route with applications home', () => {
    const replace = jest.fn();

    navigateToApplicationsHome({ replace });

    expect(replace).toHaveBeenCalledWith('/');
  });
});
