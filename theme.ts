import { extendTheme } from '@chakra-ui/react';
import tinycolor from 'tinycolor2';

const baseGreen = '#32FFB2';
const baseGray = '#222222';

const theme = extendTheme({
  colors: {
    green: {
      900: tinycolor(baseGreen).darken(20).toString(),
      800: tinycolor(baseGreen).darken(16).toString(),
      700: tinycolor(baseGreen).darken(12).toString(),
      600: tinycolor(baseGreen).darken(8).toString(),
      500: baseGreen,
      400: tinycolor(baseGreen).lighten(8).toString(),
      300: tinycolor(baseGreen).lighten(12).toString(),
      200: tinycolor(baseGreen).lighten(16).toString(),
      100: tinycolor(baseGreen).lighten(20).toString(),
    },
    gray: {
      900: tinycolor(baseGray).darken(8).toString(),
      800: tinycolor(baseGray).darken(4).toString(),
      700: tinycolor(baseGray).lighten(4).toString(),
      600: tinycolor(baseGray).lighten(8).toString(),
      500: tinycolor(baseGray).lighten(16).toString(),
      400: tinycolor(baseGray).lighten(24).toString(),
      300: tinycolor(baseGray).lighten(32).toString(),
      200: tinycolor(baseGray).lighten(48).toString(),
      100: tinycolor(baseGray).lighten(72).toString(),
    },
  },
});

export default theme;
