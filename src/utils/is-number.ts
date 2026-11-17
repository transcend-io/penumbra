const isNumber = (value: unknown): value is number =>
  value !== null && !Number.isNaN(value);

export default isNumber;
