const isNumber = (value: unknown): value is number =>
  value !== null && !isNaN(value as number);

export default isNumber;
