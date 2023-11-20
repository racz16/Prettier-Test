import { CancellationToken, Location, Position, ReferenceContext, ReferenceProvider, TextDocument, Uri } from 'vscode';
import { VariableDeclaration } from '../document-info';
import { analyze, documents } from '../extension';

export class AsdReferenceProvider implements ReferenceProvider {
    public async provideReferences(
        document: TextDocument,
        position: Position,
        context: ReferenceContext,
        token: CancellationToken
    ): Promise<Location[]> {
        await analyze(document);
        const di = documents.get(document.uri.fsPath);
        const result: Location[] = [];
        const usage = di.getUsage(position);
        if (usage?.declaration) {
            this.addLocations(context, document.uri, result, usage.declaration);
        }
        if (!result.length) {
            const declaration = di.getDeclaration(position);
            if (declaration) {
                this.addLocations(context, document.uri, result, declaration);
            }
        }
        return result;
    }

    private addLocations(
        context: ReferenceContext,
        uri: Uri,
        result: Location[],
        declaration: VariableDeclaration
    ): void {
        if (context.includeDeclaration) {
            result.push(new Location(uri, declaration.originalRange));
        }
        for (const usage of declaration.usages) {
            result.push(new Location(uri, usage.originalRange));
        }
    }
}
