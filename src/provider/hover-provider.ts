import { CancellationToken, Hover, HoverProvider, MarkdownString, Position, TextDocument } from 'vscode';
import { analyze, documents } from '../extension';

export class AsdHoverProvider implements HoverProvider {
    public async provideHover(document: TextDocument, position: Position, token: CancellationToken): Promise<Hover> {
        await analyze(document);
        const di = documents.get(document.uri.fsPath);
        const usage = di.getUsage(position);
        if (usage?.declaration) {
            const md = new MarkdownString();
            md.appendCodeblock(`${usage.declaration.type} ${usage.declaration.name};`, 'asd');
            return new Hover(md, usage.originalRange);
        }
        return null;
    }
}
