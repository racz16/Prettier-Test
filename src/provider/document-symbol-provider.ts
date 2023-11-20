import {
    CancellationToken,
    DocumentSymbol,
    DocumentSymbolProvider,
    Location,
    SymbolInformation,
    SymbolKind,
    TextDocument,
} from 'vscode';
import { analyze, documents } from '../extension';

export class AsdDocumentSymbolProvider implements DocumentSymbolProvider {
    public async provideDocumentSymbols(
        document: TextDocument,
        token: CancellationToken
    ): Promise<SymbolInformation[] | DocumentSymbol[]> {
        await analyze(document);
        const di = documents.get(document.uri.fsPath);
        const result: SymbolInformation[] = [];
        for (const declaration of di.declarations) {
            result.push(
                new SymbolInformation(
                    declaration.name,
                    SymbolKind.Variable,
                    undefined,
                    new Location(document.uri, declaration.originalRange)
                )
            );
        }
        return result;
    }
}
