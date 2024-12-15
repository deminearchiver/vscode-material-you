import * as vscode from "vscode";
import type { ColorTheme } from "./types";
import { alphaFromArgb, argbFromHex, blueFromArgb, greenFromArgb, Hct, redFromArgb, SchemeTonalSpot } from "@material/material-color-utilities";
import { rgbaFromArgb } from "./utils/color";
import { exists, writeFileString } from "./utils/fs";
import { Runtime } from "./utils/extension";

// const rootDir = vscode.Uri.file(vscode.env.appRoot);

// // const extension = vscode.extensions.getExtension("deminearchiver.material-you")!;
// // const themesDir = vscode.Uri.joinPath(extension.extensionUri, "themes");
// // const packageJson = extension.packageJSON;

// const getWorkbenchFile = async () => {
//   // Above 1.94.0, doesn't seem to exist on 1.96.0
//   const esm = vscode.Uri.joinPath(
//     rootDir,
//     "out/vs/code/electron-sandbox/workbench/workbench.esm.html",
//   );
//   if(await exists(esm)) return esm;

//   const commonJs = vscode.Uri.joinPath(
//     rootDir,
//     "out/vs/code/electron-sandbox/workbench/workbench.html",
//   );
//   if(await exists(commonJs)) return commonJs;

//   // TODO: implement error handling
//   return commonJs;
// }

// const writeThemeFile = async (id: string, theme: ColorTheme) => {
//   const extension = vscode.extensions.getExtension("deminearchiver.material-you")!;
//   const themesDir = vscode.Uri.joinPath(extension.extensionUri, "themes");
//   await writeFileString(
//     vscode.Uri.joinPath(themesDir, `${id}.json`),
//     JSON.stringify(theme),
//   );
// }

// const writeWorkbenchFile = async (context: vscode.ExtensionContext, workbenchHtml: string) => {
//   const workbenchFile = await getWorkbenchFile();
//   const onSuccess = () => {
//     vscode.commands.executeCommand("workbench.action.reloadWindow");
//   }

//   try {
//     await writeFileString(workbenchFile, workbenchHtml);
//     onSuccess();
//   } catch {
//     const tempFile = vscode.Uri.joinPath(context.globalStorageUri, "workbench.html");
//     await writeFileString(tempFile, workbenchHtml);
//     const moveCommand = process.platform.includes("win") ? "move" : "mv";
//     const command = `${moveCommand} "${tempFile.fsPath}" "${workbenchFile.fsPath}"`;

//     const sudo = await import("@vscode/sudo-prompt");
//     sudo.exec(
//       command,
//       { name: "Visual Studio Code" },
//       async (error: any) => {
//         if (error) {
//           await vscode.workspace.fs.delete(tempFile);
//           // vscode.window.showErrorMessage(message, button).then(async action => {
//           //   if (action == button) {
//           //     const body = `**OS:** ${process.platform}\n**Visual Studio Code:** ${vscode.version}\n**Error:** \`${message}\``
//           //     vscode.env.openExternal(
//           //       vscode.Uri.parse(packageJson.repository.url + `/issues/new?body=${encodeURIComponent(body)}`)
//           //     )
//           //   }
//           // })
//           await vscode.window.showErrorMessage(
//             /EPERM|EACCES|ENOENT/.test(error.code)
//               ? "Permission denied. Run editor as admin and try again."
//               : error.message
//           )
//         } else onSuccess();
//       }
//     );
//   }
// }


// const toInlineCode = (code: string) => {
//   if (/^<[^>]+>/.test(code)) return code
//   const isCss = /\{[^}]+:[^}]+\}/.test(code)
//   return `<${isCss ? 'style' : 'script'}>${code}</${isCss ? 'style' : 'script'}>`
// }

// const onCommandApplyStyles = async (context: vscode.ExtensionContext) => {
//   const inject = settings().get<string[]>('inject', [])
//   let code = ''

//   for (const line of inject) {
//     const isFile = line.endsWith('.css') || line.endsWith('.js')
//     if (isFile) {
//       try {
//         if (line.startsWith('https://')) {
//           vscode.window.showInformationMessage('Fetching ' + line)
//           const response = await fetch(line)
//           if (response.ok) {
//             code += toInlineCode(await response.text())
//           } else throw new Error(response.statusText)
//         } else {
//           const uri = normalizeLocalInjectPath(line)
//           await vscode.workspace.fs.stat(uri)
//           if (uri.fsPath.startsWith(extensionUri.fsPath)) {
//             const withSchema = uri.with({ scheme: 'vscode-file', authority: 'vscode-app' })
//             code += line.endsWith('.css')
//               ? `\n<link rel="stylesheet" href="${withSchema.toString()}">\n`
//               : `\n<script src="${withSchema.toString()}"></script>\n`
//           } else {
//             // External `src`, `href` is blocked by CORS.
//             code += toInlineCode(await readFile(uri))
//           }
//         }
//       } catch (error: any) {
//         errorNotification(`${line}: ${error.message}`)
//       }
//     } else code += toInlineCode(line)
//   }

//   let html = await readFileString(workbenchFile)
//   html = clearInjection(html)
//     .replace(/<meta.*http-equiv="Content-Security-Policy".*?>/s, "")
//     .replace(/\n*?<\/html>/, `\n\n<!--material-code-->${code}<!--material-code-->\n\n</html>`)
//   await writeWorkbenchFile(context, html);
// }
// const clearInjection = (workbenchHtml: string) =>
//   workbenchHtml.replace(/\n*?<!--material-code-->.*?<!--material-code-->\n*?/s, "\n\n");




export function activate(context: vscode.ExtensionContext) {
  Runtime.activate(context);

  // context.subscriptions.push(
  //   vscode.workspace.onDidChangeConfiguration((event) => {
  //     console.log("AAAAAAAA");
  //     if(
  //       event.affectsConfiguration("materialYou.seedColor") ||
  //       event.affectsConfiguration("materialYou.colorContrast")
  //     ) {
  //       const settings = vscode.workspace.getConfiguration("materialYou");
  //       console.log(settings);
  //       const seedColor = settings.get<string>("seedColor")!;
  //       console.log(seedColor);
  //       const seedColorHct = Hct.fromInt(argbFromHex(seedColor));
  //       const scheme = new SchemeTonalSpot(seedColorHct, false, 0);
  //       vscode.window.showInformationMessage(rgbaFromArgb(scheme.primary).toString(16));
  //     }
  //   }),
  //   vscode.commands.registerCommand("material-you.applyStyles", () => {
  //     onCommandApplyStyles(context);
  //   }),
  //   vscode.commands.registerCommand("material-you.removeStyles", () => {

  //   }),
  // );

	// console.log("Congratulations, your extension material-you is now active!");

	// const disposable = vscode.commands.registerCommand("material-you.helloWorld", () => {
  //   const settings = vscode.workspace.getConfiguration("materialYou");
  //   console.log(settings);
  //   const seedColor = settings.get<string>("seedColor")!;
  //   console.log(seedColor);
  //   const seedColorHct = Hct.fromInt(argbFromHex(seedColor));
  //   const scheme = new SchemeTonalSpot(seedColorHct, false, 0);
	// 	vscode.window.showInformationMessage(rgbaFromArgb(scheme.primary).toString(16));
	// });

	// context.subscriptions.push(disposable);
}

export function deactivate() {}
