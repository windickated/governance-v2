<script lang="ts">
  let {
    focused = null,
    disabled = false,
    hideForMobiles = false,
    glowing = false,
    color = '#33e2e6',
    selectorSize = 1.5,
    rotate = null,
  }: {
    focused: Nullable<number | boolean>;
    disabled: boolean;
    hideForMobiles: boolean;
    glowing?: boolean;
    color?: string;
    selectorSize?: number;
    rotate?: Nullable<string>;
  } = $props();
</script>

<svg
  class:focused
  class:disabled={disabled && !focused}
  class:pc-only={hideForMobiles}
  class:inherit-color={rotate}
  xmlns="http://www.w3.org/2000/svg"
  viewBox="-100 -100 200 200"
  stroke-width="20"
  stroke-linecap="round"
  stroke-linejoin="round"
  style:fill={color}
  style:stroke={color}
  style:width="{selectorSize}rem"
  style:height="{selectorSize}rem"
  style:transform="rotate({rotate}deg)"
>
  <polygon points="-40 -90 -40 90 50 0" />
  {#if glowing}
    <animate
      attributeName="fill"
      values="rgb(51,226,230);rgb(160,120,255);rgb(56,117,250);rgb(51,226,230)"
      dur="15s"
      repeatCount="indefinite"
      begin="-1.5s"
    />
    <animate
      attributeName="stroke"
      values="rgb(51,226,230);rgb(160,120,255);rgb(56,117,250);rgb(51,226,230)"
      dur="15s"
      repeatCount="indefinite"
      begin="-1.5s"
    />
  {/if}
</svg>

<style lang="scss">
  @use '/src/styles/mixins' as *;

  svg {
    flex: none;

    &.focused {
      polygon {
        transform: scaleX(1.5);
      }
    }

    &.inherit-color {
      stroke: inherit !important;
      fill: inherit !important;
    }
  }
</style>
