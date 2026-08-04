import { createContext, type PropsWithChildren, useContext } from 'react';
import type { InjectionToken } from './container';
import { createAppContainer } from './compositionRoot';

const container = createAppContainer();
const DependenciesContext = createContext(container);

export function DependenciesProvider({ children }: PropsWithChildren) {
  return (
    <DependenciesContext.Provider value={container}>
      {children}
    </DependenciesContext.Provider>
  );
}

export function useDependency<T>(token: InjectionToken<T>): T {
  return useContext(DependenciesContext).resolve(token);
}
