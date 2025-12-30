import { cairoVfs } from "./cairo-vfs";

// vfs الخاص بنا: فيه Cairo فقط
export const vfs = {
  ...cairoVfs,
};

// تعريف الخطوط: نعرّف Cairo فقط
export const fonts = {
  Cairo: {
    normal: "Cairo-Regular.ttf",
    bold: "Cairo-Regular.ttf",
    italics: "Cairo-Regular.ttf",
    bolditalics: "Cairo-Regular.ttf",
  },
};
