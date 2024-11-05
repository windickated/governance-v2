import { season, episode, selectedOption } from "../stores/storyNode";
import { inactiveNFTs, NFT, selectedNFTs } from "../stores/NFTs";
import handleOptions from "../utils/options.ts";
import handleNftTiles from "../utils/nftTiles.ts";
import { contract } from "../lib/contract";

let _season: number;
let _episode: number;
let _option: number | null;

let _selectedNFTs: NFT[];
let _inactiveNFTs: NFT[];

season.subscribe((nr) => _season = nr);
episode.subscribe((nr) => _episode = nr);
selectedOption.subscribe((nr) => _option = nr);

selectedNFTs.subscribe((arr) => _selectedNFTs = arr);
inactiveNFTs.subscribe((arr) => _inactiveNFTs = arr);

export default async function vote() {
  console.log('Season: ' + _season);
  console.log('Episode: ' + _episode);
  console.log('Selected option: ' + _option);
  console.log('Selected NFTs: ');
  console.log(_selectedNFTs);

  // if (_selectedNFTs.length == 1) {
  //   const potentialNumber: number = Number(_selectedNFTs[0].name.slice(
  //     _selectedNFTs[0].name.slice().length - 3
  //   ));
  //   await (
  //     await contract()
  //   ).singleVote(_episode, potentialNumber, _option);
  // } else {
  //   const potentialNumbers: number[] = [];
  //   _selectedNFTs.map((nft: any) => {
  //     potentialNumbers.push(nft.name.slice(nft.name.slice().length - 3));
  //   });
  //   const options: number[] = new Array(potentialNumbers.length).fill(
  //     _option
  //   );
  //   await (await contract()).batchVote(_episode, potentialNumbers, options);
  // }

  handleOptions.reset(null);
  
  handleNftTiles.reset();

  console.log('Inactive NFTs: ');
  console.log(_inactiveNFTs);

  alert('Voted.')
}