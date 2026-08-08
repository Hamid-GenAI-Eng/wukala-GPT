// Event Bus for Global Reactivity
// Dispatched whenever a mutation occurs (POST/PUT/DELETE) to force global state refreshes.

export const WUKALA_MUTATION_EVENT = 'WukalaMutation';

export const triggerGlobalRefresh = () => {
  window.dispatchEvent(new Event(WUKALA_MUTATION_EVENT));
};
