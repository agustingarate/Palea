import { Container, createToken } from './container';

it('resolves typed dependencies and rejects invalid registration', () => {
  const token = createToken<string>('message');
  const container = new Container();
  container.register(token, 'hello');
  expect(container.resolve(token)).toBe('hello');
  expect(() => container.register(token, 'again')).toThrow(
    'already registered',
  );
  expect(() => container.resolve(createToken('missing'))).toThrow(
    'not registered',
  );
});
