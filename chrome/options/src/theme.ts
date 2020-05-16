import { blue } from "@material-ui/core/colors";
import { createMuiTheme } from "@material-ui/core";
import createPalette from "@material-ui/core/styles/createPalette";

const palette = createPalette({
  primary: {
    main: "#292",
    light: "#3d3"
  }
});

const theme = createMuiTheme({
  typography: {
    fontSize: 24,
    fontFamily: ["Roboto", "sans-serif"].join(",")
  },
  overrides: {
    MuiPaper: {
      root: {
        width: "100%"
      }
    },
    MuiToolbar: {
      root: {
        color: palette.text.primary,
        backgroundColor: palette.background.default
      }
    },
    MuiTabs: {
      root: {
        color: "white",
        backgroundColor: palette.grey[800],
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
        transition: "background-color .2s",
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
        "&:not(.Mui-disabled):hover > .MuiTypography-root": { backgroundColor: palette.action.hover },
        "&:not(.Mui-disabled):hover > .MuiIconButton-root": { color: palette.primary.light }
      },
      label: {
        borderRadius: 12,
        transition: "background-color .2s",
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
        color: palette.text.primary,
        marginBottom: 8,
        "&$focused": { color: palette.text.primary }
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
        "&:hover .MuiSlider-track": { color: palette.primary.light }
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
        color: palette.action.active
      }
    },
    MuiLink: {
      root: {
        fontFamily: ["Roboto", "sans-serif"].join(","), // otherwise not set
        fontSize: 16, // if not set, prod is different
        color: blue[700],
        margin: 8,
        borderRadius: 12,
        transition: "background-color .2s",
        "&:hover": {
          color: palette.text.primary,
          backgroundColor: palette.action.hover
        }
      },
      underlineHover: {
        "&:hover": { textDecoration: "none" }
      }
    }
  },
  palette
});

export default theme;