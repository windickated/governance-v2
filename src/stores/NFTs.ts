import { writable } from "svelte/store";
import { provider } from "../lib/ethers";
import { contract } from "../lib/contract";

export class NFT {
  id: number;
  name: string;
  image: string;
  class: string;
  selected: boolean;
  constructor(data: any, i: number) {
    this.id = data[i].name.match(/\d+/)[0];
    this.name = data[i].name;
    this.image = data[i].image;
    this.class = data[i].attributes[5].value;
    this.selected = false;
  }
}

export const potentials = writable<NFT[]>([]);
export const selectedNFTs = writable<NFT[]>([]);
export const walletAddress = writable<string>('');
export const hasPotential = writable<boolean | null>(true);

const message: string = `
Only Potential holders can enter the Galactic Governance Hub!

Sign this message to prove you're a Potentials NFT holder.

It will not cause a blockchain transaction, nor any gas fees.
`;

export async function getNFTs() {
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  walletAddress.set(address.slice(0, 6) + "..." + address.slice(address.length - 4));
  try {
    await signer.signMessage(message);
  } catch (error) {
    hasPotential.set(null);
    return;
  }
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
  if (potentialNFTs.length < 1) hasPotential.set(false);
}

export const nftVote = async (episodeNr: number, nftNr: number) => {
  if (episodeNr === -1) return;
  return await (await contract()).getVoteOptionId(episodeNr, nftNr);
}