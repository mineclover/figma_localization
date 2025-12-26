// strnum.d.ts
declare module 'strnum' {
  export default function toNumber(
    str: string,
    options?: {
      hex?: boolean
      // oct?: boolean;
      // leadingZeros?: boolean;
      decimalPoint?: string
      eNotation?: boolean
      skipLike?: RegExp
    },
  ): number | string
}
