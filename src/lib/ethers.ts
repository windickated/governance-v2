import detectProvider from '@metamask/detect-provider';
import { BrowserProvider } from "ethers";

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
        return false;
    }

    provider = new BrowserProvider(metamaskProvider, "any");

    metamaskProvider.on("chainChanged", () => {
        window.location.reload();
    });

    return true;
}
