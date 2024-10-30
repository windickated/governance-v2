import { season, episode, selectedOption } from "../stores/storyNode";
import { NFT, selectedNFTs, inactiveNFTs } from "../stores/NFTs";
import handleOptions from "../utils/options.ts";
import handleNftTiles from "../utils/nftTiles.ts";

let _season: number;
let _episode: number | null;
let _option: number | null;

let _selectedNFTs: NFT[];
let _inactiveNFTs: NFT[];

season.subscribe((nr) => _season = nr);
episode.subscribe((nr) => _episode = nr);
selectedOption.subscribe((nr) => _option = nr);

selectedNFTs.subscribe((arr) => _selectedNFTs = arr);
inactiveNFTs.subscribe((arr) => _inactiveNFTs = arr);

export default function vote() {
  console.log('Season: ' + _season);
  console.log('Episode: ' + _episode);
  console.log('Selected option: ' + _option);
  console.log(_selectedNFTs);

  handleOptions.reset(null);
  handleNftTiles.reset();

  selectedNFTs.set([]);
}