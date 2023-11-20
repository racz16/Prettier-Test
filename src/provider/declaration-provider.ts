import { CancellationToken, Declaration, DeclarationProvider, Location, Position, TextDocument } from 'vscode';
import { analyze, documents } from '../extension';

export class AsdDeclarationProvider implements DeclarationProvider {
    public async provideDeclaration(
        document: TextDocument,
        position: Position,
        token: CancellationToken
    ): Promise<Declaration> {
        await analyze(document);
        const di = documents.get(document.uri.fsPath);
        const usage = di.getUsage(position);
        if (usage?.declaration) {
            return new Location(document.uri, usage.declaration.originalRange);
        }
        return null;
    }
}
