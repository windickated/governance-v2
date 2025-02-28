<script>
  import { onMount } from "svelte";
  import { createRoot } from "react-dom/client";

  import RainbowConnect from "./Rainbow";

  export let linking = false;
  export let title = "Connect Wallet";

  onMount(() => {
    const reactRoot = document.getElementById("react-root");
    if (reactRoot) {
      const root = createRoot(reactRoot); // Create a root
      root.render(RainbowConnect(linking, title));
    }
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div id="react-root"></div>
