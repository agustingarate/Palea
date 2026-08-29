/** Port for a future CMS adapter. The institutional UI must not know its provider. */
export interface ContentRepository<TPage = unknown> {
  getPage(slug: string, locale: string): Promise<TPage | null>;
}
