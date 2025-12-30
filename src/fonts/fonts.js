import { cairoVfs } from "./cairo-vfs";

// vfs الخاص بنا: فيه Cairo فقط
export const vfs = {
  ...cairoVfs,
};

// تعريف الخطوط: نعرّف Cairo فقط
export const fonts = {
  Cairo: {
    normal: "Cairo.ttf", // لازم يطابق المفتاح في 
    bold: "Cairo.ttf", 
    italics: "Cairo.ttf", 
    bolditalics: "Cairo.ttf",
  },
};
