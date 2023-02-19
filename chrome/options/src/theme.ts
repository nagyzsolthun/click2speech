import { blue } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";

const themeBase = createTheme({
  palette: {
    primary: {
      main: "#292",
      light: "#3d3"
    }
  }
});

const theme = createTheme({
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: ["Roboto", "sans-serif"].join(","),
          fontSize: 24,
        },
        h1: {
          fontFamily: ["Roboto", "sans-serif"].join(","),
          fontSize: 42
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          width: "100%"
        }
      }
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          color: themeBase.palette.text.primary,
          backgroundColor: themeBase.palette.background.default
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: themeBase.palette.grey[800],
        },
        indicator: {
          display: "none"
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        textColorInherit: { opacity: 1 },
        root: {
          color: themeBase.palette.background.default,
          fontFamily: ["Roboto", "sans-serif"].join(","),
          fontSize: 24,
          textTransform: "none",
          maxWidth: "none",
          padding: 16,
          transition: "background-color .2s",
          "&.Mui-selected": {
            color: themeBase.palette.background.default,  // otherwise overridden
            backgroundColor: themeBase.palette.primary.main
          },
          "&:hover": { backgroundColor: themeBase.palette.primary.light }
        }
      }
    },
    MuiFormGroup: {
      styleOverrides: {
        root: {
          marginLeft: 48
        }
      }
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          "&:not(.Mui-disabled):hover > .MuiTypography-root": { backgroundColor: themeBase.palette.action.hover },
          "&:not(.Mui-disabled):hover > .MuiButtonBase-root": { color: themeBase.palette.primary.light }
        },
        label: {
          borderRadius: 12,
          transition: "background-color .2s",
        }
      }
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          width: "100%",
          boxSizing: "border-box",
          padding: 24
        }
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontFamily: ["Roboto", "sans-serif"].join(","),
          fontSize: 28,
          color: themeBase.palette.text.primary,
          marginBottom: 8,
          "&.Mui-focused": { color: themeBase.palette.text.primary }  // otherwise overridden
        }
      }
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: 4
        }
      }
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          padding: 4
        }
      }
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          width: "1.2em",
          height: "1.2em"
        }
      }
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          "&:hover .MuiSlider-thumb": { color: themeBase.palette.primary.light },
          "&:hover .MuiSlider-track": { color: themeBase.palette.primary.light }
        },
        rail: {
          color: themeBase.palette.action.active
        },
        valueLabel: {
          fontSize: 24,
          color: themeBase.palette.primary.main,
          backgroundColor: themeBase.palette.background.default,
          border: `1px solid ${themeBase.palette.primary.main}`,
          borderRadius: "4px",
          "&::before": {
            borderBottom: `1px solid ${themeBase.palette.primary.main}`,
            borderRight: `1px solid ${themeBase.palette.primary.main}`
          }
        }
        
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          fontFamily: ["Roboto", "sans-serif"].join(","), // otherwise not set
          fontSize: 16, // if not set, prod is different
          textDecoration: "none",
          color: blue[700],
          margin: 8,
          borderRadius: 12,
          transition: "background-color .2s",
          "&:hover": {
            color: themeBase.palette.text.primary,
            backgroundColor: themeBase.palette.action.hover
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          maxWidth: 'none'
        }
      }
    }
  }
}, themeBase);

export default theme;