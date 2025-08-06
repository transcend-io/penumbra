const isNumber = (value: unknown): value is number =>
  value !== null && !Number.isNaN(value as number);

export default isNumber;
