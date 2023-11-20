import { CancellationToken, Position, Range, RenameProvider, TextDocument, Uri, WorkspaceEdit } from 'vscode';
import { VariableDeclaration } from '../document-info';
import { analyze, documents } from '../extension';

export class AsdRenameProvider implements RenameProvider {
    public async prepareRename?(
        document: TextDocument,
        position: Position,
        token: CancellationToken
    ): Promise<Range | { range: Range; placeholder: string }> {
        await analyze(document);
        const di = documents.get(document.uri.fsPath);
        const result = new WorkspaceEdit();
        const usage = di.getUsage(position);
        if (usage?.declaration) {
            return usage.originalRange;
        }
        if (!result.size) {
            const declaration = di.getDeclaration(position);
            if (declaration) {
                return declaration.originalRange;
            }
        }
        throw new Error(`Can't rename this token`);
    }

    public async provideRenameEdits(
        document: TextDocument,
        position: Position,
        newName: string,
        token: CancellationToken
    ): Promise<WorkspaceEdit> {
        await analyze(document);
        const di = documents.get(document.uri.fsPath);
        const result = new WorkspaceEdit();
        const usage = di.getUsage(position);
        if (usage?.declaration) {
            this.addLocations(newName, document.uri, result, usage.declaration);
        }
        if (!result.size) {
            const declaration = di.getDeclaration(position);
            if (declaration) {
                this.addLocations(newName, document.uri, result, declaration);
            }
        }
        return result;
    }

    private addLocations(newName: string, uri: Uri, result: WorkspaceEdit, declaration: VariableDeclaration): void {
        result.replace(uri, declaration.originalRange, newName);
        for (const usage of declaration.usages) {
            result.replace(uri, usage.originalRange, newName);
        }
    }
}
