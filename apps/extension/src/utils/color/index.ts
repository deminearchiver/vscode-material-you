import { redFromArgb, greenFromArgb, blueFromArgb, alphaFromArgb } from "@material/material-color-utilities";

export const rgbaFromArgb = (argb: number): number => {
  const red = redFromArgb(argb);
  const green = greenFromArgb(argb);
  const blue = blueFromArgb(argb);
  const alpha = alphaFromArgb(argb);
  return (
    (red << 24) |
    (green << 16) |
    (blue << 8) |
    alpha
  );
}
