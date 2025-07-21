/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Nullable<T> = T | null;

type Tab = Nullable<'nfts' | 'episodes'>;
