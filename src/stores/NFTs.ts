import { get, writable } from 'svelte/store';
import { contract } from '../lib/contract';
import { walletAddress } from './auth';

export class NFT {
  id: number;
  name: string;
  image: string;
  class: string;
  selected: boolean;
  delegated: string | null;
  constructor(data: any, i: number) {
    this.id = data[i].name.match(/\d+/)[0];
    this.name = data[i].name;
    this.image = data[i].image;
    this.class = data[i].attributes[5].value;
    this.selected = false;
    this.delegated = null;
  }
}

export const potentials = writable<NFT[]>([]);
export const selectedNFTs = writable<NFT[]>([]);
export const listedNumbers = writable<Array<number>>([]);
export const loadingNFTs = writable<boolean>(true);

export const checkingDelegations = writable<string | null>(null);
export const fetchingDelegations = writable<boolean>(false);
export const nftApprovals = writable<
  { owner: string; approved: boolean; nfts?: number[] }[]
>([]);

export async function getNFTs() {
  const address = get(walletAddress);
  if (!address) return;

  const potentialNumbers: number[] = await getNftNumbers(address);
  const potentialNFTs: NFT[] | null = await getPotentials(potentialNumbers);
  if (potentialNFTs) potentials.set(potentialNFTs);

  const delegations = localStorage.getItem(address);
  if (delegations) nftApprovals.set(JSON.parse(delegations));

  // check listed Potentials
  let listedNFTs: number[];
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': 'c6a6c088d5e34ca2a018f44673697f01',
    },
  };

  await fetch(
    'https://cors-anywhere.herokuapp.com/https://api.opensea.io/api/v2/listings/collection/potentials-eth/all',
    options,
  )
    // await fetch('https://api.opensea.io/api/v2/listings/collection/potentials-eth/all', options)
    .then((res) => res.json())
    .then((res) => {
      listedNFTs = res.listings.map(
        (listing: any) =>
          listing.protocol_data.parameters.offer[0].identifierOrCriteria,
      );
      listedNumbers.set(Array.from(new Set(listedNFTs)));
    })
    .catch((err) => console.error(err));

  loadingNFTs.set(false);
}

export const getNftNumbers = async (wallet: string) => {
  const json = await fetch(`https://api.degenerousdao.com/nft/owner/${wallet}`);
  const data = await json.json();
  const nftNumbers = data.ownedNfts.map((nft: any) => +nft.tokenId);
  return nftNumbers;
};

export const getPotentials = async (
  nftNumbers: number[],
  owner: string | null = null,
) => {
  try {
    const maskedAddress =
      owner?.slice(0, 6) + '...' + owner?.slice(owner?.length - 4);
    const potentialNFTs: NFT[] = [];
    const metadata: any[] = [];
    // for (let i = 0; i < nftNumbers.length; i++) {
    for (let i = 0; i < 1; i++) {
      const response = await fetch(
        `https://api.degenerousdao.com/nft/data/${nftNumbers[i]}`,
      );
      metadata[Number(i)] = await response.json();
      potentialNFTs[Number(i)] = new NFT(metadata, Number(i));
      if (owner) potentialNFTs[Number(i)].delegated = maskedAddress;
    }
    return potentialNFTs;
  } catch (error) {
    console.log('Failed to fetch Potentials # ' + nftNumbers + ': ' + error);
    return null;
  }
};

export const nftVote = async (episodeNr: number, nftNr: number) => {
  if (episodeNr === -1) return;
  return await (await contract('alchemy')).getVoteOptionId(episodeNr, nftNr);
};
