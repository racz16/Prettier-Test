import { CancellationToken, EventEmitter, TextDocumentContentProvider, Uri } from 'vscode';
import { getDocument } from '../extension';

export class AsdTextDocumentContentProvider implements TextDocumentContentProvider {
    public static onDidChangeEmitter = new EventEmitter<Uri>();
    public onDidChange = AsdTextDocumentContentProvider.onDidChangeEmitter.event;

    public async provideTextDocumentContent(uri: Uri, token: CancellationToken): Promise<string> {
        return await getDocument(uri).preprocessedText;
    }
}
