import { Lato, Roboto } from 'next/font/google';
import localFont from 'next/font/local';

// Define Lato font
export const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
  display: 'swap',
});

// Define Roboto font
export const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-roboto',
  display: 'swap',
});

// Define local Delight font
export const delight = localFont({
  src: [
    {
      path: '../public/fonts/delight/delight-thin.otf',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../public/fonts/delight/delight-extralight.otf',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../public/fonts/delight/delight-light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/delight/delight-regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/delight/delight-medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/delight/delight-semibold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/delight/delight-bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/delight/delight-extrabold.otf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/delight/delight-black.otf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-delight',
  display: 'swap',
});
