import detectProvider from '@metamask/detect-provider';
import { BrowserProvider } from "ethers";
import { userProvider } from '../stores/auth';

export let provider: BrowserProvider;
let metamaskProvider: any;

export const network = {
    chainName: "Base",
    chainId: "0x2105",
    rpcUrls: ["https://mainnet.base.org"],
    nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18
    },
    blockExplorerUrls: ["https://basescan.org"]
}

export const switch_network = () => {
    metamaskProvider.request({
        method: "wallet_addEthereumChain",
        params: [network]
    });
}

export const metamask_init = async(): Promise<boolean> => {
    metamaskProvider = await detectProvider() as any;

    if (metamaskProvider === null) {
        console.log("No browser wallet detected. Using Base provider.");
        return false;
    }

    provider = new BrowserProvider(metamaskProvider, "any");

    userProvider.subscribe((res) => console.log(res))
    console.log("Detected browser provider");
    console.log(metamaskProvider)

    metamaskProvider.on("chainChanged", () => {
        window.location.reload();
    });

    return true;
}
