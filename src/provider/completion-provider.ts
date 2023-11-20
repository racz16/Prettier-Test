import {
    CancellationToken,
    CompletionContext,
    CompletionItem,
    CompletionItemKind,
    CompletionItemProvider,
    CompletionList,
    Position,
    TextDocument,
} from 'vscode';
import { analyze, documents } from '../extension';

export class AsdCompletionItemProvider implements CompletionItemProvider {
    public async provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext
    ): Promise<CompletionItem[] | CompletionList<CompletionItem>> {
        await analyze(document);
        const di = documents.get(document.uri.fsPath);
        const result: CompletionItem[] = [];
        for (const declaration of di.declarations) {
            if (position.isAfter(declaration.originalRange.end)) {
                result.push(new CompletionItem(declaration.name, CompletionItemKind.Variable));
            }
        }
        result.push(new CompletionItem('float', CompletionItemKind.Struct));
        result.push(new CompletionItem('int', CompletionItemKind.Struct));
        result.push(new CompletionItem('bool', CompletionItemKind.Struct));
        result.push(new CompletionItem('#include', CompletionItemKind.Keyword));
        return result;
    }
}
