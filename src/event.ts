export const PenumbraEvent =
  self.CustomEvent || (self.Event as unknown as typeof self.CustomEvent);
