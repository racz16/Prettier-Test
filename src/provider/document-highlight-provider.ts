import {
    CancellationToken,
    DocumentHighlight,
    DocumentHighlightKind,
    DocumentHighlightProvider,
    Position,
    TextDocument,
} from 'vscode';
import { VariableDeclaration } from '../document-info';
import { analyze, documents } from '../extension';

export class AsdDocumentHighlightProvider implements DocumentHighlightProvider {
    public async provideDocumentHighlights(
        document: TextDocument,
        position: Position,
        token: CancellationToken
    ): Promise<DocumentHighlight[]> {
        await analyze(document);
        const di = documents.get(document.uri.fsPath);
        const result: DocumentHighlight[] = [];
        const usage = di.getUsage(position);
        if (usage?.declaration) {
            this.addHighlight(result, usage.declaration);
        }
        if (!result.length) {
            const declaration = di.getDeclaration(position);
            if (declaration) {
                this.addHighlight(result, declaration);
            }
        }
        return result;
    }

    private addHighlight(result: DocumentHighlight[], declaration: VariableDeclaration): void {
        result.push(new DocumentHighlight(declaration.originalRange, DocumentHighlightKind.Read));
        for (const usage of declaration.usages) {
            result.push(new DocumentHighlight(usage.originalRange, DocumentHighlightKind.Write));
        }
    }
}
