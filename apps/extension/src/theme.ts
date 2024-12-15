import vscode, { type Color } from "vscode";
import { DynamicScheme, Hct, hexFromArgb, MaterialDynamicColors, SchemeTonalSpot } from "@material/material-color-utilities";

export type SchemeVariant =
  | "monochrome"
  | "neutral"
  | "tonalSpot"
  | "vibrant"
  | "expressive"
  | "fidelity"
  | "content"
  | "rainbow"
  | "fruitSalad";

export type ColorScheme<T> = {
  primaryPaletteKeyColor: T;
  secondaryPaletteKeyColor: T;
  tertiaryPaletteKeyColor: T;
  neutralPaletteKeyColor: T;
  neutralVariantPaletteKeyColor: T;
  background: T;
  onBackground: T;
  surface: T;
  surfaceDim: T;
  surfaceBright: T;
  surfaceContainerLowest: T;
  surfaceContainerLow: T;
  surfaceContainer: T;
  surfaceContainerHigh: T;
  surfaceContainerHighest: T;
  onSurface: T;
  surfaceVariant: T;
  onSurfaceVariant: T;
  inverseSurface: T;
  inverseOnSurface: T;
  outline: T;
  outlineVariant: T;
  shadow: T;
  scrim: T;
  surfaceTint: T;
  primary: T;
  onPrimary: T;
  primaryContainer: T;
  onPrimaryContainer: T;
  inversePrimary: T;
  secondary: T;
  onSecondary: T;
  secondaryContainer: T;
  onSecondaryContainer: T;
  tertiary: T;
  onTertiary: T;
  tertiaryContainer: T;
  onTertiaryContainer: T;
  error: T;
  onError: T;
  errorContainer: T;
  onErrorContainer: T;
  primaryFixed: T;
  primaryFixedDim: T;
  onPrimaryFixed: T;
  onPrimaryFixedVariant: T;
  secondaryFixed: T;
  secondaryFixedDim: T;
  onSecondaryFixed: T;
  onSecondaryFixedVariant: T;
  tertiaryFixed: T;
  tertiaryFixedDim: T;
  onTertiaryFixed: T;
  onTertiaryFixedVariant: T;

  highestSurface: T;
}



export const extractColorScheme = (scheme: DynamicScheme): ColorScheme<number> => {
  return {
    primaryPaletteKeyColor: scheme.primaryPaletteKeyColor,
    secondaryPaletteKeyColor: scheme.secondaryPaletteKeyColor,
    tertiaryPaletteKeyColor: scheme.tertiaryPaletteKeyColor,
    neutralPaletteKeyColor: scheme.neutralPaletteKeyColor,
    neutralVariantPaletteKeyColor: scheme.neutralVariantPaletteKeyColor,
    background: scheme.background,
    onBackground: scheme.onBackground,
    surface: scheme.surface,
    surfaceDim: scheme.surfaceDim,
    surfaceBright: scheme.surfaceBright,
    surfaceContainerLowest: scheme.surfaceContainerLowest,
    surfaceContainerLow: scheme.surfaceContainerLow,
    surfaceContainer: scheme.surfaceContainer,
    surfaceContainerHigh: scheme.surfaceContainerHigh,
    surfaceContainerHighest: scheme.surfaceContainerHighest,
    onSurface: scheme.onSurface,
    surfaceVariant: scheme.surfaceVariant,
    onSurfaceVariant: scheme.onSurfaceVariant,
    inverseSurface: scheme.inverseSurface,
    inverseOnSurface: scheme.inverseOnSurface,
    outline: scheme.outline,
    outlineVariant: scheme.outlineVariant,
    shadow: scheme.shadow,
    scrim: scheme.scrim,
    surfaceTint: scheme.surfaceTint,
    primary: scheme.primary,
    onPrimary: scheme.onPrimary,
    primaryContainer: scheme.primaryContainer,
    onPrimaryContainer: scheme.onPrimaryContainer,
    inversePrimary: scheme.inversePrimary,
    secondary: scheme.secondary,
    onSecondary: scheme.onSecondary,
    secondaryContainer: scheme.secondaryContainer,
    onSecondaryContainer: scheme.onSecondaryContainer,
    tertiary: scheme.tertiary,
    onTertiary: scheme.onTertiary,
    tertiaryContainer: scheme.tertiaryContainer,
    onTertiaryContainer: scheme.onTertiaryContainer,
    error: scheme.error,
    onError: scheme.onError,
    errorContainer: scheme.errorContainer,
    onErrorContainer: scheme.onErrorContainer,
    primaryFixed: scheme.primaryFixed,
    primaryFixedDim: scheme.primaryFixedDim,
    onPrimaryFixed: scheme.onPrimaryFixed,
    onPrimaryFixedVariant: scheme.onPrimaryFixedVariant,
    secondaryFixed: scheme.secondaryFixed,
    secondaryFixedDim: scheme.secondaryFixedDim,
    onSecondaryFixed: scheme.onSecondaryFixed,
    onSecondaryFixedVariant: scheme.onSecondaryFixedVariant,
    tertiaryFixed: scheme.tertiaryFixed,
    tertiaryFixedDim: scheme.tertiaryFixedDim,
    onTertiaryFixed: scheme.onTertiaryFixed,
    onTertiaryFixedVariant: scheme.onTertiaryFixedVariant,
    highestSurface: scheme.isDark ? scheme.surfaceBright : scheme.surfaceDim,
  }
}

export const stringifyColorScheme = (scheme: ColorScheme<number>): ColorScheme<string> => {
  const stringified = {} as ColorScheme<string>;
  for(const role in scheme) {
    stringified[role as keyof typeof stringified] = hexFromArgb(scheme[role as keyof typeof scheme])
  }
  return stringified;
}


const TRANSPARENT = "#00000000";

const camelCaseToKebabCase = (str: string) => {
  return str.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    (substring, ofs) => `${ofs ? "-" : ""}${substring.toLowerCase()}`,
  )
}

export const createCssProperties = (scheme: ColorScheme<number>) => {
  const hex = stringifyColorScheme(scheme);
  const properties: Record<string, string> = {};
  for(const role in hex) {
    const color = hex[role as keyof typeof hex];
    const propertyName = camelCaseToKebabCase(role);
    const property = `--md-sys-color-${propertyName}`;
    properties[property] = color;
  }
  return properties;
}

export const createColorTheme = (scheme: ColorScheme<number>) => {
  const hex = stringifyColorScheme(scheme);

  const extensionColors: Record<string, string> = {};
  const ext = {} as ColorScheme<vscode.ThemeColor>;
  for(const role in hex) {
    extensionColors[`materialYou.${role}`] = hex[role as keyof typeof hex];
    ext[role as keyof typeof ext] = new vscode.ThemeColor(`materialYou.${role}`);
  }


  return {
    name: "Material You Light",
    colors: {
      ...extensionColors,

      "focusBorder": hex.secondary,
      "foreground": hex.onSurface,
      "icon.foreground": hex.onSurfaceVariant,

      "window.activeBorder": hex.secondary,
      "window.inactiveBorder": hex.outlineVariant,

      "button.background": hex.primary,
      "button.foreground": hex.onPrimary,
      "button.secondaryBackground": hex.secondaryContainer,
      "button.secondaryForeground": hex.onSecondaryContainer,

      "checkbox.background": hex.primary,
      "checkbox.foreground": hex.onPrimary,
      "checkbox.border": hex.primary,
      "checkbox.selectBackground": hex.primary,
      "checkbox.selectBorder": hex.primary,

      "radio.activeForeground": hex.primary,
      "radio.activeBackground": TRANSPARENT,
      "radio.activeBorder": hex.primary,
      "radio.inactiveForeground": hex.onSurfaceVariant,
      "radio.inactiveBackground": TRANSPARENT,
      "radio.inactiveBorder": hex.onSurfaceVariant,
      // "radio.inactiveHoverBackground": ,

      "dropdown.border": TRANSPARENT,

      "input.background": hex.surfaceContainerHighest,
      "input.border": hex.primary,
      "input.foreground": hex.onSurface,
      "input.placeholderForeground": hex.onSurfaceVariant,

      "badge.background": hex.error,
      "badge.foreground": hex.onError,


      "activityBar.background": hex.surfaceContainer,
      "activityBar.inactiveForeground": hex.onSurfaceVariant,
      "activityBar.activeBackground": hex.secondaryContainer,
      "activityBar.activeBorder": TRANSPARENT,
      "activityBar.foreground": hex.onSecondaryContainer,

      "activityBarBadge.background": hex.error,
      "activityBarBadge.foreground": hex.onError,


      "sideBar.background": hex.surfaceContainer,
      "sideBarTitle.foreground": hex.onSurface,

      // "editorGroup.border": ,
      // "editorGroup.dropBackground": ,
      // "editorGroup.dropBackground"  ,
      // "editorGroupHeader.noTabsBackground": ,
      // "editorGroupHeader.noTabsBackground"  ,
      "editorGroupHeader.tabsBackground": hex.surfaceContainerLow,
      // "editorGroupHeader.tabsBorder": ,
      // "editorGroupHeader.tabsBorder" ,
      // "editorGroupHeader.border": ,
      // "editorGroup.emptyBackground": ,
      // "editorGroup.focusedEmptyBorder": ,
      // "editorGroup.dropIntoPromptForeground": ,
      // "editorGroup.dropIntoPromptBackground": ,
      // "editorGroup.dropIntoPromptBorder": ,
      // "tab.activeBackground": ,
      // "tab.unfocusedActiveBackground": ,
      // "tab.activeForeground": ,
      // "tab.border": ,
      // "tab.activeBorder": ,
      // "tab.selectedBorderTop": ,
      // "tab.selectedBackground": ,
      // "tab.selectedForeground": ,
      // "tab.dragAndDropBorder": ,
      // "tab.unfocusedActiveBorder": ,
      // "tab.activeBorderTop": ,
      // "tab.unfocusedActiveBorderTop": ,
      // "tab.lastPinnedBorder": ,
      // "tab.inactiveBackground": ,
      // "tab.unfocusedInactiveBackground": ,
      // "tab.inactiveForeground": ,
      // "tab.unfocusedActiveForeground": ,
      // "tab.unfocusedInactiveForeground": ,
      // "tab.hoverBackground": ,
      // "tab.unfocusedHoverBackground": ,
      // "tab.hoverForeground": ,
      // "tab.unfocusedHoverForeground": ,
      // "tab.hoverBorder": ,
      // "tab.unfocusedHoverBorder": ,
      // "tab.activeModifiedBorder": ,
      // "tab.inactiveModifiedBorder": ,
      // "tab.unfocusedActiveModifiedBorder": ,
      // "tab.unfocusedInactiveModifiedBorder": ,
      // "editorPane.background": ,
      // "sideBySideEditor.horizontalBorder": ,
      // "sideBySideEditor.verticalBorder": ,

      "editor.background": hex.surface,
      "editor.foreground": hex.onSurface,
      // "editorLineNumber.foreground": ,
      // "editorLineNumber.activeForeground": ,
      // "editorLineNumber.dimmedForeground": ,
      // "editorCursor.background": ,
      "editorCursor.foreground": hex.primary,
      // "editorMultiCursor.primary.background": ,
      "editorMultiCursor.primary.foreground": hex.primary,
      // "editorMultiCursor.secondary.background" ,
      "editorMultiCursor.secondary.foreground": hex.secondary ,
      "editor.placeholder.foreground": hex.onSurfaceVariant,
      // "editor.compositionBorder": ,

      "panel.background": hex.surfaceContainer,
      "panel.border": TRANSPARENT,
      "panel.foreground": hex.onSurface,

      "titleBar.activeBackground": hex.surfaceContainer,
      "titleBar.activeForeground": hex.onSurfaceVariant,
      "titleBar.inactiveBackground": hex.highestSurface,
      "titleBar.inactiveForeground": hex.onSurfaceVariant,
      "titleBar.border": TRANSPARENT,

      // "menubar.selectionForeground": ,
      // "menubar.selectionBackground": ,
      // "menubar.selectionBorder": ,
      "menu.background": hex.surfaceContainer,
      "menu.foreground": hex.onSurface,
      "menu.selectionBackground": hex.secondaryContainer,
      "menu.selectionForeground": hex.onSecondaryContainer,
      // "menu.selectionBorder": ,
      "menu.separatorBackground": hex.surfaceVariant,
      // "menu.border": ,


      "commandCenter.foreground": hex.onSurfaceVariant,
      "commandCenter.activeForeground": hex.onSurface,
      "commandCenter.background": hex.surfaceContainerHighest,
      "commandCenter.activeBackground": hex.surfaceContainerHighest,
      "commandCenter.border": TRANSPARENT,
      // "commandCenter.inactiveForeground": ,
      "commandCenter.inactiveBorder": TRANSPARENT,
      "commandCenter.activeBorder": TRANSPARENT,
      // "commandCenter.debuggingBackground": ,

      "notificationCenter.border": TRANSPARENT,
      // "notificationCenterHeader.foreground": ,
      // "notificationCenterHeader.background": ,
      "notificationToast.border": TRANSPARENT,
      "notifications.background": hex.surfaceContainerHighest,
      "notifications.foreground": hex.onSurface,
      // "notifications.border": ,
      // "notificationLink.foreground": ,
      // "notificationsErrorIcon.foreground": ,
      // "notificationsWarningIcon.foreground": ,
      // "notificationsInfoIcon.foreground": ,

      "settings.headerForeground": hex.onSurface,
      "settings.modifiedItemIndicator": hex.primary,
      "settings.dropdownBackground": hex.surfaceContainerHighest,
      "settings.dropdownForeground": hex.onSurface,
      "settings.dropdownBorder": hex.primary,
      // "settings.dropdownListBorder": ,
      "settings.checkboxBackground": hex.primary,
      "settings.checkboxForeground": hex.onPrimary,
      "settings.checkboxBorder": hex.primary,
      // "settings.rowHoverBackground": ,
      "settings.textInputBackground": hex.surfaceContainerHighest,
      "settings.textInputForeground": hex.onSurface,
      "settings.textInputBorder": hex.primary,
      "settings.numberInputBackground": hex.surfaceContainerHighest,
      "settings.numberInputForeground": hex.onSurface,
      "settings.numberInputBorder": hex.primary,
      // "settings.focusedRowBackground": ,
      // "settings.focusedRowBorder": ,
      // "settings.headerBorder": ,
      // "settings.sashBorder": ,
      // "settings.settingsHeaderHoverForeground": ,
    },
  };
}
