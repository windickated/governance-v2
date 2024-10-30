import { season, episode, option } from "../stores/storyNode";
import { NFT, selectedNFTs, inactiveNFTs } from "../stores/NFTs";

let _season: number;
let _episode: number | null;
let _option: number | null;

let _selectedNFTs: NFT[];
let _inactiveNFTs: NFT[];

season.subscribe((nr) => _season = nr);
episode.subscribe((nr) => _episode = nr);
option.subscribe((nr) => _option = nr);

selectedNFTs.subscribe((arr) => _selectedNFTs = arr);
inactiveNFTs.subscribe((arr) => _inactiveNFTs = arr);

export default function vote() {
  console.log('Season: ' + _season);
  console.log('Episode: ' + _episode);
  console.log('Selected option: ' + _option);
  console.log(_selectedNFTs);

  selectedNFTs.set([]);
}