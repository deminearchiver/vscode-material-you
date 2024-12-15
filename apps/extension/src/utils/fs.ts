import vscode from "vscode";

export const exists = async (uri: vscode.Uri): Promise<boolean> => {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch(error) {
    return false;
  }
}

export const readFileString = async (uri: vscode.Uri) => {
  const value = await vscode.workspace.fs.readFile(uri);
  return new TextDecoder().decode(value);
}

export const writeFileString = async (uri: vscode.Uri, value: string) => {
  const encoded = new TextEncoder().encode(value);
  return vscode.workspace.fs.writeFile(uri, encoded);
}

