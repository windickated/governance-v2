<script>
  import { onMount } from "svelte";
  import { createRoot } from "react-dom/client";

  import RainbowConnect from "./Rainbow";

  onMount(() => {
    const reactRoot = document.getElementById("react-root");
    if (reactRoot) {
      const root = createRoot(reactRoot); // Create a root
      root.render(RainbowConnect());
    }
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div id="react-root"></div>
