import vscode, { Uri, type ExtensionContext } from "vscode";

interface ExtensionPaths {
  rootDir: Uri;
  extensionDir: Uri;
  workbenchFile: Uri;
  themesDir: Uri;
}
// export class Paths implements ExtensionPaths {
//   public static async initialize(
//     context: vscode.ExtensionContext,
//     fs: FileSystem,
//   ) {
//     const rootDir = vscode.Uri.file(vscode.env.appRoot);
//     const getWorkbenchFile = async () => {
//       // Above 1.94.0, doesn't seem to exist on 1.96.0
//       const esm = vscode.Uri.joinPath(
//         rootDir,
//         "out/vs/code/electron-sandbox/workbench/workbench.esm.html",
//       );
//       if(await fs.exists(esm)) return esm;

//       const commonJs = vscode.Uri.joinPath(
//         rootDir,
//         "out/vs/code/electron-sandbox/workbench/workbench.html",
//       );
//       if(await fs.exists(commonJs)) return commonJs;

//       // TODO: implement error handling
//       return commonJs;
//     }

//     const extension = vscode.extensions.getExtension("deminearchiver.material-you")!;
//     const extensionDir = extension.extensionUri;

//     return new Paths({
//       rootDir,
//       workbenchFile: await getWorkbenchFile(),
//       extensionDir: extension.extensionUri,
//       themesDir: Uri.joinPath(extensionDir, "themes"),
//     });
//   }



//   private constructor(
//     private readonly paths: ExtensionPaths,
//   ) {}

//   public get rootDir() {
//     return this.paths.rootDir;
//   }

//   public get workbenchFile() {
//     return this.paths.workbenchFile;
//   }

//   public get extensionDir() {
//     return this.paths.extensionDir;
//   }
//   public get themesDir() {
//     return this.paths.themesDir;
//   }
// }

export class FileSystem {
  public constructor() {

  }

  public async exists(uri: Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch(error) {
      return false;
    }
  }

  public async readFileString(uri: Uri){
    const value = await vscode.workspace.fs.readFile(uri);
    return new TextDecoder().decode(value);
  }

  public async writeFileString(uri: Uri, value: string) {
    const encoded = new TextEncoder().encode(value);
    await vscode.workspace.fs.writeFile(uri, encoded);
  }

  public async rename(source: Uri, target: Uri, overwrite: boolean = true) {
    await vscode.workspace.fs.rename(source, target);
  }
}

export class Extension {
  public constructor(
    public readonly extension: vscode.Extension<any>,
    public readonly configurationId: string,
  ) {

  }

  public get publisher() {
    return this.extension.id.split(".", 2)[0];
  }
  public get name() {
    return this.extension.id.split(".", 2)[1];
  }

  public get configuration() {
    return this.getConfiguration();
  }

  public getConfiguration(section: string = this.configurationId) {
    return vscode.workspace.getConfiguration(section);
  }
}

export class Context {
  public constructor(
    private readonly extension: Extension,
    private readonly context: vscode.ExtensionContext,
  ) {}

  public get disposables() {
    return this.context.subscriptions as vscode.Disposable[];
  }

  public registerDisposable(disposable: vscode.Disposable) {
    this.context.subscriptions.push(disposable);
  }
  public registerDisposables(...disposables: vscode.Disposable[]) {
    this.context.subscriptions.push(...disposables);
  }
  public registerCommand(command: string, callback: () => void, thisArg?: any) {
    const disposable = vscode.commands.registerCommand(`${this.extension.name}.${command}`, callback, thisArg);
    this.registerDisposable(disposable);
  }
  public registerCommands(commands: Record<string, () => void>, thisArg?: any) {
    for(const command in commands) {
      this.registerCommand(command, commands[command], thisArg);
    }
  }
}

export abstract class Runtime {
  public constructor(
    protected readonly extension: Extension,
  ) {}
}
