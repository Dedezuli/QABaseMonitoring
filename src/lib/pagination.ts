export const PAGE_SIZE = 10;

export type PageInfo = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  skip: number;
  from: number;
  to: number;
};

/** Clamps whatever arrived in the URL to a page that actually exists. */
export function resolvePage(
  pageParam: string | undefined,
  totalItems: number,
  pageSize = PAGE_SIZE
): PageInfo {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const requested = Number(pageParam);
  const page = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), 1), totalPages)
    : 1;
  const skip = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    skip,
    from: totalItems === 0 ? 0 : skip + 1,
    to: Math.min(skip + pageSize, totalItems),
  };
}
