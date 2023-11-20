import { CancellationToken, DocumentLink, DocumentLinkProvider, TextDocument, Uri } from 'vscode';
import { analyze, documents } from '../extension';

export class AsdDocumentLinkProvider implements DocumentLinkProvider {
    public async provideDocumentLinks(document: TextDocument, token: CancellationToken): Promise<DocumentLink[]> {
        await analyze(document);
        const di = documents.get(document.uri.fsPath);
        const result: DocumentLink[] = [];
        for (const include of di.includes) {
            const uri = Uri.joinPath(document.uri, '..', include.name);
            result.push(new DocumentLink(include.originalRange, uri));
        }
        return result;
    }
}
