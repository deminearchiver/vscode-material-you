import vscode from "vscode";
import { Extension, FileSystem, Runtime, Context } from "./extension";
import { argbFromHex, Hct, SchemeContent, SchemeExpressive, SchemeFidelity, SchemeFruitSalad, SchemeMonochrome, SchemeNeutral, SchemeRainbow, SchemeTonalSpot, SchemeVibrant, type DynamicScheme } from "@material/material-color-utilities";
import { createColorTheme, createCssProperties, extractColorScheme, type ColorScheme } from "../theme";

type SchemeConstructor = new (sourceColorHct: Hct, isDark: boolean, contrastLevel: number) => DynamicScheme;
type SchemeVariant = keyof typeof SCHEME_VARIANTS;

const SCHEME_VARIANTS = {
  "monochrome": SchemeMonochrome,
  "neutral": SchemeNeutral,
  "tonalSpot": SchemeTonalSpot,
  "vibrant": SchemeVibrant,
  "expressive": SchemeExpressive,
  "fidelity": SchemeFidelity,
  "content": SchemeContent,
  "rainbow": SchemeRainbow,
  "fruitSalad": SchemeFruitSalad,
} satisfies Record<string, SchemeConstructor>;

class MaterialYouRuntime extends Runtime {
  private readonly context: Context;
  private readonly fs: FileSystem;

  public constructor(context: vscode.ExtensionContext) {
    super(
      new Extension(
        context.extension,
        "materialYou"
      )
    );

    this.fs = new FileSystem();
    this.context = new Context(this.extension, context);

    this.updateDynamicThemes();

    vscode.workspace.onDidChangeConfiguration(
      this.onDidChangeConfiguration,
      this,
      this.context.disposables,
    );

    this.context.registerCommand(
      "helloWorld",
      async () => {
        await vscode.window.showInformationMessage("Hello World!", {detail: "Detail", modal: true}, "cancel", "ok");
      },
      this,
    );
    this.context.registerCommand("applyStyles", this.applyStyles, this);
    this.context.registerCommand("removeStyles", this.removeStyles, this);
  }

  private async applyStyles() {
    await this.updateAllThemes();

    const reloadWindowLabel = "Reload window";
      const cancelLabel = "Cancel";
      const selected = await vscode.window.showInformationMessage(
      "To apply styles you need to restart Visual Studio Code",
      {
        detail: "",
        modal: false,
      },
      reloadWindowLabel, cancelLabel,
    );
    if(selected === reloadWindowLabel) {
      await vscode.commands.executeCommand("workbench.action.reloadWindow");
    }

    const dynamicScheme = new SchemeTonalSpot(Hct.fromInt(0xff6750a4), true, 0);
    const colorScheme = extractColorScheme(dynamicScheme);
    const cssProperties = createCssProperties(colorScheme);
    const cssLines = Object.entries(cssProperties)
      .map(([property, value]) => `  ${property}: ${value};`)
      .join("\n");
    const css = `:root {\n${cssLines}\n}`;
    console.log(css);
  }

  private async removeStyles() {

  }


  private async onDidChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
    const id = this.extension.configurationId;
    if(
      event.affectsConfiguration(`${id}.seedColor`) ||
      event.affectsConfiguration(`${id}.colorContrast`) ||
      event.affectsConfiguration(`${id}.schemeVariant`)
    ) {
      await this.updateAllThemes();

      const reloadWindowLabel = "Reload window";
      const cancelLabel = "Cancel";
      const selected = await vscode.window.showInformationMessage(
        "Reload window to apply Material You styles",
        {
          detail: "Theme configuration has changed",
          modal: false,
        },
        reloadWindowLabel, cancelLabel,
      );
      if(selected === reloadWindowLabel) {
        await vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
    }
  }

  private getDynamicScheme(brightness: "light" | "dark"): DynamicScheme {
    const configuration = this.extension.configuration;

    const schemeVariant = configuration.get<SchemeVariant>("schemeVariant")!;
    const seedColor = configuration.get<string>("seedColor")!;
    const contrastLevel = configuration.get<number>("colorContrast");

    const Scheme = SCHEME_VARIANTS[schemeVariant];

    return new Scheme(
      Hct.fromInt(argbFromHex(seedColor)),
      brightness === "dark",
      contrastLevel ?? 0,
    );
  }

  private async updateAllThemes() {
    await Promise.all([
      await this.updateStaticThemes(),
      await this.updateDynamicThemes(),
    ]);
  }

  private async updateStaticThemes() {
    const seedColor = Hct.fromInt(0xff6750a4);
    const lightExists = await this.themeFileExists("static-light");
    if(!lightExists) {
      const scheme = new SchemeTonalSpot(seedColor, false, 0);
      const colors = extractColorScheme(scheme);
      this.writeThemeFile("static-light", createColorTheme(colors));
    }
    const darkExists = await this.themeFileExists("static-light");
    if(!darkExists) {
      const scheme = new SchemeTonalSpot(seedColor, true, 0);
      const colors = extractColorScheme(scheme);
      this.writeThemeFile("static-dark", createColorTheme(colors));
    }
  }

  private async updateDynamicThemes() {
    const lightScheme = this.getDynamicScheme("light");
    const lightColors = extractColorScheme(lightScheme);

    const darkScheme = this.getDynamicScheme("dark");
    const darkColors = extractColorScheme(darkScheme);

    await Promise.all([
      this.writeThemeFile("dynamic-light", createColorTheme(lightColors)),
      this.writeThemeFile("dynamic-dark", createColorTheme(darkColors)),
    ]);
  }

  private async themeFileExists(id: string) {
    const themesDir = this.extension.extension.extensionUri;
    const path = vscode.Uri.joinPath(themesDir, `${id}.json`);
    return this.fs.exists(path);
  }

  private async writeThemeFile(id: string, theme: any) {
    // const themesDir = vscode.Uri.joinPath(this.extension.extension.extensionUri, "themes");
    const themesDir = this.extension.extension.extensionUri;
    await this.fs.writeFileString(
      vscode.Uri.joinPath(themesDir, `${id}.json`),
      JSON.stringify(theme),
    );
  }
}

export function activate(context: vscode.ExtensionContext) {
  new MaterialYouRuntime(context);
}

export function deactivate() {}
