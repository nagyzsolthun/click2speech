import { blue } from "@material-ui/core/colors";
import { createMuiTheme } from "@material-ui/core";
import createPalette from "@material-ui/core/styles/createPalette";

const palette = createPalette({
  secondary: { main: "#333" },
  primary: {
    main: "#292",
    light: "#4f4"
  }
});

const theme = createMuiTheme({
  typography: {
    fontSize: 24,
  },
  overrides: {
    MuiPaper: {
      root: {
        width: "100%"
      }
    },
    MuiToolbar: {
      root: {
        color: "black",
        backgroundColor: "white"
      }
    },
    MuiTabs: {
      root: {
        backgroundColor: palette.secondary.main,
      },
      indicator: {
        display: "none"
      }
    },
    MuiTab: {
      textColorInherit: { opacity: 1 },
      root: {
        textTransform: "none",
        maxWidth: "none",
        padding: 12,
        transition: "background-color .2s linear",
        "&$selected": { backgroundColor: palette.primary.main },
        "&:hover": { backgroundColor: palette.primary.light }
      }
    },
    MuiFormGroup: {
      root: {
        marginLeft: 48
      }
    },
    MuiFormControlLabel: {
      root: {
        "&:not(.Mui-disabled):hover > .MuiTypography-root": { backgroundColor: palette.primary.light }
      },
      label: {
        borderRadius: 12,
        transition: "background-color .2s linear",
      }
    },
    MuiFormControl: {
      root: {
        width: "100%",
        boxSizing: "border-box",
        padding: 24
      }
    },
    MuiFormLabel: {
      root: {
        color: "black",
        marginBottom: 8,
        "&$focused": { color: "black" }
      },
    },
    MuiCheckbox: {
      root: {
        padding: 4
      }
    },
    MuiRadio: {
      root: {
        padding: 4
      }
    },
    MuiSvgIcon: {
      root: {
        width: "0.7em",
        height: "0.7em"
      }
    },
    MuiSlider: {
      root: {
        "&:hover .MuiSlider-thumb": { color: palette.primary.light },
        "&:hover .MuiSlider-track": { color: palette.primary.light },
        "&:hover .MuiSlider-rail": { color: palette.secondary.dark }
      },
      thumb: {
        width: 24,
        height: 24,
        marginTop: -12,
        marginLeft: -12,
        color: palette.primary.main,
      },
      track: {
        color: palette.primary.main,
        height: 3
      },
      rail: {
        color: palette.secondary.light
      }
    },
    MuiLink: {
      root: {
        fontSize: 18, // if not set, prod is different
        color: blue[700],
        margin: 8,
        borderRadius: 12,
        "&:hover": {
          color: "black",
          textDecoration: "none", // doesn't work
          backgroundColor: palette.primary.light
        }
      }
    }
  },
  palette
});

export default theme;