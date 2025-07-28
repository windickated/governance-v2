<button class="void-btn flex rotate-animation" disabled>
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <!-- Gradient for red arc -->
      <linearGradient id="red-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgba(255, 60, 64, 1)" />
        <stop offset="100%" stop-color="rgb(255, 60, 64, 0)" />
      </linearGradient>

      <!-- Gradient for blue arc -->
      <linearGradient id="blue-gradient" x1="100%" y1="0%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="rgba(56, 117, 250, 1)" />
        <stop offset="100%" stop-color="rgba(56, 117, 250, 0)" />
      </linearGradient>
    </defs>

    <circle
      cx="32"
      cy="32"
      r="28"
      fill="none"
      stroke="url(#red-gradient)"
      stroke-width="10"
      stroke-linecap="round"
      stroke-dasharray="88 88"
    />

    <circle
      cx="32"
      cy="32"
      r="28"
      fill="none"
      stroke="url(#blue-gradient)"
      stroke-width="10"
      stroke-linecap="round"
      stroke-dasharray="88 88"
      stroke-dashoffset="88"
    />
  </svg>
</button>

<style>
  button {
    width: 2rem;
    cursor: wait !important;

    svg {
      width: 1.75rem;
      height: 1.75rem;
    }
  }
</style>
