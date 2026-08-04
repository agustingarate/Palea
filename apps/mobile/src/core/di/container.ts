export interface InjectionToken<T> {
  readonly key: symbol;
  readonly description: string;
  readonly __type?: T;
}

export function createToken<T>(description: string): InjectionToken<T> {
  return { key: Symbol(description), description };
}

export class Container {
  private readonly values = new Map<symbol, unknown>();

  register<T>(token: InjectionToken<T>, value: T): void {
    if (this.values.has(token.key))
      throw new Error(`Dependency already registered: ${token.description}`);
    this.values.set(token.key, value);
  }

  resolve<T>(token: InjectionToken<T>): T {
    if (!this.values.has(token.key))
      throw new Error(`Dependency not registered: ${token.description}`);
    return this.values.get(token.key) as T;
  }
}
