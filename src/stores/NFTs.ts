import { writable } from "svelte/store";
import { provider } from "../lib/ethers";

export class NFT {
  id: number;
  name: string;
  image: string;
  class: string;
  selected: boolean;
  active: boolean;
  constructor(data: any, i: number) {
    this.id = data[i].name.match(/\d+/)[0];
    this.name = data[i].name;
    this.image = data[i].image;
    this.class = data[i].attributes[5].value;
    this.selected = false;
    this.active = i === 2 || i === 4 ? false : true; // deactivating some for testing
  }
}

export const potentials = writable<NFT[]>([]);

export const selectedNFTs = writable<NFT[]>([]);
export const inactiveNFTs = writable<NFT[]>([]);

export const walletAddress = writable<string>('');

export async function getNFTs() {
  const address = await (await provider.getSigner()).getAddress();
    walletAddress.set(address.slice(0, 6) + "..." + address.slice(address.length - 4));
    const json = await fetch(
      `https://api.degenerousdao.com/nft/owner/${address}`
    );
    const data = await json.json();
    const nftNumbers = data.ownedNfts.map((nft: any) => +nft.tokenId);
  let potentialNFTs: NFT[] = [];
  const metadata: any[] = [];
  for (let i in nftNumbers) {
    const response = await fetch(
      `https://api.degenerousdao.com/nft/data/${nftNumbers[i]}`
    );
    metadata[Number(i)] = await response.json();
    potentialNFTs[Number(i)] = new NFT(metadata, Number(i));
  }
  potentials.set(potentialNFTs);

  setInactiveNFTs(potentialNFTs); // temp
}

const setInactiveNFTs = (NFTs: NFT[]) => {
  let testInactiveNFTs: NFT[] = [];
  NFTs.map(nft => {
    if (!nft.active) testInactiveNFTs.push(nft);
  })
  inactiveNFTs.set(testInactiveNFTs);
}